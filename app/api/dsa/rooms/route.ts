import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveChatAccess, canWrite } from "@/lib/chat-access";
import { trackedMinutes } from "@/lib/dsa-time";

const sessionInclude = {
  question: {
    select: {
      id: true,
      title: true,
      description: true,
      topic: true,
      difficulty: true,
      leetcodeUrl: true,
      platform: true,
      tags: true,
      hints: true,
      timeComplexity: true,
      spaceComplexity: true,
    },
  },
  host: { select: { id: true, name: true, username: true, image: true } },
  participants: {
    orderBy: { joinedAt: "asc" as const },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  },
} as const;

async function expireStaleSessions(channelId: string) {
  await db.dsaRoomSession.updateMany({
    where: {
      channelId,
      status: "ACTIVE",
      endsAt: { lte: new Date() },
    },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const workspaceId = searchParams.get("workspaceId");

    const accessResult = await resolveChatAccess(session.user.id, {
      channelId,
      workspaceId,
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }
    if (!accessResult.access.channelId) {
      return NextResponse.json({ error: "A channel is required" }, { status: 400 });
    }

    await expireStaleSessions(accessResult.access.channelId);

    const now = new Date();
    const [active, historyRows] = await Promise.all([
      db.dsaRoomSession.findFirst({
        where: {
          channelId: accessResult.access.channelId,
          status: "ACTIVE",
          endsAt: { gt: now },
        },
        include: sessionInclude,
        orderBy: { startedAt: "desc" },
      }),
      db.dsaRoomSession.findMany({
        where: {
          channelId: accessResult.access.channelId,
          OR: [{ status: "ENDED" }, { endsAt: { lte: now } }],
        },
        include: {
          question: { select: { id: true, title: true, difficulty: true, topic: true } },
          host: { select: { id: true, name: true, username: true } },
          participants: {
            select: { joinedAt: true, completedAt: true, timeSpent: true },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ]);

    const history = historyRows.map(room => {
      const runEnd = room.endedAt ?? room.endsAt;
      const runMinutes = trackedMinutes(room.startedAt, runEnd);
      const participantCount = room.participants.length;
      const solvedCount = room.participants.filter(participant => participant.completedAt).length;
      const activeMinutes = room.participants.reduce((sum, participant) => {
        const end = participant.completedAt ?? runEnd;
        return sum + Math.min(room.durationMinutes, trackedMinutes(participant.joinedAt, end));
      }, 0);

      return {
        ...room,
        participantCount,
        solvedCount,
        runMinutes,
        activeMinutes,
      };
    });

    return NextResponse.json({ active, history });
  } catch (error) {
    console.error("Error loading DSA room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { channelId, workspaceId, questionId, durationMinutes } = body;

    const accessResult = await resolveChatAccess(session.user.id, {
      channelId,
      workspaceId,
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }
    if (!accessResult.access.channelId) {
      return NextResponse.json({ error: "A channel is required" }, { status: 400 });
    }
    if (!canWrite(accessResult.access)) {
      return NextResponse.json({ error: "You cannot start a room" }, { status: 403 });
    }

    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration < 5 || duration > 180) {
      return NextResponse.json({ error: "Duration must be between 5 and 180 minutes" }, { status: 400 });
    }

    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json({ error: "Choose a DSA question" }, { status: 400 });
    }

    const question = await db.dSAQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await expireStaleSessions(accessResult.access.channelId);

    const existing = await db.dsaRoomSession.findFirst({
      where: {
        channelId: accessResult.access.channelId,
        status: "ACTIVE",
        endsAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "A DSA room is already active in this channel" }, { status: 409 });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + duration * 60 * 1000);

    const room = await db.dsaRoomSession.create({
      data: {
        workspaceId: accessResult.access.workspaceId,
        channelId: accessResult.access.channelId,
        questionId,
        hostId: session.user.id,
        durationMinutes: duration,
        startedAt: now,
        endsAt,
        participants: {
          create: { userId: session.user.id, joinedAt: now },
        },
      },
      include: sessionInclude,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Error starting DSA room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
