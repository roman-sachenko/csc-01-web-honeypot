export async function sqliRoutes(fastify, { db, logger }) {
  // Helper to convert sql.js results to objects
  function resultsToObjects(results) {
    if (!results || results.length === 0) return [];
    const { columns, values } = results[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  // Search users endpoint - vulnerable to SQL injection
  fastify.get('/api/users/search', async (request, reply) => {
    const { q } = request.query || {};
    
    // Deliberately vulnerable: concatenating user input into SQL
    const sql = `SELECT * FROM users WHERE username LIKE '%${q || ''}%' OR email LIKE '%${q || ''}%'`;
    
    let error = null;
    try {
      // Execute the vulnerable query
      const results = db.exec(sql);
      const rows = resultsToObjects(results);
      
      // Log once with all data (including success case)
      logger.log('sqli', request, {
        raw_input: q || '',
        constructed_sql: sql,
        error: null,
      });
      
      // Return fake/sanitized results (don't expose real passwords)
      return rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }));
    } catch (err) {
      error = err;
      // Log once with error information
      logger.log('sqli', request, {
        raw_input: q || '',
        constructed_sql: sql,
        error: error.message,
        error_name: error.name,
      });
      
      return reply.code(500).send({
        error: 'Database error',
        message: 'An error occurred while processing your request',
      });
    }
  });

  // Note: /api/users/:id is handled by authRoutes for IDOR vulnerability simulation
  // This file focuses on SQL injection via /api/users/search endpoint
}
