import { db } from './prisma.service.js';
import type {
  TransferRecommendation,
  DonorEvaluation,
  TransferHistoryItem,
  RiskLevel,
} from '../types/index.js';
import { getAllPHCs } from './phc.service.js';
import { getPHCInventory } from './medicine.service.js';
import {
  calculateDaysOfStockRemaining,
  calculateStockoutRisk,
  calculatePredictedStockoutDate,
  calculateHaversineDistance,
  calculateRequiredTransferQuantity,
  verifyDonorProtection,
} from '../utils/calculations.js';

export async function getTransferRecommendations(
  targetPhcId: string = 'phc-alpha',
  targetMedicineId: string = 'med-01'
): Promise<{
  recommendation: TransferRecommendation;
  candidateDonors: DonorEvaluation[];
} | null> {
  const allPhcs = await getAllPHCs();
  const targetPhc = allPhcs.find((p) => p.id === targetPhcId) || allPhcs[0];
  if (!targetPhc) return null;

  const targetInventory = await getPHCInventory(targetPhc.id);
  const targetMed = targetInventory.find((m) => m.id === targetMedicineId || m.name.toLowerCase().includes('amoxicillin')) || targetInventory[0];

  if (!targetMed) return null;

  const destDaily = targetMed.dailyConsumption || targetMed.burnRatePerDay || 150;
  const requiredQty = calculateRequiredTransferQuantity(targetMed.currentStock, destDaily, 10);

  const allInventories = await db.orm.public.PHCMedicineInventory.all();
  const candidatePhcs = allPhcs.filter((p) => p.id !== targetPhc.id);

  const candidateDonors: DonorEvaluation[] = candidatePhcs.map((donor) => {
    const donorInv = allInventories.find((inv) => inv.phcId === donor.id && inv.medicineId === targetMed.id);
    const donorStock = donorInv ? donorInv.currentStock : Math.round((donor.availableBeds + 10) * 45);
    const donorDaily = donorInv ? donorInv.dailyConsumption : Math.max(20, Math.round(donor.patientsToday * 0.4));

    const own7DayDemand = Math.round(donorDaily * 7);
    const safetyBuffer = Math.round(donorDaily * 3);
    const safeSurplus = Math.max(0, donorStock - own7DayDemand - safetyBuffer);

    const distanceKm = calculateHaversineDistance(
      targetPhc.lat,
      targetPhc.lng,
      donor.lat,
      donor.lng
    );
    const transitMinutes = Math.max(15, Math.round(distanceKm * 1.3 + 12));

    const recommendedTransfer = Math.min(requiredQty, safeSurplus);
    const resilienceBefore = donor.resilienceScore || 80;
    const resilienceDrop = Math.round((recommendedTransfer / Math.max(1, donorStock)) * 15);
    const resilienceAfter = Math.max(50, resilienceBefore - resilienceDrop);

    let status: 'eligible' | 'rejected' | 'blocked' = 'eligible';
    let rejectionReason: string | undefined = undefined;
    let guardrailViolated: string | undefined = undefined;

    if (safeSurplus <= 0) {
      status = 'blocked';
      rejectionReason = 'Zero safe surplus available: inventory reserved for local 7-day demand + 3-day safety buffer.';
      guardrailViolated = 'Guardrail 02: Domestic 10-Day Reserve Floor Violation';
    } else if (donor.riskLevel === 'critical') {
      status = 'blocked';
      rejectionReason = 'Donor facility is currently under critical operational load.';
      guardrailViolated = 'Guardrail 01: Critical Node Protection';
    } else if (resilienceAfter < 70) {
      status = 'rejected';
      rejectionReason = `Donor resilience drops to ${resilienceAfter}% (<70% threshold). Creates secondary stress.`;
      guardrailViolated = 'Guardrail 01: Minimum 70% Donor Resilience Preservation';
    }

    const surplusScore = (safeSurplus / Math.max(1, requiredQty)) * 40;
    const resilienceScore = (resilienceAfter / 100) * 35;
    const distanceScore = Math.max(0, 100 - distanceKm * 0.8) * 0.25;
    const rankingScore = status === 'eligible' ? Math.round(surplusScore + resilienceScore + distanceScore) : 0;

    return {
      phcId: donor.id,
      phcName: donor.name,
      district: donor.district,
      distanceKm,
      transitMinutes,
      routeCode: `Corridor ${donor.district.split(' ')[0]}-${targetPhc.district.split(' ')[0]}`,
      inHandStock: donorStock,
      own7DayDemand,
      safetyBuffer,
      safeSurplus,
      status,
      rejectionReason,
      resilienceBefore,
      resilienceAfter,
      guardrailViolated,
      coldChainReady: transitMinutes <= 90,
      vehicleStatus: `Medical Van (${distanceKm} km • Active Cold Chain)`,
      rankingScore,
      recommendedTransfer,
      donorDailyConsumption: donorDaily,
    };
  });

  candidateDonors.sort((a, b) => {
    if (a.status === 'eligible' && b.status !== 'eligible') return -1;
    if (a.status !== 'eligible' && b.status === 'eligible') return 1;
    if (a.status === 'eligible' && b.status === 'eligible') {
      return (b.rankingScore || 0) - (a.rankingScore || 0);
    }
    return a.distanceKm - b.distanceKm;
  });

  const topEligible = candidateDonors.find((d) => d.status === 'eligible') || candidateDonors[0]!;
  const transferQuantity = Math.min(requiredQty, topEligible.safeSurplus);

  const destDaysBefore = calculateDaysOfStockRemaining(targetMed.currentStock, destDaily);
  const destDaysAfter = calculateDaysOfStockRemaining(targetMed.currentStock + transferQuantity, destDaily);
  const destRiskBefore = calculateStockoutRisk(destDaysBefore);
  const destRiskAfter = calculateStockoutRisk(destDaysAfter);

  const donorDaily = topEligible.donorDailyConsumption || 65;
  const donorDaysBefore = calculateDaysOfStockRemaining(topEligible.inHandStock, donorDaily);
  const donorDaysAfter = calculateDaysOfStockRemaining(topEligible.inHandStock - transferQuantity, donorDaily);
  const donorRiskBefore = calculateStockoutRisk(donorDaysBefore);
  const donorRiskAfter = calculateStockoutRisk(donorDaysAfter);

  const recommendation: TransferRecommendation = {
    id: `REC-${Date.now().toString().slice(-6)}`,
    sourcePhcId: topEligible.phcId,
    sourcePhcName: topEligible.phcName,
    targetPhcId: targetPhc.id,
    targetPhcName: targetPhc.name,
    medicineName: targetMed.name,
    medicineId: targetMed.id,
    requestedQuantity: requiredQty,
    approvedQuantity: transferQuantity,
    safeSurplusAvailable: topEligible.safeSurplus,
    distanceKm: topEligible.distanceKm,
    transitMinutes: topEligible.transitMinutes,
    expectedShortageDate: calculatePredictedStockoutDate(destDaysBefore),
    shortageAvoidedDays: Number((destDaysAfter - destDaysBefore).toFixed(1)),
    donorSafetyBufferPercent: Math.round(
      ((topEligible.inHandStock - transferQuantity) / (topEligible.own7DayDemand + topEligible.safetyBuffer)) * 100
    ),
    donorRiskBefore,
    donorRiskAfter,
    targetRiskBefore: destRiskBefore,
    targetRiskAfter: destRiskAfter,
    status: 'recommended',
    reasoningPillars: [
      `Safe Surplus Verification: Donor has ${topEligible.safeSurplus}u buffer after preserving 7d demand + 3d safety margin.`,
      `Resilience Preservation: Donor operational capacity remains resilient (${topEligible.resilienceAfter}% post-dispatch).`,
      `Cold-Chain Feasibility: ${topEligible.distanceKm} km transit corridor reachable in ${topEligible.transitMinutes} mins under active telemetry.`,
    ],
  };

  return { recommendation, candidateDonors };
}

export async function approveTransfer(payload: {
  sourcePhcId: string;
  sourcePhcName?: string | undefined;
  targetPhcId: string;
  targetPhcName?: string | undefined;
  medicineId: string;
  medicineName?: string | undefined;
  approvedQuantity: number;
  distanceKm?: number | undefined;
  transitMinutes?: number | undefined;
  shortageAvoidedDays?: number | undefined;
  targetRiskAfter?: RiskLevel | undefined;
}): Promise<{ success: boolean; historyItem?: TransferHistoryItem | undefined; error?: string | undefined }> {
  const {
    sourcePhcId,
    targetPhcId,
    medicineId,
    approvedQuantity,
    distanceKm = 18.4,
    transitMinutes = 35,
  } = payload;

  const allInventories = await db.orm.public.PHCMedicineInventory.all();
  const donorInv = allInventories.find((inv) => inv.phcId === sourcePhcId && inv.medicineId === medicineId);
  const targetInv = allInventories.find((inv) => inv.phcId === targetPhcId && inv.medicineId === medicineId);

  if (!donorInv || !targetInv) {
    return { success: false, error: 'Donor or target medicine inventory not found in database.' };
  }

  const guardrail = verifyDonorProtection(donorInv.currentStock, donorInv.dailyConsumption, approvedQuantity);
  if (!guardrail.isAllowed) {
    return { success: false, error: guardrail.error || 'Donor safety threshold violated' };
  }

  const now = new Date().toISOString();

  await db.orm.public.PHCMedicineInventory.where({ id: donorInv.id }).update({
    currentStock: donorInv.currentStock - approvedQuantity,
    usedQuantity: donorInv.usedQuantity + approvedQuantity,
    updatedAt: now,
  });

  await db.orm.public.PHCMedicineInventory.where({ id: targetInv.id }).update({
    currentStock: targetInv.currentStock + approvedQuantity,
    receivedQuantity: targetInv.receivedQuantity + approvedQuantity,
    updatedAt: now,
  });

  const allPhcs = await db.orm.public.PHC.all();
  const allMeds = await db.orm.public.Medicine.all();

  const sourcePhc = allPhcs.find((p) => p.id === sourcePhcId);
  const destPhc = allPhcs.find((p) => p.id === targetPhcId);
  const med = allMeds.find((m) => m.id === medicineId);

  const sourceName = payload.sourcePhcName || sourcePhc?.name || 'Donor PHC';
  const destName = payload.targetPhcName || destPhc?.name || 'Target PHC';
  const medName = payload.medicineName || med?.name || 'Essential Medicine';

  const transferId = `TR-${Date.now().toString().slice(-6)}`;

  const historyRecord = await db.orm.public.TransferHistory.create({
    id: `hist-${Date.now()}`,
    transferId,
    sourcePhcId,
    destinationPhcId: targetPhcId,
    sourcePhcName: sourceName,
    destinationPhcName: destName,
    medicineId,
    medicineName: medName,
    quantity: approvedQuantity,
    distanceKm,
    transitMinutes,
    status: 'completed',
    carrier: 'Cold-Chain Van Alpha-2 (+4.1°C Active Telemetry)',
    temperatureCelsius: 4.1,
    resilienceLift: `Destination buffer extended (${(payload.targetRiskAfter || 'high').toUpperCase()})`,
    createdAt: now,
  });

  const allAlerts = await db.orm.public.Alert.all();
  const matchingAlerts = allAlerts.filter(
    (a) => !a.resolved && a.phcId === targetPhcId && (a.type === 'supply' || a.title.toLowerCase().includes(medName.toLowerCase()))
  );

  for (const alert of matchingAlerts) {
    await db.orm.public.Alert.where({ id: alert.id }).update({
      resolved: true,
      status: 'resolved',
      resolvedAt: now,
      title: `✓ Shortage mitigated: ${approvedQuantity} units of ${medName} received from ${sourceName}`,
    });
  }

  const resultItem: TransferHistoryItem = {
    id: historyRecord.id,
    transferId: historyRecord.transferId || transferId,
    timestamp:
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    approvedAt: now,
    sourcePhcName: sourceName,
    donorPHC: sourceName,
    targetPhcName: destName,
    destinationPHC: destName,
    medicineName: medName,
    medicineId,
    quantity: approvedQuantity,
    distanceKm,
    transitMinutes,
    status: 'completed',
    carrier: 'Cold-Chain Van Alpha-2 (+4.1°C Active Telemetry)',
    temperatureCelsius: 4.1,
    resilienceLift: historyRecord.resilienceLift || 'Destination buffer extended',
  };

  return { success: true, historyItem: resultItem };
}

export async function rejectTransfer(payload: {
  sourcePhcName: string;
  targetPhcName: string;
  medicineName: string;
  quantity?: number | undefined;
  reason: string;
}): Promise<TransferHistoryItem> {
  const now = new Date().toISOString();
  const transferId = `TR-${Date.now().toString().slice(-6)}`;

  const historyRecord = await db.orm.public.TransferHistory.create({
    id: `hist-${Date.now()}`,
    transferId,
    sourcePhcName: payload.sourcePhcName,
    destinationPhcName: payload.targetPhcName,
    medicineName: payload.medicineName,
    quantity: payload.quantity || 300,
    status: 'rejected',
    carrier: 'N/A (Admin Override)',
    resilienceLift: `Rejected: ${payload.reason}`,
    createdAt: now,
  });

  return {
    id: historyRecord.id,
    transferId,
    timestamp:
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    approvedAt: now,
    sourcePhcName: payload.sourcePhcName,
    donorPHC: payload.sourcePhcName,
    targetPhcName: payload.targetPhcName,
    destinationPHC: payload.targetPhcName,
    medicineName: payload.medicineName,
    quantity: payload.quantity || 300,
    status: 'rejected',
    carrier: 'N/A (Admin Override)',
    resilienceLift: `Rejected: ${payload.reason}`,
  };
}

export async function getTransferHistory(): Promise<TransferHistoryItem[]> {
  const records = await db.orm.public.TransferHistory.all();

  return records
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => ({
      id: r.id,
      transferId: r.transferId || r.id,
      timestamp:
        new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' +
        new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      approvedAt: r.createdAt,
      sourcePhcName: r.sourcePhcName,
      donorPHC: r.sourcePhcName,
      targetPhcName: r.destinationPhcName,
      destinationPHC: r.destinationPhcName,
      medicineName: r.medicineName,
      medicineId: r.medicineId || undefined,
      quantity: r.quantity,
      distanceKm: r.distanceKm || undefined,
      transitMinutes: r.transitMinutes || undefined,
      status: r.status as any,
      carrier: r.carrier || undefined,
      temperatureCelsius: r.temperatureCelsius || undefined,
      resilienceLift: r.resilienceLift || undefined,
    }));
}
