// tests/performance/ordini.test.js
import mongoose from 'mongoose';
import Ordine from '../../models/ordine';
import { createTestOrdine } from '../helpers';

describe('Test Performance', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('bulk insert ordini', async () => {
    const ordini = Array.from({ length: 100 }, (_, i) => ({
      nomeCliente: `Cliente ${i}`,
      telefono: `123456${i}`,
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Culurgiones',
        quantita: 2,
        unitaMisura: 'kg',
        prezzo: 15
      }]
    }));

    const startTime = Date.now();
    await Ordine.insertMany(ordini);
    const endTime = Date.now();

    const count = await Ordine.countDocuments();
    expect(count).toBe(100);
    expect(endTime - startTime).toBeLessThan(5000);
  }, 10000);
});