import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { ChatArea } from '@/components/chat/ChatArea';
import { NotesApp } from '@/components/notes/NotesApp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, FileText } from 'lucide-react';
import { GroupMembersSettings } from '@/components/groups/GroupMembersSettings';

interface PageProps {
  params: {
    workspace_id: string;
    groupId: string;
    locale: string;
  };
}

export default async function GroupPage({ params }: PageProps) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const group = await db.group.findUnique({
    where: {
      id: params.groupId,
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
    return <div>Group not found</div>;
  }

  // Check if user is a member
  const isMember = group.members.some((member) => member.id === session.user.id);
  if (!isMember) {
    return <div>You are not a member of this group</div>;
  }

  // Fetch all workspace members to allow adding them to the group
  const workspaceSubscribers = await db.subscription.findMany({
    where: {
      workspaceId: group.workspaceId,
    },
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
  });

  // Filter out users who are already in the group
  const potentialMembers = workspaceSubscribers
    .map((sub) => sub.user)
    .filter((user) => !group.members.some((member) => member.id === user.id));

  // Fetch notes for this group
  const notes = await db.note.findMany({
    where: {
      groupId: params.groupId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        }
      },
      workspace: {
        select: {
          id: true,
          name: true,
          color: true,
        }
      },
      blocks: {
        orderBy: {
          position: 'asc'
        }
      },
      children: {
        select: {
          id: true,
          title: true,
          icon: true,
          position: true,
        },
        orderBy: {
          position: 'asc'
        }
      },
      _count: {
        select: {
          blocks: true,
          children: true,
        }
      }
    },
    orderBy: [
      { isFavorite: 'desc' },
      { updatedAt: 'desc' }
    ]
  });

  // Fetch workspaces for NotesApp context (it expects a list)
  const workspaces = await db.workspace.findMany({
    where: {
      subscribers: {
        some: {
          userId: session.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
      color: true,
    },
  });

  // Map Group to Workspace interface for ChatArea
  const groupAsWorkspace = {
    id: group.id,
    name: group.name,
    image: null,
    color: 'BLUE',
    _count: {
      subscribers: group._count.members
    },
    subscribers: group.members.map(m => ({
      user: m
    }))
  };

  const currentUser = {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image,
    username: session.user.username || '',
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <Users className="w-4 h-4 mr-1" />
            {group._count.members} members
          </p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 border-b border-gray-200 bg-gray-50">
          <TabsList className="bg-transparent p-0 h-12 space-x-6">
            <TabsTrigger
              value="chat"
              className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-medium"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-medium"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-medium"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
          <ChatArea
            workspace={groupAsWorkspace}
            currentUser={currentUser}
            groupId={group.id}
          />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
          <NotesApp
            notes={notes}
            workspaces={workspaces}
            currentUser={currentUser}
            groupId={group.id}
          />
        </TabsContent>

        <TabsContent value="members" className="flex-1 m-0 overflow-hidden p-6 data-[state=inactive]:hidden">
          <GroupMembersSettings
            groupId={group.id}
            currentMembers={group.members}
            potentialMembers={potentialMembers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
