'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Play,
  Search,
  Square,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/context/SocketProvider';
import { useToast } from '@/hooks/use-toast';
import { cn, getRandomColor } from '@/lib/utils';
import { DsaRoomHistory } from './DsaRoomHistory';

interface DsaRoomPanelProps {
  workspaceId: string;
  channelId: string;
  currentUser: any;
  onClose: () => void;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'text-amber-700 dark:text-amber-400',
  HARD: 'text-destructive',
};

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function liveMinutes(joinedAt: string, now: number) {
  const elapsed = now - new Date(joinedAt).getTime();
  if (elapsed <= 0) return 0;
  return Math.max(1, Math.ceil(elapsed / 60000));
}

export function DsaRoomPanel({ workspaceId, channelId, currentUser, onClose }: DsaRoomPanelProps) {
  const { socket } = useSocket();
  const { toast } = useToast();
  const [room, setRoom] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isStarting, setIsStarting] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showStarter, setShowStarter] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [duration, setDuration] = useState(45);
  const [view, setView] = useState<'room' | 'history'>('room');
  const joinedRef = useRef<string | null>(null);
  const expiredRef = useRef<string | null>(null);

  useEffect(() => {
    setView('room');
  }, [channelId]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/dsa/rooms?channelId=${encodeURIComponent(channelId)}&workspaceId=${encodeURIComponent(workspaceId)}`
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Could not load the DSA room.');
        return;
      }
      setRoom(data.active);
      setHistory(data.history || []);
      if (!data.active) {
        setShowStarter(true);
      }
      setError(null);
    } catch {
      setError('Could not load the DSA room.');
    } finally {
      setIsLoading(false);
    }
  }, [channelId, workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleRoomChanged = (data: { channelId: string }) => {
      if (data.channelId === channelId) load();
    };
    socket.on('dsa-room-changed', handleRoomChanged);
    return () => {
      socket.off('dsa-room-changed', handleRoomChanged);
    };
  }, [socket, channelId, load]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingSeconds = room
    ? Math.max(0, Math.floor((new Date(room.endsAt).getTime() - now) / 1000))
    : 0;
  const roomEnded = Boolean(room) && (room.status !== 'ACTIVE' || remainingSeconds <= 0);
  const participant = room?.participants?.find((item: any) => item.user.id === currentUser.id);
  const solved = Boolean(participant?.completedAt);

  useEffect(() => {
    if (!room || room.status !== 'ACTIVE' || roomEnded || view !== 'room') return;
    if (participant || joinedRef.current === room.id) return;
    joinedRef.current = room.id;
    (async () => {
      try {
        await fetch(`/api/dsa/rooms/${room.id}/join`, { method: 'POST' });
        socket?.emit('dsa-room-changed', { workspaceId: channelId, channelId });
        await load();
      } catch {
        // Presence still works; joining can be retried on the next open.
      }
    })();
  }, [room, roomEnded, participant, socket, workspaceId, channelId, load, view]);

  useEffect(() => {
    if (!room || room.status !== 'ACTIVE' || remainingSeconds > 0) return;
    if (expiredRef.current === room.id) return;
    expiredRef.current = room.id;
    const timeout = setTimeout(() => load(), 2500);
    return () => clearTimeout(timeout);
  }, [room, remainingSeconds, load]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!showStarter) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (questionSearch.trim()) params.set('search', questionSearch.trim());
        params.set('limit', '12');
        const response = await fetch(`/api/dsa/questions?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.questions)
            ? data.questions
            : [];
        setQuestions(list);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setQuestions([]);
        }
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [showStarter, questionSearch]);

  const startRoom = async () => {
    if (!selectedQuestion) {
      toast({ title: 'Choose a problem first', variant: 'destructive' });
      return;
    }
    try {
      setIsStarting(true);
      const response = await fetch('/api/dsa/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          channelId,
          questionId: selectedQuestion.id,
          durationMinutes: duration,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast({ title: data?.error || 'Could not start the room', variant: 'destructive' });
        if (response.status === 409) await load();
        return;
      }
      setRoom(data.room);
      setShowStarter(false);
      setSelectedQuestion(null);
      setQuestionSearch('');
      joinedRef.current = data.room.id;
      socket?.emit('dsa-room-changed', { workspaceId: channelId, channelId });
      toast({ title: 'DSA room started', description: `${duration} minutes on ${data.room.question.title}.` });
    } catch {
      toast({ title: 'Could not start the room', variant: 'destructive' });
    } finally {
      setIsStarting(false);
    }
  };

  const markSolved = async () => {
    if (!room || solved) return;
    try {
      setIsSolving(true);
      const response = await fetch(`/api/dsa/rooms/${room.id}/solve`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast({ title: data?.error || 'Could not mark the room solved', variant: 'destructive' });
        return;
      }

      const timeSpent = data.participant?.timeSpent ?? 0;
      const progressResponse = await fetch('/api/dsa/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: room.question.id,
          status: 'COMPLETED',
          timeSpent,
        }),
      }).catch(() => null);

      socket?.emit('dsa-room-changed', { workspaceId: channelId, channelId });
      await load();
      toast({
        title: progressResponse?.ok ? 'Problem logged' : 'Room marked solved',
        description: progressResponse?.ok
          ? 'Your DSA progress and points are updated.'
          : 'The room is updated, but DSA progress could not be saved.',
        variant: progressResponse?.ok ? undefined : 'destructive',
      });
    } catch {
      toast({ title: 'Could not mark the room solved', variant: 'destructive' });
    } finally {
      setIsSolving(false);
    }
  };

  const endRoom = async () => {
    if (!room) return;
    try {
      setIsEnding(true);
      const response = await fetch(`/api/dsa/rooms/${room.id}/end`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast({ title: data?.error || 'Could not end the room', variant: 'destructive' });
        return;
      }
      socket?.emit('dsa-room-changed', { workspaceId: channelId, channelId });
      await load();
      setShowStarter(true);
      toast({ title: 'DSA room ended' });
    } catch {
      toast({ title: 'Could not end the room', variant: 'destructive' });
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background" data-testid="dsa-room-panel">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <p className="eyebrow">{view === 'history' ? 'Complete record' : 'Focus together'}</p>
          <h3 className="text-[15px] font-semibold">
            {view === 'history' ? 'Room history' : 'DSA co-working room'}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {view === 'history' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('room')}
              className="h-8 gap-1 px-2 text-[11px]"
              aria-label="Back to room"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('history')}
              className="h-8 gap-1 px-2 text-[11px]"
              aria-label="Room history"
            >
              <History className="h-3.5 w-3.5" /> History
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close DSA room">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'history' ? (
        <div className="flex-1 overflow-hidden">
          <DsaRoomHistory
            workspaceId={workspaceId}
            channelId={channelId}
            onOpenRoom={() => setView('room')}
          />
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <div className="h-28 animate-pulse border border-border bg-muted/40" />
            <div className="h-20 animate-pulse border border-border bg-muted/30" />
          </div>
        ) : error ? (
          <div className="p-4">
            <p className="border border-destructive/30 bg-destructive/5 p-3 text-[12px] text-destructive">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={load}>Try again</Button>
          </div>
        ) : room ? (
          <div className="p-4">
            <div className="border border-border bg-card">
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('font-mono text-[9px] uppercase tracking-[0.1em]', DIFFICULTY_STYLE[room.question.difficulty] || 'text-muted-foreground')}>
                      {room.question.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{room.question.topic}</span>
                  </div>
                  <h4 className="mt-1 text-[15px] font-semibold leading-snug">{room.question.title}</h4>
                  {room.question.leetcodeUrl && (
                    <a
                      href={room.question.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      Open on {room.question.platform} <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className={cn('shrink-0 text-right', roomEnded ? 'text-destructive' : 'text-foreground')}>
                  <p className="font-mono text-2xl tabular-nums">{formatRemaining(remainingSeconds)}</p>
                  <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                    {roomEnded ? 'Time up' : 'remaining'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {room.participants.length} in the room ·{' '}
                  {liveMinutes(room.startedAt, now)}m elapsed
                </span>
                <span>started {formatClock(room.startedAt)} · hosted by {room.host.name || room.host.username}</span>
              </div>
            </div>

            {room.question.description && (
              <div className="mt-3 max-h-40 overflow-y-auto border border-border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
                {room.question.description}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={markSolved} disabled={solved || isSolving || roomEnded} data-testid="dsa-solve">
                {isSolving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                {solved ? 'Solved' : 'I solved it'}
              </Button>
              {(room.host.id === currentUser.id || currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') && !roomEnded && (
                <Button size="sm" variant="outline" onClick={endRoom} disabled={isEnding} data-testid="dsa-end">
                  {isEnding ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Square className="mr-1.5 h-3.5 w-3.5" />}
                  End room
                </Button>
              )}
              {roomEnded && (
                <Button size="sm" variant="outline" onClick={() => { setShowStarter(true); setRoom(null); }}>
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Start another
                </Button>
              )}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Participants</p>
                <span className="font-mono text-[9px] text-muted-foreground">{room.participants.length}</span>
              </div>
              <div className="mt-2 divide-y divide-border border border-border">
                {room.participants.map((item: any) => (
                  <div key={item.id} data-testid="dsa-participant" className="flex items-center gap-2 bg-card px-3 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.user.image || undefined} alt={item.user.name || item.user.username} />
                      <AvatarFallback className={cn('text-[8px] text-primary-foreground', getRandomColor(item.user.id))}>
                        {(item.user.name || item.user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-[11px]">
                      {item.user.name || item.user.username}
                      {item.user.id === currentUser.id && <span className="ml-1 text-primary">(you)</span>}
                    </span>
                    {item.completedAt ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> solved · {item.timeSpent}m
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                        <Clock className="h-3 w-3" /> focusing · {Math.min(
                          room.durationMinutes,
                          liveMinutes(item.joinedAt, now)
                        )}m
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {room.question.hints?.length > 0 && (
              <details className="mt-5 border border-border bg-card p-3">
                <summary className="cursor-pointer text-[11px] font-medium">Hints ({room.question.hints.length})</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-muted-foreground">
                  {room.question.hints.map((hint: string, index: number) => (
                    <li key={index}>{hint}</li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        ) : showStarter ? (
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-[13px] font-semibold">Start a co-working room</h4>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Everyone in this channel sees the live room, timer, and who is focusing.
            </p>

            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                placeholder="Search DSA problems..."
                className="pl-8"
              />
            </div>

            <div className="mt-2 max-h-64 divide-y divide-border overflow-y-auto border border-border">
              {questions.length === 0 ? (
                <p className="p-3 text-[10px] text-muted-foreground">No problems found.</p>
              ) : questions.map((question: any) => (
                <button
                  key={question.id}
                  data-testid="dsa-question-option"
                  onClick={() => setSelectedQuestion(question)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 bg-card px-3 py-2 text-left transition-colors hover:bg-secondary/60',
                    selectedQuestion?.id === question.id && 'bg-secondary'
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[11px]">{question.title}</span>
                    <span className="block text-[9px] text-muted-foreground">{question.topic} · {question.difficulty.toLowerCase()}</span>
                  </span>
                  {selectedQuestion?.id === question.id && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <p className="eyebrow mb-1.5">Session length</p>
              <div className="flex gap-2">
                {[25, 45, 60, 90].map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => setDuration(minutes)}
                    className={cn(
                      'flex-1 border px-2 py-2 font-mono text-[11px] transition-colors',
                      duration === minutes
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground/30'
                    )}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>

            <Button className="mt-4 w-full" onClick={startRoom} disabled={isStarting || !selectedQuestion} data-testid="dsa-start">
              {isStarting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
              Start {duration}-minute room
            </Button>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Recent rooms</p>
                <button
                  type="button"
                  onClick={() => setView('history')}
                  className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all
                </button>
              </div>
              {history.length === 0 ? (
                <p className="mt-2 border border-dashed border-border px-3 py-3 text-[10px] text-muted-foreground">
                  No sessions recorded yet. Every room you start will be tracked here with timings and attendance.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-border border border-border">
                  {history.map((session: any) => (
                    <div key={session.id} className="bg-card px-3 py-2">
                      <p className="truncate text-[11px]">{session.question.title}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        {formatDay(session.startedAt)} · {formatClock(session.startedAt)}–{formatClock(session.endedAt || session.endsAt)} ·{' '}
                        {session.runMinutes ?? 0}m run
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {session.participantCount ?? 0} joined · {session.solvedCount ?? 0} solved ·{' '}
                        {session.activeMinutes ?? 0} active min
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
}
