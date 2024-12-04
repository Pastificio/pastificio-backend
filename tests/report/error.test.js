const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { errorHandler } = require('../../middleware/error');

describe('Error Handling', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Route che genera errori per il test
    app.get('/test-error', (req, res, next) => {
      next(new Error('Test error'));
    });

    app.get('/test-validation', (req, res, next) => {
      const error = new Error('Validation error');
      error.name = 'ValidationError';
      next(error);
    });

    app.use(errorHandler);
  });

  it('dovrebbe gestire errori generici', async () => {
    const res = await request(app).get('/test-error');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('dovrebbe gestire errori di validazione', async () => {
    const res = await request(app).get('/test-validation');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('dovrebbe gestire errori 404', async () => {
    const res = await request(app).get('/non-esistente');
    expect(res.status).toBe(404);
  });

  it('dovrebbe gestire errori di database', async () => {
    const error = new mongoose.Error.CastError('ObjectId', 'invalid-id', '_id');
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const mockNext = jest.fn();

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String)
      })
    );
  });
});