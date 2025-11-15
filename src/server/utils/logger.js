import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
  constructor(logsDir) {
    // Resolve to absolute path to ensure consistent file location
    this.logsDir = path.resolve(logsDir);
    this.logFile = path.join(this.logsDir, 'honeypot-requests.log');
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    // Log the log file path on initialization for debugging
    console.log(`[Logger] Initialized - Log file: ${this.logFile}`);
  }

  getClientIP(request) {
    // Honor X-Forwarded-For header (for reverse proxy scenarios)
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  log(feature, request, additionalData = {}) {
    // Safely serialize request body (handle circular references and large objects)
    let safeBody = {};
    try {
      if (request.body) {
        // Limit body size for logging
        const bodyStr = JSON.stringify(request.body);
        if (bodyStr.length > 10000) {
          safeBody = { _truncated: true, _size: bodyStr.length };
        } else {
          safeBody = request.body;
        }
      }
    } catch (e) {
      safeBody = { _error: 'Could not serialize body' };
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      feature,
      ip: this.getClientIP(request),
      method: request.method,
      path: request.url,
      query: request.query || {},
      headers: {
        'user-agent': request.headers['user-agent'] || '',
        'referer': request.headers['referer'] || '',
        'content-type': request.headers['content-type'] || '',
      },
      body: safeBody,
      ...additionalData,
    };

    // Write to file (line-delimited JSON)
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      const fd = fs.openSync(this.logFile, 'a'); // Open in append mode
      fs.writeSync(fd, logLine, 'utf8');
      fs.fsyncSync(fd); // Force write to disk (important for Docker volumes)
      fs.closeSync(fd);
    } catch (writeError) {
      // If logging fails, at least log to console with full error details
      console.error(`[Logger] Failed to write to log file: ${this.logFile}`);
      console.error(`[Logger] Error:`, writeError.message);
      console.error(`[Logger] Error code:`, writeError.code);
      console.error(`[Logger] Log entry:`, JSON.stringify(logEntry, null, 2));
    }

    // Also log to console (but don't show full body for errors)
    const hasError = additionalData.error || additionalData.error_message;
    if (hasError) {
      console.error(`[${feature}] ERROR ${logEntry.method} ${logEntry.path} from ${logEntry.ip}:`, additionalData.error_message || additionalData.error);
    } else {
      console.log(`[${feature}] ${logEntry.method} ${logEntry.path} from ${logEntry.ip}`);
    }
    
    return logEntry;
  }
}

