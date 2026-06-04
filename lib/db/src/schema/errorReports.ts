import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { questions } from "./questions";

export const errorReports = pgTable("error_reports", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ErrorReport = typeof errorReports.$inferSelect;
