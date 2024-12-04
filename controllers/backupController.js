import backupService from '../services/backupService.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

export const backupController = {
  async createBackup(req, res) {
    const { tipo } = req.body;
    const result = await backupService.createBackup(tipo);
    
    res.json({
      success: true,
      data: result
    });
  },

  async listBackups(req, res) {
    const backups = await backupService.listBackups();
    
    res.json({
      success: true,
      data: backups
    });
  },

  async restore(req, res) {
    const { filename } = req.body;
    
    if (!filename) {
      throw new AppError('Nome file non fornito', 400);
    }

    await backupService.restore(filename);
    
    res.json({
      success: true,
      message: 'Ripristino completato con successo'
    });
  }
};