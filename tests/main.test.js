// tests/main.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Ordine from '../models/ordine.js';

describe('API Tests', () => {
  let token;
  let userId;
  
  beforeAll(async () => {
    // Crea un utente di test
    const testUser = await User.create({
      username: 'test',
      password: 'password123',
      ruolo: 'admin'
    });
    userId = testUser._id;
    
    // Fai il login e ottieni il token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'password123' });
    token = loginRes.body.token;
  });

  describe('Auth Tests', () => {
    test('Login con credenziali valide', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('Ordini Tests', () => {
    test('Creazione nuovo ordine', async () => {
      const ordine = {
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: '2024-02-07',
        prodotti: [{
          nome: 'Pardulas',
          quantita: 2,
          prezzo: 18,
          unita: 'Kg'
        }]
      };

      const res = await request(app)
        .post('/api/ordini')
        .set('Authorization', `Bearer ${token}`)
        .send(ordine);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
    });

    test('Get ordini', async () => {
      const res = await request(app)
        .get('/api/ordini')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });
});