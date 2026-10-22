'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TaskComposerUser {
  id: string;
  name?: string | null;
  username: string;
  image?: string | null;
}

interface TaskComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  groupId?: string;
  channelId?: string;
  replyToId?: string;
  initialTitle?: string;
  users: TaskComposerUser[];
  onCreated: (message: any) => void;
}

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export function TaskComposer({
  open,
  onOpenChange,
  workspaceId,
  groupId,
  channelId,
  replyToId,
  initialTitle,
  users,
  onCreated,
}: TaskComposerProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle || '');
      setPriority('MEDIUM');
      setDueDate('');
      setAssigneeId('');
      setError(null);
    }
  }, [open, initialTitle]);

  const submit = async () => {
    if (!title.trim()) {
      setError('Add a title for the task.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch('/api/chat/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          priority,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
          workspaceId,
          groupId,
          channelId,
          replyToId,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Could not create the task.');
        return;
      }

      onCreated(data);
      onOpenChange(false);
    } catch {
      setError('Could not create the task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a task</DialogTitle>
          <DialogDescription>
            The task is added to this workspace and posted as a live card in chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="eyebrow mb-1.5 block" htmlFor="task-title">Task</label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Fix the onboarding redirect"
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow mb-1.5 block" htmlFor="task-due">Due date</label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
            <div>
              <label className="eyebrow mb-1.5 block" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="h-9 w-full border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {PRIORITIES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="eyebrow mb-1.5 block" htmlFor="task-assignee">Assignee</label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="h-9 w-full border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.username} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={isSubmitting} className={cn(isSubmitting && 'opacity-80')}>
            {isSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
