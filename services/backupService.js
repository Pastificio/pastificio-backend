// services/backupService.js
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import logger from '../config/logger.js';
import crypto from 'crypto';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_RETENTION_DAYS = 7;
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'your-secret-key';

// Assicurati che la directory dei backup esista
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class BackupService {
  async createBackup(data, filename, options = {}) {
    try {
      const {
        type = 'full',
        compress = true,
        encrypt = false,
        compressionLevel = 6
      } = options;

      // Aggiungiamo l'estensione .gz se non presente e compressione attiva
      const baseFilename = filename.replace(/\.(gz|enc)$/, '');
      let finalFilename = compress ? `${baseFilename}.gz` : baseFilename;
      finalFilename = encrypt ? `${finalFilename}.enc` : finalFilename;
      
      const backupPath = path.join(BACKUP_DIR, finalFilename);

      // Aggiungi metadata
      const backupData = {
        data,
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0',
          size: Buffer.byteLength(JSON.stringify(data)),
          type,
          compressed: compress,
          encrypted: encrypt
        }
      };

      let dataBuffer = Buffer.from(JSON.stringify(backupData, null, 2));

      // Pipeline di elaborazione
      const transforms = [];
      
      if (compress) {
        transforms.push(createGzip({ level: compressionLevel }));
      }

      if (encrypt) {
        const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
        transforms.push(cipher);
      }

      // Salva il file
      const writeStream = createWriteStream(backupPath);
      transforms.push(writeStream);

      await pipeline(dataBuffer, ...transforms);

      logger.info(`Backup created: ${backupPath}`);
      return {
        path: backupPath,
        metadata: backupData.metadata
      };
    } catch (error) {
      logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  async createIncrementalBackup(data, baseFilename) {
    try {
      const backups = await this.listBackups();
      const lastBackup = backups
        .filter(b => b.metadata?.type === 'full')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      let changedData = data;
      
      if (lastBackup) {
        const lastData = await this.restoreBackup(lastBackup.filename);
        changedData = this.calculateChanges(data, lastData);
      }

      if (changedData.changes.length > 0) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${baseFilename}-inc-${timestamp}`;
        
        return await this.createBackup(changedData, filename, {
          type: 'incremental',
          compress: true,
          encrypt: true
        });
      }

      logger.info('No changes detected, skipping incremental backup');
      return null;
    } catch (error) {
      logger.error('Incremental backup failed:', error);
      throw error;
    }
  }

  async restoreBackup(filename) {
    try {
      const backupPath = path.join(BACKUP_DIR, filename);
      const isEncrypted = filename.endsWith('.enc');
      const isCompressed = filename.endsWith('.gz');

      const readStream = createReadStream(backupPath);
      let data = '';

      const transforms = [];

      if (isEncrypted) {
        const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
        transforms.push(decipher);
      }

      if (isCompressed) {
        transforms.push(createGunzip());
      }

      transforms.push(
        async function* (source) {
          for await (const chunk of source) {
            data += chunk;
          }
        }
      );

      await pipeline(readStream, ...transforms);

      const parsedData = JSON.parse(data);
      logger.info(`Backup restored: ${filename}`);
      return parsedData.data;
    } catch (error) {
      logger.error('Backup restoration failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = await fs.promises.readdir(BACKUP_DIR);
      return Promise.all(
        files
          .filter(f => f.endsWith('.gz') || f.endsWith('.enc'))
          .map(async filename => {
            const stats = await fs.promises.stat(path.join(BACKUP_DIR, filename));
            let metadata = {};

            try {
              const data = await this.restoreBackup(filename);
              metadata = data.metadata;
            } catch (error) {
              logger.warn(`Could not read metadata for ${filename}`);
            }

            return {
              filename,
              createdAt: stats.birthtime,
              size: stats.size,
              metadata
            };
          })
      );
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

      const backups = await this.listBackups();
      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.createdAt < cutoffDate && backup.metadata?.type !== 'full') {
          await fs.promises.unlink(path.join(BACKUP_DIR, backup.filename));
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} old backups`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
      throw error;
    }
  }

  calculateChanges(newData, oldData) {
    // Implementa qui la logica per il calcolo delle differenze
    // tra backup vecchi e nuovi
    return {
      changes: [], // Array di modifiche
      baseBackup: oldData.metadata?.version,
      timestamp: new Date().toISOString()
    };
  }
}

export default new BackupService();