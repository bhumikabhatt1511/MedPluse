import { Router } from 'express';
import {
  explainTransfer,
  analyzeEmergency,
  explainDemand,
  summarizePHC,
  explainShortage,
  getAIStatus,
} from '../controllers/ai.controller.js';

const router = Router();

router.get('/status', getAIStatus);
router.post('/explain-transfer', explainTransfer);
router.post('/analyze-emergency', analyzeEmergency);
router.post('/demand-explanation', explainDemand);
router.post('/phc-summary', summarizePHC);
router.post('/shortage-explanation', explainShortage);

export default router;
