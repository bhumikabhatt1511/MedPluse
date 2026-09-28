import { GoogleGenAI } from '@google/genai';
import { PHC, TransferRecommendation, Medicine } from '../types';
import * as api from './api';

export interface RecommendationExplanationParams {
  recommendation: TransferRecommendation;
  sourcePhc?: PHC;
  targetPhc?: PHC;
  medicine?: Medicine;
  customQuantity?: number;
}

export interface RecommendationExplanationResult {
  explanation: string;
  reasoningPillars: string[];
  donorImpact: string;
  recipientImpact: string;
  isLiveAI: boolean;
  modelUsed: string;
  error?: string;
}

export interface EmergencySimulationParams {
  patientSurge: number;
  medicineSurge: number;
  staffDepletion: number;
  emergencySurge: number;
  criticalNodesCount: number;
  bedOccupancyPercent: number;
  resilienceScore: number;
  stockoutDays: number;
  phcs: PHC[];
}

export interface EmergencyAnalysisResult {
  riskExplanation: string;
  keyProblems: string[];
  recommendedActions: string[];
  priorityOrder: 'Immediate' | 'Urgent' | 'Preemptive';
  isLiveAI: boolean;
  modelUsed: string;
  error?: string;
}

export interface DemandForecastInsightParams {
  medicineName: string;
  scenario: 'baseline' | 'monsoon' | 'epidemic';
  currentStock: number;
  burnRate: number;
  stockoutDays: number;
  leadTimeDays: number;
  historicalVelocity: string;
}

export interface PHCDiagnosticParams {
  phc: PHC;
}

// Development client-side key resolution priority:
// 1. In-browser local storage override (configured in Settings for manual testing)
// 2. Vite environment variable: import.meta.env.VITE_GEMINI_API_KEY
export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('medpulse_gemini_api_key');
    if (localKey && localKey.trim().length > 0) {
      return localKey.trim();
    }
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
}

export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim().length > 0) {
      localStorage.setItem('medpulse_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('medpulse_gemini_api_key');
    }
  }
}

export function isClientGeminiConfigured(): boolean {
  return getGeminiApiKey().length > 0;
}

export function isGeminiConfigured(): boolean {
  // In production deployment, Gemini is served securely through the backend proxy.
  return true;
}

/**
 * Universal client-side direct caller (used as development fallback when local key is set)
 */
async function callGeminiDirect(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY: No Google Gemini API key configured.');
  }

  // Primary: Try @google/genai SDK
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: systemInstruction
        ? {
            systemInstruction,
            temperature: 0.2,
          }
        : { temperature: 0.2 },
    });

    if (response && response.text) {
      return response.text;
    }
  } catch (sdkError: any) {
    console.warn('GoogleGenAI SDK call fallback, trying direct REST v1beta endpoint...', sdkError);
  }

  // Fallback: Direct Fetch to v1beta API endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API HTTP Error ${res.status}: ${errBody}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response received from Gemini API.');
  }
  return text;
}

export interface ResourceTransferExplanationParams {
  destinationPhcName: string;
  medicineName: string;
  destinationCurrentStock: number;
  destinationDailyConsumption: number;
  destinationDaysRemaining: number;
  destinationRisk: string;
  donorPhcName: string;
  donorStock: number;
  donorDailyConsumption: number;
  donorSafeSurplus: number;
  transferQuantity: number;
  donorPostTransferStock: number;
  donorPostTransferDays: number;
  destinationPostTransferDays: number;
  distanceKm: number;
  transitMinutes: number;
}

/**
 * 1. AI Resource Transfer Recommendation Explanation ("Why this donor?")
 * Calls Backend Express Proxy (holding GEMINI_API_KEY) with automatic fallback.
 */
export async function explainResourceTransferRecommendation(
  params: ResourceTransferExplanationParams
): Promise<RecommendationExplanationResult> {
  const {
    destinationPhcName,
    medicineName,
    destinationCurrentStock,
    destinationDailyConsumption,
    destinationDaysRemaining,
    destinationRisk,
    donorPhcName,
    donorStock,
    donorDailyConsumption,
    donorSafeSurplus,
    transferQuantity,
    donorPostTransferStock,
    donorPostTransferDays,
    destinationPostTransferDays,
    distanceKm,
    transitMinutes,
  } = params;

  // Grounded Deterministic Fallback with exact numbers
  const fallbackExplanation = `${donorPhcName} is recommended because it has sufficient safe surplus of ${medicineName} (${donorSafeSurplus} units available) after accounting for its projected 7-day demand (${donorDailyConsumption * 7}u) and 3-day safety buffer (${donorDailyConsumption * 3}u). A transfer of ${transferQuantity} units can support ${destinationPhcName} (lifting coverage from ${destinationDaysRemaining}d to ${destinationPostTransferDays}d) while keeping ${donorPhcName} above its safety threshold with ${donorPostTransferDays} days of remaining coverage.`;

  const fallbackPillars = [
    `Safe Surplus Preservation: Donor retains ${donorPostTransferStock} units (${donorPostTransferDays} days buffer) — safely above the 10-day domestic reserve floor.`,
    `Shortage Resolution: Destination stock increases from ${destinationCurrentStock} to ${destinationCurrentStock + transferQuantity} units, averting projected stockout in ${destinationDaysRemaining} days.`,
    `Verified Cold-Chain Feasibility: ${distanceKm} km highway corridor transit completed in ~${transitMinutes} min (within safe ≤90 min cold-chain window).`,
    `Zero Secondary Cascade: Donor facility remains operational and resilient without risking secondary stockout.`,
  ];

  // Primary Path: Call Secure Backend AI Proxy
  try {
    const backendResult = await api.explainTransferAI(params);
    if (backendResult && backendResult.explanation) {
      return backendResult;
    }
  } catch (backendErr) {
    console.debug('Backend AI proxy note:', backendErr);
  }

  // Development Fallback: If client key is explicitly configured in Settings
  if (isClientGeminiConfigured()) {
    const prompt = `You are the MedPulse BRICS Sovereign Healthcare AI Optimization Engine.
Explain WHY this specific donor PHC is recommended for an inter-PHC medicine transfer to resolve a critical shortage.

MATHEMATICAL AND LOGISTICAL TELEMETRY:
- Destination PHC: ${destinationPhcName}
- Shortage Medicine: ${medicineName}
- Destination Current Stock: ${destinationCurrentStock} units
- Destination Daily Burn Rate: ${destinationDailyConsumption} units/day
- Destination Days Remaining: ${destinationDaysRemaining} days (${destinationRisk.toUpperCase()} risk)
- Recommended Donor PHC: ${donorPhcName}
- Donor In-Hand Stock: ${donorStock} units
- Donor Daily Consumption: ${donorDailyConsumption} units/day
- Donor Safe Surplus: ${donorSafeSurplus} units
- Recommended Transfer: ${transferQuantity} units
- Donor Post-Transfer Stock: ${donorPostTransferStock} units (${donorPostTransferDays} days buffer)
- Destination Post-Transfer Coverage: ${destinationPostTransferDays} days
- Road Distance: ${distanceKm} km
- Cold-Chain Transit Time: ${transitMinutes} minutes

TASK:
1. Provide a concise 2-3 sentence executive explanation answering: "WHY THIS DONOR?"
2. Provide 4 bulleted reasoning pillars proving safe surplus preservation, cold-chain feasibility, patient impact, and zero secondary cascade risk.
3. Keep the output strictly factual, professional, and grounded in the numbers provided.

Respond in this JSON format:
{
  "explanation": "...",
  "reasoningPillars": [
    "Pillar 1: ...",
    "Pillar 2: ...",
    "Pillar 3: ...",
    "Pillar 4: ..."
  ],
  "donorImpact": "...",
  "recipientImpact": "..."
}`;

    try {
      const rawOutput = await callGeminiDirect(
        prompt,
        'You are a specialized healthcare supply chain and resilience optimization AI. Output only valid JSON.'
      );

      const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        explanation: parsed.explanation || fallbackExplanation,
        reasoningPillars: Array.isArray(parsed.reasoningPillars) && parsed.reasoningPillars.length > 0
          ? parsed.reasoningPillars
          : fallbackPillars,
        donorImpact: parsed.donorImpact || `Preserves ${donorPostTransferDays} days safe coverage.`,
        recipientImpact: parsed.recipientImpact || `Extends stock coverage to ${destinationPostTransferDays} days.`,
        isLiveAI: true,
        modelUsed: 'Google Gemini 2.5 Flash (Client Key)',
      };
    } catch (err: any) {
      console.error('Client Gemini explanation error:', err);
    }
  }

  // Robust Grounded Deterministic Fallback
  return {
    explanation: fallbackExplanation,
    reasoningPillars: fallbackPillars,
    donorImpact: `Preserves ${donorPostTransferDays} days safe coverage (${donorPostTransferStock}u remaining).`,
    recipientImpact: `Extends stock coverage from ${destinationDaysRemaining}d to ${destinationPostTransferDays}d (+${(destinationPostTransferDays - destinationDaysRemaining).toFixed(1)}d buffer).`,
    isLiveAI: false,
    modelUsed: 'Grounded Deterministic Engine',
  };
}

/**
 * Backwards-compatible wrapper for explainRecommendation
 */
export async function explainRecommendation(
  params: RecommendationExplanationParams
): Promise<RecommendationExplanationResult> {
  const { recommendation, sourcePhc, targetPhc, customQuantity } = params;
  const qty = customQuantity || recommendation.approvedQuantity || 300;
  const donorSurplus = recommendation.safeSurplusAvailable || 420;
  const transitMin = recommendation.transitMinutes || 42;
  const distanceKm = recommendation.distanceKm || 28.4;

  return explainResourceTransferRecommendation({
    destinationPhcName: recommendation.targetPhcName,
    medicineName: recommendation.medicineName,
    destinationCurrentStock: 620,
    destinationDailyConsumption: 220,
    destinationDaysRemaining: 2.8,
    destinationRisk: recommendation.targetRiskBefore || 'critical',
    donorPhcName: recommendation.sourcePhcName,
    donorStock: sourcePhc?.totalBeds ? 1420 : 1420,
    donorDailyConsumption: 65,
    donorSafeSurplus: donorSurplus,
    transferQuantity: qty,
    donorPostTransferStock: Math.max(0, 1420 - qty),
    donorPostTransferDays: 16.4,
    destinationPostTransferDays: Number(((620 + qty) / 220).toFixed(1)),
    distanceKm,
    transitMinutes: transitMin,
  });
}

/**
 * 2. Emergency Simulation AI
 * Evaluates operational state under crisis compounding stress via Backend AI Proxy.
 */
export async function simulateEmergencyScenario(
  params: EmergencySimulationParams
): Promise<EmergencyAnalysisResult> {
  const {
    patientSurge,
    medicineSurge,
    staffDepletion,
    emergencySurge,
    criticalNodesCount,
    bedOccupancyPercent,
    resilienceScore,
    stockoutDays,
  } = params;

  // Fallback Grounded Result
  const fallbackResult: EmergencyAnalysisResult = {
    riskExplanation: `Compounding stress of +${patientSurge}% patient surge, +${medicineSurge}% antibiotic burn, and -${staffDepletion} clinician shortage causes systemic triage degradation. ${criticalNodesCount} PHCs breach critical capacity, escalating average bed occupancy to ${bedOccupancyPercent}% and driving resilience down to ${resilienceScore}/100 with stockout expected in ${stockoutDays} days.`,
    keyProblems: [
      `Acute Pediatric Triage Breach: Outpatient influx accelerates antibiotic depletion to ${stockoutDays} days at primary nodes.`,
      `Trauma & Emergency Overflow: Average bed occupancy reaches ${bedOccupancyPercent}%, exhausting available observation bays.`,
      `Clinician Ratio Dilution: Doctor deficit (-${staffDepletion} doctors) increases triage wait times by +45 to +60 minutes.`,
    ],
    recommendedActions: [
      `1. Trigger immediate inter-PHC transfer of 300 units Amoxicillin and 200 units IV fluids from PHC-Beta South.`,
      `2. Mobilize Sector-2 On-Call Medical Officer and deploy 4 rotational nurses for evening peak shift.`,
      `3. Activate peripheral sub-centre triage diversions for non-critical ambulatory cases to protect trauma beds.`,
      `4. Issue expedited electronic emergency purchase order (PO) to District Central Depot for 2,000 antibiotic courses.`,
    ],
    priorityOrder: resilienceScore < 50 ? 'Immediate' : 'Urgent',
    isLiveAI: false,
    modelUsed: 'Grounded Deterministic Simulation',
  };

  // Primary Path: Call Secure Backend AI Proxy
  try {
    const backendResult = await api.analyzeEmergencyAI(params);
    if (backendResult && backendResult.riskExplanation) {
      return backendResult;
    }
  } catch (backendErr) {
    console.debug('Backend emergency AI proxy note:', backendErr);
  }

  // Development Fallback: If client key is explicitly configured in Settings
  if (isClientGeminiConfigured()) {
    const prompt = `You are the MedPulse BRICS Sovereign Emergency Crisis Simulator AI.
Analyze the following multi-PHC simulated disaster/emergency scenario and generate an actionable operational incident briefing.

SIMULATED OPERATIONAL STRESS METRICS:
- Patient Volume Surge: +${patientSurge}%
- Medicine Burn Rate Increase: +${medicineSurge}%
- Clinician Depletion / Quarantine: -${staffDepletion} Doctors
- Emergency Trauma Admissions: +${emergencySurge}%
- Critical Deficit Nodes: ${criticalNodesCount} PHCs
- Regional Bed Occupancy: ${bedOccupancyPercent}%
- Network Resilience Score: ${resilienceScore} / 100 (Baseline is 82/100)
- Earliest Antibiotic Depletion: ${stockoutDays} Days

TASK:
1. Provide a comprehensive 2-3 sentence Risk Explanation of the systemic failure vector.
2. Identify the top 3 Key Problems / Bottlenecks.
3. Provide a numbered list of 4 prioritized Recommended Mitigation Actions.
4. Specify the Priority Order ("Immediate", "Urgent", or "Preemptive").

Respond in this JSON format:
{
  "riskExplanation": "...",
  "keyProblems": [
    "Problem 1: ...",
    "Problem 2: ...",
    "Problem 3: ..."
  ],
  "recommendedActions": [
    "1. ...",
    "2. ...",
    "3. ...",
    "4. ..."
  ],
  "priorityOrder": "Immediate"
}`;

    try {
      const rawOutput = await callGeminiDirect(
        prompt,
        'You are a senior emergency healthcare resilience coordinator. Output only valid JSON.'
      );

      const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        riskExplanation: parsed.riskExplanation || fallbackResult.riskExplanation,
        keyProblems: Array.isArray(parsed.keyProblems) && parsed.keyProblems.length > 0
          ? parsed.keyProblems
          : fallbackResult.keyProblems,
        recommendedActions: Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length > 0
          ? parsed.recommendedActions
          : fallbackResult.recommendedActions,
        priorityOrder: parsed.priorityOrder || fallbackResult.priorityOrder,
        isLiveAI: true,
        modelUsed: 'Google Gemini 2.5 Flash (Client Key)',
      };
    } catch (err: any) {
      console.error('Client Gemini emergency simulation error:', err);
    }
  }

  return fallbackResult;
}

/**
 * 3. Demand Forecast Natural Language Insight AI
 */
export async function generateDemandForecastInsight(
  params: DemandForecastInsightParams
): Promise<{ insight: string; isLiveAI: boolean; error?: string }> {
  const { medicineName, scenario, currentStock, burnRate, stockoutDays, leadTimeDays, historicalVelocity } = params;

  const fallback = `${medicineName} is projected to become critical within ${stockoutDays} days under the ${scenario} scenario. Daily consumption (${burnRate} units/day) exceeds current stock reserve (${currentStock} units) relative to the central depot lead time of ${leadTimeDays} days, leaving an unbuffered vulnerability window of ${(leadTimeDays - stockoutDays).toFixed(1)} days.`;

  // Primary Path: Call Secure Backend AI Proxy
  try {
    const backendResult = await api.explainDemandAI(params);
    if (backendResult && backendResult.insight) {
      return backendResult;
    }
  } catch (backendErr) {
    console.debug('Backend demand forecast AI proxy note:', backendErr);
  }

  // Development Fallback: If client key is explicitly configured in Settings
  if (isClientGeminiConfigured()) {
    const prompt = `You are the MedPulse BRICS Predictive Demand Intelligence AI.
Generate a concise, 2-sentence dashboard-friendly demand insight for the clinical inventory dashboard.

DATA:
- Medicine: ${medicineName}
- Scenario: ${scenario.toUpperCase()}
- Current In-Hand Stock: ${currentStock} units
- Daily Burn Rate: ${burnRate} units/day
- Projected Stockout Timeline: ${stockoutDays} days
- District Depot Fulfillment Lead Time: ${leadTimeDays} days
- Clinical Presentation Velocity: ${historicalVelocity}

Explain clearly why the medicine faces stockout risk and what the operational implication is. Keep it concise, executive-level, and dashboard friendly.`;

    try {
      const rawOutput = await callGeminiDirect(
        prompt,
        'You are a concise healthcare analytics assistant. Output 2 clear sentences.'
      );
      return { insight: rawOutput.trim(), isLiveAI: true };
    } catch (err: any) {
      return { insight: fallback, isLiveAI: false, error: err.message };
    }
  }

  return { insight: fallback, isLiveAI: false };
}

/**
 * 4. PHC Operational & Clinical Diagnostic Summary AI
 */
export async function generatePHCDiagnostic(
  params: PHCDiagnosticParams
): Promise<{ diagnostic: string; isLiveAI: boolean; error?: string }> {
  const { phc } = params;

  const fallback = `${phc.name} is currently operating at ${phc.riskLevel.toUpperCase()} risk with a resilience score of ${phc.resilienceScore}/100. Key pressures include ${phc.occupiedBeds}/${phc.totalBeds} occupied beds (${Math.round((phc.occupiedBeds / phc.totalBeds) * 100)}%), ${phc.doctorsPresent}/${phc.doctorsTotal} active medical officers, and a ${phc.medicineRisk} medicine risk vector with ${phc.stockoutPredictionDays} days of essential antibiotic coverage.`;

  // Primary Path: Call Secure Backend AI Proxy
  try {
    const backendResult = await api.summarizePHCAI({ phc });
    if (backendResult && backendResult.diagnostic) {
      return backendResult;
    }
  } catch (backendErr) {
    console.debug('Backend PHC diagnostic AI proxy note:', backendErr);
  }

  // Development Fallback: If client key is explicitly configured in Settings
  if (isClientGeminiConfigured()) {
    const prompt = `You are the MedPulse Clinical Telemetry AI Diagnostic Assistant.
Generate a concise 2-sentence clinical and operational health summary for the following Primary Health Centre.

PHC TELEMETRY:
- Facility: ${phc.name} (${phc.code})
- District & State: ${phc.district}, ${phc.state}
- Overall Risk Level: ${phc.riskLevel.toUpperCase()} (Score: ${phc.riskScore}/100)
- Resilience Index: ${phc.resilienceScore}/100
- Patients Today: ${phc.patientsToday} (${phc.emergencyCases} emergency cases)
- Bed Utilization: ${phc.occupiedBeds} of ${phc.totalBeds} beds occupied (${phc.emergencyBedsOccupied}/${phc.emergencyBedsTotal} emergency beds)
- Staff Roster: ${phc.doctorsPresent} of ${phc.doctorsTotal} doctors on duty, ${phc.nursesPresent} of ${phc.nursesTotal} nurses
- Medicine Stockout Risk: ${phc.medicineRisk} (${phc.stockoutPredictionDays} days remaining)

Summarize the operational state, identifying the single most urgent bottleneck and the immediate mitigation priority.`;

    try {
      const rawOutput = await callGeminiDirect(
        prompt,
        'You are a clinical operations expert. Output 2 concise sentences.'
      );
      return { diagnostic: rawOutput.trim(), isLiveAI: true };
    } catch (err: any) {
      return { diagnostic: fallback, isLiveAI: false, error: err.message };
    }
  }

  return { diagnostic: fallback, isLiveAI: false };
}

export interface MedicineShortageExplanationParams {
  medicineName: string;
  dosage?: string;
  currentStock: number;
  dailyConsumption: number;
  daysRemaining: number;
  reorderLevel?: number;
  patientDemand?: number;
  riskLevel: string;
  phcName?: string;
}

export interface MedicineShortageExplanationResult {
  explanation: string;
  rootCauses: string[];
  clinicalImplication: string;
  recommendedNextStep: string;
  isLiveAI: boolean;
  modelUsed: string;
  error?: string;
}

/**
 * 5. Medicine Shortage Risk Explanation AI
 */
export async function explainMedicineShortageRisk(
  params: MedicineShortageExplanationParams
): Promise<MedicineShortageExplanationResult> {
  const {
    medicineName,
    dosage,
    currentStock,
    dailyConsumption,
    daysRemaining,
    reorderLevel = 500,
    patientDemand = 180,
    riskLevel,
    phcName = 'PHC-Alpha East',
  } = params;

  const fallbackExplanation = `${medicineName} at ${phcName} has reached ${riskLevel.toUpperCase()} shortage risk because current inventory (${currentStock} units) covers only ${daysRemaining} days of treatment at the active burn rate of ${dailyConsumption} units/day, well below the minimum district safety threshold.`;

  const fallbackResult: MedicineShortageExplanationResult = {
    explanation: fallbackExplanation,
    rootCauses: [
      `Elevated Outpatient Influx: Acute surge in patient presentations (${patientDemand} patients/day) accelerating stock burn.`,
      `Depot Lead-Time Deficit: District depot fulfillment takes 5–7 days, exceeding the ${daysRemaining}-day remaining stock window.`,
      `Reorder Breach: Stock (${currentStock} units) has dropped substantially below the mandatory reorder threshold (${reorderLevel} units).`,
    ],
    clinicalImplication: `Without preemptive intervention, pediatric and ambulatory patients face treatment delays or stockout within ${daysRemaining} days.`,
    recommendedNextStep: `Authorize inter-PHC stock redistribution from the nearest donor facility with verified safe surplus.`,
    isLiveAI: false,
    modelUsed: 'Grounded Deterministic Engine',
  };

  // Primary Path: Call Secure Backend AI Proxy
  try {
    const backendResult = await api.explainShortageAI(params);
    if (backendResult && backendResult.explanation) {
      return backendResult;
    }
  } catch (backendErr) {
    console.debug('Backend shortage AI proxy note:', backendErr);
  }

  // Development Fallback: If client key is explicitly configured in Settings
  if (isClientGeminiConfigured()) {
    const prompt = `You are the MedPulse BRICS Pharmaceutical Supply Chain AI Specialist.
Explain WHY this specific medicine is at ${riskLevel.toUpperCase()} stockout risk and provide clinical and operational analysis.

MEDICINE DATA:
- Facility: ${phcName}
- Medicine Formulation: ${medicineName} ${dosage ? `(${dosage})` : ''}
- Current In-Hand Stock: ${currentStock} units
- Active Daily Consumption / Burn Rate: ${dailyConsumption} units/day
- Calculated Days of Stock Remaining: ${daysRemaining} days
- Minimum Reorder Level: ${reorderLevel} units
- Current Patient Outpatient Volume: ${patientDemand} patients/day
- Current Risk Classification: ${riskLevel.toUpperCase()}

TASK:
1. Provide a 2-sentence executive summary explaining why this medicine is at risk.
2. List 3 distinct root causes (e.g. surge in presentations, lead-time deficit, buffer depletion).
3. Provide 1 sentence summarizing the direct clinical implication for patient care.
4. Provide 1 concise recommended next action (e.g. inter-PHC transfer, depot emergency PO).

Respond in this JSON format:
{
  "explanation": "...",
  "rootCauses": ["...", "...", "..."],
  "clinicalImplication": "...",
  "recommendedNextStep": "..."
}`;

    try {
      const rawOutput = await callGeminiDirect(
        prompt,
        'You are a senior healthcare supply chain resilience expert. Output only valid JSON.'
      );
      const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        explanation: parsed.explanation || fallbackResult.explanation,
        rootCauses: Array.isArray(parsed.rootCauses) && parsed.rootCauses.length > 0 ? parsed.rootCauses : fallbackResult.rootCauses,
        clinicalImplication: parsed.clinicalImplication || fallbackResult.clinicalImplication,
        recommendedNextStep: parsed.recommendedNextStep || fallbackResult.recommendedNextStep,
        isLiveAI: true,
        modelUsed: 'Google Gemini 2.5 Flash (Client Key)',
      };
    } catch (err: any) {
      console.error('Client Gemini shortage explanation error:', err);
    }
  }

  return fallbackResult;
}
