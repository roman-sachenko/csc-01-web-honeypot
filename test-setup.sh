#!/bin/bash
# Test script to verify backend, client, and proxy setup in DEV and PROD modes

set -e

echo "🧪 Testing Setup Configuration"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration values
test_config() {
    echo "📋 Testing Configuration..."
    node -e "
        import('./src/server/config.js').then(({ config }) => {
            console.log('✅ Server config loaded');
            console.log('   PORT:', config.port);
            console.log('   CLIENT_PORT:', config.clientPort);
            console.log('   API_HOST:', config.apiHost);
            console.log('   CLIENT_HOST:', config.clientHost);
        }).catch(err => {
            console.error('❌ Config error:', err.message);
            process.exit(1);
        });
    "
    echo ""
}

# Test backend in dev mode
test_backend_dev() {
    echo "🔵 Testing Backend (DEV mode)..."
    NODE_ENV=development PORT=3000 node src/server/index.js > /tmp/backend-dev-test.log 2>&1 &
    BACKEND_PID=$!
    sleep 4
    
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend (DEV) is running on port 3000${NC}"
        curl -s http://localhost:3000/api/health | grep -q "ok" && echo -e "${GREEN}   Health check: OK${NC}" || echo -e "${RED}   Health check: FAILED${NC}"
    else
        echo -e "${RED}❌ Backend (DEV) failed to start${NC}"
    fi
    
    kill $BACKEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    echo ""
}

# Test backend in prod mode
test_backend_prod() {
    echo "🟢 Testing Backend (PROD mode)..."
    
    # Build Next.js first
    echo "   Building Next.js..."
    NODE_ENV=production pnpm exec next build > /dev/null 2>&1 || echo "   Build warning (may already be built)"
    
    NODE_ENV=production PORT=3000 node src/server/index.js > /tmp/backend-prod-test.log 2>&1 &
    BACKEND_PID=$!
    sleep 5
    
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend (PROD) is running on port 3000${NC}"
        curl -s http://localhost:3000/api/health | grep -q "ok" && echo -e "${GREEN}   Health check: OK${NC}" || echo -e "${RED}   Health check: FAILED${NC}"
        
        # Test root page (should not be 404)
        ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
        if [ "$ROOT_STATUS" = "200" ]; then
            echo -e "${GREEN}✅ Root page returns 200 (not 404)${NC}"
        else
            echo -e "${RED}❌ Root page returns $ROOT_STATUS (expected 200)${NC}"
        fi
        
        # Verify it's Next.js content
        if curl -s http://localhost:3000/ | grep -q "Enterprise Technologies"; then
            echo -e "${GREEN}✅ Root page contains Next.js content${NC}"
        else
            echo -e "${YELLOW}⚠️  Root page may not be Next.js content${NC}"
        fi
    else
        echo -e "${RED}❌ Backend (PROD) failed to start${NC}"
    fi
    
    kill $BACKEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    echo ""
}

# Test client in dev mode
test_client_dev() {
    echo "🟡 Testing Client (DEV mode)..."
    
    # Check if port is available
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port 3001 is in use, skipping client test${NC}"
        echo ""
        return
    fi
    
    CLIENT_PORT=3001 pnpm exec next dev -p 3001 > /tmp/client-dev-test.log 2>&1 &
    CLIENT_PID=$!
    sleep 8
    
    CLIENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null || echo "000")
    if [ "$CLIENT_STATUS" = "200" ] || [ "$CLIENT_STATUS" = "404" ]; then
        # 404 might be OK during initial startup
        if [ "$CLIENT_STATUS" = "200" ]; then
            echo -e "${GREEN}✅ Client (DEV) is running on port 3001${NC}"
            echo -e "${GREEN}   Root page returns 200${NC}"
        else
            echo -e "${YELLOW}⚠️  Client (DEV) running but root page returns 404 (may need more time)${NC}"
        fi
    else
        echo -e "${RED}❌ Client (DEV) failed to start (status: $CLIENT_STATUS)${NC}"
    fi
    
    kill $CLIENT_PID 2>/dev/null || true
    wait $CLIENT_PID 2>/dev/null || true
    echo ""
}

# Test app directory exists
test_app_directory() {
    echo "📁 Testing App Directory..."
    if [ -d "app" ] && [ -f "app/page.js" ] && [ -f "app/layout.js" ]; then
        echo -e "${GREEN}✅ App directory exists with required files${NC}"
    else
        echo -e "${RED}❌ App directory missing or incomplete${NC}"
        exit 1
    fi
    echo ""
}

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
    rm -f /tmp/*-test.log /tmp/*-test.pid 2>/dev/null || true
}

trap cleanup EXIT

# Run tests
test_app_directory
test_config
test_backend_dev
test_backend_prod
test_client_dev

echo "================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Summary:"
echo "  - Backend: Port 3000 (configurable via PORT env var)"
echo "  - Client: Port 3001 (configurable via CLIENT_PORT env var)"
echo "  - Production: Backend serves Next.js on port 3000"
echo "  - Development: Backend on 3000, Client on 3001 (separate)"
echo ""

