import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from './src/config/logger.js';
import authRoutes from './routes/auth.js';
import ordiniRoutes from './routes/ordini.js';
import reportRoutes from './routes/report.js';
import dashboardRoutes from './routes/dashboard.js';
import backupRoutes from './routes/backup.js';
import { errorHandler } from './middleware/error.js';
import compression from 'compression';
import fileUpload from 'express-fileupload';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSocketIO } from './src/utils/notifiche.js';
import backupService from './services/backupService.js';
import { Ordine } from './models/ordine.js';
import { User } from './models/User.js';
import fs from 'fs';
import path from 'path';

// Configura dotenv
config();

const app = express();
const httpServer = createServer(app);
export const io = initializeSocketIO(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Configura mongoose
mongoose.set('strictQuery', true);

// Connessione MongoDB solo se non siamo in test
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      logger.info('MongoDB connected successfully');
    })
    .catch((err) => {
      logger.error('MongoDB connection error:', err);
    });
}

// Helper function per ottenere tutti i dati per il backup
async function getAllData() {
  try {
    const [ordini, users] = await Promise.all([
      Ordine.find({}).lean(),
      User.find({}, { password: 0 }).lean()
    ]);

    return {
      ordini,
      users,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error getting data for backup:', error);
    throw error;
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ordini', ordiniRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Error handling
app.use(errorHandler);

// Cron jobs (solo in produzione)
if (process.env.NODE_ENV !== 'test') {
  // Backup completo settimanale
  cron.schedule('0 0 * * 0', async () => {
    logger.info('Avvio backup completo settimanale');
    try {
      const data = await getAllData();
      await backupService.createBackup(data, `full-backup-${new Date().toISOString()}`, {
        type: 'full',
        compress: true,
        encrypt: true,
        compressionLevel: 9
      });
      logger.info('Backup completo settimanale completato con successo');
    } catch (error) {
      logger.error('Errore durante il backup completo:', error);
    }
  });

  // Backup incrementale giornaliero (eccetto domenica)
  cron.schedule('0 0 * * 1-6', async () => {
    logger.info('Avvio backup incrementale giornaliero');
    try {
      const data = await getAllData();
      await backupService.createIncrementalBackup(data, 'daily-backup');
      logger.info('Backup incrementale completato con successo');
    } catch (error) {
      logger.error('Errore durante il backup incrementale:', error);
    }
  });

  // Pulizia file temporanei e backup vecchi
  cron.schedule('0 1 * * *', async () => {
    logger.info('Avvio pulizia file temporanei e backup');
    try {
      await backupService.cleanupOldBackups();
      // Pulizia file temporanei
      const tempDir = '/tmp/';
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);
      
      const files = await fs.promises.readdir(tempDir);
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.mtime < cutoff) {
          await fs.promises.unlink(filePath);
          logger.info(`File temporaneo eliminato: ${file}`);
        }
      }
      
      logger.info('Pulizia completata con successo');
    } catch (error) {
      logger.error('Errore durante la pulizia:', error);
    }
  });

  // Monitoraggio spazio backup
  cron.schedule('0 */6 * * *', async () => {
    try {
      const backups = await backupService.listBackups();
      const totalSize = backups.reduce((acc, backup) => acc + backup.size, 0);
      logger.info(`Spazio totale backup: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      if (totalSize > 1024 * 1024 * 1024) { // 1GB
        logger.warn('Attenzione: spazio backup superiore a 1GB');
      }
    } catch (error) {
      logger.error('Errore nel monitoraggio spazio backup:', error);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM ricevuto. Avvio graceful shutdown...');
  // Backup finale prima dello shutdown
  try {
    const data = await getAllData();
    await backupService.createBackup(data, `shutdown-backup-${new Date().toISOString()}`);
  } catch (error) {
    logger.error('Errore nel backup di shutdown:', error);
  }
  
  await mongoose.connection.close();
  process.exit(0);
});

// Avvia il server solo se non siamo in modalità test
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    logger.info(`Server in esecuzione sulla porta ${PORT}`);
    logger.info(`Ambiente: ${process.env.NODE_ENV}`);
  });
}

export default app;