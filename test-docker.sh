#!/bin/bash
set -e

echo "🧪 Testing Docker Setup"
echo "======================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test dev environment
echo "📦 Testing Development Environment..."
echo ""

# Stop any running containers
echo "Cleaning up..."
docker-compose -f docker-compose.caddy.local.yml down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Build and start dev environment
echo "Building and starting dev environment..."
if docker-compose -f docker-compose.caddy.local.yml up -d --build; then
    echo -e "${GREEN}✅ Dev containers started${NC}"
    echo ""
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Check backend health
    echo "Checking backend health..."
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check failed (may need more time)${NC}"
    fi
    
    # Check client
    echo "Checking client..."
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Client is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  Client check failed (may need more time)${NC}"
    fi
    
    # Show logs
    echo ""
    echo "Recent logs:"
    docker-compose -f docker-compose.caddy.local.yml logs --tail=20
    
    echo ""
    echo -e "${GREEN}✅ Dev environment test complete${NC}"
    echo "To view logs: docker-compose -f docker-compose.caddy.local.yml logs -f"
    echo "To stop: docker-compose -f docker-compose.caddy.local.yml down"
else
    echo -e "${RED}❌ Failed to start dev environment${NC}"
    exit 1
fi

