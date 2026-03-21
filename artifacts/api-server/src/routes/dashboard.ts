import { Router } from "express";
import { db, usersTable, planPurchasesTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
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

  const [rwUser, bandwidth] = await Promise.allSettled([
    getRemnawaveUser(user.remnawaveUuid),
    getUserBandwidth(user.remnawaveUuid),
  ]);

  const vpnUser = rwUser.status === "fulfilled" ? rwUser.value : null;
  const bw = bandwidth.status === "fulfilled" ? bandwidth.value : null;

  const usedBytes: number = vpnUser?.usedTrafficBytes ?? 0;
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
    usedGb: +(usedBytes / (1024 ** 3)).toFixed(2),
    remainingGb: +(remainingBytes / (1024 ** 3)).toFixed(2),
    limitGb: +(limitBytes / (1024 ** 3)).toFixed(2),
    balanceKs: user.balanceKs,
    bandwidth: bw,
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

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Rule 1 — max 2 purchases per calendar month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [{ purchasesThisMonth }] = await db
    .select({ purchasesThisMonth: count() })
    .from(planPurchasesTable)
    .where(
      and(
        eq(planPurchasesTable.userId, user.id),
        gte(planPurchasesTable.purchasedAt, monthStart),
      ),
    );

  if (Number(purchasesThisMonth) >= MONTHLY_PURCHASE_LIMIT) {
    res.status(403).json({
      error: `You've already purchased ${MONTHLY_PURCHASE_LIMIT} plans this month. Your limit resets on the 1st of next month.`,
      code: "MONTHLY_LIMIT_REACHED",
    });
    return;
  }

  // Rule 2 — no downgrade: Premium/Ultra users cannot buy Starter
  if (PREMIUM_PLAN_IDS.includes(user.planId ?? "") && planId === "starter") {
    res.status(403).json({
      error: "Your current plan is Premium or Ultra. You cannot downgrade to Starter. Please choose Premium or Ultra.",
      code: "DOWNGRADE_BLOCKED",
    });
    return;
  }

  // Rule 3 — sufficient balance
  if (user.balanceKs < plan.priceKs) {
    res.status(402).json({
      error: `Insufficient balance. You need ${plan.priceKs.toLocaleString()} Ks but have ${user.balanceKs.toLocaleString()} Ks.`,
      code: "INSUFFICIENT_BALANCE",
    });
    return;
  }

  let remnawaveUuid = user.remnawaveUuid;
  let remnawaveShortUuid = user.remnawaveShortUuid;

  try {
    if (user.remnawaveUuid) {
      // Existing user: extend their data (no traffic reset, carry forward)
      await renewRemnawaveUserPlan(
        user.remnawaveUuid,
        plan.trafficLimitBytes,
        plan.validityDays,
      );
    } else {
      // New user: create fresh Remnawave account
      const rwUser = await createRemnawaveUser(
        user.username,
        plan.trafficLimitBytes,
        plan.validityDays,
      );
      remnawaveUuid = rwUser.uuid ?? remnawaveUuid;
      remnawaveShortUuid = rwUser.shortUuid ?? remnawaveShortUuid;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Failed to activate VPN: ${msg}` });
    return;
  }

  const newBalance = user.balanceKs - plan.priceKs;

  // Record the purchase and update user in parallel
  await Promise.all([
    db.insert(planPurchasesTable).values({
      userId: user.id,
      planId,
      priceKs: String(plan.priceKs),
    }),
    db
      .update(usersTable)
      .set({
        balanceKs: newBalance,
        planId,
        remnawaveUuid,
        remnawaveShortUuid,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id)),
  ]);

  const purchasesAfter = Number(purchasesThisMonth) + 1;

  res.json({
    success: true,
    newBalance,
    planId,
    planName: plan.name,
    purchasesThisMonth: purchasesAfter,
    remainingPurchases: Math.max(0, MONTHLY_PURCHASE_LIMIT - purchasesAfter),
  });
});

export default router;
