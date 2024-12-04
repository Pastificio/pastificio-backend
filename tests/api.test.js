// tests/api.test.js
import request from 'supertest';
import { app } from '../server.js';
import { Ordine } from '../models/ordine.js';

describe('API Ordini', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  const testOrdine = {
    nomeCliente: 'Test Cliente',
    telefono: '1234567890',
    dataRitiro: new Date().toISOString().split('T')[0],
    oraRitiro: '10:00',
    prodotti: [{
      nome: 'Test Prodotto',
      quantita: 1,
      prezzo: 10,
      unita: 'PZ'
    }],
    totale: 10,
    daViaggio: false,
    note: 'Test note'
  };

  describe('POST /api/ordini', () => {
    it('crea un nuovo ordine', async () => {
      const res = await request(app)
        .post('/api/ordini')
        .send(testOrdine);
      
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.nomeCliente).toBe(testOrdine.nomeCliente);
    });
  });

  describe('GET /api/ordini', () => {
    it('recupera tutti gli ordini', async () => {
      await Ordine.create(testOrdine);
      
      const res = await request(app)
        .get('/api/ordini');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(1);
    });
  });
});