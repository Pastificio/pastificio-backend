// tests/integration.test.js
import request from 'supertest';
import { app } from '../server.js';

describe('Integrazione API', () => {
  test('Health check', async () => {
    const response = await request(app)
      .get('/health')  // modificato da '/api/health' a '/health'
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ok');
  });
});