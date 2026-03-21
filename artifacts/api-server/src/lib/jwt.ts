import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) throw new Error("SESSION_SECRET is not set");

export interface JwtPayload {
  userId: string;
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET!, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET!) as JwtPayload;
}
