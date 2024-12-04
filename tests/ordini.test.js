// tests/ordini.test.js
import mongoose from 'mongoose';
import Ordine from '../models/ordine';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
  });
});