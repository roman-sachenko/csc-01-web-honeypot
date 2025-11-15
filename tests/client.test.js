/**
 * Client Tests
 * Tests client-side pages and functionality
 */
import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const CLIENT_BASE = process.env.CLIENT_BASE || 'http://localhost:3001';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CLIENT_BASE);
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

// ============================================================================
// Client Pages Tests
// ============================================================================

test('GET / (Home page)', async () => {
  const response = await makeRequest('/');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Welcome') || response.body.includes('Enterprise'));
});

test('GET /login (Login page)', async () => {
  const response = await makeRequest('/login');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Login') || response.body.includes('username'));
});

test('GET /admin (Admin dashboard)', async () => {
  const response = await makeRequest('/admin');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Admin') || response.body.includes('Administrator'));
});

test('GET /search (Search page)', async () => {
  const response = await makeRequest('/search');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Search') || response.body.includes('Team'));
});

test('GET /comments (Comments page)', async () => {
  const response = await makeRequest('/comments');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Comment') || response.body.includes('Project'));
});

test('GET /chat (Chat page)', async () => {
  const response = await makeRequest('/chat');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Chat') || response.body.includes('Assistant'));
});

test('GET /upload (Upload page)', async () => {
  const response = await makeRequest('/upload');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Upload') || response.body.includes('Document'));
});

test('GET /download (Download page)', async () => {
  const response = await makeRequest('/download');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Download') || response.body.includes('Resources'));
});

test('GET /execute (Execute page)', async () => {
  const response = await makeRequest('/execute');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Execute') || response.body.includes('Command'));
});

test('GET /fetch (Fetch page)', async () => {
  const response = await makeRequest('/fetch');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('Fetch') || response.body.includes('URL'));
});

test('GET /users/1 (User profile page)', async () => {
  const response = await makeRequest('/users/1');
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.includes('User') || response.body.includes('Profile'));
});

test('GET /users/999 (Non-existent user)', async () => {
  const response = await makeRequest('/users/999');
  // Should either show 404 page or error message
  assert.ok([200, 404].includes(response.statusCode));
});

// ============================================================================
// Client API Integration Tests
// ============================================================================

test('Client can reach backend API (health check)', async () => {
  // This tests that the Next.js rewrites are working
  const response = await makeRequest('/api/health');
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.strictEqual(body.status, 'ok');
});

test('Client API rewrite works', async () => {
  // Test that /api/* requests are proxied to backend
  const response = await makeRequest('/api/profile');
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.ok(body.id || body.username);
});

