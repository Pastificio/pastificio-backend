import { Router } from 'express';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, async (req, res) => {
  res.json({ message: 'Integration route' });
});

export default router;