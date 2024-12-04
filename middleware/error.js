import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log dell'errore
  logger.error(err.stack);

  // Ottieni il codice di stato dell'errore
  const statusCode = err.statusCode || 500;

  // Rispondi con l'errore
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};