# Docker Deployment Guide

This guide covers deploying the TruArch Honeypot using Docker.

## Quick Start

### Production Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Development Deployment

```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up

# Stop
docker-compose -f docker-compose.dev.yml down
```

## Persistent Data

The Docker setup uses volumes to persist data across container restarts:

- **Database**: `./data/honeypot.db` - SQLite database file
- **Uploads**: `./data/uploads/` - Uploaded files directory
- **Logs**: `./logs/` - Application logs directory

These directories are mounted from the host, so data survives container restarts and updates.

## Environment Variables

You can override environment variables in `docker-compose.yml`:

```yaml
environment:
  - PORT=3000
  - DB_PATH=/app/data/honeypot.db
  - LOGS_DIR=/app/logs
  - UPLOAD_DIR=/app/data/uploads
```

## Cloud Deployment

### AWS EC2 / Google Cloud / Azure

1. **SSH into your instance**
2. **Clone the repository**
3. **Create data and logs directories:**
   ```bash
   mkdir -p data logs data/uploads
   chmod -R 755 data logs
   ```
4. **Build and run:**
   ```bash
   docker-compose up -d
   ```

### Using Cloud Storage Volumes

For production, consider using persistent cloud volumes:

**AWS EBS:**
```bash
# Create EBS volume and attach to instance
# Mount to /mnt/honeypot-data
docker run -d \
  -v /mnt/honeypot-data/data:/app/data \
  -v /mnt/honeypot-data/logs:/app/logs \
  truarch-honeypot
```

**Google Persistent Disk:**
```bash
# Similar approach with GCP persistent disk
```

## Health Checks

The container includes a health check that monitors `/api/health`:

```bash
# Check container health
docker ps

# View health check logs
docker inspect truarch-honeypot | grep -A 10 Health
```

## Troubleshooting

### SQLite Database Issues

If you encounter database permission errors:

```bash
# Fix permissions
chmod 644 data/honeypot.db
chmod 755 data
```

### Log Directory Issues

```bash
# Ensure logs directory is writable
chmod 755 logs
```

### Container Won't Start

Check logs:
```bash
docker-compose logs
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build
```

## Security Notes

⚠️ **Important for Production:**

1. **Isolate the honeypot** - Run in a separate network/VPC
2. **Monitor resource usage** - Set memory/CPU limits
3. **Regular backups** - Backup `data/` directory regularly
4. **Log rotation** - Implement log rotation for `logs/` directory
5. **Firewall rules** - Only expose necessary ports

## Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  honeypot:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

