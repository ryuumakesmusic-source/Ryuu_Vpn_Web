import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const planPurchasesTable = pgTable("plan_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  planId: text("plan_id").notNull(),
  priceKs: text("price_ks").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export type PlanPurchase = typeof planPurchasesTable.$inferSelect;
