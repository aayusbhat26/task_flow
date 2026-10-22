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
        hostId: true,
        status: true,
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

    const canEnd =
      room.hostId === session.user.id ||
      accessResult.access.role === "OWNER" ||
      accessResult.access.role === "ADMIN";
    if (!canEnd) {
      return NextResponse.json({ error: "Only the host can end this room" }, { status: 403 });
    }

    if (room.status === "ACTIVE") {
      await db.dsaRoomSession.update({
        where: { id: room.id },
        data: { status: "ENDED", endedAt: new Date() },
      });
    }

    return NextResponse.json({ ended: true, sessionId: room.id });
  } catch (error) {
    console.error("Error ending DSA room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
