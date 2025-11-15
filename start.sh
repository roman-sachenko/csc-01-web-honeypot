#!/bin/bash
# Production start script

set -e

echo "Starting TruArch Honeypot..."

# Ensure data directories exist
mkdir -p data logs data/uploads

# Set default environment variables if not set
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export DB_PATH=${DB_PATH:-./data/honeypot.db}
export LOGS_DIR=${LOGS_DIR:-./logs}
export UPLOAD_DIR=${UPLOAD_DIR:-./data/uploads}

# Start the server
exec node src/server/index.js

