import express from 'express';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';
import backupService from '../services/backupService.js';

const router = express.Router();

// Protezione route - solo admin
router.use(protect);
router.use((req, res, next) => {
  if (req.user.ruolo !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accesso non autorizzato'
    });
  }
  next();
});

// POST /api/backup - Crea backup manuale
router.post('/', async (req, res) => {
  try {
    const { tipo } = req.body;
    const result = await backupService.createBackup(tipo);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Errore nella creazione del backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/backup - Lista backup disponibili
router.get('/', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    logger.error('Errore nel recupero lista backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/backup/restore - Ripristina da backup
router.post('/restore', async (req, res) => {
  try {
    const { filename } = req.body;
    await backupService.restore(filename);
    
    res.json({
      success: true,
      message: 'Restore completato con successo'
    });
  } catch (error) {
    logger.error('Errore nel restore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;