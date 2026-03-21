import { Router } from "express";
import { db, usersTable, topupRequestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { sendTelegramMessage } from "../lib/telegram.js";

const router = Router();

router.post("/request", requireAuth, async (req: AuthRequest, res) => {
  const { amountKs, paymentMethod, screenshotUrl } = req.body as {
    amountKs: number;
    paymentMethod: string;
    screenshotUrl: string;
  };

  if (!amountKs || amountKs < 1000) {
    res.status(400).json({ error: "Minimum top-up is 1,000 Ks" });
    return;
  }
  if (!paymentMethod) {
    res.status(400).json({ error: "paymentMethod is required" });
    return;
  }
  if (!screenshotUrl) {
    res.status(400).json({ error: "screenshotUrl is required" });
    return;
  }

  const [topup] = await db
    .insert(topupRequestsTable)
    .values({
      userId: req.user!.userId,
      amountKs,
      paymentMethod,
      screenshotUrl,
      status: "pending",
    })
    .returning();

  const msg = `
💰 <b>New Top-Up Request</b>

👤 User: <b>${req.user!.username}</b>
💵 Amount: <b>${amountKs.toLocaleString()} Ks</b>
🏦 Method: <b>${paymentMethod}</b>
📸 Screenshot: <a href="${screenshotUrl}">View</a>
🕐 Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Yangon" })} (MMT)

⚡ Approve at: /admin
`.trim();

  await sendTelegramMessage(msg);

  res.status(201).json({ id: topup.id, status: topup.status });
});

router.get("/my", requireAuth, async (req: AuthRequest, res) => {
  const requests = await db
    .select()
    .from(topupRequestsTable)
    .where(eq(topupRequestsTable.userId, req.user!.userId));

  res.json(requests);
});

export default router;
