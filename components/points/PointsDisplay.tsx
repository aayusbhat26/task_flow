"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins, History, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PointTransaction {
  id: string;
  points: number;
  type: "POMODORO_COMPLETED" | "TASK_COMPLETED" | "MANUAL_ADJUSTMENT";
  description: string;
  createdAt: string;
}

interface PointsData {
  user: {
    id: string;
    username: string;
    totalPoints: number;
  };
  transactions: PointTransaction[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: Record<string, { totalPoints: number; count: number }>;
}

async function fetchUserPoints(page = 1): Promise<PointsData> {
  const response = await fetch(`/api/points?page=${page}&limit=20`);
  if (!response.ok) throw new Error("Failed to fetch points data");
  return response.json();
}

export const PointsDisplay = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: pointsData, isLoading, error } = useQuery({
    queryKey: ["userPoints", currentPage],
    queryFn: () => fetchUserPoints(currentPage),
  });

  if (isLoading) {
    return (
      <div className="flex h-8 items-center gap-2 border-l border-border pl-3">
        <span className="h-2 w-8 animate-pulse bg-muted" />
      </div>
    );
  }

  if (error || !pointsData) return null;

  return (
    <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 gap-2 px-2 font-mono text-xs"
          title="Points history"
        >
          <Coins className="h-3.5 w-3.5 text-primary" />
          <span>{pointsData.user.totalPoints}</span>
          <span className="hidden text-[9px] uppercase tracking-[0.1em] text-muted-foreground sm:inline">
            pts
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">
            Points history
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-px border border-border bg-border">
            {pointsData.stats.POMODORO_COMPLETED && (
              <div className="flex items-center gap-3 bg-card p-4">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-mono text-lg">
                    {pointsData.stats.POMODORO_COMPLETED.totalPoints}
                  </div>
                  <div className="eyebrow">Focus points</div>
                </div>
              </div>
            )}
            {pointsData.stats.TASK_COMPLETED && (
              <div className="flex items-center gap-3 bg-card p-4">
                <CheckCircle className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-mono text-lg">
                    {pointsData.stats.TASK_COMPLETED.totalPoints}
                  </div>
                  <div className="eyebrow">Task points</div>
                </div>
              </div>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto border border-border">
            {pointsData.transactions.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No points recorded yet. Complete a task or a focus round to
                begin.
              </p>
            ) : (
              pointsData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {transaction.type === "POMODORO_COMPLETED" ? (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : transaction.type === "TASK_COMPLETED" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-[13px]">{transaction.description}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-primary">
                    +{transaction.points}
                  </span>
                </div>
              ))
            )}
          </div>

          {pointsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={!pointsData.pagination.hasPrev}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {pointsData.pagination.page} / {pointsData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pointsData.pagination.hasNext}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
