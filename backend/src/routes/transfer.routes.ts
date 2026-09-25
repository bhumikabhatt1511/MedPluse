import { Router } from 'express';
import {
  getRecommendations,
  approveTransfer,
  rejectTransfer,
  getHistory,
} from '../controllers/transfer.controller.js';

const router = Router();

router.get('/recommendations', getRecommendations);
router.post('/approve', approveTransfer);
router.post('/reject', rejectTransfer);
router.get('/history', getHistory);

export default router;
