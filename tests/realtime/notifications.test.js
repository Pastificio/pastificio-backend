// tests/realtime/notifications.test.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { Ordine } from '../../models/ordine.js';

describe('Test Notifiche', () => {
  let io, serverSocket, clientSocket, httpServer;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    
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

  test('notifica stato ordine', (done) => {
    clientSocket.on('cambioStato', (data) => {
      expect(data.ordine.stato).toBe('in_lavorazione');
      expect(data.messaggio).toBe('Ordine in lavorazione');
      done();
    });

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
    }).then(async (ordine) => {
      await ordine.cambiaStato('in_lavorazione');
      io.emit('cambioStato', {
        ordine,
        messaggio: 'Ordine in lavorazione'
      });
    });
  });

  test('notifiche multiple ordini', async () => {
    const notifiche = [];
    
    clientSocket.on('nuovoOrdine', (data) => {
      notifiche.push(data);
    });

    await Ordine.create([
      {
        nomeCliente: 'Cliente 1',
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
      },
      {
        nomeCliente: 'Cliente 2',
        telefono: '0987654321',
        dataRitiro: new Date(),
        oraRitiro: '11:00',
        prodotti: [{
          categoria: 'dolci',
          prodotto: 'Seadas',
          quantita: 2,
          unitaMisura: 'unità',
          prezzo: 5
        }]
      }
    ]);

    expect(notifiche.length).toBe(2);
  });
});