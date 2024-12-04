// tests/setup/test-setup.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../server.js';
import request from 'supertest';

let mongoServer;

beforeAll(async () => {
  // Chiudi connessioni esistenti
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Crea nuovo server MongoDB in memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Pulisci il database prima di ogni test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Helper per creare un utente admin e ottenere il token
const getAuthToken = async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'admin',
      password: 'password123',
      ruolo: 'admin'
    });
  return response.body.token;
};

export { getAuthToken };