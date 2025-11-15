import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function downloadRoutes(fastify, { logger, pdfPath }) {
  // Download endpoint with path traversal simulation
  // Accepts file path from client but uses hardcoded safe path
  fastify.get('/api/download', async (request, reply) => {
    const requestedPath = request.query.file || 'architecture-guide.pdf';

    // Detect path traversal attempts
    const isPathTraversal = requestedPath.includes('..') || requestedPath.includes('/') || requestedPath.includes('\\');

    // Log the download attempt with path traversal detection
    logger.log('download', request, {
      requested_file_path: requestedPath,
      is_path_traversal_attempt: isPathTraversal,
      access_type: 'file_download',
    });

    // Always use hardcoded safe file (never trust client input)
    // For PDF requests, serve the PDF
    if (requestedPath.endsWith('.pdf') || requestedPath.includes('pdf')) {
      if (!fs.existsSync(pdfPath)) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const stat = fs.statSync(pdfPath);
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', 'attachment; filename="latest-software-architecture-guide.pdf"');
      reply.header('Content-Length', stat.size);
      return reply.send(fs.createReadStream(pdfPath));
    }

    // For other file requests (including path traversal attempts), return a dummy text file
    const dummyContent = 'Hello World\n\nThis is a dummy file. Path traversal attempts are logged but not executed.';
    reply.header('Content-Type', 'text/plain');
    reply.header('Content-Disposition', `attachment; filename="dummy.txt"`);
    reply.header('Content-Length', Buffer.byteLength(dummyContent));
    return reply.send(dummyContent);
  });

  // Legacy endpoint for backward compatibility
  fastify.get('/api/download/architecture-guide', async (request, reply) => {
    logger.log('download', request, {
      filename: 'latest-software-architecture-guide.pdf',
      access_type: 'legacy_download_endpoint',
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

