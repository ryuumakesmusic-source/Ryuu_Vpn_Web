import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger.js";

const FALLBACK_HASHES: Record<string, string> = {
  ryuu: "$2b$12$IS8LRjQr/IKdfuL4MBrMCeTF454HGTKAzKHagKG5SY6/tqPBUHCe6",
  sayuri: "$2b$12$CrvkJJzI0rm6jBllMc.lDOExI0iWhn8MHA2WGY8D4tozw4danYP/e",
};

export async function seedAdminUsers() {
  const adminSecret = process.env["ADMIN_SECRET"];

  let passwordHash: string;

  if (adminSecret) {
    passwordHash = await bcrypt.hash(adminSecret, 12);
    logger.info("Admin users seeded with ADMIN_SECRET password");
  } else {
    passwordHash = FALLBACK_HASHES["ryuu"]!;
    logger.warn(
      "ADMIN_SECRET not set — admin users seeded with dev default passwords (ryuu123 / sayuri123). Set ADMIN_SECRET in production.",
    );
  }

  const admins = [
    { username: "ryuu", passwordHash },
    { username: "sayuri", passwordHash },
  ];

  for (const admin of admins) {
    const existing = await db.query.usersTable.findFirst({
      where: (u, { eq }) => eq(u.username, admin.username),
      columns: { id: true },
    });

    if (!existing) {
      await db.insert(usersTable).values({ ...admin, isAdmin: true });
      logger.info({ username: admin.username }, "Admin user created");
    }
  }
}
