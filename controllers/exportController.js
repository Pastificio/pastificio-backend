import ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import { create as createPDF } from 'pdfkit';
import { promises as fs } from 'fs';

export const exportController = {
  async toExcel(req, res) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ordini');
      
      // Intestazioni
      worksheet.columns = [
        { header: 'Data Ritiro', key: 'dataRitiro' },
        { header: 'Cliente', key: 'nomeCliente' },
        { header: 'Telefono', key: 'telefono' },
        { header: 'Prodotti', key: 'prodotti' },
        { header: 'Totale', key: 'totale' },
        { header: 'Note', key: 'note' }
      ];

      // Recupera ordini dal database
      const ordini = await Ordine.find(req.query);

      // Aggiunge righe
      ordini.forEach(ordine => {
        worksheet.addRow({
          dataRitiro: ordine.dataRitiro,
          nomeCliente: ordine.nomeCliente,
          telefono: ordine.telefono,
          prodotti: ordine.prodotti.map(p => `${p.nome} x${p.quantita}`).join(', '),
          totale: ordine.totale,
          note: ordine.note
        });
      });

      // Styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=ordini.xlsx');

      await workbook.xlsx.write(res);
    } catch (error) {
      console.error('Errore export Excel:', error);
      res.status(500).json({ error: 'Errore durante l\'export in Excel' });
    }
  },

  async toCSV(req, res) {
    try {
      const csvWriter = createCsvWriter({
        path: 'temp/ordini.csv',
        header: [
          { id: 'dataRitiro', title: 'Data Ritiro' },
          { id: 'nomeCliente', title: 'Cliente' },
          { id: 'telefono', title: 'Telefono' },
          { id: 'prodotti', title: 'Prodotti' },
          { id: 'totale', title: 'Totale' },
          { id: 'note', title: 'Note' }
        ]
      });

      const ordini = await Ordine.find(req.query);
      
      const records = ordini.map(ordine => ({
        dataRitiro: ordine.dataRitiro,
        nomeCliente: ordine.nomeCliente,
        telefono: ordine.telefono,
        prodotti: ordine.prodotti.map(p => `${p.nome} x${p.quantita}`).join(', '),
        totale: ordine.totale,
        note: ordine.note
      }));

      await csvWriter.writeRecords(records);
      
      res.download('temp/ordini.csv', 'ordini.csv', (err) => {
        if (err) {
          console.error('Errore download CSV:', err);
          res.status(500).json({ error: 'Errore durante il download del CSV' });
        }
        fs.unlink('temp/ordini.csv').catch(console.error);
      });
    } catch (error) {
      console.error('Errore export CSV:', error);
      res.status(500).json({ error: 'Errore durante l\'export in CSV' });
    }
  },

  async toPDF(req, res) {
    try {
      const doc = new createPDF();
      const ordini = await Ordine.find(req.query);

      doc.pipe(res);
      
      // Header
      doc.fontSize(16).text('Riepilogo Ordini', { align: 'center' });
      doc.moveDown();

      // Contenuto
      ordini.forEach(ordine => {
        doc.fontSize(12).text(`Cliente: ${ordine.nomeCliente}`);
        doc.fontSize(10)
           .text(`Data ritiro: ${ordine.dataRitiro}`)
           .text(`Telefono: ${ordine.telefono}`)
           .text('Prodotti:')
           .text(ordine.prodotti.map(p => `  - ${p.nome} x${p.quantita}`).join('\n'))
           .text(`Totale: €${ordine.totale}`)
           .text(`Note: ${ordine.note}`);
        doc.moveDown();
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=ordini.pdf');

      doc.end();
    } catch (error) {
      console.error('Errore export PDF:', error);
      res.status(500).json({ error: 'Errore durante l\'export in PDF' });
    }
  }
};