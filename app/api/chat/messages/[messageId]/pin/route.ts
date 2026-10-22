import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveChatAccess } from "@/lib/chat-access";

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = await db.chatMessage.findUnique({
      where: { id: params.messageId },
      select: {
        id: true,
        isPinned: true,
        isDeleted: true,
        workspaceId: true,
        groupId: true,
        channelId: true,
      },
    });

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const accessResult = await resolveChatAccess(session.user.id, {
      workspaceId: message.workspaceId,
      groupId: message.groupId,
      channelId: message.channelId,
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }

    const isPinned = !message.isPinned;
    await db.chatMessage.update({
      where: { id: message.id },
      data: {
        isPinned,
        pinnedAt: isPinned ? new Date() : null,
      },
    });

    return NextResponse.json({
      messageId: message.id,
      isPinned,
      pinnedAt: isPinned ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("Error pinning message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
