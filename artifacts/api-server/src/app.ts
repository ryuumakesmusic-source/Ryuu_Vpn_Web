// ─────────────────────────────────────────────────────────────────
//  artifacts/api-server/src/app.ts  (FIXED)
//
//  Changes vs original:
//  1. ALLOWED_ORIGINS empty in production now means "same-origin only"
//     (deny cross-origin), not "allow everything". Previously the
//     code allowed all origins when the list was empty — the opposite
//     of what the .env.example comment said.
//  2. Comment updated to match actual behaviour.
// ─────────────────────────────────────────────────────────────────

import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

// Trust the Nginx reverse proxy so req.ip reflects the real client IP,
// not the internal Docker network IP. Without this, all users share one
// rate-limit bucket (the Nginx container's IP).
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://api.telegram.org"],
        fontSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Parse ALLOWED_ORIGINS once at startup.
// In production:
//   - If the list is non-empty → only listed origins are allowed.
//   - If the list is EMPTY    → no cross-origin requests are allowed
//     (same-origin only, which is the safe default behind Nginx).
// In development: all origins are allowed for convenience.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      // In development, allow all origins
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }

      // In production:
      //   Non-empty whitelist  → check against it
      //   Empty whitelist      → deny all cross-origin requests
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// Serve uploaded screenshots from Docker volume (must be before SPA catch-all)
const uploadDir = process.env.UPLOAD_DIR
  ? path.dirname(process.env.UPLOAD_DIR)
  : "/app/uploads";
app.use("/uploads", express.static(uploadDir));

// In production, serve the built Vite frontend
if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve(__dirname, "../../ryuu-vpn/dist/public");
  app.use(express.static(staticDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
