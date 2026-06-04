import { Router, type IRouter } from "express";
import { eq, isNull, isNotNull, sql, inArray, and, ilike, or } from "drizzle-orm";
import { db, questions, chapters, subjects, errorReports } from "@workspace/db";

const router: IRouter = Router();

// ── Soft delete (move to trash) ──────────────────────────────────────────────
router.patch("/questions/:id/trash", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const updated = await db
    .update(questions)
    .set({ deletedAt: new Date() })
    .where(and(eq(questions.id, id), isNull(questions.deletedAt)))
    .returning({ id: questions.id });
  if (!updated.length) { res.status(404).json({ error: "Question not found or already deleted" }); return; }
  res.json({ trashed: true, id });
});

// ── Bulk soft delete ─────────────────────────────────────────────────────────
router.post("/questions/bulk-trash", async (req, res): Promise<void> => {
  const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) { res.status(400).json({ error: "ids required" }); return; }
  await db
    .update(questions)
    .set({ deletedAt: new Date() })
    .where(and(inArray(questions.id, ids), isNull(questions.deletedAt)));
  res.json({ trashed: true, count: ids.length });
});

// ── Restore from trash ───────────────────────────────────────────────────────
router.patch("/questions/:id/restore", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const updated = await db
    .update(questions)
    .set({ deletedAt: null })
    .where(and(eq(questions.id, id), isNotNull(questions.deletedAt)))
    .returning({ id: questions.id });
  if (!updated.length) { res.status(404).json({ error: "Question not found or not in trash" }); return; }
  res.json({ restored: true, id });
});

// ── Bulk restore ─────────────────────────────────────────────────────────────
router.post("/questions/bulk-restore", async (req, res): Promise<void> => {
  const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) { res.status(400).json({ error: "ids required" }); return; }
  await db
    .update(questions)
    .set({ deletedAt: null })
    .where(and(inArray(questions.id, ids), isNotNull(questions.deletedAt)));
  res.json({ restored: true, count: ids.length });
});

// ── Permanent delete (only from trash) ───────────────────────────────────────
router.delete("/questions/:id/permanent", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const deleted = await db
    .delete(questions)
    .where(and(eq(questions.id, id), isNotNull(questions.deletedAt)))
    .returning({ id: questions.id });
  if (!deleted.length) { res.status(404).json({ error: "Question not in trash" }); return; }
  res.json({ deleted: true, id });
});

// ── Purge (auto-delete questions in trash > 30 days) ─────────────────────────
router.delete("/admin/trash/purge", async (_req, res): Promise<void> => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const purged = await db
    .delete(questions)
    .where(and(isNotNull(questions.deletedAt), sql`${questions.deletedAt} < ${cutoff}`))
    .returning({ id: questions.id });
  res.json({ purged: purged.length });
});

// ── Trash list ────────────────────────────────────────────────────────────────
router.get("/admin/trash", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      options: questions.options,
      correctIndex: questions.correctIndex,
      difficulty: questions.difficulty,
      source: questions.source,
      year: questions.year,
      deletedAt: questions.deletedAt,
      chapterId: questions.chapterId,
      chapterName: chapters.nameBn,
      subjectId: subjects.id,
      subjectName: subjects.nameBn,
      subjectColor: subjects.color,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .where(isNotNull(questions.deletedAt))
    .orderBy(sql`${questions.deletedAt} DESC`)
    .limit(200);
  res.json(rows);
});

// ── Advanced search ───────────────────────────────────────────────────────────
router.get("/admin/search", async (req, res): Promise<void> => {
  const keyword  = String(req.query.keyword  ?? "").trim();
  const subjectId = Number(req.query.subjectId) || null;
  const chapterId = Number(req.query.chapterId) || null;
  const difficulty = String(req.query.difficulty ?? "").trim() || null;
  const year      = Number(req.query.year)       || null;
  const source    = String(req.query.source ?? "").trim() || null;

  const conditions = [isNull(questions.deletedAt)];
  if (keyword) {
    conditions.push(ilike(questions.questionText, `%${keyword}%`));
  }
  if (difficulty) conditions.push(eq(questions.difficulty, difficulty));
  if (year)       conditions.push(eq(questions.year, year));
  if (source)     conditions.push(eq(questions.source, source));
  if (chapterId)  conditions.push(eq(questions.chapterId, chapterId));

  const rows = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      options: questions.options,
      correctIndex: questions.correctIndex,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      source: questions.source,
      year: questions.year,
      hint: questions.hint,
      chapterId: questions.chapterId,
      chapterName: chapters.nameBn,
      subjectId: subjects.id,
      subjectName: subjects.nameBn,
      subjectColor: subjects.color,
    })
    .from(questions)
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .where(and(...conditions, subjectId ? eq(subjects.id, subjectId) : undefined))
    .orderBy(questions.id)
    .limit(100);
  res.json(rows);
});

// ── Error report: create ──────────────────────────────────────────────────────
router.post("/questions/:id/report", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const reason  = String(req.body?.reason  ?? "").trim();
  const details = String(req.body?.details ?? "").trim() || null;
  if (!reason) { res.status(400).json({ error: "reason required" }); return; }
  const [report] = await db
    .insert(errorReports)
    .values({ questionId: id, reason, details })
    .returning();
  res.json(report);
});

// ── Error report: list ────────────────────────────────────────────────────────
router.get("/admin/reports", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: errorReports.id,
      questionId: errorReports.questionId,
      reason: errorReports.reason,
      details: errorReports.details,
      createdAt: errorReports.createdAt,
      questionText: questions.questionText,
      chapterName: chapters.nameBn,
      subjectName: subjects.nameBn,
    })
    .from(errorReports)
    .innerJoin(questions, eq(questions.id, errorReports.questionId))
    .innerJoin(chapters, eq(chapters.id, questions.chapterId))
    .innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .orderBy(sql`${errorReports.createdAt} DESC`)
    .limit(200);
  res.json(rows);
});

// ── Error report: dismiss (delete) ───────────────────────────────────────────
router.delete("/admin/reports/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  await db.delete(errorReports).where(eq(errorReports.id, id));
  res.json({ dismissed: true, id });
});

export default router;
