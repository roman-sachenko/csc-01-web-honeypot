export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  dbPath: process.env.DB_PATH || './data/honeypot.db',
  logsDir: process.env.LOGS_DIR || './logs',
  uploadDir: process.env.UPLOAD_DIR || './data/uploads',
  maxFileSize: 2 * 1024 * 1024, // 2 MB per file
  maxTotalStorage: 200 * 1024 * 1024, // 200 MB total
};

