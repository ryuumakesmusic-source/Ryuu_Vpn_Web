import { spawn } from "child_process";
import { logger } from "./logger.js";

const CRON_JOBS = [
  {
    name: "check-expiring-plans",
    schedule: "0 9 * * *", // Daily at 9 AM Myanmar Time (UTC+6:30 = 2:30 AM UTC)
    command: "node",
    args: ["scripts/dist/check-expiring-plans.js"],
  },
];

/**
 * Returns milliseconds until the next run of a simple daily cron expression.
 * Supports "M H * * *" format only (minute + hour, rest wildcards).
 */
function msUntilNextDailyRun(schedule: string): number {
  const parts = schedule.split(" ");
  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);

  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

function runJob(job: (typeof CRON_JOBS)[0]) {
  logger.info({ job: job.name }, "Running scheduled job");

  const child = spawn(job.command, job.args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code === 0) {
      logger.info({ job: job.name }, "Job completed successfully");
    } else {
      logger.error({ job: job.name, exitCode: code }, "Job failed");
    }
  });

  child.on("error", (err) => {
    logger.error({ job: job.name, err }, "Job process error");
  });
}

/**
 * Schedules a daily job by calculating exact ms until next run, then
 * re-calculating on each subsequent run (avoids drift from setInterval).
 */
function scheduleJob(job: (typeof CRON_JOBS)[0]) {
  const msUntilFirst = msUntilNextDailyRun(job.schedule);
  const nextRun = new Date(Date.now() + msUntilFirst);

  logger.info({ job: job.name, nextRun: nextRun.toISOString() }, "Scheduled job");

  const tick = () => {
    runJob(job);
    // Re-calculate next run time after each execution to avoid drift
    const msUntilNext = msUntilNextDailyRun(job.schedule);
    setTimeout(tick, msUntilNext);
  };

  setTimeout(tick, msUntilFirst);
}

export function startScheduler() {
  if (process.env.NODE_ENV !== "production") {
    logger.info("Scheduler disabled in non-production environment");
    return;
  }

  logger.info({ jobCount: CRON_JOBS.length }, "Starting job scheduler");

  for (const job of CRON_JOBS) {
    scheduleJob(job);
  }
}
