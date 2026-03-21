#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  RYUU VPN — Daily Backup Script
#  Backs up: PostgreSQL database + project config files
#  Sends the archive to Telegram admin chat(s)
#  Installed by setup.sh as a daily cron job (runs at 2:00 AM server time)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="/opt/ryuu-vpn"
BACKUP_DIR="/opt/ryuu-vpn-backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
ARCHIVE_NAME="ryuu-vpn-backup-${DATE}.tar.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"

# Load env vars from the compose .env file
if [ -f "$APP_DIR/.env" ]; then
  set -a
  source "$APP_DIR/.env"
  set +a
fi

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_ADMIN_CHAT_IDS="${TELEGRAM_ADMIN_CHAT_IDS:-}"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_ADMIN_CHAT_IDS" ]; then
  echo "[backup] ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_IDS not set. Aborting."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# ── 1. Dump PostgreSQL ────────────────────────────────────────────────────────
echo "[backup] Dumping PostgreSQL database..."
DB_DUMP_PATH="${BACKUP_DIR}/db-${DATE}.sql"

docker compose -f "$APP_DIR/docker-compose.yml" exec -T db \
  pg_dump -U ryuuvpn ryuuvpndb > "$DB_DUMP_PATH"

echo "[backup] Database dump saved: $(du -sh "$DB_DUMP_PATH" | cut -f1)"

# ── 2. Archive project + dump ─────────────────────────────────────────────────
echo "[backup] Creating archive..."
tar -czf "$ARCHIVE_PATH" \
  --exclude="$APP_DIR/node_modules" \
  --exclude="$APP_DIR/.git" \
  --exclude="$APP_DIR/artifacts/*/node_modules" \
  --exclude="$APP_DIR/artifacts/*/dist" \
  --exclude="$APP_DIR/artifacts/mockup-sandbox" \
  --exclude="${BACKUP_DIR}" \
  -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")" \
  -C "$BACKUP_DIR" "$(basename "$DB_DUMP_PATH")"

ARCHIVE_SIZE=$(du -sh "$ARCHIVE_PATH" | cut -f1)
echo "[backup] Archive created: $ARCHIVE_NAME ($ARCHIVE_SIZE)"

# Remove the loose SQL dump now that it's inside the archive
rm -f "$DB_DUMP_PATH"

# ── 3. Send via Telegram ──────────────────────────────────────────────────────
CAPTION="🗂 *RYUU VPN Daily Backup*
📅 Date: \`${DATE}\`
📦 Size: \`${ARCHIVE_SIZE}\`
🖥 Server: \`$(hostname)\`

To restore:
1. Copy file to server: \`scp ${ARCHIVE_NAME} root@<IP>:/opt/\`
2. Extract: \`tar -xzf ${ARCHIVE_NAME} -C /opt/\`
3. Run DB restore from the included .sql file
4. Or run setup.sh fresh: \`bash /opt/ryuu-vpn/deploy/setup.sh\`"

SEND_ERRORS=0
IFS=',' read -ra CHAT_IDS <<< "$TELEGRAM_ADMIN_CHAT_IDS"
for CHAT_ID in "${CHAT_IDS[@]}"; do
  CHAT_ID=$(echo "$CHAT_ID" | tr -d ' ')
  echo "[backup] Sending to Telegram chat: $CHAT_ID"
  RESPONSE=$(curl -s -X POST \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
    -F "chat_id=${CHAT_ID}" \
    -F "document=@${ARCHIVE_PATH};filename=${ARCHIVE_NAME}" \
    -F "caption=${CAPTION}" \
    -F "parse_mode=Markdown")

  if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "[backup] ✓ Sent to $CHAT_ID"
  else
    echo "[backup] ✗ Failed to send to $CHAT_ID: $RESPONSE"
    SEND_ERRORS=$((SEND_ERRORS + 1))
  fi
done

# ── 4. Keep only last 7 backups locally ──────────────────────────────────────
echo "[backup] Pruning old backups (keeping last 7)..."
ls -t "$BACKUP_DIR"/ryuu-vpn-backup-*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
echo "[backup] Done. Backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/ryuu-vpn-backup-*.tar.gz 2>/dev/null || echo "  (none)"

if [ "$SEND_ERRORS" -gt 0 ]; then
  echo "[backup] WARNING: $SEND_ERRORS chat(s) failed to receive the backup."
  exit 1
fi

echo "[backup] All done ✓"
