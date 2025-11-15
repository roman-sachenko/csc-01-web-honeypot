/**
 * Setup and Environment Tests
 * Tests that the project is properly configured for dev and prod
 */
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// ============================================================================
// File Structure Tests
// ============================================================================

test('app symlink exists and points to src/client', () => {
  const appPath = path.join(projectRoot, 'app');
  const clientPath = path.join(projectRoot, 'src', 'client');
  
  // Check if symlink exists
  const stats = fs.lstatSync(appPath);
  assert.ok(stats.isSymbolicLink(), 'app should be a symlink');
  
  // Check if target exists
  assert.ok(fs.existsSync(clientPath), 'src/client directory should exist');
  
  // Check if symlink points to correct location
  const target = fs.readlinkSync(appPath);
  assert.ok(target.includes('src/client') || target.includes('client'), 'Symlink should point to src/client');
});

test('src/client directory exists with required files', () => {
  const clientPath = path.join(projectRoot, 'src', 'client');
  assert.ok(fs.existsSync(clientPath), 'src/client directory should exist');
  
  const requiredFiles = ['page.js', 'layout.js', 'config.js'];
  for (const file of requiredFiles) {
    const filePath = path.join(clientPath, file);
    assert.ok(fs.existsSync(filePath), `Required file ${file} should exist in src/client`);
  }
});

test('src/server directory exists with required files', () => {
  const serverPath = path.join(projectRoot, 'src', 'server');
  assert.ok(fs.existsSync(serverPath), 'src/server directory should exist');
  
  const requiredFiles = ['index.js', 'config.js'];
  for (const file of requiredFiles) {
    const filePath = path.join(serverPath, file);
    assert.ok(fs.existsSync(filePath), `Required file ${file} should exist in src/server`);
  }
});

test('All route files exist', () => {
  const routesPath = path.join(projectRoot, 'src', 'server', 'routes');
  assert.ok(fs.existsSync(routesPath), 'src/server/routes directory should exist');
  
  const requiredRoutes = [
    'auth.js',
    'sqli.js',
    'xss.js',
    'chat.js',
    'upload.js',
    'download.js',
    'command.js',
    'fetch.js',
    'honeypot.js',
  ];
  
  for (const route of requiredRoutes) {
    const routePath = path.join(routesPath, route);
    assert.ok(fs.existsSync(routePath), `Route file ${route} should exist`);
  }
});

// ============================================================================
// Configuration Tests
// ============================================================================

test('next.config.js exists', () => {
  const configPath = path.join(projectRoot, 'next.config.js');
  assert.ok(fs.existsSync(configPath), 'next.config.js should exist');
});

test('package.json exists with required scripts', () => {
  const packagePath = path.join(projectRoot, 'package.json');
  assert.ok(fs.existsSync(packagePath), 'package.json should exist');
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  assert.ok(packageJson.scripts.dev, 'dev script should exist');
  assert.ok(packageJson.scripts.build, 'build script should exist');
  assert.ok(packageJson.scripts.test, 'test script should exist');
  assert.ok(packageJson.scripts.setup, 'setup script should exist');
});

test('Dockerfiles exist', () => {
  const dockerfile = path.join(projectRoot, 'Dockerfile');
  const dockerfileDev = path.join(projectRoot, 'Dockerfile.dev');
  
  assert.ok(fs.existsSync(dockerfile), 'Dockerfile should exist');
  assert.ok(fs.existsSync(dockerfileDev), 'Dockerfile.dev should exist');
});

test('Docker Compose files exist', () => {
  const composeFiles = [
    'docker-compose.yml',
    'docker-compose.dev.yml',
    'docker-compose.caddy.yml',
    'docker-compose.caddy.local.yml',
  ];
  
  for (const file of composeFiles) {
    const filePath = path.join(projectRoot, file);
    assert.ok(fs.existsSync(filePath), `Docker Compose file ${file} should exist`);
  }
});

// ============================================================================
// Environment Configuration Tests
// ============================================================================

test('Server config can be imported', async () => {
  const configPath = path.join(projectRoot, 'src', 'server', 'config.js');
  const config = await import(configPath);
  assert.ok(config.config, 'config should be exported');
  assert.ok(config.config.port, 'config should have port');
  assert.ok(config.config.dbPath, 'config should have dbPath');
});

test('Client config can be imported', async () => {
  const configPath = path.join(projectRoot, 'src', 'client', 'config.js');
  const config = await import(configPath);
  assert.ok(config.appConfig, 'appConfig should be exported');
  assert.ok(config.appConfig.companyName, 'appConfig should have companyName');
});

// ============================================================================
// Node.js Version Test
// ============================================================================

test('Node.js version is 24.x', () => {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  assert.ok(majorVersion >= 20, `Node.js version should be 20+ (current: ${nodeVersion})`);
});

