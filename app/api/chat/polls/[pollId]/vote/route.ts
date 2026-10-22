import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pollInclude, serializePoll } from "@/lib/chat-rich";
import { resolveChatAccess } from "@/lib/chat-access";

export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const optionId = body?.optionId;
    if (!optionId || typeof optionId !== "string") {
      return NextResponse.json({ error: "Option is required" }, { status: 400 });
    }

    const existingPoll = await db.poll.findUnique({
      where: { id: params.pollId },
      include: {
        message: {
          select: { workspaceId: true, channelId: true, groupId: true },
        },
        options: { select: { id: true } },
      },
    });

    if (!existingPoll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const accessResult = await resolveChatAccess(session.user.id, {
      workspaceId: existingPoll.message.workspaceId,
      groupId: existingPoll.message.groupId,
      channelId: existingPoll.message.channelId,
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }

    if (existingPoll.closedAt || (existingPoll.closesAt && existingPoll.closesAt.getTime() <= Date.now())) {
      return NextResponse.json({ error: "This poll is closed" }, { status: 400 });
    }

    if (!existingPoll.options.some(option => option.id === optionId)) {
      return NextResponse.json({ error: "Invalid poll option" }, { status: 400 });
    }

    const existingVote = await db.pollVote.findUnique({
      where: {
        pollId_optionId_userId: {
          pollId: existingPoll.id,
          optionId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      await db.pollVote.delete({ where: { id: existingVote.id } });
    } else {
      if (!existingPoll.allowMultiple) {
        await db.pollVote.deleteMany({
          where: { pollId: existingPoll.id, userId: session.user.id },
        });
      }
      await db.pollVote.create({
        data: {
          pollId: existingPoll.id,
          optionId,
          userId: session.user.id,
        },
      });
    }

    const poll = await db.poll.findUnique({
      where: { id: existingPoll.id },
      include: pollInclude(session.user.id),
    });

    return NextResponse.json({
      messageId: existingPoll.messageId,
      poll: serializePoll(poll),
    });
  } catch (error) {
    console.error("Error voting in poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
