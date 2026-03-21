import { Router } from "express";
import { db, usersTable, topupRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, type AdminRequest } from "../middlewares/adminAuth.js";
import { createRemnawaveUser } from "../lib/remnawave.js";
import { getPlan, PLANS } from "../lib/plans.js";

const router = Router();

router.get("/topups", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: topupRequestsTable.id,
      amountKs: topupRequestsTable.amountKs,
      paymentMethod: topupRequestsTable.paymentMethod,
      screenshotUrl: topupRequestsTable.screenshotUrl,
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
    .set({ status: "approved", adminNote: adminNote ?? null, updatedAt: new Date() })
    .where(eq(topupRequestsTable.id, id));

  const [user] = await db
    .select({ balanceKs: usersTable.balanceKs })
    .from(usersTable)
    .where(eq(usersTable.id, topup.userId))
    .limit(1);

  const newBalance = (user?.balanceKs ?? 0) + topup.amountKs;

  await db
    .update(usersTable)
    .set({ balanceKs: newBalance, updatedAt: new Date() })
    .where(eq(usersTable.id, topup.userId));

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
    .set({ status: "rejected", adminNote: adminNote ?? null, updatedAt: new Date() })
    .where(eq(topupRequestsTable.id, id));

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

  await db
    .update(usersTable)
    .set({ isAdmin: !!isAdmin, updatedAt: new Date() })
    .where(eq(usersTable.id, id));

  res.json({ success: true });
});

router.post("/users/:id/set-balance", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { balanceKs } = req.body as { balanceKs: number };

  if (typeof balanceKs !== "number" || balanceKs < 0) {
    res.status(400).json({ error: "Invalid balance" });
    return;
  }

  await db
    .update(usersTable)
    .set({ balanceKs, updatedAt: new Date() })
    .where(eq(usersTable.id, id));

  res.json({ success: true, balanceKs });
});

router.get("/plans", requireAdmin, (_req, res) => {
  res.json(Object.values(PLANS));
});

export default router;
