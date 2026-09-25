import { Router } from 'express';
import {
  explainTransfer,
  analyzeEmergency,
  getAIStatus,
} from '../controllers/ai.controller.js';

const router = Router();

router.get('/status', getAIStatus);
router.post('/explain-transfer', explainTransfer);
router.post('/analyze-emergency', analyzeEmergency);

export default router;
