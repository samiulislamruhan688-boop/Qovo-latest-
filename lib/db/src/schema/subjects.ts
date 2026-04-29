import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
});

export type Subject = typeof subjects.$inferSelect;
