'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Check, EyeOff, ListChecks, Lock } from 'lucide-react';
import type { ChatPoll } from '@/lib/chat-rich';
import { cn } from '@/lib/utils';

interface PollMessageProps {
  poll: ChatPoll;
  onVote?: (pollId: string, optionId: string) => void;
}

export function PollMessage({ poll, onVote }: PollMessageProps) {
  const [, forceTick] = useState(0);
  const closesTime = poll.closesAt ? new Date(poll.closesAt).getTime() : null;
  const timeClosed = closesTime !== null && closesTime <= Date.now();
  const closed = poll.isClosed || timeClosed;
  const totalVotes = poll.totalVotes;

  useEffect(() => {
    if (!closesTime || closed) return;
    const timeout = setTimeout(() => forceTick(tick => tick + 1), Math.max(0, closesTime - Date.now()) + 250);
    return () => clearTimeout(timeout);
  }, [closesTime, closed]);

  return (
    <div className="w-[min(22rem,100%)] min-w-[16rem] border border-border bg-background p-3 text-foreground shadow-sm" data-testid="poll-message" data-poll-id={poll.id}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-border bg-secondary">
          <BarChart3 className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug">{poll.question}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            <span>{poll.allowMultiple ? 'Multiple choice' : 'Single choice'}</span>
            {poll.isAnonymous && (
              <span className="inline-flex items-center gap-0.5">
                <EyeOff className="h-2.5 w-2.5" /> Anonymous
              </span>
            )}
            {closed && (
              <span className="inline-flex items-center gap-0.5 text-destructive">
                <Lock className="h-2.5 w-2.5" /> Closed
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {poll.options.map(option => {
          const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !closed && onVote?.(poll.id, option.id)}
              disabled={closed}
              className={cn(
                'relative flex w-full items-center justify-between overflow-hidden border px-2.5 py-2 text-left text-[12px] transition-colors',
                option.myVote
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-border bg-card hover:border-foreground/25',
                closed && 'cursor-default opacity-80'
              )}
              aria-pressed={option.myVote}
            >
              <span
                className="absolute inset-y-0 left-0 bg-primary/10 transition-[width] duration-300"
                style={{ width: `${percentage}%` }}
              />
              <span className="relative z-10 flex min-w-0 items-center gap-1.5 truncate">
                {option.myVote && <Check className="h-3 w-3 shrink-0 text-primary" />}
                <span className="truncate">{option.label}</span>
              </span>
              <span className="relative z-10 ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                {option.voteCount} · {percentage}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        <span className="inline-flex items-center gap-1">
          {poll.allowMultiple && <ListChecks className="h-3 w-3" />}
          {poll.closesAt
            ? `Closes ${new Date(poll.closesAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            : 'Open poll'}
        </span>
      </div>
    </div>
  );
}
