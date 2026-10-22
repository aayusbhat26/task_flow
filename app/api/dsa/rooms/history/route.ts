import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveChatAccess } from "@/lib/chat-access";
import { trackedMinutes } from "@/lib/dsa-time";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const channelId = searchParams.get("channelId");
    const scope = searchParams.get("scope") === "workspace" ? "workspace" : "channel";
    const status = searchParams.get("status") || "all";
    const cursor = searchParams.get("cursor");
    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 5), 50) : 20;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }
    if (scope === "channel" && !channelId) {
      return NextResponse.json({ error: "channelId is required for channel history" }, { status: 400 });
    }

    const accessResult = await resolveChatAccess(session.user.id, {
      workspaceId,
      channelId: scope === "channel" ? channelId : null,
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }

    const now = new Date();
    const scopeWhere: any = { workspaceId };
    if (scope === "channel") {
      scopeWhere.channelId = channelId;
    }

    await db.dsaRoomSession.updateMany({
      where: { ...scopeWhere, status: "ACTIVE", endsAt: { lte: now } },
      data: { status: "ENDED", endedAt: now },
    });

    const where: any = { ...scopeWhere };
    if (status === "active") {
      where.status = "ACTIVE";
      where.endsAt = { gt: now };
    } else if (status === "ended") {
      where.OR = [{ status: "ENDED" }, { endsAt: { lte: now } }];
    }

    const [rows, total, sessionCount, scopeParticipants] = await Promise.all([
      db.dsaRoomSession.findMany({
        where,
        include: {
          question: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              topic: true,
              platform: true,
              leetcodeUrl: true,
            },
          },
          host: { select: { id: true, name: true, username: true, image: true } },
          channel: { select: { id: true, name: true } },
          participants: {
            orderBy: { joinedAt: "asc" },
            include: {
              user: { select: { id: true, name: true, username: true, image: true } },
            },
          },
        },
        orderBy: [{ startedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      db.dsaRoomSession.count({ where }),
      db.dsaRoomSession.count({ where: scopeWhere }),
      db.dsaRoomParticipant.findMany({
        where: { session: scopeWhere },
        select: {
          joinedAt: true,
          completedAt: true,
          session: {
            select: {
              durationMinutes: true,
              endedAt: true,
              endsAt: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const rooms = pageRows.map(room => {
      const isActive = room.status === "ACTIVE" && room.endsAt.getTime() > now.getTime();
      const sessionEnd = room.endedAt ?? (isActive ? now : room.endsAt);
      const runMinutes = trackedMinutes(room.startedAt, sessionEnd);
      const participants = room.participants.map(participant => {
        const end = participant.completedAt ?? sessionEnd;
        return {
          ...participant,
          activeMinutes: Math.min(room.durationMinutes, trackedMinutes(participant.joinedAt, end)),
        };
      });
      const activeMinutes = participants.reduce((sum, participant) => sum + participant.activeMinutes, 0);
      const endedEarly = Boolean(
        room.endedAt && room.endedAt.getTime() < room.endsAt.getTime() - 60 * 1000
      );

      return {
        id: room.id,
        startedAt: room.startedAt,
        endsAt: room.endsAt,
        endedAt: room.endedAt,
        durationMinutes: room.durationMinutes,
        runMinutes,
        status: isActive ? "ACTIVE" : "ENDED",
        isActive,
        endedEarly,
        question: room.question,
        host: room.host,
        channel: room.channel,
        participants,
        participantCount: participants.length,
        solvedCount: participants.filter(participant => participant.completedAt).length,
        activeMinutes,
      };
    });

    let statsActiveMinutes = 0;
    for (const participant of scopeParticipants) {
      const session = participant.session;
      const sessionEnd =
        session.endedAt ??
        (session.status === "ACTIVE" && session.endsAt.getTime() > now.getTime()
          ? now
          : session.endsAt);
      const end = participant.completedAt ?? sessionEnd;
      statsActiveMinutes += Math.min(
        session.durationMinutes,
        trackedMinutes(participant.joinedAt, end)
      );
    }

    return NextResponse.json({
      rooms,
      nextCursor: hasMore ? pageRows[pageRows.length - 1].id : null,
      total,
      scope,
      status,
      stats: {
        sessions: sessionCount,
        solves: scopeParticipants.filter(participant => participant.completedAt).length,
        activeMinutes: statsActiveMinutes,
        participants: scopeParticipants.length,
      },
    });
  } catch (error) {
    console.error("Error loading DSA room history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
