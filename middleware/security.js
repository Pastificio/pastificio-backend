// middleware/security.js
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import logger from '../config/logger.js';

// Rate limiting base
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite per IP
  message: {
    success: false,
    error: 'Troppe richieste, riprova più tardi'
  }
});

// Security middleware
const securityMiddleware = {
  // Protezione headers con Helmet
  helmet: helmet({
    contentSecurityPolicy: false, // Disabilitato per sviluppo
    crossOriginEmbedderPolicy: false
  }),

  // Sanitizzazione input MongoDB
  mongoSanitize: mongoSanitize()
};

export { securityMiddleware, rateLimitMiddleware };