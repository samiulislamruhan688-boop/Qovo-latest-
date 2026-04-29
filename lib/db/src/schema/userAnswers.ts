import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { questions } from "./questions";

export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedIndex: integer("selected_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  answeredAt: timestamp("answered_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserAnswer = typeof userAnswers.$inferSelect;
