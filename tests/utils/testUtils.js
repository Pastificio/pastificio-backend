import jwt from 'jsonwebtoken';
import { User } from '../../models/User.js';

export const setupTestUser = async () => {
  const user = await User.create({
    username: 'testuser',
    password: 'password123',
    ruolo: 'admin'
  });
  
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return { user, token };
};