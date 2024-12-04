const mongoose = require('mongoose');
const { Ordine } = require('../../models/ordine');

describe('Performance Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  it('dovrebbe gestire inserimenti in massa', async () => {
    const ordini = Array(1000).fill().map((_, i) => ({
      nomeCliente: `Cliente ${i}`,
      telefono: `123456${i}`,
      dataRitiro: new Date(),
      prodotti: [{
        prodotto: 'Test Prodotto',
        quantita: 1,
        prezzo: 10,
        unitaMisura: 'kg',
        categoria: 'pasta'
      }]
    }));

    const startTime = Date.now();
    await Ordine.insertMany(ordini);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // Max 5 secondi
    const count = await Ordine.countDocuments();
    expect(count).toBe(1000);
  });

  it('dovrebbe gestire query complesse efficientemente', async () => {
    // Inserisci dati di test
    const ordini = Array(100).fill().map((_, i) => ({
      nomeCliente: `Cliente ${i}`,
      telefono: `123456${i}`,
      dataRitiro: new Date(),
      prodotti: [
        {
          prodotto: 'Prodotto 1',
          quantita: i % 5 + 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        },
        {
          prodotto: 'Prodotto 2',
          quantita: i % 3 + 1,
          prezzo: 15,
          unitaMisura: 'pz',
          categoria: 'dolci'
        }
      ],
      stato: i % 2 === 0 ? 'completato' : 'nuovo'
    }));

    await Ordine.insertMany(ordini);

    const startTime = Date.now();
    const results = await Ordine.aggregate([
      {
        $unwind: '$prodotti'
      },
      {
        $group: {
          _id: {
            categoria: '$prodotti.categoria',
            stato: '$stato'
          },
          totaleQuantita: { $sum: '$prodotti.quantita' },
          totaleValore: {
            $sum: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] }
          }
        }
      },
      {
        $sort: { 
          '_id.categoria': 1,
          '_id.stato': 1
        }
      }
    ]);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // Max 1 secondo
    expect(results.length).toBeGreaterThan(0);
  });
});