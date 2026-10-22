import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pollInclude, serializePoll } from "@/lib/chat-rich";
import { resolveChatAccess } from "@/lib/chat-access";

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

    const {
      question,
      options,
      allowMultiple = false,
      isAnonymous = false,
      closesAt,
      workspaceId,
      groupId,
      channelId,
      replyToId,
    } = body;

    const accessResult = await resolveChatAccess(session.user.id, {
      workspaceId,
      groupId,
      channelId,
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }
    const access = accessResult.access;

    const cleanQuestion = typeof question === "string" ? question.trim() : "";
    if (!cleanQuestion || cleanQuestion.length > 300) {
      return NextResponse.json(
        { error: "Poll question must be between 1 and 300 characters" },
        { status: 400 }
      );
    }

    if (!Array.isArray(options)) {
      return NextResponse.json({ error: "Poll options are required" }, { status: 400 });
    }

    const labels: string[] = [];
    for (const option of options) {
      const label = typeof option === "string" ? option.trim() : "";
      if (label && label.length <= 120 && !labels.includes(label)) {
        labels.push(label);
      }
    }

    if (labels.length < 2 || labels.length > 10) {
      return NextResponse.json({ error: "A poll needs 2 to 10 unique options" }, { status: 400 });
    }

    let closesAtDate: Date | null = null;
    if (closesAt) {
      const parsed = new Date(closesAt);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return NextResponse.json({ error: "Poll close time must be in the future" }, { status: 400 });
      }
      closesAtDate = parsed;
    }

    if (replyToId) {
      const parent = await db.chatMessage.findUnique({
        where: { id: replyToId },
        select: { workspaceId: true, groupId: true, channelId: true },
      });
      if (!parent || parent.workspaceId !== access.workspaceId) {
        return NextResponse.json({ error: "Invalid thread" }, { status: 400 });
      }
    }

    const message = await db.chatMessage.create({
      data: {
        content: cleanQuestion,
        authorId: session.user.id,
        workspaceId: access.workspaceId,
        channelId: access.channelId ?? undefined,
        groupId: access.groupId ?? undefined,
        replyToId: replyToId || undefined,
        type: "POLL",
        poll: {
          create: {
            question: cleanQuestion,
            allowMultiple: Boolean(allowMultiple),
            isAnonymous: Boolean(isAnonymous),
            closesAt: closesAtDate,
            options: {
              create: labels.map((label, index) => ({ label, order: index })),
            },
          },
        },
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
        poll: {
          include: pollInclude(session.user.id),
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(
      {
        ...message,
        poll: serializePoll(message.poll),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
