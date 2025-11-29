import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const groupId = searchParams.get("groupId");

    if (groupId) {
      const group = await db.group.findUnique({
        where: {
          id: groupId,
        },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!group) {
        return new NextResponse("Group not found", { status: 404 });
      }

      // Check if user is a member
      const isMember = group.members.some(
        (member) => member.id === session.user.id
      );
      if (!isMember) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      return NextResponse.json(group);
    }

    if (!workspaceId) {
      return new NextResponse("Workspace ID is required", { status: 400 });
    }

    const groups = await db.group.findMany({
      where: {
        workspaceId,
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
