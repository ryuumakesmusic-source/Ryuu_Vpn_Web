# RYUU VPN — Deployment Guide (Digital Ocean)

Complete guide for deploying, managing, updating, and restoring the RYUU VPN server on a Digital Ocean droplet.

---

## Table of Contents

1. [What Gets Deployed](#1-what-gets-deployed)
2. [Before You Start](#2-before-you-start)
3. [DNS Setup](#3-dns-setup)
4. [First-Time Deployment](#4-first-time-deployment)
5. [Verify It's Running](#5-verify-its-running)
6. [Telegram Mini App Setup](#6-telegram-mini-app-setup)
7. [Daily Operations](#7-daily-operations)
8. [Daily Backups (Automatic)](#8-daily-backups-automatic)
9. [Updating the App](#9-updating-the-app)
10. [Restore from Backup](#10-restore-from-backup)
11. [Fresh Reinstall (Server Wiped)](#11-fresh-reinstall-server-wiped)
12. [Troubleshooting](#12-troubleshooting)
13. [File & Directory Reference](#13-file--directory-reference)

---

## 1. What Gets Deployed

Three Docker containers run together:

| Container | What it does |
|---|---|
| `ryuu-vpn-app` | Node.js API + serves the React frontend |
| `ryuu-vpn-db` | PostgreSQL 16 database |
| `ryuu-vpn-nginx` | Nginx reverse proxy, handles HTTPS |

Everything is managed by `docker compose` from `/opt/ryuu-vpn/`.

---

## 2. Before You Start

### Create a Digital Ocean Droplet

- **Image:** Ubuntu 22.04 or 24.04 (LTS)
- **Size:** $6/month Basic (1 GB RAM, 1 CPU) — sufficient
- **Region:** Singapore (closest to Myanmar)
- **Authentication:** SSH key (recommended) or password
- **Note the IP address** shown after creation

### Push your code to GitHub

Export this project from Replit to GitHub using the Git panel in Replit's sidebar. Note the repo URL — you'll need it during setup.

### Secrets you'll need ready

| Secret | Where to find it |
|---|---|
| Remnawave API key | Remnawave panel → Settings → API |
| Telegram bot token | From @BotFather when you created the bot |
| Telegram admin chat IDs | Your Telegram user ID(s), comma-separated |
| Admin secret | A password you choose for admin accounts |

---

## 3. DNS Setup

In your domain registrar (or Cloudflare), add:

| Type | Name | Value |
|---|---|---|
| A | `@` (or `ryuukakkoii.site`) | Your droplet's IP |
| A | `www` | Your droplet's IP |

Wait 5–10 minutes for DNS to propagate before running the setup script.

Check it's working:
```bash
ping ryuukakkoii.site
# Should resolve to your droplet IP
```

---

## 4. First-Time Deployment

SSH into your droplet as root:
```bash
ssh root@YOUR_DROPLET_IP
```

Clone the repo and run the setup script:
```bash
git clone https://github.com/YOUR/REPO.git /opt/ryuu-vpn
sudo bash /opt/ryuu-vpn/deploy/setup.sh
```

The script will ask you for:
1. Your domain (`ryuukakkoii.site`)
2. GitHub repo URL
3. Remnawave API key
4. Telegram bot token
5. Telegram admin chat IDs
6. Admin secret

It then automatically:
- Installs Docker and Docker Compose
- Installs Certbot and gets a free SSL certificate
- Creates a secure `.env` file with all secrets
- Builds the Docker image (~3–5 minutes first time)
- Starts all three containers
- Sets up a daily SSL renewal cron job (3:00 AM)
- Sets up a daily backup cron job (2:00 AM)
- Creates `/opt/ryuu-vpn/update.sh` for future updates

When it finishes you'll see:
```
╔══════════════════════════════════════════════╗
║          Setup Complete!                     ║
╚══════════════════════════════════════════════╝
  Website:   https://ryuukakkoii.site
```

---

## 5. Verify It's Running

```bash
# Check all three containers are up
cd /opt/ryuu-vpn
docker compose ps

# Expected output:
# ryuu-vpn-app    running
# ryuu-vpn-db     running (healthy)
# ryuu-vpn-nginx  running

# Check the app responds
curl -s http://localhost:8080/api/dashboard/plans | head -c 100

# View live logs
docker compose logs -f app
```

Open `https://ryuukakkoii.site` in your browser — you should see the landing page.

---

## 6. Telegram Mini App Setup

After deployment, set the Telegram Mini App URL so users can open the site from inside Telegram:

1. Open Telegram → search `@BotFather`
2. Send `/mybots` → choose your bot (`@noti_for_ryuu_bot`)
3. Choose **Bot Settings** → **Menu Button**
4. Set URL to: `https://ryuukakkoii.site`

Users can now tap the menu button in your bot to open the site inside Telegram.

---

## 7. Daily Operations

### Check container status
```bash
cd /opt/ryuu-vpn
docker compose ps
```

### View logs
```bash
# App logs (live)
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Nginx logs
docker compose logs -f nginx

# Database logs
docker compose logs -f db
```

### Restart all containers
```bash
cd /opt/ryuu-vpn
docker compose restart
```

### Restart just the app
```bash
docker compose restart app
```

### Stop everything
```bash
cd /opt/ryuu-vpn
docker compose down
```

### Start everything again
```bash
cd /opt/ryuu-vpn
docker compose up -d
```

### Run a manual database backup right now
```bash
bash /opt/ryuu-vpn/backup.sh
```

### Check backup logs
```bash
tail -50 /var/log/ryuu-vpn-backup.log
```

### Edit .env secrets (after editing, restart the app)
```bash
nano /opt/ryuu-vpn/.env
cd /opt/ryuu-vpn && docker compose up -d
```

---

## 8. Daily Backups (Automatic)

The setup script installs a cron job that runs every day at **2:00 AM** server time.

Each backup:
1. Dumps the entire PostgreSQL database to a `.sql` file
2. Packs the project source + DB dump into a `.tar.gz` archive
3. Sends the archive file to all Telegram admin chats via the bot
4. Keeps the last 7 backups on the server locally (`/opt/ryuu-vpn-backups/`)

The Telegram message includes the date, archive size, and restore instructions.

### Backup storage location on server
```
/opt/ryuu-vpn-backups/
  ryuu-vpn-backup-2026-03-21_02-00-00.tar.gz
  ryuu-vpn-backup-2026-03-20_02-00-00.tar.gz
  ...
```

### Run a backup manually
```bash
bash /opt/ryuu-vpn/backup.sh
```

### Check the cron schedule
```bash
crontab -l
# You'll see two lines:
# 0 2 * * *  bash /opt/ryuu-vpn/backup.sh ...   ← daily backup at 2am
# 0 3 * * *  certbot renew ...                   ← SSL renewal at 3am
```

---

## 9. Updating the App

Whenever you push new code to GitHub:

```bash
bash /opt/ryuu-vpn/update.sh
```

This pulls the latest code, rebuilds the Docker image, and restarts. The database is untouched.

To update manually step by step:
```bash
cd /opt/ryuu-vpn
git pull
docker compose up -d --build
docker compose logs --tail=30 app
```

---

## 10. Restore from Backup

Use this when you received a backup `.tar.gz` from Telegram and want to restore it to a running server.

### Step 1 — Copy the backup file to the server
```bash
# From your local machine:
scp ryuu-vpn-backup-DATE.tar.gz root@YOUR_DROPLET_IP:/opt/
```

### Step 2 — Extract the project files
```bash
# On the server:
cd /opt
tar -xzf ryuu-vpn-backup-DATE.tar.gz
# This restores /opt/ryuu-vpn/ and the .sql dump inside it
```

### Step 3 — Find the SQL dump inside the archive
```bash
ls /opt/ryuu-vpn-backup-DATE/    # or check wherever it extracted
# Look for: db-DATE.sql
```

### Step 4 — Restore the database
```bash
cd /opt/ryuu-vpn

# Start only the database container first
docker compose up -d db

# Wait for it to be healthy
sleep 10

# Copy the SQL dump into the container and restore
docker compose exec -T db psql -U ryuu ryuuvpn < /path/to/db-DATE.sql
```

### Step 5 — Start everything
```bash
cd /opt/ryuu-vpn
docker compose up -d --build
docker compose ps
```

### Step 6 — Verify
```bash
curl -s http://localhost:8080/api/dashboard/plans
# Should return a JSON list of plans
```

---

## 11. Fresh Reinstall (Server Wiped)

Use this when the droplet was destroyed or you're setting up a brand new server. You'll restore from a backup file received from Telegram.

### Step 1 — Create a new droplet
Same specs as before (Ubuntu 22.04, Singapore, $6/month). Note the new IP.

### Step 2 — Update DNS
Point your domain's A record to the new droplet IP. Wait for propagation.

### Step 3 — SSH into the new server
```bash
ssh root@NEW_DROPLET_IP
```

### Step 4 — Upload the backup and run setup
```bash
# From your local machine (in a separate terminal):
scp ryuu-vpn-backup-DATE.tar.gz root@NEW_DROPLET_IP:/opt/

# On the server — extract the project
cd /opt
tar -xzf ryuu-vpn-backup-DATE.tar.gz
mv ryuu-vpn-backup-DATE ryuu-vpn   # rename if needed
```

### Step 5 — Run the setup script
```bash
sudo bash /opt/ryuu-vpn/deploy/setup.sh
```

Enter your secrets when asked. The script will install Docker, get SSL, and start everything fresh.

### Step 6 — Restore the database
After setup completes and the DB container is healthy:
```bash
cd /opt/ryuu-vpn

# Stop the app so it doesn't write during restore
docker compose stop app

# Restore the database
docker compose exec -T db psql -U ryuu ryuuvpn < /path/to/db-DATE.sql

# Start the app again
docker compose start app
```

### Step 7 — Verify
```bash
docker compose ps
curl -s http://localhost:8080/api/dashboard/plans
```

Open `https://ryuukakkoii.site` — all users, balances, and purchase history should be back.

---

## 12. Troubleshooting

### App not responding / 502 Bad Gateway
```bash
cd /opt/ryuu-vpn

# Check if all containers are running
docker compose ps

# If app container is down, check why
docker compose logs app --tail=50

# Restart
docker compose restart app
```

### Database connection error
```bash
cd /opt/ryuu-vpn

# Check DB health
docker compose ps db

# Should say "healthy" — if not:
docker compose restart db
sleep 10
docker compose restart app
```

### SSL certificate expired or broken
```bash
# Stop Nginx so certbot can use port 80
docker compose stop nginx

# Renew manually
certbot renew --standalone

# Restart Nginx
cd /opt/ryuu-vpn
docker compose start nginx
```

### Port 80/443 already in use
```bash
# Find what's using the port
ss -tlnp | grep ':80\|:443'

# Kill it if it's not Docker
kill -9 PID

# Then start nginx
cd /opt/ryuu-vpn
docker compose start nginx
```

### App crashed and keeps restarting
```bash
# View the crash logs
docker compose logs app --tail=100

# Common causes:
# - Missing env variable → check /opt/ryuu-vpn/.env
# - Remnawave API unreachable → check REMNAWAVE_URL
# - Database not ready → run: docker compose restart db && docker compose restart app
```

### Check disk space (backups filling up)
```bash
df -h
du -sh /opt/ryuu-vpn-backups/

# Delete old backups manually if needed
ls -lh /opt/ryuu-vpn-backups/
rm /opt/ryuu-vpn-backups/ryuu-vpn-backup-OLD-DATE.tar.gz
```

### Backup not sending to Telegram
```bash
# Run manually and see error output
bash /opt/ryuu-vpn/backup.sh

# Common causes:
# - TELEGRAM_BOT_TOKEN wrong in .env
# - TELEGRAM_ADMIN_CHAT_IDS wrong or empty
# - Archive too large (Telegram limit: 50 MB) — check archive size
```

---

## 13. File & Directory Reference

```
/opt/ryuu-vpn/               ← Main project directory
├── .env                     ← All secrets (chmod 600, never share)
├── docker-compose.yml       ← Container definitions
├── Dockerfile               ← How the app image is built
├── backup.sh                ← Manual/cron backup script
├── update.sh                ← Pull latest code & rebuild
├── deploy/
│   ├── setup.sh             ← First-time setup script
│   ├── backup.sh            ← Source of backup.sh (copied to root by setup)
│   ├── nginx.conf           ← Nginx template
│   ├── nginx.active.conf    ← Active Nginx config (generated by setup)
│   └── init.sql             ← Database schema (runs on first DB start)
├── artifacts/
│   ├── api-server/          ← Node.js backend source
│   └── ryuu-vpn/            ← React frontend source
└── ...

/opt/ryuu-vpn-backups/       ← Local backup archive storage (last 7 kept)
/var/log/ryuu-vpn-backup.log ← Backup cron job log
/etc/letsencrypt/            ← SSL certificates (managed by certbot)
```

### Cron jobs installed by setup.sh
```
0 2 * * *   bash /opt/ryuu-vpn/backup.sh >> /var/log/ryuu-vpn-backup.log 2>&1
0 3 * * *   certbot renew --quiet && docker compose ... nginx -s reload
```
