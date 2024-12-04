// tests/basic.test.js
import express from 'express';
import request from 'supertest';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';
import { errorHandler } from '../middleware/error.js';

describe('Test API Base', () => {
 let token;
 let server;
 const app = express();
 let ordini = [];

 beforeAll(async () => {
   await mongoose.disconnect();
   await mongoose.connect(process.env.MONGODB_URI);

   const user = await User.create({
     username: 'testuser',
     password: 'password123',
     ruolo: 'admin'
   });
   token = user.getSignedJwtToken();

   app.use(express.json());

   // Middleware di protezione
   const protect = async (req, res, next) => {
     try {
       const authHeader = req.headers.authorization;
       if (!authHeader?.startsWith('Bearer ')) {
         return res.status(401).json({ success: false, error: 'Non autorizzato' });
       }

       const token = authHeader.split(' ')[1];
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = await User.findById(decoded.id);
       next();
     } catch (err) {
       res.status(401).json({ success: false, error: err.message });
     }
   };

   // Validazione richiesta
   const validateOrderRequest = (req, res, next) => {
     const { nomeCliente, prodotti } = req.body;
     
     if (!nomeCliente) {
       return res.status(400).json({ success: false, error: 'Nome cliente richiesto' });
     }

     if (!prodotti || !Array.isArray(prodotti) || prodotti.length === 0) {
       return res.status(400).json({ success: false, error: 'Prodotti richiesti' });
     }

     for (const prodotto of prodotti) {
       if (prodotto.quantita <= 0) {
         return res.status(400).json({ success: false, error: 'Quantità deve essere positiva' });
       }
     }

     next();
   };

   // Rotte base
   app.get('/api/ordini', protect, (req, res) => {
     res.json({ success: true, ordini });
   });

   // Rotte speciali prima dei parametri
   app.get('/api/ordini/stats', protect, (req, res) => {
     const stats = {
       totaleOrdini: ordini.length,
       totaleValore: ordini.reduce((acc, ord) => acc + (ord.totale || 0), 0),
       mediaValore: ordini.length > 0 ? 
         ordini.reduce((acc, ord) => acc + (ord.totale || 0), 0) / ordini.length : 0
     };
     res.json({ success: true, ...stats });
   });

   app.get('/api/ordini/oggi', protect, (req, res) => {
     const oggi = new Date().toISOString().split('T')[0];
     const ordiniOggi = ordini.filter(o => o.dataCreazione?.startsWith(oggi));
     res.json({ success: true, ordini: ordiniOggi });
   });

   app.post('/api/ordini', protect, validateOrderRequest, (req, res) => {
     const nuovoOrdine = {
       ...req.body,
       _id: new mongoose.Types.ObjectId().toString(),
       dataCreazione: new Date().toISOString(),
       totale: req.body.prodotti.reduce((acc, p) => acc + (p.prezzo || 0) * p.quantita, 0)
     };
     ordini.push(nuovoOrdine);
     res.status(201).json({ success: true, ordine: nuovoOrdine });
   });

   // Rotte con parametri dopo
   app.get('/api/ordini/:id', protect, (req, res) => {
     const ordine = ordini.find(o => o._id === req.params.id);
     if (!ordine) {
       return res.status(404).json({ success: false, error: 'Ordine non trovato' });
     }
     res.json({ success: true, ordine });
   });

   app.put('/api/ordini/:id', protect, (req, res) => {
     const index = ordini.findIndex(o => o._id === req.params.id);
     if (index === -1) {
       return res.status(404).json({ success: false, error: 'Ordine non trovato' });
     }
     ordini[index] = { ...ordini[index], ...req.body };
     res.json({ success: true, ordine: ordini[index] });
   });

   app.delete('/api/ordini/:id', protect, (req, res) => {
     const index = ordini.findIndex(o => o._id === req.params.id);
     if (index === -1) {
       return res.status(404).json({ success: false, error: 'Ordine non trovato' });
     }
     ordini.splice(index, 1);
     res.json({ success: true });
   });

   app.use(errorHandler);
   server = app.listen(4001);
 });

 afterAll(async () => {
   await server.close();
   await mongoose.connection.db.dropDatabase();
   await mongoose.disconnect();
 });

 beforeEach(() => {
   ordini = [];
 });

 describe('Test API Ordini', () => {
   test('GET /api/ordini ritorna lista vuota', async () => {
     const response = await request(server)
       .get('/api/ordini')
       .set('Authorization', `Bearer ${token}`);

     expect(response.status).toBe(200);
     expect(response.body).toHaveProperty('success', true);
     expect(response.body.ordini).toEqual([]);
   });

   test('POST /api/ordini crea nuovo ordine', async () => {
     const nuovoOrdine = {
       nomeCliente: 'Mario Rossi',
       telefono: '1234567890',
       prodotti: [{ nome: 'Pardulas', quantita: 1, prezzo: 15 }]
     };

     const response = await request(server)
       .post('/api/ordini')
       .set('Authorization', `Bearer ${token}`)
       .send(nuovoOrdine);

     expect(response.status).toBe(201);
     expect(response.body).toHaveProperty('success', true);
     expect(response.body.ordine).toMatchObject(nuovoOrdine);
   });

   test('GET /api/ordini senza token ritorna 401', async () => {
     const response = await request(server)
       .get('/api/ordini');

     expect(response.status).toBe(401);
   });

   test('GET /api/ordini/:id ritorna ordine specifico', async () => {
     const nuovoOrdine = {
       nomeCliente: 'Mario Rossi',
       telefono: '1234567890',
       prodotti: [{ nome: 'Pardulas', quantita: 1, prezzo: 15 }]
     };

     const createResponse = await request(server)
       .post('/api/ordini')
       .set('Authorization', `Bearer ${token}`)
       .send(nuovoOrdine);

     const ordineId = createResponse.body.ordine._id;

     const response = await request(server)
       .get(`/api/ordini/${ordineId}`)
       .set('Authorization', `Bearer ${token}`);

     expect(response.status).toBe(200);
     expect(response.body.ordine).toMatchObject(nuovoOrdine);
   });

   test('PUT /api/ordini/:id aggiorna ordine', async () => {
     const nuovoOrdine = {
       nomeCliente: 'Mario Rossi',
       telefono: '1234567890',
       prodotti: [{ nome: 'Pardulas', quantita: 1, prezzo: 15 }]
     };

     const createResponse = await request(server)
       .post('/api/ordini')
       .set('Authorization', `Bearer ${token}`)
       .send(nuovoOrdine);

     const ordineId = createResponse.body.ordine._id;

     const updateData = {
       nomeCliente: 'Mario Verdi',
       telefono: '0987654321'
     };

     const response = await request(server)
       .put(`/api/ordini/${ordineId}`)
       .set('Authorization', `Bearer ${token}`)
       .send(updateData);

     expect(response.status).toBe(200);
     expect(response.body.ordine).toMatchObject(updateData);
   });

   test('DELETE /api/ordini/:id elimina ordine', async () => {
     const nuovoOrdine = {
       nomeCliente: 'Mario Rossi',
       telefono: '1234567890',
       prodotti: [{ nome: 'Pardulas', quantita: 1, prezzo: 15 }]
     };

     const createResponse = await request(server)
       .post('/api/ordini')
       .set('Authorization', `Bearer ${token}`)
       .send(nuovoOrdine);

     const ordineId = createResponse.body.ordine._id;

     const response = await request(server)
       .delete(`/api/ordini/${ordineId}`)
       .set('Authorization', `Bearer ${token}`);

     expect(response.status).toBe(200);
     expect(response.body.success).toBe(true);

     const getResponse = await request(server)
       .get(`/api/ordini/${ordineId}`)
       .set('Authorization', `Bearer ${token}`);

     expect(getResponse.status).toBe(404);
   });

   describe('Validazione Dati', () => {
     test('POST /api/ordini rifiuta ordine senza cliente', async () => {
       const ordineIncompleto = {
         telefono: '1234567890',
         prodotti: [{ nome: 'Pardulas', quantita: 1, prezzo: 15 }]
       };

       const response = await request(server)
         .post('/api/ordini')
         .set('Authorization', `Bearer ${token}`)
         .send(ordineIncompleto);

       expect(response.status).toBe(400);
       expect(response.body.success).toBe(false);
     });

     test('POST /api/ordini rifiuta ordine senza prodotti', async () => {
       const ordineIncompleto = {
         nomeCliente: 'Mario Rossi',
         telefono: '1234567890'
       };

       const response = await request(server)
         .post('/api/ordini')
         .set('Authorization', `Bearer ${token}`)
         .send(ordineIncompleto);

       expect(response.status).toBe(400);
       expect(response.body.success).toBe(false);
     });

     test('POST /api/ordini rifiuta quantità negative', async () => {
       const ordineInvalido = {
         nomeCliente: 'Mario Rossi',
         telefono: '1234567890',
         prodotti: [{ nome: 'Pardulas', quantita: -1, prezzo: 15 }]
       };

       const response = await request(server)
         .post('/api/ordini')
         .set('Authorization', `Bearer ${token}`)
         .send(ordineInvalido);

       expect(response.status).toBe(400);
       expect(response.body.success).toBe(false);
     });
   });

   describe('Funzionalità Avanzate', () => {
     test('GET /api/ordini/stats ritorna statistiche corrette', async () => {
       // Crea alcuni ordini prima
       const ordine1 = {
         nomeCliente: 'Mario Rossi',
         telefono: '1234567890',
         prodotti: [{ nome: 'Pardulas', quantita: 2, prezzo: 15 }]
       };

       const ordine2 = {
         nomeCliente: 'Luigi Verdi',
         telefono: '0987654321',
         prodotti: [{ nome: 'Pardulas', quantita: 3, prezzo: 15 }]
       };

       await request(server)
         .post('/api/ordini')
         .set('Authorization', `Bearer ${token}`)
         .send(ordine1);

       await request(server)
         .post('/api/ordini')
         .set('Authorization', `Bearer ${token}`)
         .send(ordine2);

       const response = await request(server)
         .get('/api/ordini/stats')
         .set('Authorization', `Bearer ${token}`);

       expect(response.status).toBe(200);
       expect(response.body).toHaveProperty('totaleOrdini', 2);
       expect(response.body).toHaveProperty('totaleValore', 75); // (2 * 15) + (3 * 15)
       expect(response.body).toHaveProperty('mediaValore', 37.5); // 75 / 2
     });
   });

   describe('Gestione Errori', () => {
     test('PUT /api/ordini/:id ritorna 404 per ID non esistente', async () => {
       const response = await request(server)
         .put('/api/ordini/123456789012')
         .set('Authorization', `Bearer ${token}`)
         .send({ nomeCliente: 'Mario Verdi' });

       expect(response.status).toBe(404);
     });

     test('DELETE /api/ordini/:id ritorna 404 per ID non esistente', async () => {
       const response = await request(server)
         .delete('/api/ordini/123456789012')
         .set('Authorization', `Bearer ${token}`);

       expect(response.status).toBe(404);
     });
   });
 });
});