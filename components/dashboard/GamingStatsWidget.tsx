"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

interface AchievementStats {
  totalAchievements: number;
  completedAchievements: number;
  inProgressAchievements: number;
  recentAchievements: number;
  completionPercentage: number;
  totalPointsFromAchievements: number;
  categoryStats: Record<string, number>;
  rarityStats: Record<string, number>;
}

const emptyStats: AchievementStats = {
  totalAchievements: 0,
  completedAchievements: 0,
  inProgressAchievements: 0,
  recentAchievements: 0,
  completionPercentage: 0,
  totalPointsFromAchievements: 0,
  categoryStats: {},
  rarityStats: {},
};

export default function GamingStatsWidget() {
  const [stats, setStats] = useState<AchievementStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    let active = true;
    fetch("/api/gaming/achievements/stats")
      .then((res) => (res.ok ? res.json() : emptyStats))
      .then((data) => {
        if (active) setStats({ ...emptyStats, ...data });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Milestones</p>
            <h2 className="mt-2 font-display text-2xl leading-none">
              Achievements
            </h2>
          </div>
          <Link
            href={`/${locale}/gaming`}
            className="inline-flex h-8 items-center gap-1.5 border border-border px-3 text-xs transition-colors hover:bg-secondary"
          >
            View all
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-12 animate-pulse bg-muted/60" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border">
              <div className="py-4 pr-4">
                <p className="font-mono text-xl">{stats.completedAchievements}</p>
                <p className="eyebrow mt-1">Unlocked</p>
              </div>
              <div className="px-4 py-4">
                <p className="font-mono text-xl">{stats.completionPercentage}%</p>
                <p className="eyebrow mt-1">Complete</p>
              </div>
              <div className="py-4 pl-4">
                <p className="font-mono text-xl">{stats.totalPointsFromAchievements}</p>
                <p className="eyebrow mt-1">Points earned</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              {stats.totalAchievements === 0
                ? "No milestones are available yet. Complete tasks, focus rounds and practice problems to unlock the first one."
                : `${
                    stats.totalAchievements - stats.completedAchievements
                  } milestones remain. Small, consistent work counts.`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
