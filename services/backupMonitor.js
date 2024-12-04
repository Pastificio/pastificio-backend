import { EventEmitter } from 'events';
import logger from '../config/logger.js';

class BackupMonitor extends EventEmitter {
  constructor() {
    super();
    this.activeBackups = new Map();
    this.backupStats = {
      total: 0,
      successful: 0,
      failed: 0,
      lastBackup: null
    };
  }

  startBackup(backupId, details) {
    this.activeBackups.set(backupId, {
      startTime: Date.now(),
      status: 'running',
      progress: 0,
      ...details
    });

    this.emit('backupStarted', { backupId, details });
    logger.info(`Backup started: ${backupId}`);
  }

  updateProgress(backupId, progress) {
    const backup = this.activeBackups.get(backupId);
    if (backup) {
      backup.progress = progress;
      this.emit('backupProgress', { backupId, progress });
    }
  }

  completeBackup(backupId, result) {
    const backup = this.activeBackups.get(backupId);
    if (backup) {
      backup.status = 'completed';
      backup.endTime = Date.now();
      backup.result = result;

      this.backupStats.total++;
      this.backupStats.successful++;
      this.backupStats.lastBackup = {
        id: backupId,
        timestamp: backup.endTime,
        duration: backup.endTime - backup.startTime,
        result
      };

      this.emit('backupCompleted', { backupId, backup });
      logger.info(`Backup completed: ${backupId}`);
      this.activeBackups.delete(backupId);
    }
  }

  failBackup(backupId, error) {
    const backup = this.activeBackups.get(backupId);
    if (backup) {
      backup.status = 'failed';
      backup.endTime = Date.now();
      backup.error = error;

      this.backupStats.total++;
      this.backupStats.failed++;

      this.emit('backupFailed', { backupId, backup, error });
      logger.error(`Backup failed: ${backupId}`, error);
      this.activeBackups.delete(backupId);
    }
  }

  getActiveBackups() {
    return Array.from(this.activeBackups.entries()).map(([id, backup]) => ({
      id,
      ...backup
    }));
  }

  getBackupStats() {
    return this.backupStats;
  }

  getBackupStatus(backupId) {
    return this.activeBackups.get(backupId);
  }
}

export const backupMonitor = new BackupMonitor();