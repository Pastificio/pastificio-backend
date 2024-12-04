import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username obbligatorio'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password obbligatoria'],
    minlength: 6,
    select: false
  },
  ruolo: {
    type: String,
    enum: ['admin', 'operatore'],
    default: 'operatore'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash della password prima del salvataggio
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Firma del token JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, ruolo: this.ruolo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Verifica password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', UserSchema);