# 🚀 Ryuu VPN

A modern VPN management system with Telegram Mini App integration, built with React, TypeScript, and PostgreSQL.

## ✨ Features

- 🤖 **Telegram Bot Integration** - Manage VPN subscriptions via Telegram
- 📱 **Mini App Interface** - Beautiful web interface accessible from Telegram
- 💳 **Top-Up System** - Easy balance management with admin approval
- 📊 **Admin Dashboard** - Manage users, approve top-ups, view statistics
- 🔐 **Secure Authentication** - Session-based auth with Telegram verification
- 💾 **Automated Backups** - Daily database backups sent to Telegram
- 🐳 **Docker Deployment** - One-command deployment with Docker Compose
- 🔄 **Easy Migration** - Backup and restore tools for VPS migration

## 🎯 Quick Start

### One-Click Installation

```bash
# On a fresh Ubuntu 22.04 VPS
curl -fsSL https://raw.githubusercontent.com/RyuuSad/Ryuu_Vpn_Web/master/install.sh | sudo bash
```

That's it! The script will:
- ✅ Install Docker
- ✅ Configure firewall
- ✅ Clone repository
- ✅ Set up SSL (optional)
- ✅ Generate secure credentials
- ✅ Deploy the application
- ✅ Configure automated backups

### Manual Installation

If you prefer manual setup:

```bash
# Clone repository
git clone https://github.com/RyuuSad/Ryuu_Vpn_Web.git
cd Ryuu_Vpn_Web

# Copy and configure environment
cp .env.example .env
nano .env

# Deploy with Docker
docker compose up -d --build
```

## 📋 Prerequisites

- Ubuntu 22.04 VPS (1GB RAM minimum)
- Domain name pointing to your VPS
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Remnawave VPN Panel API access

## 🔧 Configuration

Edit `/opt/ryuu-vpn/.env` and configure:

```bash
# VPN Panel
REMNAWAVE_URL=https://your-panel.example.com
REMNAWAVE_API_KEY=your_api_key_here

# Telegram Bots
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_IDS=your_chat_id_here
MINI_BOT_TOKEN=your_mini_bot_token_here

# Domain
MINI_APP_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com

# Admin Password
ADMIN_SECRET=change_this_password
```

After editing, restart services:
```bash
cd /opt/ryuu-vpn
docker compose restart
```

## 📦 Backup & Restore

### Create Backup
```bash
# Local backup
./scripts/backup-database.sh

# Backup + send to Telegram
./scripts/backup-and-send-telegram.sh
```

### Restore Backup
```bash
./scripts/restore-database.sh /path/to/backup.sql.gz
```

### Automated Daily Backups
```bash
# Set up cron job (already done by install.sh)
crontab -e
# Add: 0 2 * * * /opt/ryuu-vpn/scripts/backup-and-send-telegram.sh
```

## 🛠️ Common Commands

```bash
# View logs
docker logs -f ryuu-vpn-app

# Restart services
docker compose restart

# Update application
git pull origin master
docker compose up -d --build

# Check status
docker compose ps
```

## 📁 Project Structure

```
Ryuu_Vpn_Web/
├── artifacts/
│   ├── api-server/      # Backend API (Express + TypeScript)
│   └── ryuu-vpn/        # Frontend (React + TypeScript)
├── scripts/
│   ├── backup-database.sh              # Local backup
│   ├── backup-and-send-telegram.sh     # Telegram backup
│   └── restore-database.sh             # Restore from backup
├── deploy/              # Nginx configuration
├── install.sh           # One-click installer
├── docker-compose.yml   # Docker services
└── QUICK_DEPLOY.md      # Detailed deployment guide
```

## 🔐 Security

- All secrets auto-generated during installation
- SSL/TLS encryption with Let's Encrypt
- Firewall configured (SSH, HTTP, HTTPS only)
- Session-based authentication
- Environment variables for sensitive data

## 🚀 Deployment

### New VPS Setup
```bash
curl -fsSL https://raw.githubusercontent.com/RyuuSad/Ryuu_Vpn_Web/master/install.sh | sudo bash
```

### Migration to New VPS
1. **Backup old server:**
   ```bash
   ./scripts/backup-and-send-telegram.sh
   ```

2. **Install on new server:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/RyuuSad/Ryuu_Vpn_Web/master/install.sh | sudo bash
   ```

3. **Restore backup:**
   ```bash
   ./scripts/restore-database.sh /path/to/backup.sql.gz
   ```

See [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for detailed instructions.

## 📖 Documentation

- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Complete deployment guide
- **[.env.example](.env.example)** - Environment variables reference

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
1. Check logs: `docker logs -f ryuu-vpn-app`
2. Verify `.env` configuration
3. Ensure domain DNS is correct
4. Check firewall: `ufw status`

## 🎉 Credits

Built with:
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Docker](https://www.docker.com/) - Containerization
- [Telegram Bot API](https://core.telegram.org/bots/api) - Bot integration

---

**Made with ❤️ for Ryuu VPN users**
