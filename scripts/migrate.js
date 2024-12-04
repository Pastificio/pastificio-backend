// src/scripts/migrate.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connesso');

    // Aggiungi qui le tue migrazioni

    logger.info('Migrazione completata');
    process.exit(0);
  } catch (error) {
    logger.error('Errore durante la migrazione:', error);
    process.exit(1);
  }
}

migrate();