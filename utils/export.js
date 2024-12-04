// utils/export.js
import PdfDocument from 'pdfkit-table';
import xlsx from 'xlsx';

export const generatePDF = async (data) => {
  try {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PdfDocument({ margin: 30, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Intestazione
        doc.fontSize(20).text('Report Statistiche Ordini', { align: 'center' });
        doc.moveDown();

        // Statistiche generali
        doc.fontSize(16).text('Statistiche Generali');
        doc.fontSize(12);
        const generale = data.generale[0] || {};
        doc.text(`Totale Ordini: ${generale.totaleOrdini || 0}`);
        doc.text(`Totale Valore: € ${(generale.totaleValore || 0).toFixed(2)}`);
        doc.text(`Media Valore: € ${(generale.mediaValore || 0).toFixed(2)}`);
        doc.moveDown();

        // Prodotti più venduti
        const prodottiRows = (data.prodottiPiuVenduti || []).map(p => [
          p._id || 'N/D',
          p.quantitaTotale.toString(),
          `€ ${(p.ricavoTotale || 0).toFixed(2)}`
        ]);

        if (prodottiRows.length > 0) {
          doc.table({
            title: "Prodotti Più Venduti",
            subtitle: "Top 10 prodotti per quantità venduta",
            headers: ["Prodotto", "Quantità", "Ricavo"],
            rows: prodottiRows
          });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  } catch (error) {
    console.error('Errore nella generazione PDF:', error);
    throw error;
  }
};

export const generateExcel = (data) => {
  try {
    const wb = xlsx.utils.book_new();

    // Foglio statistiche generali
    const generale = data.generale[0] || {
      totaleOrdini: 0,
      totaleValore: 0,
      mediaValore: 0
    };
    const wsGenerale = xlsx.utils.json_to_sheet([{
      'Totale Ordini': generale.totaleOrdini,
      'Totale Valore (€)': generale.totaleValore,
      'Media Valore (€)': generale.mediaValore
    }]);
    xlsx.utils.book_append_sheet(wb, wsGenerale, "Statistiche Generali");

    // Foglio prodotti più venduti
    if (data.prodottiPiuVenduti?.length) {
      const wsProdotti = xlsx.utils.json_to_sheet(
        data.prodottiPiuVenduti.map(p => ({
          'Prodotto': p._id,
          'Quantità': p.quantitaTotale,
          'Ricavo (€)': p.ricavoTotale
        }))
      );
      xlsx.utils.book_append_sheet(wb, wsProdotti, "Prodotti Più Venduti");
    }

    // Foglio trend giornaliero
    if (data.trendGiornaliero?.length) {
      const wsTrend = xlsx.utils.json_to_sheet(
        data.trendGiornaliero.map(t => ({
          'Data': t._id,
          'Numero Ordini': t.numeroOrdini,
          'Valore Totale (€)': t.valoreTotale
        }))
      );
      xlsx.utils.book_append_sheet(wb, wsTrend, "Trend Giornaliero");
    }

    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error('Errore nella generazione Excel:', error);
    throw error;
  }
};