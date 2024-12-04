// tests/dashboard/dashboard.test.js
import mongoose from 'mongoose';
import { Ordine } from '../../models/ordine.js';
import { calcolaStatistiche, getOrdiniGiornalieri, getTrendSettimanale } from '../../controllers/dashboardController.js';

describe('Test Dashboard', () => {
 beforeEach(async () => {
   await Ordine.deleteMany({});
 });

 test('statistiche giornaliere', async () => {
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

   const stats = await calcolaStatistiche();
   expect(stats.totaleOrdini).toBe(2);
   expect(stats.totaleValore).toBe(45); // (2 * 15) + (3 * 5)
   expect(stats.mediaOrdine).toBe(22.5);
 });

 test('trend settimanale', async () => {
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

   const trend = await getTrendSettimanale();
   expect(trend.length).toBe(7);
   expect(trend.find(t => t.data.toDateString() === oggi.toDateString()).totaleOrdini).toBe(1);
   expect(trend.find(t => t.data.toDateString() === ieri.toDateString()).totaleOrdini).toBe(1);
 });
});