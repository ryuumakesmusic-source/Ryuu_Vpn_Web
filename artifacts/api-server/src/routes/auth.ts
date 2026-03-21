import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body as {
    username: string;
    password: string;
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

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash })
    .returning();

  const token = signToken({ userId: user.id, username: user.username });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      balanceKs: user.balanceKs,
      planId: user.planId,
      createdAt: user.createdAt,
    },
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
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
