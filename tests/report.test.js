// tests/report.test.js
import mongoose from 'mongoose';
import { createTestOrdine } from './helpers';
import { generaReport } from '../controllers/reportController';
import { format } from 'date-fns';

describe('Test Report', () => {
  beforeEach(async () => {
    await mongoose.connection.dropCollection('ordini');
  });

  test('report giornaliero', async () => {
    // Crea ordini per oggi
    await Promise.all([
      createTestOrdine(),
      createTestOrdine(),
      createTestOrdine()
    ]);

    const report = await generaReport({
      tipo: 'giornaliero',
      data: format(new Date(), 'yyyy-MM-dd')
    });

    expect(report.totaleOrdini).toBe(3);
    expect(report.ordini).toHaveLength(3);
    expect(report.totaleValore).toBe(90);
  });

  test('report per categoria', async () => {
    await Promise.all([
      createTestOrdine({
        prodotti: [{
          categoria: 'pasta',
          prodotto: 'Culurgiones',
          quantita: 2,
          unitaMisura: 'kg',
          prezzo: 15
        }]
      }),
      createTestOrdine({
        prodotti: [{
          categoria: 'dolci',
          prodotto: 'Seadas',
          quantita: 3,
          unitaMisura: 'pezzi',
          prezzo: 5
        }]
      })
    ]);

    const report = await generaReport({
      tipo: 'categoria',
      categoria: 'pasta'
    });

    expect(report.ordini).toHaveLength(1);
    expect(report.totaleCategoria).toBe(30);
  });
});