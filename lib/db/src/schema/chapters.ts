import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { subjects } from "./subjects";

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export type Chapter = typeof chapters.$inferSelect;
