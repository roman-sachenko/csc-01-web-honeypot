#!/bin/bash

# Diagnostic script for production static endpoints
# Run this on your production server to debug 404 issues

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN=${DOMAIN:-truearch.tech}

echo "🔍 Production Static Endpoints Diagnostic"
echo "=========================================="
echo "Domain: $DOMAIN"
echo ""

echo "1. Testing Backend Direct Access (port 3000):"
echo "----------------------------------------------"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/.env 2>/dev/null || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend /.env: $BACKEND_STATUS${NC}"
    curl -s http://localhost:3000/.env | head -2
else
    echo -e "${RED}❌ Backend /.env: $BACKEND_STATUS (expected 200)${NC}"
fi

echo ""
echo "2. Testing Through Caddy HTTPS:"
echo "--------------------------------"
HTTPS_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN/.env 2>/dev/null || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS https://$DOMAIN/.env: $HTTPS_STATUS${NC}"
    curl -k -s https://$DOMAIN/.env | head -2
elif [ "$HTTPS_STATUS" = "404" ]; then
    echo -e "${RED}❌ HTTPS https://$DOMAIN/.env: 404 (NOT FOUND)${NC}"
    echo "   This is the problem! Let's investigate..."
else
    echo -e "${YELLOW}⚠️  HTTPS https://$DOMAIN/.env: $HTTPS_STATUS${NC}"
fi

echo ""
echo "3. Checking Docker Containers:"
echo "-------------------------------"
if docker-compose -f docker-compose.caddy.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers are running${NC}"
    docker-compose -f docker-compose.caddy.yml ps
else
    echo -e "${RED}❌ Containers are not running${NC}"
fi

echo ""
echo "4. Checking Backend Logs for Route Registration:"
echo "-------------------------------------------------"
if docker-compose -f docker-compose.caddy.yml logs backend 2>&1 | grep -q "Sensitive file endpoints registered"; then
    echo -e "${GREEN}✅ Honeypot routes are registered${NC}"
else
    echo -e "${RED}❌ Honeypot routes NOT found in logs${NC}"
fi

if docker-compose -f docker-compose.caddy.yml logs backend 2>&1 | grep -q "Next.js catch-all route registered"; then
    echo -e "${GREEN}✅ Next.js catch-all is registered (after honeypot routes)${NC}"
else
    echo -e "${YELLOW}⚠️  Next.js catch-all not found in logs${NC}"
fi

echo ""
echo "5. Checking Caddy Configuration:"
echo "---------------------------------"
if docker-compose -f docker-compose.caddy.yml exec -T proxy cat /etc/caddy/Caddyfile 2>/dev/null | grep -q "@static_files"; then
    echo -e "${GREEN}✅ Caddyfile has @static_files matcher${NC}"
    echo "   Static files configuration:"
    docker-compose -f docker-compose.caddy.yml exec -T proxy cat /etc/caddy/Caddyfile 2>/dev/null | grep -A 3 "@static_files"
else
    echo -e "${RED}❌ Caddyfile missing @static_files matcher${NC}"
fi

echo ""
echo "6. Checking Recent Requests in Backend Logs:"
echo "---------------------------------------------"
echo "Recent .env requests:"
docker-compose -f docker-compose.caddy.yml logs backend 2>&1 | grep -E "\.env|REQUEST RECEIVED.*\.env" | tail -5

echo ""
echo "7. Testing All Static Endpoints:"
echo "---------------------------------"
for endpoint in "/.env" "/.well-known/security.txt" "/robots.txt" "/sitemap.xml"; do
    STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN$endpoint 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✅ $endpoint: $STATUS${NC}"
    else
        echo -e "${RED}❌ $endpoint: $STATUS${NC}"
    fi
done

echo ""
echo "8. Checking Caddy Access Logs:"
echo "-------------------------------"
if docker-compose -f docker-compose.caddy.yml exec -T proxy cat /var/log/caddy/access.log 2>/dev/null | tail -3 | grep -q ".env"; then
    echo "Recent .env requests in Caddy logs:"
    docker-compose -f docker-compose.caddy.yml exec -T proxy cat /var/log/caddy/access.log 2>/dev/null | tail -3 | grep ".env"
else
    echo "No .env requests found in Caddy logs (or log file doesn't exist)"
fi

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo ""
echo "If endpoints return 404, check:"
echo "  1. DOMAIN environment variable is set correctly"
echo "  2. Caddyfile has @static_files matcher with /.env"
echo "  3. Backend routes are registered (check logs)"
echo "  4. DNS points to your server"
echo "  5. SSL certificate is valid (check Caddy logs)"
echo ""

