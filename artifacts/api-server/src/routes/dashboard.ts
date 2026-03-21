import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getRemnawaveUser, getUserBandwidth, getSubscription } from "../lib/remnawave.js";
import { getPlan, PLANS } from "../lib/plans.js";

const router = Router();

router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user || !user.remnawaveUuid) {
    res.status(404).json({ error: "VPN account not found" });
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
    planName: plan?.name ?? "Unknown Plan",
    status: vpnUser?.status ?? "unknown",
    expireAt: vpnUser?.expireAt ?? null,
    usedBytes,
    limitBytes,
    remainingBytes,
    usedGb: +(usedBytes / (1024 ** 3)).toFixed(2),
    remainingGb: +(remainingBytes / (1024 ** 3)).toFixed(2),
    limitGb: +(limitBytes / (1024 ** 3)).toFixed(2),
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
    res.status(404).json({ error: "VPN account not found" });
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

export default router;
