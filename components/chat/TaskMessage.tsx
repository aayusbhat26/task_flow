'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowUpRight, CalendarDays, CheckCircle2, ListTodo } from 'lucide-react';
import type { ChatTaskCard } from '@/lib/chat-rich';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getRandomColor } from '@/lib/utils';

interface TaskMessageProps {
  task: ChatTaskCard;
  workspaceId: string;
}

const priorityStyles: Record<string, string> = {
  LOW: 'border-border text-muted-foreground',
  MEDIUM: 'border-foreground/20 text-foreground',
  HIGH: 'border-amber-500/40 text-amber-700 dark:text-amber-400',
  URGENT: 'border-destructive/40 text-destructive',
};

export function TaskMessage({ task, workspaceId }: TaskMessageProps) {
  const locale = useLocale();
  const due = task.dueTo ? new Date(task.dueTo) : null;
  const dueLabel = due
    ? due.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : 'No due date';

  return (
    <div className="w-[min(22rem,100%)] min-w-[16rem] border border-border bg-background p-3 text-foreground shadow-sm" data-testid="task-message" data-task-id={task.id}>
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border',
            task.isCompleted
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-border bg-secondary'
          )}
        >
          {task.isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ListTodo className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-[13px] font-medium leading-snug', task.isCompleted && 'line-through opacity-70')}>
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={cn('border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em]', priorityStyles[task.priority] || priorityStyles.MEDIUM)}>
              {task.priority.toLowerCase()}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" /> {dueLabel}
            </span>
            {task.isCompleted && (
              <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
                Done
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {task.assignees.length > 0 ? (
            <>
              <span className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map(assignee => (
                  <Avatar key={assignee.id} className="h-5 w-5 border border-background">
                    <AvatarImage src={assignee.image || undefined} alt={assignee.name || assignee.username} />
                    <AvatarFallback className={cn('text-[8px] text-primary-foreground', getRandomColor(assignee.id))}>
                      {(assignee.name || assignee.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {task.assignees.map(assignee => assignee.name || assignee.username).join(', ')}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">Unassigned</span>
          )}
        </div>
        <Link
          href={`/${locale}/dashboard/workspace/${workspaceId}`}
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
