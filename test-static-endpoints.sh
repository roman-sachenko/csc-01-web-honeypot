#!/bin/bash
# Test script for static endpoints - tests in dev, prod, and test modes

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Static Endpoints"
echo "================================"
echo ""

# Test function
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    # Handle multiple expected status codes (e.g., "404|400")
    if echo "$expected_status" | grep -q "|"; then
        match=false
        IFS='|' read -ra STATUSES <<< "$expected_status"
        for status in "${STATUSES[@]}"; do
            if [ "$response" = "$status" ]; then
                match=true
                break
            fi
        done
        if [ "$match" = true ]; then
            echo -e "${GREEN}✅${NC} $description (HTTP $response)"
            return 0
        else
            echo -e "${RED}❌${NC} $description (HTTP $response, expected one of: $expected_status)"
            return 1
        fi
    elif [ "$response" = "$expected_status" ]; then
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
    
    content=$(curl -s "$url" 2>/dev/null || echo "")
    if echo "$content" | grep -q "$search_term"; then
        echo -e "${GREEN}✅${NC} $description (contains '$search_term')"
        return 0
    else
        echo -e "${RED}❌${NC} $description (missing '$search_term')"
        return 1
    fi
}

# Test headers function
test_headers() {
    local url=$1
    local header_name=$2
    local expected_value=$3
    local description=$4
    
    header_value=$(curl -s -I "$url" 2>/dev/null | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r\n' || echo "")
    if echo "$header_value" | grep -q "$expected_value"; then
        echo -e "${GREEN}✅${NC} $description (has $header_name: $header_value)"
        return 0
    else
        echo -e "${RED}❌${NC} $description (missing or incorrect $header_name)"
        return 1
    fi
}

BASE_URL=${1:-http://localhost:3000}

echo "Testing endpoints at: $BASE_URL"
echo ""

# Test well-known endpoints
echo "📋 Well-Known Endpoints:"
test_endpoint "$BASE_URL/.well-known/security.txt" 200 "GET /.well-known/security.txt"
test_content "$BASE_URL/.well-known/security.txt" "Contact:" "Security.txt contains Contact"
test_content "$BASE_URL/.well-known/security.txt" "security@example.com" "Security.txt contains email"

# Test robots.txt
echo ""
echo "🤖 Robots.txt:"
test_endpoint "$BASE_URL/robots.txt" 200 "GET /robots.txt"
test_content "$BASE_URL/robots.txt" "User-agent:" "Robots.txt contains User-agent"
test_content "$BASE_URL/robots.txt" "/api/.env" "Robots.txt mentions /api/.env"

# Test sitemap.xml
echo ""
echo "🗺️  Sitemap.xml:"
test_endpoint "$BASE_URL/sitemap.xml" 200 "GET /sitemap.xml"
test_content "$BASE_URL/sitemap.xml" "<?xml" "Sitemap is valid XML"
test_content "$BASE_URL/sitemap.xml" "/api/.env" "Sitemap mentions /api/.env"

# Test .env endpoint
echo ""
echo "🔐 Environment Files:"
test_endpoint "$BASE_URL/.env" 200 "GET /.env"
test_content "$BASE_URL/.env" "TEST_" "Root .env file contains TEST_ prefix"
test_content "$BASE_URL/.env" "NODE_ENV" "Root .env file contains NODE_ENV"
test_endpoint "$BASE_URL/api/.env" 200 "GET /api/.env"
test_content "$BASE_URL/api/.env" "TEST_" "API .env file contains TEST_ prefix"
test_content "$BASE_URL/api/.env" "NODE_ENV" "API .env file contains NODE_ENV"

# Test config files
echo ""
echo "⚙️  Config Files:"
test_endpoint "$BASE_URL/api/config.json" 200 "GET /api/config.json"
test_content "$BASE_URL/api/config.json" "database" "Config.json contains database"
test_endpoint "$BASE_URL/api/app/config.yaml" 200 "GET /api/app/config.yaml"
test_content "$BASE_URL/api/app/config.yaml" "database:" "Config.yaml contains database"

# Test credentials
echo ""
echo "🔑 Credentials:"
test_endpoint "$BASE_URL/api/aws/credentials" 200 "GET /api/aws/credentials"
test_content "$BASE_URL/api/aws/credentials" "TEST_" "AWS credentials contain TEST_"
test_endpoint "$BASE_URL/api/v1/secrets" 200 "GET /api/v1/secrets"
test_content "$BASE_URL/api/v1/secrets" "TEST_" "Secrets contain TEST_"

# Test vulnerable headers
echo ""
echo "🛡️  Vulnerable Headers:"
test_headers "$BASE_URL/.well-known/security.txt" "Server" "Apache" "Server header present"
test_headers "$BASE_URL/robots.txt" "X-Powered-By" "PHP" "X-Powered-By header present"
test_headers "$BASE_URL/sitemap.xml" "X-Backend-Service" "api-v1" "X-Backend-Service header present"

# Test path traversal protection
echo ""
echo "🔒 Path Traversal Protection:"
# Test URL-encoded path traversal
test_endpoint "$BASE_URL/.well-known%2F..%2Fsecurity.txt" "404|400" "Path traversal blocked (.well-known encoded)"
test_endpoint "$BASE_URL/api%2F.env%2F.." "404|400" "Path traversal blocked (.env encoded)"
test_endpoint "$BASE_URL/robots.txt%2e%2e" "404|400" "Path traversal blocked (robots.txt encoded)"
# Test that exact paths work
test_endpoint "$BASE_URL/.well-known/security.txt" 200 "Exact path works (.well-known)"
test_endpoint "$BASE_URL/robots.txt" 200 "Exact path works (robots.txt)"

echo ""
echo "================================"
echo -e "${GREEN}✅ All static endpoint tests completed!${NC}"
echo ""
echo "To test in different modes:"
echo "  Dev:   pnpm dev:server (then run: ./test-static-endpoints.sh http://localhost:3000)"
echo "  Prod:  NODE_ENV=production pnpm start (then run: ./test-static-endpoints.sh http://localhost:3000)"
echo "  Test:  NODE_ENV=test PORT=3999 node src/server/index.js (then run: ./test-static-endpoints.sh http://localhost:3999)"
echo ""

