import { Router } from 'express';
import healthRoutes from './health.routes.js';
import phcRoutes from './phc.routes.js';
import medicineRoutes from './medicine.routes.js';
import metricsRoutes from './metrics.routes.js';
import transferRoutes from './transfer.routes.js';
import alertRoutes from './alert.routes.js';
import simulationRoutes from './simulation.routes.js';
import aiRoutes from './ai.routes.js';
import federatedRoutes from './federated.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/phcs', phcRoutes);
router.use('/medicines', medicineRoutes);
router.use('/inventory', medicineRoutes);
router.use('/metrics', metricsRoutes);
router.use('/transfers', transferRoutes);
router.use('/alerts', alertRoutes);
router.use('/simulation', simulationRoutes);
router.use('/ai', aiRoutes);
router.use('/federated', federatedRoutes);

export default router;
