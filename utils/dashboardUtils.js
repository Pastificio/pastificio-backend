import os from 'os';
import mongoose from 'mongoose';
import logger from '../config/logger.js';

// Calcolo previsioni basate sui dati storici
export const calcolaPrevisioni = (statisticheGiornaliere) => {
  try {
    const oggi = new Date();
    const previsioni = [];

    // Calcola previsioni per i prossimi 7 giorni
    for (let i = 1; i <= 7; i++) {
      const data = new Date(oggi);
      data.setDate(data.getDate() + i);
      
      // Trova statistiche per il giorno della settimana corrente
      const statisticheGiorno = statisticheGiornaliere.find(
        stat => stat._id.giorno === data.getDay() + 1 && 
               stat._id.mese === data.getMonth() + 1
      );

      if (statisticheGiorno) {
        previsioni.push({
          data: data.toISOString().split('T')[0],
          previsione: {
            ordiniPrevisti: Math.round(statisticheGiorno.mediaOrdini),
            valorePrevisto: Math.round(statisticheGiorno.mediaValore),
            prodottiPrevisti: Math.round(statisticheGiorno.prodottiMedi),
            affidabilita: calcolaAffidabilita(statisticheGiorno)
          }
        });
      }
    }

    return previsioni;
  } catch (error) {
    logger.error('Errore nel calcolo previsioni:', error);
    throw error;
  }
};

// Calcolo affidabilità previsioni
const calcolaAffidabilita = (statistiche) => {
  // Più dati abbiamo, più affidabile è la previsione
  const numeroOsservazioni = statistiche.count || 1;
  const varianza = statistiche.varianza || 0;
  
  // Calcola un punteggio da 0 a 1
  let affidabilita = Math.min(numeroOsservazioni / 10, 1); // Max dopo 10 osservazioni
  affidabilita *= (1 - Math.min(varianza / 100, 0.5)); // Riduce in base alla varianza
  
  return Math.round(affidabilita * 100);
};

// Monitoraggio risorse sistema
export const calcolaUsoCPU = async () => {
  try {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      percentualeUso: Math.round((1 - totalIdle / totalTick) * 100),
      numCPU: cpus.length,
      modello: cpus[0].model,
      velocita: cpus[0].speed
    };
  } catch (error) {
    logger.error('Errore nel calcolo uso CPU:', error);
    throw error;
  }
};

// Monitoraggio memoria
export const calcolaUsoMemoria = () => {
  try {
    const totale = os.totalmem();
    const libera = os.freemem();
    const usata = totale - libera;

    return {
      totale: totale,
      usata: usata,
      libera: libera,
      percentualeUso: Math.round((usata / totale) * 100)
    };
  } catch (error) {
    logger.error('Errore nel calcolo uso memoria:', error);
    throw error;
  }
};

// Monitoraggio tempi risposta DB
export const calcolaTempiRisposta = async () => {
  try {
    const inizio = Date.now();
    await mongoose.connection.db.admin().ping();
    const tempoRisposta = Date.now() - inizio;

    return {
      db: tempoRisposta,
      stato: tempoRisposta < 100 ? 'ottimo' : 
             tempoRisposta < 300 ? 'buono' : 'degradato'
    };
  } catch (error) {
    logger.error('Errore nel calcolo tempi risposta:', error);
    throw error;
  }
};

// Statistiche MongoDB
export const getStatisticheDB = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      numeroDocumenti: stats.objects,
      dimensioneDB: stats.dataSize,
      numeroConnessioni: stats.connections,
      operazioniAttive: stats.currentOp
    };
  } catch (error) {
    logger.error('Errore nel recupero statistiche DB:', error);
    throw error;
  }
};

// Valutazione stato sistema
export const calcolaStatoSistema = (usoCPU, usoMemoria, tempiRisposta) => {
  const punteggi = {
    cpu: usoCPU.percentualeUso < 70 ? 2 : usoCPU.percentualeUso < 85 ? 1 : 0,
    memoria: usoMemoria.percentualeUso < 80 ? 2 : usoMemoria.percentualeUso < 90 ? 1 : 0,
    db: tempiRisposta.db < 100 ? 2 : tempiRisposta.db < 300 ? 1 : 0
  };

  const punteggioTotale = Object.values(punteggi).reduce((a, b) => a + b, 0);

  return {
    stato: punteggioTotale >= 5 ? 'ottimo' :
           punteggioTotale >= 3 ? 'buono' :
           punteggioTotale >= 1 ? 'degradato' : 'critico',
    punteggio: punteggioTotale,
    dettagli: punteggi
  };
};