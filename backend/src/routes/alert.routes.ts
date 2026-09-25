import { Router } from 'express';
import {
  getAlerts,
  getAlertById,
  resolveAlert,
  createAlert,
} from '../controllers/alert.controller.js';

const router = Router();

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.post('/', createAlert);
router.post('/:id/resolve', resolveAlert);

export default router;
