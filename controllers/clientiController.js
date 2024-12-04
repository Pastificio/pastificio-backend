// controllers/clientiController.js
import { Schema, model } from 'mongoose';
import logger from '../config/logger.js';

// Schema Cliente 
const ClienteSchema = new Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  cognome: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    required: true,
    unique: true
  },
  punti: {
    type: Number,
    default: 0
  },
  tipo: {
    type: String,
    enum: ['abituale', 'occasionale', 'business'],
    default: 'occasionale'
  },
  indirizzi: [{
    via: String,
    citta: String,
    cap: String,
    note: String
  }],
  note: String,
  dataRegistrazione: {
    type: Date,
    default: Date.now
  },
  ultimoOrdine: {
    type: Date
  },
  stato: {
    type: String, 
    enum: ['attivo', 'inattivo'],
    default: 'attivo'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
ClienteSchema.virtual('nomeCompleto').get(function() {
  return `${this.nome} ${this.cognome}`;
});

// Model
const Cliente = model('Cliente', ClienteSchema);

// Controller methods
export const getClienti = async (req, res) => {
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
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente non trovato' });
    }
    res.json(cliente);
  } catch (error) {
    logger.error('Errore nel recupero cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const creaCliente = async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    
    logger.info(`Nuovo cliente creato: ${cliente.nomeCompleto}`);
    
    // Notifica via WebSocket
    req.app.get('io').emit('nuovoCliente', cliente);
    
    res.status(201).json(cliente);
  } catch (error) {
    logger.error('Errore nella creazione cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const aggiornaCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente non trovato' });
    }

    logger.info(`Cliente aggiornato: ${cliente.nomeCompleto}`);
    
    // Notifica via WebSocket
    req.app.get('io').emit('clienteAggiornato', cliente);
    
    res.json(cliente);
  } catch (error) {
    logger.error('Errore nell\'aggiornamento cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Aggiungi punti fedeltà
export const aggiungiPunti = async (req, res) => {
  try {
    const { punti } = req.body;
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { $inc: { punti: punti }},
      { new: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente non trovato' });
    }

    logger.info(`Aggiunti ${punti} punti al cliente ${cliente.nomeCompleto}`);
    
    // Notifica via WebSocket
    req.app.get('io').emit('puntiAggiornati', { 
      clienteId: cliente._id,
      puntiTotali: cliente.punti
    });
    
    res.json(cliente);
  } catch (error) {
    logger.error('Errore nell\'aggiunta punti:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getClienti,
  getCliente, 
  creaCliente,
  aggiornaCliente,
  aggiungiPunti
};