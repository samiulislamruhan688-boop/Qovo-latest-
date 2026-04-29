import { integer, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleBn: text("title_bn").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  difficulty: text("difficulty").notNull().default("medium"),
  subjectName: text("subject_name").notNull(),
  questionIds: jsonb("question_ids").$type<number[]>().notNull(),
});

export type Test = typeof tests.$inferSelect;
