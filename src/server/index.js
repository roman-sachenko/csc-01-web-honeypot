import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
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
  console.log('🚀 Starting backend server...');
  console.log('📁 Working directory:', process.cwd());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  
  // Initialize components
  console.log('📝 Initializing logger...');
  const logger = new Logger(config.logsDir);
  console.log('✅ Logger initialized - Log file:', config.logsDir + '/app-requests.log');
  
  console.log('💾 Initializing database...');
  const db = await initDatabase(config.dbPath);
  console.log('✅ Database initialized:', config.dbPath);
  
  console.log('📦 Initializing storage manager...');
  const storageManager = new StorageManager(config.uploadDir, config.maxTotalStorage);
  console.log('✅ Storage manager initialized:', config.uploadDir);

  // Generate PDF if it doesn't exist
  const pdfPath = path.join(path.dirname(config.dbPath), 'architecture-guide.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.log('📄 Generating PDF...');
    await generatePDF(pdfPath);
    console.log('✅ PDF generated successfully');
  } else {
    console.log('✅ PDF already exists:', pdfPath);
  }

  // Create Fastify instance
  console.log('⚡ Creating Fastify instance...');
  const fastify = Fastify({
    logger: false, // We use our custom logger
  });
  console.log('✅ Fastify instance created');

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
  console.log('🔌 Registering plugins...');
  console.log('   - CORS...');
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  });
  console.log('   ✅ CORS registered');
  
  // Capture raw body before parsing for logging
  // Register custom JSON parser to capture raw input
  console.log('   - JSON body parser...');
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      // Store raw body before parsing
      req.rawBody = body;
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      req.rawBody = body;
      done(err, undefined);
    }
  });
  console.log('   ✅ JSON body parser registered');
  
  console.log('   - Form body parser...');
  await fastify.register(formbody);
  console.log('   ✅ Form body parser registered');
  
  // Add vulnerable headers to all responses (honeypot)
  // Also handle Swagger redirect fix
  fastify.addHook('onSend', async (request, reply, payload) => {
    // Add vulnerable headers to all responses
    reply.header('Server', 'Apache/2.4.49 (Ubuntu)');
    reply.header('X-Powered-By', 'PHP/7.4');
    reply.header('X-Backend-Service', 'api-v1');
    
    // Fix Swagger UI redirect issue
    if (request.url === '/api/docs' && reply.statusCode === 302) {
      const location = reply.getHeader('location');
      if (location && typeof location === 'string' && location.includes('./docs/static/index.html')) {
        reply.header('location', '/api/docs/static/index.html');
        console.log(`[swagger-redirect-fix] Fixed redirect from ${location} to /api/docs/static/index.html`);
      }
    }
    
    return payload;
  });
  console.log('   ✅ Vulnerable headers registered (Server, X-Powered-By, X-Backend-Service)');
  
  // Global request logging hook - register BEFORE Swagger to ensure it catches all requests
  console.log('📋 Registering global request logging hook...');
  fastify.addHook('onRequest', async (request, reply) => {
    // Log ALL requests to console for visibility (not to file)
    const timestamp = new Date().toISOString();
    const ip = request.ip || request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    // Detailed console logging for ALL requests
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔵 REQUEST RECEIVED: ${request.method} ${request.url}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   IP: ${ip}`);
    console.log(`   User-Agent: ${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}`);
    console.log(`   Query:`, request.query || {});
    console.log(`   Headers:`, Object.keys(request.headers).join(', '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Log Swagger JSON access to file (not health checks)
    if (request.url === '/api/docs/json') {
      logger.log('swagger-json', request, {
        endpoint: '/api/docs/json',
        access_type: 'swagger_json_access',
      });
    }
    
    // Log Swagger UI access to file (not health checks)
    if (request.url.startsWith('/api/docs')) {
      logger.log('swagger-ui', request, {
        endpoint: request.url,
        access_type: 'swagger_ui_access',
      });
    }
    
    // Health check: console only (not saved to file to reduce noise)
    if (request.url === '/api/health') {
      // Do NOT call logger.log() - we don't want health checks in the log file
      // Console log is already done above
    }
  });
  console.log('   ✅ Global request logging hook registered');

  // Register Swagger for API documentation (must be before routes)
  console.log('📚 Registering Swagger documentation...');
  try {
    // Determine server URL based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = config.domain || 'localhost';
    const protocol = isProduction ? 'https' : 'http';
    const port = isProduction ? '' : `:${config.port}`;
    const serverUrl = `${protocol}://${domain}${port}`;
    
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'API Documentation',
          description: 'API endpoints for the application',
          version: '1.0.0',
        },
        servers: [
          {
            url: serverUrl,
            description: isProduction ? 'Production server' : 'Development server',
          },
        ],
        tags: [
          { name: 'auth', description: 'Authentication endpoints' },
          { name: 'sqli', description: 'SQL injection endpoints' },
          { name: 'xss', description: 'XSS endpoints' },
          { name: 'chat', description: 'Chat endpoints' },
          { name: 'upload', description: 'File upload endpoints' },
          { name: 'download', description: 'File download endpoints' },
          { name: 'command', description: 'Command execution endpoints' },
          { name: 'fetch', description: 'Fetch endpoints' },
        ],
      },
    });
    console.log('✅ Swagger registered successfully');
    console.log(`   - Server URL: ${serverUrl}`);
  } catch (error) {
    console.error('❌ Error registering Swagger:', error);
    throw error;
  }
  
  // Note: Request logging is handled by individual route handlers for feature-specific context
  // The global hook above provides console visibility for all requests
  
  // Note: Next.js handles its own static files in custom server mode
  // No need to register static file serving separately

  // Register API routes FIRST (before Swagger UI - Swagger UI should be registered AFTER routes)
  console.log('🛣️  Registering API routes...');
  console.log('   - Auth routes...');
  await fastify.register(authRoutes, { db, logger });
  console.log('   ✅ Auth routes registered');
  
  console.log('   - SQL injection routes...');
  await fastify.register(sqliRoutes, { db, logger });
  console.log('   ✅ SQL injection routes registered');
  
  console.log('   - XSS routes...');
  await fastify.register(xssRoutes, { db, logger });
  console.log('   ✅ XSS routes registered');
  
  console.log('   - Chat routes...');
  await fastify.register(chatRoutes, { db, logger });
  console.log('   ✅ Chat routes registered');
  
  console.log('   - Upload routes...');
  await fastify.register(uploadRoutes, { 
    db, 
    logger, 
    storageManager, 
    maxFileSize: config.maxFileSize 
  });
  console.log('   ✅ Upload routes registered');
  
  console.log('   - Download routes...');
  await fastify.register(downloadRoutes, { logger, pdfPath });
  console.log('   ✅ Download routes registered');
  
  console.log('   - Command routes...');
  await fastify.register(commandRoutes, { logger });
  console.log('   ✅ Command routes registered');
  
  console.log('   - Fetch routes...');
  await fastify.register(fetchRoutes, { logger });
  console.log('   ✅ Fetch routes registered');
  
  // Register sensitive file endpoints (hidden from Swagger)
  console.log('   - Sensitive file endpoints...');
  const { honeypotRoutes } = await import('./routes/honeypot.js');
  await fastify.register(honeypotRoutes, { logger });
  console.log('   ✅ Sensitive file endpoints registered');

  // Health check endpoint
  console.log('💚 Registering health check endpoint...');
  fastify.get('/api/health', async (request, reply) => {
    // Log is handled by global onRequest hook
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });
  console.log('   ✅ Health check endpoint registered at /api/health');

  // Register Swagger UI AFTER all routes (this is important!)
  console.log('📖 Registering Swagger UI at /api/docs...');
  try {
    await fastify.register(swaggerUi, {
      routePrefix: '/api/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, request, reply) => {
        // Update server URL in the spec based on the request
        // This ensures Swagger UI uses the correct URL in production
        if (swaggerObject.servers && swaggerObject.servers.length > 0) {
          const requestProtocol = request.headers['x-forwarded-proto'] || (request.secure ? 'https' : 'http');
          const requestHost = request.headers['host'] || (config.domain || 'localhost');
          swaggerObject.servers[0].url = `${requestProtocol}://${requestHost}`;
        }
        // Log is handled by global onRequest hook
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = config.domain || 'localhost';
    const protocol = isProduction ? 'https' : 'http';
    const port = isProduction ? '' : `:${config.port}`;
    const baseUrl = `${protocol}://${domain}${port}`;
    
    console.log('✅ Swagger UI registered successfully at /api/docs');
    console.log(`   - Swagger UI: ${baseUrl}/api/docs`);
    console.log(`   - Swagger JSON: ${baseUrl}/api/docs/json`);
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - Production mode: ${isProduction ? 'YES' : 'NO'}`);
    
    // Note: Swagger redirect fix is handled in the global onSend hook above
    console.log('   ✅ Swagger redirect fix handled in global hook');
  } catch (error) {
    console.error('❌ Error registering Swagger UI:', error);
    console.error('   Error details:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }

  // Serve Next.js pages in production (catch-all for non-API routes)
  // In development, Next.js runs as a separate dev server on port 3001
  if (process.env.NODE_ENV === 'production') {
    try {
      const next = await import('next');
      const projectRoot = path.join(__dirname, '../..');
      const appDir = path.join(projectRoot, 'app');
      
      // Verify app directory exists
      if (!fs.existsSync(appDir)) {
        console.warn(`⚠️  App directory not found at ${appDir}`);
        console.warn('   Next.js will not be available. Client pages will return 404.');
      } else {
        console.log(`📁 Using app directory: ${appDir}`);
        const nextApp = next.default({ 
          dev: false, 
          dir: projectRoot,
        });
        await nextApp.prepare();
        const nextHandler = nextApp.getRequestHandler();
        
        console.log('✅ Next.js prepared successfully');
        
        // Handle all non-API routes with Next.js (must be last)
        // IMPORTANT: This catch-all route is registered AFTER Swagger UI and all API routes
        // Fastify matches routes in registration order, so /api/* routes will be handled
        // by their specific routes registered above, not by this catch-all
        fastify.route({
          method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
          url: '/*',
          handler: async (request, reply) => {
            // Safety check: Don't let Next.js handle API routes or static files
            // These should be handled by backend routes registered earlier
              if (request.url.startsWith('/api/') || 
                request.url.startsWith('/.well-known/') ||
                request.url === '/robots.txt' ||
                request.url === '/sitemap.xml' ||
                request.url === '/.env') {
              console.warn(`[Next.js] WARNING: Attempted to handle backend route: ${request.url} - this should not happen!`);
              // Return without sending response - let Fastify's other routes handle it
              return;
            }
            // Handle non-API routes with Next.js
            await nextHandler(request.raw, reply.raw);
            reply.sent = true;
          }
        });
        console.log('   ✅ Next.js catch-all route registered (excludes /api/* routes)');
      }
    } catch (error) {
      console.error('❌ Next.js initialization failed:', error);
      console.error('Error stack:', error.stack);
      console.warn('Falling back to basic HTML responses');
    }
  } else {
    console.log(`ℹ️  Development mode: Next.js runs as separate dev server on port ${config.clientPort}`);
    console.log(`   Backend API available at http://localhost:${config.port}/api`);
    console.log(`   Frontend available at http://localhost:${config.clientPort}`);
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
  <title>${config.companyName} - ${config.companyTagline}</title>
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
    <h1>${config.companyName}</h1>
    <p>${config.companyTagline} - Client Portal</p>
    
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
  console.log('');
  console.log('🎯 Starting server...');
  try {
    // Bind to '::' (IPv6) which also accepts IPv4 connections on most systems
    // This ensures both IPv4 (127.0.0.1, localhost) and IPv6 ([::1]) work
    await fastify.listen({ port: config.port, host: '::' });
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Server started successfully!');
    console.log('═══════════════════════════════════════════════════════════');
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = config.domain || 'localhost';
    const protocol = isProduction ? 'https' : 'http';
    const port = isProduction ? '' : `:${config.port}`;
    const baseUrl = `${protocol}://${domain}${port}`;
    
    console.log(`🌐 Server URL:     http://[::]:${config.port} (IPv6) or http://0.0.0.0:${config.port} (IPv4)`);
    console.log(`📊 Logs:          ${config.logsDir}/app-requests.log`);
    console.log(`💾 Database:      ${config.dbPath}`);
    console.log(`📖 Swagger UI:    ${baseUrl}/api/docs`);
    console.log(`📄 Swagger JSON:  ${baseUrl}/api/docs/json`);
    console.log(`💚 Health check:  ${baseUrl}/api/health`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  } catch (err) {
    console.error('❌ Error starting server:', err);
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

