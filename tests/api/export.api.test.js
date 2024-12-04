// tests/api/export.api.test.js
import request from 'supertest';
import { app } from '../../server.js';
import { Ordine } from '../../models/ordine.js';
import fs from 'fs/promises';
import path from 'path';

describe('Test API Export', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('GET /api/export/excel', async () => {
    await Ordine.create({
      nomeCliente: 'Cliente Test',
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
      .get('/api/export/excel')
      .set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/spreadsheetml/);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('GET /api/export/pdf', async () => {
    await Ordine.create({
      nomeCliente: 'Cliente Test',
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
      .get('/api/export/pdf')
      .set('Accept', 'application/pdf');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.body.length).toBeGreaterThan(0);
  });
});