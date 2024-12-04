// tests/backup/backup.test.js
import { crearBackup, ripristinaBackup } from '../../controllers/backupController.js';
import { Ordine } from '../../models/ordine.js';
import fs from 'fs/promises';
import path from 'path';

describe('Test Backup/Restore', () => {
  const backupDir = path.join(process.cwd(), 'test-backups');

  beforeAll(async () => {
    await fs.mkdir(backupDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(backupDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('crea backup', async () => {
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

    const backupFile = await crearBackup(backupDir);
    expect(backupFile).toBeDefined();
    
    const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
    expect(backupData.ordini.length).toBe(1);
    expect(backupData.version).toBeDefined();
  });

  test('ripristina backup', async () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      ordini: [
        {
          nomeCliente: 'Cliente Test',
          telefono: '1234567890',
          dataRitiro: new Date(),
          oraRitiro: '10:00',
          prodotti: [{
            categoria: 'pasta',
            prodotto: 'Test',
            quantita: 1,
            unitaMisura: 'kg',
            prezzo: 10
          }]
        }
      ]
    };

    const backupFile = path.join(backupDir, 'test-backup.json');
    await fs.writeFile(backupFile, JSON.stringify(backupData));

    await ripristinaBackup(backupFile);
    const ordini = await Ordine.find();
    expect(ordini.length).toBe(1);
    expect(ordini[0].nomeCliente).toBe('Cliente Test');
  });
});