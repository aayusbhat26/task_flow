'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/context/SocketProvider';
import { cn, getRandomColor } from '@/lib/utils';

interface DsaRoomHistoryProps {
  workspaceId: string;
  channelId: string;
  onOpenRoom: () => void;
}

type Scope = 'channel' | 'workspace';
type StatusFilter = 'all' | 'active' | 'ended';

interface HistoryRoom {
  id: string;
  startedAt: string;
  endsAt: string;
  endedAt: string | null;
  durationMinutes: number;
  runMinutes: number;
  status: 'ACTIVE' | 'ENDED';
  isActive: boolean;
  endedEarly: boolean;
  question: {
    id: string;
    title: string;
    difficulty: string;
    topic: string;
    platform?: string;
    leetcodeUrl?: string | null;
  };
  host: { id: string; name: string | null; username: string; image: string | null };
  channel: { id: string; name: string };
  participants: Array<{
    id: string;
    joinedAt: string;
    completedAt: string | null;
    timeSpent: number;
    activeMinutes: number;
    user: { id: string; name: string | null; username: string; image: string | null };
  }>;
  participantCount: number;
  solvedCount: number;
  activeMinutes: number;
}

interface HistoryResponse {
  rooms: HistoryRoom[];
  nextCursor: string | null;
  total: number;
  stats: {
    sessions: number;
    solves: number;
    activeMinutes: number;
    participants: number;
  };
}

const difficultyClass: Record<string, string> = {
  EASY: 'text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'text-amber-700 dark:text-amber-400',
  HARD: 'text-destructive',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatWindow(room: HistoryRoom) {
  const start = formatTime(room.startedAt);
  const end = room.endedAt ? formatTime(room.endedAt) : formatTime(room.endsAt);
  return `${start} – ${end}`;
}

export function DsaRoomHistory({ workspaceId, channelId, onOpenRoom }: DsaRoomHistoryProps) {
  const { socket } = useSocket();
  const [scope, setScope] = useState<Scope>('channel');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [rooms, setRooms] = useState<HistoryRoom[]>([]);
  const [stats, setStats] = useState<HistoryResponse['stats'] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (mode: 'reset' | 'more' = 'reset') => {
    const isMore = mode === 'more';
    try {
      if (isMore) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('workspaceId', workspaceId);
      params.set('scope', scope);
      params.set('status', status);
      params.set('limit', '20');
      if (scope === 'channel') params.set('channelId', channelId);
      if (isMore && nextCursor) params.set('cursor', nextCursor);

      const response = await fetch(`/api/dsa/rooms/history?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Could not load room history.');
        return;
      }

      setRooms(prev => isMore ? [...prev, ...(data.rooms || [])] : (data.rooms || []));
      setNextCursor(data.nextCursor || null);
      setTotal(data.total || 0);
      setStats(data.stats || null);
    } catch {
      setError('Could not load room history.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [workspaceId, channelId, scope, status, nextCursor]);

  useEffect(() => {
    load('reset');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, channelId, scope, status]);

  useEffect(() => {
    if (!socket) return;
    const refresh = (data: { channelId?: string }) => {
      if (scope === 'workspace' || data.channelId === channelId) {
        load('reset');
      }
    };
    socket.on('dsa-room-changed', refresh);
    return () => {
      socket.off('dsa-room-changed', refresh);
    };
  }, [socket, scope, channelId, load]);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-[10px] text-muted-foreground">
          Every session in scope, with attendance and solve times.
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => load('reset')}
          disabled={isLoading}
          aria-label="Refresh history"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex border border-border bg-card p-0.5">
              {(['channel', 'workspace'] as Scope[]).map(option => (
                <button
                  key={option}
                  onClick={() => setScope(option)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-medium transition-colors',
                    scope === option ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option === 'channel' ? 'This channel' : 'Entire workspace'}
                </button>
              ))}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              {total} {total === 1 ? 'session' : 'sessions'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(['all', 'active', 'ended'] as StatusFilter[]).map(option => (
              <button
                key={option}
                onClick={() => setStatus(option)}
                className={cn(
                  'border px-2 py-1 text-[10px] transition-colors',
                  status === option
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground/30'
                )}
              >
                {option === 'all' ? 'All' : option === 'active' ? 'Active' : 'Ended'}
              </button>
            ))}
          </div>

          {stats && (
            <div className="mt-3 grid grid-cols-4 gap-px border border-border bg-border">
              <HistoryStat label="Rooms" value={stats.sessions} />
              <HistoryStat label="Solves" value={stats.solves} />
              <HistoryStat label="Active min" value={Math.round(stats.activeMinutes)} />
              <HistoryStat label="Attendances" value={stats.participants} />
            </div>
          )}
          <p className="mt-2 text-[9px] text-muted-foreground">
            Totals cover {scope === 'channel' ? 'this channel' : 'the entire workspace'}, independent of the status filter. Active minutes run from join to solve, or to session end when unsolved.
          </p>
        </div>

        <div className="space-y-2 p-4">
          {isLoading ? (
            [0, 1, 2, 3].map(index => (
              <div key={index} className="h-24 animate-pulse border border-border bg-muted/30" />
            ))
          ) : error ? (
            <div>
              <p className="border border-destructive/30 bg-destructive/5 p-3 text-[11px] text-destructive">{error}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => load('reset')}>Try again</Button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="border border-dashed border-border px-4 py-10 text-center">
              <Brain className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-[12px] font-medium">No rooms in this view</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {status === 'all'
                  ? 'Start a co-working room and it will be recorded here permanently.'
                  : 'No sessions match this status filter.'}
              </p>
            </div>
          ) : (
            rooms.map(room => {
              const expanded = expandedId === room.id;
              return (
                <div key={room.id} className="border border-border bg-card" data-testid="dsa-history-room">
                  <button
                    onClick={() => setExpandedId(expanded ? null : room.id)}
                    className="w-full p-3 text-left transition-colors hover:bg-secondary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn('font-mono text-[8px] uppercase tracking-[0.1em]', difficultyClass[room.question.difficulty] || 'text-muted-foreground')}>
                            {room.question.difficulty}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{room.question.topic}</span>
                          {room.isActive ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Active
                            </span>
                          ) : (
                            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                              {room.endedEarly ? 'Ended early' : 'Completed'}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[13px] font-medium">{room.question.title}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatDate(room.startedAt)} · {formatWindow(room)} · hosted by {room.host.name || room.host.username}
                          {scope === 'workspace' ? ` · #${room.channel.name}` : ''}
                        </p>
                      </div>
                      {expanded ? <ChevronUp className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {room.participantCount} joined</span>
                      <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> {room.solvedCount} solved</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {room.activeMinutes} active min</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5" /> ran {room.runMinutes}m of {room.durationMinutes}m</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-border px-3 pb-3 pt-2">
                      {room.isActive && room.channel.id === channelId && (
                        <button
                          onClick={onOpenRoom}
                          className="mb-2 inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[10px] transition-colors hover:border-foreground/30"
                        >
                          <Play className="h-3 w-3" /> Join the active room
                        </button>
                      )}
                      <p className="eyebrow mb-1.5">Attendance</p>
                      <div className="divide-y divide-border border border-border">
                        {room.participants.map(participant => (
                          <div key={participant.id} className="flex items-center gap-2 bg-background px-2.5 py-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={participant.user.image || undefined} alt={participant.user.name || participant.user.username} />
                              <AvatarFallback className={cn('text-[7px] text-primary-foreground', getRandomColor(participant.user.id))}>
                                {(participant.user.name || participant.user.username).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 flex-1 truncate text-[10px]">
                              {participant.user.name || participant.user.username}
                            </span>
                            <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-muted-foreground">
                              joined {formatTime(participant.joinedAt)}
                            </span>
                            {participant.completedAt ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.06em] text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> solved {formatTime(participant.completedAt)} · {participant.activeMinutes}m
                              </span>
                            ) : (
                              <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-muted-foreground">
                                active {participant.activeMinutes}m · no solve
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {room.question.leetcodeUrl && (
                        <a
                          href={room.question.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          View problem
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {!isLoading && !error && rooms.length > 0 && (
            <div className="pt-1">
              {nextCursor ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => load('more')}
                  disabled={isLoadingMore}
                  data-testid="dsa-history-more"
                >
                  {isLoadingMore && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Load more
                </Button>
              ) : (
                <p className="py-2 text-center text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                  End of history · showing all {total} {total === 1 ? 'session' : 'sessions'}
                </p>
              )}
              <p className="mt-1 text-center text-[9px] text-muted-foreground">
                Showing {rooms.length} of {total} matching sessions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card p-2">
      <p className="font-display text-base leading-none">{value}</p>
      <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}
