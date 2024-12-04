import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { formatDate, formatBytes } from '../utils/format.js';

export async function generateBackupReport(backup, format = 'pdf') {
  return format === 'pdf' 
    ? generatePDFReport(backup)
    : generateExcelReport(backup);
}

async function generatePDFReport(backup) {
  const doc = new PDFDocument();
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));
  
  doc
    .fontSize(20)
    .text('Backup Report', { align: 'center' })
    .moveDown()
    .fontSize(12)
    .text(`Filename: ${backup.filename}`)
    .text(`Created: ${formatDate(backup.createdAt)}`)
    .text(`Size: ${formatBytes(backup.size)}`)
    .moveDown()
    .text('Content Summary:')
    .moveDown();

  if (backup.content) {
    Object.entries(backup.content).forEach(([key, value]) => {
      doc
        .text(`${key}:`)
        .text(JSON.stringify(value, null, 2))
        .moveDown();
    });
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function generateExcelReport(backup) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Backup Report');

  worksheet.columns = [
    { header: 'Property', key: 'property', width: 20 },
    { header: 'Value', key: 'value', width: 50 }
  ];

  worksheet.addRows([
    { property: 'Filename', value: backup.filename },
    { property: 'Created', value: formatDate(backup.createdAt) },
    { property: 'Size', value: formatBytes(backup.size) }
  ]);

  if (backup.content) {
    Object.entries(backup.content).forEach(([key, value]) => {
      worksheet.addRow({ 
        property: key, 
        value: JSON.stringify(value) 
      });
    });
  }

  return workbook.xlsx.writeBuffer();
}