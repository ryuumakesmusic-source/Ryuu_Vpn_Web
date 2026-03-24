#!/bin/bash
# Database Restore Script for Ryuu VPN
# Restores database from a backup file

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No backup file specified${NC}"
    echo -e "${YELLOW}Usage: $0 <backup-file.sql.gz>${NC}"
    echo -e "${YELLOW}Example: $0 /opt/ryuu-vpn/backups/ryuu-vpn-backup-20260324_120000.sql.gz${NC}"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will REPLACE all current database data!${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Restore cancelled${NC}"
    exit 1
fi

echo -e "${GREEN}🔄 Starting database restore...${NC}"

# Load environment variables
if [ -f /opt/ryuu-vpn/.env ]; then
    source /opt/ryuu-vpn/.env
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Extract database credentials
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Decompress if needed
TEMP_FILE="/tmp/restore-temp.sql"
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${YELLOW}📦 Decompressing backup...${NC}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    cp "$BACKUP_FILE" "$TEMP_FILE"
fi

# Stop the app container to prevent connections
echo -e "${YELLOW}🛑 Stopping app container...${NC}"
docker stop ryuu-vpn-app || true

# Drop and recreate database
echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
docker exec ryuu-vpn-db psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec ryuu-vpn-db psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Restore the backup
echo -e "${YELLOW}📥 Restoring database...${NC}"
cat "$TEMP_FILE" | docker exec -i ryuu-vpn-db psql -U "$DB_USER" "$DB_NAME"

# Clean up temp file
rm -f "$TEMP_FILE"

# Restart the app container
echo -e "${YELLOW}🚀 Starting app container...${NC}"
docker start ryuu-vpn-app

echo -e "${GREEN}✅ Database restore completed successfully!${NC}"
echo -e "${GREEN}✨ All user data and balances have been restored${NC}"
