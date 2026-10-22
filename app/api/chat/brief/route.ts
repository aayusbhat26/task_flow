import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveChatAccess, chatScopeWhere } from "@/lib/chat-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accessResult = await resolveChatAccess(session.user.id, {
      workspaceId: searchParams.get("workspaceId"),
      groupId: searchParams.get("groupId"),
      channelId: searchParams.get("channelId"),
    });
    if (!accessResult.ok) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }

    const access = accessResult.access;
    const messagesWhere = chatScopeWhere(access);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const taskSelection = {
      id: true,
      title: true,
      status: true,
      priority: true,
      isCompleted: true,
      taskDate: { select: { from: true, to: true } },
      assignedToTask: {
        select: {
          user: { select: { id: true, name: true, username: true, image: true } },
        },
      },
    } as const;

    const [
      decisions,
      pinnedTotal,
      files,
      threads,
      tasks,
      activeTasks,
      deadlines,
      dueSoon,
      messages7d,
      contributors,
      dsaRoom,
    ] = await Promise.all([
      db.chatMessage.findMany({
        where: { ...messagesWhere, isPinned: true, isDeleted: false },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { pinnedAt: "desc" },
        take: 8,
      }),
      db.chatMessage.count({ where: { ...messagesWhere, isPinned: true, isDeleted: false } }),
      db.fileAttachment.findMany({
        where: { chatMessage: messagesWhere },
        include: {
          uploadedBy: { select: { id: true, name: true, username: true } },
          chatMessage: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.chatMessage.findMany({
        where: { ...messagesWhere, replyToId: null, replies: { some: {} } },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { replies: true } },
          replies: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              createdAt: true,
              author: { select: { name: true, username: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.task.findMany({
        where: { workspaceId: access.workspaceId, isCompleted: false },
        select: taskSelection,
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      db.task.count({ where: { workspaceId: access.workspaceId, isCompleted: false } }),
      db.task.findMany({
        where: {
          workspaceId: access.workspaceId,
          isCompleted: false,
          taskDate: {
            from: { gte: now.toISOString(), lte: nextWeek.toISOString() },
          },
        },
        select: taskSelection,
        orderBy: { taskDate: { from: "asc" } },
        take: 6,
      }),
      db.task.count({
        where: {
          workspaceId: access.workspaceId,
          isCompleted: false,
          taskDate: {
            from: { gte: now.toISOString(), lte: nextWeek.toISOString() },
          },
        },
      }),
      db.chatMessage.count({
        where: { ...messagesWhere, createdAt: { gte: sevenDaysAgo } },
      }),
      db.chatMessage.groupBy({
        by: ["authorId"],
        where: { ...messagesWhere, createdAt: { gte: sevenDaysAgo } },
      }),
      access.channelId
        ? db.dsaRoomSession.findFirst({
            where: {
              channelId: access.channelId,
              status: "ACTIVE",
              endsAt: { gt: now },
            },
            include: {
              question: {
                select: { id: true, title: true, topic: true, difficulty: true },
              },
              host: { select: { id: true, name: true, username: true, image: true } },
              _count: { select: { participants: true } },
            },
            orderBy: { startedAt: "desc" },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      decisions,
      files,
      threads,
      tasks,
      deadlines,
      stats: {
        activeTasks,
        dueSoon,
        messages7d,
        contributors7d: contributors.length,
        pinnedTotal,
      },
      dsaRoom,
    });
  } catch (error) {
    console.error("Error loading channel brief:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
