import { servizioBackup } from '../services/backup.js';
import logger from '../config/logger.js';

export const backupController = {
  async eseguiBackup(req, res) {
    try {
      const nomeFile = await servizioBackup.creaBackup();
      res.json({ successo: true, nomeFile });
    } catch (errore) {
      logger.error('Backup fallito:', errore);
      res.status(500).json({ successo: false, errore: errore.message });
    }
  }
};