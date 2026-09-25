import type { EmergencySimulationParams, EmergencySimulationResult, RiskLevel } from '../types/index.js';
import { getAllPHCs } from './phc.service.js';
import { getPHCInventory } from './medicine.service.js';
import { calculateDaysOfStockRemaining, calculateStockoutRisk, calculatePredictedStockoutDate } from '../utils/calculations.js';

export async function simulateEmergencyScenario(
  params: EmergencySimulationParams
): Promise<EmergencySimulationResult> {
  const {
    patientSurge = 25,
    medicineSurge = 25,
    staffDepletion = 1,
    emergencySurge = 30,
    targetPhcId = 'phc-alpha',
  } = params;

  const allPhcs = await getAllPHCs();
  const phc = allPhcs.find((p) => p.id === targetPhcId) || allPhcs[0];

  // Baseline stats (Before)
  const basePatientPressure = phc ? phc.pressures.patient : 32;
  const baseBedOccupancy = phc ? phc.pressures.bed : 72;
  const baseResilience = phc ? phc.resilienceScore : 82;
  const baseStockoutDays = phc ? phc.stockoutPredictionDays : 2.8;
  const baseStaffAvailability = phc ? phc.pressures.staff : 75;
  const baseRiskScore = phc ? phc.riskScore : 48;
  const baseRiskLevel: RiskLevel = phc ? phc.riskLevel : 'warning';

  // Simulating After Crisis Injection
  const surgePatientPressure = Math.min(100, Math.round(basePatientPressure + patientSurge));
  const surgeBedOccupancy = Math.min(99, Math.round(baseBedOccupancy + (patientSurge * 0.4) + (emergencySurge * 0.3)));
  const surgeStaffAvailability = Math.max(25, Math.round(baseStaffAvailability - (staffDepletion * 20)));
  const surgeStockoutDays = Math.max(0.6, Number((baseStockoutDays / (1 + medicineSurge / 100)).toFixed(1)));
  const surgeResilience = Math.max(20, Math.round(baseResilience - (patientSurge * 0.45) - (medicineSurge * 0.3) - (staffDepletion * 8)));

  const surgeCriticalNodes = Math.min(
    allPhcs.length || 18,
    Math.max(1, Math.round(1 + (patientSurge / 25) * 1.5 + (medicineSurge / 20) * 1.2))
  );

  // Composite Risk Calculation for Crisis state
  const surgeRiskScore = Math.min(98, Math.round(100 - surgeResilience + 5));
  const surgeRiskLevel: RiskLevel =
    surgeRiskScore >= 80 || surgeBedOccupancy >= 92 || surgeStockoutDays <= 1.5
      ? 'critical'
      : surgeRiskScore >= 60
      ? 'high'
      : 'warning';

  // Post-Mitigation Projections
  const mitigatedCritical = Math.max(1, surgeCriticalNodes - 3);
  const mitigatedBedOccupancy = Math.max(68, surgeBedOccupancy - 12);
  const mitigatedResilience = Math.min(88, surgeResilience + 28);
  const mitigatedStockoutDays = Number((surgeStockoutDays + 3.2).toFixed(1));
  const mitigatedRiskLevel: RiskLevel = mitigatedResilience >= 75 ? 'stable' : 'warning';

  // 12-Hour Crisis Collapse Trajectory Curve
  const collapseDrop = Math.round((baseResilience - surgeResilience) / 6);
  const trajectory = [
    { hour: 'Hour 0', baselineResilience: baseResilience, crisisTrajectory: baseResilience, mitigatedTrajectory: baseResilience },
    { hour: 'Hour 2', baselineResilience: baseResilience, crisisTrajectory: Math.max(30, baseResilience - collapseDrop), mitigatedTrajectory: Math.max(70, baseResilience - 2) },
    { hour: 'Hour 4', baselineResilience: Math.max(60, baseResilience - 1), crisisTrajectory: Math.max(28, baseResilience - collapseDrop * 2), mitigatedTrajectory: Math.max(68, baseResilience - 4) },
    { hour: 'Hour 6', baselineResilience: Math.max(60, baseResilience - 1), crisisTrajectory: Math.max(25, baseResilience - collapseDrop * 3), mitigatedTrajectory: Math.max(72, baseResilience - 2) },
    { hour: 'Hour 8', baselineResilience: Math.max(60, baseResilience - 2), crisisTrajectory: Math.max(25, baseResilience - collapseDrop * 4), mitigatedTrajectory: Math.min(85, baseResilience + 2) },
    { hour: 'Hour 10', baselineResilience: Math.max(60, baseResilience - 2), crisisTrajectory: Math.max(25, baseResilience - collapseDrop * 5), mitigatedTrajectory: Math.min(86, baseResilience + 4) },
    { hour: 'Hour 12', baselineResilience: Math.max(60, baseResilience - 2), crisisTrajectory: surgeResilience, mitigatedTrajectory: mitigatedResilience },
  ];

  // Evaluate affected medicines
  const phcMeds = await getPHCInventory(targetPhcId);
  const predictedShortages = phcMeds.slice(0, 3).map((m) => {
    const daily = m.dailyConsumption ?? 20;
    const surgeBurn = Math.round(daily * (1 + medicineSurge / 100));
    const newDays = calculateDaysOfStockRemaining(m.currentStock, surgeBurn);
    return {
      medicineName: m.name,
      currentStock: m.currentStock,
      burnRate: surgeBurn,
      daysRemaining: newDays,
      shortageDate: calculatePredictedStockoutDate(newDays),
    };
  });

  const recommendedInterventions: string[] = [
    `Initiate emergency inter-PHC redistribution for ${predictedShortages[0]?.medicineName || 'antibiotics'} from safe donor clusters.`,
    `Activate on-call medical roster (+${staffDepletion} physician) to counter shift depletion.`,
    `Triage non-emergency walk-ins (+${patientSurge}% surge) to ambulatory sub-centers.`,
    `Deploy emergency buffer procurement order to maintain minimum 10-day safety floor.`,
  ];

  return {
    before: {
      criticalNodes: allPhcs.filter((p) => p.riskLevel === 'critical').length || 1,
      bedOccupancy: baseBedOccupancy,
      resilienceScore: baseResilience,
      stockoutDays: baseStockoutDays,
      patientPressure: basePatientPressure,
      staffAvailability: baseStaffAvailability,
      riskScore: baseRiskScore,
      riskLevel: baseRiskLevel,
    },
    after: {
      criticalNodes: surgeCriticalNodes,
      bedOccupancy: surgeBedOccupancy,
      resilienceScore: surgeResilience,
      stockoutDays: surgeStockoutDays,
      patientPressure: surgePatientPressure,
      staffAvailability: surgeStaffAvailability,
      riskScore: surgeRiskScore,
      riskLevel: surgeRiskLevel,
    },
    mitigated: {
      criticalNodes: mitigatedCritical,
      bedOccupancy: mitigatedBedOccupancy,
      resilienceScore: mitigatedResilience,
      stockoutDays: mitigatedStockoutDays,
      riskLevel: mitigatedRiskLevel,
    },
    trajectory,
    predictedShortages,
    recommendedInterventions,
  };
}
