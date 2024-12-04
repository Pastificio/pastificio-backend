import PDFDocument from 'pdfkit-table';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';  // Questa è la sintassi corretta

export const exportUtils = {
  formatDate: (date) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: it });
  },

  async generateExcel(ordini) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ordini');
    
    worksheet.columns = [
      { header: 'Data Ritiro', key: 'dataRitiro', width: 15 },
      { header: 'Cliente', key: 'nomeCliente', width: 20 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'Prodotti', key: 'prodotti', width: 30 },
      { header: 'Totale', key: 'totale', width: 10 },
      { header: 'Note', key: 'note', width: 20 }
    ];

    ordini.forEach(ordine => {
      worksheet.addRow({
        dataRitiro: this.formatDate(ordine.dataRitiro),
        nomeCliente: ordine.nomeCliente,
        telefono: ordine.telefono,
        prodotti: Object.entries(ordine.prodottiSelezionati)
          .map(([categoria, prodotti]) => 
            Object.entries(prodotti)
              .map(([nome, quantita]) => `${nome}: ${quantita}`)
              .join(', ')
          ).join('; '),
        totale: ordine.totale,
        note: ordine.note
      });
    });

    return await workbook.xlsx.writeBuffer();
  },

  async generatePDF(ordini) {
    const doc = new PDFDocument();
    const table = {
      title: "Resoconto Ordini",
      headers: ["Data Ritiro", "Cliente", "Telefono", "Prodotti", "Totale", "Note"],
      rows: ordini.map(ordine => [
        this.formatDate(ordine.dataRitiro),
        ordine.nomeCliente,
        ordine.telefono,
        Object.entries(ordine.prodottiSelezionati)
          .map(([categoria, prodotti]) => 
            Object.entries(prodotti)
              .map(([nome, quantita]) => `${nome}: ${quantita}`)
              .join(', ')
          ).join('; '),
        ordine.totale.toString(),
        ordine.note || ''
      ])
    };

    await doc.table(table, {
      width: 500,
      prepareHeader: () => doc.font('Helvetica-Bold'),
      prepareRow: () => doc.font('Helvetica')
    });

    return doc;
  }
};