import { Router } from "express";
import { db, usersTable, topupRequestsTable, planPurchasesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, type AdminRequest } from "../middlewares/adminAuth.js";
import { getPlan, PLANS } from "../lib/plans.js";
import { sendTelegramMessage, notifyUser } from "../lib/telegram.js";
import { getRemnawaveUser, deleteRemnawaveUser } from "../lib/remnawave.js";

const router = Router();

router.get("/topups", requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;

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
    .orderBy(desc(topupRequestsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      hasMore: rows.length === limit,
    },
  });
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
    .select({ balanceKs: usersTable.balanceKs, username: usersTable.username, telegramId: usersTable.telegramId })
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

  sendTelegramMessage(notifyText).catch((err) => {
    req.log.warn({ err }, "Failed to send Telegram notification for top-up approval");
  });

  if (user?.telegramId) {
    const userMessage = [
      `✅ <b>Top-Up Approved!</b>`,
      ``,
      `💵 Amount: <b>${topup.amountKs.toLocaleString()} Ks</b>`,
      `💰 New Balance: <b>${newBalance.toLocaleString()} Ks</b>`,
      ...(adminNote?.trim() ? [`📝 Note: ${adminNote.trim()}`] : []),
      ``,
      `🎉 Your balance has been credited!`,
    ].join("\n");
    notifyUser(user.telegramId, userMessage).catch((err) => {
      req.log.warn({ err }, "Failed to send user notification for top-up approval");
    });
  }

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
    .select({ username: usersTable.username, telegramId: usersTable.telegramId })
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

  sendTelegramMessage(notifyText).catch((err) => {
    req.log.warn({ err }, "Failed to send Telegram notification for top-up rejection");
  });

  if (user?.telegramId) {
    const userMessage = [
      `❌ <b>Top-Up Rejected</b>`,
      ``,
      `💵 Amount: <b>${topup.amountKs.toLocaleString()} Ks</b>`,
      `🏦 Method: <b>${topup.paymentMethod}</b>`,
      ...(adminNote?.trim() ? [`📝 Reason: ${adminNote.trim()}`] : []),
      ``,
      `Please contact support if you have questions.`,
    ].join("\n");
    notifyUser(user.telegramId, userMessage).catch((err) => {
      req.log.warn({ err }, "Failed to send user notification for top-up rejection");
    });
  }

  res.json({ success: true });
});

router.get("/users", requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;

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
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      hasMore: rows.length === limit,
    },
  });
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

router.delete("/users/:id/package", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!user.planId || !user.remnawaveUuid) {
    res.status(400).json({ error: "User has no active package" });
    return;
  }

  const plan = getPlan(user.planId);
  if (!plan) {
    res.status(400).json({ error: "Unknown plan on this account" });
    return;
  }

  // Get current expiry from Remnawave to calculate pro-rated refund
  let daysRemaining = 0;
  try {
    const rwUser = await getRemnawaveUser(user.remnawaveUuid);
    if (rwUser.expireAt) {
      const expireAt = new Date(rwUser.expireAt);
      const now = new Date();
      const msRemaining = expireAt.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    }
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch Remnawave user for refund calculation");
  }

  // Pro-rated refund: floor so we never overpay
  const refundKs = Math.floor((daysRemaining / plan.validityDays) * plan.priceKs);

  // Hard delete the user from Remnawave — subscription URL becomes invalid immediately
  try {
    await deleteRemnawaveUser(user.remnawaveUuid);
  } catch (err) {
    req.log.warn({ err }, "Failed to delete Remnawave user — continuing with DB update");
  }

  const newBalance = user.balanceKs + refundKs;

  // Clear all Remnawave fields — account no longer exists there
  await db
    .update(usersTable)
    .set({ planId: null, remnawaveUuid: null, remnawaveShortUuid: null, balanceKs: newBalance, updatedAt: new Date() })
    .where(eq(usersTable.id, id));

  if (user.telegramId) {
    const msg = [
      `📦 <b>Package Cancelled by Admin</b>`,
      ``,
      `📋 Plan: <b>${plan.name}</b>`,
      `⏳ Days remaining: <b>${daysRemaining}</b>`,
      `💰 Refund: <b>${refundKs.toLocaleString()} Ks</b>`,
      `💳 New balance: <b>${newBalance.toLocaleString()} Ks</b>`,
    ].join("\n");
    notifyUser(user.telegramId, msg).catch(() => {});
  }

  res.json({ success: true, daysRemaining, refundKs, newBalance });
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
