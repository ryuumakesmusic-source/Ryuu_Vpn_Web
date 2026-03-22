import { pool } from "@workspace/db";
import { logger } from "./logger.js";

const MIGRATIONS = [
  {
    name: "001_initial_schema",
    sql: `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        remnawave_uuid TEXT,
        remnawave_short_uuid TEXT,
        plan_id TEXT,
        balance_ks INTEGER NOT NULL DEFAULT 0,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS topup_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        amount_ks INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        screenshot_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS plan_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        plan_id TEXT NOT NULL,
        price_ks TEXT NOT NULL,
        purchased_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `,
  },
];

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    for (const migration of MIGRATIONS) {
      const result = await client.query(
        "SELECT name FROM _migrations WHERE name = $1",
        [migration.name],
      );

      if (result.rowCount === 0) {
        logger.info({ migration: migration.name }, "Applying migration");
        await client.query("BEGIN");
        try {
          await client.query(migration.sql);
          await client.query(
            "INSERT INTO _migrations (name) VALUES ($1)",
            [migration.name],
          );
          await client.query("COMMIT");
          logger.info({ migration: migration.name }, "Migration applied");
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        }
      } else {
        logger.debug({ migration: migration.name }, "Migration already applied");
      }
    }

    logger.info("All migrations up to date");
  } finally {
    client.release();
  }
}
