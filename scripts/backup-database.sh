#!/bin/bash
# Database Backup Script for Ryuu VPN
# Creates a timestamped backup of the PostgreSQL database

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

# Load environment variables
if [ -f /opt/ryuu-vpn/.env ]; then
    source /opt/ryuu-vpn/.env
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Extract database credentials from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}📦 Creating backup: ${BACKUP_FILE}${NC}"

# Create backup using docker exec
docker exec ryuu-vpn-db pg_dump -U "$DB_USER" "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress the backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Get file size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${GREEN}📁 Location: ${BACKUP_DIR}/${BACKUP_FILE}.gz${NC}"
echo -e "${GREEN}💾 Size: ${BACKUP_SIZE}${NC}"

# Keep only last 7 backups
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 7)...${NC}"
cd "$BACKUP_DIR"
ls -t ryuu-vpn-backup-*.sql.gz | tail -n +8 | xargs -r rm

echo -e "${GREEN}✨ Backup process complete!${NC}"
