import cloudStorage from './cloudStorage.js';
import logger from '../config/logger.js';

class BackupRotationService {
  constructor() {
    this.maxBackups = {
      daily: 7,    // Mantieni 7 backup giornalieri
      weekly: 4,   // Mantieni 4 backup settimanali
      monthly: 3   // Mantieni 3 backup mensili
    };
  }

  async rotateBackups() {
    try {
      const backups = await cloudStorage.listBackups();
      const categorizedBackups = this.categorizeBackups(backups);

      // Rotazione backup giornalieri
      await this.rotateCategory(categorizedBackups.daily, this.maxBackups.daily);
      
      // Rotazione backup settimanali
      await this.rotateCategory(categorizedBackups.weekly, this.maxBackups.weekly);
      
      // Rotazione backup mensili
      await this.rotateCategory(categorizedBackups.monthly, this.maxBackups.monthly);

      logger.info('Rotazione backup completata');
    } catch (error) {
      logger.error('Errore nella rotazione dei backup:', error);
      throw error;
    }
  }

  categorizeBackups(backups) {
    const result = {
      daily: [],
      weekly: [],
      monthly: []
    };

    backups.forEach(backup => {
      const date = new Date(backup.createdAt);
      
      if (backup.filename.includes('auto-daily')) {
        result.daily.push(backup);
      } else if (backup.filename.includes('auto-weekly')) {
        result.weekly.push(backup);
      } else if (backup.filename.includes('auto-monthly')) {
        result.monthly.push(backup);
      }
    });

    return result;
  }

  async rotateCategory(backups, maxCount) {
    if (backups.length <= maxCount) return;

    // Ordina per data, più recenti prima
    const sortedBackups = backups.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Elimina i backup più vecchi che superano maxCount
    const toDelete = sortedBackups.slice(maxCount);
    
    for (const backup of toDelete) {
      await cloudStorage.deleteBackup(backup.filename);
      logger.info(`Backup eliminato per rotazione: ${backup.filename}`);
    }
  }
}

export default new BackupRotationService();