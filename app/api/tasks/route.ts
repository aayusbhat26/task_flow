import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const search = searchParams.get('search');
    const filter = searchParams.get('filter'); // 'all', 'completed', 'pending'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: any = {
      OR: [
        { creatorId: session.user.id },
        {
          assignedToTask: {
            some: {
              userId: session.user.id
            }
          }
        },
        {
          workspace: {
            subscribers: {
              some: {
                userId: session.user.id
              }
            }
          }
        }
      ]
    };

    // Add workspace filter if provided
    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }

    // Add search filter if provided
    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              creator: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          ]
        }
      ];
    }

    const baseWhere = whereClause;
    const queryWhere: any = { ...baseWhere };
    if (filter === 'completed') queryWhere.isCompleted = true;
    if (filter === 'pending') queryWhere.isCompleted = false;

    const [tasks, baseTotal, baseCompleted, queryTotal] = await Promise.all([
      db.task.findMany({
        where: queryWhere,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          assignedToTask: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          workspace: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          taskDate: {
            select: {
              id: true,
              from: true,
              to: true
            }
          }
        },
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      db.task.count({ where: baseWhere }),
      db.task.count({ where: { ...baseWhere, isCompleted: true } }),
      db.task.count({ where: queryWhere }),
    ]);

    // Process tasks and add completion status
    const processedTasks = tasks.map(task => {
      const content = task.content as any || {};
      // Use the actual isCompleted field from the database, not from content
      const isCompleted = Boolean(task.isCompleted);
      const completedAt = task.completedAt || content.completedAt;
      const completedBy = content.completedBy;

      return {
        ...task,
        priority: task.priority,
        isCompleted,
        completedAt,
        completedBy,
        // Add mock tags for now since they're not in the schema
        tags: []
      };
    });

    return NextResponse.json({
      success: true,
      tasks: processedTasks,
      pagination: {
        total: queryTotal,
        limit,
        offset,
        hasMore: offset + limit < queryTotal
      },
      stats: {
        total: baseTotal,
        completed: baseCompleted,
        pending: baseTotal - baseCompleted
      }
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new task
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, content, workspaceId, emoji, assignedUserIds, dueDate } = await req.json();

    if (!title || !workspaceId) {
      return NextResponse.json(
        { error: 'Title and workspace ID are required' },
        { status: 400 }
      );
    }

    // Verify user has access to the workspace
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        subscribers: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Create the task
    let taskDateId = null;
    if (dueDate) {
      const createdDate = await db.taskDate.create({
        data: {
          from: new Date(dueDate).toISOString(),
          to: null
        }
      });
      taskDateId = createdDate.id;
    }

    const newTask = await db.task.create({
      data: {
        title,
        emoji: emoji || '📝',
        content: content || {},
        workspaceId,
        creatorId: session.user.id,
        dateId: taskDateId,
        assignedToTask: assignedUserIds?.length ? {
          create: assignedUserIds.map((userId: string) => ({
            userId
          }))
        } : undefined
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        assignedToTask: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        taskDate: {
          select: {
            id: true,
            from: true,
            to: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      task: {
        ...newTask,
        isCompleted: false,
        completedAt: null,
        completedBy: null,
        tags: []
      },
      message: 'Task created successfully'
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
