// tests/server.test.js
import request from 'supertest';
import { app } from '../server.js';
import { Ordine } from '../models/ordine.js';

describe('API Tests', () => {
  test('Server should be running', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});