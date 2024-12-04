// utils/notifiche.js
import { Server } from 'socket.io';
import { logger } from '../config/logger.js';

export let io;

export const initializeSocketIO = (server) => {
  io = new Server(server);
  
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Autenticazione richiesta'));
      }
      // Qui puoi aggiungere la verifica del token se necessario
      next();
    } catch (error) {
      logger.error('Errore autenticazione socket:', error);
      next(new Error('Errore di autenticazione'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connesso: ${socket.id}`);
    
    socket.on('disconnect', () => {
      logger.info(`Client disconnesso: ${socket.id}`);
    });
  });

  return io;
};

export const notificaNuovoOrdine = (ordine) => {
  if (io) {
    io.emit('nuovoOrdine', { ordine });
  }
};

export const notificaOrdineAggiornato = (ordine) => {
  if (io) {
    io.emit('ordineAggiornato', { ordine });
  }
};