import mongoose from 'mongoose';

const prodottoSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: true,
    enum: ['pasta', 'dolci', 'panadas']
  },
  prodotto: {
    type: String,
    required: true
  },
  quantita: {
    type: Number,
    required: true,
    min: 0
  },
  unitaMisura: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'unità', 'pezzi']
  },
  prezzo: {
    type: Number,
    required: true,
    min: 0
  }
});

const ordineSchema = new mongoose.Schema({
  nomeCliente: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  dataRitiro: {
    type: Date,
    required: true
  },
  oraRitiro: {
    type: String,
    required: true
  },
  prodotti: [prodottoSchema],
  daViaggio: {
    type: Boolean,
    default: false
  },
  note: String,
  stato: {
    type: String,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'consegnato', 'annullato'],
    default: 'nuovo'
  }
}, {
  timestamps: true
});

// Calcola il totale dell'ordine prima del salvataggio
ordineSchema.pre('save', function(next) {
  if (this.prodotti && this.prodotti.length > 0) {
    this.totale = this.prodotti.reduce((sum, prodotto) => {
      return sum + (prodotto.quantita * prodotto.prezzo);
    }, 0);
  }
  next();
});

// Metodi virtuali
ordineSchema.virtual('numeroTotaleProdotti').get(function() {
  return this.prodotti ? this.prodotti.length : 0;
});

ordineSchema.virtual('totaleOrdine').get(function() {
  if (!this.prodotti) return 0;
  return this.prodotti.reduce((sum, prodotto) => {
    return sum + (prodotto.quantita * prodotto.prezzo);
  }, 0);
});

// Configurazione per includere virtuals quando si converte in JSON
ordineSchema.set('toJSON', { virtuals: true });
ordineSchema.set('toObject', { virtuals: true });

// Metodi statici
ordineSchema.statics.findByData = function(data) {
  const inizio = new Date(data);
  inizio.setHours(0, 0, 0, 0);
  const fine = new Date(data);
  fine.setHours(23, 59, 59, 999);
  
  return this.find({
    dataRitiro: {
      $gte: inizio,
      $lte: fine
    }
  });
};

// Metodi di istanza
ordineSchema.methods.cambiaStato = function(nuovoStato) {
  if (this.schema.path('stato').enumValues.includes(nuovoStato)) {
    this.stato = nuovoStato;
    return this.save();
  }
  throw new Error('Stato non valido');
};

const Ordine = mongoose.model('Ordine', ordineSchema);

export { Ordine };
export default Ordine;