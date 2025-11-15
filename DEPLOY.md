# Production Deployment Guide

This guide covers deploying the honeypot to production via SSH with automatic Let's Encrypt SSL.

## Prerequisites

Before deploying, ensure you have:

1. **A server/VPS** (Ubuntu/Debian recommended)
   - Minimum: 1GB RAM, 1 CPU core
   - Recommended: 2GB+ RAM, 2+ CPU cores

2. **A domain name** pointing to your server's IP
   - DNS A record: `yourdomain.com` → `YOUR_SERVER_IP`
   - DNS A record: `www.yourdomain.com` → `YOUR_SERVER_IP` (optional)

3. **SSH access** to your server

4. **Ports open** in firewall:
   - Port 80 (HTTP - required for Let's Encrypt)
   - Port 443 (HTTPS)
   - Port 22 (SSH)

## Step 1: Server Setup

### Connect via SSH

```bash
ssh user@your-server-ip
```

### Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
```

Reconnect via SSH after logging out.

### Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp  # For HTTP/3
sudo ufw enable
```

## Step 2: Deploy Application

### Clone Repository

```bash
# Create app directory
mkdir -p ~/honeypot
cd ~/honeypot

# Clone your repository (or upload files)
git clone <your-repo-url> .
# OR upload files via scp from your local machine:
# scp -r . user@your-server-ip:~/honeypot/
```

### Create Required Directories

```bash
mkdir -p data logs data/uploads
chmod -R 755 data logs
```

### Set Your Domain (Two Options)

**Option 1: Using Environment Variable (Recommended)**

```bash
# Set DOMAIN environment variable
export DOMAIN=yourdomain.com

# Or create a .env file (gitignored)
echo "DOMAIN=yourdomain.com" > .env
```

**Option 2: Edit Caddyfile Directly**

```bash
# Edit Caddyfile
nano Caddyfile
```

The Caddyfile uses `{$DOMAIN}` which requires the `DOMAIN` environment variable to be set.

**Important:** Make sure your domain DNS is pointing to this server's IP before proceeding!

### Build and Start

```bash
# Build the production image
docker-compose -f docker-compose.caddy.yml build

# Start services
docker-compose -f docker-compose.caddy.yml up -d
```

## Step 3: Verify Deployment

### Check Services

```bash
# Check if containers are running
docker-compose -f docker-compose.caddy.yml ps

# Check logs
docker-compose -f docker-compose.caddy.yml logs -f
```

### Test Health Endpoint

```bash
# Test backend directly
curl http://localhost:3000/api/health

# Test through Caddy (should work after SSL is obtained)
curl https://yourdomain.com/api/health
```

### Check SSL Certificate

Caddy will automatically:
1. Detect your domain in the Caddyfile
2. Request a Let's Encrypt certificate (takes 10-60 seconds)
3. Configure HTTPS automatically

You can verify the certificate is working:
```bash
# Check Caddy logs for certificate issuance
docker-compose -f docker-compose.caddy.yml logs caddy | grep -i certificate

# Test SSL
curl -I https://yourdomain.com
```

## Step 4: Monitor and Maintain

### View Logs

```bash
# All services
docker-compose -f docker-compose.caddy.yml logs -f

# Just honeypot
docker-compose -f docker-compose.caddy.yml logs -f honeypot

# Just Caddy
docker-compose -f docker-compose.caddy.yml logs -f caddy

# Application logs (honeypot requests)
tail -f logs/honeypot-requests.log
```

### Update Application

```bash
cd ~/honeypot

# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.caddy.yml build
docker-compose -f docker-compose.caddy.yml up -d
```

### Backup Data

```bash
# Backup database and uploads
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/

# Restore from backup
tar -xzf backup-YYYYMMDD.tar.gz
```

## Troubleshooting

### SSL Certificate Not Issuing

**Problem:** Caddy can't get Let's Encrypt certificate

**Solutions:**
1. Verify DNS is pointing to your server:
   ```bash
   dig yourdomain.com
   # Should show your server's IP
   ```

2. Check port 80 is accessible:
   ```bash
   sudo netstat -tlnp | grep :80
   # Should show something listening on port 80
   ```

3. Check Caddy logs:
   ```bash
   docker-compose -f docker-compose.caddy.yml logs caddy
   ```

4. Verify domain in Caddyfile matches your actual domain

### Services Not Starting

**Check container status:**
```bash
docker-compose -f docker-compose.caddy.yml ps
docker-compose -f docker-compose.caddy.yml logs
```

**Check if ports are in use:**
```bash
sudo netstat -tlnp | grep -E ':(80|443|3000)'
```

### Can't Access via Domain

1. **Check DNS propagation:**
   ```bash
   dig yourdomain.com
   nslookup yourdomain.com
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   ```

3. **Check Caddy is running:**
   ```bash
   docker ps | grep caddy
   ```

## Security Considerations

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use SSH keys instead of passwords:**
   ```bash
   # On your local machine
   ssh-copy-id user@your-server-ip
   ```

3. **Regular backups:**
   - Set up automated backups of `data/` and `logs/` directories
   - Consider using cloud storage (S3, Google Cloud Storage, etc.)

4. **Monitor logs:**
   - Set up log rotation
   - Consider external log aggregation for long-term storage

## Quick Reference

```bash
# Start services
docker-compose -f docker-compose.caddy.yml up -d

# Stop services
docker-compose -f docker-compose.caddy.yml down

# Restart services
docker-compose -f docker-compose.caddy.yml restart

# View logs
docker-compose -f docker-compose.caddy.yml logs -f

# Rebuild after code changes
docker-compose -f docker-compose.caddy.yml build
docker-compose -f docker-compose.caddy.yml up -d
```

## Let's Encrypt Automatic Renewal

**Good news:** Caddy automatically renews Let's Encrypt certificates! No action needed.

- Certificates are valid for 90 days
- Caddy renews them automatically 30 days before expiration
- Renewal happens in the background
- No downtime during renewal

You can verify certificate expiration:
```bash
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

