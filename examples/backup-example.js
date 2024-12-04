// examples/backup-example.js
import BackupManager from '../utils/backup-manager.js';
import logger from '../config/logger.js';

// Esempio di backup manuale
async function createManualBackup() {
  try {
    const backupPath = await BackupManager.createBackup(
      { type: 'manual', timestamp: new Date() },
      { uploadToCloud: true }
    );
    logger.info(`Backup creato: ${backupPath}`);
  } catch (error) {
    logger.error('Errore backup manuale:', error);
  }
}

// Esempio di ripristino
async function restoreFromBackup(filename) {
  try {
    const data = await BackupManager.restoreBackup(filename);
    logger.info('Backup ripristinato con successo');
    return data;
  } catch (error) {
    logger.error('Errore ripristino:', error);
  }
}

// Esempio di pulizia backup
async function cleanupOldBackups() {
  try {
    await BackupManager.cleanup();
    logger.info('Pulizia backup completata');
  } catch (error) {
    logger.error('Errore pulizia:', error);
  }
}