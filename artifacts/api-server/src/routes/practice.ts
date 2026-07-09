import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db, questions, userAnswers } from "@workspace/db";
import {
  ListQuestionsByChapterParams,
  ListQuestionsByChapterResponse,
  SubmitPracticeAnswerBody,
  SubmitPracticeAnswerResponse,
} from "@workspace/api-zod";
import { addPoints, touchActivity } from "../lib/userStats";
import { requireAuth } from "../lib/auth";

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers["x-admin-token"] as string | undefined;
  const pin   = process.env.ADMIN_PIN;
  if (!pin) { res.status(500).json({ error: "Admin PIN not configured" }); return; }
  if (!token) { res.status(403).json({ error: "Admin access required" }); return; }
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    if (decoded !== `admin:${pin}`) { res.status(403).json({ error: "Invalid admin token" }); return; }
  } catch { res.status(403).json({ error: "Invalid admin token" }); return; }
  next();
}

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
    .where(and(eq(questions.chapterId, params.data.id), isNull(questions.deletedAt)))
    .orderBy(questions.id);

  res.json(ListQuestionsByChapterResponse.parse(rows));
});

router.post("/practice/submit", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
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
    userId,
    questionId: q.id,
    selectedIndex: parsed.data.selectedIndex,
    isCorrect: correct,
    pointsEarned,
  });

  if (correct) {
    await addPoints(userId, pointsEarned);
  }
  await touchActivity(userId);

  res.json(
    SubmitPracticeAnswerResponse.parse({
      correct,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      pointsEarned,
    }),
  );
});

// Soft delete (move to trash) — admin only
router.delete("/questions/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const updated = await db
    .update(questions)
    .set({ deletedAt: new Date() })
    .where(and(eq(questions.id, id), isNull(questions.deletedAt)))
    .returning({ id: questions.id });
  if (!updated.length) { res.status(404).json({ error: "Question not found" }); return; }
  res.json({ trashed: true, id });
});

export default router;
