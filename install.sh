#!/bin/bash
# Ryuu VPN - One-Click Installation Script
# For fresh Ubuntu 22.04 VPS

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                    RYUU VPN INSTALLER                      ║"
echo "║                  One-Click VPS Setup                       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root: sudo bash install.sh${NC}"
    exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
    echo -e "${YELLOW}⚠️  Warning: This script is designed for Ubuntu 22.04${NC}"
    read -p "Continue anyway? (y/n): " -r
    if [ "$REPLY" != "y" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}📦 Step 1/7: Installing Docker...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Remove old Docker versions
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install prerequisites
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release git

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl start docker
systemctl enable docker

echo -e "${GREEN}✅ Docker installed${NC}"
echo ""

echo -e "${GREEN}🔥 Step 2/7: Configuring Firewall...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

apt-get install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

echo -e "${GREEN}✅ Firewall configured${NC}"
echo ""

echo -e "${GREEN}📂 Step 3/7: Cloning Repository...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p /opt/ryuu-vpn
cd /opt/ryuu-vpn

if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest..."
    git pull origin master
else
    git clone https://github.com/RyuuSad/Ryuu_Vpn_Web.git .
fi

echo -e "${GREEN}✅ Repository ready${NC}"
echo ""

echo -e "${GREEN}🔐 Step 4/7: SSL Certificate Setup...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Do you want to set up SSL certificate now? (y/n)"
echo -e "${YELLOW}Note: Your domain DNS must be pointing to this server!${NC}"
read -r setup_ssl

if [ "$setup_ssl" = "y" ]; then
    echo ""
    echo "Enter your domain name (e.g., example.com):"
    read -r domain
    
    if [ -z "$domain" ]; then
        echo -e "${RED}❌ Domain required for SSL${NC}"
        setup_ssl="n"
    else
        apt-get install -y certbot
        
        echo ""
        echo "Getting SSL certificate for $domain and www.$domain..."
        
        certbot certonly --standalone \
            -d "$domain" \
            -d "www.$domain" \
            --non-interactive \
            --agree-tos \
            --register-unsafely-without-email \
            || echo -e "${YELLOW}⚠️  SSL setup failed. You can run certbot manually later.${NC}"
        
        if [ -f "deploy/nginx.conf" ]; then
            sed "s/DOMAIN_PLACEHOLDER/$domain/g" deploy/nginx.conf > deploy/nginx.active.conf
            echo -e "${GREEN}✅ SSL certificate obtained${NC}"
        fi
        
        # Set up auto-renewal
        (crontab -l 2>/dev/null; echo "0 0 * * 0 certbot renew --quiet --deploy-hook 'docker compose -f /opt/ryuu-vpn/docker-compose.yml restart nginx'") | crontab -
        echo -e "${GREEN}✅ Auto-renewal configured${NC}"
    fi
fi

if [ "$setup_ssl" != "y" ]; then
    echo -e "${YELLOW}⚠️  Skipping SSL. Configure manually later.${NC}"
fi
echo ""

echo -e "${GREEN}📝 Step 5/7: Environment Configuration...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f ".env" ]; then
    # Generate random secrets
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    SESSION_SECRET=$(openssl rand -base64 48)
    BOT_WEBHOOK_SECRET=$(openssl rand -base64 48)
    
    # Create .env from template
    cat > .env << EOF
# RYUU VPN — Auto-generated on $(date)
# Do not share this file — it contains secrets.

DATABASE_URL=postgresql://ryuu:${DB_PASSWORD}@db:5432/ryuuvpn
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

SESSION_SECRET=${SESSION_SECRET}
ADMIN_SECRET=admin123

# IMPORTANT: Configure these before deploying!
REMNAWAVE_URL=https://your-panel.example.com
REMNAWAVE_API_KEY=your_api_key_here

TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_IDS=your_chat_id_here

MINI_BOT_TOKEN=your_mini_bot_token_here
MINI_APP_URL=https://${domain:-your-domain.com}
BOT_WEBHOOK_SECRET=${BOT_WEBHOOK_SECRET}

# Used by docker-compose for the DB container
DB_PASSWORD=${DB_PASSWORD}

ALLOWED_ORIGINS=https://${domain:-your-domain.com}
EOF

    echo -e "${GREEN}✅ Created .env file with auto-generated secrets${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: You must configure these in .env:${NC}"
    echo "  - REMNAWAVE_URL and REMNAWAVE_API_KEY"
    echo "  - TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_IDS"
    echo "  - MINI_BOT_TOKEN"
    echo "  - MINI_APP_URL (set to your domain)"
    echo "  - ADMIN_SECRET (change from default)"
    echo ""
    echo "Edit now? (y/n)"
    read -r edit_env
    
    if [ "$edit_env" = "y" ]; then
        nano .env
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

echo -e "${GREEN}🚀 Step 6/7: Deploying Application...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker compose up -d --build

echo -e "${GREEN}✅ Application deployed${NC}"
echo ""

echo -e "${GREEN}⏰ Step 7/7: Setting Up Automated Backups...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Set up daily database backups to Telegram? (y/n)"
read -r setup_backup

if [ "$setup_backup" = "y" ]; then
    chmod +x scripts/backup-and-send-telegram.sh
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/ryuu-vpn/scripts/backup-and-send-telegram.sh") | crontab -
    echo -e "${GREEN}✅ Daily backups configured (2 AM)${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped backup setup${NC}"
fi
echo ""

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                  ✅ INSTALLATION COMPLETE!                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${GREEN}📁 Installation Directory:${NC} /opt/ryuu-vpn"
echo -e "${GREEN}🌐 Your Domain:${NC} ${domain:-Not configured}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. Configure credentials in .env:"
echo "   ${BLUE}nano /opt/ryuu-vpn/.env${NC}"
echo ""
echo "2. Restart services after editing .env:"
echo "   ${BLUE}cd /opt/ryuu-vpn && docker compose restart${NC}"
echo ""
echo "3. Check application status:"
echo "   ${BLUE}docker compose ps${NC}"
echo "   ${BLUE}docker logs -f ryuu-vpn-app${NC}"
echo ""
echo "4. Access your application:"
echo "   ${BLUE}https://${domain:-your-domain.com}${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📖 Documentation:${NC} QUICK_DEPLOY.md"
echo -e "${GREEN}💾 Backup:${NC} ./scripts/backup-and-send-telegram.sh"
echo -e "${GREEN}🔄 Restore:${NC} ./scripts/restore-database.sh <backup-file>"
echo ""
echo -e "${GREEN}🎉 Your Ryuu VPN is ready to serve users!${NC}"
echo ""
