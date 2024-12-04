import { AppError } from './errorHandler.js';

export const validateOrdine = (req, res, next) => {
  const { nomeCliente, telefono, dataRitiro, oraRitiro, prodotti } = req.body;

  if (!nomeCliente || !telefono || !dataRitiro || !oraRitiro) {
    throw new AppError('Campi obbligatori mancanti', 400);
  }

  if (!Array.isArray(prodotti) || prodotti.length === 0) {
    throw new AppError('Lista prodotti non valida', 400);
  }

  for (const prodotto of prodotti) {
    if (!prodotto.nome || !prodotto.quantita || !prodotto.prezzo || !prodotto.unita) {
      throw new AppError('Dati prodotto incompleti', 400);
    }
  }

  if (!/^\d{10}$/.test(telefono.replace(/\s/g, ''))) {
    throw new AppError('Numero di telefono non valido', 400);
  }

  next();
};