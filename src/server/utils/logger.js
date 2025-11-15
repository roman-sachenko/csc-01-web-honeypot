import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
  constructor(logsDir) {
    // Resolve to absolute path to ensure consistent file location
    this.logsDir = path.resolve(logsDir);
    this.logFile = path.join(this.logsDir, 'app-requests.log');
    
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

    // Capture raw input (raw body before parsing)
    let rawInput = null;
    try {
      if (request.rawBody) {
        // Limit raw input size for logging (max 50000 chars)
        if (typeof request.rawBody === 'string') {
          if (request.rawBody.length > 50000) {
            rawInput = request.rawBody.substring(0, 50000) + '... [truncated]';
          } else {
            rawInput = request.rawBody;
          }
        } else if (Buffer.isBuffer(request.rawBody)) {
          // For binary data, show first 1000 bytes as hex
          const preview = request.rawBody.slice(0, 1000);
          rawInput = `[binary:${request.rawBody.length} bytes] ${preview.toString('hex').substring(0, 2000)}${request.rawBody.length > 1000 ? '...' : ''}`;
        } else {
          rawInput = String(request.rawBody);
        }
      } else if (request.body && request.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        // For form-urlencoded, reconstruct raw input from parsed body
        try {
          const formData = Object.entries(request.body || {})
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
          rawInput = formData;
        } catch (e) {
          rawInput = null;
        }
      }
    } catch (e) {
      rawInput = { _error: 'Could not capture raw input' };
    }

    // Capture raw query string
    let rawQuery = null;
    try {
      if (request.url && request.url.includes('?')) {
        rawQuery = request.url.split('?')[1];
        // Limit query string size
        if (rawQuery.length > 10000) {
          rawQuery = rawQuery.substring(0, 10000) + '... [truncated]';
        }
      }
    } catch (e) {
      rawQuery = null;
    }

    // Capture ALL headers (important for detecting attacks in headers)
    // Headers can contain attack payloads (e.g., XSS in User-Agent, SQL injection in custom headers)
    let allHeaders = {};
    try {
      // Fastify normalizes headers to lowercase, but we want to preserve original case if possible
      // Iterate through all headers and capture them
      if (request.headers) {
        for (const [key, value] of Object.entries(request.headers)) {
          // Limit individual header value size (max 10000 chars per header)
          if (typeof value === 'string') {
            allHeaders[key] = value.length > 10000 ? value.substring(0, 10000) + '... [truncated]' : value;
          } else if (Array.isArray(value)) {
            // Handle array headers (e.g., multiple Set-Cookie headers)
            allHeaders[key] = value.map(v => typeof v === 'string' && v.length > 10000 ? v.substring(0, 10000) + '... [truncated]' : v);
          } else {
            allHeaders[key] = String(value);
          }
        }
      }
    } catch (e) {
      allHeaders = { _error: 'Could not capture headers' };
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      feature,
      ip: this.getClientIP(request),
      method: request.method,
      path: request.url,
      query: request.query || {},
      headers: allHeaders,
      body: safeBody,
      raw_input: rawInput,
      raw_query: rawQuery,
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

