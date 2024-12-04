// tests/error/error-handling.test.js
import request from 'supertest';
import { app } from '../../server.js';
import { Ordine } from '../../models/ordine.js';
import mongoose from 'mongoose';

describe('Test Gestione Errori', () => {
 beforeEach(async () => {
   await Ordine.deleteMany({});
 });

 test('400 - Dati ordine invalidi', async () => {
   const ordineInvalido = {
     // Mancano campi obbligatori
     nomeCliente: 'Test'
   };

   const response = await request(app)
     .post('/api/ordini')
     .send(ordineInvalido);

   expect(response.status).toBe(400);
   expect(response.body.success).toBe(false);
   expect(response.body.error).toContain('validazione');
 });

 test('404 - Ordine non trovato', async () => {
   const idNonEsistente = new mongoose.Types.ObjectId();
   const response = await request(app).get(`/api/ordini/${idNonEsistente}`);

   expect(response.status).toBe(404);
   expect(response.body.success).toBe(false);
   expect(response.body.error).toContain('non trovato');
 });

 test('500 - Errore database', async () => {
   // Simula un errore di connessione
   const originalConnect = mongoose.connect;
   mongoose.connect = jest.fn(() => Promise.reject(new Error('DB Error')));

   const response = await request(app).get('/api/ordini');

   expect(response.status).toBe(500);
   expect(response.body.success).toBe(false);
   expect(response.body.error).toContain('database');

   mongoose.connect = originalConnect;
 });
});