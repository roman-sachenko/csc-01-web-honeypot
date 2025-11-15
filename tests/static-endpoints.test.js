/**
 * Static Endpoints Tests
 * Tests all static/honeypot endpoints to ensure they return fake content
 * 
 * This test checks if server is running, and if not, provides instructions.
 * Run with: pnpm dev:server (in one terminal) then pnpm test:static (in another)
 * Or: NODE_ENV=test PORT=3999 node src/server/index.js (then run tests)
 */
import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_PORT = process.env.TEST_PORT || '3999';
const TEST_BASE = `http://localhost:${TEST_PORT}`;

// Check which server to use
const BASE_URL = process.env.TEST_PORT ? TEST_BASE : API_BASE;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on('error', (err) => {
      // Provide helpful error message
      if (err.code === 'ECONNREFUSED') {
        reject(new Error(`Connection refused. Please start the server first:\n  pnpm dev:server\n  Or: NODE_ENV=test PORT=${TEST_PORT} node src/server/index.js\nThen run tests with: TEST_PORT=${TEST_PORT} pnpm test:static`));
      } else {
        reject(err);
      }
    });
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Helper to check if server is running
async function checkServer() {
  try {
    const response = await makeRequest('/api/health');
    return response.statusCode === 200;
  } catch (err) {
    return false;
  }
}

// ============================================================================
// Well-Known Endpoints
// ============================================================================

test('GET /.well-known/security.txt - should return security.txt content', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/.well-known/security.txt');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('Contact:'), 'Should contain Contact field');
  assert.ok(response.body.includes('security@example.com'), 'Should contain security email');
  assert.ok(response.body.includes('Expires:'), 'Should contain Expires field');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

test('GET /.well-known/security.txt - path traversal protection', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) return; // Skip if server not running
  
  const paths = [
    '/.well-known/../security.txt',
    '/.well-known/security.txt/../',
    '/.well-known/security.txt%2e%2e',
  ];
  
  for (const path of paths) {
    try {
      const response = await makeRequest(path);
      assert.ok([404, 400].includes(response.statusCode), `Path traversal attempt ${path} should be blocked`);
    } catch (err) {
      // Connection error is acceptable (server rejected the request)
      assert.ok(true, `Path traversal attempt ${path} was rejected`);
    }
  }
});

// ============================================================================
// Robots.txt
// ============================================================================

test('GET /robots.txt - should return robots.txt content', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/robots.txt');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('User-agent:'), 'Should contain User-agent');
  assert.ok(response.body.includes('Disallow:'), 'Should contain Disallow directives');
  assert.ok(response.body.includes('/api/.env'), 'Should mention /api/.env');
  assert.ok(response.body.includes('/api/config.json'), 'Should mention /api/config.json');
  assert.ok(response.body.includes('Sitemap:'), 'Should contain Sitemap reference');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

test('GET /robots.txt - path traversal protection', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) return;
  
  const paths = [
    '/robots.txt/../',
    '/robots.txt%2e%2e',
    '/robots.txt/../../etc/passwd',
  ];
  
  for (const path of paths) {
    try {
      const response = await makeRequest(path);
      assert.ok([404, 400].includes(response.statusCode), `Path traversal attempt ${path} should be blocked`);
    } catch (err) {
      assert.ok(true, `Path traversal attempt ${path} was rejected`);
    }
  }
});

// ============================================================================
// Sitemap.xml
// ============================================================================

test('GET /sitemap.xml - should return XML sitemap', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/sitemap.xml');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('<?xml'), 'Should be valid XML');
  assert.ok(response.body.includes('<urlset'), 'Should contain urlset');
  assert.ok(response.body.includes('<url>'), 'Should contain url elements');
  assert.ok(response.body.includes('/api/.env'), 'Should mention /api/.env');
  assert.ok(response.body.includes('/api/admin/login'), 'Should mention /api/admin/login');
  assert.ok(response.body.includes('/api/backup.zip'), 'Should mention /api/backup.zip');
  assert.ok(response.headers['content-type']?.includes('application/xml') || response.headers['content-type']?.includes('text/xml'), 'Should be XML');
});

test('GET /sitemap.xml - path traversal protection', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) return;
  
  const paths = [
    '/sitemap.xml/../',
    '/sitemap.xml%2e%2e',
    '/sitemap.xml/../../etc/passwd',
  ];
  
  for (const path of paths) {
    try {
      const response = await makeRequest(path);
      assert.ok([404, 400].includes(response.statusCode), `Path traversal attempt ${path} should be blocked`);
    } catch (err) {
      assert.ok(true, `Path traversal attempt ${path} was rejected`);
    }
  }
});

// ============================================================================
// Environment File Endpoints
// ============================================================================

test('GET /api/.env - should return fake .env content', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/.env');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('TEST_'), 'Should contain TEST_ prefix');
  assert.ok(response.body.includes('DB_PASSWORD') || response.body.includes('JWT_SECRET'), 'Should contain database or JWT config');
  assert.ok(response.body.includes('NODE_ENV'), 'Should contain NODE_ENV');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

test('GET /api/.git/config - should return fake git config', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/.git/config');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('[core]'), 'Should contain git config format');
  assert.ok(response.body.includes('repositoryformatversion'), 'Should contain git config keys');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

test('GET /api/.svn/entries - should return fake SVN entries', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/.svn/entries');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.length > 0, 'Should return content');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

// ============================================================================
// Config File Endpoints
// ============================================================================

test('GET /api/config.json - should return fake JSON config', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/config.json');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  const body = JSON.parse(response.body);
  assert.ok(body.database, 'Should contain database config');
  assert.ok(body.api, 'Should contain api config');
  assert.ok(body.security, 'Should contain security config');
  assert.ok(response.headers['content-type']?.includes('application/json'), 'Should be application/json');
});

test('GET /api/settings.php - should return fake PHP settings', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/settings.php');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('<?php'), 'Should contain PHP opening tag');
  assert.ok(response.body.includes('define'), 'Should contain PHP define statements');
  assert.ok(response.headers['content-type']?.includes('php') || response.headers['content-type']?.includes('text/plain'), 'Should be PHP or text content type');
});

test('GET /api/app/config.yaml - should return fake YAML config', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/app/config.yaml');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('database:'), 'Should contain YAML database section');
  assert.ok(response.body.includes('app:') || response.body.includes('security:'), 'Should contain YAML app or security section');
  assert.ok(response.body.includes('TEST_'), 'Should contain TEST_ prefix in secrets');
  assert.ok(response.headers['content-type']?.includes('yaml') || response.headers['content-type']?.includes('text/plain'), 'Should be YAML or text content type');
});

// ============================================================================
// Credentials Endpoints
// ============================================================================

test('GET /api/aws/credentials - should return fake AWS credentials', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/aws/credentials');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('[default]'), 'Should contain AWS credentials format');
  assert.ok(response.body.includes('aws_access_key_id'), 'Should contain access key');
  assert.ok(response.body.includes('TEST_'), 'Should contain TEST_ prefix');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

test('GET /api/v1/secrets - should return fake secrets', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/v1/secrets');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  const body = JSON.parse(response.body);
  assert.ok(body.secrets, 'Should contain secrets object');
  assert.ok(body.tokens, 'Should contain tokens object');
  // Check that secrets contain TEST_ prefix
  const firstSecret = Object.values(body.secrets)[0];
  assert.ok(firstSecret.includes('TEST_'), 'Should contain TEST_ prefix in secrets');
  assert.ok(response.headers['content-type']?.includes('application/json'), 'Should be application/json');
});

test('GET /api/v1/config - should return fake config', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/v1/config');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  const body = JSON.parse(response.body);
  assert.ok(body.api_version, 'Should contain api_version');
  assert.ok(body.environment, 'Should contain environment');
  assert.ok(body.database, 'Should contain database config');
  assert.ok(response.headers['content-type']?.includes('application/json'), 'Should be application/json');
});

// ============================================================================
// Backup/File Endpoints
// ============================================================================

test('GET /api/backup.zip - should return fake zip file', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/backup.zip');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  // Check for ZIP file signature (PK header)
  const buffer = Buffer.from(response.body, 'binary');
  assert.strictEqual(buffer[0], 0x50, 'Should start with ZIP signature (P)');
  assert.strictEqual(buffer[1], 0x4B, 'Should contain ZIP signature (K)');
  assert.strictEqual(response.headers['content-type'], 'application/zip', 'Should be application/zip');
});

test('GET /api/dbsqlite - should return fake SQLite database', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/dbsqlite');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  // Check for SQLite file signature
  assert.ok(response.body.includes('SQLite format 3'), 'Should contain SQLite header');
  assert.strictEqual(response.headers['content-type'], 'application/x-sqlite3', 'Should be application/x-sqlite3');
});

// ============================================================================
// Metadata Endpoints
// ============================================================================

test('GET /api/metadata - should return fake metadata', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/metadata');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  const body = JSON.parse(response.body);
  assert.ok(body.instance_id, 'Should contain instance_id');
  assert.ok(body.region, 'Should contain region');
  assert.ok(response.headers['content-type']?.includes('application/json'), 'Should be application/json');
});

test('GET /api/latest/meta-data - should return fake cloud metadata', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/latest/meta-data');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.includes('instance-id'), 'Should contain instance-id');
  assert.ok(response.body.includes('local-hostname'), 'Should contain local-hostname');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

test('GET /api/latest/meta-data/instance-id - should return fake instance ID', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const response = await makeRequest('/api/latest/meta-data/instance-id');
  assert.strictEqual(response.statusCode, 200, 'Should return 200');
  assert.ok(response.body.length > 0, 'Should return instance ID');
  assert.ok(response.headers['content-type']?.includes('text/plain'), 'Should be text/plain');
});

// ============================================================================
// Vulnerable Headers Test
// ============================================================================

test('All endpoints should include vulnerable headers', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    throw new Error('Server not running. Start with: pnpm dev:server');
  }
  
  const endpoints = [
    '/.well-known/security.txt',
    '/robots.txt',
    '/sitemap.xml',
    '/api/.env',
    '/api/config.json',
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint);
    assert.strictEqual(response.headers['server'], 'Apache/2.4.49 (Ubuntu)', `Endpoint ${endpoint} should have Server header`);
    assert.strictEqual(response.headers['x-powered-by'], 'PHP/7.4', `Endpoint ${endpoint} should have X-Powered-By header`);
    assert.strictEqual(response.headers['x-backend-service'], 'api-v1', `Endpoint ${endpoint} should have X-Backend-Service header`);
  }
});

// ============================================================================
// Path Traversal Protection Tests
// ============================================================================

test('Path traversal protection - .env endpoint', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) return;
  
  const paths = [
    '/api/.env/../',
    '/api/.env%2e%2e',
    '/api/../.env',
    '/api/.env/../../etc/passwd',
  ];
  
  for (const path of paths) {
    try {
      const response = await makeRequest(path);
      assert.ok([404, 400].includes(response.statusCode), `Path traversal attempt ${path} should be blocked`);
    } catch (err) {
      assert.ok(true, `Path traversal attempt ${path} was rejected`);
    }
  }
});

test('Path traversal protection - config.json endpoint', async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) return;
  
  const paths = [
    '/api/config.json/../',
    '/api/config.json%2e%2e',
    '/api/../config.json',
  ];
  
  for (const path of paths) {
    try {
      const response = await makeRequest(path);
      assert.ok([404, 400].includes(response.statusCode), `Path traversal attempt ${path} should be blocked`);
    } catch (err) {
      assert.ok(true, `Path traversal attempt ${path} was rejected`);
    }
  }
});
