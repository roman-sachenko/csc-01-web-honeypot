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

    // Return fake profile data
    return {
      id: 1,
      username: 'client_user',
      email: 'client@truarch.tech',
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
}

