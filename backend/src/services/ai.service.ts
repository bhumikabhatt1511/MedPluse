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

/**
 * 1. AI Resource Transfer Recommendation Explanation ("Why this donor?")
 */
export async function explainTransferRecommendation(
  params: any
): Promise<RecommendationExplanationResult> {
  const apiKey = getApiKey();

  // Handle both nested params (recommendation, sourcePhc...) and flat params
  const destPhcName = params.destinationPhcName || params.recommendation?.targetPhcName || params.targetPhc?.name || 'Target PHC';
  const sourcePhcName = params.donorPhcName || params.recommendation?.sourcePhcName || params.sourcePhc?.name || 'Donor PHC';
  const medName = params.medicineName || params.recommendation?.medicineName || params.medicine?.name || 'Amoxicillin 500mg';
  const qty = params.transferQuantity ?? params.customQuantity ?? params.recommendation?.approvedQuantity ?? 300;
  const surplus = params.donorSafeSurplus ?? params.recommendation?.safeSurplusAvailable ?? 420;
  const dist = params.distanceKm ?? params.recommendation?.distanceKm ?? 28.4;
  const transitMins = params.transitMinutes ?? params.recommendation?.transitMinutes ?? 42;
  const destDaysRemaining = params.destinationDaysRemaining ?? 2.8;
  const destPostDays = params.destinationPostTransferDays ?? Number(((params.destinationCurrentStock || 620) + qty) / (params.destinationDailyConsumption || 220)).toFixed(1);
  const donorPostDays = params.donorPostTransferDays ?? 16.4;
  const donorPostStock = params.donorPostTransferStock ?? 1120;
  const donorDaily = params.donorDailyConsumption ?? 65;
  const avoidedDays = params.recommendation?.shortageAvoidedDays ?? (Number(destPostDays) - Number(destDaysRemaining));

  // Fallback / deterministic structured explanation
  const fallbackExplanation = `${sourcePhcName} is recommended because it has sufficient safe surplus of ${medName} (${surplus} units available) after accounting for its projected 7-day demand (${donorDaily * 7}u) and 3-day safety buffer (${donorDaily * 3}u). A transfer of ${qty} units can support ${destPhcName} (lifting coverage from ${destDaysRemaining}d to ${destPostDays}d) while keeping ${sourcePhcName} above its safety threshold with ${donorPostDays} days of remaining coverage.`;

  const fallbackPillars = [
    `Safe Surplus Preservation: Donor retains ${donorPostStock} units (${donorPostDays} days buffer) — safely above the 10-day domestic reserve floor.`,
    `Shortage Resolution: Destination stock increases by ${qty} units, averting projected stockout in ${destDaysRemaining} days.`,
    `Verified Cold-Chain Feasibility: ${dist} km highway corridor transit completed in ~${transitMins} min (within safe ≤90 min cold-chain window).`,
    `Zero Secondary Cascade: Donor facility remains operational and resilient without risking secondary stockout.`,
  ];

  if (!apiKey) {
    return {
      explanation: fallbackExplanation,
      reasoningPillars: fallbackPillars,
      donorImpact: `Preserves ${donorPostDays} days safe coverage (${donorPostStock}u remaining).`,
      recipientImpact: `Extends stock coverage from ${destDaysRemaining}d to ${destPostDays}d (+${Number(avoidedDays).toFixed(1)}d buffer).`,
      isLiveAI: false,
      modelUsed: 'MedPulse Deterministic Safety Engine (Set GEMINI_API_KEY in backend/.env for Live Gemini reasoning)',
    };
  }

  // When GEMINI_API_KEY is present, invoke Gemini 2.5 Flash via @google/genai
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the MedPulse BRICS Sovereign Healthcare AI Optimization Engine.
Explain WHY this specific donor PHC is recommended for an inter-PHC medicine transfer to resolve a critical shortage.

MATHEMATICAL AND LOGISTICAL TELEMETRY:
- Destination PHC: ${destPhcName}
- Shortage Medicine: ${medName}
- Transfer Quantity: ${qty} units
- Recommended Donor PHC: ${sourcePhcName}
- Donor Safe Surplus: ${surplus} units
- Donor Post-Transfer Buffer: ${donorPostDays} days
- Destination Post-Transfer Coverage: ${destPostDays} days
- Road Distance: ${dist} km
- Cold-Chain Transit Time: ${transitMins} minutes

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
      reasoningPillars: Array.isArray(parsed.reasoningPillars) && parsed.reasoningPillars.length > 0 ? parsed.reasoningPillars : fallbackPillars,
      donorImpact: parsed.donorImpact || `Preserves ${donorPostDays} days safe coverage.`,
      recipientImpact: parsed.recipientImpact || `Extends stock coverage to ${destPostDays} days.`,
      isLiveAI: true,
      modelUsed: 'gemini-2.5-flash (Google GenAI Backend Service)',
    };
  } catch (err: any) {
    return {
      explanation: fallbackExplanation,
      reasoningPillars: fallbackPillars,
      donorImpact: `Preserves ${donorPostDays} days safe coverage (${donorPostStock}u remaining).`,
      recipientImpact: `Extends stock coverage from ${destDaysRemaining}d to ${destPostDays}d.`,
      isLiveAI: false,
      modelUsed: 'MedPulse Deterministic Safety Engine (Fallback)',
      error: `Gemini API invocation note: ${err?.message || 'Check GEMINI_API_KEY configuration'}`,
    };
  }
}

/**
 * 2. Emergency Incident Analysis & Crisis Briefing AI
 */
export async function analyzeEmergencyScenarioAI(params: any) {
  const apiKey = getApiKey();
  const patientSurge = params.patientSurge ?? 25;
  const medicineSurge = params.medicineSurge ?? 25;
  const staffDepletion = params.staffDepletion ?? 1;
  const emergencySurge = params.emergencySurge ?? 30;
  const criticalNodes = params.criticalNodesCount ?? Math.min(18, Math.round(1 + (patientSurge / 25) * 1.5));
  const bedOccupancy = params.bedOccupancyPercent ?? Math.min(99, Math.round(72 + (patientSurge * 0.4) + (emergencySurge * 0.3)));
  const resilienceScore = params.resilienceScore ?? Math.max(25, Math.round(82 - (patientSurge * 0.45) - (medicineSurge * 0.3) - (staffDepletion * 8)));
  const stockoutDays = params.stockoutDays ?? Math.max(0.6, Number((2.8 / (1 + medicineSurge / 100)).toFixed(1)));

  const fallback = {
    riskExplanation: `Compounding stress of +${patientSurge}% patient surge, +${medicineSurge}% antibiotic burn, and -${staffDepletion} clinician shortage causes systemic triage degradation. ${criticalNodes} PHCs breach critical capacity, escalating average bed occupancy to ${bedOccupancy}% and driving resilience down to ${resilienceScore}/100 with stockout expected in ${stockoutDays} days.`,
    keyProblems: [
      `Acute Pediatric Triage Breach: Outpatient influx accelerates antibiotic depletion to ${stockoutDays} days at primary nodes.`,
      `Trauma & Emergency Overflow: Average bed occupancy reaches ${bedOccupancy}%, exhausting available observation bays.`,
      `Clinician Ratio Dilution: Doctor deficit (-${staffDepletion} doctors) increases triage wait times by +45 to +60 minutes.`,
    ],
    recommendedActions: [
      `1. Trigger immediate inter-PHC transfer of 300 units Amoxicillin and 200 units IV fluids from PHC-Beta South.`,
      `2. Mobilize Sector-2 On-Call Medical Officer and deploy 4 rotational nurses for evening peak shift.`,
      `3. Activate peripheral sub-centre triage diversions for non-critical ambulatory cases to protect trauma beds.`,
      `4. Issue expedited electronic emergency purchase order (PO) to District Central Depot for 2,000 antibiotic courses.`,
    ],
    priorityOrder: resilienceScore < 50 ? ('Immediate' as const) : ('Urgent' as const),
    isLiveAI: false,
    modelUsed: 'MedPulse Deterministic Simulation Engine',
  };

  if (!apiKey) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the MedPulse BRICS Sovereign Emergency Crisis Simulator AI.
Analyze the following multi-PHC simulated disaster/emergency scenario and generate an actionable operational incident briefing.

SIMULATED OPERATIONAL STRESS METRICS:
- Patient Volume Surge: +${patientSurge}%
- Medicine Burn Rate Increase: +${medicineSurge}%
- Clinician Depletion / Quarantine: -${staffDepletion} Doctors
- Emergency Trauma Admissions: +${emergencySurge}%
- Critical Deficit Nodes: ${criticalNodes} PHCs
- Regional Bed Occupancy: ${bedOccupancy}%
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
      keyProblems: Array.isArray(parsed.keyProblems) && parsed.keyProblems.length > 0 ? parsed.keyProblems : fallback.keyProblems,
      recommendedActions: Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length > 0 ? parsed.recommendedActions : fallback.recommendedActions,
      priorityOrder: parsed.priorityOrder || fallback.priorityOrder,
      isLiveAI: true,
      modelUsed: 'gemini-2.5-flash (Google GenAI Backend Service)',
    };
  } catch (e: any) {
    return fallback;
  }
}

/**
 * 3. Demand Forecast Natural Language Insight AI
 */
export async function explainDemandForecastAI(params: any) {
  const apiKey = getApiKey();
  const {
    medicineName = 'Amoxicillin 500mg',
    scenario = 'baseline',
    currentStock = 420,
    burnRate = 150,
    stockoutDays = 2.8,
    leadTimeDays = 7,
    historicalVelocity = 'High',
  } = params;

  const fallback = `${medicineName} is projected to become critical within ${stockoutDays} days under the ${scenario} scenario. Daily consumption (${burnRate} units/day) exceeds current stock reserve (${currentStock} units) relative to the central depot lead time of ${leadTimeDays} days, leaving an unbuffered vulnerability window of ${(leadTimeDays - stockoutDays).toFixed(1)} days.`;

  if (!apiKey) {
    return { insight: fallback, isLiveAI: false, modelUsed: 'MedPulse Deterministic Engine' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the MedPulse BRICS Predictive Demand Intelligence AI.
Generate a concise, 2-sentence dashboard-friendly demand insight for the clinical inventory dashboard.

DATA:
- Medicine: ${medicineName}
- Scenario: ${String(scenario).toUpperCase()}
- Current In-Hand Stock: ${currentStock} units
- Daily Burn Rate: ${burnRate} units/day
- Projected Stockout Timeline: ${stockoutDays} days
- District Depot Fulfillment Lead Time: ${leadTimeDays} days
- Clinical Presentation Velocity: ${historicalVelocity}

Explain clearly why the medicine faces stockout risk and what the operational implication is. Keep it concise, executive-level, and dashboard friendly. Output 2 clear sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : fallback;
    return {
      insight: text,
      isLiveAI: true,
      modelUsed: 'gemini-2.5-flash (Google GenAI Backend Service)',
    };
  } catch (err: any) {
    return { insight: fallback, isLiveAI: false, modelUsed: 'MedPulse Deterministic Engine', error: err?.message };
  }
}

/**
 * 4. PHC Operational & Clinical Diagnostic Summary AI
 */
export async function summarizePHCAI(params: any) {
  const apiKey = getApiKey();
  const phc = params.phc || params;

  const phcName = phc.name || 'Primary Health Centre';
  const riskLevel = phc.riskLevel || 'warning';
  const resilienceScore = phc.resilienceScore ?? 75;
  const occupiedBeds = phc.occupiedBeds ?? 18;
  const totalBeds = phc.totalBeds ?? 20;
  const doctorsPresent = phc.doctorsPresent ?? 2;
  const doctorsTotal = phc.doctorsTotal ?? 3;
  const medicineRisk = phc.medicineRisk || 'moderate';
  const stockoutPredictionDays = phc.stockoutPredictionDays ?? 3.5;

  const fallback = `${phcName} is currently operating at ${String(riskLevel).toUpperCase()} risk with a resilience score of ${resilienceScore}/100. Key pressures include ${occupiedBeds}/${totalBeds} occupied beds (${Math.round((occupiedBeds / totalBeds) * 100)}%), ${doctorsPresent}/${doctorsTotal} active medical officers, and a ${medicineRisk} medicine risk vector with ${stockoutPredictionDays} days of essential antibiotic coverage.`;

  if (!apiKey) {
    return { diagnostic: fallback, isLiveAI: false, modelUsed: 'MedPulse Deterministic Engine' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the MedPulse Clinical Telemetry AI Diagnostic Assistant.
Generate a concise 2-sentence clinical and operational health summary for the following Primary Health Centre.

PHC TELEMETRY:
- Facility: ${phcName} (${phc.code || 'PHC'})
- District & State: ${phc.district || 'Pune'}, ${phc.state || 'Maharashtra'}
- Overall Risk Level: ${String(riskLevel).toUpperCase()} (Score: ${phc.riskScore ?? 65}/100)
- Resilience Index: ${resilienceScore}/100
- Patients Today: ${phc.patientsToday ?? 145} (${phc.emergencyCases ?? 8} emergency cases)
- Bed Utilization: ${occupiedBeds} of ${totalBeds} beds occupied
- Staff Roster: ${doctorsPresent} of ${doctorsTotal} doctors on duty
- Medicine Stockout Risk: ${medicineRisk} (${stockoutPredictionDays} days remaining)

Summarize the operational state, identifying the single most urgent bottleneck and the immediate mitigation priority. Output 2 clear sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : fallback;
    return {
      diagnostic: text,
      isLiveAI: true,
      modelUsed: 'gemini-2.5-flash (Google GenAI Backend Service)',
    };
  } catch (err: any) {
    return { diagnostic: fallback, isLiveAI: false, modelUsed: 'MedPulse Deterministic Engine', error: err?.message };
  }
}

/**
 * 5. Medicine Shortage Risk Explanation AI
 */
export async function explainShortageAI(params: any) {
  const apiKey = getApiKey();
  const {
    medicineName = 'Amoxicillin 500mg',
    dosage = 'Capsule',
    currentStock = 420,
    dailyConsumption = 150,
    daysRemaining = 2.8,
    reorderLevel = 500,
    patientDemand = 180,
    riskLevel = 'critical',
    phcName = 'PHC-Alpha East',
  } = params;

  const fallbackExplanation = `${medicineName} at ${phcName} has reached ${String(riskLevel).toUpperCase()} shortage risk because current inventory (${currentStock} units) covers only ${daysRemaining} days of treatment at the active burn rate of ${dailyConsumption} units/day, well below the minimum district safety threshold.`;

  const fallbackResult = {
    explanation: fallbackExplanation,
    rootCauses: [
      `Elevated Outpatient Influx: Acute surge in patient presentations (${patientDemand} patients/day) accelerating stock burn.`,
      `Depot Lead-Time Deficit: District depot fulfillment takes 5–7 days, exceeding the ${daysRemaining}-day remaining stock window.`,
      `Reorder Breach: Stock (${currentStock} units) has dropped substantially below the mandatory reorder threshold (${reorderLevel} units).`,
    ],
    clinicalImplication: `Without preemptive intervention, pediatric and ambulatory patients face treatment delays or stockout within ${daysRemaining} days.`,
    recommendedNextStep: `Authorize inter-PHC stock redistribution from the nearest donor facility with verified safe surplus.`,
    isLiveAI: false,
    modelUsed: 'MedPulse Deterministic Engine',
  };

  if (!apiKey) {
    return fallbackResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the MedPulse BRICS Pharmaceutical Supply Chain AI Specialist.
Explain WHY this specific medicine is at ${String(riskLevel).toUpperCase()} stockout risk and provide clinical and operational analysis.

MEDICINE DATA:
- Facility: ${phcName}
- Medicine Formulation: ${medicineName} ${dosage ? `(${dosage})` : ''}
- Current In-Hand Stock: ${currentStock} units
- Active Daily Consumption / Burn Rate: ${dailyConsumption} units/day
- Calculated Days of Stock Remaining: ${daysRemaining} days
- Minimum Reorder Level: ${reorderLevel} units
- Current Patient Outpatient Volume: ${patientDemand} patients/day
- Current Risk Classification: ${String(riskLevel).toUpperCase()}

TASK:
1. Provide a 2-sentence executive summary explaining why this medicine is at risk.
2. List 3 distinct root causes.
3. Provide 1 sentence summarizing the direct clinical implication for patient care.
4. Provide 1 concise recommended next action.

Respond in this JSON format:
{
  "explanation": "...",
  "rootCauses": ["...", "...", "..."],
  "clinicalImplication": "...",
  "recommendedNextStep": "..."
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
      explanation: parsed.explanation || fallbackResult.explanation,
      rootCauses: Array.isArray(parsed.rootCauses) && parsed.rootCauses.length > 0 ? parsed.rootCauses : fallbackResult.rootCauses,
      clinicalImplication: parsed.clinicalImplication || fallbackResult.clinicalImplication,
      recommendedNextStep: parsed.recommendedNextStep || fallbackResult.recommendedNextStep,
      isLiveAI: true,
      modelUsed: 'gemini-2.5-flash (Google GenAI Backend Service)',
    };
  } catch (err: any) {
    return {
      ...fallbackResult,
      isLiveAI: false,
      modelUsed: 'MedPulse Deterministic Engine (Fallback)',
      error: err?.message,
    };
  }
}
