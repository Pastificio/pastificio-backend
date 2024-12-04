// tests/notifiche.test.js
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';
import { createTestOrdine } from './helpers';

describe('Test Notifiche', () => {
  let io, serverSocket, clientSocket, httpServer;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
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
      expect(data.ordine).toBeDefined();
      expect(data.ordine.nomeCliente).toBe('Test Cliente');
      done();
    });

    createTestOrdine().then(ordine => {
      serverSocket.emit('nuovoOrdine', { ordine });
    });
  });
});