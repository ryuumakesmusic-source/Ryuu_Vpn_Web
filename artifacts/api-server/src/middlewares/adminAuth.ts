import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AdminRequest extends Request {
  user?: JwtPayload;
}

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const [user] = await db
    .select({ isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1);

  if (!user?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.user = payload;
  next();
}
