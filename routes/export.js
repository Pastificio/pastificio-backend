import { Router } from 'express';
import { exportController } from '../controllers/exportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/excel', protect, exportController.toExcel);
router.get('/csv', protect, exportController.toCSV);
router.get('/pdf', protect, exportController.toPDF);

export default router;