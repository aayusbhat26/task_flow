'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
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

interface PollComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  groupId?: string;
  channelId?: string;
  replyToId?: string;
  initialQuestion?: string;
  onCreated: (message: any) => void;
}

const CLOSE_OPTIONS = [
  { value: 'never', label: 'No close time' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '3d', label: '3 days' },
  { value: '1w', label: '1 week' },
];

function closesAtFrom(value: string) {
  const now = Date.now();
  const durations: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  return durations[value] ? new Date(now + durations[value]).toISOString() : null;
}

export function PollComposer({
  open,
  onOpenChange,
  workspaceId,
  groupId,
  channelId,
  replyToId,
  initialQuestion,
  onCreated,
}: PollComposerProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [closeIn, setCloseIn] = useState('never');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuestion(initialQuestion || '');
      setOptions(['', '']);
      setAllowMultiple(false);
      setIsAnonymous(false);
      setCloseIn('never');
      setError(null);
    }
  }, [open, initialQuestion]);

  const updateOption = (index: number, value: string) => {
    setOptions(prev => prev.map((option, i) => (i === index ? value : option)));
  };

  const submit = async () => {
    const cleanQuestion = question.trim();
    const cleanOptions = options.map(option => option.trim()).filter(Boolean);

    if (!cleanQuestion) {
      setError('Add a question for the poll.');
      return;
    }
    if (cleanOptions.length < 2) {
      setError('Add at least two options.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch('/api/chat/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: cleanQuestion,
          options: cleanOptions,
          allowMultiple,
          isAnonymous,
          closesAt: closesAtFrom(closeIn),
          workspaceId,
          groupId,
          channelId,
          replyToId,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Could not create the poll.');
        return;
      }

      onCreated(data);
      onOpenChange(false);
    } catch {
      setError('Could not create the poll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a poll</DialogTitle>
          <DialogDescription>
            Votes update live for everyone in this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="eyebrow mb-1.5 block" htmlFor="poll-question">Question</label>
            <Input
              id="poll-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What should we ship next?"
              maxLength={300}
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="eyebrow">Options</span>
              <span className="text-[10px] text-muted-foreground">{options.length}/10</span>
            </div>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-4 font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                  <Input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    maxLength={120}
                  />
                  <button
                    type="button"
                    onClick={() => setOptions(prev => prev.filter((_, i) => i !== index))}
                    disabled={options.length <= 2}
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label="Remove option"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={() => setOptions(prev => [...prev, ''])}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> Add option
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 border border-border bg-card px-3 py-2 text-[11px]">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(event) => setAllowMultiple(event.target.checked)}
                className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
              />
              Allow multiple choices
            </label>
            <label className="flex cursor-pointer items-center gap-2 border border-border bg-card px-3 py-2 text-[11px]">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
                className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
              />
              Hide who voted
            </label>
          </div>

          <div>
            <label className="eyebrow mb-1.5 block" htmlFor="poll-close">Closes</label>
            <select
              id="poll-close"
              value={closeIn}
              onChange={(event) => setCloseIn(event.target.value)}
              className="h-9 w-full border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CLOSE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Create poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
