import { eq, sql } from "drizzle-orm";
import { db, userStats } from "@workspace/db";

export async function ensureUserStats(userId: number) {
  const rows = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db
    .insert(userStats)
    .values({ userId, totalPoints: 0, currentStreak: 0, longestStreak: 0, lastActiveDate: "" })
    .returning();
  return created;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function touchActivity(userId: number): Promise<void> {
  const stats = await ensureUserStats(userId);
  const today = todayDate();
  if (stats.lastActiveDate === today) return;
  let newStreak = 1;
  if (stats.lastActiveDate === yesterdayDate()) {
    newStreak = stats.currentStreak + 1;
  }
  const longest = Math.max(stats.longestStreak, newStreak);
  await db
    .update(userStats)
    .set({
      currentStreak: newStreak,
      longestStreak: longest,
      lastActiveDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userStats.id, stats.id));
}

export async function addPoints(userId: number, points: number): Promise<void> {
  const stats = await ensureUserStats(userId);
  await db
    .update(userStats)
    .set({ totalPoints: sql`${userStats.totalPoints} + ${points}` })
    .where(eq(userStats.id, stats.id));
}
