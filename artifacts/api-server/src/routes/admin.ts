import { Router } from "express";
import { db, usersTable, topupRequestsTable, planPurchasesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, type AdminRequest } from "../middlewares/adminAuth.js";
import { getPlan, PLANS } from "../lib/plans.js";
import { sendTelegramMessage } from "../lib/telegram.js";

const router = Router();

router.get("/topups", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: topupRequestsTable.id,
      amountKs: topupRequestsTable.amountKs,
      paymentMethod: topupRequestsTable.paymentMethod,
      status: topupRequestsTable.status,
      adminNote: topupRequestsTable.adminNote,
      createdAt: topupRequestsTable.createdAt,
      userId: topupRequestsTable.userId,
      username: usersTable.username,
      userBalance: usersTable.balanceKs,
    })
    .from(topupRequestsTable)
    .leftJoin(usersTable, eq(topupRequestsTable.userId, usersTable.id))
    .orderBy(desc(topupRequestsTable.createdAt));

  res.json(rows);
});

router.get("/topups/:id/screenshot", requireAdmin, async (req, res) => {
  const { id } = req.params;

  const [topup] = await db
    .select({ screenshotUrl: topupRequestsTable.screenshotUrl })
    .from(topupRequestsTable)
    .where(eq(topupRequestsTable.id, id))
    .limit(1);

  if (!topup) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ screenshotUrl: topup.screenshotUrl });
});

router.post("/topups/:id/approve", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { adminNote } = req.body as { adminNote?: string };

  const [topup] = await db
    .select()
    .from(topupRequestsTable)
    .where(eq(topupRequestsTable.id, id))
    .limit(1);

  if (!topup) {
    res.status(404).json({ error: "Top-up request not found" });
    return;
  }
  if (topup.status !== "pending") {
    res.status(400).json({ error: "Already processed" });
    return;
  }

  await db
    .update(topupRequestsTable)
    .set({ status: "approved", adminNote: adminNote?.trim() || null, updatedAt: new Date() })
    .where(eq(topupRequestsTable.id, id));

  const [user] = await db
    .select({ balanceKs: usersTable.balanceKs, username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, topup.userId))
    .limit(1);

  const newBalance = (user?.balanceKs ?? 0) + topup.amountKs;

  await db
    .update(usersTable)
    .set({ balanceKs: newBalance, updatedAt: new Date() })
    .where(eq(usersTable.id, topup.userId));

  const notifyText = [
    `✅ <b>Top-Up Approved</b>`,
    ``,
    `👤 User: <b>${user?.username ?? topup.userId}</b>`,
    `💵 Amount: <b>${topup.amountKs.toLocaleString()} Ks</b>`,
    `💰 New Balance: <b>${newBalance.toLocaleString()} Ks</b>`,
    `🏦 Method: <b>${topup.paymentMethod}</b>`,
    ...(adminNote?.trim() ? [`📝 Note: ${adminNote.trim()}`] : []),
    `✅ Approved by: <b>${req.user!.username}</b>`,
  ].join("\n");

  sendTelegramMessage(notifyText).catch(() => {});

  res.json({ success: true, newBalance });
});

router.post("/topups/:id/reject", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { adminNote } = req.body as { adminNote?: string };

  const [topup] = await db
    .select()
    .from(topupRequestsTable)
    .where(eq(topupRequestsTable.id, id))
    .limit(1);

  if (!topup) {
    res.status(404).json({ error: "Top-up request not found" });
    return;
  }
  if (topup.status !== "pending") {
    res.status(400).json({ error: "Already processed" });
    return;
  }

  await db
    .update(topupRequestsTable)
    .set({ status: "rejected", adminNote: adminNote?.trim() || null, updatedAt: new Date() })
    .where(eq(topupRequestsTable.id, id));

  const [user] = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, topup.userId))
    .limit(1);

  const notifyText = [
    `❌ <b>Top-Up Rejected</b>`,
    ``,
    `👤 User: <b>${user?.username ?? topup.userId}</b>`,
    `💵 Amount: <b>${topup.amountKs.toLocaleString()} Ks</b>`,
    `🏦 Method: <b>${topup.paymentMethod}</b>`,
    ...(adminNote?.trim() ? [`📝 Reason: ${adminNote.trim()}`] : []),
    `❌ Rejected by: <b>${req.user!.username}</b>`,
  ].join("\n");

  sendTelegramMessage(notifyText).catch(() => {});

  res.json({ success: true });
});

router.get("/users", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      balanceKs: usersTable.balanceKs,
      planId: usersTable.planId,
      isAdmin: usersTable.isAdmin,
      remnawaveUuid: usersTable.remnawaveUuid,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json(rows);
});

router.post("/users/:id/set-admin", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { isAdmin } = req.body as { isAdmin: boolean };

  if (id === req.user!.userId) {
    res.status(400).json({ error: "You cannot change your own admin status" });
    return;
  }

  await db
    .update(usersTable)
    .set({ isAdmin: !!isAdmin, updatedAt: new Date() })
    .where(eq(usersTable.id, id));

  res.json({ success: true });
});

router.post("/users/:id/set-balance", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { balanceKs } = req.body as { balanceKs: number };

  if (typeof balanceKs !== "number" || balanceKs < 0 || !Number.isInteger(balanceKs)) {
    res.status(400).json({ error: "Invalid balance — must be a non-negative integer" });
    return;
  }

  if (balanceKs > 10_000_000) {
    res.status(400).json({ error: "Balance too large" });
    return;
  }

  await db
    .update(usersTable)
    .set({ balanceKs, updatedAt: new Date() })
    .where(eq(usersTable.id, id));

  res.json({ success: true, balanceKs });
});

router.post("/users/:id/adjust-balance", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { delta } = req.body as { delta: number };

  if (typeof delta !== "number" || !Number.isInteger(delta) || delta === 0) {
    res.status(400).json({ error: "delta must be a non-zero integer" });
    return;
  }

  if (Math.abs(delta) > 10_000_000) {
    res.status(400).json({ error: "delta too large" });
    return;
  }

  const [user] = await db
    .select({ balanceKs: usersTable.balanceKs })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newBalance = Math.max(0, user.balanceKs + delta);

  await db
    .update(usersTable)
    .set({ balanceKs: newBalance, updatedAt: new Date() })
    .where(eq(usersTable.id, id));

  res.json({ success: true, balanceKs: newBalance });
});

router.delete("/users/:id", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;

  if (id === req.user!.userId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.isAdmin) {
    res.status(400).json({ error: "Cannot delete an admin account. Remove admin status first." });
    return;
  }

  // Delete in dependency order
  await db.delete(planPurchasesTable).where(eq(planPurchasesTable.userId, id));
  await db.delete(topupRequestsTable).where(eq(topupRequestsTable.userId, id));
  await db.delete(usersTable).where(eq(usersTable.id, id));

  res.json({ success: true });
});

router.get("/plans", requireAdmin, (_req, res) => {
  res.json(Object.values(PLANS));
});

export default router;
