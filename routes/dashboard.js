import express from 'express';
import { 
  getDashboardData, 
  getTrendSettimanale,
  getAlerts,
  getReport,
  getAnalisiPredittiva
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDashboardData);
router.get('/trend', getTrendSettimanale);
router.get('/alerts', getAlerts);
router.get('/report', getReport);
router.get('/analisi', getAnalisiPredittiva);

export default router;