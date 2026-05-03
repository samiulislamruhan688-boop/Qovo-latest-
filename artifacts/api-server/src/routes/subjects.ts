import { Router, type IRouter } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import { db, subjects, chapters, questions } from "@workspace/db";
import {
  ListSubjectsResponse,
  ListChaptersBySubjectParams,
  ListChaptersBySubjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      nameBn: subjects.nameBn,
      icon: subjects.icon,
      color: subjects.color,
      description: subjects.description,
      category: subjects.category,
      chapterCount: sql<number>`COALESCE(COUNT(DISTINCT ${chapters.id}), 0)::int`,
      questionCount: sql<number>`COALESCE(COUNT(${questions.id}), 0)::int`,
    })
    .from(subjects)
    .leftJoin(chapters, eq(chapters.subjectId, subjects.id))
    .leftJoin(questions, eq(questions.chapterId, chapters.id))
    .groupBy(subjects.id)
    .orderBy(subjects.id);

  res.json(ListSubjectsResponse.parse(rows));
});

router.get("/subjects/:id/chapters", async (req, res): Promise<void> => {
  const params = ListChaptersBySubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({
      id: chapters.id,
      subjectId: chapters.subjectId,
      name: chapters.name,
      nameBn: chapters.nameBn,
      orderIndex: chapters.orderIndex,
      questionCount: sql<number>`COALESCE(COUNT(${questions.id}), 0)::int`,
    })
    .from(chapters)
    .leftJoin(questions, eq(questions.chapterId, chapters.id))
    .where(eq(chapters.subjectId, params.data.id))
    .groupBy(chapters.id)
    .orderBy(chapters.orderIndex);

  res.json(ListChaptersBySubjectResponse.parse(rows));
});

// GET /api/subjects/:id/questions?limit=25  — random questions from a subject
router.get("/subjects/:id/questions", async (req, res): Promise<void> => {
  const subjectId = Number(req.params.id);
  if (!subjectId) { res.status(400).json({ error: "invalid id" }); return; }
  const limit = Math.min(Math.max(Number(req.query.limit ?? 25), 5), 100);

  // All chapter ids for this subject
  const subjectChapters = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.subjectId, subjectId));

  if (subjectChapters.length === 0) { res.json([]); return; }

  const chapterIds = subjectChapters.map((c) => c.id);

  const rows = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      options: questions.options,
      correctIndex: questions.correctIndex,
      explanation: questions.explanation,
      hint: questions.hint,
      difficulty: questions.difficulty,
      chapterId: questions.chapterId,
    })
    .from(questions)
    .where(inArray(questions.chapterId, chapterIds))
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  res.json(rows);
});

export default router;
