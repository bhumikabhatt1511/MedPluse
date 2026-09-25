import { getPHCById, getAllPHCs } from './phc.service.js';
import { calculatePHCRisk, type RiskAnalysis } from '../utils/calculations.js';

export async function getRiskAnalysisForPHC(phcId: string): Promise<RiskAnalysis | null> {
  const phc = await getPHCById(phcId);
  if (!phc) return null;

  return calculatePHCRisk(
    phc.pressures.patient,
    phc.totalBeds,
    phc.occupiedBeds,
    phc.medicineRisk,
    phc.doctorsTotal,
    phc.doctorsPresent,
    phc.emergencyBedsAvailable
  );
}

export async function getAllPHCRisks(): Promise<Array<{ phcId: string; phcName: string; risk: RiskAnalysis }>> {
  const allPhcs = await getAllPHCs();
  return allPhcs.map((phc) => ({
    phcId: phc.id,
    phcName: phc.name,
    risk: calculatePHCRisk(
      phc.pressures.patient,
      phc.totalBeds,
      phc.occupiedBeds,
      phc.medicineRisk,
      phc.doctorsTotal,
      phc.doctorsPresent,
      phc.emergencyBedsAvailable
    ),
  }));
}
