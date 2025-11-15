# Production Dockerfile
FROM node:24-slim

# Install dependencies for native modules and PDF generation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
# Use --no-frozen-lockfile to handle lockfile version mismatches in Docker
RUN pnpm install --no-frozen-lockfile --prod=false

# Copy application code
COPY . .

# Build Next.js application
# Use sh -c to avoid pnpm shell config issues
RUN sh -c "rm -rf app && cp -r src/client app && pnpm exec next build"

# Create directories for data and logs with proper permissions
RUN mkdir -p /app/data /app/logs /app/data/uploads && \
    chmod -R 755 /app/data /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV SHELL=/bin/sh
ENV PORT=3000
ENV CLIENT_PORT=3001
ENV DB_PATH=/app/data/honeypot.db
ENV LOGS_DIR=/app/logs
ENV UPLOAD_DIR=/app/data/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server/index.js"]

