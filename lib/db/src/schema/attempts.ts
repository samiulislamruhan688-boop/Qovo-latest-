import { integer, pgTable, real, serial, timestamp } from "drizzle-orm/pg-core";
import { tests } from "./tests";

export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id")
    .notNull()
    .references(() => tests.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").notNull(),
  wrongCount: integer("wrong_count").notNull(),
  accuracy: real("accuracy").notNull(),
  timeTakenSeconds: integer("time_taken_seconds").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TestAttempt = typeof testAttempts.$inferSelect;
