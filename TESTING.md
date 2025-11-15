# Testing Guide

This document describes how to test the application in different environments.

## Quick Start

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:setup      # Test project setup and configuration
pnpm test:api        # Test all API endpoints
pnpm test:client     # Test client pages
pnpm test:env        # Test environment configuration
pnpm test:all        # Run comprehensive test suite
```

## Test Suites

### Setup Tests (`tests/setup.test.js`)

Tests project structure and configuration:
- Verifies `app` symlink exists and points to `src/client`
- Checks all required directories and files exist
- Validates configuration files can be imported
- Verifies Docker files exist

**Run:** `pnpm test:setup`

### API Tests (`tests/api-comprehensive.test.js`)

Tests all API endpoints:
- Health and system endpoints
- Authentication endpoints
- Admin endpoints
- User endpoints (IDOR simulation)
- SQL injection endpoints
- XSS endpoints
- Chat endpoints
- Upload/download endpoints
- Command execution endpoints
- SSRF endpoints
- Honeypot endpoints
- Path traversal simulation

**Run:** `pnpm test:api`

**Note:** Requires backend server running on `http://localhost:3000`

### Client Tests (`tests/client.test.js`)

Tests all client pages:
- Home page
- Login page
- Admin dashboard
- Search page
- Comments page
- Chat page
- Upload page
- Download page
- Execute page
- Fetch page
- User profile pages

**Run:** `pnpm test:client`

**Note:** Requires client server running on `http://localhost:3001`

### Environment Tests (`tests/env.test.js`)

Tests environment configuration:
- Default values work
- Environment variables are configurable
- Ports can be configured
- Health checks work

**Run:** `pnpm test:env`

## Testing Development Environment

### 1. Start Development Servers

```bash
# Start both backend and client
pnpm dev

# Or start separately
pnpm dev:server  # Backend on port 3000
pnpm dev:client  # Client on port 3001
```

### 2. Run Tests

```bash
# In another terminal, run tests
pnpm test:api        # Test API endpoints
pnpm test:client     # Test client pages
pnpm test:dev        # Test with NODE_ENV=development
```

### 3. Manual Testing

- **Backend API:** `http://localhost:3000/api/docs` (Swagger UI)
- **Client:** `http://localhost:3001`
- **Health Check:** `http://localhost:3000/api/health`

## Testing Production Environment

### 1. Build for Production

```bash
# Build Next.js application
pnpm build
```

### 2. Start Production Server

```bash
# Start production server (serves both backend and client)
pnpm start:prod
```

### 3. Run Tests

```bash
# Test with production environment
pnpm test:prod
```

### 4. Docker Production Testing

```bash
# Build and run with Docker
pnpm docker:build
pnpm docker:run

# Or with Caddy (automatic HTTPS)
export DOMAIN=your-domain.com
pnpm docker:caddy
```

## Testing with Docker

### Development Environment

```bash
# Start development environment with Docker
pnpm docker:dev

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Run tests (from host)
pnpm test:api
pnpm test:client
```

### Production Environment

```bash
# Build production image
pnpm docker:build

# Start production stack
pnpm docker:run

# Or with Caddy
export DOMAIN=your-domain.com
pnpm docker:caddy

# View logs
docker-compose -f docker-compose.caddy.yml logs -f
```

## Test Coverage

### API Endpoints (50+ endpoints)

✅ Health & System
- `/api/health`
- `/api/system/info`
- `/api/v1/status`

✅ Authentication
- `POST /api/login`
- `GET /api/profile`
- `POST /api/profile/update`

✅ Admin
- `GET /api/admin`
- `GET /api/admin/login`
- `POST /api/admin/login`

✅ Users
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id` (IDOR)
- `GET /api/users/search` (SQL Injection)

✅ Comments (XSS)
- `GET /api/comments`
- `POST /api/comments`

✅ Chat
- `POST /api/chat`
- `GET /api/chat/history`

✅ File Operations
- `POST /api/upload`
- `GET /api/download` (Path Traversal)
- `GET /api/download/architecture-guide`

✅ Command Execution
- `POST /api/execute`
- `POST /api/v1/execute`
- `GET /api/system/info`

✅ SSRF
- `POST /api/fetch`

✅ Honeypot Endpoints
- `GET /api/.env`
- `GET /api/.git/config`
- `GET /api/config.json`
- `GET /api/aws/credentials`
- And many more...

### Client Pages (11 pages)

✅ All client-side pages are tested
✅ API integration via Next.js rewrites
✅ User profile pages with dynamic routes

## Continuous Testing

### Before Committing

```bash
# Run all tests
pnpm test

# Check code formatting
pnpm format:check

# Lint code
pnpm lint
```

### CI/CD Integration

The test suite is designed to work in CI/CD pipelines:

```bash
# Install dependencies
pnpm install

# Run setup
pnpm setup

# Run tests
pnpm test:setup    # Always passes (no server required)
pnpm test:api      # Requires server
pnpm test:client   # Requires server
```

## Troubleshooting

### Tests Fail Because Server Not Running

Some tests require servers to be running. Start them first:

```bash
# Development
pnpm dev

# Production
pnpm build && pnpm start:prod
```

### Client Tests Fail

Ensure:
1. Client server is running on port 3001
2. Backend server is running on port 3000
3. Next.js rewrites are configured correctly

### API Tests Fail

Ensure:
1. Backend server is running on port 3000
2. Database is initialized
3. All routes are registered correctly

### Symlink Issues

If `app` symlink is missing:

```bash
# Create symlink manually
pnpm setup

# Or manually
ln -sfn src/client app
```

## Test Environment Variables

Tests use these defaults (can be overridden):

- `API_BASE`: `http://localhost:3000` (backend)
- `CLIENT_BASE`: `http://localhost:3001` (client)
- `NODE_ENV`: `development` (or `production` for prod tests)

## Expected Test Results

### Setup Tests
- ✅ All 11 tests should pass
- No server required

### API Tests
- ✅ Most tests should pass if server is running
- Some may fail if server is not running (expected)

### Client Tests
- ✅ Most tests should pass if servers are running
- Some may fail if servers are not running (expected)

### Environment Tests
- ✅ All tests should pass
- No server required

