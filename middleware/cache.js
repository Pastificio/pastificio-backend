// middleware/cache.js
import logger from '../config/logger.js';

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Solo GET requests
    if (req.method !== 'GET') return next();

    // Genera chiave cache
    const key = `__cache__${req.originalUrl || req.url}`;

    try {
      // Per ora utilizziamo una cache in memoria
      // In futuro possiamo implementare Redis
      const cachedResponse = global.cache?.get(key);
      
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Override del metodo res.json per salvare in cache
      const oldJson = res.json;
      res.json = (body) => {
        if (body?.success !== false) { // Non cachare errori
          global.cache?.set(key, JSON.stringify(body), duration);
        }
        return oldJson.call(res, body);
      };

      next();
    } catch (error) {
      logger.error('Errore cache middleware:', error);
      next();
    }
  };
};

export { cacheMiddleware };