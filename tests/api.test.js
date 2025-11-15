/**
 * API Endpoint Tests
 * Tests all API endpoints to ensure they respond correctly
 */
import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
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
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Health check endpoint
test('GET /api/health', async () => {
  const response = await makeRequest('/api/health');
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.strictEqual(body.status, 'ok');
  assert.ok(body.timestamp);
});

// SQL Injection endpoints
test('GET /api/search?q=test', async () => {
  const response = await makeRequest('/api/search?q=test');
  assert.ok([200, 400].includes(response.statusCode));
});

test('POST /api/products', async () => {
  const response = await makeRequest('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: '1' }),
  });
  assert.ok([200, 400].includes(response.statusCode));
});

// XSS endpoints
test('GET /api/comments', async () => {
  const response = await makeRequest('/api/comments');
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.ok(Array.isArray(body));
});

test('POST /api/comments', async () => {
  const response = await makeRequest('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: 'Test', comment: 'Test comment' }),
  });
  assert.ok([200, 201, 400].includes(response.statusCode));
});

// Chat endpoint
test('POST /api/chat', async () => {
  const response = await makeRequest('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello' }),
  });
  assert.ok([200, 400].includes(response.statusCode));
});

// Upload endpoint
test('POST /api/upload', async () => {
  const response = await makeRequest('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  // Should return 400 for missing file, but endpoint exists
  assert.ok([400, 415].includes(response.statusCode));
});

// Download endpoint
test('GET /api/download', async () => {
  const response = await makeRequest('/api/download');
  assert.ok([200, 400].includes(response.statusCode));
});

// Command execution endpoint
test('POST /api/execute', async () => {
  const response = await makeRequest('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'ls' }),
  });
  assert.ok([200, 400].includes(response.statusCode));
});

// Fetch endpoint (SSRF)
test('POST /api/fetch', async () => {
  const response = await makeRequest('/api/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'http://example.com' }),
  });
  assert.ok([200, 400].includes(response.statusCode));
});

// Auth endpoints
test('POST /api/login', async () => {
  const response = await makeRequest('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test', password: 'test' }),
  });
  assert.ok([200, 401, 400].includes(response.statusCode));
});

test('GET /api/admin', async () => {
  const response = await makeRequest('/api/admin');
  assert.ok([200, 401, 403].includes(response.statusCode));
});

// Honeypot endpoints
test('GET /api/.env', async () => {
  const response = await makeRequest('/api/.env');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('TEST_'));
});

test('GET /api/.git/config', async () => {
  const response = await makeRequest('/api/.git/config');
  assert.strictEqual(response.statusCode, 200);
});

test('GET /api/config.json', async () => {
  const response = await makeRequest('/api/config.json');
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.ok(body.app);
});

test('GET /api/aws/credentials', async () => {
  const response = await makeRequest('/api/aws/credentials');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('TEST_'));
});

// Admin endpoints
test('POST /api/admin/login', async () => {
  const response = await makeRequest('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test' }),
  });
  assert.strictEqual(response.statusCode, 401);
  const body = JSON.parse(response.body);
  assert.ok(body.error);
});

// User profile endpoints (IDOR)
test('GET /api/users/1', async () => {
  const response = await makeRequest('/api/users/1');
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.ok(body.id);
  assert.ok(body.username);
  assert.ok(body.email);
});

test('GET /api/users/999', async () => {
  const response = await makeRequest('/api/users/999');
  assert.strictEqual(response.statusCode, 404);
});

// Download with path traversal simulation
test('GET /api/download?file=test.pdf', async () => {
  const response = await makeRequest('/api/download?file=test.pdf');
  assert.ok([200, 404].includes(response.statusCode));
});

test('GET /api/download?file=../../../etc/passwd', async () => {
  const response = await makeRequest('/api/download?file=../../../etc/passwd');
  assert.strictEqual(response.statusCode, 200);
  // Should return dummy text file, not actual /etc/passwd
  assert.ok(response.body.includes('Hello World') || response.body.includes('dummy'));
});

test('GET /api/download?file=..\\..\\..\\windows\\system32\\config\\sam', async () => {
  const response = await makeRequest('/api/download?file=..\\..\\..\\windows\\system32\\config\\sam');
  assert.strictEqual(response.statusCode, 200);
  // Should return dummy text file
  assert.ok(response.body.includes('Hello World') || response.body.includes('dummy'));
});

// Swagger documentation
test('GET /api/docs/json', async () => {
  const response = await makeRequest('/api/docs/json');
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.ok(body.openapi);
  assert.ok(body.info);
});

