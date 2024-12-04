// tests/edge-cases/limits.test.js
import { Ordine } from '../../models/ordine.js';
import mongoose from 'mongoose';

describe('Test Casi Limite', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('ordine con molti prodotti', async () => {
    const prodotti = Array.from({ length: 100 }, (_, i) => ({
      categoria: 'pasta',
      prodotto: `Prodotto ${i}`,
      quantita: 1,
      unitaMisura: 'kg',
      prezzo: 10
    }));

    const ordine = await Ordine.create({
      nomeCliente: 'Test Cliente',
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti
    });

    expect(ordine.prodotti.length).toBe(100);
    expect(ordine.totaleOrdine).toBe(1000);
  });

  test('valori numerici estremi', async () => {
    const ordine = await Ordine.create({
      nomeCliente: 'Test Cliente',
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Test',
        quantita: Number.MAX_SAFE_INTEGER,
        unitaMisura: 'kg',
        prezzo: Number.MAX_SAFE_INTEGER
      }]
    });

    expect(ordine.totaleOrdine).not.toBe(Infinity);
    expect(isNaN(ordine.totaleOrdine)).toBe(false);
  });

  test('stringhe molto lunghe', async () => {
    const stringaLunga = 'a'.repeat(1000);
    
    const ordine = await Ordine.create({
      nomeCliente: stringaLunga,
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: stringaLunga,
        quantita: 1,
        unitaMisura: 'kg',
        prezzo: 10
      }]
    });

    expect(ordine.nomeCliente.length).toBeLessThan(1000);
    expect(ordine.prodotti[0].prodotto.length).toBeLessThan(1000);
  });
});