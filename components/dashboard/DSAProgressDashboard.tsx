"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, RefreshCw } from "lucide-react";

interface DSAStats {
  overall: {
    total: number;
    solved: number;
    inProgress: number;
    todo: number;
    completionPercentage: number;
  };
  topics: Record<string, { solved: number; total: number; inProgress: number }>;
  difficulty: Record<string, { solved: number; total: number; inProgress: number }>;
  streak: number;
}

export function DSAProgressDashboard() {
  const [stats, setStats] = useState<DSAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const locale = useLocale();

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch(`/api/dsa/stats?t=${Date.now()}`);
      if (response.ok) setStats(await response.json());
    } catch {
      // The empty state handles unavailable data.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const handleProgressUpdate = () => fetchStats();
    window.addEventListener("dsaProgressUpdated", handleProgressUpdate);
    return () =>
      window.removeEventListener("dsaProgressUpdated", handleProgressUpdate);
  }, [fetchStats]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-3 w-28 animate-pulse bg-muted" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-muted/60" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const hasQuestions = stats.overall.total > 0;
  const topTopics = Object.entries(stats.topics)
    .sort((a, b) => b[1].solved - a[1].solved)
    .slice(0, 4);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">DSA practice</p>
            <h2 className="mt-2 font-display text-2xl leading-none">
              {hasQuestions ? "Progress, measured." : "No questions yet."}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              title="Refresh progress"
            >
              <RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            </Button>
            <Link
              href={`/${locale}/dsa`}
              className="inline-flex h-8 items-center gap-1.5 border border-border px-3 text-xs transition-colors hover:bg-secondary"
            >
              {hasQuestions ? "Open practice" : "Set up practice"}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {!hasQuestions ? (
          <p className="mt-5 max-w-[520px] border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">
            Import a question set or add curated problems to start tracking
            progress by topic and difficulty.
          </p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 border-y border-border sm:grid-cols-4">
              {[
                ["Solved", `${stats.overall.solved}/${stats.overall.total}`],
                ["In progress", String(stats.overall.inProgress)],
                ["Completion", `${stats.overall.completionPercentage}%`],
                [
                  "Streak",
                  `${stats.streak} ${stats.streak === 1 ? "day" : "days"}`,
                ],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`py-4 ${index > 0 ? "border-l border-border pl-4" : ""} ${
                    index < 2 ? "border-b border-border sm:border-b-0" : ""
                  } ${index === 2 ? "sm:border-l sm:pl-4" : ""}`}
                >
                  <p className="font-mono text-xl">{value}</p>
                  <p className="eyebrow mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 h-1 w-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${stats.overall.completionPercentage}%` }}
              />
            </div>

            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">By difficulty</p>
                <div className="space-y-3">
                  {Object.entries(stats.difficulty).map(([name, values]) => (
                    <div key={name}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="capitalize text-muted-foreground">
                          {name.toLowerCase()}
                        </span>
                        <span className="font-mono text-[10px]">
                          {values.solved}/{values.total}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-muted">
                        <div
                          className="h-full bg-foreground/60"
                          style={{
                            width: `${values.total ? (values.solved / values.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="eyebrow mb-3">Top topics</p>
                <div className="border-t border-border">
                  {topTopics.map(([topic, values]) => (
                    <div
                      key={topic}
                      className="flex items-center justify-between border-b border-border py-2.5 text-xs"
                    >
                      <span className="capitalize text-muted-foreground">
                        {topic.toLowerCase().replace(/-/g, " ")}
                      </span>
                      <span className="font-mono text-[10px]">
                        {values.solved}/{values.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
