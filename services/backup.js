import { createWriteStream } from 'fs';
import { join } from 'path';
import archiver from 'archiver';
import logger from '../config/logger.js';
import Ordine from '../models/ordine.js';

class ServizioBackup {
  async creaBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const nomeFile = `backup-${timestamp}.zip`;
      const output = createWriteStream(join('backups', nomeFile));
      const archivio = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        logger.info(`Backup completato: ${nomeFile}`);
      });

      archivio.pipe(output);

      // Backup ordini
      const ordini = await Ordine.find();
      archivio.append(JSON.stringify(ordini), { name: 'ordini.json' });

      await archivio.finalize();
      return nomeFile;
    } catch (errore) {
      logger.error('Errore creazione backup:', errore);
      throw errore;
    }
  }

  async ripristina(nomeFile) {
    // Implementazione ripristino
  }
}

export const servizioBackup = new ServizioBackup();