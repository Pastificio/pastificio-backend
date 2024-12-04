import mongoose from 'mongoose';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
const dotenv = require('dotenv');

dotenv.config();

// Schema Prodotto - mantenuto da prima
const prodottoSchema = new mongoose.Schema({
  prodotto: {
    type: String,
    required: [true, 'Il nome del prodotto è obbligatorio']
  },
  quantita: {
    type: Number,
    required: [true, 'La quantità è obbligatoria'],
    min: [0, 'La quantità deve essere maggiore di 0']
  },
  prezzo: {
    type: Number,
    required: [true, 'Il prezzo è obbligatorio'],
    min: [0, 'Il prezzo deve essere maggiore di 0']
  },
  unitaMisura: {
    type: String,
    required: [true, "L'unità di misura è obbligatoria"],
    enum: {
      values: ['kg', 'g', 'pz', 'unità'],
      message: "L'unità di misura deve essere una tra: kg, g, pz, unità"
    }
  },
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    enum: {
      values: ['pasta', 'dolci', 'panadas'],
      message: 'La categoria deve essere una tra: pasta, dolci, panadas'
    }
  }
});

// Schema Ordine - aggiunto stato e calcolo totale
const ordineSchema = new mongoose.Schema({
  nomeCliente: {
    type: String,
    required: [true, 'Il nome del cliente è obbligatorio']
  },
  telefono: {
    type: String,
    required: [true, 'Il numero di telefono è obbligatorio']
  },
  dataRitiro: {
    type: Date,
    required: [true, 'La data di ritiro è obbligatoria'],
    validate: {
      validator: function(data) {
        return data >= new Date();
      },
      message: 'La data di ritiro deve essere futura'
    }
  },
  prodotti: {
    type: [prodottoSchema],
    validate: {
      validator: function(prodotti) {
        return prodotti && prodotti.length > 0;
      },
      message: 'Almeno un prodotto è obbligatorio'
    }
  },
  stato: {
    type: String,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'annullato'],
    default: 'nuovo'
  },
  totale: {
    type: Number,
    default: 0
  },
  note: String
}, { timestamps: true });

// Calcolo automatico del totale
ordineSchema.pre('save', function(next) {
  this.totale = this.prodotti.reduce((sum, prod) => sum + (prod.prezzo * prod.quantita), 0);
  next();
});

const Ordine = mongoose.model('Ordine', ordineSchema);
const User = mongoose.model('User', mongoose.Schema({
  username: String,
  password: String,
  ruolo: String
}));

describe('Test API Ordini', () => {
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

  // Test esistenti mantenuti...

  describe('Operazioni CRUD', () => {
    it('dovrebbe aggiornare un ordine esistente', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(Date.now() + 86400000), // domani
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      const aggiornamento = {
        telefono: '9876543210',
        stato: 'in_lavorazione'
      };

      const ordineAggiornato = await Ordine.findByIdAndUpdate(
        ordine._id,
        aggiornamento,
        { new: true }
      );

      expect(ordineAggiornato.telefono).toBe('9876543210');
      expect(ordineAggiornato.stato).toBe('in_lavorazione');
    });

    it('dovrebbe eliminare un ordine', async () => {
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

      await Ordine.findByIdAndDelete(ordine._id);
      const ordineEliminato = await Ordine.findById(ordine._id);
      expect(ordineEliminato).toBeNull();
    });
  });

  describe('Funzionalità specifiche', () => {
    it('dovrebbe calcolare correttamente il totale', async () => {
      const ordine = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(Date.now() + 86400000),
        prodotti: [
          {
            prodotto: 'Prodotto 1',
            quantita: 2,
            prezzo: 10,
            unitaMisura: 'kg',
            categoria: 'pasta'
          },
          {
            prodotto: 'Prodotto 2',
            quantita: 1,
            prezzo: 15,
            unitaMisura: 'pz',
            categoria: 'dolci'
          }
        ]
      });

      expect(ordine.totale).toBe(35); // (2 * 10) + (1 * 15)
    });

    it('dovrebbe rifiutare date di ritiro passate', async () => {
      const dataPassata = new Date();
      dataPassata.setDate(dataPassata.getDate() - 1); // ieri

      const ordineInvalido = new Ordine({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: dataPassata,
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      let error;
      try {
        await ordineInvalido.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.dataRitiro).toBeDefined();
    });
  });

  describe('Query e filtri', () => {
    it('dovrebbe trovare ordini per data', async () => {
      const domani = new Date(Date.now() + 86400000);
      const dopodomani = new Date(Date.now() + 172800000);

      await Ordine.create({
        nomeCliente: 'Cliente 1',
        telefono: '1111111111',
        dataRitiro: domani,
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      await Ordine.create({
        nomeCliente: 'Cliente 2',
        telefono: '2222222222',
        dataRitiro: dopodomani,
        prodotti: [{
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg',
          categoria: 'pasta'
        }]
      });

      const ordiniDomani = await Ordine.find({
        dataRitiro: {
          $gte: new Date(domani.setHours(0, 0, 0, 0)),
          $lt: new Date(domani.setHours(23, 59, 59, 999))
        }
      });

      expect(ordiniDomani.length).toBe(1);
      expect(ordiniDomani[0].nomeCliente).toBe('Cliente 1');
    });
  });
});