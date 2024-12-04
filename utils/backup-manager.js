// utils/backup-manager.js
import fs from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { format } from 'date-fns';
import logger from '../config/logger.js';
import { uploadToCloud, downloadFromCloud, deleteFromCloud } from './cloudStorage.js';

class BackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackups = 10;
    this.maxBackupAge = 30; // giorni
  }

  async init() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(data, options = {}) {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
    const filename = `backup-${timestamp}.json`;
    const gzFilename = `${filename}.gz`;
    const backupPath = path.join(this.backupDir, filename);
    const gzPath = path.join(this.backupDir, gzFilename);

    try {
      // Aggiungi metadata
      const backupData = {
        timestamp,
        metadata: {
          version: '1.0',
          type: options.type || 'full',
          createdAt: new Date().toISOString()
        },
        data
      };

      // Scrivi e comprimi
      const writeStream = fs.createWriteStream(gzPath);
      const gzip = createGzip();

      await pipeline(
        Buffer.from(JSON.stringify(backupData, null, 2)),
        gzip,
        writeStream
      );

      // Upload su cloud se richiesto
      if (options.uploadToCloud) {
        await uploadToCloud(gzPath);
      }

      // Pulizia vecchi backup se necessario
      await this.cleanup();

      return gzPath;

    } catch (error) {
      logger.error('Errore nella creazione del backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupPath, options = {}) {
    try {
      // Se il backup è su cloud, scaricalo prima
      if (options.fromCloud) {
        const localPath = path.join(this.backupDir, path.basename(backupPath));
        await downloadFromCloud(backupPath, localPath);
        backupPath = localPath;
      }

      // Leggi e decomprimi
      const backupData = await this.readCompressedFile(backupPath);

      // Verifica versione e integrità
      if (!this.validateBackup(backupData)) {
        throw new Error('Backup non valido o versione non supportata');
      }

      return backupData.data;

    } catch (error) {
      logger.error('Errore nel ripristino del backup:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.gz'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).birthtime
        }))
        .sort((a, b) => b.time - a.time);

      // Mantieni solo gli ultimi N backup
      if (files.length > this.maxBackups) {
        for (const file of files.slice(this.maxBackups)) {
          fs.unlinkSync(file.path);
          if (process.env.CLOUD_STORAGE_ENABLED === 'true') {
            await deleteFromCloud(file.name);
          }
          logger.info(`Backup eliminato: ${file.name}`);
        }
      }

      // Elimina backup vecchi
      const now = new Date();
      for (const file of files) {
        const ageInDays = (now - file.time) / (1000 * 60 * 60 * 24);
        if (ageInDays > this.maxBackupAge) {
          fs.unlinkSync(file.path);
          if (process.env.CLOUD_STORAGE_ENABLED === 'true') {
            await deleteFromCloud(file.name);
          }
          logger.info(`Backup vecchio eliminato: ${file.name}`);
        }
      }

    } catch (error) {
      logger.error('Errore nella pulizia dei backup:', error);
      throw error;
    }
  }

  private async readCompressedFile(filePath) {
    // Implementazione lettura file compressi
  }

  private validateBackup(backupData) {
    // Implementazione validazione backup
    return true;
  }
}

export default new BackupManager();