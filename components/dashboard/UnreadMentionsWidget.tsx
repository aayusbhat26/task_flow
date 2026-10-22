"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface MentionData {
  id: string;
  messageId: string;
  read: boolean;
  createdAt: string;
  message: {
    content: string;
    author: {
      name: string;
      username: string;
      image: string | null;
    };
    workspaceId: string;
    groupId: string | null;
    workspace: { name: string };
    group?: { name: string } | null;
  };
}

export function UnreadMentionsWidget() {
  const queryClient = useQueryClient();

  const { data: mentions, isLoading } = useQuery<MentionData[]>({
    queryKey: ["unreadMentions"],
    queryFn: async () => {
      const res = await fetch("/api/mentions?unreadOnly=true");
      return res.json();
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const markAsRead = useMutation({
    mutationFn: async (mentionId: string) => {
      await fetch("/api/mentions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentionId, read: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadMentions"] });
    },
  });

  if (isLoading || !mentions || !Array.isArray(mentions)) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="h-3 w-28 animate-pulse bg-muted" />
          <div className="mt-8 h-20 animate-pulse bg-muted/60" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Mentions</p>
            <h3 className="mt-2 font-display text-2xl leading-none">
              {mentions.length > 0
                ? `${mentions.length} unread`
                : "Nothing waiting"}
            </h3>
          </div>
          {mentions.length > 0 && (
            <span className="h-2 w-2 bg-primary" aria-hidden />
          )}
        </div>

        {mentions.length === 0 ? (
          <div className="mt-8 flex flex-1 items-center border-t border-border pt-6">
            <p className="max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
              When someone mentions you in a channel, the note will appear
              here.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex-1 overflow-y-auto">
            {mentions.map((mention) => {
              const link = mention.message.groupId
                ? `/dashboard/workspace/${mention.message.workspaceId}/groups/${mention.message.groupId}`
                : `/dashboard/workspace/${mention.message.workspaceId}`;

              return (
                <div
                  key={mention.id}
                  className="group flex items-start justify-between gap-3 border-t border-border py-3.5"
                >
                  <Link
                    href={link}
                    className="min-w-0 flex-1"
                    onClick={() => markAsRead.mutate(mention.id)}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium">
                        {mention.message.author.name ||
                          mention.message.author.username}
                      </span>
                      <span className="truncate font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                        {mention.message.group?.name ||
                          mention.message.workspace.name}
                      </span>
                      <span className="ml-auto whitespace-nowrap font-mono text-[9px] text-muted-foreground">
                        {formatDistanceToNow(new Date(mention.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[13px] text-muted-foreground">
                      {mention.message.content}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      markAsRead.mutate(mention.id);
                    }}
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
