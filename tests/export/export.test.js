// tests/export/export.test.js
import { exportToExcel, exportToPDF } from '../../controllers/exportController.js';
import { Ordine } from '../../models/ordine.js';
import fs from 'fs/promises';
import path from 'path';

describe('Test Export', () => {
  const exportDir = path.join(process.cwd(), 'test-exports');

  beforeAll(async () => {
    await fs.mkdir(exportDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(exportDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('export Excel', async () => {
    await Ordine.create([
      {
        nomeCliente: 'Cliente 1',
        telefono: '1234567890',
        dataRitiro: new Date(),
        oraRitiro: '10:00',
        prodotti: [{
          categoria: 'pasta',
          prodotto: 'Culurgiones',
          quantita: 2,
          unitaMisura: 'kg',
          prezzo: 15
        }]
      }
    ]);

    const excelFile = await exportToExcel(exportDir);
    expect(excelFile).toBeDefined();
    const stat = await fs.stat(excelFile);
    expect(stat.size).toBeGreaterThan(0);
  });

  test('export PDF', async () => {
    await Ordine.create([
      {
        nomeCliente: 'Cliente 1',
        telefono: '1234567890',
        dataRitiro: new Date(),
        oraRitiro: '10:00',
        prodotti: [{
          categoria: 'pasta',
          prodotto: 'Culurgiones',
          quantita: 2,
          unitaMisura: 'kg',
          prezzo: 15
        }]
      }
    ]);

    const pdfFile = await exportToPDF(exportDir);
    expect(pdfFile).toBeDefined();
    const stat = await fs.stat(pdfFile);
    expect(stat.size).toBeGreaterThan(0);
  });
});