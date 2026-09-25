import { PHC, RiskLevel } from '../types';

export interface RiskAnalysis {
  overallRisk: RiskLevel;
  overallScore: number;
  resilienceScore: number;
  factors: {
    patientPressurePercent: number;
    patientPressureStatus: 'Normal' | 'Elevated' | 'Surge';
    bedOccupancyPercent: number;
    bedPressureStatus: 'Optimal' | 'Warning' | 'Critical';
    medicineRisk: 'low' | 'moderate' | 'high' | 'critical';
    staffAvailabilityPercent: number;
    staffPressureStatus: 'Full Roster' | 'Moderate Shortage' | 'Critical Shortage';
  };
  summaryReason: string;
  contributingDrivers: string[];
}

export function calculateRiskEngine(phc: PHC): RiskAnalysis {
  const patientPressure = phc.pressures.patient;
  const bedOccupancy = Math.round((phc.occupiedBeds / phc.totalBeds) * 100);
  const staffRatio = Math.round((phc.doctorsPresent / phc.doctorsTotal) * 100);
  const medRisk = phc.medicineRisk;

  // Weightings for Healthcare Command Centre:
  // Medicine Availability (35%), Bed Pressure (30%), Patient Surge (20%), Staff Availability (15%)
  let medScore = 15;
  if (medRisk === 'moderate') medScore = 45;
  if (medRisk === 'high') medScore = 75;
  if (medRisk === 'critical') medScore = 95;

  let bedScore = 10;
  if (bedOccupancy >= 90) bedScore = 95;
  else if (bedOccupancy >= 80) bedScore = 75;
  else if (bedOccupancy >= 65) bedScore = 45;

  let patientScore = 10;
  if (patientPressure >= 30) patientScore = 90;
  else if (patientPressure >= 15) patientScore = 65;
  else if (patientPressure > 0) patientScore = 35;

  let staffScore = 10;
  if (staffRatio <= 50) staffScore = 90;
  else if (staffRatio <= 75) staffScore = 60;
  else if (staffRatio < 100) staffScore = 30;

  const totalRiskScore = Math.round(
    medScore * 0.35 + bedScore * 0.3 + patientScore * 0.2 + staffScore * 0.15
  );

  let overallRisk: RiskLevel = 'stable';
  if (totalRiskScore >= 75 || medRisk === 'critical' || bedOccupancy >= 90) {
    overallRisk = 'critical';
  } else if (totalRiskScore >= 60) {
    overallRisk = 'high';
  } else if (totalRiskScore >= 40) {
    overallRisk = 'warning';
  } else {
    overallRisk = 'stable';
  }

  // Resilience score is inversely related to systemic vulnerability + buffering capacity
  const resilienceScore = Math.max(10, Math.min(99, 100 - totalRiskScore + (phc.emergencyBedsAvailable > 1 ? 5 : -5)));

  const contributingDrivers: string[] = [];
  if (medRisk === 'critical') contributingDrivers.push('Critical Antibiotic Depletion (<3 days remaining)');
  else if (medRisk === 'high') contributingDrivers.push('Imminent Medicine Stock-out (<5 days)');

  if (bedOccupancy >= 85) contributingDrivers.push(`Acute Bed Occupancy at ${bedOccupancy}%`);
  if (patientPressure >= 20) contributingDrivers.push(`Patient intake velocity +${patientPressure}% above baseline`);
  if (staffRatio <= 60) contributingDrivers.push(`Doctor presence depleted (${phc.doctorsPresent}/${phc.doctorsTotal} on duty)`);

  const summaryReason = contributingDrivers.length > 0
    ? contributingDrivers.join(' • ')
    : 'All primary operational vectors nominal; domestic buffers intact.';

  return {
    overallRisk,
    overallScore: totalRiskScore,
    resilienceScore,
    factors: {
      patientPressurePercent: patientPressure,
      patientPressureStatus: patientPressure > 25 ? 'Surge' : patientPressure > 10 ? 'Elevated' : 'Normal',
      bedOccupancyPercent: bedOccupancy,
      bedPressureStatus: bedOccupancy >= 90 ? 'Critical' : bedOccupancy >= 75 ? 'Warning' : 'Optimal',
      medicineRisk: medRisk,
      staffAvailabilityPercent: staffRatio,
      staffPressureStatus: staffRatio <= 50 ? 'Critical Shortage' : staffRatio <= 75 ? 'Moderate Shortage' : 'Full Roster',
    },
    summaryReason,
    contributingDrivers,
  };
}

/**
 * Deterministic Safe Surplus calculation
 * Safe Surplus = Current Stock - Expected Own Demand - Safety Buffer
 */
export function calculateSafeSurplus(
  currentStock: number,
  expectedOwnDemand: number,
  safetyBuffer: number
): number {
  return Math.max(0, currentStock - expectedOwnDemand - safetyBuffer);
}
