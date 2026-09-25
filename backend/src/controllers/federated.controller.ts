import type { Request, Response } from 'express';
import * as federatedService from '../services/federated.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getNodes(req: Request, res: Response) {
  try {
    const data = await federatedService.getFederatedNodes();
    sendSuccess(res, data, `Retrieved ${data.length} global federated nodes`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch federated nodes', 500);
  }
}

export async function getStatus(req: Request, res: Response) {
  try {
    const data = await federatedService.getFederatedStatus();
    sendSuccess(res, data, 'Global federated network status retrieved');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch federated status', 500);
  }
}

export async function syncNode(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    if (!id) {
      sendError(res, 'Node ID is required', 400);
      return;
    }
    const updated = await federatedService.syncFederatedNode(id);
    if (!updated) {
      sendError(res, `Node with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, updated, `Node ${id} weight aggregation synchronized successfully`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to sync federated node', 500);
  }
}
