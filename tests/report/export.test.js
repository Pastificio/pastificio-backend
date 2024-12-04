const { exportUtils } = require('../../utils/exportUtils');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');

describe('Export Utilities', () => {
  const testData = {
    giornaliero: {
      totaleOrdini: 10,
      totaleIncasso: 150,
      ordiniCompletati: 8,
      percentualeCompletamento: 80
    },
    prodotti: [
      {
        _id: { prodotto: 'Pasta', categoria: 'pasta' },
        quantitaTotale: 25,
        incassoTotale: 250
      }
    ]
  };

  describe('Excel Export', () => {
    it('dovrebbe creare un file Excel valido', async () => {
      const buffer = await exportUtils.toExcel(testData.giornaliero, 'giornaliero');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      expect(workbook.worksheets.length).toBe(1);
      const worksheet = workbook.worksheets[0];
      expect(worksheet.rowCount).toBeGreaterThan(1); // Header + data
    });

    it('dovrebbe formattare correttamente i numeri', async () => {
      const buffer = await exportUtils.toExcel(testData.giornaliero, 'giornaliero');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      const cell = worksheet.getCell('C2'); // Totale Incasso
      expect(cell.numFmt).toBe('€#,##0.00');
    });
  });

  describe('PDF Export', () => {
    it('dovrebbe creare un file PDF valido', async () => {
      const buffer = await exportUtils.toPDF(testData.giornaliero, 'giornaliero');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.slice(0, 4).toString()).toBe('%PDF'); // PDF header
    });
  });
});