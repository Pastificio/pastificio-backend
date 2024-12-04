// tests/security/rate-limit.test.js
import request from 'supertest';
import { app } from '../../server.js';

describe('Test Rate Limiting', () => {
  test('limite richieste API', async () => {
    const maxRequests = 100;
    const requests = Array(maxRequests + 1).fill().map(() => 
      request(app).get('/api/ordini')
    );

    const responses = await Promise.all(requests);
    const ultimaRisposta = responses[responses.length - 1];

    expect(ultimaRisposta.status).toBe(429);
    expect(ultimaRisposta.body.error).toContain('troppe richieste');
  });

  test('rate limit per IP', async () => {
    const requests = Array(10).fill().map(() => 
      request(app)
        .get('/api/ordini')
        .set('X-Forwarded-For', '192.168.1.1')
    );

    const responses = await Promise.all(requests);
    const ultimaRisposta = responses[responses.length - 1];

    expect(ultimaRisposta.headers['x-ratelimit-remaining']).toBeDefined();
  });

  test('reset rate limit dopo periodo', async () => {
    // Prima richiesta che dovrebbe raggiungere il limite
    await Promise.all(Array(10).fill().map(() => 
      request(app).get('/api/ordini')
    ));

    // Aspetta che il periodo di rate limit scada
    await new Promise(resolve => setTimeout(resolve, 60000));

    // La richiesta successiva dovrebbe funzionare
    const response = await request(app).get('/api/ordini');
    expect(response.status).toBe(200);
  });
});