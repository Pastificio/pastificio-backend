require('dotenv').config();
require('dotenv').config();

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minuti
  RATE_LIMIT_MAX: 100, // 100 richieste per finestra
  PAGE_SIZE: 10 // Risultati per pagina di default
};

// Log della configurazione in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Config:', config);
}

module.exports = config;