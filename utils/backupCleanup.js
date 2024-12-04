import logger from '../config/logger.js';
import backupService from '../services/backupService.js';

const BACKUP_RETENTION_DAYS = 7;  // Configurable

export async function cleanupOldBackups() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

    const backups = await backupService.listBackups();
    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        await fs.promises.unlink(path.join(BACKUP_DIR, backup.filename));
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`Deleted ${deletedCount} old backups`);
    }
  } catch (error) {
    logger.error('Backup cleanup failed:', error);
    // Non rilanciare l'errore per evitare di interrompere altri processi
  }
}