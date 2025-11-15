# API Routes Inventory

Complete list of all API endpoints, organized by route file.

## Authentication Routes (`auth.js`)

- `POST /api/login` - User login (always fails, logs attempts)
- `GET /api/profile` - Get current user profile (fake data)
- `POST /api/profile/update` - Update profile (XSS vulnerability simulation)
- `GET /api/admin` - Admin dashboard data (fake)
- `POST /api/admin/login` - Admin login (handles JSON and form, always fails)
- `GET /api/users/:id` - Get user by ID (IDOR vulnerability simulation)

## SQL Injection Routes (`sqli.js`)

- `GET /api/users/search?q=...` - Search users (SQL injection vulnerable)

## XSS Routes (`xss.js`)

- `GET /api/comments` - Get all comments (returns unescaped content)
- `POST /api/comments` - Submit comment (stores unescaped content)
- `POST /api/profile/update` - Update profile (XSS vulnerable)

## Chat Routes (`chat.js`)

- `POST /api/chat` - Send chat message (LLM prompt injection simulation)
- `GET /api/chat/history` - Get chat history

## Upload Routes (`upload.js`)

- `POST /api/upload` - Upload file (file upload vulnerability simulation)

## Download Routes (`download.js`)

- `GET /api/download?file=...` - Download file (path traversal simulation)
- `GET /api/download/architecture-guide` - Download PDF (legacy endpoint)

## Command Routes (`command.js`)

- `POST /api/execute` - Execute command (command injection simulation)
- `GET /api/system/info` - Get system information

## Fetch Routes (`fetch.js`)

- `POST /api/fetch` - Fetch URL (SSRF vulnerability simulation)

## Honeypot Routes (`honeypot.js`)

### Admin
- `GET /api/admin/login` - Admin login HTML form page

### Sensitive Files
- `GET /api/.env` - Environment file (fake)
- `GET /api/.git/config` - Git config (fake)
- `GET /api/.svn/entries` - SVN entries (fake)
- `GET /api/config.json` - Config JSON (fake)
- `GET /api/settings.php` - PHP settings (fake)
- `GET /api/aws/credentials` - AWS credentials (fake)
- `GET /api/backup.zip` - Backup file (fake)

### API Endpoints
- `GET /api/products` - Get products list
- `GET /api/item?id=...` - Get item by ID
- `GET /api/search?q=...` - Search endpoint
- `GET /api/users` - Get users list
- `POST /api/users` - Create user (fake)
- `GET /api/v1/status` - API status
- `POST /api/v1/execute` - API execute endpoint
- `GET /api/v1/config` - API config
- `GET /api/v1/secrets` - API secrets (fake)

### Metadata Endpoints
- `GET /api/metadata` - Metadata endpoint
- `GET /api/latest/meta-data` - Cloud metadata endpoint
- `GET /api/latest/meta-data/*` - Cloud metadata wildcard

## System Routes

- `GET /api/health` - Health check endpoint
- `GET /api/docs` - Swagger UI
- `GET /api/docs/json` - Swagger JSON spec

## Route Registration Order

Routes are registered in this order (important for Fastify):
1. Swagger documentation
2. Auth routes
3. SQL injection routes
4. XSS routes
5. Chat routes
6. Upload routes
7. Download routes
8. Command routes
9. Fetch routes
10. Honeypot routes
11. Swagger UI
12. Next.js catch-all (production only)

## Notes

- All routes are logged to `logs/app-requests.log`
- Honeypot routes are hidden from Swagger documentation
- All endpoints simulate vulnerabilities but are safe (no actual exploitation possible)
- Path traversal attempts are logged but never executed
- SQL injection attempts are logged with full query details
- All fake secrets are prefixed with `TEST_`

