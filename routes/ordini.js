import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { Ordine } from '../models/ordine.js';
import { logger } from '../config/logger.js';
import { io } from '../websocket.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

// GET /api/ordini
// Recupera tutti gli ordini con paginazione e filtri
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Costruzione dei filtri
    const filters = {};
    if (req.query.dataRitiro) filters.dataRitiro = req.query.dataRitiro;
    if (req.query.nomeCliente) filters.nomeCliente = new RegExp(req.query.nomeCliente, 'i');
    if (req.query.stato) filters.stato = req.query.stato;

    // Ordinamento
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.dataRitiro = 1;
    }

    const ordini = await Ordine.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('modificatoDa', 'username');

    const total = await Ordine.countDocuments(filters);

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

    logger.info(`Ordini recuperati con successo. Totale: ${total}`);
  } catch (error) {
    logger.error('Errore nel recupero degli ordini:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero degli ordini' });
  }
});

// GET /api/ordini/oggi
// Recupera gli ordini di oggi
router.get('/oggi', async (req, res) => {
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: oggi,
        $lt: domani
      }
    }).sort('oraRitiro');

    res.json({ success: true, data: ordini });
    logger.info(`Ordini di oggi recuperati con successo. Totale: ${ordini.length}`);
  } catch (error) {
    logger.error('Errore nel recupero degli ordini di oggi:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero degli ordini di oggi' });
  }
});

// POST /api/ordini
// Crea un nuovo ordine
router.post('/', async (req, res) => {
  try {
    const ordine = new Ordine({
      ...req.body,
      creatoDa: req.user._id,
      modificatoDa: req.user._id
    });

    await ordine.save();
    
    // Notifica WebSocket
    io.emit('nuovoOrdine', { ordine });

    res.status(201).json({ success: true, data: ordine });
    logger.info(`Nuovo ordine creato con ID: ${ordine._id}`);
  } catch (error) {
    logger.error('Errore nella creazione dell\'ordine:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/ordini/:id
// Recupera un ordine specifico
router.get('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id)
      .populate('creatoDa', 'username')
      .populate('modificatoDa', 'username');

    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    res.json({ success: true, data: ordine });
  } catch (error) {
    logger.error('Errore nel recupero dell\'ordine:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero dell\'ordine' });
  }
});

// PUT /api/ordini/:id
// Aggiorna un ordine
router.put('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id);
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    // Aggiorna i campi
    Object.assign(ordine, req.body);
    ordine.modificatoDa = req.user._id;
    ordine.dataModifica = new Date();

    await ordine.save();

    // Notifica WebSocket
    io.emit('ordineAggiornato', { ordine });

    res.json({ success: true, data: ordine });
    logger.info(`Ordine ${ordine._id} aggiornato con successo`);
  } catch (error) {
    logger.error('Errore nell\'aggiornamento dell\'ordine:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/ordini/:id
// Elimina un ordine (solo admin)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id);
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    await ordine.remove();

    // Notifica WebSocket
    io.emit('ordineEliminato', { id: req.params.id });

    res.json({ success: true, data: {} });
    logger.info(`Ordine ${req.params.id} eliminato con successo`);
  } catch (error) {
    logger.error('Errore nell\'eliminazione dell\'ordine:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'eliminazione dell\'ordine' });
  }
});

// GET /api/ordini/statistiche/giornaliere
// Recupera statistiche giornaliere
router.get('/statistiche/giornaliere', async (req, res) => {
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    const stats = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: {
            $gte: oggi,
            $lt: domani
          }
        }
      },
      {
        $group: {
          _id: null,
          totaleOrdini: { $sum: 1 },
          totaleValore: { $sum: '$totale' },
          mediaValore: { $avg: '$totale' }
        }
      }
    ]);

    res.json({ success: true, data: stats[0] || null });
    logger.info('Statistiche giornaliere generate con successo');
  } catch (error) {
    logger.error('Errore nel calcolo delle statistiche:', error);
    res.status(500).json({ success: false, error: 'Errore nel calcolo delle statistiche' });
  }
});

// GET /api/ordini/search
// Ricerca avanzata ordini
router.get('/search', async (req, res) => {
  try {
    const { query, startDate, endDate, categoria } = req.query;
    const searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { nomeCliente: new RegExp(query, 'i') },
        { telefono: new RegExp(query, 'i') },
        { 'prodotti.prodotto': new RegExp(query, 'i') }
      ];
    }

    if (startDate && endDate) {
      searchQuery.dataRitiro = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (categoria) {
      searchQuery['prodotti.categoria'] = categoria;
    }

    const ordini = await Ordine.find(searchQuery)
      .sort('-dataRitiro')
      .limit(100);

    res.json({ success: true, data: ordini });
    logger.info(`Ricerca ordini completata. Risultati: ${ordini.length}`);
  } catch (error) {
    logger.error('Errore nella ricerca ordini:', error);
    res.status(500).json({ success: false, error: 'Errore nella ricerca ordini' });
  }
});

export default router;