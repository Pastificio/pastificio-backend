// src/scripts/backup.js
import { createBackup } from '../services/backup.js';
import logger from '../config/logger.js';

async function runBackup() {
  try {
    const filename = await createBackup();
    logger.info(`Backup completato: ${filename}`);
    process.exit(0);
  } catch (error) {
    logger.error('Errore durante il backup:', error);
    process.exit(1);
  }
}

runBackup();