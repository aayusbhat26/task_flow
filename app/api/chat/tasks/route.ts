import { NextRequest, NextResponse } from "next/server";
import { NotifyType } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveChatAccess, canWrite } from "@/lib/chat-access";
import { serializeTask, taskMessageSelect } from "@/lib/chat-rich";

function toDueRange(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(parsed.getTime())) return null;

  const start = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { from: start.toISOString(), to: end.toISOString() };
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

    const {
      title,
      workspaceId,
      groupId,
      channelId,
      priority = "MEDIUM",
      dueDate,
      assigneeId,
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
    if (!canWrite(access)) {
      return NextResponse.json({ error: "You do not have permission to create tasks" }, { status: 403 });
    }

    const cleanTitle = typeof title === "string" ? title.trim() : "";
    if (!cleanTitle || cleanTitle.length > 200) {
      return NextResponse.json(
        { error: "Task title must be between 1 and 200 characters" },
        { status: 400 }
      );
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const taskPriority = validPriorities.includes(priority) ? priority : "MEDIUM";
    const dueRange = toDueRange(dueDate);

    if (dueDate && !dueRange) {
      return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    }

    if (assigneeId) {
      const membership = await db.subscription.findUnique({
        where: {
          userId_workspaceId: { userId: assigneeId, workspaceId: access.workspaceId },
        },
        select: { userId: true },
      });
      if (!membership) {
        return NextResponse.json({ error: "Assignee is not in this workspace" }, { status: 400 });
      }
    }

    if (replyToId) {
      const parent = await db.chatMessage.findUnique({
        where: { id: replyToId },
        select: { workspaceId: true },
      });
      if (!parent || parent.workspaceId !== access.workspaceId) {
        return NextResponse.json({ error: "Invalid thread" }, { status: 400 });
      }
    }

    const message = await db.$transaction(async (tx) => {
      const taskDate = dueRange
        ? await tx.taskDate.create({
            data: {
              from: dueRange.from,
              to: dueRange.to,
              allDay: true,
            },
          })
        : null;

      const task = await tx.task.create({
        data: {
          title: cleanTitle,
          creatorId: session.user.id,
          updatedUserId: session.user.id,
          workspaceId: access.workspaceId,
          dateId: taskDate?.id,
          priority: taskPriority as any,
          emoji: "1f4ac",
        },
        select: { id: true },
      });

      if (assigneeId) {
        await tx.assignedToTask.create({
          data: { taskId: task.id, userId: assigneeId },
        });
      }

      const createdMessage = await tx.chatMessage.create({
        data: {
          content: cleanTitle,
          authorId: session.user.id,
          workspaceId: access.workspaceId,
          channelId: access.channelId ?? undefined,
          groupId: access.groupId ?? undefined,
          replyToId: replyToId || undefined,
          type: "TASK",
          taskId: task.id,
        },
        include: {
          author: {
            select: { id: true, name: true, username: true, image: true },
          },
          task: {
            select: taskMessageSelect,
          },
        },
      });

      const workspaceUsers = await tx.subscription.findMany({
        where: { workspaceId: access.workspaceId },
        select: { userId: true },
      });

      const notifications = workspaceUsers
        .filter(user => user.userId !== session.user.id)
        .map(user => ({
          notifyCreatorId: session.user.id,
          userId: user.userId,
          workspaceId: access.workspaceId,
          notifyType: NotifyType.NEW_TASK,
          taskId: task.id,
        }));

      if (notifications.length > 0) {
        await tx.notification.createMany({ data: notifications });
      }

      return createdMessage;
    });

    return NextResponse.json(
      {
        ...message,
        task: serializeTask(message.task),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task from chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
