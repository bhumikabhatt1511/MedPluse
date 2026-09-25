import type { Request, Response } from 'express';
import * as transferService from '../services/transfer.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getRecommendations(req: Request, res: Response) {
  try {
    const { targetPhcId, medicineId } = req.query;
    const result = await transferService.getTransferRecommendations(
      typeof targetPhcId === 'string' ? targetPhcId : 'phc-alpha',
      typeof medicineId === 'string' ? medicineId : 'med-01'
    );
    if (!result) {
      sendError(res, 'No eligible safe donor found or target PHC not found', 404);
      return;
    }
    sendSuccess(res, result, 'Generated safe redistribution recommendation with ranked donors');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to generate recommendations', 500);
  }
}

export async function approveTransfer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!payload.sourcePhcId || !payload.targetPhcId || !payload.medicineId || !payload.approvedQuantity) {
      sendError(res, 'Missing required transfer fields (sourcePhcId, targetPhcId, medicineId, approvedQuantity)', 400);
      return;
    }

    const result = await transferService.approveTransfer(payload);
    if (!result.success) {
      sendError(res, result.error || 'Transfer blocked by safety guardrails', 400);
      return;
    }

    sendSuccess(res, result.historyItem, 'Transfer approved, stock updated, and logged to audit history');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to approve transfer', 500);
  }
}

export async function rejectTransfer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { sourcePhcName, targetPhcName, medicineName, reason, quantity } = req.body;

    const historyItem = await transferService.rejectTransfer({
      sourcePhcName: sourcePhcName || 'Donor PHC',
      targetPhcName: targetPhcName || 'Destination PHC',
      medicineName: medicineName || 'Medicine',
      reason: reason || 'Administrative Override',
      quantity: quantity || 300,
    });

    sendSuccess(res, historyItem, 'Transfer rejected and logged to history');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to reject transfer', 500);
  }
}

export async function getHistory(req: Request, res: Response) {
  try {
    const data = await transferService.getTransferHistory();
    sendSuccess(res, data, `Retrieved ${data.length} transfer history audit records`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch transfer history', 500);
  }
}
