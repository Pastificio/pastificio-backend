// utils/queryOptimizer.js
import mongoose from 'mongoose';
import logger from '../config/logger.js';

class QueryOptimizer {
  async setupIndexes() {
    try {
      const Ordine = mongoose.model('Ordine');
      
      await Ordine.collection.createIndexes([
        { dataRitiro: 1 },
        { nomeCliente: 1 },
        { stato: 1 }
      ]);
      
      logger.info('Indici database creati con successo');
    } catch (error) {
      logger.error('Errore nella creazione degli indici:', error);
    }
  }

  optimizeQuery(baseQuery, filters = {}, options = {}) {
    // Applica filtri
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        baseQuery = baseQuery.where(key, value);
      }
    });

    // Paginazione
    if (options.page && options.limit) {
      baseQuery = baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit);
    }

    // Ordinamento
    if (options.sort) {
      baseQuery = baseQuery.sort(options.sort);
    }

    // Performance
    baseQuery = baseQuery.lean();

    return baseQuery;
  }
}

export default new QueryOptimizer();