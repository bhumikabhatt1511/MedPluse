import { Router } from 'express';
import { simulateEmergency } from '../controllers/simulation.controller.js';

const router = Router();

router.post('/emergency', simulateEmergency);

export default router;
