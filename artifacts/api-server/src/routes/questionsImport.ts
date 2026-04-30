import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, subjects, chapters, questions } from "@workspace/db";
import {
  ImportQuestionsBody,
  ImportQuestionsResponse,
  GetQuestionStatsResponse,
} from "@workspace/api-zod";
import { parseQuestionCode, type ParsedQuestion } from "../lib/parseQuestionCode";

const router: IRouter = Router();

router.get("/questions/stats", async (_req, res): Promise<void> => {
  const [{ q }] = await db
    .select({ q: sql<number>`COUNT(*)::int` })
    .from(questions);
  const [{ s }] = await db
    .select({ s: sql<number>`COUNT(*)::int` })
    .from(subjects);
  const [{ c }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(chapters);
  const sources = await db
    .select({
      source: questions.source,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(questions)
    .where(sql`${questions.source} IS NOT NULL`)
    .groupBy(questions.source)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(20);

  res.json(
    GetQuestionStatsResponse.parse({
      totalQuestions: q,
      totalSubjects: s,
      totalChapters: c,
      bySource: sources.map((row) => ({ source: row.source ?? "অজানা", count: row.count })),
    }),
  );
});

router.post("/questions/import", async (req, res): Promise<void> => {
  const parsed = ImportQuestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { questions: parsedQuestions, errors } = parseQuestionCode(parsed.data.code);

  // Deduplication maps
  const subjectCache = new Map<string, number>();
  const chapterCache = new Map<string, number>(); // key = `${subjectId}::${chapterName}`
  const createdSubjects: string[] = [];
  const createdChapters: string[] = [];

  // Preload existing
  const existingSubjects = await db.select().from(subjects);
  for (const s of existingSubjects) {
    subjectCache.set(s.nameBn, s.id);
    subjectCache.set(s.name.toLowerCase(), s.id);
  }
  const existingChapters = await db.select().from(chapters);
  for (const c of existingChapters) {
    chapterCache.set(`${c.subjectId}::${c.nameBn}`, c.id);
    chapterCache.set(`${c.subjectId}::${c.name.toLowerCase()}`, c.id);
  }

  async function getOrCreateSubject(name: string): Promise<number> {
    const key1 = name;
    const key2 = name.toLowerCase();
    if (subjectCache.has(key1)) return subjectCache.get(key1)!;
    if (subjectCache.has(key2)) return subjectCache.get(key2)!;
    const colors = ["#06B6D4", "#A855F7", "#F97316", "#10B981", "#3B82F6", "#EC4899", "#F59E0B", "#EF4444", "#14B8A6", "#8B5CF6"];
    const color = colors[(subjectCache.size + createdSubjects.length) % colors.length];
    const [created] = await db
      .insert(subjects)
      .values({
        name: name,
        nameBn: name,
        icon: "BookMarked",
        color,
        description: `${name} সংক্রান্ত প্রশ্ন।`,
      })
      .returning();
    subjectCache.set(name, created.id);
    subjectCache.set(name.toLowerCase(), created.id);
    createdSubjects.push(name);
    return created.id;
  }

  async function getOrCreateChapter(subjectId: number, name: string): Promise<number> {
    const key1 = `${subjectId}::${name}`;
    const key2 = `${subjectId}::${name.toLowerCase()}`;
    if (chapterCache.has(key1)) return chapterCache.get(key1)!;
    if (chapterCache.has(key2)) return chapterCache.get(key2)!;
    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${chapters.orderIndex}), -1)::int` })
      .from(chapters)
      .where(eq(chapters.subjectId, subjectId));
    const [created] = await db
      .insert(chapters)
      .values({
        subjectId,
        name: name,
        nameBn: name,
        orderIndex: (maxOrder ?? -1) + 1,
      })
      .returning();
    chapterCache.set(key1, created.id);
    chapterCache.set(key2, created.id);
    createdChapters.push(name);
    return created.id;
  }

  let added = 0;
  let skipped = 0;
  const allErrors = [...errors];

  for (const q of parsedQuestions) {
    try {
      const subjectId = await getOrCreateSubject(q.subjectName);
      const chapterId = await getOrCreateChapter(subjectId, q.chapterName);

      // De-dup: skip if same questionText already exists in same chapter
      const existing = await db
        .select({ id: questions.id })
        .from(questions)
        .where(
          sql`${questions.chapterId} = ${chapterId} AND ${questions.questionText} = ${q.questionText}`,
        )
        .limit(1);
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(questions).values({
        chapterId,
        questionText: q.questionText,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
        source: q.source,
        year: q.year,
        hint: q.hint,
      } satisfies Omit<ParsedQuestion, "subjectName" | "chapterName" | "startLine"> & { chapterId: number });
      added++;
    } catch (err) {
      allErrors.push({
        line: q.startLine,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  res.json(
    ImportQuestionsResponse.parse({
      added,
      skipped,
      errors: allErrors,
      createdSubjects,
      createdChapters,
    }),
  );
});

export default router;
