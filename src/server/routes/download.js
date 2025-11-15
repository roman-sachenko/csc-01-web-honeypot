import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function downloadRoutes(fastify, { logger, pdfPath }) {
  fastify.get('/api/download/architecture-guide', async (request, reply) => {
    logger.log('download', request, {
      filename: 'latest-software-architecture-guide.pdf',
    });

    if (!fs.existsSync(pdfPath)) {
      return reply.code(404).send({ error: 'File not found' });
    }

    const stat = fs.statSync(pdfPath);
    
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'attachment; filename="latest-software-architecture-guide.pdf"');
    reply.header('Content-Length', stat.size);
    
    return reply.send(fs.createReadStream(pdfPath));
  });
}

