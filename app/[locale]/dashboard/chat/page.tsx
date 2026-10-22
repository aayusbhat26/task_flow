import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Hash, Users } from "lucide-react";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { getAuthSession } from "@/lib/auth";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { db } from "@/lib/db";

export default async function ChatPage() {
  const session = await getAuthSession();

  if (!session?.user) redirect("/sign-in");

  await checkIfUserCompletedOnboarding("/dashboard/chat");
  const locale = await getLocale();

  const workspaces = await db.workspace.findMany({
    where: {
      subscribers: { some: { userId: session.user.id } },
    },
    include: {
      channels: {
        where: { type: "TEXT" },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
      _count: { select: { subscribers: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <DashboardHeader />
      <main className="min-h-full">
        <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
          <div className="border-b border-border pb-6">
            <p className="eyebrow">Conversations</p>
            <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
              Talk where the work lives.
            </h1>
            <p className="mt-3 max-w-[480px] text-sm leading-relaxed text-muted-foreground">
              Open a channel below. Messages, files and mentions stay attached
              to the workspace instead of a separate inbox.
            </p>
          </div>

          <div className="mt-8">
            {workspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Join or create a workspace to start a conversation.
              </p>
            ) : (
              workspaces.map((workspace) => (
                <section key={workspace.id} className="mb-10">
                  <div className="mb-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">Workspace</p>
                      <h2 className="mt-1 font-display text-2xl leading-none">
                        {workspace.name}
                      </h2>
                    </div>
                    <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {workspace._count.subscribers} {workspace._count.subscribers === 1 ? "member" : "members"}
                    </span>
                  </div>

                  <div className="border-t border-border">
                    {workspace.channels.length === 0 ? (
                      <div className="flex items-center justify-between gap-4 border-b border-border py-4">
                        <p className="text-[13px] text-muted-foreground">
                          No text channels yet.
                        </p>
                        <Link
                          href={`/${locale}/dashboard/workspace/${workspace.id}`}
                          className="text-[13px] underline decoration-border underline-offset-4 hover:decoration-foreground"
                        >
                          Open workspace
                        </Link>
                      </div>
                    ) : (
                      workspace.channels.map((channel) => (
                        <Link
                          key={channel.id}
                          href={`/${locale}/dashboard/workspace/${workspace.id}/channel/${channel.id}`}
                          className="group flex items-center justify-between gap-4 border-b border-border py-4 transition-colors hover:bg-secondary/30"
                        >
                          <span className="flex items-center gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[13px] font-medium">
                              {channel.name}
                            </span>
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            Open
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
