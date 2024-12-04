// utils/export-templates.js
export const pdfTemplate = {
  header: {
    title: "Pastificio Nonna Claudia",
    subtitle: "Riepilogo Ordini",
    font: "Helvetica-Bold",
    fontSize: 20,
    align: "center"
  },
  table: {
    ordini: {
      title: "Lista Ordini",
      headers: [
        { label: "Data", property: 'dataRitiro', width: 60 },
        { label: "Ora", property: 'oraRitiro', width: 40 },
        { label: "Cliente", property: 'nomeCliente', width: 100 },
        { label: "Prodotti", property: 'prodotti', width: 200 },
        { label: "Totale", property: 'totale', width: 60 },
        { label: "Note", property: 'note', width: 100 }
      ],
      settings: {
        headerColor: "#CCCCCC",
        headerFontSize: 10,
        rowFontSize: 9,
        stripedRows: true,
        stripeColors: ["#FFFFFF", "#F5F5F5"]
      }
    }
  },
  footer: {
    text: "Documento generato il {date} alle {time}",
    font: "Helvetica",
    fontSize: 8,
    align: "center"
  }
};

export const excelTemplate = {
  sheets: {
    ordini: {
      name: "Ordini",
      columns: [
        { header: 'Data Ritiro', key: 'dataRitiro', width: 15 },
        { header: 'Ora', key: 'oraRitiro', width: 10 },
        { header: 'Cliente', key: 'nomeCliente', width: 20 },
        { header: 'Telefono', key: 'telefono', width: 15 },
        { header: 'Prodotti', key: 'prodotti', width: 40 },
        { header: 'Totale', key: 'totale', width: 12 },
        { header: 'Da Viaggio', key: 'daViaggio', width: 10 },
        { header: 'Stato', key: 'stato', width: 15 },
        { header: 'Note', key: 'note', width: 30 }
      ],
      style: {
        header: {
          font: { bold: true },
          fill: {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb:'FFE0E0E0'}
          }
        },
        data: {
          font: { name: 'Arial', size: 10 },
          alignment: { vertical: 'middle', wrapText: true }
        }
      }
    },
    riepilogo: {
      name: "Riepilogo",
      data: [
        ['Totale Ordini', '{totalOrders}'],
        ['Valore Totale', '€ {totalValue}'],
        ['Media per Ordine', '€ {averageValue}'],
        ['Periodo', '{dateRange}']
      ]
    }
  }
};