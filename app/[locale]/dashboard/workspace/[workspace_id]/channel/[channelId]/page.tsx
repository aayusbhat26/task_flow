import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { MediaChannelView } from "@/components/channels/MediaChannelView";
import { TypingTest } from "@/components/gaming/TypingTest";
import { ChatArea } from "@/components/chat/ChatArea";
import { effectivePlan } from "@/lib/billing";

interface Props {
  params: {
    workspace_id: string;
    channelId: string;
  };
}

export default async function ChannelPage({
  params: { workspace_id, channelId },
}: Props) {
  const session = await getAuthSession();
  const locale = await getLocale();

  if (!session) redirect(`/${locale}/sign-in`);

  const channel = await db.channel.findFirst({
    where: { id: channelId, workspaceId: workspace_id },
  });

  if (!channel) redirect(`/${locale}/dashboard/workspace/${workspace_id}`);

  const workspace = await db.workspace.findUnique({
    where: { id: workspace_id },
    include: {
      _count: { select: { subscribers: true } },
      subscribers: {
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
    },
  });

  if (!workspace) redirect(`/${locale}/dashboard`);

  const currentUser = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
    image: session.user.image,
    username: session.user.username || "",
    plan: effectivePlan({
      plan: session.user.plan,
      planExpiresAt: session.user.planExpiresAt,
    }),
  };

  if (channel.type === "TYPING_RACE") {
    return (
      <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
        <TypingTest
          workspaceId={`typing:${channelId}`}
          currentUser={{
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
            image: currentUser.image,
          }}
        />
      </div>
    );
  }

  if (channel.type === "TEXT") {
    return (
      <div className="h-[calc(100dvh-0px)] w-full">
        <ChatArea
          workspace={workspace as any}
          currentUser={currentUser}
          channelId={channel.id}
          channelName={channel.name}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <MediaChannelView
          channel={channel}
          workspace={workspace}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
