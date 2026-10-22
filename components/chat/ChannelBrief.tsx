'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowUpRight,
  Brain,
  CalendarDays,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Pin,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getRandomColor } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/context/SocketProvider';

interface ChannelBriefProps {
  workspaceId: string;
  groupId?: string;
  channelId?: string;
  title: string;
  onlineCount: number;
  onClose: () => void;
  onOpenThread: (message: any) => void;
  onOpenDsaRoom: () => void;
}

interface BriefData {
  decisions: any[];
  files: any[];
  threads: any[];
  tasks: any[];
  deadlines: any[];
  stats: {
    activeTasks: number;
    dueSoon: number;
    messages7d: number;
    contributors7d: number;
    pinnedTotal: number;
  };
  dsaRoom: any | null;
}

const priorityClass: Record<string, string> = {
  LOW: 'text-muted-foreground',
  MEDIUM: 'text-foreground',
  HIGH: 'text-amber-700 dark:text-amber-400',
  URGENT: 'text-destructive',
};

export function ChannelBrief({
  workspaceId,
  groupId,
  channelId,
  title,
  onlineCount,
  onClose,
  onOpenThread,
  onOpenDsaRoom,
}: ChannelBriefProps) {
  const locale = useLocale();
  const { socket } = useSocket();
  const [data, setData] = useState<BriefData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('workspaceId', workspaceId);
      if (channelId) params.set('channelId', channelId);
      if (groupId) params.set('groupId', groupId);
      const response = await fetch(`/api/chat/brief?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error || 'Could not load the brief.');
        return;
      }
      setData(payload);
    } catch {
      setError('Could not load the brief.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, channelId, groupId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('message-pinned', refresh);
    socket.on('dsa-room-changed', refresh);
    return () => {
      socket.off('message-pinned', refresh);
      socket.off('dsa-room-changed', refresh);
    };
  }, [socket, load]);

  const tasksHref = `/${locale}/dashboard/workspace/${workspaceId}`;

  return (
    <div className="flex h-full w-full flex-col bg-background" data-testid="channel-brief">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">Channel brief</p>
          <h3 className="truncate text-[15px] font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
            className="h-8 w-8"
            aria-label="Refresh brief"
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close brief">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && !data ? (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map(index => (
                <div key={index} className="h-16 animate-pulse border border-border bg-muted/40" />
              ))}
            </div>
            {[0, 1, 2].map(index => (
              <div key={index} className="h-24 animate-pulse border border-border bg-muted/30" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <p className="border border-destructive/30 bg-destructive/5 p-3 text-[12px] text-destructive">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={load}>Try again</Button>
          </div>
        ) : data ? (
          <div className="space-y-6 p-4">
            <div className="grid grid-cols-2 gap-px border border-border bg-border">
              <Stat label="Active tasks" value={data.stats.activeTasks} />
              <Stat label="Due in 7 days" value={data.stats.dueSoon} />
              <Stat label="Messages 7d" value={data.stats.messages7d} />
              <Stat label="Contributors 7d" value={data.stats.contributors7d} />
              <Stat label="Online now" value={onlineCount} />
              <Stat label="Pinned decisions" value={data.stats.pinnedTotal} />
            </div>

            {data.dsaRoom && (
              <section>
                <SectionTitle icon={Brain} label="DSA room live" />
                <button
                  onClick={onOpenDsaRoom}
                  className="mt-2 w-full border border-border bg-card p-3 text-left transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium">{data.dsaRoom.question.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {data.dsaRoom.question.topic} · {data.dsaRoom._count.participants} in the room
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </div>
                </button>
              </section>
            )}

            <section>
              <SectionTitle icon={Pin} label="Pinned decisions" count={data.stats.pinnedTotal} />
              {data.decisions.length === 0 ? (
                <Empty text="Pin a message from its hover menu to keep decisions here." />
              ) : (
                <div className="mt-2 divide-y divide-border border border-border">
                  {data.decisions.map((decision: any) => (
                    <div key={decision.id} className="bg-card p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={decision.author.image || undefined} alt={decision.author.name || decision.author.username} />
                          <AvatarFallback className={cn('text-[8px] text-primary-foreground', getRandomColor(decision.author.id))}>
                            {(decision.author.name || decision.author.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {decision.author.name || decision.author.username}
                          {decision._count?.replies > 0 ? ` · ${decision._count.replies} replies` : ''}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[12px] leading-relaxed">
                        {decision.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {data.stats.pinnedTotal > data.decisions.length && (
                <p className="mt-1.5 text-[9px] text-muted-foreground">
                  Showing {data.decisions.length} of {data.stats.pinnedTotal} pinned decisions.
                </p>
              )}
            </section>

            <section>
              <SectionTitle icon={MessageSquare} label="Active threads" />
              {data.threads.length === 0 ? (
                <Empty text="Threads with replies will appear here." />
              ) : (
                <div className="mt-2 divide-y divide-border border border-border">
                  {data.threads.map((thread: any) => (
                    <button
                      key={thread.id}
                      onClick={() => onOpenThread({ ...thread, _count: thread._count, replies: [] })}
                      className="flex w-full items-start gap-2 bg-card p-3 text-left transition-colors hover:bg-secondary/60"
                    >
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px]">{thread.content || 'Attachment'}</span>
                        <span className="mt-0.5 block text-[9px] text-muted-foreground">
                          {thread._count.replies} {thread._count.replies === 1 ? 'reply' : 'replies'}
                          {thread.replies?.[0]
                            ? ` · last from ${thread.replies[0].author.name || thread.replies[0].author.username}`
                            : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle icon={FileText} label="Work in flight" count={data.stats.activeTasks} />
              {data.tasks.length === 0 ? (
                <Empty text="No active tasks in this workspace." />
              ) : (
                <div className="mt-2 divide-y divide-border border border-border">
                  {data.tasks.map((task: any) => (
                    <Link
                      key={task.id}
                      href={tasksHref}
                      className="flex items-start justify-between gap-2 bg-card p-3 transition-colors hover:bg-secondary/60"
                    >
                      <span className="min-w-0">
                        <span className={cn('block truncate text-[12px]', priorityClass[task.priority])}>{task.title}</span>
                        <span className="mt-0.5 block text-[9px] text-muted-foreground">
                          {task.assignedToTask?.length > 0
                            ? task.assignedToTask.map((a: any) => a.user.name || a.user.username).join(', ')
                            : 'Unassigned'}
                        </span>
                      </span>
                      <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
              {data.stats.activeTasks > data.tasks.length && (
                <p className="mt-1.5 text-[9px] text-muted-foreground">
                  Showing {data.tasks.length} of {data.stats.activeTasks} active tasks.
                </p>
              )}
            </section>

            <section>
              <SectionTitle icon={CalendarDays} label="Due this week" count={data.stats.dueSoon} />
              {data.deadlines.length === 0 ? (
                <Empty text="Nothing is due in the next seven days." />
              ) : (
                <div className="mt-2 divide-y divide-border border border-border">
                  {data.deadlines.map((task: any) => (
                    <Link key={task.id} href={tasksHref} className="flex items-center justify-between gap-2 bg-card p-3 transition-colors hover:bg-secondary/60">
                      <span className="min-w-0 truncate text-[12px]">{task.title}</span>
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
                        {task.taskDate?.from
                          ? new Date(task.taskDate.from).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          : ''}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle icon={ExternalLink} label="Recent files" />
              {data.files.length === 0 ? (
                <Empty text="Files shared in chat will appear here." />
              ) : (
                <div className="mt-2 divide-y divide-border border border-border">
                  {data.files.map((file: any) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 bg-card p-3 transition-colors hover:bg-secondary/60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px]">{file.originalName || file.filename}</span>
                        <span className="block text-[9px] text-muted-foreground">
                          {file.uploadedBy?.name || file.uploadedBy?.username || 'Member'} · {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </section>

            <div className="flex items-center gap-2 border-t border-border pt-3 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              <Users className="h-3 w-3" /> {onlineCount} online · auto-updating brief
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card p-3">
      <p className="font-display text-xl leading-none">{value}</p>
      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, count }: { icon: any; label: string; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="eyebrow">{label}</h4>
      </div>
      {typeof count === 'number' && count > 0 && (
        <span className="font-mono text-[9px] text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-2 border border-dashed border-border px-3 py-4 text-[10px] text-muted-foreground">{text}</p>;
}
