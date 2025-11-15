# Testing Caddy Locally

This guide shows you how to test the Caddy reverse proxy setup locally.

## Option 1: Docker Compose (Easiest)

### Step 1: Start the services

```bash
# Start honeypot + Caddy with local configuration
docker-compose -f docker-compose.caddy.local.yml up -d

# Or use the npm script
pnpm docker:caddy:local
```

### Step 2: Access the application

- **Via Caddy (HTTPS):** https://localhost
- **Direct backend (HTTP):** http://localhost:3000

**Note:** Your browser will show a security warning for the self-signed certificate. Click "Advanced" → "Proceed to localhost" (or similar) to continue.

### Step 3: Verify it's working

```bash
# Test backend directly
curl http://localhost:3000/api/health

# Test through Caddy (HTTP)
curl http://localhost/api/health

# Test through Caddy (HTTPS - ignore certificate warning)
curl -k https://localhost/api/health
```

### Step 4: View logs

```bash
# View all logs
docker-compose -f docker-compose.caddy.local.yml logs -f

# View only Caddy logs
docker-compose -f docker-compose.caddy.local.yml logs -f caddy

# View only honeypot logs
docker-compose -f docker-compose.caddy.local.yml logs -f honeypot
```

### Step 5: Stop services

```bash
docker-compose -f docker-compose.caddy.local.yml down
```

## Option 2: Standalone Caddy (Manual)

### Step 1: Start the honeypot backend

```bash
# Option A: Docker
docker-compose up -d

# Option B: Local
pnpm start
```

Verify backend is running:
```bash
curl http://localhost:3000/api/health
```

### Step 2: Install Caddy (if not installed)

```bash
# macOS
brew install caddy

# Linux (Ubuntu/Debian)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Step 3: Start Caddy with local config

```bash
# From project root
caddy run --config Caddyfile.local
```

Or run in foreground to see logs:
```bash
caddy run --config Caddyfile.local --watch
```

### Step 4: Access the application

- **Via Caddy:** https://localhost
- **Direct backend:** http://localhost:3000

### Step 5: Stop Caddy

Press `Ctrl+C` if running in foreground, or:
```bash
# Find Caddy process
ps aux | grep caddy

# Kill it
kill <PID>
```

## Testing Checklist

- [ ] Backend responds directly on port 3000
- [ ] Caddy proxy works on port 80/443
- [ ] HTTPS redirect works (HTTP → HTTPS)
- [ ] IP addresses are logged correctly (check honeypot logs)
- [ ] All routes work through Caddy
- [ ] Health check endpoint works

## Troubleshooting

### Port 80/443 already in use

If you get "port already in use" errors:

```bash
# Find what's using the port
# macOS/Linux
sudo lsof -i :80
sudo lsof -i :443

# Stop the service or change Caddy ports in docker-compose
```

### Certificate warnings

This is **normal** for local testing. The self-signed certificate will trigger browser warnings. You can:

1. **Accept the warning** (click "Advanced" → "Proceed")
2. **Use HTTP instead** (modify Caddyfile.local to remove HTTPS)
3. **Add certificate to trusted store** (advanced)

### Caddy can't reach backend

Check if honeypot is running:
```bash
# Docker
docker ps | grep honeypot

# Test connection
curl http://localhost:3000/api/health
```

If using Docker, ensure both containers are on the same network (they should be with docker-compose).

### IP logging shows wrong IP

If you see `127.0.0.1` or Docker internal IPs instead of your real IP:

1. Check Caddyfile has proper header forwarding:
   ```caddyfile
   header_up X-Forwarded-For {remote_host}
   header_up X-Real-IP {remote_host}
   ```

2. Verify logger is reading headers correctly (it should be - already configured)

3. For local testing, you'll see `127.0.0.1` which is expected

## Quick Test Script

Save this as `test-local.sh`:

```bash
#!/bin/bash

echo "Testing local Caddy setup..."
echo ""

echo "1. Testing backend directly:"
curl -s http://localhost:3000/api/health | jq . || echo "Backend not responding"
echo ""

echo "2. Testing through Caddy (HTTP):"
curl -s http://localhost/api/health | jq . || echo "Caddy HTTP not responding"
echo ""

echo "3. Testing through Caddy (HTTPS):"
curl -sk https://localhost/api/health | jq . || echo "Caddy HTTPS not responding"
echo ""

echo "Done!"
```

Make it executable and run:
```bash
chmod +x test-local.sh
./test-local.sh
```

## Next Steps

Once local testing works:
1. Update `Caddyfile` with your production domain
2. Deploy to your server
3. Point DNS to your server IP
4. Start with `docker-compose -f docker-compose.caddy.yml up -d`

