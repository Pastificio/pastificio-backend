// config/database.js
import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    // Rimuove le opzioni deprecate
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Configura mongoose
    mongoose.set('strictQuery', true);

    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;