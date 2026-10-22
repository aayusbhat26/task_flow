import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveChatAccess } from "@/lib/chat-access";

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await db.dsaRoomSession.findUnique({
      where: { id: params.sessionId },
      select: {
        id: true,
        workspaceId: true,
        channelId: true,
        status: true,
        endsAt: true,
        durationMinutes: true,
      },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const accessResult = await resolveChatAccess(session.user.id, {
      workspaceId: room.workspaceId,
      channelId: room.channelId,
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }

    if (room.status !== "ACTIVE" || room.endsAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "This room has ended" }, { status: 400 });
    }

    const existing = await db.dsaRoomParticipant.findUnique({
      where: {
        sessionId_userId: { sessionId: room.id, userId: session.user.id },
      },
      select: { joinedAt: true },
    });

    const joinedAt = existing?.joinedAt ?? new Date();
    const elapsedMinutes = Math.min(
      room.durationMinutes,
      Math.max(0, Math.floor((Date.now() - joinedAt.getTime()) / 60000))
    );

    const participant = await db.dsaRoomParticipant.upsert({
      where: {
        sessionId_userId: { sessionId: room.id, userId: session.user.id },
      },
      create: {
        sessionId: room.id,
        userId: session.user.id,
        completedAt: new Date(),
        timeSpent: elapsedMinutes,
      },
      update: {
        completedAt: new Date(),
        timeSpent: elapsedMinutes,
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Error solving DSA room problem:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
