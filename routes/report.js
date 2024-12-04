import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { exportUtils } from '../utils/exportUtils.js';
import { format } from 'date-fns';

const router = express.Router();

// Protezione delle route con autenticazione
router.use(protect);

// Report giornaliero
router.get('/giornaliero', async (req, res) => {
  try {
    const data = req.query.data ? new Date(req.query.data) : new Date();
    const report = await reportController.getReportGiornaliero(data);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Report settimanale
router.get('/settimanale', async (req, res) => {
  try {
    const data = req.query.data ? new Date(req.query.data) : new Date();
    const report = await reportController.getReportSettimanale(data);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Report mensile
router.get('/mensile/:anno/:mese', async (req, res) => {
  try {
    const report = await reportController.getReportMensile(
      parseInt(req.params.anno),
      parseInt(req.params.mese)
    );
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Prodotti più venduti
router.get('/prodotti-top', async (req, res) => {
  try {
    const periodo = req.query.periodo ? parseInt(req.query.periodo) : 30;
    const report = await reportController.getProdottiPiuVenduti(periodo);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Report per categoria
router.get('/categorie', async (req, res) => {
  try {
    const dataInizio = req.query.dataInizio ? new Date(req.query.dataInizio) : new Date();
    dataInizio.setDate(dataInizio.getDate() - 30); // Default ultimi 30 giorni
    const dataFine = req.query.dataFine ? new Date(req.query.dataFine) : new Date();

    const report = await reportController.getReportPerCategoria(dataInizio, dataFine);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export in Excel
router.get('/export/excel/:tipo', async (req, res) => {
  try {
    let data;
    switch (req.params.tipo) {
      case 'giornaliero':
        data = await reportController.getReportGiornaliero();
        break;
      case 'settimanale':
        data = await reportController.getReportSettimanale();
        break;
      case 'prodotti':
        data = await reportController.getProdottiPiuVenduti();
        break;
      case 'categorie':
        const dataInizio = new Date();
        dataInizio.setDate(dataInizio.getDate() - 30);
        data = await reportController.getReportPerCategoria(dataInizio, new Date());
        break;
      default:
        throw new Error('Tipo report non valido');
    }

    const buffer = await exportUtils.toExcel(data, req.params.tipo);
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report_${req.params.tipo}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    );
    
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export in PDF
router.get('/export/pdf/:tipo', async (req, res) => {
  try {
    let data;
    switch (req.params.tipo) {
      case 'giornaliero':
        data = await reportController.getReportGiornaliero();
        break;
      case 'settimanale':
        data = await reportController.getReportSettimanale();
        break;
      case 'prodotti':
        data = await reportController.getProdottiPiuVenduti();
        break;
      case 'categorie':
        const dataInizio = new Date();
        dataInizio.setDate(dataInizio.getDate() - 30);
        data = await reportController.getReportPerCategoria(dataInizio, new Date());
        break;
      default:
        throw new Error('Tipo report non valido');
    }

    const buffer = await exportUtils.toPDF(data, req.params.tipo);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report_${req.params.tipo}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    );
    
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Report personalizzato
router.post('/personalizzato', async (req, res) => {
  try {
    const {
      dataInizio,
      dataFine,
      categorie,
      raggruppamento, // 'giorno', 'settimana', 'mese'
      ordinamento,    // 'data', 'totale', 'quantita'
      formato        // 'json', 'excel', 'pdf'
    } = req.body;

    const report = await reportController.getReportPersonalizzato({
      dataInizio: new Date(dataInizio),
      dataFine: new Date(dataFine),
      categorie: categorie || [],
      raggruppamento,
      ordinamento
    });

    if (formato === 'excel') {
      const buffer = await exportUtils.toExcel(report, 'personalizzato');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=report_personalizzato_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      );
      return res.send(buffer);
    }

    if (formato === 'pdf') {
      const buffer = await exportUtils.toPDF(report, 'personalizzato');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=report_personalizzato_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );
      return res.send(buffer);
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Statistiche avanzate
router.get('/statistiche', async (req, res) => {
  try {
    const stats = await reportController.getStatisticheAvanzate();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;