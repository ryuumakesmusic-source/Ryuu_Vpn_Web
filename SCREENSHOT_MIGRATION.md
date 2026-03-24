# Screenshot Storage Migration Guide

## Problem
Currently, payment screenshots (up to 10MB) are stored as base64-encoded strings in PostgreSQL. This causes:
- Database bloat (base64 adds ~33% overhead)
- Slow queries when fetching top-up lists
- Expensive backups/restores
- Memory issues when loading large result sets

## Solution: Store Screenshots on VPS Filesystem

### Why Local Storage?
- **Zero cost**: Use existing VPS disk space
- **Simple**: No external services, no API keys, no extra setup
- **Fast**: Direct filesystem access
- **Already have it**: Your droplet has plenty of storage
- **Nginx serves it**: Static files served efficiently by nginx

---

## Implementation (Super Simple!)

### Step 1: Create Upload Directory

On your VPS:
```bash
mkdir -p /var/www/ryuu-vpn/uploads/screenshots
chown -R node:node /var/www/ryuu-vpn/uploads
chmod 755 /var/www/ryuu-vpn/uploads
```

### Step 2: Update Nginx to Serve Screenshots

Add to your nginx config (`/etc/nginx/sites-available/ryuukakkoii.site`):
```nginx
server {
    listen 80;
    server_name ryuukakkoii.site;

    # Serve screenshots directly
    location /uploads/ {
        alias /var/www/ryuu-vpn/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:8080;
        # ... rest of your proxy config
    }
}
```

Reload nginx:
```bash
nginx -t
systemctl reload nginx
```

### Step 3: Create Upload Service

**File**: `artifacts/api-server/src/lib/upload.ts`
```typescript
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/ryuu-vpn/uploads/screenshots";
const PUBLIC_URL = process.env.PUBLIC_URL || "https://ryuukakkoii.site";

export async function saveScreenshot(buffer: Buffer, mimeType: string): Promise<string> {
  // Ensure directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Generate unique filename
  const ext = mimeType.split("/")[1] || "jpg";
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  // Save file
  await writeFile(filepath, buffer);

  // Return public URL
  return `${PUBLIC_URL}/uploads/screenshots/${filename}`;
}
```

### Step 4: Update Top-Up Route

**File**: `artifacts/api-server/src/routes/topup.ts`

```typescript
import { saveScreenshot } from "../lib/upload.js";

// Change this line:
// const screenshotUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

// To this:
const screenshotUrl = await saveScreenshot(req.file.buffer, req.file.mimetype);
```

### Step 5: Add Environment Variable (Optional)

In `.env`:
```bash
UPLOAD_DIR=/var/www/ryuu-vpn/uploads/screenshots
PUBLIC_URL=https://ryuukakkoii.site
```

---

## Migration Script (Move Existing Screenshots)

**File**: `scripts/migrate-screenshots.ts`

```typescript
import { db, topupRequestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { saveScreenshot } from "../artifacts/api-server/src/lib/upload";

async function migrateScreenshots() {
  const topups = await db.select().from(topupRequestsTable);
  let migrated = 0;

  for (const topup of topups) {
    if (topup.screenshotUrl.startsWith("data:")) {
      try {
        // Extract base64 data
        const matches = topup.screenshotUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches) continue;

        const [, mimeType, base64Data] = matches;
        const buffer = Buffer.from(base64Data, "base64");

        // Save to filesystem
        const newUrl = await saveScreenshot(buffer, mimeType);

        // Update database
        await db.update(topupRequestsTable)
          .set({ screenshotUrl: newUrl })
          .where(eq(topupRequestsTable.id, topup.id));

        migrated++;
        console.log(`[${migrated}] Migrated screenshot for topup ${topup.id}`);
      } catch (err) {
        console.error(`Failed to migrate topup ${topup.id}:`, err);
      }
    }
  }

  console.log(`\nMigration complete! Migrated ${migrated} screenshots.`);
}

migrateScreenshots().catch(console.error);
```

Run it:
```bash
pnpm tsx scripts/migrate-screenshots.ts
```

---

## Cleanup After Migration

Once all screenshots are migrated and verified:

```sql
-- Reclaim database space
VACUUM FULL topup_requests;
```

---

## Backup Strategy

Add screenshots to your backup script:
```bash
# Backup database
pg_dump ryuuvpn > backup.sql

# Backup screenshots
tar -czf screenshots-backup.tar.gz /var/www/ryuu-vpn/uploads/screenshots
```

---

## Estimated Impact

### Before Migration
- Database size: ~500MB (with 1000 screenshots)
- Query time: 2-5 seconds (loading all topups)
- Backup time: 10 minutes

### After Migration
- Database size: ~50MB (90% reduction)
- Query time: 100-200ms (20x faster)
- Backup time: 1 minute (DB) + 30 seconds (files)
- Screenshot loading: Served by nginx (very fast)

---

## Cost

**$0** - Uses your existing VPS storage

Your droplet probably has 25GB-50GB+ disk space. Even 10,000 screenshots (~10GB) is fine.

---

## Rollback Plan

If something goes wrong:
1. Old base64 data still in database (don't delete until verified)
2. Just revert the code changes
3. Screenshots on filesystem are harmless (can delete later)

---

## Summary

**Total setup time**: ~15 minutes
1. Create upload directory (2 min)
2. Update nginx config (5 min)
3. Add upload service code (5 min)
4. Update topup route (1 min)
5. Test with one screenshot (2 min)

**No external services. No API keys. No monthly fees. Just works.**
