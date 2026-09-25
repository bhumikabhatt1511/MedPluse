import { Router } from 'express';
import {
  getNodes,
  getStatus,
  syncNode,
} from '../controllers/federated.controller.js';

const router = Router();

router.get('/nodes', getNodes);
router.get('/status', getStatus);
router.post('/nodes/:id/sync', syncNode);

export default router;
