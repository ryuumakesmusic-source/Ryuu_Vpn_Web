#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  RYUU VPN — Digital Ocean One-Command Setup Script
#  Run on a fresh Ubuntu 22.04 / 24.04 droplet as root:
#    curl -fsSL https://raw.githubusercontent.com/YOUR/REPO/main/deploy/setup.sh | bash
#  Or upload this file and run:
#    sudo bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}${BOLD}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║        RYUU VPN — Server Setup               ║"
    echo "║        Digital Ocean / Ubuntu                ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}${BOLD}▶ $1${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "  ${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "  ${RED}✗ $1${NC}"
    exit 1
}

# Ask a required field. Usage: ask "Prompt" VARIABLE_NAME ["default"] [secret=true]
ask() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    local secret="$4"
    local value=""

    local display_prompt="${YELLOW}?${NC} ${BOLD}${prompt}${NC}"
    if [ -n "$default" ]; then
        display_prompt="${display_prompt} ${NC}[${default}]"
    fi
    display_prompt="${display_prompt}: "

    while [ -z "$value" ]; do
        echo -ne "$display_prompt"
        if [ "$secret" = "true" ]; then
            read -s value
            echo
        else
            read value
        fi

        if [ -z "$value" ] && [ -n "$default" ]; then
            value="$default"
        fi

        if [ -z "$value" ]; then
            echo -e "  ${RED}This field is required.${NC}"
        fi
    done

    eval "$var_name='$value'"
}

# Ask an optional field (empty input is accepted). Usage: ask_optional "Prompt" VARIABLE_NAME [secret=true]
ask_optional() {
    local prompt="$1"
    local var_name="$2"
    local secret="$3"
    local value=""

    echo -ne "${YELLOW}?${NC} ${BOLD}${prompt}${NC} ${NC}[press Enter to skip]${NC}: "
    if [ "$secret" = "true" ]; then
        read -s value
        echo
    else
        read value
    fi

    eval "$var_name='$value'"
}

generate_secret() {
    openssl rand -base64 48 | tr -d '\n/+=' | head -c 48
}

# ── Checks ────────────────────────────────────────────────────────────────────
print_header

if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo bash deploy/setup.sh"
fi

if ! command -v openssl &>/dev/null; then
    apt-get update -qq && apt-get install -y openssl -qq
fi

# ── Collect values ────────────────────────────────────────────────────────────
echo -e "${YELLOW}I'll ask a few questions, then handle everything else automatically.${NC}"
echo -e "${YELLOW}Your secrets are never stored anywhere except the .env file on this server.${NC}\n"

ask "Your domain (without www)" DOMAIN "ryuukakkoii.site"
ask "GitHub repository URL (e.g. https://github.com/you/ryuu-vpn)" GITHUB_URL ""
ask "Remnawave panel URL (e.g. https://panel.ryuukakkoii.site)" REMNAWAVE_URL "https://panel.ryuukakkoii.site"
ask "Remnawave API key" REMNAWAVE_API_KEY "" true
ask "Admin password (used for ryuu + sayuri accounts)" ADMIN_SECRET "" true
ask "Notification bot token (for payment alerts to admins)" TELEGRAM_BOT_TOKEN "" true
ask "Telegram admin chat IDs (comma-separated, e.g. 123456,789012)" TELEGRAM_ADMIN_CHAT_IDS ""
echo ""
echo -e "${YELLOW}--- Mini App Bot (optional, press Enter to skip) ---${NC}"
echo -e "${YELLOW}This is the bot users open from Telegram to access the shop.${NC}"
ask_optional "Mini App bot token (from @BotFather)" MINI_BOT_TOKEN true

# Auto-generate secrets
SESSION_SECRET=$(generate_secret)
DB_PASSWORD=$(generate_secret)
BOT_WEBHOOK_SECRET=$(generate_secret)

echo -e "\n${GREEN}Got everything. Starting setup — this takes about 3–5 minutes.${NC}\n"

# ── Install Docker ────────────────────────────────────────────────────────────
print_step "Docker"
if ! command -v docker &>/dev/null; then
    print_warning "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    print_success "Docker installed"
else
    print_success "Docker already installed ($(docker --version | cut -d' ' -f3 | tr -d ','))"
fi

if ! docker compose version &>/dev/null 2>&1; then
    print_warning "Installing Docker Compose plugin..."
    apt-get update -qq
    apt-get install -y docker-compose-plugin -qq
fi
print_success "Docker Compose ready"

# ── Install Certbot ───────────────────────────────────────────────────────────
print_step "SSL / Certbot"
if ! command -v certbot &>/dev/null; then
    print_warning "Installing Certbot..."
    apt-get update -qq
    apt-get install -y certbot -qq
    print_success "Certbot installed"
else
    print_success "Certbot already installed"
fi

# ── Clone repository ──────────────────────────────────────────────────────────
print_step "Application Code"
APP_DIR="/opt/ryuu-vpn"

if [ -d "$APP_DIR/.git" ]; then
    print_warning "Directory exists — pulling latest changes..."
    cd "$APP_DIR"
    git pull
else
    print_warning "Cloning repository to $APP_DIR..."
    git clone "$GITHUB_URL" "$APP_DIR"
    cd "$APP_DIR"
fi
print_success "Code ready at $APP_DIR"

# ── Create .env file ──────────────────────────────────────────────────────────
print_step "Environment Configuration"
cat > "$APP_DIR/.env" <<EOF
# RYUU VPN — Auto-generated by setup.sh on $(date)
# Do not share this file — it contains secrets.

DATABASE_URL=postgresql://ryuu:${DB_PASSWORD}@db:5432/ryuuvpn
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

SESSION_SECRET=${SESSION_SECRET}
ADMIN_SECRET=${ADMIN_SECRET}

REMNAWAVE_URL=${REMNAWAVE_URL}
REMNAWAVE_API_KEY=${REMNAWAVE_API_KEY}

TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_ADMIN_CHAT_IDS=${TELEGRAM_ADMIN_CHAT_IDS}

MINI_BOT_TOKEN=${MINI_BOT_TOKEN}
MINI_APP_URL=https://${DOMAIN}
BOT_WEBHOOK_SECRET=${BOT_WEBHOOK_SECRET}

# Used by docker-compose for the DB container
DB_PASSWORD=${DB_PASSWORD}
EOF
chmod 600 "$APP_DIR/.env"
print_success ".env created with secure permissions (600)"

# ── Get SSL Certificate ───────────────────────────────────────────────────────
print_step "SSL Certificate"
echo -e "  Getting certificate for ${BOLD}$DOMAIN${NC} and ${BOLD}www.$DOMAIN${NC}..."
echo -e "  ${YELLOW}Make sure your DNS A record points to this server's IP first!${NC}"
echo -ne "  ${YELLOW}Press Enter when DNS is ready, or Ctrl+C to cancel...${NC} "
read

# Stop anything on port 80 before running standalone certbot
docker compose -f "$APP_DIR/docker-compose.yml" down 2>/dev/null || true

# Try to get cert for both apex and www, fall back to apex only
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" 2>/dev/null \
|| certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    -d "$DOMAIN"

print_success "SSL certificate obtained"

# ── Configure Nginx ───────────────────────────────────────────────────────────
print_step "Nginx Configuration"
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$APP_DIR/deploy/nginx.conf" > "$APP_DIR/deploy/nginx.active.conf"
print_success "Nginx config written for $DOMAIN"

# ── Build & Start Everything ──────────────────────────────────────────────────
print_step "Building & Starting Containers"
print_warning "Building Docker image (first time takes 3–5 min)..."
cd "$APP_DIR"
docker compose up -d --build
print_success "Containers started"

# ── Health Check ──────────────────────────────────────────────────────────────
print_step "Health Check"
echo -e "  Waiting for app to start..."
ATTEMPTS=0
until curl -sf "http://localhost:8080/api/dashboard/plans" > /dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge 30 ]; then
        print_warning "App is taking longer than expected. Check logs with:"
        echo "    docker compose logs app"
        break
    fi
    sleep 3
done
print_success "App is responding"

# ── Register Telegram Mini App Bot Webhook ────────────────────────────────────
# The server registers it automatically on startup via MINI_APP_URL + MINI_BOT_TOKEN.
# We just wait a moment for the app to have registered, then confirm.
if [ -n "$MINI_BOT_TOKEN" ]; then
    print_step "Telegram Mini App Bot Webhook"
    sleep 5
    WEBHOOK_STATUS=$(curl -sf "https://api.telegram.org/bot${MINI_BOT_TOKEN}/getWebhookInfo" 2>/dev/null || echo '{}')
    WEBHOOK_URL=$(echo "$WEBHOOK_STATUS" | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")
    if [ -n "$WEBHOOK_URL" ] && [ "$WEBHOOK_URL" != "" ]; then
        print_success "Webhook registered: $WEBHOOK_URL"
    else
        print_warning "Webhook not yet visible — the server registers it on startup. Check logs:"
        echo "    docker compose logs app | grep webhook"
    fi
fi

# ── Auto-renewal for SSL ──────────────────────────────────────────────────────
print_step "SSL Auto-renewal"
CRON_CMD="0 3 * * * certbot renew --quiet && docker compose -f $APP_DIR/docker-compose.yml exec -T nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -
print_success "Auto-renewal cron job added (runs daily at 3am)"

# ── Install daily backup cron job ─────────────────────────────────────────────
print_step "Daily Telegram Backup"
cp "$APP_DIR/deploy/backup.sh" "$APP_DIR/backup.sh"
chmod +x "$APP_DIR/backup.sh"
BACKUP_CRON="0 2 * * * bash $APP_DIR/backup.sh >> /var/log/ryuu-vpn-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "ryuu-vpn-backup"; echo "$BACKUP_CRON") | crontab -
print_success "Backup cron job added (runs daily at 2am, logs → /var/log/ryuu-vpn-backup.log)"
echo -e "  ${YELLOW}Run manually anytime:${NC}  bash $APP_DIR/backup.sh"

# ── Create update helper script ───────────────────────────────────────────────
cat > "$APP_DIR/update.sh" <<'UPDATEEOF'
#!/bin/bash
# RYUU VPN — One-command update script
# Usage: bash /opt/ryuu-vpn/update.sh
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

APP_DIR="/opt/ryuu-vpn"
cd "$APP_DIR"

echo -e "\n${BLUE}${BOLD}▶ Pulling latest code...${NC}"
git pull

echo -e "\n${BLUE}${BOLD}▶ Rebuilding and restarting containers...${NC}"
docker compose up -d --build

echo -e "\n${BLUE}${BOLD}▶ Waiting for app to start...${NC}"
ATTEMPTS=0
until curl -sf "http://localhost:8080/api/dashboard/plans" > /dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge 30 ]; then
        echo -e "  ${YELLOW}⚠ App taking longer than expected. Check:${NC}"
        echo "    docker compose logs app"
        break
    fi
    sleep 3
done

echo -e "\n${GREEN}✓ Update complete!${NC}"
echo -e "  DB migrations + admin seeding run automatically on startup."
echo -e "  Mini App bot webhook is registered automatically if MINI_BOT_TOKEN is set."
echo ""
echo -e "  ${BLUE}Recent logs:${NC}"
docker compose logs --tail=15 app
UPDATEEOF
chmod +x "$APP_DIR/update.sh"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║          Setup Complete!                     ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BLUE}${BOLD}Website:${NC}     https://$DOMAIN"
echo -e "  ${BLUE}${BOLD}App dir:${NC}     $APP_DIR"
echo -e "  ${BLUE}${BOLD}Logs:${NC}        docker compose logs -f app"
echo -e "  ${BLUE}${BOLD}Update:${NC}      bash $APP_DIR/update.sh"
echo -e "  ${BLUE}${BOLD}Backup:${NC}      bash $APP_DIR/backup.sh"
echo ""
echo -e "${YELLOW}Admin accounts:${NC}"
echo -e "  Username: ryuu     Password: (your ADMIN_SECRET)"
echo -e "  Username: sayuri   Password: (your ADMIN_SECRET)"
echo ""
if [ -n "$MINI_BOT_TOKEN" ]; then
    echo -e "${YELLOW}Mini App Bot:${NC}"
    echo -e "  Webhook auto-registered to: https://$DOMAIN/api/bot/webhook"
    echo -e "  In @BotFather → your bot → Menu Button → Set URL → https://$DOMAIN"
    echo ""
fi
