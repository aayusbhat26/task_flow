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

    const participant = await db.dsaRoomParticipant.upsert({
      where: {
        sessionId_userId: { sessionId: room.id, userId: session.user.id },
      },
      create: {
        sessionId: room.id,
        userId: session.user.id,
      },
      update: {
        leftAt: null,
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Error joining DSA room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
