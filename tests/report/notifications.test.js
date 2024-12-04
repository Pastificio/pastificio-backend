const mongoose = require('mongoose');
const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');

describe('Real-time Notifications', () => {
  let httpServer;
  let ioServer;
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    const app = express();
    httpServer = createServer(app);
    ioServer = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = io(`http://localhost:${port}`);
      ioServer.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    ioServer.close();
    clientSocket.close();
    httpServer.close();
  });

  it('dovrebbe notificare nuovo ordine in tempo reale', (done) => {
    clientSocket.on('nuovoOrdine', (data) => {
      expect(data).toHaveProperty('ordine');
      expect(data.ordine).toHaveProperty('nomeCliente');
      done();
    });

    // Simula un nuovo ordine
    serverSocket.emit('nuovoOrdine', {
      ordine: {
        nomeCliente: 'Test Cliente',
        totale: 50
      }
    });
  });

  it('dovrebbe notificare aggiornamento stato ordine', (done) => {
    clientSocket.on('statoOrdineAggiornato', (data) => {
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('nuovoStato');
      done();
    });

    serverSocket.emit('statoOrdineAggiornato', {
      id: 'test123',
      nuovoStato: 'completato'
    });
  });
});