import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
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

export default router;
