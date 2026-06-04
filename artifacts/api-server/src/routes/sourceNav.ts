import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, subjects, chapters, questions } from "@workspace/db";

const router: IRouter = Router();

router.get("/source-nav/sources", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      source: questions.source,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(questions)
    .where(sql`${questions.source} IS NOT NULL AND trim(${questions.source}) != ''`)
    .groupBy(questions.source)
    .orderBy(sql`COUNT(*) DESC`);
  res.json(rows.map((r) => ({ source: r.source!, count: r.count })));
});

router.get("/source-nav/subjects", async (req, res): Promise<void> => {
  const source = String(req.query.source ?? "").trim();
  if (!source) { res.status(400).json({ error: "source required" }); return; }
  const rows = await db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.nameBn,
      subjectColor: subjects.color,
      subjectIcon: subjects.icon,
      count: sql<number>`COUNT(${questions.id})::int`,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .where(eq(questions.source, source))
    .groupBy(subjects.id)
    .orderBy(sql`COUNT(${questions.id}) DESC`);
  res.json(rows);
});

router.get("/source-nav/chapters", async (req, res): Promise<void> => {
  const source = String(req.query.source ?? "").trim();
  const subjectId = Number(req.query.subjectId);
  if (!source || !subjectId) { res.status(400).json({ error: "source and subjectId required" }); return; }
  const rows = await db
    .select({
      chapterId: chapters.id,
      chapterName: chapters.nameBn,
      orderIndex: chapters.orderIndex,
      count: sql<number>`COUNT(${questions.id})::int`,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .where(sql`${questions.source} = ${source} AND ${chapters.subjectId} = ${subjectId}`)
    .groupBy(chapters.id)
    .orderBy(chapters.orderIndex);
  res.json(rows);
});

router.get("/source-nav/questions", async (req, res): Promise<void> => {
  const source = String(req.query.source ?? "").trim();
  const chapterId = Number(req.query.chapterId);
  if (!source || !chapterId) { res.status(400).json({ error: "source and chapterId required" }); return; }
  const rows = await db
    .select()
    .from(questions)
    .where(sql`${questions.source} = ${source} AND ${questions.chapterId} = ${chapterId}`)
    .orderBy(questions.id);
  res.json(rows);
});

export default router;
