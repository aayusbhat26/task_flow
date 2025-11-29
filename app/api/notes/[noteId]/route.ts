import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await db.note.findFirst({
      where: {
        id: params.noteId,
        OR: [
          { authorId: session.user.id },
          { group: { members: { some: { id: session.user.id } } } },
          { isPublic: true },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        blocks: {
          orderBy: {
            position: "asc",
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            icon: true,
            position: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      icon,
      coverImage,
      isPublic,
      isFavorite,
      isArchived,
      blocks,
      content,
    } = body;

    const note = await db.note.findFirst({
      where: {
        id: params.noteId,
        OR: [
          { authorId: session.user.id },
          { group: { members: { some: { id: session.user.id } } } },
        ],
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const updatedNote = await db.$transaction(async (tx) => {
      // Update note properties
      const updated = await tx.note.update({
        where: {
          id: params.noteId,
        },
        data: {
          ...(title !== undefined && { title }),
          ...(icon !== undefined && { icon }),
          ...(coverImage !== undefined && { coverImage }),
          ...(isPublic !== undefined && { isPublic }),
          ...(isFavorite !== undefined && { isFavorite }),
          ...(isArchived !== undefined && { isArchived }),
          ...(content !== undefined && { content }),
        },
      });

      // Update blocks if provided
      if (blocks && Array.isArray(blocks)) {
        // Delete existing blocks
        await tx.noteBlock.deleteMany({
          where: {
            noteId: params.noteId,
          },
        });

        // Create new blocks
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];

          // Handle both old and new data formats
          let blockContent;
          if (typeof block.content === "object" && block.content !== null) {
            // New format: content is already an object with text and properties
            blockContent = block.content;
          } else {
            // Old format: content is a string, properties are separate
            blockContent = {
              text: block.content || "",
              ...block.properties,
            };
          }

          await tx.noteBlock.create({
            data: {
              id: block.id,
              noteId: params.noteId,
              type: block.type,
              content: blockContent,
              position: block.position,
              createdById: session.user.id,
            },
          });
        }

        // Create history entry for content changes
        await tx.noteHistory.create({
          data: {
            noteId: params.noteId,
            content: JSON.stringify(blocks),
            title: title || note.title,
            version:
              (await tx.noteHistory.count({
                where: { noteId: params.noteId },
              })) + 1,
            changeBy: session.user.id,
          },
        });
      } else if (content !== undefined) {
        // New markdown format - create history entry
        await tx.noteHistory.create({
          data: {
            noteId: params.noteId,
            content: content,
            title: title || note.title,
            version:
              (await tx.noteHistory.count({
                where: { noteId: params.noteId },
              })) + 1,
            changeBy: session.user.id,
          },
        });
      }

      return updated;
    });

    // Fetch the updated note with all relations
    const fullNote = await db.note.findUnique({
      where: { id: params.noteId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        blocks: {
          orderBy: {
            position: "asc",
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            icon: true,
            position: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(fullNote);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await db.note.findFirst({
      where: {
        id: params.noteId,
        authorId: session.user.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if the request wants hard delete (query parameter)
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (hardDelete) {
      // Hard delete - permanently remove the note
      await db.$transaction(async (tx) => {
        // Delete all blocks first
        await tx.noteBlock.deleteMany({
          where: { noteId: params.noteId },
        });

        // Delete note history
        await tx.noteHistory.deleteMany({
          where: { noteId: params.noteId },
        });

        // Delete collaborators
        await tx.noteCollaborator.deleteMany({
          where: { noteId: params.noteId },
        });

        // Finally delete the note
        await tx.note.delete({
          where: { id: params.noteId },
        });
      });
    } else {
      // Soft delete - just archive the note
      await db.note.update({
        where: {
          id: params.noteId,
        },
        data: {
          isArchived: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
