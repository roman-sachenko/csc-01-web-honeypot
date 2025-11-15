import fs from 'fs';
import path from 'path';

export class StorageManager {
  constructor(uploadDir, maxTotalStorage) {
    this.uploadDir = uploadDir;
    this.maxTotalStorage = maxTotalStorage;
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  getTotalSize() {
    if (!fs.existsSync(this.uploadDir)) {
      return 0;
    }

    let totalSize = 0;
    const files = fs.readdirSync(this.uploadDir);
    
    for (const file of files) {
      const filePath = path.join(this.uploadDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (err) {
        // Skip files that can't be accessed
        continue;
      }
    }
    
    return totalSize;
  }

  canStoreFile(fileSize) {
    return (this.getTotalSize() + fileSize) <= this.maxTotalStorage;
  }

  generateSafeFilename(originalFilename) {
    const ext = path.extname(originalFilename);
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    return `${timestamp}-${random}${ext}`;
  }

  saveFile(fileBuffer, originalFilename) {
    const safeFilename = this.generateSafeFilename(originalFilename);
    const filePath = path.join(this.uploadDir, safeFilename);
    
    fs.writeFileSync(filePath, fileBuffer);
    return { safeFilename, filePath };
  }
}

