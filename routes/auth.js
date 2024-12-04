// routes/auth.js
import { Router } from 'express';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, ruolo } = req.body;

    // Verifica se l'utente esiste già
    const utenteEsistente = await User.findOne({ username });
    if (utenteEsistente) {
      return res.status(400).json({
        success: false,
        error: 'Username già in uso'
      });
    }

    // Se è il primo utente, lo creiamo come admin
    const utentiEsistenti = await User.countDocuments();
    const user = await User.create({
      username,
      password,
      ruolo: utentiEsistenti === 0 ? 'admin' : (ruolo || 'operatore')
    });

    // Generiamo il token
    const token = user.getJWT();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    logger.error('Error in register:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verifica username e password
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.verificaPassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Aggiorna ultimo accesso
    user.ultimoAccesso = Date.now();
    await user.save();

    // Genera token
    const token = user.getJWT();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    logger.error('Error in login:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    // Verifica il token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token non fornito'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    logger.error('Error in get me:', error);
    res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }
});

// PUT /api/auth/password
router.put('/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Verifica il token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token non fornito'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+password');

    // Verifica vecchia password
    if (!(await user.verificaPassword(oldPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Password attuale non corretta'
      });
    }

    // Aggiorna password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
  } catch (error) {
    logger.error('Error in password update:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;