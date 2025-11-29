import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, workspaceId } = createGroupSchema.parse(body);

    // Check if user is a member of the workspace
    const subscription = await db.subscription.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    if (!subscription) {
      return new NextResponse("You are not a member of this workspace", {
        status: 403,
      });
    }

    const group = await db.group.create({
      data: {
        name,
        workspaceId,
        members: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 422 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
