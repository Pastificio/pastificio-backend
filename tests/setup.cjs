const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Test database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});