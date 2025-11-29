import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Enhanced note schemas
const createNoteSchema = z.object({
  title: z.string().min(1),
  icon: z.string().optional(),
  coverImage: z.string().optional(),
  workspaceId: z.string().optional(),
  groupId: z.string().optional(),
  parentId: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  // Legacy block-based format
  blocks: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum([
          "TEXT",
          "HEADING_1",
          "HEADING_2",
          "HEADING_3",
          "BULLET_LIST",
          "NUMBERED_LIST",
          "TODO",
          "QUOTE",
          "CODE",
          "DIVIDER",
          "CALLOUT",
          "IMAGE",
        ]),
        content: z.string(),
        properties: z.record(z.any()).optional(),
        position: z.number(),
      })
    )
    .optional(),
  // New markdown content format
  content: z.string().optional(),
  templateId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const groupId = searchParams.get("groupId");
    const isArchived = searchParams.get("archived") === "true";
    const isFavorite = searchParams.get("favorite") === "true";
    const search = searchParams.get("search");

    let where: any = {
      parentId: null, // Only root-level notes
    };

    if (groupId) {
      where.groupId = groupId;
      // Ensure user is a member of the group
      where.group = {
        members: {
          some: {
            id: session.user.id,
          },
        },
      };
    } else {
      where.authorId = session.user.id;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    where.isArchived = isArchived;

    if (isFavorite) {
      where.isFavorite = true;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          blocks: {
            some: {
              content: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const notes = await db.note.findMany({
      where,
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
        group: {
          select: {
            id: true,
            name: true,
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
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createNoteSchema.parse(body);

    // Create note with transaction to handle tags and blocks
    const note = await db.$transaction(async (tx) => {
      // Update user's total notes count
      await tx.user.update({
        where: { id: session.user.id },
        data: { totalNotesCreated: { increment: 1 } },
      });

      const newNote = await tx.note.create({
        data: {
          title: data.title || "Untitled",
          icon: data.icon || "📝",
          coverImage: data.coverImage,
          workspaceId: data.workspaceId,
          groupId: data.groupId,
          parentId: data.parentId,
          isPublic: data.isPublic || false,
          authorId: session.user.id,
          position: 0, // Will be updated based on current notes count
          templateId: data.templateId,
          content:
            data.content ||
            "# Welcome to your new note!\n\nStart writing your thoughts in **Markdown**...",
        },
      });

      // Handle tags - using direct relation
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          await tx.noteTag.create({
            data: {
              name: tagName,
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
              noteId: newNote.id,
            },
          });
        }
      }

      // Handle legacy blocks if provided (for backwards compatibility)
      const blocksToCreate = data.blocks;
      if (blocksToCreate && blocksToCreate.length > 0) {
        for (let i = 0; i < blocksToCreate.length; i++) {
          const block = blocksToCreate[i];
          // Combine content and properties into a single JSON structure
          const blockContent = {
            text: block.content || "",
            ...block.properties,
          };

          await tx.noteBlock.create({
            data: {
              id: block.id || `block-${Date.now()}-${i}`,
              noteId: newNote.id,
              type: block.type,
              content: blockContent,
              position: block.position !== undefined ? block.position : i,
              createdById: session.user.id,
            },
          });
        }
      }

      // Create history entry
      await tx.noteHistory.create({
        data: {
          noteId: newNote.id,
          content: data.content || JSON.stringify(data.blocks || []),
          title: data.title || "Untitled",
          version: 1,
          changeBy: session.user.id,
        },
      });

      return newNote;
    });

    // Fetch the created note with all relations
    const fullNote = await db.note.findUnique({
      where: { id: note.id },
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
        group: {
          select: {
            id: true,
            name: true,
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
        tags: true,
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        links: {
          include: {
            targetNote: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        linkedBy: {
          include: {
            sourceNote: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
            history: true,
          },
        },
      },
    });

    // Check for achievements after note creation
    try {
      const { GamingService } = await import("@/services/gamingService");
      await GamingService.checkAchievements(session.user.id);
    } catch (error) {
      console.error("Error checking achievements:", error);
      // Don't fail the note creation if achievement checking fails
    }

    return NextResponse.json(fullNote, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
