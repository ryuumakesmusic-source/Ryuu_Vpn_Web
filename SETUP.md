# Ryuu VPN - Fresh Droplet Setup Guide

Complete guide to deploy Ryuu VPN on a brand new DigitalOcean droplet from scratch.

---

## 📋 Prerequisites

- DigitalOcean account
- Domain name (e.g., `ryuukakkoii.site`)
- Domain DNS pointed to your droplet IP
- Remnawave VPN panel URL and API key
- Telegram bot tokens (from @BotFather)

---

## 🚀 Quick Setup (15 minutes)

### **Step 1: Create Droplet**

1. Go to DigitalOcean → Create → Droplets
2. Choose:
   - **Image**: Ubuntu 24.04 LTS
   - **Plan**: Basic ($6/month - 1GB RAM, 1 vCPU, 25GB SSD)
   - **Region**: Singapore (closest to Myanmar)
   - **Authentication**: SSH key (recommended) or password
3. **Hostname**: `ryuu-vpn`
4. Click **Create Droplet**
5. Note your droplet IP address

### **Step 2: Point Domain to Droplet**

In your domain registrar (Namecheap, GoDaddy, etc.):

```
Type    Name    Value           TTL
A       @       YOUR_DROPLET_IP 300
A       www     YOUR_DROPLET_IP 300
```

Wait 5-10 minutes for DNS propagation.

### **Step 3: SSH into Droplet**

```bash
ssh root@YOUR_DROPLET_IP
```

### **Step 4: Run Setup Script**

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/RyuuSad/Ryuu_Vpn_Web/master/setup-droplet.sh | bash
```

The script will:
- ✅ Install Docker
- ✅ Clone your repository
- ✅ Set up firewall
- ✅ Create directory structure
- ✅ Guide you through SSL setup

### **Step 5: Configure Environment**

```bash
cd /opt/ryuu-vpn
cp .env.example .env
nano .env
```

Fill in your credentials (see below for details).

### **Step 6: Deploy**

```bash
chmod +x deploy.sh
./deploy.sh
```

Done! Your VPN system is now running at `https://yourdomain.com`

---

## 🔐 Environment Variables Guide

### **Required Credentials**

```bash
# ── Database ──────────────────────────────────────────────────────────────────
# Generate strong password: openssl rand -base64 32
DATABASE_URL=postgresql://ryuu:YOUR_DB_PASSWORD@db:5432/ryuuvpn
DB_PASSWORD=YOUR_DB_PASSWORD  # Same as above

# ── Authentication ────────────────────────────────────────────────────────────
# Generate: openssl rand -base64 48
SESSION_SECRET=your_random_48_char_secret_here

# Admin accounts password (ryuu/sayuri will use this)
# Generate: openssl rand -base64 24
ADMIN_SECRET=your_admin_password_here

# ── Remnawave VPN Panel ───────────────────────────────────────────────────────
REMNAWAVE_URL=https://panel.ryuukakkoii.site
REMNAWAVE_API_KEY=your_remnawave_api_key_here

# ── Telegram Bots ─────────────────────────────────────────────────────────────
# Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Get your chat ID from @userinfobot
TELEGRAM_ADMIN_CHAT_IDS=123456789

# Mini App bot (separate bot from @BotFather)
MINI_BOT_TOKEN=9876543210:ZYXwvuTSRqpONMlkjIHGfedCBA

# Your website URL
MINI_APP_URL=https://ryuukakkoii.site

# Generate: openssl rand -hex 32
BOT_WEBHOOK_SECRET=your_webhook_secret_64_chars_here

# ── Optional ──────────────────────────────────────────────────────────────────
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

# CORS (leave empty for same-origin only)
ALLOWED_ORIGINS=
```

---

## 🔒 SSL Certificate Setup

### **Option 1: Automated (Recommended)**

The setup script will guide you through Let's Encrypt setup.

### **Option 2: Manual Setup**

```bash
# Install Certbot
apt update
apt install -y certbot

# Stop nginx temporarily
docker compose down nginx

# Get certificate
certbot certonly --standalone -d ryuukakkoii.site -d www.ryuukakkoii.site

# Start nginx
docker compose up -d nginx
```

### **Auto-Renewal**

Certificates auto-renew via cron. Verify:

```bash
certbot renew --dry-run
```

---

## 📁 Directory Structure

After setup, your droplet will have:

```
/opt/ryuu-vpn/
├── .env                    # Your credentials
├── .git/                   # Git repository
├── deploy.sh               # Deployment script
├── docker-compose.yml      # Container orchestration
├── Dockerfile              # App container build
├── artifacts/              # Source code
│   ├── api-server/         # Backend API
│   └── ryuu-vpn/           # Frontend React app
├── lib/                    # Shared libraries
├── deploy/                 # Deployment configs
│   ├── nginx.conf          # Nginx template
│   └── nginx.active.conf   # Active nginx config
└── DEPLOYMENT.md           # This guide

/etc/letsencrypt/           # SSL certificates
/var/lib/docker/volumes/    # Docker volumes (database, uploads)
```

---

## 🔥 Firewall Configuration

The setup script configures UFW firewall:

```bash
# Check firewall status
ufw status

# Should show:
# 22/tcp    ALLOW    # SSH
# 80/tcp    ALLOW    # HTTP
# 443/tcp   ALLOW    # HTTPS
```

---

## 🧪 Testing Your Deployment

### **1. Check Containers**

```bash
docker compose ps
```

Should show all 3 containers running:
- `ryuu-vpn-app` (healthy)
- `ryuu-vpn-db` (healthy)
- `ryuu-vpn-nginx` (running)

### **2. Check Logs**

```bash
docker logs ryuu-vpn-app
```

Look for:
- ✅ `Server listening on port 8080`
- ✅ `Migration applied: 002_add_indexes`
- ✅ `Admin user created: ryuu`

### **3. Test Website**

1. Visit `https://ryuukakkoii.site`
2. Register a test account
3. Login as admin: `ryuu` / `YOUR_ADMIN_SECRET`
4. Test top-up request (upload screenshot)
5. Check Telegram for notification

### **4. Test Telegram Bot**

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Should receive welcome message with Mini App button

---

## 🔧 Common Issues & Solutions

### **Issue: Containers won't start**

```bash
# Check logs
docker compose logs

# Common fixes:
# 1. Missing .env file
cp .env.example .env
nano .env

# 2. Port already in use
lsof -i :80
lsof -i :443
# Kill conflicting process or change ports
```

### **Issue: SSL certificate failed**

```bash
# Make sure DNS is propagated
dig ryuukakkoii.site

# Try manual certificate
docker compose down nginx
certbot certonly --standalone -d ryuukakkoii.site
docker compose up -d nginx
```

### **Issue: Database connection failed**

```bash
# Check DB_PASSWORD matches in .env
grep DB_PASSWORD .env
grep DATABASE_URL .env

# Restart database
docker compose restart db
```

### **Issue: Nginx 502 Bad Gateway**

```bash
# App container might be down
docker compose ps
docker logs ryuu-vpn-app

# Restart app
docker compose restart app
```

### **Issue: Screenshots not loading**

```bash
# Check uploads volume
docker volume ls | grep uploads

# Check nginx can access
docker exec ryuu-vpn-nginx ls -la /app/uploads
```

---

## 📊 Monitoring

### **Check Resource Usage**

```bash
# CPU/Memory
docker stats

# Disk space
df -h

# Database size
docker exec ryuu-vpn-db psql -U ryuu -d ryuuvpn -c "SELECT pg_size_pretty(pg_database_size('ryuuvpn'));"
```

### **View Logs**

```bash
# All services
docker compose logs -f

# Specific service
docker logs -f ryuu-vpn-app
docker logs -f ryuu-vpn-db
docker logs -f ryuu-vpn-nginx

# Last 100 lines
docker logs --tail 100 ryuu-vpn-app
```

---

## 🔄 Updates

When you push new code to GitHub:

```bash
cd /opt/ryuu-vpn
./deploy.sh
```

The script automatically:
1. Pulls latest code
2. Rebuilds containers
3. Restarts services
4. Verifies deployment

---

## 💾 Backups

### **Database Backup**

```bash
# Manual backup
docker exec ryuu-vpn-db pg_dump -U ryuu ryuuvpn > backup-$(date +%Y%m%d).sql

# Automated daily backups (add to crontab)
crontab -e
# Add this line:
0 2 * * * docker exec ryuu-vpn-db pg_dump -U ryuu ryuuvpn > /opt/backups/ryuu-vpn-$(date +\%Y\%m\%d).sql
```

### **Full System Backup**

```bash
# Backup everything
tar -czf ryuu-vpn-backup-$(date +%Y%m%d).tar.gz \
  /opt/ryuu-vpn/.env \
  /opt/ryuu-vpn/deploy/nginx.active.conf \
  /etc/letsencrypt

# Backup database
docker exec ryuu-vpn-db pg_dump -U ryuu ryuuvpn > db-backup.sql

# Upload to DigitalOcean Spaces or download locally
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Domain DNS configured and propagated
- [ ] SSL certificate installed and working
- [ ] `.env` file configured with strong passwords
- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] Admin accounts tested (ryuu/sayuri)
- [ ] Telegram notifications working
- [ ] Remnawave API connected
- [ ] Test user registration and login
- [ ] Test plan purchase flow
- [ ] Test top-up request and approval
- [ ] Backups configured
- [ ] Monitoring set up

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker compose logs`
2. Review this guide's troubleshooting section
3. Check GitHub issues
4. Verify all environment variables are set correctly

---

## 🎉 You're Done!

Your Ryuu VPN system is now running on a fresh droplet with:

- ✅ Secure HTTPS with auto-renewing SSL
- ✅ Docker containerization
- ✅ Automated deployments
- ✅ Database persistence
- ✅ Screenshot storage
- ✅ Telegram integration
- ✅ Admin panel
- ✅ Production-ready configuration

**Access your system**: `https://ryuukakkoii.site`

**Admin login**: `ryuu` / `YOUR_ADMIN_SECRET`
