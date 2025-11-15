export async function authRoutes(fastify, { db, logger }) {
  // Login endpoint - deliberately insecure
  fastify.post('/api/login', async (request, reply) => {
    const { username, password } = request.body || {};
    
    logger.log('login', request, {
      username: username || '',
      password: password || '',
    });

    // Always fail login, but make it look like it might work
    // This attracts brute force attempts
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return reply.code(401).send({
      error: 'Authentication failed',
      message: 'Invalid username or password. Please check your credentials and try again.',
    });
  });

  // Fake user profile endpoint
  fastify.get('/api/profile', async (request, reply) => {
    logger.log('profile', request);

    // Import config to get company email domain
    const { config } = await import('../config.js');
    const emailDomain = config.companyEmail.split('@')[1] || 'example.com';

    // Return fake profile data
    return {
      id: 1,
      username: 'client_user',
      email: `client@${emailDomain}`,
      role: 'client',
      company: 'Enterprise Client Corp',
      projects: ['Infrastructure Migration', 'Cloud Architecture'],
      created_at: '2024-01-15T10:00:00Z',
    };
  });

  // Fake admin area endpoint
  fastify.get('/api/admin', async (request, reply) => {
    logger.log('admin', request);

    return {
      message: 'Infrastructure Management Dashboard',
      active_deployments: [
        { id: 1, client: 'Enterprise Corp', environment: 'production', status: 'active' },
        { id: 2, client: 'Tech Solutions Inc', environment: 'staging', status: 'active' },
        { id: 3, client: 'Global Systems Ltd', environment: 'production', status: 'active' },
      ],
      infrastructure_stats: {
        total_servers: 47,
        active_clients: 23,
        deployments_today: 8,
        system_health: 'operational',
      },
    };
  });

  // Admin login endpoint (POST) - handles both JSON and form submissions
  fastify.post('/api/admin/login', async (request, reply) => {
    const { username, password } = request.body || {};
    const contentType = request.headers['content-type'] || '';

    logger.log('admin-login', request, {
      username: username || '',
      password: password || '',
      access_type: 'admin_login_attempt',
    });

    // Always fail but with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    // Return HTML for form submissions, JSON for API calls
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return reply.code(401).type('text/html').send(`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Panel - Login Failed</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 350px; }
    .error { color: #d32f2f; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>Administrator Login</h1>
    <div class="error">Invalid username or password. Please try again.</div>
    <a href="/api/admin/login">← Back to login</a>
  </div>
</body>
</html>
      `);
    }

    // JSON response for API calls
    return reply.code(401).send({
      error: 'Authentication failed',
      message: 'Invalid admin credentials. Access denied.',
    });
  });

  // Get user by ID endpoint (IDOR vulnerability simulation)
  fastify.get('/api/users/:id', async (request, reply) => {
    const userId = parseInt(request.params.id, 10);

    if (isNaN(userId)) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    // Log the access attempt (IDOR vulnerability simulation)
    logger.log('user-profile', request, {
      requested_user_id: userId,
      access_type: 'user_profile_access',
      is_idor_attempt: true,
    });

    // Query database for user (safe - no SQL injection, using prepared statement)
    try {
      const stmt = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?');
      stmt.bind([userId]);
      
      const result = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        result.push(row);
      }
      stmt.free();

      if (result.length === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const user = result[0];
      return reply.send(user);
    } catch (err) {
      logger.log('error', request, {
        error: 'database_error',
        error_message: err.message,
        requested_user_id: userId,
      });
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

