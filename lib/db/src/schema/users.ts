import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  remnawaveUuid: text("remnawave_uuid"),
  remnawaveShortUuid: text("remnawave_short_uuid"),
  planId: text("plan_id"),
  balanceKs: integer("balance_ks").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  telegramId: text("telegram_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
