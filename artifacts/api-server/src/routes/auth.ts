import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait 15 minutes and try again." },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many accounts created from this IP. Please try again later." },
});

router.post("/register", registerLimiter, async (req, res) => {
  const { username, password, telegramId } = req.body as {
    username: string;
    password: string;
    telegramId?: string;
  };

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    res.status(400).json({
      error: "Username must be 3–32 characters, lowercase letters, numbers, or underscores only",
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  if (password.length > 128) {
    res.status(400).json({ error: "Password is too long" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, ...(telegramId ? { telegramId: String(telegramId) } : {}) })
    .returning();

  const token = signToken({ userId: user.id, username: user.username });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      balanceKs: user.balanceKs,
      planId: user.planId,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  });
});

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password, telegramId } = req.body as { username: string; password: string; telegramId?: string };

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.slice(0, 32)))
    .limit(1);

  if (!user) {
    await bcrypt.hash("dummy_password_to_prevent_timing_attacks", 12);
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password.slice(0, 128), user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  // Save or update telegramId if provided
  (req as any).log?.debug({ telegramId: telegramId ? "[REDACTED]" : null }, "Login telegramId received");
  if (telegramId && String(telegramId) !== user.telegramId) {
    await db
      .update(usersTable)
      .set({ telegramId: String(telegramId) })
      .where(eq(usersTable.id, user.id));
    (req as any).log?.debug({ username: user.username }, "Saved telegramId to user");
  }

  const token = signToken({ userId: user.id, username: user.username });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      balanceKs: user.balanceKs,
      planId: user.planId,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    balanceKs: user.balanceKs,
    planId: user.planId,
    isAdmin: user.isAdmin,
    remnawaveUuid: user.remnawaveUuid,
    createdAt: user.createdAt,
  });
});

export default router;
