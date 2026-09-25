import { Router } from 'express';
import {
  getPatientMetrics,
  createPatientMetrics,
  getBedMetrics,
  createBedMetrics,
  getStaffMetrics,
  getStaffMembers,
} from '../controllers/metrics.controller.js';

const router = Router();

// Patients
router.get('/patients', getPatientMetrics);
router.post('/patients', createPatientMetrics);

// Beds
router.get('/beds', getBedMetrics);
router.post('/beds', createBedMetrics);

// Staff
router.get('/staff', getStaffMetrics);
router.get('/staff/members', getStaffMembers);

export default router;
