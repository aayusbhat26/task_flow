import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";

const addMembersSchema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one user"),
});

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userIds } = addMembersSchema.parse(body);

    // Check if group exists and user is a member
    const group = await db.group.findUnique({
      where: {
        id: params.groupId,
      },
      include: {
        members: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    const isMember = group.members.some(
      (member) => member.id === session.user.id
    );

    if (!isMember) {
      return new NextResponse(
        "You must be a member of the group to add others",
        {
          status: 403,
        }
      );
    }

    // Verify all users to be added are part of the workspace
    const workspaceMembers = await db.subscription.findMany({
      where: {
        workspaceId: group.workspaceId,
        userId: {
          in: userIds,
        },
      },
      select: {
        userId: true,
      },
    });

    const validUserIds = workspaceMembers.map((m) => m.userId);

    if (validUserIds.length === 0) {
      return new NextResponse(
        "None of the selected users are in this workspace",
        {
          status: 400,
        }
      );
    }

    // Add members
    await db.group.update({
      where: {
        id: params.groupId,
      },
      data: {
        members: {
          connect: validUserIds.map((id) => ({ id })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      addedCount: validUserIds.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 422 });
    }
    console.error("Error adding group members:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
