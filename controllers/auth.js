// src/controllers/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

export async function register(req, res) {
  try {
    const { username, password } = req.body;
    
    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username già in uso' });
    }
    
    // Crea nuovo utente
    const user = new User({
      username,
      password
    });
    
    await user.save();
    
    // Genera token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    logger.info(`Nuovo utente registrato: ${username}`);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Errore in register:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    // Trova l'utente
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    // Verifica password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    // Genera token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    logger.info(`Login effettuato: ${username}`);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Errore in login:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Errore in getProfile:', error);
    res.status(500).json({ error: error.message });
  }
}