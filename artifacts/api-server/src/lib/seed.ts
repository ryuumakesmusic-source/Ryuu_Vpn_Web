import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger.js";

const ADMIN_USERS = [
  {
    username: "ryuu",
    passwordHash: "$2b$10$IS8LRjQr/IKdfuL4MBrMCeTF454HGTKAzKHagKG5SY6/tqPBUHCe6",
    isAdmin: true,
  },
  {
    username: "sayuri",
    passwordHash: "$2b$10$CrvkJJzI0rm6jBllMc.lDOExI0iWhn8MHA2WGY8D4tozw4danYP/e",
    isAdmin: true,
  },
];

export async function seedAdminUsers() {
  for (const admin of ADMIN_USERS) {
    await db
      .insert(usersTable)
      .values(admin)
      .onConflictDoNothing({ target: usersTable.username });
  }
  logger.info("Admin users seeded (ryuu, sayuri)");
}
