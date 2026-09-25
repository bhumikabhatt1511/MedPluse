import type { Request, Response } from 'express';
import * as phcService from '../services/phc.service.js';
import * as riskService from '../services/risk.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getPHCs(req: Request, res: Response) {
  try {
    const { jurisdiction, district } = req.query;
    const data = await phcService.getAllPHCs(
      typeof jurisdiction === 'string' ? jurisdiction : undefined,
      typeof district === 'string' ? district : undefined
    );
    sendSuccess(res, data, `Fetched ${data.length} PHC facilities`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch PHCs', 500);
  }
}

export async function getPHCById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    if (!id) {
      sendError(res, 'PHC ID is required', 400);
      return;
    }
    const phc = await phcService.getPHCById(id);
    if (!phc) {
      sendError(res, `PHC with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, phc, 'PHC facility details retrieved');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch PHC', 500);
  }
}

export async function createPHC(req: Request, res: Response) {
  try {
    const { id, name, code, state, district, latitude, longitude } = req.body;
    if (!id || !name || !code || !state || !district || latitude === undefined || longitude === undefined) {
      sendError(res, 'Missing required PHC fields (id, name, code, state, district, latitude, longitude)', 400);
      return;
    }
    const created = await phcService.createPHC(req.body);
    sendSuccess(res, created, 'PHC facility created successfully', 201);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to create PHC', 500);
  }
}

export async function updatePHC(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    if (!id) {
      sendError(res, 'PHC ID is required', 400);
      return;
    }
    const updated = await phcService.updatePHC(id, req.body);
    if (!updated) {
      sendError(res, `PHC with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, updated, 'PHC facility updated successfully');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to update PHC', 500);
  }
}

export async function getPHCRisk(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    if (!id) {
      sendError(res, 'PHC ID is required', 400);
      return;
    }
    const risk = await riskService.getRiskAnalysisForPHC(id);
    if (!risk) {
      sendError(res, `PHC with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, risk, 'Deterministic risk analysis retrieved');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to calculate PHC risk', 500);
  }
}
