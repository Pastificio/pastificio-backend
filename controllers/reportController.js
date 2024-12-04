import { Ordine } from '../models/ordine.js';

export const reportController = {
  // Report giornaliero
  async getReportGiornaliero(data = new Date()) {
    const inizio = new Date(data.setHours(0, 0, 0, 0));
    const fine = new Date(data.setHours(23, 59, 59, 999));

    const report = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: { $gte: inizio, $lte: fine }
        }
      },
      {
        $group: {
          _id: null,
          totaleOrdini: { $sum: 1 },
          totaleIncasso: { $sum: '$totale' },
          ordiniCompletati: {
            $sum: { $cond: [{ $eq: ['$stato', 'completato'] }, 1, 0] }
          },
          // Statistiche per categoria
          perCategoria: {
            $push: {
              prodotti: '$prodotti'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totaleOrdini: 1,
          totaleIncasso: 1,
          ordiniCompletati: 1,
          percentualeCompletamento: {
            $multiply: [
              { $divide: ['$ordiniCompletati', '$totaleOrdini'] },
              100
            ]
          }
        }
      }
    ]);

    return report[0] || {
      totaleOrdini: 0,
      totaleIncasso: 0,
      ordiniCompletati: 0,
      percentualeCompletamento: 0
    };
  },

  // Report settimanale
  async getReportSettimanale(data = new Date()) {
    const inizioSettimana = new Date(data);
    inizioSettimana.setDate(data.getDate() - data.getDay());
    inizioSettimana.setHours(0, 0, 0, 0);

    const fineSettimana = new Date(inizioSettimana);
    fineSettimana.setDate(fineSettimana.getDate() + 6);
    fineSettimana.setHours(23, 59, 59, 999);

    return await Ordine.aggregate([
      {
        $match: {
          dataRitiro: { $gte: inizioSettimana, $lte: fineSettimana }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$dataRitiro' },
          totaleOrdini: { $sum: 1 },
          totaleIncasso: { $sum: '$totale' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
  },

  // Report mensile con trend
  async getReportMensile(anno, mese) {
    const inizioMese = new Date(anno, mese - 1, 1);
    const fineMese = new Date(anno, mese, 0);

    const report = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: { $gte: inizioMese, $lte: fineMese }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$dataRitiro' },
          totaleOrdini: { $sum: 1 },
          totaleIncasso: { $sum: '$totale' },
          prodottiVenduti: {
            $push: {
              prodotti: '$prodotti'
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Calcolo trend rispetto al mese precedente
    const mesePrecedente = new Date(anno, mese - 2, 1);
    const fineMesePrecedente = new Date(anno, mese - 1, 0);
    
    const statsMesePrecedente = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: { $gte: mesePrecedente, $lte: fineMesePrecedente }
        }
      },
      {
        $group: {
          _id: null,
          totaleIncasso: { $sum: '$totale' },
          totaleOrdini: { $sum: 1 }
        }
      }
    ]);

    return {
      datiGiornalieri: report,
      riepilogoMese: {
        totaleOrdini: report.reduce((acc, day) => acc + day.totaleOrdini, 0),
        totaleIncasso: report.reduce((acc, day) => acc + day.totaleIncasso, 0),
        trend: {
          ordini: ((report.reduce((acc, day) => acc + day.totaleOrdini, 0) / 
                   (statsMesePrecedente[0]?.totaleOrdini || 1)) - 1) * 100,
          incasso: ((report.reduce((acc, day) => acc + day.totaleIncasso, 0) / 
                    (statsMesePrecedente[0]?.totaleIncasso || 1)) - 1) * 100
        }
      }
    };
  },

  // Analisi prodotti più venduti
  async getProdottiPiuVenduti(periodo = 30) {
    const dataInizio = new Date();
    dataInizio.setDate(dataInizio.getDate() - periodo);

    return await Ordine.aggregate([
      {
        $match: {
          dataRitiro: { $gte: dataInizio }
        }
      },
      {
        $unwind: '$prodotti'
      },
      {
        $group: {
          _id: {
            prodotto: '$prodotti.prodotto',
            categoria: '$prodotti.categoria'
          },
          quantitaTotale: { $sum: '$prodotti.quantita' },
          incassoTotale: { 
            $sum: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] }
          }
        }
      },
      {
        $sort: { quantitaTotale: -1 }
      }
    ]);
  }
};