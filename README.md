# Web Honeypot - Security Research Project

> **⚠️ IMPORTANT DISCLAIMER:** This is a **TEST/EXPERIMENTAL** honeypot project designed for security research and educational purposes. It is **NOT** intended for production use. This project was developed with an experimental approach to study attack patterns and vulnerabilities.

## Overview

This project is a comprehensive web application honeypot designed to attract, log, and analyze various types of cyber attacks. It simulates a vulnerable web application with multiple attack surfaces to capture and study malicious behavior patterns.

## Purpose

This honeypot serves as a security research tool to:
- **Study attack patterns**: Observe and log various types of cyber attacks in real-time
- **Educational purposes**: Learn about common web vulnerabilities and attack vectors
- **Security research**: Analyze attacker behavior, tools, and techniques
- **Threat intelligence**: Collect data on emerging threats and attack methodologies

## ⚠️ Security Warning

**DO NOT USE THIS IN PRODUCTION ENVIRONMENTS**

- This application intentionally exposes vulnerable endpoints
- All secrets, tokens, and credentials are **FAKE** and prefixed with `TEST_`
- The application is designed to be compromised for research purposes
- Never deploy this on networks containing sensitive data
- Always run in isolated, controlled environments

## Capabilities & Emulated Vulnerabilities

This honeypot emulates the following attack surfaces:

### 1. **SQL Injection (SQLi)**
- Multiple endpoints vulnerable to SQL injection
- Logs injection attempts with full query details
- Simulates database interactions

### 2. **Cross-Site Scripting (XSS)**
- Reflected XSS endpoints
- Stored XSS simulation
- Logs all XSS payload attempts

### 3. **Command Injection**
- Command execution endpoints
- Simulates shell command execution
- Logs command injection attempts

### 4. **File Upload Vulnerabilities**
- File upload endpoints
- Logs file upload attempts with content analysis
- Simulates file processing

### 5. **Server-Side Request Forgery (SSRF)**
- URL fetching endpoints
- Logs SSRF attempts
- Simulates internal network access

### 6. **Sensitive File Exposure**
- `.env` file endpoints
- `.git/config` exposure
- Database file access attempts
- Configuration file endpoints
- AWS credentials endpoints
- Backup file endpoints

### 7. **Authentication Bypass**
- Admin panel login attempts
- User authentication endpoints
- Session management simulation

### 8. **Insecure Direct Object Reference (IDOR)**
- User profile endpoints accessible by ID
- `/api/users/:id` endpoint allows accessing any user profile
- Logs all IDOR attempts with requested user IDs

### 9. **Path Traversal**
- File download endpoint accepts file path parameter
- Simulates path traversal attempts (e.g., `../../../etc/passwd`)
- Logs traversal attempts but always serves safe dummy files
- Never actually accesses filesystem based on client input

### 10. **API Endpoints**
- RESTful API endpoints
- GraphQL-like endpoints
- API key validation attempts

## Architecture

```
┌─────────────┐
│   Caddy     │  Reverse Proxy (HTTPS/HTTP)
│  (Port 80)  │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│   Backend   │ │   Client  │ │   Logs    │
│  (Fastify)  │ │  (Next.js)│ │  Storage  │
│  Port 3000  │ │ Port 3001 │ │           │
└─────────────┘ └───────────┘ └───────────┘
```

## Technology Stack

- **Backend**: Node.js 24 LTS, Fastify
- **Client**: Next.js 14, React 18
- **Reverse Proxy**: Caddy (automatic HTTPS with Let's Encrypt)
- **Database**: SQL.js (in-memory SQLite)
- **Logging**: Custom file-based logger
- **API Documentation**: Swagger/OpenAPI

## Project Structure

```
.
├── src/
│   ├── server/          # Backend server code
│   │   ├── config/      # Configuration files
│   │   ├── routes/      # API route handlers
│   │   └── utils/       # Utility functions
│   └── client/          # Client Next.js application
├── tests/               # Test files
├── data/                # Database and uploads (gitignored)
├── logs/                # Application logs (gitignored)
├── docker-compose.*.yml # Docker Compose configurations
└── Caddyfile            # Caddy reverse proxy configuration
```

## Getting Started

### Prerequisites

- Node.js 24 LTS or higher
- pnpm package manager
- Docker and Docker Compose (for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 01-web-honeypot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set environment variables** (optional)
   ```bash
   export DOMAIN=your-domain.com
   export COMPANY_NAME="Your Company"
   export COMPANY_EMAIL="info@yourcompany.com"
   ```

### Development

**Local Development (without Docker)**
```bash
# Start both server and client
pnpm dev

# Or start separately
pnpm dev:server  # Backend on port 3000
pnpm dev:client  # Client on port 3001
```

**Local Development (with Docker)**
```bash
# Start with Caddy reverse proxy
pnpm docker:caddy:local

# View logs
pnpm docker:caddy:local:logs
```

### Production Deployment

**With Docker Compose and Caddy (Automatic HTTPS)**
```bash
# Set your domain
export DOMAIN=your-domain.com

# Start production stack
pnpm docker:caddy

# View logs
docker-compose -f docker-compose.caddy.yml logs -f
```

The production setup includes:
- Automatic HTTPS with Let's Encrypt
- Health checks and automatic restarts
- Log rotation
- Persistent data storage

## Configuration

All configuration is done via environment variables:

### Server Configuration
- `PORT` - Backend server port (default: 3000)
- `CLIENT_PORT` - Client server port (default: 3001)
- `PROXY_PORT` - Reverse proxy HTTP port (default: 80)
- `PROXY_PORT_HTTPS` - Reverse proxy HTTPS port (default: 443)
- `DOMAIN` - Domain name for production (required for HTTPS)
- `DB_PATH` - Database file path
- `LOGS_DIR` - Logs directory path
- `UPLOAD_DIR` - File upload directory

### Company Branding
- `COMPANY_NAME` - Company name
- `COMPANY_TAGLINE` - Company tagline
- `COMPANY_EMAIL` - Company email
- `COMPANY_WEBSITE` - Company website

### API Configuration
- `API_HOST` - Backend API host URL
- `CLIENT_HOST` - Client host URL

## Client-Side Features

### Admin Dashboard
- **Route**: `/admin`
- Admin login form that attempts authentication
- Logs all admin login attempts
- Accessible from the main navigation

### User Profile Pages
- **Route**: `/users/:id`
- Displays user profile information by ID
- Simulates IDOR vulnerability (Insecure Direct Object Reference)
- Allows attackers to try accessing different user profiles by changing the ID
- All access attempts are logged

### File Download
- **Route**: `/download`
- Accepts file path as query parameter: `/api/download?file=path/to/file`
- Simulates path traversal vulnerability
- Logs path traversal attempts (e.g., `../../../etc/passwd`)
- Always serves safe dummy files, never accesses actual filesystem

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Swagger JSON**: `http://localhost:3000/api/docs/json`

## Test Data

The application automatically initializes test user data on server start:
- **10 test users** with various roles (admin, manager, engineer, user, etc.)
- Users are **upserted** on every server start (ensures consistent IDs)
- All user IDs are **auto-incremented** for predictable testing
- User data includes: username, password, email, role, created_at

Test users include:
- `admin` (admin role)
- `client_manager` (manager role)
- `devops_lead` (engineer role)
- `architect` (architect role)
- `client_user` (client role)
- `john_doe`, `jane_smith`, `bob_wilson`, `alice_brown`, `charlie_davis` (user role)

## Logging

All requests are logged to:
- **File**: `logs/app-requests.log`
- **Console**: Detailed request information for debugging

Log entries include:
- Timestamp
- IP address
- Request method and path
- Query parameters
- Request headers
- Request body (raw and parsed)
- Response status
- Attack detection flags
- Path traversal detection
- IDOR attempt tracking

## Testing

Run the test suite:
```bash
pnpm test
```

Tests cover:
- All API endpoints (health, auth, admin, users, download, etc.)
- Path traversal simulation (`../../../etc/passwd`, Windows paths)
- IDOR vulnerability simulation (user profile access)
- Admin login attempts
- File download with various path parameters
- Expected responses and error handling

All tests verify that:
- Endpoints respond correctly
- Path traversal attempts are logged but not executed
- IDOR attempts are logged
- No actual vulnerabilities are exposed (only simulated)

## Code Quality

- **Format code**: `pnpm format`
- **Check formatting**: `pnpm format:check`
- **Lint code**: `pnpm lint`

## Security Considerations

1. **Isolation**: Always run in isolated environments
2. **Network**: Use separate network segments
3. **Monitoring**: Monitor all network traffic
4. **Logs**: Regularly review and analyze logs
5. **Updates**: Keep dependencies updated
6. **Secrets**: All fake secrets are prefixed with `TEST_`

## Fake Secrets

All secrets, tokens, and credentials in this honeypot are **FAKE** and clearly marked with the `TEST_` prefix. They are stored in `src/server/config/fake-secrets.js` for centralized management.

## Contributing

This is an experimental research project. Contributions should focus on:
- Improving attack detection
- Adding new vulnerability simulations
- Enhancing logging capabilities
- Documentation improvements

## License

MIT License - See LICENSE file for details

## Disclaimer

This software is provided "as is" for educational and research purposes only. The authors and contributors are not responsible for any misuse or damage caused by this software. Use at your own risk.

---

**Remember**: This is a honeypot designed to attract attacks. Never deploy on production systems or networks with sensitive data.
