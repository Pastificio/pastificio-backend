// tests/report/dashboard.test.js
import request from 'supertest';
import app from '../../server.js';
import User from '../../models/User.js';
import Ordine from '../../models/ordine.js';

describe('Dashboard Tests', () => {
  let token;

  beforeAll(async () => {
    // Setup utente e token
    const testUser = await User.create({
      username: 'testDashboard',
      password: 'password123',
      ruolo: 'admin'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testDashboard', password: 'password123' });
    token = loginRes.body.token;

    // Crea alcuni ordini di test
    await Ordine.create([
      {
        nomeCliente: 'Cliente Test 1',
        dataRitiro: new Date(),
        prodotti: [{ nome: 'Pardulas', quantita: 2, prezzo: 18 }],
        totale: 36
      },
      {
        nomeCliente: 'Cliente Test 2',
        dataRitiro: new Date(),
        prodotti: [{ nome: 'Culurgiones', quantita: 3, prezzo: 15 }],
        totale: 45
      }
    ]);
  });

  test('Get dati dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ordiniOggi');
    expect(res.body).toHaveProperty('totaleVendite');
  });

  test('Get trend settimanale', async () => {
    const res = await request(app)
      .get('/api/dashboard/trend')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});