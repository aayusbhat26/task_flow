'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Brain, Users } from 'lucide-react';

interface DsaRoomBannerProps {
  room: any;
  onOpen: () => void;
}

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function DsaRoomBanner({ room, onOpen }: DsaRoomBannerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, Math.floor((new Date(room.endsAt).getTime() - now) / 1000));
  if (remaining <= 0) return null;

  return (
    <button
      onClick={onOpen}
      data-testid="dsa-room-banner"
      className="mx-4 mt-3 flex items-center justify-between gap-3 border border-border bg-card px-3 py-2 text-left transition-colors hover:border-foreground/30"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-secondary">
          <Brain className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-medium">
            DSA room · {room.question.title}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-mono tabular-nums">{formatRemaining(remaining)} left</span>
            <span className="inline-flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {room.participants?.length ?? 0}</span>
          </span>
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium">
        Join <ArrowUpRight className="h-3 w-3" />
      </span>
    </button>
  );
}
