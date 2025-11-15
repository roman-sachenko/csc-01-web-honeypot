export async function xssRoutes(fastify, { db, logger }) {
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

  // Submit comment endpoint - stores XSS payloads
  fastify.post('/api/comments', async (request, reply) => {
    const { content, author } = request.body || {};
    
    logger.log('xss', request, {
      content: content || '',
      author: author || '',
      payload_detected: (content || '').includes('<script') || (content || '').includes('javascript:'),
    });

    if (!content) {
      return reply.code(400).send({ error: 'Content is required' });
    }

    // Store the unescaped content in database
    const stmt = db.prepare('INSERT INTO comments (content, author) VALUES (?, ?)');
    stmt.run([content, author || 'anonymous']);
    stmt.free();
    
    // Get the last insert ID
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const lastId = idResult.length > 0 && idResult[0].values.length > 0 
      ? idResult[0].values[0][0] 
      : null;
    
    // Save database
    db.save();
    
    return {
      id: lastId,
      message: 'Comment submitted successfully',
    };
  });

  // Get comments endpoint - returns unescaped content (XSS vulnerability)
  fastify.get('/api/comments', async (request, reply) => {
    logger.log('xss', request);

    const results = db.exec('SELECT * FROM comments ORDER BY created_at DESC LIMIT 50');
    const comments = resultsToObjects(results);
    
    return comments;
  });

  // Profile update endpoint - also vulnerable to XSS
  fastify.post('/api/profile/update', async (request, reply) => {
    const { bio, displayName } = request.body || {};
    
    logger.log('xss', request, {
      bio: bio || '',
      displayName: displayName || '',
      payload_detected: (bio || '').includes('<script') || (displayName || '').includes('<script'),
    });

    return {
      message: 'Profile updated',
      bio: bio,
      displayName: displayName,
    };
  });
}
