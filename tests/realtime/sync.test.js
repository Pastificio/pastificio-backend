const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express');

describe('Test Sincronizzazione Dati', () => {
  let io, clientSocket, httpServer;
  const port = 3002;

  beforeAll((done) => {
    const app = express();
    httpServer = createServer(app);
    io = new Server(httpServer);
    httpServer.listen(port, () => {
      const clientOptions = {
        transports: ['websocket'],
        'force new connection': true,
        reconnection: false
      };
      clientSocket = Client(`http://localhost:${port}`, clientOptions);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    if (clientSocket) clientSocket.close();
    if (io) io.close();
    if (httpServer) httpServer.close();
  });

  describe('Sincronizzazione Ordini', () => {
    it('dovrebbe sincronizzare lista ordini', (done) => {
      const ordini = [
        { id: '1', stato: 'nuovo' },
        { id: '2', stato: 'in_lavorazione' }
      ];

      clientSocket.on('syncOrdini', (data) => {
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(2);
        expect(data[0].id).toBe('1');
        done();
      });

      io.emit('syncOrdini', ordini);
    });

    it('dovrebbe gestire conflitti di sincronizzazione', (done) => {
      const conflitto = {
        ordineId: '1',
        versioneClient: 1,
        versioneServer: 2
      };

      clientSocket.on('conflittoSincronizzazione', (data) => {
        expect(data.ordineId).toBe('1');
        expect(data.versioneServer).toBeGreaterThan(data.versioneClient);
        done();
      });

      io.emit('conflittoSincronizzazione', conflitto);
    });
  });

  describe('Gestione Offline', () => {
    it('dovrebbe accodare modifiche offline', (done) => {
      const modificaOffline = {
        tipo: 'update',
        ordineId: '1',
        modifiche: { stato: 'completato' },
        timestamp: new Date()
      };

      clientSocket.emit('modificaOffline', modificaOffline);
      
      io.on('modificaOffline', (data) => {
        expect(data.ordineId).toBe('1');
        expect(data.tipo).toBe('update');
        done();
      });
    });

    it('dovrebbe sincronizzare modifiche offline al riconnessione', (done) => {
      const modificheOffline = [
        { id: '1', tipo: 'update', modifiche: { stato: 'completato' } },
        { id: '2', tipo: 'create', dati: { /* ... */ } }
      ];

      clientSocket.emit('sincronizzaModificheOffline', modificheOffline);
      
      io.on('sincronizzaModificheOffline', (data) => {
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(2);
        done();
      });
    });
  });

  describe('Performance', () => {
    it('dovrebbe gestire grandi quantità di dati', (done) => {
      const ordini = Array(1000).fill().map((_, i) => ({
        id: i.toString(),
        stato: 'nuovo'
      }));

      const startTime = Date.now();
      
      clientSocket.on('syncMassivo', (data) => {
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(1000); // Max 1 secondo
        expect(data).toHaveLength(1000);
        done();
      });

      io.emit('syncMassivo', ordini);
    });
  });
});