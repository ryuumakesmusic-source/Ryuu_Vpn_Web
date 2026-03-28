// ─────────────────────────────────────────────────────────────────
//  artifacts/api-server/src/routes/dashboard.ts  (FIXED)
//
//  Changes vs original:
//  1. Added buyPlanLimiter and giftPlanLimiter (10 req / 10 min)
//     applied to POST /buy-plan and POST /gift-plan respectively.
// ─────────────────────────────────────────────────────────────────

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db, usersTable, planPurchasesTable, pool } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import {
  getRemnawaveUser,
  getSubscription,
  createRemnawaveUser,
  renewRemnawaveUserPlan,
} from "../lib/remnawave.js";
import { getPlan, PLANS } from "../lib/plans.js";
import { MONTHLY_PURCHASE_LIMIT, PREMIUM_PLAN_IDS } from "../lib/constants.js";

const router = Router();

/** Max 10 plan purchases per IP per 10 minutes. */
const buyPlanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many purchase attempts. Please wait a few minutes and try again." },
});

/** Max 10 gift operations per IP per 10 minutes. */
const giftPlanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many gift attempts. Please wait a few minutes and try again." },
});

router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!user.remnawaveUuid) {
    res.json({
      username: user.username,
      planId: null,
      planName: null,
      status: "NO_PLAN",
      expireAt: null,
      usedBytes: 0,
      limitBytes: 0,
      remainingBytes: 0,
      usedGb: 0,
      remainingGb: 0,
      limitGb: 0,
      balanceKs: user.balanceKs,
      bandwidth: null,
    });
    return;
  }

  const plan = getPlan(user.planId ?? "");

  const [rwUser, subscription] = await Promise.allSettled([
    getRemnawaveUser(user.remnawaveUuid),
    getSubscription(user.remnawaveUuid),
  ]);

  const vpnUser = rwUser.status === "fulfilled" ? rwUser.value : null;
  const sub = subscription.status === "fulfilled" ? subscription.value : null;

  const usedBytes: number = sub?.user?.trafficUsedBytes
    ? parseInt(sub.user.trafficUsedBytes, 10)
    : 0;
  const limitBytes: number = vpnUser?.trafficLimitBytes ?? plan?.trafficLimitBytes ?? 0;
  const remainingBytes = Math.max(0, limitBytes - usedBytes);

  res.json({
    username: user.username,
    planId: user.planId,
    planName: plan?.name ?? vpnUser?.username ?? "Unknown Plan",
    status: vpnUser?.status ?? "unknown",
    expireAt: vpnUser?.expireAt ?? null,
    usedBytes,
    limitBytes,
    remainingBytes,
    usedGb: +(usedBytes / 1024 ** 3).toFixed(2),
    remainingGb: +(remainingBytes / 1024 ** 3).toFixed(2),
    limitGb: +(limitBytes / 1024 ** 3).toFixed(2),
    balanceKs: user.balanceKs,
    bandwidth: sub,
  });
});

router.get("/subscription", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user || !user.remnawaveUuid) {
    res.json({ subscriptionUrl: null, shortUuid: null });
    return;
  }

  const sub = await getSubscription(user.remnawaveUuid);

  res.json({
    subscriptionUrl: sub?.subscriptionUrl ?? null,
    shortUuid: user.remnawaveShortUuid,
  });
});

router.get("/plans", (_req, res) => {
  res.json(Object.values(PLANS));
});

router.get("/purchase-status", requireAuth, async (req: AuthRequest, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ purchasesThisMonth }] = await db
    .select({ purchasesThisMonth: count() })
    .from(planPurchasesTable)
    .where(
      and(
        eq(planPurchasesTable.userId, req.user!.userId),
        gte(planPurchasesTable.purchasedAt, monthStart),
      ),
    );

  const [user] = await db
    .select({ planId: usersTable.planId })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  res.json({
    purchasesThisMonth: Number(purchasesThisMonth),
    monthlyLimit: MONTHLY_PURCHASE_LIMIT,
    remainingPurchases: Math.max(0, MONTHLY_PURCHASE_LIMIT - Number(purchasesThisMonth)),
    currentPlanId: user?.planId ?? null,
    canBuyStarter: !PREMIUM_PLAN_IDS.includes(user?.planId ?? ""),
  });
});

// Rate limiter applied: 10 attempts / 10 min per IP
router.post("/buy-plan", requireAuth, buyPlanLimiter, async (req: AuthRequest, res) => {
  const { planId } = req.body as { planId: string };

  const plan = getPlan(planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT * FROM users WHERE id = $1 FOR UPDATE",
      [req.user!.userId],
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userResult.rows[0];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const purchaseCountResult = await client.query(
      "SELECT COUNT(*) as count FROM plan_purchases WHERE user_id = $1 AND purchased_at >= $2",
      [user.id, monthStart],
    );
    const purchasesThisMonth = Number(purchaseCountResult.rows[0].count);

    if (purchasesThisMonth >= MONTHLY_PURCHASE_LIMIT) {
      await client.query("ROLLBACK");
      res.status(403).json({
        error: `You've already purchased ${MONTHLY_PURCHASE_LIMIT} plans this month. Your limit resets on the 1st of next month.`,
        code: "MONTHLY_LIMIT_REACHED",
      });
      return;
    }

    if (PREMIUM_PLAN_IDS.includes(user.plan_id ?? "") && planId === "starter") {
      await client.query("ROLLBACK");
      res.status(403).json({
        error: "Your current plan is Premium or Ultra. You cannot downgrade to Starter. Please choose Premium or Ultra.",
        code: "DOWNGRADE_BLOCKED",
      });
      return;
    }

    if (user.balance_ks < plan.priceKs) {
      await client.query("ROLLBACK");
      res.status(402).json({
        error: `Insufficient balance. You need ${plan.priceKs.toLocaleString()} Ks but have ${user.balance_ks.toLocaleString()} Ks.`,
        code: "INSUFFICIENT_BALANCE",
      });
      return;
    }

    let remnawaveUuid = user.remnawave_uuid;
    let remnawaveShortUuid = user.remnawave_short_uuid;

    try {
      if (user.remnawave_uuid) {
        await renewRemnawaveUserPlan(
          user.remnawave_uuid,
          plan.trafficLimitBytes,
          plan.validityDays,
        );
      } else {
        const rwUser = await createRemnawaveUser(
          user.username,
          plan.trafficLimitBytes,
          plan.validityDays,
        );
        remnawaveUuid = rwUser.uuid ?? remnawaveUuid;
        remnawaveShortUuid = rwUser.shortUuid ?? remnawaveShortUuid;
      }
    } catch (err) {
      await client.query("ROLLBACK");
      const msg = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: `Failed to activate VPN: ${msg}` });
      return;
    }

    const newBalance = user.balance_ks - plan.priceKs;

    await client.query(
      "INSERT INTO plan_purchases (user_id, plan_id, price_ks) VALUES ($1, $2, $3)",
      [user.id, planId, String(plan.priceKs)],
    );

    await client.query(
      "UPDATE users SET balance_ks = $1, plan_id = $2, remnawave_uuid = $3, remnawave_short_uuid = $4, updated_at = NOW() WHERE id = $5",
      [newBalance, planId, remnawaveUuid, remnawaveShortUuid, user.id],
    );

    await client.query("COMMIT");

    const purchasesAfter = purchasesThisMonth + 1;

    res.json({
      success: true,
      newBalance,
      planId,
      planName: plan.name,
      purchasesThisMonth: purchasesAfter,
      remainingPurchases: Math.max(0, MONTHLY_PURCHASE_LIMIT - purchasesAfter),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

// Rate limiter applied: 10 attempts / 10 min per IP
router.post("/gift-plan", requireAuth, giftPlanLimiter, async (req: AuthRequest, res) => {
  const { recipientUsername, planId } = req.body as {
    recipientUsername: string;
    planId: string;
  };

  const plan = getPlan(planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const buyerResult = await client.query(
      "SELECT * FROM users WHERE id = $1 FOR UPDATE",
      [req.user!.userId],
    );

    if (buyerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Buyer not found" });
      return;
    }

    const buyer = buyerResult.rows[0];

    if (buyer.username.toLowerCase() === recipientUsername.trim().toLowerCase()) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "You cannot gift a plan to yourself.", code: "SELF_GIFT" });
      return;
    }

    const recipientResult = await client.query(
      "SELECT * FROM users WHERE username = $1 FOR UPDATE",
      [recipientUsername.trim()],
    );

    if (recipientResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({
        error: `No account found with username "${recipientUsername.trim()}". They need to register first.`,
        code: "RECIPIENT_NOT_FOUND",
      });
      return;
    }

    const recipient = recipientResult.rows[0];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const purchaseCountResult = await client.query(
      "SELECT COUNT(*) as count FROM plan_purchases WHERE user_id = $1 AND purchased_at >= $2",
      [recipient.id, monthStart],
    );
    const purchasesThisMonth = Number(purchaseCountResult.rows[0].count);

    if (purchasesThisMonth >= MONTHLY_PURCHASE_LIMIT) {
      await client.query("ROLLBACK");
      res.status(403).json({
        error: `${recipient.username} has already received ${MONTHLY_PURCHASE_LIMIT} plans this month. Their limit resets on the 1st of next month.`,
        code: "RECIPIENT_MONTHLY_LIMIT_REACHED",
      });
      return;
    }

    if (PREMIUM_PLAN_IDS.includes(recipient.plan_id ?? "") && planId === "starter") {
      await client.query("ROLLBACK");
      res.status(403).json({
        error: `${recipient.username} is already on a Premium or Ultra plan. You cannot gift them a Starter plan.`,
        code: "RECIPIENT_DOWNGRADE_BLOCKED",
      });
      return;
    }

    if (buyer.balance_ks < plan.priceKs) {
      await client.query("ROLLBACK");
      res.status(402).json({
        error: `Insufficient balance. You need ${plan.priceKs.toLocaleString()} Ks but have ${buyer.balance_ks.toLocaleString()} Ks.`,
        code: "INSUFFICIENT_BALANCE",
      });
      return;
    }

    let remnawaveUuid = recipient.remnawave_uuid;
    let remnawaveShortUuid = recipient.remnawave_short_uuid;

    try {
      if (recipient.remnawave_uuid) {
        await renewRemnawaveUserPlan(recipient.remnawave_uuid, plan.trafficLimitBytes, plan.validityDays);
      } else {
        const rwUser = await createRemnawaveUser(recipient.username, plan.trafficLimitBytes, plan.validityDays);
        remnawaveUuid = rwUser.uuid ?? remnawaveUuid;
        remnawaveShortUuid = rwUser.shortUuid ?? remnawaveShortUuid;
      }
    } catch (err) {
      await client.query("ROLLBACK");
      const msg = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: `Failed to activate VPN: ${msg}` });
      return;
    }

    const newBuyerBalance = buyer.balance_ks - plan.priceKs;

    await client.query(
      "INSERT INTO plan_purchases (user_id, plan_id, price_ks) VALUES ($1, $2, $3)",
      [recipient.id, planId, String(plan.priceKs)],
    );

    await client.query(
      "UPDATE users SET balance_ks = $1, updated_at = NOW() WHERE id = $2",
      [newBuyerBalance, buyer.id],
    );

    await client.query(
      "UPDATE users SET plan_id = $1, remnawave_uuid = $2, remnawave_short_uuid = $3, updated_at = NOW() WHERE id = $4",
      [planId, remnawaveUuid, remnawaveShortUuid, recipient.id],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      newBalance: newBuyerBalance,
      recipientUsername: recipient.username,
      planId,
      planName: plan.name,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

export default router;
