import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";

const inviteUserSchema = z.object({
  groupId: z.string().min(1),
  userIds: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { groupId, userIds } = inviteUserSchema.parse(body);

    // Check if the current user is a member of the group
    const isMember = await db.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!isMember) {
      return new NextResponse("You are not a member of this group", {
        status: 403,
      });
    }

    // Add users to the group
    // Ensure users are part of the workspace first?
    // For now, assuming UI filters users by workspace membership.

    const group = await db.group.update({
      where: {
        id: groupId,
      },
      data: {
        members: {
          connect: userIds.map((id) => ({ id })),
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
