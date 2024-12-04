// routes/clienti.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

const router = express.Router();

// Protezione base per tutte le route
router.use(protect);

// GET /api/clienti
router.get('/', async (req, res) => {
  try {
    const filtri = {};
    const { tipo, stato, cerca } = req.query;

    if (tipo) filtri.tipo = tipo;
    if (stato) filtri.stato = stato;
    if (cerca) {
      filtri.$or = [
        { nome: { $regex: cerca, $options: 'i' }},
        { cognome: { $regex: cerca, $options: 'i' }},
        { email: { $regex: cerca, $options: 'i' }},
        { telefono: { $regex: cerca, $options: 'i' }}
      ];
    }

    const clienti = await Cliente.find(filtri)
      .sort({ cognome: 1, nome: 1 });

    res.json(clienti);
  } catch (error) {
    logger.error('Errore nel recupero clienti:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/clienti
router.post('/', async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    
    logger.info(`Nuovo cliente creato: ${cliente.nome} ${cliente.cognome}`);
    
    // Notifica via WebSocket
    req.app.get('io').emit('nuovoCliente', cliente);
    
    res.status(201).json(cliente);
  } catch (error) {
    logger.error('Errore nella creazione cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/clienti/:id
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    res.json(cliente);
  } catch (error) {
    logger.error('Errore nel recupero cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// PUT /api/clienti/:id
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }

    logger.info(`Cliente aggiornato: ${cliente.nome} ${cliente.cognome}`);
    
    // Notifica via WebSocket
    req.app.get('io').emit('clienteAggiornato', cliente);
    
    res.json(cliente);
  } catch (error) {
    logger.error('Errore nell\'aggiornamento cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/clienti/:id/punti
router.post('/:id/punti', async (req, res) => {
  try {
    const { punti } = req.body;
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { $inc: { punti: punti }},
      { new: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }

    logger.info(`Aggiunti ${punti} punti al cliente ${cliente.nome} ${cliente.cognome}`);
    
    // Notifica via WebSocket
    req.app.get('io').emit('puntiAggiornati', { 
      clienteId: cliente._id,
      puntiTotali: cliente.punti
    });
    
    res.json(cliente);
  } catch (error) {
    logger.error('Errore nell\'aggiunta punti:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/clienti/:id/ordini
router.get('/:id/ordini', async (req, res) => {
  try {
    const ordini = await Ordine.find({ 
      'cliente.id': req.params.id 
    }).sort({ dataRitiro: -1 });
    
    res.json(ordini);
  } catch (error) {
    logger.error('Errore nel recupero ordini cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;