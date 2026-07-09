import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, userAnswers, testAttempts, users } from "@workspace/db";
import { GetLeaderboardResponse } from "@workspace/api-zod";
import { ensureUserStats } from "../lib/userStats";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const fakeStudents = [
  { name: "তানজিম হাসান", color: "#F97316", points: 4280, accuracy: 92.4, testsCompleted: 38 },
  { name: "সাবরিনা ইসলাম", color: "#EC4899", points: 3920, accuracy: 89.1, testsCompleted: 34 },
  { name: "আরিফুল করিম", color: "#8B5CF6", points: 3540, accuracy: 87.6, testsCompleted: 31 },
  { name: "নুসরাত জাহান", color: "#10B981", points: 3210, accuracy: 85.3, testsCompleted: 29 },
  { name: "ইমরান হোসেন", color: "#06B6D4", points: 2980, accuracy: 84.7, testsCompleted: 27 },
  { name: "ফারিহা রহমান", color: "#F59E0B", points: 2640, accuracy: 82.1, testsCompleted: 24 },
  { name: "মেহেদী হাসান", color: "#3B82F6", points: 2310, accuracy: 80.4, testsCompleted: 21 },
  { name: "তাসনিয়া আক্তার", color: "#EF4444", points: 1980, accuracy: 78.9, testsCompleted: 19 },
  { name: "সাইফুল ইসলাম", color: "#14B8A6", points: 1740, accuracy: 77.2, testsCompleted: 17 },
  { name: "জারিন তাসনিম", color: "#A855F7", points: 1520, accuracy: 75.8, testsCompleted: 15 },
];

router.get("/leaderboard", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const stats = await ensureUserStats(userId);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  const [agg] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      correct: sql<number>`COUNT(*) FILTER (WHERE ${userAnswers.isCorrect} = true)::int`,
    })
    .from(userAnswers)
    .where(eq(userAnswers.userId, userId));
  const [tCount] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(testAttempts)
    .where(eq(testAttempts.userId, userId));

  const accuracy = (agg?.total ?? 0) > 0 ? ((agg?.correct ?? 0) / (agg?.total ?? 1)) * 100 : 0;
  const displayName = user?.displayName ?? user?.name ?? "আপনি";

  const me = {
    name: displayName,
    avatarColor: "#0EA5E9",
    points: stats.totalPoints,
    accuracy,
    testsCompleted: tCount?.c ?? 0,
    isCurrentUser: true,
  };

  const all = [
    ...fakeStudents.map((s) => ({
      name: s.name,
      avatarColor: s.color,
      points: s.points,
      accuracy: s.accuracy,
      testsCompleted: s.testsCompleted,
      isCurrentUser: false,
    })),
    me,
  ];
  all.sort((a, b) => b.points - a.points);
  const ranked = all.map((s, i) => ({ ...s, rank: i + 1 }));

  res.json(GetLeaderboardResponse.parse(ranked));
});

export default router;
