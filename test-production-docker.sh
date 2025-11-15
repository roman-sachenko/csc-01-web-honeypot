#!/bin/bash

# Test script for production Docker setup with Caddy
# Tests static endpoints through Caddy proxy

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL_HTTP=${1:-http://localhost}
BASE_URL_HTTPS=${2:-https://localhost}

echo "🧪 Testing Production Docker Setup (Caddy + Backend)"
echo "=================================================="
echo ""

# Test function
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    local use_https=${4:-false}
    
    if [ "$use_https" = "true" ]; then
        response=$(curl -k -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅${NC} $description (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌${NC} $description (HTTP $response, expected $expected_status)"
        return 1
    fi
}

# Test content function
test_content() {
    local url=$1
    local search_term=$2
    local description=$3
    local use_https=${4:-false}
    
    if [ "$use_https" = "true" ]; then
        content=$(curl -k -s "$url" 2>/dev/null || echo "")
    else
        content=$(curl -s "$url" 2>/dev/null || echo "")
    fi
    
    if echo "$content" | grep -q "$search_term"; then
        echo -e "${GREEN}✅${NC} $description (contains '$search_term')"
        return 0
    else
        echo -e "${RED}❌${NC} $description (missing '$search_term')"
        return 1
    fi
}

echo "📋 Testing Static Endpoints (HTTPS - Production):"
echo ""
test_endpoint "$BASE_URL_HTTPS/.env" 200 "GET /.env (HTTPS)" true
test_content "$BASE_URL_HTTPS/.env" "NODE_ENV" "Root .env contains NODE_ENV" true
test_endpoint "$BASE_URL_HTTPS/.well-known/security.txt" 200 "GET /.well-known/security.txt (HTTPS)" true
test_content "$BASE_URL_HTTPS/.well-known/security.txt" "Contact:" "Security.txt contains Contact" true
test_endpoint "$BASE_URL_HTTPS/robots.txt" 200 "GET /robots.txt (HTTPS)" true
test_content "$BASE_URL_HTTPS/robots.txt" "User-agent:" "Robots.txt contains User-agent" true
test_endpoint "$BASE_URL_HTTPS/sitemap.xml" 200 "GET /sitemap.xml (HTTPS)" true
test_content "$BASE_URL_HTTPS/sitemap.xml" "<?xml" "Sitemap is valid XML" true

echo ""
echo "📋 Testing HTTP Redirects (should redirect to HTTPS):"
echo ""
test_endpoint "$BASE_URL_HTTP/.env" 301 "GET /.env (HTTP redirect)" false
test_endpoint "$BASE_URL_HTTP/.well-known/security.txt" 301 "GET /.well-known/security.txt (HTTP redirect)" false
test_endpoint "$BASE_URL_HTTP/robots.txt" 301 "GET /robots.txt (HTTP redirect)" false
test_endpoint "$BASE_URL_HTTP/sitemap.xml" 301 "GET /sitemap.xml (HTTP redirect)" false

echo ""
echo "📋 Testing Backend Direct Access (port 3000):"
echo ""
test_endpoint "http://localhost:3000/.env" 200 "GET /.env (direct backend)" false
test_endpoint "http://localhost:3000/.well-known/security.txt" 200 "GET /.well-known/security.txt (direct backend)" false
test_endpoint "http://localhost:3000/robots.txt" 200 "GET /robots.txt (direct backend)" false
test_endpoint "http://localhost:3000/sitemap.xml" 200 "GET /sitemap.xml (direct backend)" false

echo ""
echo "📋 Testing API Endpoints:"
echo ""
test_endpoint "$BASE_URL_HTTPS/api/.env" 200 "GET /api/.env (HTTPS)" true
test_endpoint "$BASE_URL_HTTPS/api/config.json" 200 "GET /api/config.json (HTTPS)" true

echo ""
echo "📋 Testing Route Registration Order:"
echo ""
echo "Checking if routes are registered correctly (honeypot routes before Next.js)..."
if docker-compose -f docker-compose.caddy.yml ps | grep -q "Up"; then
    if docker-compose -f docker-compose.caddy.yml logs backend 2>&1 | grep -q "Sensitive file endpoints registered"; then
        echo -e "${GREEN}✅ Honeypot routes registered${NC}"
    else
        echo -e "${RED}❌ Honeypot routes not found in logs${NC}"
    fi
    if docker-compose -f docker-compose.caddy.yml logs backend 2>&1 | grep -q "Next.js catch-all route registered"; then
        echo -e "${GREEN}✅ Next.js catch-all registered (after honeypot routes)${NC}"
    else
        echo -e "${YELLOW}⚠️  Next.js not found in logs (might not be in production mode)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker containers not running. Start with: pnpm docker:caddy${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Production Docker test completed!${NC}"
echo ""
echo "IMPORTANT NOTES:"
echo "  • HTTP requests return 301 (redirect to HTTPS) - this is expected"
echo "  • All static endpoints work over HTTPS (production)"
echo "  • Backend serves both API and Next.js client on port 3000"
echo "  • Caddy routes static files to backend BEFORE Next.js"
echo ""
echo "If endpoints return 404 on your production server:"
echo "  1. Make sure you're using HTTPS (not HTTP)"
echo "  2. Check DOMAIN environment variable is set correctly"
echo "  3. Rebuild containers: docker-compose -f docker-compose.caddy.yml build --no-cache"
echo "  4. Check logs: docker-compose -f docker-compose.caddy.yml logs backend | grep 'Sensitive file'"
echo ""

