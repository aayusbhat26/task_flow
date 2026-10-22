import { db } from "@/lib/db";
import { defaultAchievements } from "@/data/defaultGameData";

let seeding: Promise<void> | null = null;

export async function ensureGameDataSeeded() {
  const existing = await db.achievement.count();
  if (existing > 0) return;

  if (!seeding) {
    seeding = (async () => {
      await db.achievement.createMany({
        data: defaultAchievements as any,
        skipDuplicates: true,
      });

      const settings = await db.gameSettings.findFirst();
      if (!settings) {
        await db.gameSettings.create({
          data: {
            experiencePerLevel: 1000,
            experienceMultiplier: 1.5,
            maxLevel: 100,
            streakBonusThreshold: 7,
            streakBonusMultiplier: 1.5,
            dailyPointsLimit: 1000,
          },
        });
      }
    })().finally(() => {
      seeding = null;
    });
  }

  await seeding;
}
