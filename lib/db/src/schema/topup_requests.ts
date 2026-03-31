import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { usersTable } from "./users";

export const topupRequestsTable = pgTable("topup_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  amountKs: integer("amount_ks").notNull(),
  paymentMethod: text("payment_method").notNull(),
  screenshotUrl: text("screenshot_url").notNull(),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTopupRequestSchema = createInsertSchema(topupRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTopupRequest = z.infer<typeof insertTopupRequestSchema>;
export type TopupRequest = typeof topupRequestsTable.$inferSelect;
