// tests/performance/backup.performance.test.js
import { crearBackup, ripristinaBackup } from '../../controllers/backupController.js';
import { Ordine } from '../../models/ordine.js';
import fs from 'fs/promises';
import path from 'path';

describe('Test Performance Backup/Restore', () => {
  const backupDir = path.join(process.cwd(), 'test-backups');
  const NUM_ORDINI = 1000;

  beforeAll(async () => {
    await fs.mkdir(backupDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(backupDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('backup grande volume di dati', async () => {
    const ordini = Array.from({ length: NUM_ORDINI }, (_, i) => ({
      nomeCliente: `Cliente ${i}`,
      telefono: `123456${i}`,
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Culurgiones',
        quantita: 2,
        unitaMisura: 'kg',
        prezzo: 15
      }]
    }));

    await Ordine.insertMany(ordini);

    const startTime = Date.now();
    const backupFile = await crearBackup(backupDir);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // 5 secondi max
    expect(backupFile).toBeDefined();

    const stat = await fs.stat(backupFile);
    expect(stat.size).toBeGreaterThan(0);
  });

  test('ripristino grande volume di dati', async () => {
    const ordini = Array.from({ length: NUM_ORDINI }, (_, i) => ({
      nomeCliente: `Cliente ${i}`,
      telefono: `123456${i}`,
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Culurgiones',
        quantita: 2,
        unitaMisura: 'kg',
        prezzo: 15
      }]
    }));

    const backupFile = path.join(backupDir, 'test-backup.json');
    await fs.writeFile(backupFile, JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      ordini
    }));

    const startTime = Date.now();
    await ripristinaBackup(backupFile);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // 5 secondi max

    const count = await Ordine.countDocuments();
    expect(count).toBe(NUM_ORDINI);
  });
});