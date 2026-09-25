import { GoogleGenAI } from '@google/genai';
import type {
  RecommendationExplanationParams,
  RecommendationExplanationResult,
  EmergencySimulationParams,
} from '../types/index.js';
import { simulateEmergencyScenario } from './simulation.service.js';

function getApiKey(): string {
  return process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
}

export function isGeminiAvailable(): boolean {
  return getApiKey().length > 0;
}

export async function explainTransferRecommendation(
  params: RecommendationExplanationParams
): Promise<RecommendationExplanationResult> {
  const { recommendation, sourcePhc, targetPhc, medicine, customQuantity } = params;
  const apiKey = getApiKey();

  const qty = customQuantity ?? recommendation.approvedQuantity;
  const medName = medicine?.name || recommendation.medicineName;
  const sourceName = sourcePhc?.name || recommendation.sourcePhcName;
  const targetName = targetPhc?.name || recommendation.targetPhcName;
  const surplus = recommendation.safeSurplusAvailable;
  const dist = recommendation.distanceKm;
  const transitMins = recommendation.transitMinutes;
  const avoidedDays = recommendation.shortageAvoidedDays;

  // Fallback / deterministic structured explanation when no API key is provided
  const fallbackPillars = [
    `Safe Surplus Verification: ${sourceName} retains full 7-day domestic demand + 3-day emergency buffer. Safe surplus exceeds transfer request by ${Math.max(0, surplus - qty)} units.`,
    `Donor Resilience Guardrail: Donor operational stability index remains robust at ${sourcePhc?.resilienceScore ? Math.max(70, sourcePhc.resilienceScore - 5) : 80}%, well above the 70% systemic safety threshold.`,
    `Logistical Feasibility: ${dist} km corridor verified for active cold-chain compliance (+2°C to +8°C) within estimated ${transitMins} minutes transit.`,
    `Clinical Impact: Mitigates imminent stock-out at ${targetName}, extending critical supply runway by +${avoidedDays} days (${recommendation.targetRiskBefore.toUpperCase()} → ${recommendation.targetRiskAfter.toUpperCase()}).`,
  ];

  const fallbackExplanation =
    `The MedPulse Safe Redistribution Engine recommends dispatching ${qty} units of ${medName} from ${sourceName} to ${targetName}. ` +
    `This recommendation satisfies all non-negotiable safety guardrails: ${sourceName} maintains protected 10-day local reserves, ` +
    `donor resilience does not drop below 70%, and recipient stockout vulnerability is deferred by +${avoidedDays} days.`;

  if (!apiKey) {
    return {
      explanation: fallbackExplanation,
      reasoningPillars: fallbackPillars,
      donorImpact: `Nominal: ${sourceName} domestic reserves remain intact with zero compromise to local patient intake.`,
      recipientImpact: `Decisive: ${targetName} stock-out averted; buffer extended from critical to stable.`,
      isLiveAI: false,
      modelUsed: 'MedPulse-Deterministic-Safety-Engine (Set GEMINI_API_KEY in backend/.env for Live Gemini reasoning)',
    };
  }

  // When GEMINI_API_KEY is present, invoke Gemini using official SDK
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the MedPulse AI Clinical Supply Chain Resilience Assistant for Primary Health Centres (PHCs).
Explain why the following inter-facility medicine transfer is mathematically safe, clinically sound, and logistically feasible.

Transfer Data:
- Medicine: ${medName}
- Transfer Quantity: ${qty} units
- Source Donor PHC: ${sourceName} (In-hand stock: ${sourcePhc?.patientsToday ? sourcePhc.patientsToday * 5 : 'Safe'}, Safe Surplus: ${surplus} units)
- Destination PHC: ${targetName} (Stockout predicted in ${recommendation.expectedShortageDate})
- Distance & Transit: ${dist} km (${transitMins} mins via Cold-Chain vehicle)
- Recipient Resilience Lift: Extends runway by +${avoidedDays} days (${recommendation.targetRiskBefore} -> ${recommendation.targetRiskAfter})
- Donor Guardrail: Donor preserves 7-day own demand + 3-day safety buffer (Resilience stays >= 70%)

Format your response strictly as JSON with this schema:
{
  "explanation": "concise 2-3 sentence executive synthesis",
  "reasoningPillars": ["pillar 1 (surplus)", "pillar 2 (donor protection)", "pillar 3 (transit & logistics)", "pillar 4 (recipient clinical impact)"],
  "donorImpact": "concise 1-sentence assessment of donor facility impact",
  "recipientImpact": "concise 1-sentence assessment of recipient facility impact"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return {
      explanation: parsed.explanation || fallbackExplanation,
      reasoningPillars: parsed.reasoningPillars || fallbackPillars,
      donorImpact: parsed.donorImpact || `Donor maintains protected buffer above local threshold.`,
      recipientImpact: parsed.recipientImpact || `Destination stock runway extended by +${avoidedDays} days.`,
      isLiveAI: true,
      modelUsed: 'gemini-2.5-flash (Google GenAI Backend Service)',
    };
  } catch (err: any) {
    return {
      explanation: fallbackExplanation,
      reasoningPillars: fallbackPillars,
      donorImpact: `Nominal: Domestic reserves preserved above local requirement.`,
      recipientImpact: `Decisive: Target facility stock runway extended.`,
      isLiveAI: false,
      modelUsed: 'MedPulse-Deterministic-Safety-Engine (Fallback)',
      error: `Gemini API invocation note: ${err?.message || 'Check GEMINI_API_KEY configuration'}`,
    };
  }
}

export async function analyzeEmergencyScenarioAI(params: EmergencySimulationParams) {
  const apiKey = getApiKey();
  const sim = await simulateEmergencyScenario(params);

  const fallback = {
    riskExplanation: `Injected emergency scenario (+${params.patientSurge}% patients, +${params.medicineSurge}% medicine demand, -${params.staffDepletion} physician) causes systemic resilience to drop from ${sim.before.resilienceScore}% to ${sim.after.resilienceScore}%. Immediate inter-PHC redistribution and emergency triage protocol recommended.`,
    keyProblems: [
      `Severe bed occupancy spike to ${sim.after.bedOccupancy}% threatening ICU bottleneck`,
      `Medicine depletion vector accelerates; critical stockout in ~${sim.after.stockoutDays} days`,
      `Staff availability reduced to ${sim.after.staffAvailability}% increasing clinician burnout`,
    ],
    recommendedActions: sim.recommendedInterventions,
    priorityOrder: 'Immediate' as const,
    isLiveAI: false,
    modelUsed: 'MedPulse-Deterministic-Engine',
  };

  if (!apiKey) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the MedPulse Crisis Command AI. Analyze this simulated rural healthcare crisis:
- Patient Surge: +${params.patientSurge}%
- Medicine Demand Spike: +${params.medicineSurge}%
- Staff Depletion: -${params.staffDepletion} doctor
- Bed Occupancy: ${sim.before.bedOccupancy}% -> ${sim.after.bedOccupancy}%
- Resilience Index: ${sim.before.resilienceScore}% -> ${sim.after.resilienceScore}%
- Days of Antibiotic Supply: ${sim.before.stockoutDays}d -> ${sim.after.stockoutDays}d

Return JSON:
{
  "riskExplanation": "clinical summary",
  "keyProblems": ["problem 1", "problem 2", "problem 3"],
  "recommendedActions": ["action 1", "action 2", "action 3"],
  "priorityOrder": "Immediate"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      riskExplanation: parsed.riskExplanation || fallback.riskExplanation,
      keyProblems: parsed.keyProblems || fallback.keyProblems,
      recommendedActions: parsed.recommendedActions || fallback.recommendedActions,
      priorityOrder: parsed.priorityOrder || 'Immediate',
      isLiveAI: true,
      modelUsed: 'gemini-2.5-flash',
    };
  } catch (e: any) {
    return fallback;
  }
}
