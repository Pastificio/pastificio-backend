// tests/dashboard.test.js
import mongoose from 'mongoose';
import { createTestOrdine } from './helpers';
import { getDashboardData } from '../controllers/dashboardController';

describe('Dashboard Tests', () => {
  test('calcola statistiche corrette', async () => {
    // Crea alcuni ordini di test
    await Promise.all([
      createTestOrdine(),
      createTestOrdine(),
      createTestOrdine()
    ]);

    const stats = await getDashboardData();
    
    expect(stats.totaleOrdini).toBe(3);
    expect(stats.totaleValore).toBe(90); // 3 ordini * (2kg * 15€)
  });
});