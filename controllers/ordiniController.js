import { AppError } from '../middleware/errorHandler.js';
import Ordine from '../models/ordine.js';
import logger from '../config/logger.js';

export const ordiniController = {
  async creaOrdine(req, res) {
    const ordine = new Ordine({
      ...req.body,
      creatoDa: req.user.id
    });

    await ordine.save();
    logger.info(`Nuovo ordine creato: ${ordine._id}`);
    
    res.status(201).json({
      success: true,
      data: ordine
    });
  },

  async getOrdini(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filtri
    if (req.query.data) {
      query.dataRitiro = new Date(req.query.data);
    }
    
    if (req.query.cliente) {
      query.nomeCliente = new RegExp(req.query.cliente, 'i');
    }

    const [ordini, total] = await Promise.all([
      Ordine.find(query)
        .skip(skip)
        .limit(limit)
        .sort('-createdAt'),
      Ordine.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: ordini,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  },

  async getOrdine(req, res) {
    const ordine = await Ordine.findById(req.params.id);
    
    if (!ordine) {
      throw new AppError('Ordine non trovato', 404);
    }

    res.json({
      success: true,
      data: ordine
    });
  },

  async updateOrdine(req, res) {
    const ordine = await Ordine.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        modificatoDa: req.user.id 
      },
      { new: true, runValidators: true }
    );

    if (!ordine) {
      throw new AppError('Ordine non trovato', 404);
    }

    logger.info(`Ordine aggiornato: ${ordine._id}`);

    res.json({
      success: true,
      data: ordine
    });
  },

  async deleteOrdine(req, res) {
    const ordine = await Ordine.findByIdAndDelete(req.params.id);
    
    if (!ordine) {
      throw new AppError('Ordine non trovato', 404);
    }

    logger.info(`Ordine eliminato: ${ordine._id}`);

    res.json({
      success: true,
      data: {}
    });
  }
};