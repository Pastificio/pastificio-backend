// tests/integration/dashboard.integration.test.js
import request from 'supertest';
import { app } from '../../server.js';
import { Ordine } from '../../models/ordine.js';

describe('Test Integrazione Dashboard', () => {
 beforeEach(async () => {
   await Ordine.deleteMany({});
 });

 test('GET /api/dashboard/statistiche', async () => {
   await Ordine.create([
     {
       nomeCliente: 'Cliente 1',
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
     },
     {
       nomeCliente: 'Cliente 2',
       telefono: '0987654321',
       dataRitiro: new Date(),
       oraRitiro: '11:00',
       prodotti: [{
         categoria: 'dolci',
         prodotto: 'Seadas',
         quantita: 3,
         unitaMisura: 'unità',
         prezzo: 5
       }]
     }
   ]);

   const response = await request(app).get('/api/dashboard/statistiche');
   
   expect(response.status).toBe(200);
   expect(response.body.totaleOrdini).toBe(2);
   expect(response.body.totaleValore).toBe(45);
   expect(response.body.mediaOrdine).toBe(22.5);
 });

 test('GET /api/dashboard/trend', async () => {
   const oggi = new Date();
   const ieri = new Date(oggi);
   ieri.setDate(ieri.getDate() - 1);

   await Ordine.create([
     {
       nomeCliente: 'Cliente 1',
       telefono: '1234567890',
       dataRitiro: oggi,
       oraRitiro: '10:00',
       prodotti: [{
         categoria: 'pasta',
         prodotto: 'Culurgiones',
         quantita: 2,
         unitaMisura: 'kg',
         prezzo: 15
       }]
     },
     {
       nomeCliente: 'Cliente 2',
       telefono: '0987654321',
       dataRitiro: ieri,
       oraRitiro: '11:00',
       prodotti: [{
         categoria: 'dolci',
         prodotto: 'Seadas',
         quantita: 3,
         unitaMisura: 'unità',
         prezzo: 5
       }]
     }
   ]);

   const response = await request(app).get('/api/dashboard/trend');
   
   expect(response.status).toBe(200);
   expect(response.body.length).toBe(7);
   expect(response.body.find(t => new Date(t.data).toDateString() === oggi.toDateString()).totaleOrdini).toBe(1);
 });
});