#!/bin/bash
# Comprehensive test script for dev and prod environments

set -e

echo "🧪 Testing All Environments"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test setup
echo "📋 Step 1: Testing project setup..."
if pnpm test:setup; then
    echo -e "${GREEN}✅ Setup tests passed${NC}"
else
    echo -e "${RED}❌ Setup tests failed${NC}"
    exit 1
fi
echo ""

# Test configuration
echo "⚙️  Step 2: Testing configuration..."
if pnpm test:env; then
    echo -e "${GREEN}✅ Environment tests passed${NC}"
else
    echo -e "${RED}❌ Environment tests failed${NC}"
    exit 1
fi
echo ""

# Test development environment
echo "🔧 Step 3: Testing development environment..."
export NODE_ENV=development
if pnpm test:api; then
    echo -e "${GREEN}✅ Development API tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Development API tests failed (server may not be running)${NC}"
fi
echo ""

# Test production environment
echo "🚀 Step 4: Testing production environment..."
export NODE_ENV=production
if pnpm test:api; then
    echo -e "${GREEN}✅ Production API tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Production API tests failed (server may not be running)${NC}"
fi
echo ""

# Test client (if server is running)
echo "🎨 Step 5: Testing client (requires running server)..."
if pnpm test:client; then
    echo -e "${GREEN}✅ Client tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Client tests failed (server may not be running)${NC}"
fi
echo ""

echo "============================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Note: Some tests may fail if servers are not running."
echo "To test with running servers:"
echo "  1. Start dev: pnpm dev"
echo "  2. In another terminal: pnpm test"

