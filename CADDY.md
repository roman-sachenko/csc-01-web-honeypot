# Caddy Reverse Proxy Setup

This guide explains how to use Caddy as a reverse proxy for the TruArch Honeypot.

## Why Use Caddy?

- **Automatic HTTPS** - Free SSL certificates via Let's Encrypt
- **Simple Configuration** - Easy-to-read Caddyfile syntax
- **HTTP/2 and HTTP/3** - Modern protocol support
- **Built-in Security** - Protection against common attacks

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Update the Caddyfile** with your domain:
   ```bash
   # Edit Caddyfile and replace 'example.com' with your domain
   nano Caddyfile
   ```

2. **Start with Caddy:**
   ```bash
   docker-compose -f docker-compose.caddy.yml up -d
   ```

   This will:
   - Start the honeypot backend on port 3000 (internal)
   - Start Caddy on ports 80 and 443 (external)
   - Automatically obtain SSL certificates

### Option 2: Standalone Caddy

1. **Install Caddy:**
   ```bash
   # macOS
   brew install caddy
   
   # Linux
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```

2. **Start the honeypot backend:**
   ```bash
   docker-compose up -d
   # or
   pnpm start
   ```

3. **Update Caddyfile** with your domain and start Caddy:
   ```bash
   # Edit Caddyfile
   nano Caddyfile
   
   # Start Caddy
   sudo caddy run --config Caddyfile
   
   # Or run as a service
   sudo caddy start --config Caddyfile
   ```

## Configuration Files

### Production Caddyfile

The `Caddyfile` is configured for production use with:
- Automatic HTTPS via Let's Encrypt
- Reverse proxy to backend on port 3000
- Proper header forwarding for IP logging
- Health checks
- Compression

**Important:** Replace `example.com` with your actual domain name.

### Local Development Caddyfile

The `Caddyfile.local` is for local development:
- Uses `localhost` with self-signed certificates
- Same reverse proxy configuration
- Useful for testing before deployment

## Domain Setup

### For Production:

1. **Point your domain to your server:**
   ```
   A record: example.com -> YOUR_SERVER_IP
   A record: www.example.com -> YOUR_SERVER_IP (optional)
   ```

2. **Update Caddyfile:**
   ```caddyfile
   example.com {
       reverse_proxy localhost:3000 {
           # ... rest of config
       }
   }
   ```

3. **Caddy will automatically:**
   - Obtain SSL certificate from Let's Encrypt
   - Set up HTTPS redirect
   - Renew certificates automatically

### For Local Testing:

Use `Caddyfile.local`:
```bash
caddy run --config Caddyfile.local
```

Access via: `https://localhost` (accept the self-signed certificate warning)

## IP Logging

The honeypot logger already handles `X-Forwarded-For` headers, so IP addresses will be logged correctly when behind Caddy. The Caddyfile is configured to forward:

- `X-Real-IP` - Original client IP
- `X-Forwarded-For` - Forwarded IP chain
- `X-Forwarded-Proto` - Original protocol (http/https)

## Security Considerations

⚠️ **Important for Honeypot:**

1. **Don't add security headers** that would make the honeypot look too secure
2. **Keep it realistic** - The goal is to attract attackers
3. **Monitor Caddy logs** - They can provide additional attack insights
4. **Rate limiting** - Consider adding if you want to prevent overwhelming the honeypot

### Optional: Add Rate Limiting

If you want to add rate limiting (optional for honeypot):

```caddyfile
example.com {
    # Rate limiting
    rate_limit {
        zone dynamic {
            key {remote_host}
            events 100
            window 1m
        }
    }
    
    reverse_proxy localhost:3000 {
        # ... rest of config
    }
}
```

## Logging

Caddy logs are stored in `/var/log/caddy/access.log` (when using Docker) or in the current directory.

To view Caddy logs:
```bash
# Docker
docker-compose -f docker-compose.caddy.yml logs -f caddy

# Standalone
tail -f /var/log/caddy/access.log
```

## Troubleshooting

### Certificate Issues

If Let's Encrypt certificates fail:
- Ensure port 80 and 443 are open
- Check DNS records are correct
- Verify domain points to your server IP
- Check Caddy logs: `docker logs truarch-caddy`

### Connection Issues

If you can't connect:
- Verify honeypot is running: `docker ps`
- Check honeypot health: `curl http://localhost:3000/api/health`
- Verify Caddy can reach backend: `docker exec truarch-caddy curl http://honeypot:3000/api/health`

### Port Conflicts

If ports 80/443 are in use:
- Stop other web servers (Apache, Nginx, etc.)
- Or change Caddy ports in docker-compose.caddy.yml

## Testing

1. **Test backend directly:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Test through Caddy:**
   ```bash
   curl https://example.com/api/health
   ```

3. **Verify IP forwarding:**
   Check honeypot logs to ensure client IPs are being logged correctly.

## Maintenance

- **Certificate renewal:** Automatic (Caddy handles this)
- **Caddy updates:** `docker pull caddy:latest` then restart
- **Log rotation:** Set up logrotate for Caddy logs if needed

