#!/bin/bash
set -e

echo "🚀 Ryuu VPN - One-Command Deployment"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create .env file with your credentials first:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "Install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin master
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down
echo ""

# Build and start containers
echo "🔨 Building and starting containers..."
docker compose up -d --build
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check if containers are running
if docker ps | grep -q "ryuu-vpn-app"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Container Status:"
    docker compose ps
    echo ""
    echo "📝 View logs:"
    echo "  docker logs -f ryuu-vpn-app"
    echo ""
    echo "🌐 Your VPN system is now running!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Check logs:"
    echo "  docker compose logs"
    exit 1
fi
