import { Router, type IRouter } from "express";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, tests, questions, testAttempts } from "@workspace/db";
import {
  ListTestsResponse,
  GetTestParams,
  GetTestResponse,
  SubmitTestParams,
  SubmitTestBody,
  SubmitTestResponse,
  ListRecentAttemptsResponse,
} from "@workspace/api-zod";
import { addPoints, touchActivity } from "../lib/userStats";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/tests", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tests).orderBy(tests.id);
  const out = rows.map((t) => ({
    id: t.id,
    title: t.title,
    titleBn: t.titleBn,
    description: t.description,
    durationMinutes: t.durationMinutes,
    questionCount: t.questionIds.length,
    difficulty: t.difficulty,
    subjectName: t.subjectName,
  }));
  res.json(ListTestsResponse.parse(out));
});

router.get("/tests/attempts/recent", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const rows = await db
    .select({
      id: testAttempts.id,
      testId: testAttempts.testId,
      testTitle: tests.titleBn,
      score: testAttempts.score,
      totalQuestions: testAttempts.totalQuestions,
      accuracy: testAttempts.accuracy,
      completedAt: testAttempts.completedAt,
    })
    .from(testAttempts)
    .innerJoin(tests, eq(tests.id, testAttempts.testId))
    .where(eq(testAttempts.userId, userId))
    .orderBy(desc(testAttempts.completedAt))
    .limit(10);

  res.json(ListRecentAttemptsResponse.parse(rows));
});

router.get("/tests/:id", async (req, res): Promise<void> => {
  const params = GetTestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [test] = await db.select().from(tests).where(eq(tests.id, params.data.id));
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }
  const qs = await db
    .select()
    .from(questions)
    .where(inArray(questions.id, test.questionIds));

  const orderMap = new Map(test.questionIds.map((id, i) => [id, i]));
  qs.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  res.json(
    GetTestResponse.parse({
      id: test.id,
      title: test.title,
      titleBn: test.titleBn,
      description: test.description,
      durationMinutes: test.durationMinutes,
      difficulty: test.difficulty,
      questions: qs,
    }),
  );
});

router.post("/tests/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = SubmitTestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SubmitTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [test] = await db.select().from(tests).where(eq(tests.id, params.data.id));
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }

  const qs = await db.select().from(questions).where(inArray(questions.id, test.questionIds));
  const qMap = new Map(qs.map((q) => [q.id, q]));

  let correctCount = 0;
  let score = 0;
  for (const a of parsed.data.answers) {
    const q = qMap.get(a.questionId);
    if (q && q.correctIndex === a.selectedIndex) {
      correctCount++;
      score += q.difficulty === "hard" ? 15 : q.difficulty === "easy" ? 5 : 10;
    }
  }
  const totalQuestions = test.questionIds.length;
  const wrongCount = totalQuestions - correctCount;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  const [attempt] = await db
    .insert(testAttempts)
    .values({
      userId,
      testId: test.id,
      score,
      totalQuestions,
      correctCount,
      wrongCount,
      accuracy,
      timeTakenSeconds: parsed.data.timeTakenSeconds,
    })
    .returning();

  await addPoints(userId, score);
  await touchActivity(userId);

  const [rankRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(testAttempts)
    .where(sql`${testAttempts.testId} = ${test.id} AND ${testAttempts.score} > ${score}`);
  const rank = (rankRow?.count ?? 0) + 1;

  res.json(
    SubmitTestResponse.parse({
      attemptId: attempt.id,
      testId: test.id,
      score,
      totalQuestions,
      correctCount,
      wrongCount,
      accuracy,
      timeTakenSeconds: parsed.data.timeTakenSeconds,
      rank,
    }),
  );
});

export default router;
