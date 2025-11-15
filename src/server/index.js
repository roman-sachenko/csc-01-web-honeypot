import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { Logger } from './utils/logger.js';
import { initDatabase } from './utils/db.js';
import { StorageManager } from './utils/storage.js';
import { generatePDF } from './utils/pdf-generator.js';
import { authRoutes } from './routes/auth.js';
import { sqliRoutes } from './routes/sqli.js';
import { xssRoutes } from './routes/xss.js';
import { chatRoutes } from './routes/chat.js';
import { uploadRoutes } from './routes/upload.js';
import { downloadRoutes } from './routes/download.js';
import { commandRoutes } from './routes/command.js';
import { fetchRoutes } from './routes/fetch.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  // Initialize components
  const logger = new Logger(config.logsDir);
  const db = await initDatabase(config.dbPath);
  const storageManager = new StorageManager(config.uploadDir, config.maxTotalStorage);

  // Generate PDF if it doesn't exist
  const pdfPath = path.join(path.dirname(config.dbPath), 'architecture-guide.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.log('Generating PDF...');
    await generatePDF(pdfPath);
    console.log('PDF generated successfully');
  }

  // Create Fastify instance
  const fastify = Fastify({
    logger: false, // We use our custom logger
  });

  // Global error handler - log all errors but return generic responses
  fastify.setErrorHandler(async (error, request, reply) => {
    // Log the error
    logger.log('error', request, {
      error: 'unhandled_error',
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
    });

    // Always return valid JSON (never expose error details to users)
    return reply.code(500).send({
      error: 'An error occurred',
      message: 'Please try again later',
    });
  });

  // Register plugins FIRST (body parsing must happen before logging)
  await fastify.register(cors, {
    origin: true,
  });
  await fastify.register(formbody);
  
  // Global request logging hook - log ALL incoming requests with parsed bodies
  // Use preHandler instead of onRequest so we have access to parsed request body
  // This ensures attacks (SQL injection, XSS, command injection, etc.) are logged
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip logging for health checks to reduce noise
    if (request.url === '/api/health') {
      return;
    }
    
    // Log all other requests with full details including parsed body
    // This captures attack payloads in POST requests
    logger.log('request', request);
  });
  
  // Serve Next.js static files in production
  if (process.env.NODE_ENV === 'production') {
    const nextStaticPath = path.join(__dirname, '../../.next/static');
    const nextPublicPath = path.join(__dirname, '../../public');
    
    if (fs.existsSync(nextStaticPath)) {
      await fastify.register(fastifyStatic, {
        root: nextStaticPath,
        prefix: '/_next/static/',
      });
    }
    
    if (fs.existsSync(nextPublicPath)) {
      await fastify.register(fastifyStatic, {
        root: nextPublicPath,
        prefix: '/',
      });
    }
  }

  // Register API routes FIRST (before Next.js catch-all)
  await fastify.register(authRoutes, { db, logger });
  await fastify.register(sqliRoutes, { db, logger });
  await fastify.register(xssRoutes, { db, logger });
  await fastify.register(chatRoutes, { db, logger });
  await fastify.register(uploadRoutes, { 
    db, 
    logger, 
    storageManager, 
    maxFileSize: config.maxFileSize 
  });
  await fastify.register(downloadRoutes, { logger, pdfPath });
  await fastify.register(commandRoutes, { logger });
  await fastify.register(fetchRoutes, { logger });

  // Health check endpoint (not logged to reduce noise)
  fastify.get('/api/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  // Serve Next.js pages in production (catch-all for non-API routes)
  if (process.env.NODE_ENV === 'production') {
    try {
      const next = await import('next');
      const nextApp = next.default({ 
        dev: false, 
        dir: path.join(__dirname, '../..'),
        hostname: '0.0.0.0',
        port: 3000,
      });
      await nextApp.prepare();
      const nextHandler = nextApp.getRequestHandler();
      
      // Handle all non-API routes with Next.js (must be last)
      fastify.all('/*', async (request, reply) => {
        if (!request.url.startsWith('/api/')) {
          await nextHandler(request.raw, reply.raw);
          reply.sent = true;
        }
      });
    } catch (error) {
      console.warn('Next.js not available, using fallback HTML:', error.message);
    }
  }

  // Root endpoint with additional attractors (fallback for dev or if Next.js fails)
  if (process.env.NODE_ENV !== 'production') {
    fastify.get('/', async (request, reply) => {
      logger.log('root', request);
    
      // Add fake comments in HTML to attract scanners
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>TruArch Technologies - Enterprise Software Architecture Solutions</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    h1 { color: #0f172a; }
    .comment { color: #999; font-style: italic; font-size: 12px; }
    nav ul { list-style: none; padding: 0; }
    nav li { margin: 10px 0; }
    nav a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>TruArch Technologies</h1>
    <p>Enterprise Software Architecture & Infrastructure Solutions - Client Portal</p>
    
    <!-- TODO: Update infrastructure configs before next deployment -->
    <!-- Legacy admin interface at /admin/legacy (migrating to new system) -->
    <!-- Server backup archives: /backups/infrastructure/2024/ -->
    <!-- Client configuration files: /config/clients/ -->
    
    <div class="comment">
      <!-- DEBUG: Environment variables loaded from .env.production -->
      <!-- Infrastructure status: Check /api/health for deployment status -->
      <!-- Database connection pool: 50 active connections -->
    </div>
    
    <nav>
      <h3>Portal Access</h3>
      <ul>
        <li><a href="/login">Client Login</a></li>
        <li><a href="/api/users/search">Team Directory</a></li>
        <li><a href="/api/comments">Project Notes</a></li>
        <li><a href="/api/chat">AI Infrastructure Assistant</a></li>
        <li><a href="/api/download/architecture-guide">Download Architecture Guide</a></li>
        <li><a href="/api/execute">Infrastructure Management Tools</a></li>
        <li><a href="/api/fetch">API Gateway</a></li>
      </ul>
    </nav>
  </div>
</body>
</html>
      `;
    
      return reply.type('text/html').send(html);
    });
  }

  // Start server
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Honeypot server running on http://0.0.0.0:${config.port}`);
    console.log(`📊 Logs: ${config.logsDir}/honeypot-requests.log`);
    console.log(`💾 Database: ${config.dbPath}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

