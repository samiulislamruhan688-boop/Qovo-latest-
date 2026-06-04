import { Router, type IRouter } from "express";
import { eq, isNull, sql } from "drizzle-orm";
import { db, subjects, chapters, questions } from "@workspace/db";

const router: IRouter = Router();

// ── Active questions filter ──────────────────────────────────────────────────
const activeQ = isNull(questions.deletedAt);

// ── Sources list ─────────────────────────────────────────────────────────────
router.get("/source-nav/sources", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      source: questions.source,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(questions)
    .where(sql`${questions.source} IS NOT NULL AND trim(${questions.source}) != '' AND ${questions.deletedAt} IS NULL`)
    .groupBy(questions.source)
    .orderBy(sql`COUNT(*) DESC`);
  res.json(rows.map((r) => ({ source: r.source!, count: r.count })));
});

// ── Source insight ────────────────────────────────────────────────────────────
router.get("/source-nav/insight", async (req, res): Promise<void> => {
  const source = String(req.query.source ?? "").trim();
  if (!source) { res.status(400).json({ error: "source required" }); return; }

  const [totals] = await db
    .select({
      totalQuestions: sql<number>`COUNT(${questions.id})::int`,
      totalSubjects:  sql<number>`COUNT(DISTINCT ${chapters.subjectId})::int`,
      totalChapters:  sql<number>`COUNT(DISTINCT ${questions.chapterId})::int`,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .where(sql`${questions.source} = ${source} AND ${questions.deletedAt} IS NULL`);

  const recent = await db
    .select({ id: questions.id, questionText: questions.questionText })
    .from(questions)
    .where(sql`${questions.source} = ${source} AND ${questions.deletedAt} IS NULL`)
    .orderBy(sql`${questions.id} DESC`)
    .limit(3);

  res.json({ ...totals, recentQuestions: recent });
});

// ── Subjects within a source ──────────────────────────────────────────────────
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
    .where(sql`${questions.source} = ${source} AND ${questions.deletedAt} IS NULL`)
    .groupBy(subjects.id)
    .orderBy(sql`COUNT(${questions.id}) DESC`);
  res.json(rows);
});

// ── Chapters within a source + subject ───────────────────────────────────────
router.get("/source-nav/chapters", async (req, res): Promise<void> => {
  const source    = String(req.query.source    ?? "").trim();
  const subjectId = Number(req.query.subjectId);
  if (!source || !subjectId) { res.status(400).json({ error: "source and subjectId required" }); return; }
  const rows = await db
    .select({
      chapterId:   chapters.id,
      chapterName: chapters.nameBn,
      orderIndex:  chapters.orderIndex,
      count: sql<number>`COUNT(${questions.id})::int`,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .where(sql`${questions.source} = ${source} AND ${chapters.subjectId} = ${subjectId} AND ${questions.deletedAt} IS NULL`)
    .groupBy(chapters.id)
    .orderBy(chapters.orderIndex);
  res.json(rows);
});

// ── Questions within a source + chapter ──────────────────────────────────────
router.get("/source-nav/questions", async (req, res): Promise<void> => {
  const source    = String(req.query.source    ?? "").trim();
  const chapterId = Number(req.query.chapterId);
  if (!source || !chapterId) { res.status(400).json({ error: "source and chapterId required" }); return; }
  const rows = await db
    .select()
    .from(questions)
    .where(sql`${questions.source} = ${source} AND ${questions.chapterId} = ${chapterId} AND ${questions.deletedAt} IS NULL`)
    .orderBy(questions.id);
  res.json(rows);
});

// ── Year Explorer: available years ────────────────────────────────────────────
router.get("/source-nav/years", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      year:  questions.year,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(questions)
    .where(sql`${questions.year} IS NOT NULL AND ${questions.deletedAt} IS NULL`)
    .groupBy(questions.year)
    .orderBy(sql`${questions.year} DESC`);
  res.json(rows.map((r) => ({ year: r.year!, count: r.count })));
});

// ── Year Explorer: subjects within a year ─────────────────────────────────────
router.get("/source-nav/year-subjects", async (req, res): Promise<void> => {
  const year = Number(req.query.year);
  if (!year) { res.status(400).json({ error: "year required" }); return; }
  const rows = await db
    .select({
      subjectId:   subjects.id,
      subjectName: subjects.nameBn,
      subjectColor: subjects.color,
      count: sql<number>`COUNT(${questions.id})::int`,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .where(sql`${questions.year} = ${year} AND ${questions.deletedAt} IS NULL`)
    .groupBy(subjects.id)
    .orderBy(sql`COUNT(${questions.id}) DESC`);
  res.json(rows);
});

// ── Year Explorer: chapters within year + subject ────────────────────────────
router.get("/source-nav/year-chapters", async (req, res): Promise<void> => {
  const year      = Number(req.query.year);
  const subjectId = Number(req.query.subjectId);
  if (!year || !subjectId) { res.status(400).json({ error: "year and subjectId required" }); return; }
  const rows = await db
    .select({
      chapterId:   chapters.id,
      chapterName: chapters.nameBn,
      orderIndex:  chapters.orderIndex,
      count: sql<number>`COUNT(${questions.id})::int`,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .where(sql`${questions.year} = ${year} AND ${chapters.subjectId} = ${subjectId} AND ${questions.deletedAt} IS NULL`)
    .groupBy(chapters.id)
    .orderBy(chapters.orderIndex);
  res.json(rows);
});

// ── Year Explorer: questions within year + chapter ────────────────────────────
router.get("/source-nav/year-questions", async (req, res): Promise<void> => {
  const year      = Number(req.query.year);
  const chapterId = Number(req.query.chapterId);
  if (!year || !chapterId) { res.status(400).json({ error: "year and chapterId required" }); return; }
  const rows = await db
    .select()
    .from(questions)
    .where(sql`${questions.year} = ${year} AND ${questions.chapterId} = ${chapterId} AND ${questions.deletedAt} IS NULL`)
    .orderBy(questions.id);
  res.json(rows);
});

// ── unused variable suppression ──────────────────────────────────────────────
void activeQ;

export default router;
