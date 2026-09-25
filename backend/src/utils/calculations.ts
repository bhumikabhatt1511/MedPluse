import type { RiskLevel } from '../types/index.js';

/**
 * Deterministically calculates days of stock remaining.
 * Formula: daysOfStockRemaining = currentStock / dailyConsumption
 */
export function calculateDaysOfStockRemaining(
  currentStock: number,
  dailyConsumption: number
): number {
  if (dailyConsumption <= 0) return 999;
  if (currentStock <= 0) return 0;
  return Number((currentStock / dailyConsumption).toFixed(1));
}

/**
 * Classifies shortage risk based on days of stock remaining:
 * - CRITICAL: days <= 3
 * - HIGH RISK: 3 < days <= 7
 * - WARNING: 7 < days <= 14
 * - STABLE: days > 14
 */
export function calculateStockoutRisk(daysRemaining: number): RiskLevel {
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'high';
  if (daysRemaining <= 14) return 'warning';
  return 'stable';
}

/**
 * Deterministically projects the stock-out calendar date based on calculated days remaining.
 */
export function calculatePredictedStockoutDate(
  daysRemaining: number,
  baseDate: Date = new Date()
): string {
  if (daysRemaining >= 999) return 'Stable (>30 Days)';
  const targetDate = new Date(baseDate.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
  const formatted = targetDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${daysRemaining} Days (${formatted})`;
}

/**
 * Strict Safe-Surplus Rule (Phase 10):
 * expectedDemand7d = dailyConsumption * 7
 * safetyBuffer = dailyConsumption * 3
 * safeSurplus = max(0, currentStock - expectedDemand7d - safetyBuffer)
 *
 * Donor is eligible only if safeSurplus > 0.
 */
export function calculateSafeSurplus(
  currentStock: number,
  dailyConsumption: number,
  expectedDemandDays: number = 7,
  safetyBufferDays: number = 3
): {
  safeSurplus: number;
  isEligibleDonor: boolean;
  expectedDemand: number;
  safetyBuffer: number;
} {
  const expectedDemand = Math.round(dailyConsumption * expectedDemandDays);
  const safetyBuffer = Math.round(dailyConsumption * safetyBufferDays);
  const safeSurplus = Math.max(0, currentStock - expectedDemand - safetyBuffer);
  const isEligibleDonor = safeSurplus > 0;

  return {
    safeSurplus,
    isEligibleDonor,
    expectedDemand,
    safetyBuffer,
  };
}

/**
 * Calculates geographic distance in km using the Haversine formula between two coordinate pairs.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Dynamically calculates the required transfer quantity to restore target stock to a safe 10-day buffer.
 * Formula: requiredQuantity = (dailyConsumption * targetDaysBuffer) - currentStock
 */
export function calculateRequiredTransferQuantity(
  currentStock: number,
  dailyConsumption: number,
  targetDaysBuffer: number = 10
): number {
  const targetStock = Math.round(dailyConsumption * targetDaysBuffer);
  return Math.max(50, targetStock - currentStock);
}

/**
 * Verifies the Donor Protection Guardrail.
 * After any transfer: donor.currentStock >= donor.expectedDemand7d + donor.safetyBuffer
 */
export function verifyDonorProtection(
  donorStock: number,
  donorDaily: number,
  transferQuantity: number
): { isAllowed: boolean; error?: string | undefined } {
  const minRequiredReserve = Math.round(donorDaily * 10);
  const postStock = donorStock - transferQuantity;
  if (postStock < minRequiredReserve) {
    return {
      isAllowed: false,
      error: `Transfer blocked: donor safety threshold would be violated (Remaining ${postStock}u < Required ${minRequiredReserve}u).`,
    };
  }
  return { isAllowed: true };
}

export interface RiskAnalysis {
  score: number;
  severity: RiskLevel;
  resilienceScore: number;
  factors: {
    patientPressure: number;
    patientScore: number;
    patientStatus: 'Normal' | 'Elevated' | 'Surge';
    bedOccupancy: number;
    bedScore: number;
    bedStatus: 'Optimal' | 'Warning' | 'Critical';
    medicineRisk: 'low' | 'moderate' | 'high' | 'critical';
    medicineScore: number;
    staffRatio: number;
    staffScore: number;
    staffStatus: 'Full Roster' | 'Moderate Shortage' | 'Critical Shortage';
  };
  contributingFactors: string[];
  explanation: string;
}

/**
 * Core MedPulse Risk Engine Formula (Phase 9):
 * Risk Score = Patient Pressure * 0.25 + Bed Pressure * 0.25 + Medicine Pressure * 0.30 + Staff Pressure * 0.20
 *
 * Thresholds:
 * 0–39 = STABLE
 * 40–59 = WARNING
 * 60–79 = HIGH
 * 80–100 = CRITICAL
 */
export function calculatePHCRisk(
  patientPressureVariance: number,
  totalBeds: number,
  occupiedBeds: number,
  medicineRisk: 'low' | 'moderate' | 'high' | 'critical',
  doctorsScheduled: number,
  doctorsPresent: number,
  emergencyBedsAvailable: number = 0
): RiskAnalysis {
  const bedOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const staffRatio = doctorsScheduled > 0 ? Math.round((doctorsPresent / doctorsScheduled) * 100) : 100;

  // 1. Patient Pressure score (0-100 scale)
  let patientScore = 15;
  if (patientPressureVariance >= 35) patientScore = 95;
  else if (patientPressureVariance >= 25) patientScore = 80;
  else if (patientPressureVariance >= 15) patientScore = 60;
  else if (patientPressureVariance > 0) patientScore = 35;

  // 2. Bed Pressure score (0-100 scale)
  let bedScore = 15;
  if (bedOccupancy >= 92) bedScore = 95;
  else if (bedOccupancy >= 80) bedScore = 75;
  else if (bedOccupancy >= 65) bedScore = 50;

  // 3. Medicine Pressure score (0-100 scale)
  let medicineScore = 15;
  if (medicineRisk === 'critical') medicineScore = 95;
  else if (medicineRisk === 'high') medicineScore = 75;
  else if (medicineRisk === 'moderate') medicineScore = 45;

  // 4. Staff Pressure score (0-100 scale)
  let staffScore = 10;
  if (staffRatio <= 50) staffScore = 90;
  else if (staffRatio <= 75) staffScore = 60;
  else if (staffRatio < 100) staffScore = 30;

  // Composite Formula (Phase 9):
  const totalRiskScore = Math.round(
    patientScore * 0.25 +
    bedScore * 0.25 +
    medicineScore * 0.30 +
    staffScore * 0.20
  );

  let severity: RiskLevel = 'stable';
  if (totalRiskScore >= 80 || medicineRisk === 'critical' || bedOccupancy >= 92) {
    severity = 'critical';
  } else if (totalRiskScore >= 60) {
    severity = 'high';
  } else if (totalRiskScore >= 40) {
    severity = 'warning';
  } else {
    severity = 'stable';
  }

  const resilienceScore = Math.max(
    10,
    Math.min(99, 100 - totalRiskScore + (emergencyBedsAvailable > 1 ? 5 : -5))
  );

  const contributingFactors: string[] = [];
  if (medicineRisk === 'critical') contributingFactors.push('Critical medicine depletion (<3 days buffer remaining)');
  else if (medicineRisk === 'high') contributingFactors.push('High medicine stock-out risk (<7 days buffer)');

  if (bedOccupancy >= 85) contributingFactors.push(`Acute Bed Occupancy at ${bedOccupancy}%`);
  if (patientPressureVariance >= 20) contributingFactors.push(`Patient intake velocity +${patientPressureVariance}% above baseline`);
  if (staffRatio <= 65) contributingFactors.push(`Doctor presence depleted (${doctorsPresent}/${doctorsScheduled} on duty)`);

  const explanation = contributingFactors.length > 0
    ? contributingFactors.join(' • ')
    : 'All primary operational vectors nominal; domestic buffers intact.';

  return {
    score: totalRiskScore,
    severity,
    resilienceScore,
    factors: {
      patientPressure: patientPressureVariance,
      patientScore,
      patientStatus: patientPressureVariance > 25 ? 'Surge' : patientPressureVariance > 10 ? 'Elevated' : 'Normal',
      bedOccupancy,
      bedScore,
      bedStatus: bedOccupancy >= 90 ? 'Critical' : bedOccupancy >= 75 ? 'Warning' : 'Optimal',
      medicineRisk,
      medicineScore,
      staffRatio,
      staffScore,
      staffStatus: staffRatio <= 50 ? 'Critical Shortage' : staffRatio <= 75 ? 'Moderate Shortage' : 'Full Roster',
    },
    contributingFactors,
    explanation,
  };
}
