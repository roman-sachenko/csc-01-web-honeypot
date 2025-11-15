export async function honeypotRoutes(fastify, { logger }) {
  // Admin login page endpoint (HTML form) - separate from /api/admin JSON endpoint
  fastify.get('/api/admin/login', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-admin-login-page', request, {
      endpoint: '/api/admin/login',
      access_type: 'admin_login_page',
    });

    // Return fake admin login page HTML
    return reply.type('text/html').send(`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Panel - Login</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 350px; }
    h1 { margin: 0 0 20px 0; color: #333; }
    input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
    button:hover { background: #0056b3; }
    .error { color: #d32f2f; font-size: 14px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>Administrator Login</h1>
    <form method="POST" action="/api/admin/login">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <p style="font-size: 12px; color: #666; margin-top: 20px;">Default credentials have been changed. Contact system administrator.</p>
  </div>
</body>
</html>
    `);
  });

  // Note: POST /api/admin/login is handled by authRoutes
  // This file only provides the GET /api/admin/login HTML form page

  // Environment file endpoint - common target for attackers
  fastify.get('/api/.env', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-env', request, {
      endpoint: '/api/.env',
      access_type: 'env_file_access',
    });

    const fakeEnv = `# Application Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_production
DB_USER=app_user
DB_PASSWORD=TEST_changeme_in_production_12345

# Redis Configuration
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=TEST_redis_secret_key_2024

# JWT Secret
JWT_SECRET=TEST_super_secret_jwt_key_replace_in_production
JWT_EXPIRES_IN=24h

# API Keys (FAKE - DO NOT USE)
AWS_ACCESS_KEY_ID=TEST_AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Third-party Services
STRIPE_SECRET_KEY=TEST_sk_test_51234567890abcdefghijklmnopqrstuvwxyz
SENDGRID_API_KEY=TEST_SG.1234567890abcdefghijklmnopqrstuvwxyz.9876543210

# Session Secret
SESSION_SECRET=TEST_another_secret_session_key_2024

# Admin Credentials (CHANGED - Contact admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TEST_changed_2024_secure_password
`;

    return reply.type('text/plain').send(fakeEnv);
  });

  // Environment file endpoint at root - common target for attackers
  // This is served at /.env for client access, while /api/.env is for direct backend access
  fastify.get('/.env', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    // Only accept exact path - reject any path traversal attempts
    const urlPath = request.url.split('?')[0]; // Remove query string
    if (urlPath !== '/.env' && urlPath !== '/.env/') {
      // Check for path traversal patterns
      if (urlPath.includes('..') || urlPath.includes('%2e%2e') || urlPath.includes('%2E%2E')) {
        logger.log('honeypot-env-path-traversal', request, {
          endpoint: request.url,
          access_type: 'env_file_path_traversal_attempt',
          is_path_traversal: true,
        });
        return reply.code(404).send({ error: 'Not found' });
      }
      // If it's not the exact path and not a query param, it's invalid
      if (!request.url.startsWith('/.env?')) {
        logger.log('honeypot-env-path-traversal', request, {
          endpoint: request.url,
          access_type: 'env_file_path_traversal_attempt',
          is_path_traversal: true,
        });
        return reply.code(404).send({ error: 'Not found' });
      }
    }

    logger.log('honeypot-env-root', request, {
      endpoint: '/.env',
      access_type: 'env_file_root_access',
    });

    const fakeEnv = `# Application Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_production
DB_USER=app_user
DB_PASSWORD=TEST_changeme_in_production_12345

# Redis Configuration
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=TEST_redis_secret_key_2024

# JWT Secret
JWT_SECRET=TEST_super_secret_jwt_key_replace_in_production
JWT_EXPIRES_IN=24h

# API Keys (FAKE - DO NOT USE)
AWS_ACCESS_KEY_ID=TEST_AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Third-party Services
STRIPE_SECRET_KEY=TEST_sk_test_51234567890abcdefghijklmnopqrstuvwxyz
SENDGRID_API_KEY=TEST_SG.1234567890abcdefghijklmnopqrstuvwxyz.9876543210

# Session Secret
SESSION_SECRET=TEST_another_secret_session_key_2024

# Admin Credentials (CHANGED - Contact admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TEST_changed_2024_secure_password
`;

    return reply.type('text/plain').send(fakeEnv);
  });

  // Configuration JSON endpoint
  fastify.get('/api/config.json', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-config', request, {
      endpoint: '/api/config.json',
      access_type: 'config_file_access',
    });

    const fakeConfig = {
      "app": {
        "name": "Enterprise Application",
        "version": "2.4.1",
        "environment": "production"
      },
      "database": {
        "host": "db.internal.example.com",
        "port": 5432,
        "name": "app_production",
        "ssl": true,
        "pool": {
          "min": 5,
          "max": 20
        }
      },
      "redis": {
        "host": "redis-cluster.internal",
        "port": 6379,
        "password": "TEST_redis_cluster_password_2024"
      },
      "aws": {
        "region": "us-east-1",
        "s3_bucket": "app-production-storage",
        "access_key_id": "TEST_AKIAIOSFODNN7EXAMPLE",
        "secret_access_key": "TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
      },
      "api": {
        "base_url": "https://api.example.com",
        "timeout": 30000,
        "retry_attempts": 3
      },
      "security": {
        "jwt_secret": "TEST_jwt_secret_key_production_2024",
        "session_secret": "TEST_session_secret_production_2024",
        "encryption_key": "TEST_encryption_key_32_chars_long_2024"
      },
      "features": {
        "enable_analytics": true,
        "enable_logging": true,
        "debug_mode": false
      }
    };

    return reply.send(fakeConfig);
  });

  // PHP settings file (even though this is Node.js, attackers still try)
  fastify.get('/api/settings.php', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-php', request, {
      endpoint: '/api/settings.php',
      access_type: 'php_config_access',
    });

    const fakePhpConfig = `<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'app_user');
define('DB_PASS', 'TEST_database_password_2024');
define('DB_NAME', 'app_production');

// Application Settings
define('APP_ENV', 'production');
define('APP_DEBUG', false);
define('APP_URL', 'https://example.com');

// Security Keys
define('APP_KEY', 'TEST_base64:1234567890abcdefghijklmnopqrstuvwxyz==');
define('SESSION_DRIVER', 'redis');
define('SESSION_LIFETIME', 120);

// AWS Configuration
define('AWS_ACCESS_KEY_ID', 'TEST_AKIAIOSFODNN7EXAMPLE');
define('AWS_SECRET_ACCESS_KEY', 'TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
define('AWS_DEFAULT_REGION', 'us-east-1');
define('AWS_BUCKET', 'app-production-storage');

// Mail Configuration
define('MAIL_DRIVER', 'smtp');
define('MAIL_HOST', 'smtp.example.com');
define('MAIL_PORT', 587);
define('MAIL_USERNAME', 'noreply@example.com');
define('MAIL_PASSWORD', 'TEST_smtp_password_2024');

// Cache Configuration
define('CACHE_DRIVER', 'redis');
define('REDIS_HOST', 'redis.internal');
define('REDIS_PASSWORD', 'TEST_redis_password_2024');
define('REDIS_PORT', 6379);
?>`;

    return reply.type('text/plain').send(fakePhpConfig);
  });

  // AWS credentials file
  fastify.get('/api/aws/credentials', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-aws', request, {
      endpoint: '/api/aws/credentials',
      access_type: 'aws_credentials_access',
    });

    const fakeAwsCredentials = `[default]
aws_access_key_id = TEST_AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
region = us-east-1

[production]
aws_access_key_id = TEST_AKIAIOSFODNN7PRODUCTION
aws_secret_access_key = TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYPRODUCTIONKEY
region = us-west-2

[staging]
aws_access_key_id = TEST_AKIAIOSFODNN7STAGING
aws_secret_access_key = TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYSTAGINGKEY
region = eu-west-1
`;

    return reply.type('text/plain').send(fakeAwsCredentials);
  });

  // API config endpoint
  fastify.get('/api/v1/config', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-api-config', request, {
      endpoint: '/api/v1/config',
      access_type: 'api_config_access',
    });

    const fakeApiConfig = {
      "api_version": "v1",
      "environment": "production",
      "database": {
        "connection_string": "postgresql://app_user:TEST_db_password_2024@db.internal:5432/app_production",
        "pool_size": 20
      },
      "cache": {
        "redis_url": "redis://:TEST_redis_password_2024@redis.internal:6379/0"
      },
      "storage": {
        "s3_bucket": "app-production-storage",
        "s3_region": "us-east-1"
      },
      "authentication": {
        "jwt_secret": "TEST_jwt_secret_production_2024",
        "token_expiry": 3600
      },
      "external_services": {
        "payment_gateway": {
          "api_key": "TEST_pk_live_1234567890abcdefghijklmnop",
          "secret_key": "TEST_sk_live_1234567890abcdefghijklmnop"
        },
        "email_service": {
          "api_key": "TEST_SG.1234567890abcdefghijklmnopqrstuvwxyz"
        }
      },
      "features": {
        "enable_webhooks": true,
        "enable_analytics": true,
        "rate_limit": 1000
      }
    };

    return reply.send(fakeApiConfig);
  });

  // API secrets endpoint
  fastify.get('/api/v1/secrets', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-api-secrets', request, {
      endpoint: '/api/v1/secrets',
      access_type: 'api_secrets_access',
    });

    const fakeSecrets = {
      "secrets": {
        "database_password": "TEST_db_production_password_2024",
        "redis_password": "TEST_redis_cluster_password_2024",
        "jwt_secret": "TEST_jwt_secret_key_production_2024",
        "session_secret": "TEST_session_secret_production_2024",
        "encryption_key": "TEST_encryption_key_32_chars_long_2024",
        "aws_access_key": "TEST_AKIAIOSFODNN7EXAMPLE",
        "aws_secret_key": "TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "stripe_secret_key": "TEST_sk_live_1234567890abcdefghijklmnop",
        "sendgrid_api_key": "TEST_SG.1234567890abcdefghijklmnopqrstuvwxyz",
        "admin_api_key": "TEST_admin_api_key_production_2024_secure"
      },
      "tokens": {
        "internal_service_token": "TEST_internal_service_token_2024",
        "webhook_secret": "TEST_webhook_secret_production_2024",
        "api_master_key": "TEST_api_master_key_production_2024"
      }
    };

    return reply.send(fakeSecrets);
  });

  // Metadata endpoint (common cloud metadata target)
  fastify.get('/api/metadata', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-metadata', request, {
      endpoint: '/api/metadata',
      access_type: 'metadata_access',
    });

    const fakeMetadata = {
      "instance_id": "i-1234567890abcdef0",
      "instance_type": "t3.large",
      "availability_zone": "us-east-1a",
      "region": "us-east-1",
      "local_ipv4": "10.0.1.45",
      "public_ipv4": "54.123.45.67",
      "mac": "02:42:ac:11:00:02",
      "security_groups": [
        "sg-12345678",
        "sg-87654321"
      ],
      "iam_role": "arn:aws:iam::123456789012:role/app-production-role",
      "tags": {
        "Environment": "production",
        "Application": "enterprise-app",
        "Team": "devops"
      }
    };

    return reply.send(fakeMetadata);
  });

  // Cloud metadata endpoint (AWS/GCP style)
  fastify.get('/api/latest/meta-data', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-cloud-metadata', request, {
      endpoint: '/api/latest/meta-data',
      access_type: 'cloud_metadata_access',
    });

    // Return directory listing style response (like AWS metadata service)
    const metadataListing = `ami-id
ami-launch-index
ami-manifest-path
block-device-mapping/
events/
hostname
iam/
instance-action
instance-id
instance-type
local-hostname
local-ipv4
mac
metrics/
network/
placement/
profile
public-hostname
public-ipv4
public-keys/
reservation-id
security-groups
services/`;

    return reply.type('text/plain').send(metadataListing);
  });

  // Also handle nested metadata paths
  fastify.get('/api/latest/meta-data/*', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    const path = request.params['*'] || '';
    
    logger.log('honeypot-cloud-metadata-path', request, {
      endpoint: `/api/latest/meta-data/${path}`,
      access_type: 'cloud_metadata_path_access',
      metadata_path: path,
    });

    // Return fake metadata based on path
    if (path === 'instance-id') {
      return reply.type('text/plain').send('i-1234567890abcdef0');
    } else if (path === 'instance-type') {
      return reply.type('text/plain').send('t3.large');
    } else if (path === 'local-ipv4') {
      return reply.type('text/plain').send('10.0.1.45');
    } else if (path === 'public-ipv4') {
      return reply.type('text/plain').send('54.123.45.67');
    } else if (path === 'iam/security-credentials/') {
      return reply.type('text/plain').send('app-production-role');
    } else if (path.startsWith('iam/security-credentials/')) {
      const roleName = path.split('/').pop();
      const fakeCredentials = {
        "Code": "Success",
        "LastUpdated": new Date().toISOString(),
        "Type": "AWS-HMAC",
        "AccessKeyId": "TEST_AKIAIOSFODNN7EXAMPLE",
        "SecretAccessKey": "TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "Token": "TEST_fake_session_token_1234567890abcdefghijklmnopqrstuvwxyz",
        "Expiration": new Date(Date.now() + 3600000).toISOString()
      };
      return reply.send(fakeCredentials);
    } else {
      // Generic fake response
      return reply.type('text/plain').send('metadata_value');
    }
  });

  // Product listing endpoint - vulnerable to IDOR and SQL injection
  fastify.get('/api/products', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    const { id } = request.query || {};
    
    logger.log('honeypot-products', request, {
      endpoint: '/api/products',
      product_id: id || null,
      access_type: 'product_access',
    });

    if (id) {
      // Return fake product by ID
      return reply.send({
        id: id,
        name: `Product ${id}`,
        description: 'Enterprise product for business solutions',
        price: 999.99,
        category: 'Software',
        in_stock: true,
        created_at: '2024-01-15T10:00:00Z',
      });
    } else {
      // Return list of fake products
      return reply.send({
        products: [
          { id: 1, name: 'Enterprise Suite', price: 999.99, category: 'Software' },
          { id: 2, name: 'Business Pro', price: 499.99, category: 'Software' },
          { id: 3, name: 'Starter Package', price: 99.99, category: 'Software' },
        ],
        total: 3,
      });
    }
  });

  // API item endpoint - similar to products
  fastify.get('/api/item', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    const { id } = request.query || {};
    
    logger.log('honeypot-api-item', request, {
      endpoint: '/api/item',
      item_id: id || null,
      access_type: 'api_item_access',
    });

    if (!id) {
      return reply.code(400).send({ error: 'Item ID is required' });
    }

    return reply.send({
      id: id,
      name: `Item ${id}`,
      description: 'API item data',
      metadata: {
        created: '2024-01-15T10:00:00Z',
        updated: '2024-01-20T15:30:00Z',
        status: 'active',
      },
    });
  });

  // Search endpoint - vulnerable to injection
  fastify.get('/api/search', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    const { q } = request.query || {};
    
    logger.log('honeypot-search', request, {
      endpoint: '/api/search',
      query: q || '',
      access_type: 'search_access',
    });

    return reply.send({
      query: q || '',
      results: [
        { id: 1, title: 'Search Result 1', description: 'Relevant content' },
        { id: 2, title: 'Search Result 2', description: 'More content' },
      ],
      total: 2,
    });
  });

  // Note: /api/profile is already handled by authRoutes
  // Note: /api/login is already handled by authRoutes
  // Note: /api/admin is already handled by authRoutes
  // These endpoints are intentionally not duplicated here

  // API users listing
  fastify.get('/api/users', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-api-users-get', request, {
      endpoint: '/api/users',
      access_type: 'api_users_list_access',
    });

    return reply.send({
      users: [
        { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
        { id: 2, username: 'user1', email: 'user1@example.com', role: 'user' },
        { id: 3, username: 'user2', email: 'user2@example.com', role: 'user' },
      ],
      total: 3,
    });
  });

  // API user creation
  fastify.post('/api/users', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    const { username, email, password, role } = request.body || {};
    
    logger.log('honeypot-api-users-post', request, {
      endpoint: '/api/users',
      username: username || '',
      email: email || '',
      password: password || '',
      role: role || '',
      access_type: 'api_user_creation_attempt',
    });

    // Simulate user creation (but don't actually create)
    return reply.code(201).send({
      id: Math.floor(Math.random() * 1000) + 100,
      username: username || 'newuser',
      email: email || 'newuser@example.com',
      role: role || 'user',
      created_at: new Date().toISOString(),
      message: 'User created successfully',
    });
  });

  // Note: /api/admin is already handled by authRoutes (removed duplicate)

  // API v1 status endpoint
  fastify.get('/api/v1/status', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-api-status', request, {
      endpoint: '/api/v1/status',
      access_type: 'api_status_access',
    });

    return reply.send({
      status: 'online',
      version: '1.0.0',
      uptime: Math.floor(Math.random() * 86400) + 3600, // Random uptime in seconds
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        cache: 'connected',
        storage: 'connected',
      },
    });
  });

  // API v1 execute endpoint (different from /api/execute)
  fastify.post('/api/v1/execute', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    const { command, script, action } = request.body || {};
    
    logger.log('honeypot-api-execute', request, {
      endpoint: '/api/v1/execute',
      command: command || '',
      script: script || '',
      action: action || '',
      access_type: 'api_execute_attempt',
    });

    return reply.send({
      success: true,
      output: 'Command executed successfully',
      exit_code: 0,
      timestamp: new Date().toISOString(),
    });
  });

  // Git config file
  fastify.get('/api/.git/config', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-git-config', request, {
      endpoint: '/api/.git/config',
      access_type: 'git_config_access',
    });

    const fakeGitConfig = `[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
	ignorecase = true
	precomposeunicode = true

[remote "origin"]
	url = https://github.com/example/enterprise-app.git
	fetch = +refs/heads/*:refs/remotes/origin/*

[branch "main"]
	remote = origin
	merge = refs/heads/main

[user]
	name = Development Team
	email = dev@example.com
`;

    return reply.type('text/plain').send(fakeGitConfig);
  });

  // SVN entries file
  fastify.get('/api/.svn/entries', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-svn-entries', request, {
      endpoint: '/api/.svn/entries',
      access_type: 'svn_entries_access',
    });

    const fakeSvnEntries = `dir
10
https://svn.example.com/repos/enterprise-app/trunk
https://svn.example.com/repos/enterprise-app

`;

    return reply.type('text/plain').send(fakeSvnEntries);
  });

  // Backup zip file (return fake zip file header)
  fastify.get('/api/backup.zip', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-backup', request, {
      endpoint: '/api/backup.zip',
      access_type: 'backup_file_access',
    });

    // Return fake zip file (minimal valid zip structure)
    // PK header indicates ZIP file
    const fakeZipHeader = Buffer.from([
      0x50, 0x4B, 0x03, 0x04, // ZIP file signature
      0x14, 0x00, // Version
      0x00, 0x00, // Flags
      0x08, 0x00, // Compression method
      0x00, 0x00, 0x00, 0x00, // Last mod time/date
      0x00, 0x00, 0x00, 0x00, // CRC32
      0x00, 0x00, 0x00, 0x00, // Compressed size
      0x00, 0x00, 0x00, 0x00, // Uncompressed size
      0x07, 0x00, // Filename length
    ]);
    const filename = Buffer.from('backup.txt', 'utf8');
    const fakeZip = Buffer.concat([fakeZipHeader, filename]);

    return reply.type('application/zip').send(fakeZip);
  });

  // SQLite database file (return fake SQLite header)
  fastify.get('/api/dbsqlite', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-db-sqlite', request, {
      endpoint: '/api/db.sqlite',
      access_type: 'database_file_access',
    });

    // Return fake SQLite file header
    // SQLite files start with "SQLite format 3" followed by null byte
    const fakeSqliteHeader = Buffer.from('SQLite format 3\x00', 'utf8');
    const padding = Buffer.alloc(16); // Additional header bytes
    const fakeDb = Buffer.concat([fakeSqliteHeader, padding]);

    return reply.type('application/x-sqlite3').send(fakeDb);
  });

  // Security.txt endpoint - must be exact path, no path traversal
  fastify.get('/.well-known/security.txt', {
    schema: {
      hide: true,
    },
  }, async (request, reply) => {
    // Only accept exact path - reject any path traversal attempts
    if (request.url !== '/.well-known/security.txt' && !request.url.startsWith('/.well-known/security.txt?')) {
      logger.log('honeypot-security-txt-path-traversal', request, {
        endpoint: request.url,
        access_type: 'security_txt_path_traversal_attempt',
        is_path_traversal: true,
      });
      return reply.code(404).send({ error: 'Not found' });
    }

    logger.log('honeypot-security-txt', request, {
      endpoint: '/.well-known/security.txt',
      access_type: 'security_txt_access',
    });

    const securityTxt = `Contact: security@example.com
Expires: 2025-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://example.com/.well-known/security.txt
Policy: https://example.com/security-policy
Hiring: https://example.com/careers
`;

    return reply.type('text/plain').send(securityTxt);
  });

  // Sitemap.xml endpoint - must be exact path, no path traversal
  fastify.get('/sitemap.xml', {
    schema: {
      hide: true,
    },
  }, async (request, reply) => {
    // Only accept exact path - reject any path traversal attempts
    if (request.url !== '/sitemap.xml' && !request.url.startsWith('/sitemap.xml?')) {
      logger.log('honeypot-sitemap-path-traversal', request, {
        endpoint: request.url,
        access_type: 'sitemap_path_traversal_attempt',
        is_path_traversal: true,
      });
      return reply.code(404).send({ error: 'Not found' });
    }

    logger.log('honeypot-sitemap', request, {
      endpoint: '/sitemap.xml',
      access_type: 'sitemap_access',
    });

    const today = new Date().toISOString().split('T')[0];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>https://example.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://example.com/admin</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- User Pages -->
  <url>
    <loc>https://example.com/users/1392</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/search</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Feature Pages -->
  <url>
    <loc>https://example.com/comments</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/chat</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/upload</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/download</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/execute</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/fetch</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Download Endpoints -->
  <url>
    <loc>https://example.com/api/download/architecture-guide</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://example.com/api/download?file=architecture-guide.pdf</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- API Endpoints -->
  <url>
    <loc>https://example.com/api/users/search</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://example.com/api/comments</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://example.com/api/upload</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://example.com/api/chat</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://example.com/api/execute</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://example.com/api/fetch</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://example.com/api/admin/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Honeypot Files -->
  <url>
    <loc>https://example.com/.env</loc>
    <lastmod>2024-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://example.com/api/.env</loc>
    <lastmod>2024-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://example.com/api/config.json</loc>
    <lastmod>2024-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://example.com/api/backup.zip</loc>
    <lastmod>2024-01-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://example.com/api/v1/secrets</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>https://example.com/api/aws/credentials</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>https://example.com/api/app/config.yaml</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.2</priority>
  </url>
</urlset>`;

    return reply.type('application/xml').send(sitemap);
  });

  // Robots.txt endpoint - must be exact path, no path traversal
  fastify.get('/robots.txt', {
    schema: {
      hide: true,
    },
  }, async (request, reply) => {
    // Only accept exact path - reject any path traversal attempts
    // Fastify normalizes paths, so check the raw URL path
    const urlPath = request.url.split('?')[0]; // Remove query string
    if (urlPath !== '/robots.txt' && urlPath !== '/robots.txt/') {
      // Check for path traversal patterns
      if (urlPath.includes('..') || urlPath.includes('%2e%2e') || urlPath.includes('%2E%2E')) {
        logger.log('honeypot-robots-path-traversal', request, {
          endpoint: request.url,
          access_type: 'robots_txt_path_traversal_attempt',
          is_path_traversal: true,
        });
        return reply.code(404).send({ error: 'Not found' });
      }
      // If it's not the exact path and not a query param, it's invalid
      if (!request.url.startsWith('/robots.txt?')) {
        logger.log('honeypot-robots-path-traversal', request, {
          endpoint: request.url,
          access_type: 'robots_txt_path_traversal_attempt',
          is_path_traversal: true,
        });
        return reply.code(404).send({ error: 'Not found' });
      }
    }

    logger.log('honeypot-robots-txt', request, {
      endpoint: '/robots.txt',
      access_type: 'robots_txt_access',
    });

    const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /api/admin/
Disallow: /api/.env
Disallow: /api/config.json
Disallow: /api/backup.zip
Disallow: /api/v1/secrets
Disallow: /api/aws/credentials
Disallow: /.git/
Disallow: /.svn/
Disallow: /internal/
Disallow: /private/

# Sitemap
Sitemap: https://example.com/sitemap.xml

# Interesting paths for security researchers
Allow: /api/users/search
Allow: /api/comments
Allow: /api/upload
`;

    return reply.type('text/plain').send(robotsTxt);
  });

  // YAML config file
  fastify.get('/api/app/config.yaml', {
    schema: {
      hide: true, // Hide from Swagger documentation
    },
  }, async (request, reply) => {
    logger.log('honeypot-config-yaml', request, {
      endpoint: '/api/app/config.yaml',
      access_type: 'yaml_config_access',
    });

    const fakeYamlConfig = `# Application Configuration
app:
  name: Enterprise Application
  version: 2.4.1
  environment: production

database:
  host: db.internal.example.com
  port: 5432
  name: app_production
  user: app_user
  password: TEST_db_production_password_2024
  ssl: true
  pool:
    min: 5
    max: 20

redis:
  host: redis-cluster.internal
  port: 6379
  password: TEST_redis_cluster_password_2024

aws:
  region: us-east-1
  s3_bucket: app-production-storage
  access_key_id: TEST_AKIAIOSFODNN7EXAMPLE
  secret_access_key: TEST_wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

security:
  jwt_secret: TEST_jwt_secret_key_production_2024
  session_secret: TEST_session_secret_production_2024
  encryption_key: TEST_encryption_key_32_chars_long_2024

features:
  enable_analytics: true
  enable_logging: true
  debug_mode: false
`;

    return reply.type('text/yaml').send(fakeYamlConfig);
  });
}

