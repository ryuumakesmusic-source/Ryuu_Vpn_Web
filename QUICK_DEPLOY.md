# 🚀 Quick Deployment Guide

## One-Click Fresh VPS Setup

This guide helps you deploy Ryuu VPN to a new VPS and restore user data from backups.

---

## 📋 Prerequisites

- Fresh Ubuntu 22.04 VPS
- Domain name pointing to VPS IP
- SSH access as root
- Backup file from old server (if migrating)

---

## 🆕 Fresh VPS Deployment

### Step 1: Run Setup Script

```bash
# SSH into your new VPS
ssh root@your-vps-ip

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/RyuuSad/Ryuu_Vpn_Web/master/setup-droplet.sh | bash
```

The script will:
- ✅ Install Docker
- ✅ Configure firewall (SSH, HTTP, HTTPS)
- ✅ Clone repository
- ✅ Set up SSL certificate (optional)
- ✅ Create `.env` file

### Step 2: Configure Environment

```bash
cd /opt/ryuu-vpn
nano .env
```

**Required credentials:**
- `DATABASE_URL` and `DB_PASSWORD` (auto-generated)
- `SESSION_SECRET` - Generate: `openssl rand -base64 48`
- `ADMIN_SECRET` - Your admin password
- `REMNAWAVE_URL` and `REMNAWAVE_API_KEY` - Your VPN panel
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_IDS` - Bot credentials
- `MINI_BOT_TOKEN` and `BOT_WEBHOOK_SECRET` - Mini app bot
- `MINI_APP_URL` - Your domain (e.g., `https://ryuukakkoii.site`)
- `ALLOWED_ORIGINS` - Your domain

### Step 3: Deploy Application

```bash
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Verify Deployment

```bash
docker compose ps
docker logs -f ryuu-vpn-app
```

Visit your domain - the app should be running! 🎉

---

## 💾 Backup & Restore (Migration)

### Creating a Backup (Old Server)

```bash
# SSH into old server
ssh root@old-vps-ip

cd /opt/ryuu-vpn

# Create backup
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh
```

Backup saved to: `/opt/ryuu-vpn/backups/ryuu-vpn-backup-YYYYMMDD_HHMMSS.sql.gz`

### Download Backup

```bash
# From your local machine
scp root@old-vps-ip:/opt/ryuu-vpn/backups/ryuu-vpn-backup-*.sql.gz ./
```

### Upload to New Server

```bash
# From your local machine
scp ryuu-vpn-backup-*.sql.gz root@new-vps-ip:/opt/ryuu-vpn/backups/
```

### Restore Backup (New Server)

```bash
# SSH into new server
ssh root@new-vps-ip

cd /opt/ryuu-vpn

# Make sure app is deployed first!
docker compose ps

# Restore database
chmod +x scripts/restore-database.sh
./scripts/restore-database.sh /opt/ryuu-vpn/backups/ryuu-vpn-backup-YYYYMMDD_HHMMSS.sql.gz
```

**✅ All user data, balances, and subscriptions restored!**

---

## 🔄 Automated Backups

### Option 1: Daily Backups to Server Only

```bash
# Add to crontab
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /opt/ryuu-vpn/scripts/backup-database.sh
```

### Option 2: Daily Backups Sent to Telegram 📱

**Get backups delivered to your Telegram every day!**

```bash
# Make script executable
chmod +x /opt/ryuu-vpn/scripts/backup-and-send-telegram.sh

# Test it first
/opt/ryuu-vpn/scripts/backup-and-send-telegram.sh

# Add to crontab
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /opt/ryuu-vpn/scripts/backup-and-send-telegram.sh
```

**What you'll receive:**
- 📦 Compressed backup file (.sql.gz)
- 📊 Database statistics (users, balance, subscriptions)
- 💾 Backup size and timestamp
- ✅ Success confirmation

### Manual Backup Anytime

```bash
cd /opt/ryuu-vpn

# Local backup only
./scripts/backup-database.sh

# Backup + send to Telegram
./scripts/backup-and-send-telegram.sh
```

---

## 🛠️ Common Tasks

### View Logs
```bash
docker logs -f ryuu-vpn-app
docker logs -f ryuu-vpn-db
docker logs -f ryuu-vpn-nginx
```

### Restart Services
```bash
docker compose restart
```

### Update Code
```bash
cd /opt/ryuu-vpn
git pull origin master
docker compose up -d --build
```

### Check Database
```bash
docker exec -it ryuu-vpn-db psql -U ryuu -d ryuuvpn
```

---

## 📊 Backup Management

### List Backups
```bash
ls -lh /opt/ryuu-vpn/backups/
```

### Delete Old Backups
```bash
# Automatically keeps last 7 backups
# Manual cleanup:
cd /opt/ryuu-vpn/backups
rm ryuu-vpn-backup-YYYYMMDD_HHMMSS.sql.gz
```

---

## 🚨 Troubleshooting

### App Won't Start
```bash
# Check logs
docker logs ryuu-vpn-app

# Verify .env file
cat /opt/ryuu-vpn/.env

# Restart
docker compose down
docker compose up -d
```

### Database Connection Failed
```bash
# Check database is healthy
docker compose ps

# Restart database
docker compose restart db
```

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew

# Restart nginx
docker compose restart nginx
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker logs -f ryuu-vpn-app`
2. Verify `.env` configuration
3. Ensure domain DNS is correct
4. Check firewall: `ufw status`

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Backup DB** | `./scripts/backup-database.sh` |
| **Backup + Telegram** | `./scripts/backup-and-send-telegram.sh` |
| **Restore DB** | `./scripts/restore-database.sh <file>` |
| **View Logs** | `docker logs -f ryuu-vpn-app` |
| **Restart** | `docker compose restart` |
| **Update** | `git pull && docker compose up -d --build` |
| **Check Status** | `docker compose ps` |

---

**🎉 Your Ryuu VPN is ready to serve users!**
