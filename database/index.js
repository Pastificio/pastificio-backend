import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

export default connectDB;