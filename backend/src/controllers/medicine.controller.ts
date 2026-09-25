import type { Request, Response } from 'express';
import * as medicineService from '../services/medicine.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getMedicines(req: Request, res: Response) {
  try {
    const data = await medicineService.getAllMedicines();
    sendSuccess(res, data, `Retrieved ${data.length} medicine catalog items`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch medicines', 500);
  }
}

export async function getPHCInventory(req: Request, res: Response) {
  try {
    const phcId = (req.params.phcId as string) || 'phc-alpha';
    const data = await medicineService.getPHCInventory(phcId);
    sendSuccess(res, data, `Retrieved ${data.length} inventory items for PHC ${phcId}`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch PHC inventory', 500);
  }
}

export async function getShortages(req: Request, res: Response) {
  try {
    const { phcId } = req.query;
    const data = await medicineService.getShortages(typeof phcId === 'string' ? phcId : undefined);
    sendSuccess(res, data, `Found ${data.length} medicine shortage risks`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch shortage risks', 500);
  }
}

export async function getExpiring(req: Request, res: Response) {
  try {
    const { threshold, phcId } = req.query;
    const days = threshold ? parseInt(threshold as string, 10) : 60;
    const data = await medicineService.getExpiring(
      days,
      typeof phcId === 'string' ? phcId : undefined
    );
    sendSuccess(res, data, `Found ${data.length} medicines expiring within ${days} days`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch expiring medicines', 500);
  }
}

export async function restockMedicine(req: Request, res: Response) {
  try {
    const phcId = req.params.phcId as string;
    const { medicineId, amount } = req.body;
    if (!phcId || !medicineId || !amount || amount <= 0) {
      sendError(res, 'Valid phcId, medicineId, and positive restock amount are required', 400);
      return;
    }
    const updated = await medicineService.restockMedicine(phcId, medicineId, Number(amount));
    if (!updated) {
      sendError(res, 'Medicine inventory record not found', 404);
      return;
    }
    sendSuccess(res, updated, `Successfully restocked ${amount} units of ${updated.name}`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to restock medicine', 500);
  }
}
