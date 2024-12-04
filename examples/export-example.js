// examples/export-example.js
import ExportManager from '../utils/export-manager.js';
import logger from '../config/logger.js';

// Esempio di export PDF
async function exportToPdf(ordini) {
  try {
    const pdfPath = await ExportManager.exportToPdf(ordini, {
      title: 'Riepilogo Ordini',
      showTotals: true,
      groupByDate: true
    });
    logger.info(`PDF creato: ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    logger.error('Errore export PDF:', error);
  }
}

// Esempio di export Excel
async function exportToExcel(ordini, period) {
  try {
    const excelPath = await ExportManager.exportToExcel(ordini, {
      sheetName: `Ordini ${period}`,
      includeStats: true
    });
    logger.info(`Excel creato: ${excelPath}`);
    return excelPath;
  } catch (error) {
    logger.error('Errore export Excel:', error);
  }
}