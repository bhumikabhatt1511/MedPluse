import type { Request, Response } from 'express';
import * as aiService from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function explainTransfer(req: Request, res: Response) {
  try {
    const result = await aiService.explainTransferRecommendation(req.body);
    sendSuccess(res, result, 'Transfer reasoning generated');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to explain transfer recommendation', 500);
  }
}

export async function analyzeEmergency(req: Request, res: Response) {
  try {
    const result = await aiService.analyzeEmergencyScenarioAI(req.body);
    sendSuccess(res, result, 'Crisis scenario AI analysis complete');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to analyze emergency scenario', 500);
  }
}

export async function explainDemand(req: Request, res: Response) {
  try {
    const result = await aiService.explainDemandForecastAI(req.body);
    sendSuccess(res, result, 'Demand forecast explanation generated');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to explain demand forecast', 500);
  }
}

export async function summarizePHC(req: Request, res: Response) {
  try {
    const result = await aiService.summarizePHCAI(req.body);
    sendSuccess(res, result, 'PHC diagnostic summary generated');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to summarize PHC diagnostic', 500);
  }
}

export async function explainShortage(req: Request, res: Response) {
  try {
    const result = await aiService.explainShortageAI(req.body);
    sendSuccess(res, result, 'Medicine shortage explanation generated');
  } catch (err: any) {
    sendError(res, err?.message || 'Failed to explain medicine shortage', 500);
  }
}

export async function getAIStatus(req: Request, res: Response) {
  sendSuccess(
    res,
    {
      isConfigured: aiService.isGeminiAvailable(),
      engine: aiService.isGeminiAvailable()
        ? 'Google Gemini 2.5 Flash (Live)'
        : 'MedPulse Deterministic Safety Engine (Fallback)',
      provider: 'MedPulse Backend AI Gateway',
      model: 'gemini-2.5-flash',
    },
    'AI gateway status'
  );
}
