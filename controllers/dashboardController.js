import Ordine from '../models/ordine.js';
import logger from '../config/logger.js';
import backupService from '../services/backupService.js';
import { calcolaUsoCPU, calcolaUsoMemoria, calcolaTempiRisposta, getStatisticheDB, calcolaStatoSistema } from '../utils/dashboardUtils.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';

export async function getDashboardData(req, res) {
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    // Statistiche generali
    const [
      ordiniOggi,
      ordiniInLavorazione,
      ordiniDaCompletare,
      ordiniCompletati,
      backupStats,
      sistemStats,
      statisticheAvanzate
    ] = await Promise.all([
      // Ordini di oggi
      Ordine.find({
        dataRitiro: {
          $gte: oggi,
          $lt: domani
        }
      }).sort({ oraRitiro: 1 }),

      // Ordini in lavorazione
      Ordine.find({ stato: 'in lavorazione' }),

      // Ordini da completare
      Ordine.find({ stato: 'da fare' }),

      // Ordini completati oggi
      Ordine.find({
        stato: 'completato',
        updatedAt: {
          $gte: oggi,
          $lt: domani
        }
      }),

      // Statistiche backup
      backupService.listBackups(),

      // Statistiche sistema
      Promise.all([
        calcolaUsoCPU(),
        calcolaUsoMemoria(),
        calcolaTempiRisposta(),
        getStatisticheDB()
      ]),

      // Statistiche avanzate
      Ordine.aggregate([
        {
          $facet: {
            prodottiPiuVenduti: [
              { $unwind: '$prodotti' },
              {
                $group: {
                  _id: '$prodotti.prodotto',
                  quantita: { $sum: '$prodotti.quantita' },
                  valore: { $sum: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] } }
                }
              },
              { $sort: { quantita: -1 } },
              { $limit: 10 }
            ],
            statisticheCategorie: [
              { $unwind: '$prodotti' },
              {
                $group: {
                  _id: '$prodotti.categoria',
                  totaleOrdini: { $sum: 1 },
                  mediaValore: { $avg: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] } },
                  tempoMedioProduzione: {
                    $avg: {
                      $cond: [
                        { $eq: ['$stato', 'completato'] },
                        { $subtract: ['$dataCompletamento', '$dataCreazione'] },
                        null
                      ]
                    }
                  }
                }
              }
            ],
            metriche24Ore: [
              {
                $match: {
                  dataCreazione: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
              },
              {
                $group: {
                  _id: { $hour: '$dataCreazione' },
                  ordini: { $sum: 1 },
                  valore: { $sum: '$totale' }
                }
              },
              { $sort: { '_id': 1 } }
            ]
          }
        }
      ])
    ]);

    // KPI principali
    const kpi = {
      produzione: {
        totaleOrdiniOggi: ordiniOggi.length,
        valoreOrdiniOggi: ordiniOggi.reduce((acc, ord) => acc + ord.totale, 0),
        ordiniInLavorazione: ordiniInLavorazione.length,
        ordiniDaCompletare: ordiniDaCompletare.length,
        ordiniCompletatiOggi: ordiniCompletati.length,
        ticketMedio: ordiniOggi.length > 0 
          ? ordiniOggi.reduce((acc, ord) => acc + ord.totale, 0) / ordiniOggi.length 
          : 0,
        percentualeCompletamento: ordiniOggi.length > 0
          ? (ordiniCompletati.length / ordiniOggi.length) * 100
          : 0
      },
      sistema: {
        cpu: sistemStats[0],
        memoria: sistemStats[1],
        prestazioni: {
          tempoRispostaDB: sistemStats[2].db,
          statisticheDB: sistemStats[3]
        }
      },
      backup: {
        totaleBackup: backupStats.length,
        ultimoBackup: backupStats[0]?.createdAt || null,
        dimensioneTotale: backupStats.reduce((acc, b) => acc + b.size, 0),
        backupUltimi7Giorni: backupStats.filter(b => 
          new Date(b.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      }
    };

    // Calcolo statistiche per categoria
    const ordiniPerCategoria = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: {
            $gte: oggi,
            $lt: domani
          }
        }
      },
      {
        $unwind: '$prodotti'
      },
      {
        $group: {
          _id: '$prodotti.categoria',
          quantitaTotale: { $sum: '$prodotti.quantita' },
          valoreTotale: { 
            $sum: { 
              $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] 
            }
          },
          numeroOrdini: { $sum: 1 }
        }
      },
      {
        $sort: { valoreTotale: -1 }
      }
    ]);

    // Ordini per ora
    const ordiniPerOra = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: {
            $gte: oggi,
            $lt: domani
          }
        }
      },
      {
        $group: {
          _id: '$oraRitiro',
          numeroOrdini: { $sum: 1 },
          valoreTotale: { $sum: '$totale' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Prossimi ordini da preparare
    const prossimiOrdini = await Ordine.find({
      dataRitiro: {
        $gte: oggi,
        $lt: domani
      },
      stato: 'da fare'
    })
    .sort({ oraRitiro: 1 })
    .limit(5);

    // Calcolo previsioni prossime ore
    const previsioniOggi = await getPrevisioniCaricoProssimeOre(6);

    res.json({
      success: true,
      data: {
        kpi,
        ordiniOggi,
        ordiniPerCategoria,
        ordiniPerOra,
        prossimiOrdini,
        previsioniOggi,
        statisticheAvanzate: statisticheAvanzate[0],
        statoSistema: calcolaStatoSistema(
          sistemStats[0],
          sistemStats[1],
          sistemStats[2]
        )
      }
    });

  } catch (error) {
    logger.error('Errore getDashboardData:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei dati dashboard'
    });
  }
}

export const getTrendSettimanale = async (req, res) => {
  try {
    const settimana = await Ordine.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totale: { $sum: "$totale" },
          numeroOrdini: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 7 }
    ]);
    
    res.json(settimana);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
    res.json({
      success: true,
      data: {
        trend,
        medie: {
          ordiniGiornalieri: trend.reduce((acc, t) => acc + t.numeroOrdini, 0) / trend.length,
          valoreGiornaliero: trend.reduce((acc, t) => acc + t.valoreTotale, 0) / trend.length,
          tassoCompletamentoMedio: trend.reduce((acc, t) => acc + t.tassoCompletamento, 0) / trend.length
        }
      }
    });

  } catch (error) {
    logger.error('Errore getTrendSettimanale:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del trend settimanale'
    });
  }
}

export async function getAlerts(req, res) {
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);
    const alerts = [];

    // Ordini in ritardo
    const ordiniInRitardo = await Ordine.find({
      dataRitiro: { $lt: oggi },
      stato: { $ne: 'completato' }
    });

    if (ordiniInRitardo.length > 0) {
      alerts.push({
        tipo: 'warning',
        messaggio: `Ci sono ${ordiniInRitardo.length} ordini in ritardo`,
        dettagli: ordiniInRitardo,
        categoria: 'ordini'
      });
    }

    // Ordini urgenti (prossime 2 ore)
    const oraCorrente = new Date();
    const traDelleOre = new Date(oraCorrente.getTime() + (2 * 60 * 60 * 1000));

    const ordiniUrgenti = await Ordine.find({
      dataRitiro: oggi,
      oraRitiro: {
        $gte: oraCorrente.toTimeString().slice(0, 5),
        $lte: traDelleOre.toTimeString().slice(0, 5)
      },
      stato: { $ne: 'completato' }
    });

    if (ordiniUrgenti.length > 0) {
      alerts.push({
        tipo: 'urgent',
        messaggio: `Ci sono ${ordiniUrgenti.length} ordini urgenti da completare`,
        dettagli: ordiniUrgenti,
        categoria: 'ordini'
      });
    }

    // Alert di sistema
    const [backups, sistemStats] = await Promise.all([
      backupService.listBackups(),
      Promise.all([
        calcolaUsoCPU(),
        calcolaUsoMemoria(),
        calcolaTempiRisposta()
      ])
    ]);

    // Alert backup
    const ultimoBackup = backups[0];
    if (!ultimoBackup || 
        new Date() - new Date(ultimoBackup.createdAt) > 24 * 60 * 60 * 1000) {
      alerts.push({
        tipo: 'warning',
        messaggio: 'Nessun backup nelle ultime 24 ore',
        categoria: 'backup'
      });
    }

    // Alert prestazioni sistema
    const statoSistema = calcolaStatoSistema(
      sistemStats[0],
      sistemStats[1],
      sistemStats[2]
    );

    if (statoSistema.stato !== 'ottimo') {
      alerts.push({
        tipo: statoSistema.stato === 'critico' ? 'critical' : 'warning',
        messaggio: `Performance sistema: ${statoSistema.stato}`,
        dettagli: statoSistema.dettagli,
        categoria: 'sistema'
      });
    }

    res.json({
      success: true,
      data: {
        alerts: alerts.sort((a, b) => {
          if (a.tipo === 'critical' && b.tipo !== 'critical') return -1;
          if (b.tipo === 'critical' && a.tipo !== 'critical') return 1;
          if (a.tipo === 'urgent' && b.tipo !== 'urgent') return -1;
          if (b.tipo === 'urgent' && a.tipo !== 'urgent') return 1;
          return 0;
        }),
        totaleAlerts: alerts.length,
        critici: alerts.filter(a => a.tipo === 'critical').length,
        urgenti: alerts.filter(a => a.tipo === 'urgent').length
      }
    });

  } catch (error) {
    logger.error('Errore getAlerts:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli alert'
    });
  }
}

// Funzione helper per previsioni carico
async function getPrevisioniCaricoProssimeOre(numOre) {
  const oraCorrente = new Date();
  const previsioni = [];

  for (let i = 1; i <= numOre; i++) {
    const oraPrevisione = new Date(oraCorrente);
    oraPrevisione.setHours(oraCorrente.getHours() + i);

    const mediaStorica = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          },
          oraRitiro: oraPrevisione.getHours().toString().padStart(2, '0') + ':00'
        }
      },
      {
        $group: {
          _id: null,
          mediaOrdini: { $avg: 1 },
          mediaValore: { $avg: '$totale' }
        }
      }
    ]);
previsioni.push({
      ora: oraPrevisione.getHours(),
      ordiniPrevisti: Math.round(mediaStorica[0]?.mediaOrdini || 0),
      valorePrevisto: Math.round(mediaStorica[0]?.mediaValore || 0)
    });
  }

  return previsioni;
}

export async function getReport(req, res) {
  try {
    const { tipo, formato, dataInizio, dataFine } = req.query;
    const datiReport = await generaDatiReport(tipo, dataInizio, dataFine);

    if (formato === 'excel') {
      const buffer = await generaExcel(datiReport, tipo);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=report-${tipo}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      return res.send(buffer);
    }

    if (formato === 'pdf') {
      const doc = await generaPDF(datiReport, tipo);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${tipo}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      doc.pipe(res);
      return;
    }

    res.json({
      success: true,
      data: datiReport
    });

  } catch (error) {
    logger.error('Errore getReport:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione del report'
    });
  }
}

// Esportiamo le funzioni principali
export {
  getDashboardData,
  getTrendSettimanale,
  getAlerts,
  getReport
};