#!/bin/bash
# Database Backup Script with Telegram Notification
# Creates a backup and sends it to admin via Telegram

set -e

# Configuration
BACKUP_DIR="/opt/ryuu-vpn/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ryuu-vpn-backup-${TIMESTAMP}.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Load environment variables (export them properly)
if [ -f /opt/ryuu-vpn/.env ]; then
    set -a
    source <(grep -v '^#' /opt/ryuu-vpn/.env | grep -v 'CHAT_IDS')
    set +a
    # Handle TELEGRAM_ADMIN_CHAT_IDS separately (has commas)
    export TELEGRAM_ADMIN_CHAT_IDS=$(grep 'TELEGRAM_ADMIN_CHAT_IDS' /opt/ryuu-vpn/.env | cut -d'=' -f2)
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Check if Telegram credentials are set
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_ADMIN_CHAT_IDS" ]; then
    echo -e "${RED}❌ Error: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_IDS not set in .env${NC}"
    exit 1
fi

# Get first admin chat ID (remove spaces and get first ID)
ADMIN_CHAT_ID=$(echo "$TELEGRAM_ADMIN_CHAT_IDS" | tr -d ' ' | cut -d',' -f1)

# Extract database credentials from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}📦 Creating backup: ${BACKUP_FILE}${NC}"

# Create backup using docker exec
docker exec ryuu-vpn-db pg_dump -U "$DB_USER" "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress the backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Get file size
BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo -e "${GREEN}✅ Backup created: ${BACKUP_SIZE}${NC}"

# Send to Telegram
echo -e "${YELLOW}📤 Sending backup to Telegram...${NC}"

# Get stats for the message
TOTAL_USERS=$(docker exec ryuu-vpn-db psql -U "$DB_USER" "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
TOTAL_BALANCE=$(docker exec ryuu-vpn-db psql -U "$DB_USER" "$DB_NAME" -t -c "SELECT COALESCE(SUM(balance_ks), 0) FROM users;" | tr -d ' ')
ACTIVE_SUBS=$(docker exec ryuu-vpn-db psql -U "$DB_USER" "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE plan_id IS NOT NULL;" | tr -d ' ')

# Create caption with stats
CAPTION="🔐 *Daily Database Backup*

📅 Date: $(date '+%Y-%m-%d %H:%M:%S')
💾 Size: ${BACKUP_SIZE}

📊 *Statistics:*
👥 Total Users: ${TOTAL_USERS}
💰 Total Balance: ${TOTAL_BALANCE} Ks
📱 Active Subscriptions: ${ACTIVE_SUBS}

✅ Backup completed successfully"

# Send document to Telegram
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
    -F "chat_id=${ADMIN_CHAT_ID}" \
    -F "document=@${COMPRESSED_FILE}" \
    -F "caption=${CAPTION}" \
    -F "parse_mode=Markdown")

# Check if send was successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Backup sent to Telegram successfully!${NC}"
else
    echo -e "${RED}❌ Failed to send to Telegram${NC}"
    echo -e "${YELLOW}Response: $RESPONSE${NC}"
fi

# Keep only last 7 backups locally
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 7)...${NC}"
cd "$BACKUP_DIR"
ls -t ryuu-vpn-backup-*.sql.gz | tail -n +8 | xargs -r rm

echo -e "${GREEN}✨ Backup process complete!${NC}"
