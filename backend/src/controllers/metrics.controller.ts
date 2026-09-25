import type { Request, Response } from 'express';
import * as metricsService from '../services/metrics.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Patients
export async function getPatientMetrics(req: Request, res: Response) {
  try {
    const { phcId } = req.query;
    const data = await metricsService.getPatientMetrics(typeof phcId === 'string' ? phcId : undefined);
    sendSuccess(res, data, 'Patient metrics retrieved (No PII)');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch patient metrics', 500);
  }
}

export async function createPatientMetrics(req: Request, res: Response) {
  try {
    const { phcId, totalPatients, newPatients, underTreatment, recovered, discharged, admitted, emergencyCases, criticalPatients, referredPatients } = req.body;
    if (!phcId) {
      sendError(res, 'phcId is required', 400);
      return;
    }
    const created = await metricsService.createPatientMetrics(req.body);
    sendSuccess(res, created, 'Patient metrics recorded successfully', 201);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to create patient metrics', 500);
  }
}

// Beds
export async function getBedMetrics(req: Request, res: Response) {
  try {
    const { phcId } = req.query;
    const data = await metricsService.getBedMetrics(typeof phcId === 'string' ? phcId : undefined);
    sendSuccess(res, data, 'Bed capacity metrics retrieved');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch bed metrics', 500);
  }
}

export async function createBedMetrics(req: Request, res: Response) {
  try {
    const { phcId, totalBeds, occupiedBeds, emergencyBeds, emergencyBedsOccupied, icuBeds, icuBedsOccupied } = req.body;
    if (!phcId || totalBeds === undefined || occupiedBeds === undefined) {
      sendError(res, 'phcId, totalBeds, and occupiedBeds are required', 400);
      return;
    }
    const created = await metricsService.createBedMetrics(req.body);
    sendSuccess(res, created, 'Bed metrics recorded successfully', 201);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to create bed metrics', 500);
  }
}

// Staff
export async function getStaffMetrics(req: Request, res: Response) {
  try {
    const { phcId } = req.query;
    const data = await metricsService.getStaffMetrics(typeof phcId === 'string' ? phcId : undefined);
    sendSuccess(res, data, 'Staff availability metrics retrieved');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch staff metrics', 500);
  }
}

export async function getStaffMembers(req: Request, res: Response) {
  try {
    const { phcId } = req.query;
    const data = await metricsService.getStaffMembers(typeof phcId === 'string' ? phcId : undefined);
    sendSuccess(res, data, `Retrieved ${data.length} rostered staff members`);
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to fetch staff members', 500);
  }
}
