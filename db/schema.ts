import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  client: text("client").notNull(),
  payload: text("payload").notNull(),
  score: integer("score").notNull().default(0),
  maturity: text("maturity").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
