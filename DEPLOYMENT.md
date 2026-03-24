# Ryuu VPN - Production Deployment Guide

## ✅ Production Ready!

Your system is fully production-ready with:
- Secure authentication & authorization
- Database transactions (no race conditions)
- Retry logic for external APIs
- Admin pagination for scalability
- Automated screenshot storage
- Complete Telegram bot integration

---

## 🚀 One-Command Deployment

### **Required Credentials (One-Time Setup)**

1. **Copy environment template**
```bash
cp .env.example .env
nano .env
```

2. **Fill in these credentials:**

```bash
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://ryuu:YOUR_STRONG_PASSWORD@db:5432/ryuuvpn
DB_PASSWORD=YOUR_STRONG_PASSWORD  # Same as above

# ── Auth ──────────────────────────────────────────────────────────────────────
SESSION_SECRET=YOUR_RANDOM_SECRET_HERE  # Generate: openssl rand -base64 48
ADMIN_SECRET=YOUR_ADMIN_PASSWORD_HERE   # For ryuu/sayuri admin accounts

# ── Remnawave VPN Panel ───────────────────────────────────────────────────────
REMNAWAVE_URL=https://panel.ryuukakkoii.site
REMNAWAVE_API_KEY=YOUR_REMNAWAVE_API_KEY

# ── Telegram Bots ─────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_FROM_BOTFATHER
TELEGRAM_ADMIN_CHAT_IDS=YOUR_TELEGRAM_CHAT_ID  # Get from @userinfobot

MINI_BOT_TOKEN=YOUR_MINI_APP_BOT_TOKEN
MINI_APP_URL=https://ryuukakkoii.site
BOT_WEBHOOK_SECRET=YOUR_RANDOM_WEBHOOK_SECRET  # Generate: openssl rand -hex 32

# ── App (Optional) ────────────────────────────────────────────────────────────
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=  # Leave empty for same-origin, or add: https://yourdomain.com
```

---

## 📦 Deploy Everything

### **Option 1: Using Deploy Script (Recommended)**

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Deploy everything with one command
./deploy.sh
```

### **Option 2: Manual Commands**

```bash
git pull origin master
docker-compose down
docker-compose up -d --build
```

---

## 🔍 Verify Deployment

### **Check Container Status**
```bash
docker-compose ps
```

You should see:
- ✅ `ryuu-vpn-app` - Running
- ✅ `ryuu-vpn-db` - Running (healthy)
- ✅ `ryuu-vpn-nginx` - Running

### **Check Logs**
```bash
# All services
docker-compose logs

# Just the app
docker logs -f ryuu-vpn-app

# Look for these success messages:
# ✅ "Server listening on port 8080"
# ✅ "Migration applied: 002_add_indexes"
# ✅ "Admin user created: ryuu"
```

### **Test the System**

1. **Visit your site**: `https://ryuukakkoii.site`
2. **Register a test user**
3. **Login as admin**: username `ryuu`, password from `ADMIN_SECRET`
4. **Test top-up request** (upload screenshot)
5. **Check Telegram** - you should receive notification

---

## 📊 What Gets Deployed

### **Containers**
- **app**: Node.js API server (Express)
- **db**: PostgreSQL 16 database
- **nginx**: Reverse proxy with SSL

### **Volumes (Persistent Data)**
- **pgdata**: Database files
- **uploads**: Screenshot files

### **Networks**
- **app-net**: Internal Docker network

---

## 🔄 Update Process

When you push new code to GitHub:

```bash
# On your VPS
cd /opt/ryuu-vpn
./deploy.sh
```

That's it! The script:
1. Pulls latest code
2. Stops old containers
3. Builds new containers
4. Starts everything
5. Verifies deployment

---

## 🛠️ Maintenance Commands

### **View Logs**
```bash
docker logs -f ryuu-vpn-app        # App logs
docker logs -f ryuu-vpn-db         # Database logs
docker logs -f ryuu-vpn-nginx      # Nginx logs
```

### **Restart Services**
```bash
docker-compose restart             # Restart all
docker-compose restart app         # Restart just app
```

### **Database Backup**
```bash
docker exec ryuu-vpn-db pg_dump -U ryuu ryuuvpn > backup-$(date +%Y%m%d).sql
```

### **Database Restore**
```bash
docker exec -i ryuu-vpn-db psql -U ryuu ryuuvpn < backup-20260323.sql
```

### **Clean Up Old Images**
```bash
docker system prune -a
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Changed `DB_PASSWORD` from default
- [ ] Generated strong `SESSION_SECRET` (48+ characters)
- [ ] Set `ADMIN_SECRET` (not default `ryuu123`)
- [ ] Configured `ALLOWED_ORIGINS` if using separate frontend domain
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Regular backups scheduled

---

## 📈 Monitoring

### **Check System Health**
```bash
# CPU/Memory usage
docker stats

# Disk space
df -h

# Database size
docker exec ryuu-vpn-db psql -U ryuu -d ryuuvpn -c "SELECT pg_size_pretty(pg_database_size('ryuuvpn'));"
```

### **Performance Metrics**
- Database queries: Check logs for slow queries
- API response times: Monitor nginx access logs
- Error rate: Check app logs for errors

---

## 🆘 Troubleshooting

### **Container won't start**
```bash
docker-compose logs app
# Check for missing environment variables
```

### **Database connection failed**
```bash
docker-compose logs db
# Check DB_PASSWORD matches in .env
```

### **Nginx 502 Bad Gateway**
```bash
docker logs ryuu-vpn-app
# App might not be running or crashed
```

### **Screenshots not loading**
```bash
# Check uploads volume exists
docker volume ls | grep uploads

# Check nginx can access volume
docker exec ryuu-vpn-nginx ls -la /app/uploads
```

---

## 🎯 Production Checklist

- [x] Security (JWT, bcrypt, rate limiting, CORS)
- [x] Reliability (transactions, retries, error logging)
- [x] Scalability (pagination, indexes, caching)
- [x] Monitoring (logs, health checks)
- [x] Backups (database, screenshots)
- [x] Documentation (this file!)
- [x] One-command deployment
- [x] Docker volumes for persistence
- [x] Nginx for static files
- [x] SSL ready

---

## 🚀 You're Ready!

Your Ryuu VPN system is production-ready. Just:

1. Fill in `.env` with your credentials
2. Run `./deploy.sh`
3. Done!

No complex setup, no manual configuration, no overwork. Everything is automated.
