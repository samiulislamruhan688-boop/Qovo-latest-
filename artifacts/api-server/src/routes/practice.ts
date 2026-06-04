import { Router, type IRouter } from "express";
import { eq, isNull, sql } from "drizzle-orm";
import { db, questions, userAnswers, userStats } from "@workspace/db";
import {
  ListQuestionsByChapterParams,
  ListQuestionsByChapterResponse,
  SubmitPracticeAnswerBody,
  SubmitPracticeAnswerResponse,
} from "@workspace/api-zod";
import { ensureUserStats, touchActivity } from "../lib/userStats";

const router: IRouter = Router();

router.get("/chapters/:id/questions", async (req, res): Promise<void> => {
  const params = ListQuestionsByChapterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.chapterId, params.data.id) && isNull(questions.deletedAt))
    .orderBy(questions.id);

  res.json(ListQuestionsByChapterResponse.parse(rows));
});

router.post("/practice/submit", async (req, res): Promise<void> => {
  const parsed = SubmitPracticeAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [q] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, parsed.data.questionId));

  if (!q) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const correct = q.correctIndex === parsed.data.selectedIndex;
  const pointsEarned = correct ? (q.difficulty === "hard" ? 15 : q.difficulty === "easy" ? 5 : 10) : 0;

  await db.insert(userAnswers).values({
    questionId: q.id,
    selectedIndex: parsed.data.selectedIndex,
    isCorrect: correct,
    pointsEarned,
  });

  if (correct) {
    const stats = await ensureUserStats();
    await db
      .update(userStats)
      .set({ totalPoints: sql`${userStats.totalPoints} + ${pointsEarned}` })
      .where(eq(userStats.id, stats.id));
  }
  await touchActivity();

  res.json(
    SubmitPracticeAnswerResponse.parse({
      correct,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      pointsEarned,
    }),
  );
});

// Soft delete (move to trash) — kept for backward-compat with old clients
router.delete("/questions/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const updated = await db
    .update(questions)
    .set({ deletedAt: new Date() })
    .where(eq(questions.id, id) && isNull(questions.deletedAt))
    .returning({ id: questions.id });
  if (!updated.length) { res.status(404).json({ error: "Question not found" }); return; }
  res.json({ trashed: true, id });
});

export default router;
