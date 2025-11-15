export async function chatRoutes(fastify, { db, logger }) {
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

  // Chat endpoint - simulates LLM/assistant that "can access internal data"
  fastify.post('/api/chat', async (request, reply) => {
    try {
      const { message } = request.body || {};
      
      const messageLower = (message || '').toLowerCase();
      
      // Detect potential prompt injection attempts
      const injectionPatterns = [
        'ignore previous',
        'forget all',
        'system prompt',
        'internal data',
        'admin',
        'password',
        'secret',
        'token',
        'api key',
        'show me',
        'reveal',
        'execute',
        'run command',
      ];
      
      const isInjectionAttempt = injectionPatterns.some(pattern => 
        messageLower.includes(pattern)
      );
      
      logger.log('chat', request, {
        user_message: message || '',
        is_injection_attempt: isInjectionAttempt,
      });

      // Generate fake response
      let response = 'I understand your request. ';
      
      if (isInjectionAttempt) {
        response += 'I cannot access internal systems or execute commands. ';
        response += 'However, I can help you with general questions about our services.';
      } else if (messageLower.includes('hello') || messageLower.includes('hi')) {
        response += 'Hello! How can I assist you today?';
      } else if (messageLower.includes('help')) {
        response += 'I can help you with account information, product details, and general inquiries.';
      } else {
        response += 'Thank you for your message. Our team will review it and get back to you.';
      }
      
      // Store the message (with error handling)
      try {
        const stmt = db.prepare('INSERT INTO chat_messages (user_message, response) VALUES (?, ?)');
        stmt.run([message || '', response]);
        stmt.free();
        db.save();
      } catch (dbError) {
        // Log database errors but don't fail the request
        logger.log('chat', request, {
          user_message: message || '',
          error: 'database_error',
          error_message: dbError.message,
        });
      }
      
      // Always return valid JSON
      return reply.code(200).send({
        response: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Log all errors but return a generic response
      logger.log('chat', request, {
        user_message: request.body?.message || '',
        error: 'processing_error',
        error_message: error.message,
        error_stack: error.stack,
      });
      
      // Return a generic response (never show errors to users)
      return reply.code(200).send({
        response: 'Thank you for your message. Our team will review it and get back to you.',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get chat history
  fastify.get('/api/chat/history', async (request, reply) => {
    try {
      logger.log('chat', request);

      const results = db.exec('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 20');
      const messages = resultsToObjects(results);
      
      return reply.code(200).send(messages);
    } catch (error) {
      // Log errors but return empty array
      logger.log('chat', request, {
        error: 'history_error',
        error_message: error.message,
        error_stack: error.stack,
      });
      
      return reply.code(200).send([]);
    }
  });
}
