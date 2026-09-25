import type { Request, Response } from 'express';
import * as simulationService from '../services/simulation.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function simulateEmergency(req: Request, res: Response) {
  try {
    const { patientSurge, medicineSurge, staffDepletion, emergencySurge, targetPhcId } = req.body;
    const result = await simulationService.simulateEmergencyScenario({
      patientSurge: patientSurge !== undefined ? Number(patientSurge) : 25,
      medicineSurge: medicineSurge !== undefined ? Number(medicineSurge) : 25,
      staffDepletion: staffDepletion !== undefined ? Number(staffDepletion) : 1,
      emergencySurge: emergencySurge !== undefined ? Number(emergencySurge) : 30,
      targetPhcId: typeof targetPhcId === 'string' ? targetPhcId : 'phc-alpha',
    });
    sendSuccess(res, result, 'Emergency crisis simulation calculated successfully (Read-only simulation)');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to execute emergency simulation', 500);
  }
}
