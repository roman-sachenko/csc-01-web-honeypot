export async function commandRoutes(fastify, { logger }) {
  // Command execution endpoint - simulates command injection vulnerability
  fastify.post('/api/execute', async (request, reply) => {
    const { command } = request.body || {};
    
    logger.log('command', request, {
      command: command || '',
      command_injection_detected: (command || '').includes(';') || 
                                  (command || '').includes('|') || 
                                  (command || '').includes('&') ||
                                  (command || '').includes('`') ||
                                  (command || '').includes('$('),
    });

    if (!command) {
      return reply.code(400).send({ error: 'Command is required' });
    }

    // Simulate command execution without actually running anything
    const fakeOutput = await simulateCommandExecution(command);
    
    return {
      command: command,
      output: fakeOutput,
      exitCode: 0,
      timestamp: new Date().toISOString(),
    };
  });

  // System info endpoint - also vulnerable
  fastify.get('/api/system/info', async (request, reply) => {
    const { query } = request.query || {};
    
    logger.log('command', request, {
      query: query || '',
    });

    // Import config to get company name for hostname
    const { config } = await import('../config.js');
    const hostnamePrefix = config.companyName.toLowerCase().replace(/\s+/g, '-').substring(0, 10) || 'server';
    
    // Simulate system info
    return {
      hostname: `${hostnamePrefix}-server-01`,
      os: 'Linux',
      kernel: '5.15.0',
      uptime: '15 days',
      query: query || '',
    };
  });
}

async function simulateCommandExecution(command) {
  const cmd = (command || '').toLowerCase();
  
  // Simulate different command outputs
  if (cmd.includes('ls') || cmd.includes('dir')) {
    return 'file1.txt\nfile2.txt\nfile3.txt\n';
  } else if (cmd.includes('pwd')) {
    // Import config to get company name for path
    const { config } = await import('../config.js');
    const pathName = config.companyName.toLowerCase().replace(/\s+/g, '') || 'app';
    return `/var/www/${pathName}`;
  } else if (cmd.includes('whoami')) {
    return 'www-data';
  } else if (cmd.includes('cat') || cmd.includes('type')) {
    return 'File contents would appear here...';
  } else if (cmd.includes('id')) {
    return 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
  } else {
    return `Command executed: ${command}\nOutput: [simulated]`;
  }
}

