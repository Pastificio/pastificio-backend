import { Router } from 'express';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, async (req, res) => {
  res.json({ message: 'Webhook route' });
});

export default router;