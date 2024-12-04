// models/Cliente.js
import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Inserire il nome'],
    trim: true
  },
  cognome: {
    type: String,
    required: [true, 'Inserire il cognome'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Inserire un indirizzo email valido'
    ]
  },
  telefono: {
    type: String,
    required: [true, 'Inserire il numero di telefono'],
    trim: true
  },
  punti: {
    type: Number,
    default: 0,
    min: 0
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

// Indexes
ClienteSchema.index({ nome: 1, cognome: 1 });
ClienteSchema.index({ email: 1 }, { sparse: true });
ClienteSchema.index({ telefono: 1 });

export default mongoose.model('Cliente', ClienteSchema);