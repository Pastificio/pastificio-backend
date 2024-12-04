// src/controllers/ordini.js
import Ordine from '../models/Ordine.js';
import { io } from '../server.js';
import logger from '../config/logger.js';

export async function getOrdini(req, res) {
  try {
    const { data, stato } = req.query;
    const query = {};
    
    if (data) query.dataRitiro = data;
    if (stato) query.stato = stato;

    const ordini = await Ordine.find(query)
      .sort({ dataRitiro: 1, oraRitiro: 1 });
    
    res.json(ordini);
  } catch (error) {
    logger.error('Errore in getOrdini:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createOrdine(req, res) {
  try {
    const ordine = new Ordine(req.body);
    await ordine.save();
    
    // Notifica real-time
    io.emit('nuovo-ordine', ordine);
    logger.info(`Nuovo ordine creato: ${ordine._id}`);
    
    res.status(201).json(ordine);
  } catch (error) {
    logger.error('Errore in createOrdine:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function updateOrdine(req, res) {
  try {
    const { id } = req.params;
    const ordine = await Ordine.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ordine) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    // Notifica real-time
    io.emit('ordine-aggiornato', ordine);
    logger.info(`Ordine aggiornato: ${ordine._id}`);
    
    res.json(ordine);
  } catch (error) {
    logger.error('Errore in updateOrdine:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function deleteOrdine(req, res) {
  try {
    const { id } = req.params;
    const ordine = await Ordine.findByIdAndDelete(id);
    
    if (!ordine) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    // Notifica real-time
    io.emit('ordine-eliminato', id);
    logger.info(`Ordine eliminato: ${id}`);
    
    res.json({ message: 'Ordine eliminato con successo' });
  } catch (error) {
    logger.error('Errore in deleteOrdine:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function getStatistiche(req, res) {
  try {
    const { dataInizio, dataFine } = req.query;
    const query = {};
    
    if (dataInizio && dataFine) {
      query.dataRitiro = {
        $gte: dataInizio,
        $lte: dataFine
      };
    }
    
    const ordini = await Ordine.find(query);
    const statistiche = {
      totaleOrdini: ordini.length,
      totaleValore: ordini.reduce((sum, ordine) => {
        return sum + ordine.prodotti.reduce((total, p) => total + p.prezzo, 0);
      }, 0),
      perCategoria: {},
      perStato: {
        'da fare': 0,
        'in lavorazione': 0,
        'completato': 0
      }
    };
    
    // Calcola statistiche per categoria
    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prod => {
        if (!statistiche.perCategoria[prod.categoria]) {
          statistiche.perCategoria[prod.categoria] = {
            quantita: 0,
            valore: 0
          };
        }
        statistiche.perCategoria[prod.categoria].quantita += prod.quantita;
        statistiche.perCategoria[prod.categoria].valore += prod.prezzo;
      });
      statistiche.perStato[ordine.stato]++;
    });
    
    res.json(statistiche);
  } catch (error) {
    logger.error('Errore in getStatistiche:', error);
    res.status(500).json({ error: error.message });
  }
}