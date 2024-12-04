const mongoose = require('mongoose');

// Schema Prodotto
const prodottoSchema = new mongoose.Schema({
  prodotto: {
    type: String,
    required: [true, 'Il nome del prodotto è obbligatorio']
  },
  quantita: {
    type: Number,
    required: [true, 'La quantità è obbligatoria'],
    min: [0, 'La quantità non può essere negativa']
  },
  prezzo: {
    type: Number,
    required: [true, 'Il prezzo è obbligatorio'],
    min: [0, 'Il prezzo non può essere negativo']
  },
  unitaMisura: {
    type: String,
    required: [true, 'L\'unità di misura è obbligatoria'],
    enum: ['kg', 'g', 'pz', 'unità']
  },
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    enum: ['pasta', 'dolci', 'panadas']
  }
});

// Schema Ordine
const ordineSchema = new mongoose.Schema({
  nomeCliente: {
    type: String,
    required: [true, 'Il nome del cliente è obbligatorio']
  },
  telefono: {
    type: String,
    required: [true, 'Il numero di telefono è obbligatorio']
  },
  dataRitiro: {
    type: Date,
    required: [true, 'La data di ritiro è obbligatoria']
  },
  prodotti: {
    type: [prodottoSchema],
    validate: [arr => arr.length > 0, 'L\'ordine deve contenere almeno un prodotto']
  },
  stato: {
    type: String,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'annullato'],
    default: 'nuovo'
  },
  totale: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Calcolo automatico del totale
ordineSchema.pre('save', function() {
  this.totale = this.prodotti.reduce((sum, prod) => sum + (prod.prezzo * prod.quantita), 0);
});

const Ordine = mongoose.model('Ordine', ordineSchema);

describe('Test Controller Ordini', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  describe('Creazione Ordini', () => {
    it('dovrebbe creare un nuovo ordine', async () => {
      const nuovoOrdine = {
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(),
        prodotti: [{
          prodotto: 'Pasta Fresca',
          quantita: 2,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      };

      const ordine = await Ordine.create(nuovoOrdine);
      expect(ordine.totale).toBe(20); // 2 * 10
      expect(ordine.stato).toBe('nuovo');
    });

    it('dovrebbe validare i campi obbligatori', async () => {
      const ordineInvalido = {};
      await expect(Ordine.create(ordineInvalido)).rejects.toThrow();
    });
  });

  describe('Gestione Stati', () => {
    it('dovrebbe aggiornare lo stato', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(),
        prodotti: [{
          prodotto: 'Pasta Fresca',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      ordine.stato = 'in_lavorazione';
      await ordine.save();
      expect(ordine.stato).toBe('in_lavorazione');
    });

    it('dovrebbe rifiutare stati non validi', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(),
        prodotti: [{
          prodotto: 'Pasta Fresca',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      ordine.stato = 'stato_non_valido';
      await expect(ordine.save()).rejects.toThrow();
    });
  });

  describe('Ricerca e Filtri', () => {
    beforeEach(async () => {
      const ordini = [
        {
          nomeCliente: 'Cliente 1',
          telefono: '1111111111',
          dataRitiro: new Date(),
          prodotti: [{
            prodotto: 'Pasta Fresca',
            quantita: 1,
            prezzo: 10,
            unitaMisura: 'kg',
            categoria: 'pasta'
          }],
          stato: 'nuovo'
        },
        {
          nomeCliente: 'Cliente 2',
          telefono: '2222222222',
          dataRitiro: new Date(),
          prodotti: [{
            prodotto: 'Dolce',
            quantita: 2,
            prezzo: 15,
            unitaMisura: 'pz',
            categoria: 'dolci'
          }],
          stato: 'completato'
        }
      ];

      await Ordine.insertMany(ordini);
    });

    it('dovrebbe trovare ordini per stato', async () => {
      const ordiniNuovi = await Ordine.find({ stato: 'nuovo' });
      expect(ordiniNuovi).toHaveLength(1);
      expect(ordiniNuovi[0].nomeCliente).toBe('Cliente 1');
    });

    it('dovrebbe trovare ordini per categoria prodotto', async () => {
      const ordiniPasta = await Ordine.find({ 'prodotti.categoria': 'pasta' });
      expect(ordiniPasta).toHaveLength(1);
      expect(ordiniPasta[0].prodotti[0].prodotto).toBe('Pasta Fresca');
    });
  });
});