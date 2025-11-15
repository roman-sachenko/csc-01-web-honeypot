export async function fetchRoutes(fastify, { logger }) {
  // Fetch URL endpoint - simulates SSRF vulnerability
  fastify.post('/api/fetch', async (request, reply) => {
    const { url } = request.body || {};
    
    const urlLower = (url || '').toLowerCase();
    
    // Detect potential SSRF attempts
    const ssrfPatterns = [
      '169.254.169.254', // AWS metadata
      'metadata.google.internal', // GCP metadata
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'internal',
      'private',
      '192.168.',
      '10.',
      '172.16.',
    ];
    
    const isSSRFAttempt = ssrfPatterns.some(pattern => urlLower.includes(pattern));
    
    logger.log('fetch-url', request, {
      requested_url: url || '',
      is_ssrf_attempt: isSSRFAttempt,
    });

    if (!url) {
      return reply.code(400).send({ error: 'URL is required' });
    }

    // Simulate fetching without actually making network requests
    const fakeResponse = simulateFetch(url, isSSRFAttempt);
    
    return {
      url: url,
      status: fakeResponse.status,
      statusText: fakeResponse.statusText,
      contentLength: fakeResponse.contentLength,
      contentType: fakeResponse.contentType,
      data: fakeResponse.data,
      timestamp: new Date().toISOString(),
    };
  });
}

function simulateFetch(url, isSSRFAttempt) {
  // Simulate different responses based on URL
  if (isSSRFAttempt) {
    // For SSRF attempts, return interesting fake data
    if (url.includes('169.254.169.254')) {
      return {
        status: 200,
        statusText: 'OK',
        contentLength: 1024,
        contentType: 'application/json',
        data: {
          instance_id: 'i-1234567890abcdef0',
          region: 'us-east-1',
          availability_zone: 'us-east-1a',
        },
      };
    } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return {
        status: 200,
        statusText: 'OK',
        contentLength: 512,
        contentType: 'text/html',
        data: '<html><body>Local server response</body></html>',
      };
    }
  }
  
  // Default response
  return {
    status: 200,
    statusText: 'OK',
    contentLength: 2048,
    contentType: 'application/json',
    data: {
      message: 'Data fetched successfully',
      url: url,
    },
  };
}

