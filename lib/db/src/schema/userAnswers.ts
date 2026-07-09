import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { questions } from "./questions";
import { users } from "./users";

export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedIndex: integer("selected_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  answeredAt: timestamp("answered_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserAnswer = typeof userAnswers.$inferSelect;
