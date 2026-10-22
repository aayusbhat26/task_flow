"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: number;
  pointsReward: number;
  rarity: string;
  userProgress: {
    progress: number;
    isCompleted: boolean;
    unlockedAt?: string;
  };
}

interface LeaderboardUser {
  rank: number;
  score: number;
  user: {
    id: string;
    name: string | null;
    username: string;
    level: number;
    currentTitle: string | null;
  };
}

const rarityLabel: Record<string, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};

export default function SimpleAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/gaming/achievements").then((response) =>
        response.ok ? response.json() : []
      ),
      fetch("/api/gaming/leaderboard?limit=200").then((response) =>
        response.ok ? response.json() : []
      ),
    ])
      .then(([achievementData, leaderboardData]) => {
        if (!active) return;
        if (Array.isArray(achievementData)) setAchievements(achievementData);
        if (Array.isArray(leaderboardData)) setLeaderboard(leaderboardData);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const completed = achievements.filter((a) => a.userProgress.isCompleted);
  const inProgress = achievements.filter(
    (a) => !a.userProgress.isCompleted && a.userProgress.progress > 0
  );
  const locked = achievements.filter(
    (a) => !a.userProgress.isCompleted && a.userProgress.progress === 0
  );

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="border-b border-border pb-6">
        <p className="eyebrow">Milestones</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
          Achievements
        </h1>
        <p className="mt-3 max-w-[460px] text-sm leading-relaxed text-muted-foreground">
          A record of consistent work. Milestones unlock as tasks, focus rounds
          and practice problems accumulate.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse border border-border bg-card" />
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <p className="mt-8 border border-border bg-card p-6 text-sm text-muted-foreground">
          No milestones are configured yet. Once the milestone library is
          available, progress from tasks and focus rounds will appear here.
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
            {[
              ["Unlocked", completed.length],
              ["In progress", inProgress.length],
              ["Available", locked.length],
            ].map(([label, value]) => (
              <div key={label} className="bg-card p-5">
                <p className="font-mono text-2xl">{value}</p>
                <p className="eyebrow mt-1">{label}</p>
              </div>
            ))}
          </div>

          {completed.length > 0 && (
            <section className="mt-10">
              <p className="eyebrow mb-3">Unlocked</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </section>
          )}

          {inProgress.length > 0 && (
            <section className="mt-10">
              <p className="eyebrow mb-3">In progress</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} showProgress />
                ))}
              </div>
            </section>
          )}

          {locked.length > 0 && (
            <section className="mt-10">
              <p className="eyebrow mb-3">Available</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locked.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {leaderboard.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h2 className="mt-2 font-display text-3xl leading-none">
                The long table.
              </h2>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              Top 10 of {leaderboard.length} ranked
            </p>
          </div>

          <div className="mt-5 border border-border bg-border">
            <div className="hidden grid-cols-[52px_1fr_90px_100px] gap-4 bg-card px-4 py-2.5 sm:grid">
              <span className="eyebrow">Rank</span>
              <span className="eyebrow">Member</span>
              <span className="eyebrow">Level</span>
              <span className="eyebrow text-right">Points</span>
            </div>
            {leaderboard.slice(0, 10).map((entry) => (
              <div
                key={entry.user.id}
                className="mt-px grid grid-cols-[34px_1fr_auto] items-center gap-3 bg-card px-4 py-3 transition-colors hover:bg-secondary/40 sm:grid-cols-[52px_1fr_90px_100px] sm:gap-4"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(entry.rank).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
                    {(entry.user.name || entry.user.username).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {entry.user.name || entry.user.username}
                    </p>
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                      @{entry.user.username}
                      {entry.user.currentTitle ? ` · ${entry.user.currentTitle}` : ""}
                    </p>
                  </div>
                </div>
                <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
                  {entry.user.level}
                </span>
                <span className="text-right font-mono text-xs">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">
            All-time points across every workspace. Rankings refresh as members
            complete tasks, focus sessions and practice problems.
          </p>
        </section>
      )}
    </div>
  );
}

function AchievementCard({
  achievement,
  showProgress = false,
}: {
  achievement: Achievement;
  showProgress?: boolean;
}) {
  const { userProgress } = achievement;
  const percent = Math.min(
    100,
    (userProgress.progress / Math.max(1, achievement.requirement)) * 100
  );

  return (
    <Card className={userProgress.isCompleted ? "" : "bg-card/60"}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              {rarityLabel[achievement.rarity] ?? achievement.rarity}
            </p>
            <h3 className="mt-1.5 text-[13px] font-medium">{achievement.name}</h3>
          </div>
          <span className="font-mono text-[10px] text-primary">
            +{achievement.pointsReward}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {achievement.description}
        </p>
        {showProgress && (
          <div className="mt-4">
            <Progress value={percent} className="h-1" />
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              {userProgress.progress} / {achievement.requirement}
            </p>
          </div>
        )}
        {userProgress.isCompleted && (
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-primary">
            Unlocked
            {userProgress.unlockedAt
              ? ` · ${new Date(userProgress.unlockedAt).toLocaleDateString()}`
              : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
