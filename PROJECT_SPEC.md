# Project Specification

## Overview

This is a **test honeypot** web application designed to simulate various web vulnerabilities and security issues for educational and testing purposes. The application is **NOT intended for production use** and should only be deployed in isolated, controlled environments.

## Architecture

### Directory Structure

```
/
├── src/
│   ├── client/          # Next.js frontend application (App Router)
│   │   ├── page.js      # Homepage
│   │   ├── layout.js    # Root layout
│   │   ├── config.js    # Client configuration
│   │   └── [routes]/    # Various client pages
│   └── server/          # Fastify backend server
│       ├── index.js     # Server entry point
│       ├── config.js    # Server configuration
│       ├── routes/      # API route handlers
│       ├── utils/       # Utility functions
│       └── config/      # Configuration files
├── tests/               # Test files
├── bin/                 # Executable scripts
├── data/                # Database and uploads (gitignored)
├── logs/                # Application logs (gitignored)
├── app -> src/client    # Symlink for Next.js (created at runtime)
└── [config files]       # Docker, Next.js, package.json, etc.
```

### Technology Stack

- **Backend**: Node.js 24 LTS, Fastify 4.x
- **Frontend**: Next.js 14, React 18
- **Database**: SQL.js (in-memory SQLite)
- **Reverse Proxy**: Caddy (automatic HTTPS with Let's Encrypt)
- **Package Manager**: pnpm
- **Containerization**: Docker, Docker Compose

### Key Design Decisions

1. **Symlink for Next.js**: Next.js requires an `app` directory at the project root. We use `src/client` in our codebase but create a symlink `app -> src/client` at runtime to satisfy Next.js requirements.

2. **Separate Client and Server**: Clear separation between `src/client` (frontend) and `src/server` (backend) for maintainability.

3. **Environment-Based Configuration**: All configuration via environment variables with sensible defaults.

4. **Comprehensive Logging**: All requests, especially attack attempts, are logged to files for analysis.

## Components

### Backend Server (`src/server/`)

- **Entry Point**: `src/server/index.js`
- **Port**: 3000 (configurable via `PORT`)
- **Framework**: Fastify
- **Features**:
  - API endpoints for various vulnerability simulations
  - Swagger/OpenAPI documentation at `/api/docs`
  - Health check endpoint at `/api/health`
  - Comprehensive request logging
  - Serves Next.js in production mode

### Frontend Client (`src/client/`)

- **Framework**: Next.js 14 (App Router)
- **Port**: 3001 (configurable via `CLIENT_PORT`)
- **Features**:
  - Client-side pages for various functionalities
  - API integration via Next.js rewrites
  - Admin dashboard
  - User profile pages
  - Various honeypot interfaces

### API Endpoints

All API endpoints are prefixed with `/api/`:

- **Health & System**: `/api/health`, `/api/system/info`
- **Authentication**: `/api/login`, `/api/profile`
- **Admin**: `/api/admin`, `/api/admin/login`
- **Users**: `/api/users`, `/api/users/:id`, `/api/users/search`
- **Comments (XSS)**: `/api/comments`
- **Chat (LLM Injection)**: `/api/chat`
- **File Operations**: `/api/upload`, `/api/download`
- **Command Execution**: `/api/execute`
- **SSRF**: `/api/fetch`
- **Honeypot Endpoints**: Various sensitive file simulations

### Vulnerability Simulations

The application **emulates** vulnerabilities but is **not actually vulnerable**:

1. **SQL Injection**: Simulated via `/api/users/search` - logs attempts but uses parameterized queries
2. **XSS**: Simulated via `/api/comments` - logs attempts but sanitizes output
3. **IDOR**: Simulated via `/api/users/:id` - logs access attempts
4. **Path Traversal**: Simulated via `/api/download` - logs attempts but serves safe files
5. **Command Injection**: Simulated via `/api/execute` - logs attempts but uses safe execution
6. **SSRF**: Simulated via `/api/fetch` - logs attempts but restricts access
7. **LLM Prompt Injection**: Simulated via `/api/chat` - logs attempts

## Configuration

### Environment Variables

#### Server Configuration
- `PORT` - Backend server port (default: 3000)
- `CLIENT_PORT` - Client server port (default: 3001)
- `PROXY_PORT` - Reverse proxy HTTP port (default: 80)
- `PROXY_PORT_HTTPS` - Reverse proxy HTTPS port (default: 443)
- `DOMAIN` - Domain name for production (required for HTTPS)
- `DB_PATH` - Database file path
- `LOGS_DIR` - Logs directory path
- `UPLOAD_DIR` - Upload directory path

#### API Configuration
- `API_HOST` - Backend API host URL
- `CLIENT_HOST` - Client host URL

#### Branding Configuration
- `COMPANY_NAME` - Company name (default: "Enterprise Technologies")
- `COMPANY_TAGLINE` - Company tagline
- `COMPANY_EMAIL` - Company email
- `COMPANY_WEBSITE` - Company website

## Deployment

### Development

```bash
# Local development (no Docker)
pnpm dev

# Docker development
docker-compose -f docker-compose.caddy.local.yml up
```

### Production

```bash
# Build and run with Docker
export DOMAIN=your-domain.com
docker-compose -f docker-compose.caddy.yml up -d --build
```

### Docker Services

- **backend**: Fastify server (port 3000)
- **client**: Next.js frontend (port 3001, dev only)
- **proxy**: Caddy reverse proxy (ports 80, 443)

## Testing

### Test Suites

- `tests/setup.test.js` - Project setup verification
- `tests/api-comprehensive.test.js` - API endpoint tests
- `tests/client.test.js` - Client page tests
- `tests/client-homepage.test.js` - Homepage specific tests
- `tests/env.test.js` - Environment configuration tests

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test:api          # Test API endpoints
pnpm test:client       # Test client pages
pnpm test:setup        # Test project setup
pnpm test:all          # Comprehensive test suite
```

## Logging

- **File Logging**: All requests logged to `logs/app-requests.log`
- **Console Logging**: Detailed console output for development
- **Health Checks**: Logged to console only (not to file)
- **Attack Payloads**: All raw input, query parameters, and headers are logged

## Security Considerations

⚠️ **IMPORTANT**: This is a **test honeypot**, not a production application.

- All vulnerabilities are **simulated**, not real
- Fake secrets are prefixed with `TEST_`
- No real filesystem access for sensitive files
- All user input is logged for analysis
- Should only be deployed in isolated environments

## Known Issues & Solutions

### Next.js 404 on Homepage

**Issue**: Next.js returns 404 for homepage in Docker containers.

**Solution**: Ensure symlink `app -> src/client` is created correctly in container startup command. The symlink must exist before Next.js starts.

**Verification**:
```bash
docker exec app-client sh -c "cd /app && test -f app/page.js && echo 'OK' || echo 'FAILED'"
```

## Maintenance

### Updating Dependencies

All dependencies use **exact versions** (no `^` or `~`) for security and reproducibility.

### Adding New Endpoints

1. Add route handler in `src/server/routes/`
2. Register route in `src/server/index.js`
3. Add test in `tests/api-comprehensive.test.js`
4. Update `ROUTES.md` documentation

### Adding New Client Pages

1. Add page in `src/client/[route]/page.js`
2. Add test in `tests/client.test.js`
3. Update navigation if needed

## Future Enhancements

- [ ] Additional vulnerability simulations
- [ ] Enhanced logging and analytics
- [ ] Webhook integrations for alerts
- [ ] Admin dashboard for log analysis
- [ ] Automated threat detection

