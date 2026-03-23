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

function parseCron(schedule: string): number {
  // Simple daily cron parser for "0 9 * * *" format
  // Returns milliseconds until next run
  const parts = schedule.split(" ");
  const minute = parseInt(parts[0]);
  const hour = parseInt(parts[1]);

  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

function runJob(job: typeof CRON_JOBS[0]) {
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

function scheduleJob(job: typeof CRON_JOBS[0]) {
  const msUntilNext = parseCron(job.schedule);
  const nextRun = new Date(Date.now() + msUntilNext);

  logger.info(
    { job: job.name, nextRun: nextRun.toISOString() },
    "Scheduled job"
  );

  setTimeout(() => {
    runJob(job);
    // Reschedule for next day (24 hours)
    setInterval(() => runJob(job), 24 * 60 * 60 * 1000);
  }, msUntilNext);
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
