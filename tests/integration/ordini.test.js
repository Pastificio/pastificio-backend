// tests/integration/ordini.test.js
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../server.js';
import { Ordine } from '../../models/ordine.js';

describe('Test API Ordini', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('POST /api/ordini - crea nuovo ordine', async () => {
    const ordine = {
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

    const response = await request(app)
      .post('/api/ordini')
      .send(ordine);

    expect(response.status).toBe(201);
    expect(response.body.nomeCliente).toBe(ordine.nomeCliente);
    expect(response.body.totaleOrdine).toBe(30);
  });

  test('GET /api/ordini - lista ordini', async () => {
    await Ordine.create({
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
    });

    const response = await request(app).get('/api/ordini');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test('GET /api/ordini/:id - dettaglio ordine', async () => {
    const ordine = await Ordine.create({
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
    });

    const response = await request(app).get(`/api/ordini/${ordine._id}`);
    expect(response.status).toBe(200);
    expect(response.body.nomeCliente).toBe('Test Cliente');
  });

  test('PUT /api/ordini/:id - aggiorna ordine', async () => {
    const ordine = await Ordine.create({
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
    });

    const response = await request(app)
      .put(`/api/ordini/${ordine._id}`)
      .send({ nomeCliente: 'Cliente Aggiornato' });

    expect(response.status).toBe(200);
    expect(response.body.nomeCliente).toBe('Cliente Aggiornato');
  });
});