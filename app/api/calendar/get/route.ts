import { db } from "@/lib/db";
import { CalendarItem } from "@/types/extended";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!userId) return NextResponse.json("ERRORS.WRONG_DATA", { status: 404 });

  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate >= toDate
    ) {
      return NextResponse.json("ERRORS.WRONG_DATA", { status: 400 });
    }
  }

  try {
    const userSubscriptions = await db.subscription.findMany({
      where: { userId },
      select: {
        workspace: {
          select: {
            id: true,
            name: true,
            color: true,
            tasks: {
              where:
                from && to
                  ? {
                      taskDate: {
                        is: {
                          from: {
                            gte: from,
                            lt: to,
                          },
                        },
                      },
                    }
                  : undefined,
              select: {
                id: true,
                title: true,
                taskDate: {
                  select: {
                    id: true,
                    from: true,
                    to: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const allTasks: CalendarItem[] = userSubscriptions.flatMap(
      ({ workspace }) =>
        workspace.tasks.map((task) => ({
          title: task.title,
          taskDate: task.taskDate?.from
            ? {
                id: task.taskDate.id,
                from: new Date(task.taskDate.from),
                to: task.taskDate.to ? new Date(task.taskDate.to) : undefined,
              }
            : null,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          workspaceColor: workspace.color,
          taskId: task.id,
        }))
    );

    const response = NextResponse.json(allTasks, { status: 200 });
    response.headers.set("Cache-Control", "private, max-age=30");
    return response;
  } catch (error) {
    console.error("[CALENDAR_GET]", error);
    return NextResponse.json("ERRORS.DB_ERROR", { status: 405 });
  }
};
