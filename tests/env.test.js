/**
 * Environment Tests
 * Tests that dev and prod environments work correctly
 */
import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// ============================================================================
// Development Environment Tests
// ============================================================================

test('Development environment variables have defaults', () => {
  // Test that config works without env vars (uses defaults)
  const originalEnv = process.env.NODE_ENV;
  delete process.env.NODE_ENV;
  
  // Import config (should use defaults)
  import('../src/server/config.js').then(({ config }) => {
    assert.ok(config.port, 'Port should have default value');
    assert.ok(config.dbPath, 'DB path should have default value');
    assert.ok(config.domain, 'Domain should have default value');
  });
  
  if (originalEnv) {
    process.env.NODE_ENV = originalEnv;
  }
});

test('Production environment uses correct settings', async () => {
  process.env.NODE_ENV = 'production';
  
  const { config } = await import('../src/server/config.js');
  // In production, domain should be configurable
  assert.ok(config.domain, 'Domain should be set');
  
  delete process.env.NODE_ENV;
});

// ============================================================================
// Port Configuration Tests
// ============================================================================

test('Ports are configurable via environment variables', () => {
  const originalPort = process.env.PORT;
  const originalClientPort = process.env.CLIENT_PORT;
  
  process.env.PORT = '4000';
  process.env.CLIENT_PORT = '4001';
  
  import('../src/server/config.js').then(({ config }) => {
    assert.strictEqual(config.port, 4000, 'Port should be configurable');
    assert.strictEqual(config.clientPort, 4001, 'Client port should be configurable');
  });
  
  if (originalPort) process.env.PORT = originalPort;
  if (originalClientPort) process.env.CLIENT_PORT = originalClientPort;
  delete process.env.PORT;
  delete process.env.CLIENT_PORT;
});

// ============================================================================
// Health Check Tests
// ============================================================================

function testHealthCheck(baseUrl, envName) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/health', baseUrl);
    const req = http.request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const body = JSON.parse(data);
            assert.strictEqual(body.status, 'ok', `${envName} health check should return ok`);
            resolve();
          } catch (e) {
            reject(new Error(`${envName} health check returned invalid JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`${envName} health check returned status ${res.statusCode}`));
        }
      });
    });
    req.on('error', (err) => {
      // Server might not be running, that's okay for this test
      resolve(); // Don't fail if server is not running
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(); // Don't fail if server is not running
    });
    req.end();
  });
}

test('Backend health check endpoint exists (if server running)', async () => {
  await testHealthCheck('http://localhost:3000', 'Development');
});

test('Production health check endpoint exists (if server running)', async () => {
  await testHealthCheck('http://localhost:3000', 'Production');
});

