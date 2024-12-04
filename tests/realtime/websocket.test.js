// tests/realtime/websocket.test.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { Ordine } from '../../models/ordine.js';
import { setupWebSocket } from '../../websocket.js';

describe('WebSocket Tests', () => {
 let io, serverSocket, clientSocket, httpServer;

 beforeAll((done) => {
   httpServer = createServer();
   io = new Server(httpServer);
   setupWebSocket(io);
   
   httpServer.listen(() => {
     const port = httpServer.address().port;
     clientSocket = Client(`http://localhost:${port}`);
     io.on('connection', (socket) => {
       serverSocket = socket;
     });
     clientSocket.on('connect', done);
   });
 });

 afterAll(() => {
   io.close();
   clientSocket.close();
   httpServer.close();
 });

 test('notifica nuovo ordine', (done) => {
   clientSocket.on('nuovoOrdine', (data) => {
     expect(data.ordine.nomeCliente).toBe('Test Cliente');
     expect(data.ordine.totaleOrdine).toBe(30);
     done();
   });

   const ordine = new Ordine({
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

   ordine.save().then((ordineCreato) => {
     io.emit('nuovoOrdine', { ordine: ordineCreato });
   });
 });

 test('notifica aggiornamento ordine', (done) => {
   clientSocket.on('ordineAggiornato', (data) => {
     expect(data.ordine.stato).toBe('in_lavorazione');
     done();
   });

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

   ordine.save()
     .then(async (ordineCreato) => {
       await ordineCreato.cambiaStato('in_lavorazione');
       io.emit('ordineAggiornato', { ordine: ordineCreato });
     });
 });

 test('sottoscrizione a stanza ordine', (done) => {
   Ordine.create({
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
   }).then(ordine => {
     const room = `ordine_${ordine._id}`;
     clientSocket.emit('join', { room });

     clientSocket.on('joined', (data) => {
       expect(data.room).toBe(room);
       done();
     });
   });
 });
});