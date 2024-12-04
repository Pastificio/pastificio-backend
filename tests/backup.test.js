// tests/backup.test.js
import mongoose from 'mongoose';
import { createTestOrdine } from './helpers';
import { backupOrdini, ripristinaBackup } from '../controllers/backupController';
import fs from 'fs/promises';
import path from 'path';

describe('Test Backup/Restore', () => {
  const backupPath = path.join(__dirname, '../backup-test');

  beforeAll(async () => {
    await fs.mkdir(backupPath, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(backupPath, { recursive: true, force: true });
  });

  test('backup dati', async () => {
    // Crea dati di test
    await Promise.all([
      createTestOrdine(),
      createTestOrdine(),
      createTestOrdine()
    ]);

    const backupFile = await backupOrdini(backupPath);
    expect(backupFile).toBeDefined();

    const fileContent = await fs.readFile(backupFile, 'utf8');
    const backup = JSON.parse(fileContent);
    expect(backup.ordini).toHaveLength(3);
  });

  test('ripristino backup', async () => {
    // Crea un backup di test
    const testBackup = {
      versione: '1.0',
      data: new Date().toISOString(),
      ordini: [{
        nomeCliente: 'Backup Test',
        telefono: '1234567890',
        dataRitiro: new Date(),
        prodotti: [{
          categoria: 'pasta',
          prodotto: 'Test',
          quantita: 1,
          prezzo: 10
        }]
      }]
    };

    const backupFile = path.join(backupPath, 'test-backup.json');
    await fs.writeFile(backupFile, JSON.stringify(testBackup));

    await mongoose.connection.dropCollection('ordini');
    await ripristinaBackup(backupFile);

    const ordini = await mongoose.model('Ordine').find();
    expect(ordini).toHaveLength(1);
    expect(ordini[0].nomeCliente).toBe('Backup Test');
  });
});