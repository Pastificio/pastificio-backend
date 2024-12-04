const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Importiamo gli schemi già definiti
const { Ordine, User } = require('./models');

describe('Test Avanzati API Ordini', () => {
  let token;
  
  beforeAll(async () => {
    const testUser = await User.create({
      username: 'testuser',
      password: 'password123',
      ruolo: 'admin'
    });
    
    token = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  afterAll(async () => {
    await Ordine.deleteMany({});
    await User.deleteMany({});
  });

  describe('Gestione Stati Ordine', () => {
    it('dovrebbe seguire il flusso corretto degli stati', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(Date.now() + 86400000),
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      expect(ordine.stato).toBe('nuovo');

      // Aggiorna a in_lavorazione
      ordine.stato = 'in_lavorazione';
      await ordine.save();
      expect(ordine.stato).toBe('in_lavorazione');

      // Aggiorna a completato
      ordine.stato = 'completato';
      await ordine.save();
      expect(ordine.stato).toBe('completato');
    });

    it('non dovrebbe permettere stati invalidi', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(Date.now() + 86400000),
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      ordine.stato = 'stato_invalido';
      let error;
      try {
        await ordine.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.stato).toBeDefined();
    });
  });

  describe('Gestione Modifiche Ordine', () => {
    it('non dovrebbe permettere modifiche a ordini completati', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(Date.now() + 86400000),
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }],
        stato: 'completato'
      });

      ordine.telefono = '9876543210';
      let error;
      try {
        await ordine.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });

    it('dovrebbe tenere traccia delle modifiche', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(Date.now() + 86400000),
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      // Prima modifica
      ordine.telefono = '9876543210';
      await ordine.save();

      // Seconda modifica
      ordine.stato = 'in_lavorazione';
      await ordine.save();

      expect(ordine.__v).toBe(2); // Versione incrementata
      expect(ordine.updatedAt).not.toBe(ordine.createdAt);
    });
  });

  describe('Performance e Concorrenza', () => {
    it('dovrebbe gestire inserimenti multipli', async () => {
      const ordini = Array(100).fill().map((_, i) => ({
        nomeCliente: `Cliente ${i}`,
        telefono: `123456${i.toString().padStart(4, '0')}`,
        dataRitiro: new Date(Date.now() + 86400000),
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      }));

      const startTime = Date.now();
      await Ordine.insertMany(ordini);
      const endTime = Date.now();

      const count = await Ordine.countDocuments();
      expect(count).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // Max 5 secondi
    });

    it('dovrebbe gestire aggiornamenti concorrenti', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(Date.now() + 86400000),
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      // Simula aggiornamenti concorrenti
      const updates = Array(5).fill().map(() => 
        Ordine.findByIdAndUpdate(
          ordine._id,
          { $inc: { 'prodotti.0.quantita': 1 } },
          { new: true }
        )
      );

      await Promise.all(updates);

      const ordineAggiornato = await Ordine.findById(ordine._id);
      expect(ordineAggiornato.prodotti[0].quantita).toBe(6); // 1 + 5 incrementi
    });
  });

  describe('Aggregazioni e Report', () => {
    it('dovrebbe calcolare statistiche giornaliere', async () => {
      // Crea ordini di test
      const oggi = new Date();
      const ordini = [
        {
          nomeCliente: 'Cliente 1',
          telefono: '1111111111',
          dataRitiro: oggi,
          prodotti: [{
            prodotto: 'Prodotto 1',
            quantita: 2,
            prezzo: 10,
            unitaMisura: 'kg',
            categoria: 'pasta'
          }]
        },
        {
          nomeCliente: 'Cliente 2',
          telefono: '2222222222',
          dataRitiro: oggi,
          prodotti: [{
            prodotto: 'Prodotto 2',
            quantita: 1,
            prezzo: 15,
            unitaMisura: 'pz',
            categoria: 'dolci'
          }]
        }
      ];

      await Ordine.insertMany(ordini);

      const stats = await Ordine.aggregate([
        {
          $match: {
            dataRitiro: {
              $gte: new Date(oggi.setHours(0, 0, 0, 0)),
              $lt: new Date(oggi.setHours(23, 59, 59, 999))
            }
          }
        },
        {
          $group: {
            _id: null,
            totaleOrdini: { $sum: 1 },
            totaleValore: { $sum: '$totale' },
            mediaValore: { $avg: '$totale' }
          }
        }
      ]);

      expect(stats[0].totaleOrdini).toBe(2);
      expect(stats[0].totaleValore).toBe(35); // (2 * 10) + (1 * 15)
      expect(stats[0].mediaValore).toBe(17.5);
    });
  });
});