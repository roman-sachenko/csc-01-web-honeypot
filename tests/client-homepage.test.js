/**
 * Client Homepage Tests
 * Tests that the client homepage is accessible and returns correct content
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
// Homepage Tests
// ============================================================================

test('GET / (Homepage) returns 200', async () => {
  const response = await makeRequest('/');
  assert.strictEqual(
    response.statusCode,
    200,
    `Expected 200, got ${response.statusCode}. Response: ${response.body.substring(0, 200)}`
  );
});

test('GET / (Homepage) contains expected content', async () => {
  const response = await makeRequest('/');
  assert.strictEqual(response.statusCode, 200);
  
  const body = response.body.toLowerCase();
  // Check for common homepage elements
  const hasContent =
    body.includes('welcome') ||
    body.includes('enterprise') ||
    body.includes('company') ||
    body.includes('client portal') ||
    body.includes('login') ||
    body.includes('admin');
  
  assert.ok(
    hasContent,
    'Homepage should contain expected content. Body: ' + response.body.substring(0, 500)
  );
});

test('GET / (Homepage) is HTML', async () => {
  const response = await makeRequest('/');
  assert.strictEqual(response.statusCode, 200);
  
  const contentType = response.headers['content-type'] || '';
  assert.ok(
    contentType.includes('text/html'),
    `Expected HTML content type, got: ${contentType}`
  );
});

test('GET / (Homepage) does not return 404', async () => {
  const response = await makeRequest('/');
  assert.notStrictEqual(
    response.statusCode,
    404,
    'Homepage should not return 404. This indicates Next.js cannot find the app directory.'
  );
});

test('GET / (Homepage) does not return 500', async () => {
  const response = await makeRequest('/');
  assert.notStrictEqual(
    response.statusCode,
    500,
    'Homepage should not return 500. This indicates a server error.'
  );
});

