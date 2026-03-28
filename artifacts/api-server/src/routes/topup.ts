import { Router } from "express";
import multer from "multer";
import { db, usersTable, topupRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { sendTelegramPhoto, sendTelegramMessage } from "../lib/telegram.js";
import { saveScreenshot } from "../lib/upload.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/request",
  requireAuth,
  upload.single("screenshot"),
  async (req: AuthRequest, res) => {
    const { amountKs, paymentMethod } = req.body as {
      amountKs: string;
      paymentMethod: string;
    };

    const amount = parseInt(amountKs);
    if (!amount || amount < 1000) {
      res.status(400).json({ error: "Minimum top-up is 1,000 Ks" });
      return;
    }
    if (!paymentMethod) {
      res.status(400).json({ error: "paymentMethod is required" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Screenshot is required" });
      return;
    }

    // Save screenshot to local filesystem
    const screenshotUrl = await saveScreenshot(req.file.buffer, req.file.mimetype);

    const [topup] = await db
      .insert(topupRequestsTable)
      .values({
        userId: req.user!.userId,
        amountKs: amount,
        paymentMethod,
        screenshotUrl,
        status: "pending",
      })
      .returning();

    const caption = [
      `💰 <b>New Top-Up Request</b>`,
      ``,
      `👤 User: <b>${req.user!.username}</b>`,
      `💵 Amount: <b>${amount.toLocaleString()} Ks</b>`,
      `🏦 Method: <b>${paymentMethod}</b>`,
      `🕐 Time: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Yangon" })} (MMT)`,
      ``,
      `⚡ Approve at the admin panel.`,
    ].join("\n");

    try {
      await sendTelegramPhoto(req.file.buffer, caption, req.file.mimetype);
    } catch {
      await sendTelegramMessage(caption + "\n\n(Screenshot upload failed)");
    }

    res.status(201).json({ id: topup.id, status: topup.status });
  }
);

router.get("/my", requireAuth, async (req: AuthRequest, res) => {
  // Return in descending order so the newest request appears first
  const requests = await db
    .select({
      id: topupRequestsTable.id,
      amountKs: topupRequestsTable.amountKs,
      paymentMethod: topupRequestsTable.paymentMethod,
      status: topupRequestsTable.status,
      adminNote: topupRequestsTable.adminNote,
      createdAt: topupRequestsTable.createdAt,
    })
    .from(topupRequestsTable)
    .where(eq(topupRequestsTable.userId, req.user!.userId))
    .orderBy(desc(topupRequestsTable.createdAt));

  res.json(requests);
});

export default router;
