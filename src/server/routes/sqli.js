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
    
    logger.log('sqli', request, {
      raw_input: q || '',
      constructed_sql: sql,
    });

    try {
      // Execute the vulnerable query
      const results = db.exec(sql);
      const rows = resultsToObjects(results);
      
      // Return fake/sanitized results (don't expose real passwords)
      return rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }));
    } catch (error) {
      // Log SQL errors (common in SQL injection attempts)
      logger.log('sqli', request, {
        raw_input: q || '',
        constructed_sql: sql,
        error: error.message,
      });
      
      return reply.code(500).send({
        error: 'Database error',
        message: 'An error occurred while processing your request',
      });
    }
  });

  // Another vulnerable endpoint - user lookup by ID
  fastify.get('/api/users/:id', async (request, reply) => {
    const { id } = request.params;
    
    // Vulnerable: direct string interpolation
    const sql = `SELECT * FROM users WHERE id = ${id}`;
    
    logger.log('sqli', request, {
      raw_input: id,
      constructed_sql: sql,
    });

    try {
      const results = db.exec(sql);
      const rows = resultsToObjects(results);
      const result = rows[0];
      
      if (!result) {
        return reply.code(404).send({ error: 'User not found' });
      }
      
      return {
        id: result.id,
        username: result.username,
        email: result.email,
        role: result.role,
      };
    } catch (error) {
      logger.log('sqli', request, {
        raw_input: id,
        constructed_sql: sql,
        error: error.message,
      });
      
      return reply.code(500).send({
        error: 'Database error',
      });
    }
  });
}
