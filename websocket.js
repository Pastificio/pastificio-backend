const logger = require('./config/logger');

module.exports = (io) => {
  // Mantieni traccia delle connessioni attive
  const activeConnections = new Map();

  io.on('connection', (socket) => {
    logger.info(`Client connesso: ${socket.id}`);
    const userId = socket.user.id;
    
    // Salva la connessione
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId).add(socket.id);

    // Unisciti alla room generale
    socket.join('ordini');

    // Gestione eventi ordini
    socket.on('joinOrdine', (ordineId) => {
      socket.join(`ordine:${ordineId}`);
      logger.info(`Client ${socket.id} si è unito a ordine:${ordineId}`);
    });

    socket.on('leaveOrdine', (ordineId) => {
      socket.leave(`ordine:${ordineId}`);
      logger.info(`Client ${socket.id} ha lasciato ordine:${ordineId}`);
    });

    // Eventi di presenza
    socket.on('setStatus', async (status) => {
      try {
        await socket.broadcast.emit('userStatus', {
          userId: socket.user.id,
          status
        });
      } catch (err) {
        logger.error('Errore setStatus:', err);
      }
    });

    // Gestione disconnessione
    socket.on('disconnect', () => {
      logger.info(`Client disconnesso: ${socket.id}`);
      const userConnections = activeConnections.get(userId);
      if (userConnections) {
        userConnections.delete(socket.id);
        if (userConnections.size === 0) {
          activeConnections.delete(userId);
          io.emit('userStatus', {
            userId,
            status: 'offline'
          });
        }
      }
    });
  });

  // Funzioni helper per emettere eventi
  return {
    emitNuovoOrdine: (ordine) => {
      io.to('ordini').emit('nuovoOrdine', ordine);
      logger.info(`Evento nuovoOrdine emesso per ordine ${ordine._id}`);
    },

    emitOrdineAggiornato: (ordine) => {
      io.to(`ordine:${ordine._id}`).emit('ordineAggiornato', ordine);
      io.to('ordini').emit('listaOrdiniAggiornata');
      logger.info(`Evento ordineAggiornato emesso per ordine ${ordine._id}`);
    },

    emitOrdineEliminato: (ordineId) => {
      io.to(`ordine:${ordineId}`).emit('ordineEliminato', ordineId);
      io.to('ordini').emit('listaOrdiniAggiornata');
      logger.info(`Evento ordineEliminato emesso per ordine ${ordineId}`);
    },

    emitNotifica: (userId, tipo, messaggio) => {
      const userConnections = activeConnections.get(userId);
      if (userConnections) {
        userConnections.forEach(socketId => {
          io.to(socketId).emit('notifica', { tipo, messaggio });
        });
        logger.info(`Notifica inviata a utente ${userId}`);
      }
    }
  };
};