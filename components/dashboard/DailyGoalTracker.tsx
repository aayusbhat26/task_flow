"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface DailyGoalData {
  tasksCompleted: number;
  pomodorosCompleted: number;
  totalCompleted: number;
  dailyGoal: number;
  progress: number;
  currentStreak: number;
}

export function DailyGoalTracker() {
  const { data, isLoading } = useQuery<DailyGoalData>({
    queryKey: ["dailyGoal"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/daily-goal");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="h-3 w-24 animate-pulse bg-muted" />
          <div className="mt-8 h-12 w-32 animate-pulse bg-muted" />
          <div className="mt-8 h-1.5 w-full animate-pulse bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const {
    progress,
    totalCompleted,
    dailyGoal,
    tasksCompleted,
    pomodorosCompleted,
    currentStreak,
  } = data;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Daily goal</p>
            <p className="mt-3 font-display text-5xl leading-none">
              {totalCompleted}
              <span className="text-2xl text-muted-foreground">/{dailyGoal}</span>
            </p>
          </div>
          {currentStreak > 0 && (
            <span className="flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              <Flame className="h-3 w-3 text-primary" />
              {currentStreak} day streak
            </span>
          )}
        </div>

        <p className="mt-3 text-[13px] text-muted-foreground">
          Completed actions today. Tasks and focus rounds both count.
        </p>

        <div className="mt-auto pt-8">
          <div className="h-1.5 w-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 divide-x divide-border border-t border-border pt-4">
            <div className="pr-4">
              <p className="font-mono text-xl">{tasksCompleted}</p>
              <p className="eyebrow mt-1">Tasks</p>
            </div>
            <div className="pl-4">
              <p className="font-mono text-xl">{pomodorosCompleted}</p>
              <p className="eyebrow mt-1">Focus rounds</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
