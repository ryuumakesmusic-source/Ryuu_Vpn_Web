#!/bin/bash
set -e

echo "🚀 Ryuu VPN - Fresh Droplet Setup"
echo "===================================="
echo ""
echo "This script will set up everything needed to run Ryuu VPN on a fresh Ubuntu droplet."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use: sudo bash setup-droplet.sh)"
    exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
    echo "⚠️  Warning: This script is designed for Ubuntu. Proceed anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi

echo "📦 Step 1: Installing Docker..."
echo "================================"

# Remove old Docker versions
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install prerequisites
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release

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

# Start Docker
systemctl start docker
systemctl enable docker

echo "✅ Docker installed successfully"
echo ""

echo "🔥 Step 2: Configuring Firewall..."
echo "==================================="

# Install UFW if not present
apt-get install -y ufw

# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

echo "✅ Firewall configured (SSH, HTTP, HTTPS allowed)"
echo ""

echo "📂 Step 3: Setting up Project Directory..."
echo "==========================================="

# Create project directory
mkdir -p /opt/ryuu-vpn
cd /opt/ryuu-vpn

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Installing git..."
    apt-get install -y git
fi

# Clone repository
echo ""
echo "Enter your GitHub repository URL (or press Enter for default):"
echo "Default: https://github.com/RyuuSad/Ryuu_Vpn_Web.git"
read -r repo_url

if [ -z "$repo_url" ]; then
    repo_url="https://github.com/RyuuSad/Ryuu_Vpn_Web.git"
fi

echo "Cloning repository..."
git clone "$repo_url" .

echo "✅ Repository cloned"
echo ""

echo "🔐 Step 4: SSL Certificate Setup..."
echo "===================================="
echo ""
echo "Do you want to set up SSL certificate now? (y/n)"
echo "Note: Your domain DNS must be pointing to this server first!"
read -r setup_ssl

if [ "$setup_ssl" = "y" ]; then
    echo ""
    echo "Enter your domain name (e.g., ryuukakkoii.site):"
    read -r domain
    
    if [ -z "$domain" ]; then
        echo "❌ Domain name is required for SSL setup"
        echo "You can set up SSL later manually"
    else
        # Install certbot
        apt-get install -y certbot
        
        echo ""
        echo "Getting SSL certificate for $domain and www.$domain..."
        echo "This will use Let's Encrypt (free, auto-renewing)"
        echo ""
        
        # Get certificate
        certbot certonly --standalone \
            -d "$domain" \
            -d "www.$domain" \
            --non-interactive \
            --agree-tos \
            --register-unsafely-without-email \
            || echo "⚠️  SSL setup failed. You can run certbot manually later."
        
        # Create nginx config with actual domain
        if [ -f "deploy/nginx.conf" ]; then
            sed "s/DOMAIN_PLACEHOLDER/$domain/g" deploy/nginx.conf > deploy/nginx.active.conf
            echo "✅ SSL certificate obtained and nginx configured"
        fi
        
        # Set up auto-renewal
        echo "0 0 * * 0 certbot renew --quiet --deploy-hook 'docker compose -f /opt/ryuu-vpn/docker-compose.yml restart nginx'" | crontab -
        echo "✅ Auto-renewal configured (weekly check)"
    fi
else
    echo "⚠️  Skipping SSL setup. You'll need to configure it manually later."
    echo "See SETUP.md for instructions."
fi

echo ""
echo "📝 Step 5: Environment Configuration..."
echo "========================================"
echo ""

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: You must edit .env file with your credentials!"
    echo ""
    echo "Required credentials:"
    echo "  - DATABASE_URL and DB_PASSWORD"
    echo "  - SESSION_SECRET (generate: openssl rand -base64 48)"
    echo "  - ADMIN_SECRET"
    echo "  - REMNAWAVE_URL and REMNAWAVE_API_KEY"
    echo "  - TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_IDS"
    echo "  - MINI_BOT_TOKEN and BOT_WEBHOOK_SECRET"
    echo ""
    echo "Edit now? (y/n)"
    read -r edit_env
    
    if [ "$edit_env" = "y" ]; then
        nano .env
    else
        echo "Remember to edit .env before deploying: nano /opt/ryuu-vpn/.env"
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📁 Project directory: /opt/ryuu-vpn"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials:"
echo "   cd /opt/ryuu-vpn"
echo "   nano .env"
echo ""
echo "2. Deploy the application:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
echo ""
echo "3. Check deployment:"
echo "   docker compose ps"
echo "   docker logs -f ryuu-vpn-app"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - SETUP.md (fresh droplet setup)"
echo "   - DEPLOYMENT.md (deployment guide)"
echo ""
echo "🎉 Your droplet is ready for Ryuu VPN deployment!"
