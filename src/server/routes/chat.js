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
    
    let dbError = null;
    let processingError = null;
    
    try {
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
      } catch (err) {
        dbError = err;
      }
      
      // Log once with all data (including any errors)
      logger.log('chat', request, {
        user_message: message || '',
        is_injection_attempt: isInjectionAttempt,
        error: dbError ? 'database_error' : null,
        error_message: dbError ? dbError.message : null,
      });
      
      // Always return valid JSON
      return reply.code(200).send({
        response: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      processingError = error;
      // Log once with error information
      logger.log('chat', request, {
        user_message: message || '',
        is_injection_attempt: isInjectionAttempt,
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
    let error = null;
    try {
      const results = db.exec('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 20');
      const messages = resultsToObjects(results);
      
      // Log once with all data
      logger.log('chat', request, {
        error: null,
      });
      
      return reply.code(200).send(messages);
    } catch (err) {
      error = err;
      // Log once with error information
      logger.log('chat', request, {
        error: 'history_error',
        error_message: error.message,
        error_stack: error.stack,
      });
      
      return reply.code(200).send([]);
    }
  });
}
