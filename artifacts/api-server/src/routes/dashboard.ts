import { Router } from "express";
import { db, usersTable, planPurchasesTable, pool } from "@workspace/db";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import {
  getRemnawaveUser,
  getUserBandwidth,
  getSubscription,
  createRemnawaveUser,
  renewRemnawaveUserPlan,
} from "../lib/remnawave.js";
import { getPlan, PLANS } from "../lib/plans.js";

const router = Router();

const MONTHLY_PURCHASE_LIMIT = 2;
const PREMIUM_PLAN_IDS = ["premium", "ultra"];

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

  // Get usage from subscription endpoint - trafficUsedBytes is a string, need to parse it
  const usedBytes: number = sub?.user?.trafficUsedBytes ? parseInt(sub.user.trafficUsedBytes, 10) : 0;
  const limitBytes: number = vpnUser?.trafficLimitBytes ?? plan?.trafficLimitBytes ?? 0;
  const remainingBytes = Math.max(0, limitBytes - usedBytes);

  console.log(`[Dashboard Stats] User: ${user.username}, Balance from DB: ${user.balanceKs}`);
  
  res.json({
    username: user.username,
    planId: user.planId,
    planName: plan?.name ?? vpnUser?.username ?? "Unknown Plan",
    status: vpnUser?.status ?? "unknown",
    expireAt: vpnUser?.expireAt ?? null,
    usedBytes,
    limitBytes,
    remainingBytes,
    usedGb: +(usedBytes / (1024 ** 3)).toFixed(2),
    remainingGb: +(remainingBytes / (1024 ** 3)).toFixed(2),
    limitGb: +(limitBytes / (1024 ** 3)).toFixed(2),
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

router.post("/buy-plan", requireAuth, async (req: AuthRequest, res) => {
  const { planId } = req.body as { planId: string };

  const plan = getPlan(planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the user row to prevent concurrent balance modifications
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

    // Rule 1 — max 2 purchases per calendar month
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

    // Rule 2 — no downgrade: Premium/Ultra users cannot buy Starter
    if (PREMIUM_PLAN_IDS.includes(user.plan_id ?? "") && planId === "starter") {
      await client.query("ROLLBACK");
      res.status(403).json({
        error: "Your current plan is Premium or Ultra. You cannot downgrade to Starter. Please choose Premium or Ultra.",
        code: "DOWNGRADE_BLOCKED",
      });
      return;
    }

    // Rule 3 — sufficient balance (checked within transaction)
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

    // Record purchase and update balance atomically
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

router.post("/gift-plan", requireAuth, async (req: AuthRequest, res) => {
  const { recipientUsername, planId } = req.body as { recipientUsername: string; planId: string };

  const plan = getPlan(planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const [buyer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!buyer) {
    res.status(404).json({ error: "Buyer not found" });
    return;
  }

  // Cannot gift to yourself
  if (buyer.username.toLowerCase() === recipientUsername.trim().toLowerCase()) {
    res.status(400).json({ error: "You cannot gift a plan to yourself.", code: "SELF_GIFT" });
    return;
  }

  // Look up recipient
  const [recipient] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, recipientUsername.trim()))
    .limit(1);

  if (!recipient) {
    res.status(404).json({
      error: `No account found with username "${recipientUsername.trim()}". They need to register first.`,
      code: "RECIPIENT_NOT_FOUND",
    });
    return;
  }

  // Check recipient's monthly purchase count
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [{ purchasesThisMonth }] = await db
    .select({ purchasesThisMonth: count() })
    .from(planPurchasesTable)
    .where(
      and(
        eq(planPurchasesTable.userId, recipient.id),
        gte(planPurchasesTable.purchasedAt, monthStart),
      ),
    );

  if (Number(purchasesThisMonth) >= MONTHLY_PURCHASE_LIMIT) {
    res.status(403).json({
      error: `${recipient.username} has already received ${MONTHLY_PURCHASE_LIMIT} plans this month. Their limit resets on the 1st of next month.`,
      code: "RECIPIENT_MONTHLY_LIMIT_REACHED",
    });
    return;
  }

  // Downgrade rule — based on recipient's current plan
  if (PREMIUM_PLAN_IDS.includes(recipient.planId ?? "") && planId === "starter") {
    res.status(403).json({
      error: `${recipient.username} is already on a Premium or Ultra plan. You cannot gift them a Starter plan.`,
      code: "RECIPIENT_DOWNGRADE_BLOCKED",
    });
    return;
  }

  // Buyer must have enough balance
  if (buyer.balanceKs < plan.priceKs) {
    res.status(402).json({
      error: `Insufficient balance. You need ${plan.priceKs.toLocaleString()} Ks but have ${buyer.balanceKs.toLocaleString()} Ks.`,
      code: "INSUFFICIENT_BALANCE",
    });
    return;
  }

  // Activate on Remnawave for recipient
  let remnawaveUuid = recipient.remnawaveUuid;
  let remnawaveShortUuid = recipient.remnawaveShortUuid;

  try {
    if (recipient.remnawaveUuid) {
      await renewRemnawaveUserPlan(recipient.remnawaveUuid, plan.trafficLimitBytes, plan.validityDays);
    } else {
      const rwUser = await createRemnawaveUser(recipient.username, plan.trafficLimitBytes, plan.validityDays);
      remnawaveUuid = rwUser.uuid ?? remnawaveUuid;
      remnawaveShortUuid = rwUser.shortUuid ?? remnawaveShortUuid;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Failed to activate VPN: ${msg}` });
    return;
  }

  const newBuyerBalance = buyer.balanceKs - plan.priceKs;

  await Promise.all([
    db.insert(planPurchasesTable).values({
      userId: recipient.id,
      planId,
      priceKs: String(plan.priceKs),
    }),
    db
      .update(usersTable)
      .set({ balanceKs: newBuyerBalance, updatedAt: new Date() })
      .where(eq(usersTable.id, buyer.id)),
    db
      .update(usersTable)
      .set({ planId, remnawaveUuid, remnawaveShortUuid, updatedAt: new Date() })
      .where(eq(usersTable.id, recipient.id)),
  ]);

  res.json({
    success: true,
    newBalance: newBuyerBalance,
    recipientUsername: recipient.username,
    planId,
    planName: plan.name,
  });
});

export default router;
