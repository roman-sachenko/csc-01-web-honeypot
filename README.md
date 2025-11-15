# TruArch Technologies - Web Honeypot

**⚠️ WARNING: This is a research honeypot designed to attract and log attacks. DO NOT use this in production or expose it to the internet without proper isolation and monitoring.**

## Overview

This is a deliberately vulnerable web application built with Fastify (backend) and Next.js (frontend) to observe and log real-world attack patterns. The honeypot intentionally exposes common web vulnerabilities in a controlled, safe manner for security research purposes.

## Features

The honeypot implements the following vulnerability categories:

### 1. Insecure Authentication
- Login endpoint that always fails (attracts brute-force attempts)
- Fake user profile and admin endpoints
- All login attempts are logged with credentials

### 2. SQL Injection Honeypot
- User search functionality vulnerable to SQL injection
- Direct string concatenation in SQL queries (no prepared statements)
- Logs all SQL injection attempts with raw input and constructed queries

### 3. XSS (Cross-Site Scripting) Honeypot
- Comment system that stores and renders user input without escaping
- Profile update endpoints vulnerable to stored/reflected XSS
- Logs all XSS payloads and their sources

### 4. Fake Chat / LLM Prompt Injection
- Chat interface that simulates an AI assistant
- Designed to attract prompt injection attempts
- Logs all messages, especially those containing injection patterns

### 5. File Upload Honeypot
- File upload endpoint with storage limits:
  - Maximum 2 MB per file
  - Total storage limit of 200 MB
- Once limit is reached, files are logged but not stored
- Logs all upload attempts with metadata

### 6. PDF Download Endpoint
- Serves a static PDF document
- Attracts generic crawling and download probing
- Logs all download requests

### 7. Command Injection Simulation
- Endpoint that appears to execute system commands
- **Never actually executes commands** - only simulates and logs
- Attracts command injection payloads safely

### 8. SSRF-Style URL Fetcher
- Endpoint that appears to fetch data from external URLs
- **Never makes real network requests** - only simulates and logs
- Detects and logs SSRF attempts (e.g., metadata endpoints, internal IPs)

### 9. Additional Attractors
- HTML comments hinting at admin paths and debug modes
- Fake references to backup files and environment variables
- Realistic-looking internal portal interface

## Security Posture

**This honeypot is intentionally insecure at the application level**, but includes safety measures:

✅ **Safe:**
- No actual shell command execution
- No real outbound HTTP requests to attacker-controlled URLs
- No arbitrary file reading from disk
- All dangerous operations are simulated and logged only

❌ **Intentionally Vulnerable:**
- SQL injection vulnerabilities
- XSS vulnerabilities
- Insecure authentication
- Command injection simulation
- SSRF simulation

## Installation

### Prerequisites

- Node.js v20 or later
- pnpm package manager
- Docker and Docker Compose (for containerized deployment)

### Local Development Setup

1. Install dependencies:
```bash
pnpm install
```

2. The application will automatically:
   - Create the `data/` directory for SQLite database and uploads
   - Create the `logs/` directory for request logs
   - Initialize the database with fake user data
   - Generate the PDF document on first run

## Running

### Local Development Mode

Run both backend and frontend concurrently:
```bash
pnpm dev
```

This starts:
- Backend server on `http://localhost:3000`
- Frontend (Next.js) on `http://localhost:3001`

### Docker Development Mode

Run with Docker Compose for development (with hot reload):
```bash
pnpm docker:dev
# or
docker-compose -f docker-compose.dev.yml up
```

This will:
- Build the development Docker image
- Start both backend and frontend with hot reload
- Mount volumes for data and logs persistence
- Expose ports 3000 (backend) and 3001 (frontend)

### Docker Production Mode

1. Build and run with Docker Compose:
```bash
pnpm docker:build
pnpm docker:run
# or
docker-compose up -d
```

2. View logs:
```bash
pnpm docker:logs
# or
docker-compose logs -f
```

3. Stop the container:
```bash
pnpm docker:stop
# or
docker-compose down
```

### Local Production Mode

1. Build the frontend:
```bash
pnpm build
```

2. Start the server:
```bash
pnpm start
# or use the start script
chmod +x start.sh
./start.sh
```

### Docker Deployment to Cloud

The Docker setup is configured for cloud deployment with persistent volumes:

1. **Build the image:**
```bash
docker build -t truarch-honeypot .
```

2. **Run with persistent volumes:**
```bash
docker run -d \
  --name truarch-honeypot \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  truarch-honeypot
```

3. **Or use docker-compose (recommended):**
```bash
docker-compose up -d
```

The volumes ensure:
- Database (`data/honeypot.db`) persists across restarts
- Uploaded files (`data/uploads/`) are preserved
- Logs (`logs/`) are retained for analysis

**Important for Cloud Deployment:**
- Ensure the `data/` and `logs/` directories exist and have proper permissions
- Consider using cloud storage volumes (AWS EBS, Google Persistent Disk, etc.) for production
- Set up log rotation or external log aggregation for long-term storage

### Reverse Proxy with Caddy

For production deployment with automatic HTTPS, see [CADDY.md](./CADDY.md) for Caddy reverse proxy setup.

Quick start:
```bash
# Update Caddyfile with your domain
# Then start with Caddy
docker-compose -f docker-compose.caddy.yml up -d
```

## Configuration

Environment variables (optional):

- `PORT` - Backend server port (default: 3000)
- `DB_PATH` - SQLite database path (default: `./data/honeypot.db`)
- `LOGS_DIR` - Logs directory (default: `./logs`)
- `UPLOAD_DIR` - File upload directory (default: `./data/uploads`)

## Logging

All requests are logged to `logs/honeypot-requests.log` in line-delimited JSON format. Each log entry includes:

- Timestamp
- Remote IP (honors `X-Forwarded-For` header)
- HTTP method and path
- Query parameters
- Request headers (User-Agent, Referer, etc.)
- Request body
- Feature/category tag (e.g., `login`, `sqli`, `xss`, `upload`, etc.)
- Additional metadata specific to each vulnerability type

### Example Log Entry

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "feature": "sqli",
  "ip": "192.168.1.100",
  "method": "GET",
  "path": "/api/users/search",
  "query": {"q": "admin' OR '1'='1"},
  "headers": {
    "user-agent": "Mozilla/5.0...",
    "referer": ""
  },
  "raw_input": "admin' OR '1'='1",
  "constructed_sql": "SELECT * FROM users WHERE username LIKE '%admin' OR '1'='1%'"
}
```

## Project Structure

```
.
├── src/
│   ├── server/           # Backend (Fastify)
│   │   ├── routes/       # Route handlers for each vulnerability
│   │   ├── utils/        # Utilities (logger, db, storage, PDF generator)
│   │   ├── config.js     # Configuration
│   │   └── index.js      # Server entry point
│   └── app/              # Frontend (Next.js)
│       ├── page.js       # Home page
│       ├── login/        # Login page
│       ├── search/       # User search
│       ├── comments/     # Comments/XSS
│       ├── chat/         # Chat assistant
│       ├── upload/       # File upload
│       ├── download/     # PDF download
│       ├── execute/      # Command execution
│       └── fetch/        # URL fetcher
├── data/                 # SQLite DB and uploads (gitignored)
├── logs/                 # Request logs (gitignored)
└── package.json
```

## Analysis

To analyze the captured logs, you can use tools like:

- `jq` for JSON parsing: `cat logs/honeypot-requests.log | jq '.feature' | sort | uniq -c`
- Custom scripts to parse and categorize attacks
- Log analysis tools (ELK stack, Splunk, etc.)

## Important Notes

1. **This is a honeypot** - It's designed to be attacked. Never use this code as a reference for secure application development.

2. **Isolation** - If deploying publicly, ensure the honeypot is properly isolated from your network and other systems.

3. **Monitoring** - Monitor the logs regularly to detect and analyze attack patterns.

4. **Legal** - Ensure you have the right to deploy honeypots in your jurisdiction and network.

5. **Domain** - The frontend is styled for `truarch.tech` domain, but can be customized.

## License

MIT

