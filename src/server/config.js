/**
 * Server configuration
 * All values can be overridden via environment variables
 */
export const config = {
  // Server ports (configurable with defaults)
  port: parseInt(process.env.PORT || '3000', 10),
  clientPort: parseInt(process.env.CLIENT_PORT || '3001', 10),
  proxyPort: parseInt(process.env.PROXY_PORT || '80', 10),
  proxyPortHttps: parseInt(process.env.PROXY_PORT_HTTPS || '443', 10),

  // Paths
  dbPath: process.env.DB_PATH || './data/app.db',
  logsDir: process.env.LOGS_DIR || './logs',
  uploadDir: process.env.UPLOAD_DIR || './data/uploads',
  maxFileSize: 2 * 1024 * 1024, // 2 MB per file
  maxTotalStorage: 200 * 1024 * 1024, // 200 MB total

  // Domain and host configuration
  domain: process.env.DOMAIN || 'localhost',
  apiHost: process.env.API_HOST || 'http://localhost:3000',
  clientHost: process.env.CLIENT_HOST || 'http://localhost:3001',

  // Company/branding configuration
  companyName: process.env.COMPANY_NAME || 'Enterprise Technologies',
  companyTagline:
    process.env.COMPANY_TAGLINE ||
    'Enterprise Software Architecture & Infrastructure Solutions',
  companyEmail: process.env.COMPANY_EMAIL || 'info@example.com',
  companyWebsite: process.env.COMPANY_WEBSITE || 'www.example.com',
};

