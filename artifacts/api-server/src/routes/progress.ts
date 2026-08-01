import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  userAnswers,
  userStats,
  testAttempts,
  questions,
  chapters,
  subjects,
  tests,
} from "@workspace/db";
import {
  GetProgressSummaryResponse,
  GetProgressBySubjectResponse,
  GetStreakResponse,
  GetActivityFeedResponse,
} from "@workspace/api-zod";
import { ensureUserStats } from "../lib/userStats";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function levelFor(points: number): string {
  if (points < 100) return "শিক্ষানবিশ";
  if (points < 500) return "অগ্রগামী";
  if (points < 1500) return "মেধাবী";
  if (points < 5000) return "বিশেষজ্ঞ";
  return "মাস্টার";
}

router.get("/progress/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const stats = await ensureUserStats(userId);
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

  res.json(
    GetProgressSummaryResponse.parse({
      totalPoints: stats.totalPoints,
      totalAnswered: agg?.total ?? 0,
      totalCorrect: agg?.correct ?? 0,
      accuracy,
      testsCompleted: tCount?.c ?? 0,
      currentStreak: stats.currentStreak,
      rank: 1,
      level: levelFor(stats.totalPoints),
    }),
  );
});

router.get("/progress/by-subject", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const subjectsList = await db.select().from(subjects).orderBy(subjects.id);
  const result = [];
  for (const s of subjectsList) {
    const [counts] = await db
      .select({
        answered: sql<number>`COUNT(${userAnswers.id})::int`,
        correct: sql<number>`COUNT(*) FILTER (WHERE ${userAnswers.isCorrect} = true)::int`,
      })
      .from(userAnswers)
      .innerJoin(questions, eq(questions.id, userAnswers.questionId))
      .innerJoin(chapters, eq(chapters.id, questions.chapterId))
      .where(and(eq(userAnswers.userId, userId), eq(chapters.subjectId, s.id)));

    const [total] = await db
      .select({ t: sql<number>`COUNT(${questions.id})::int` })
      .from(questions)
      .innerJoin(chapters, eq(chapters.id, questions.chapterId))
      .where(eq(chapters.subjectId, s.id));

    const answered = counts?.answered ?? 0;
    const correct = counts?.correct ?? 0;
    const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
    result.push({
      subjectId: s.id,
      subjectName: s.name,
      subjectNameBn: s.nameBn,
      color: s.color,
      answered,
      correct,
      accuracy,
      totalQuestions: total?.t ?? 0,
    });
  }
  res.json(GetProgressBySubjectResponse.parse(result));
});

router.get("/progress/streak", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const stats = await ensureUserStats(userId);
  const days: { day: string; count: number }[] = [];
  const dayLabelsBn = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
    const [row] = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(userAnswers)
      .where(
        sql`${userAnswers.userId} = ${userId} AND ${userAnswers.answeredAt} >= ${start} AND ${userAnswers.answeredAt} < ${end}`,
      );
    days.push({
      day: dayLabelsBn[d.getUTCDay()] ?? "",
      count: row?.c ?? 0,
    });
  }

  res.json(
    GetStreakResponse.parse({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastActiveDate: stats.lastActiveDate || "",
      weeklyActivity: days,
    }),
  );
});

router.get("/progress/activity", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const recentAnswers = await db
    .select({
      id: userAnswers.id,
      isCorrect: userAnswers.isCorrect,
      pointsEarned: userAnswers.pointsEarned,
      questionText: questions.questionText,
      answeredAt: userAnswers.answeredAt,
      subjectNameBn: subjects.nameBn,
    })
    .from(userAnswers)
    .innerJoin(questions, eq(questions.id, userAnswers.questionId))
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .where(eq(userAnswers.userId, userId))
    .orderBy(desc(userAnswers.answeredAt))
    .limit(10);

  const recentAttempts = await db
    .select({
      id: testAttempts.id,
      score: testAttempts.score,
      accuracy: testAttempts.accuracy,
      titleBn: tests.titleBn,
      completedAt: testAttempts.completedAt,
    })
    .from(testAttempts)
    .innerJoin(tests, eq(tests.id, testAttempts.testId))
    .where(eq(testAttempts.userId, userId))
    .orderBy(desc(testAttempts.completedAt))
    .limit(5);

  type Item = {
    id: number;
    type: string;
    title: string;
    detail: string;
    points: number;
    createdAt: Date;
  };

  const items: Item[] = [];
  for (const a of recentAnswers) {
    items.push({
      id: a.id * 10 + 1,
      type: a.isCorrect ? "correct" : "wrong",
      title: a.isCorrect ? "সঠিক উত্তর" : "ভুল উত্তর",
      detail: `${a.subjectNameBn} — ${a.questionText.slice(0, 60)}${a.questionText.length > 60 ? "…" : ""}`,
      points: a.pointsEarned,
      createdAt: a.answeredAt,
    });
  }
  for (const a of recentAttempts) {
    items.push({
      id: a.id * 10 + 2,
      type: "test",
      title: "টেস্ট সম্পন্ন",
      detail: `${a.titleBn} — ${Math.round(a.accuracy)}% সঠিক`,
      points: a.score,
      createdAt: a.completedAt,
    });
  }
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const out = items.slice(0, 15);
  res.json(GetActivityFeedResponse.parse(out));
});

export default router;
