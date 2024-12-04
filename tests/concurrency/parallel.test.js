// tests/concurrency/parallel.test.js
import { Ordine } from '../../models/ordine.js';
import mongoose from 'mongoose';

describe('Test Concorrenza', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  test('aggiornamenti concorrenti', async () => {
    const ordine = await Ordine.create({
      nomeCliente: 'Test Cliente',
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
    });

    // Simula aggiornamenti concorrenti
    const updates = Array.from({ length: 10 }, (_, i) => 
      Ordine.findByIdAndUpdate(
        ordine._id,
        { $set: { 'prodotti.0.quantita': i + 1 } },
        { new: true }
      )
    );

    const risultati = await Promise.all(updates);
    const quantitaFinali = new Set(risultati.map(r => r.prodotti[0].quantita));
    
    // Verifica che non ci siano stati conflitti
    expect(quantitaFinali.size).toBe(10);
  });

  test('inserimenti paralleli', async () => {
    const NUM_ORDINI = 100;
    const inserimenti = Array.from({ length: NUM_ORDINI }, (_, i) => 
      Ordine.create({
        nomeCliente: `Cliente ${i}`,
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
      })
    );

    await Promise.all(inserimenti);
    const count = await Ordine.countDocuments();
    expect(count).toBe(NUM_ORDINI);
  });

  test('race condition su cambio stato', async () => {
    const ordine = await Ordine.create({
      nomeCliente: 'Test Cliente',
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Test',
        quantita: 1,
        unitaMisura: 'kg',
        prezzo: 10
      }],
      stato: 'nuovo'
    });

    // Simula cambi di stato concorrenti
    const cambiStato = [
      ordine.cambiaStato('in_lavorazione'),
      ordine.cambiaStato('completato'),
      ordine.cambiaStato('annullato')
    ];

    await Promise.all(cambiStato);
    
    // Verifica che lo stato finale sia uno dei possibili stati
    const ordineFinale = await Ordine.findById(ordine._id);
    expect(['in_lavorazione', 'completato', 'annullato']).toContain(ordineFinale.stato);
  });
});