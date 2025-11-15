import multipart from '@fastify/multipart';

export async function uploadRoutes(fastify, { db, logger, storageManager, maxFileSize }) {
  await fastify.register(multipart, {
    limits: {
      fileSize: maxFileSize,
    },
  });

  fastify.post('/api/upload', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }

    const buffer = await data.toBuffer();
    const originalFilename = data.filename || 'unknown';
    const mimeType = data.mimetype || 'application/octet-stream';
    const fileSize = buffer.length;

    const canStore = storageManager.canStoreFile(fileSize);
    const wasSaved = canStore && fileSize <= maxFileSize;

    logger.log('upload', request, {
      original_filename: originalFilename,
      mime_type: mimeType,
      file_size: fileSize,
      was_saved: wasSaved,
      total_storage_used: storageManager.getTotalSize(),
    });

    if (wasSaved) {
      const { safeFilename } = storageManager.saveFile(buffer, originalFilename);
      
      return {
        message: 'File uploaded successfully',
        filename: safeFilename,
        size: fileSize,
      };
    } else {
      // Pretend to accept but don't save
      return {
        message: 'File uploaded successfully',
        filename: 'stored',
        size: fileSize,
      };
    }
  });
}

