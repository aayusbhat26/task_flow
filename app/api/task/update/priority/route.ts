import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTaskPrioritySchema } from "@/schema/updateTaskSchema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json("ERRORS.UNAUTHORIZED", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const result = updateTaskPrioritySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json("ERRORS.WRONG_DATA", { status: 400 });
  }

  const { priority, taskId, workspaceId } = result.data;

  try {
    const membership = await db.subscription.findFirst({
      where: { userId: session.user.id, workspaceId },
      select: { userRole: true },
    });

    if (!membership) {
      return NextResponse.json("ERRORS.NO_PERMISSION", { status: 403 });
    }

    if (membership.userRole === "READ_ONLY") {
      return NextResponse.json("ERRORS.NO_PERMISSION", { status: 403 });
    }

    const updatedTask = await db.task.update({
      where: { id: taskId, workspaceId },
      data: { priority, updatedUserId: session.user.id },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch {
    return NextResponse.json("ERRORS.DB_ERROR", { status: 500 });
  }
}
