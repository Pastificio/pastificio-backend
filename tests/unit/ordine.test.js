// tests/unit/ordine.test.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Ordine } from '../../models/ordine.js';

describe('Test Modello Ordine', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('crea & salva ordine con successo', async () => {
    const ordineValido = {
      nomeCliente: 'Test Cliente',
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Culurgiones',
        quantita: 2,
        unitaMisura: 'kg',
        prezzo: 15
      }]
    };

    const ordine = new Ordine(ordineValido);
    const ordineGestito = await ordine.save();
 
    expect(ordineGestito._id).toBeDefined();
    expect(ordineGestito.nomeCliente).toBe(ordineValido.nomeCliente);
    expect(ordineGestito.totaleOrdine).toBe(30); // 2 * 15
    expect(ordineGestito.stato).toBe('nuovo');
  });

  test('calcolo totale ordine con più prodotti', async () => {
    const ordine = new Ordine({
      nomeCliente: 'Test Cliente',
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [
        {
          categoria: 'pasta',
          prodotto: 'Culurgiones',
          quantita: 2,
          unitaMisura: 'kg',
          prezzo: 15
        },
        {
          categoria: 'dolci',
          prodotto: 'Seadas',
          quantita: 3,
          unitaMisura: 'unità',
          prezzo: 5
        }
      ]
    });

    await ordine.save();
    expect(ordine.totaleOrdine).toBe(45); // (2 * 15) + (3 * 5)
    expect(ordine.numeroTotaleProdotti).toBe(2);
  });

  test('cambio stato ordine', async () => {
    const ordine = new Ordine({
      nomeCliente: 'Test Cliente',
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Culurgiones',
        quantita: 1,
        unitaMisura: 'kg',
        prezzo: 15
      }]
    });

    await ordine.save();
    await ordine.cambiaStato('in_lavorazione');
    expect(ordine.stato).toBe('in_lavorazione');
  });

  test('ricerca ordini per data', async () => {
    const data = new Date();
    const ordine = new Ordine({
      nomeCliente: 'Test Cliente',
      telefono: '1234567890',
      dataRitiro: data,
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Culurgiones',
        quantita: 1,
        unitaMisura: 'kg',
        prezzo: 15
      }]
    });

    await ordine.save();
    const ordiniTrovati = await Ordine.findByData(data);
    expect(ordiniTrovati.length).toBe(1);
    expect(ordiniTrovati[0].nomeCliente).toBe('Test Cliente');
  });
});