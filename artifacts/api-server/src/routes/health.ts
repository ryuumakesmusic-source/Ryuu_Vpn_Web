import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// Basic health check - fast, no dependencies
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Comprehensive health check - includes dependency checks
router.get("/health", async (_req, res) => {
  const startTime = Date.now();
  const checks: Record<string, { status: string; message?: string; duration?: number }> = {};

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    checks.database = {
      status: "healthy",
      duration: Date.now() - dbStart,
    };
  } catch (err) {
    checks.database = {
      status: "unhealthy",
      message: err instanceof Error ? err.message : "Database connection failed",
    };
  }

  // Check Remnawave API connectivity
  try {
    const rwStart = Date.now();
    const REMNAWAVE_URL = process.env.REMNAWAVE_URL;
    const REMNAWAVE_API_KEY = process.env.REMNAWAVE_API_KEY;

    if (REMNAWAVE_URL && REMNAWAVE_API_KEY) {
      const response = await fetch(`${REMNAWAVE_URL}/api/health`, {
        headers: { Authorization: `Bearer ${REMNAWAVE_API_KEY}` },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      checks.remnawave = {
        status: response.ok ? "healthy" : "degraded",
        duration: Date.now() - rwStart,
        message: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } else {
      checks.remnawave = {
        status: "not_configured",
        message: "Remnawave credentials not set",
      };
    }
  } catch (err) {
    checks.remnawave = {
      status: "unhealthy",
      message: err instanceof Error ? err.message : "Remnawave API unreachable",
    };
  }

  // Overall status
  const allHealthy = Object.values(checks).every((c) => c.status === "healthy" || c.status === "not_configured");
  const overallStatus = allHealthy ? "healthy" : "degraded";

  res.status(allHealthy ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    duration: Date.now() - startTime,
  });
});

export default router;
