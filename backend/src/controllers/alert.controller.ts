import type { Request, Response } from 'express';
import * as alertService from '../services/alert.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getAlerts(req: Request, res: Response) {
  try {
    const data = await alertService.getAllAlerts();
    sendSuccess(res, data, `Retrieved ${data.length} active and system alerts`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch alerts', 500);
  }
}

export async function getAlertById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    if (!id) {
      sendError(res, 'Alert ID is required', 400);
      return;
    }
    const alert = await alertService.getAlertById(id);
    if (!alert) {
      sendError(res, `Alert with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, alert, 'Alert details retrieved');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch alert', 500);
  }
}

export async function resolveAlert(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    if (!id) {
      sendError(res, 'Alert ID is required', 400);
      return;
    }
    const result = await alertService.resolveAlert(id);
    sendSuccess(res, result, 'Alert marked as resolved');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to resolve alert', 500);
  }
}

export async function createAlert(req: Request, res: Response) {
  try {
    const { phcId, type, severity, title, message } = req.body;
    if (!phcId || !type || !severity || !title || !message) {
      sendError(res, 'Missing required alert fields (phcId, type, severity, title, message)', 400);
      return;
    }
    const created = await alertService.createAlert(req.body);
    sendSuccess(res, created, 'Alert created successfully', 201);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to create alert', 500);
  }
}
