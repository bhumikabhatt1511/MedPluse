import type { Request, Response } from 'express';
import * as aiService from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function explainTransfer(req: Request, res: Response) {
  try {
    const { recommendation, sourcePhc, targetPhc, medicine, customQuantity } = req.body;
    if (!recommendation) {
      sendError(res, 'Transfer recommendation payload is required', 400);
      return;
    }
    const result = await aiService.explainTransferRecommendation({
      recommendation,
      sourcePhc,
      targetPhc,
      medicine,
      customQuantity: customQuantity !== undefined ? Number(customQuantity) : undefined,
    });
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

export async function getAIStatus(req: Request, res: Response) {
  sendSuccess(
    res,
    {
      isConfigured: aiService.isGeminiAvailable(),
      engine: aiService.isGeminiAvailable() ? 'Google Gemini GenAI (Live)' : 'MedPulse Deterministic Safety Engine (Fallback)',
      provider: 'MedPulse Backend AI Gateway',
    },
    'AI gateway status'
  );
}
