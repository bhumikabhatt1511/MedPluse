import { Medicine, RiskLevel, Alert, PHC, DonorEvaluation, TransferRecommendation } from '../types';

/**
 * Deterministically calculates days of stock remaining.
 * Formula: daysOfStockRemaining = currentStock / averageDailyConsumption
 * Handles zero consumption safely.
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
 * Strict Safe-Surplus Rule:
 * safeSurplus = currentStock - expectedDemand7d - safetyBuffer
 * expectedDemand7d = dailyConsumption * 7
 * safetyBuffer = dailyConsumption * 3
 * Never recommend donation simply because another PHC has more stock.
 * Only positive safe surplus makes a PHC eligible as a donor.
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
): { isAllowed: boolean; error?: string } {
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

/**
 * Enriches and standardizes a Medicine object with deterministic calculations.
 */
export function computeMedicineMetrics(med: Medicine, defaultPhcId: string = 'phc-alpha'): Medicine {
  const daily = med.dailyConsumption ?? med.averageDailyConsumption ?? med.burnRatePerDay ?? med.usedToday ?? 1;
  const currentStock = med.currentStock ?? 0;
  const days = calculateDaysOfStockRemaining(currentStock, daily);
  const risk = calculateStockoutRisk(days);
  const stockoutDate = calculatePredictedStockoutDate(days);
  const surplus = calculateSafeSurplus(currentStock, daily);

  return {
    ...med,
    medicineId: med.id || med.medicineId,
    medicineName: med.name || med.medicineName,
    phcId: med.phcId || defaultPhcId,
    currentStock,
    dailyConsumption: daily,
    averageDailyConsumption: daily,
    burnRatePerDay: daily,
    daysOfStockRemaining: days,
    stockoutRisk: risk,
    predictedStockoutDate: stockoutDate,
    safetyBuffer: surplus.safetyBuffer,
    predictedDemand: surplus.expectedDemand,
    usedToday: med.usedToday ?? daily,
  };
}

/**
 * Evaluates and ranks potential safe donor PHCs for a given destination PHC and shortage medicine.
 * Uses transparent multi-criteria scoring:
 * 1. Safe Surplus magnitude
 * 2. Donor Resilience post-transfer
 * 3. Geographic proximity / cold-chain feasibility
 */
export function evaluateDonorCandidates(
  destinationPhc: PHC,
  shortageMedicine: Medicine,
  allPhcs: PHC[],
  donorInventoryMap?: Record<string, { stock: number; daily: number }>
): DonorEvaluation[] {
  const destDaily = shortageMedicine.dailyConsumption || shortageMedicine.burnRatePerDay || 150;
  const requiredQty = calculateRequiredTransferQuantity(shortageMedicine.currentStock, destDaily, 10);

  const candidateNodes = allPhcs.filter((p) => p.id !== destinationPhc.id);

  const evaluations: DonorEvaluation[] = candidateNodes.map((donor) => {
    // Determine donor stock & daily usage for this medicine
    let donorInHandStock = 600;
    let donorDaily = 45;

    if (donorInventoryMap && donorInventoryMap[donor.id]) {
      donorInHandStock = donorInventoryMap[donor.id].stock;
      donorDaily = donorInventoryMap[donor.id].daily;
    } else if (donor.id === 'phc-beta') {
      donorInHandStock = 1420;
      donorDaily = 65;
    } else if (donor.id === 'phc-gamma') {
      donorInHandStock = 820;
      donorDaily = 70;
    } else if (donor.id === 'phc-delta') {
      donorInHandStock = 410;
      donorDaily = 60;
    } else if (donor.id === 'phc-epsilon') {
      donorInHandStock = 520;
      donorDaily = 55;
    } else {
      // Dynamic baseline for any other Indian PHC in dataset
      donorInHandStock = Math.round((donor.availableBeds + 10) * 45);
      donorDaily = Math.round(donor.patientsToday * 0.4);
    }

    const own7DayDemand = Math.round(donorDaily * 7);
    const safetyBuffer = Math.round(donorDaily * 3);
    const safeSurplus = Math.max(0, donorInHandStock - own7DayDemand - safetyBuffer);

    const distanceKm = calculateHaversineDistance(
      destinationPhc.lat,
      destinationPhc.lng,
      donor.lat,
      donor.lng
    );
    const transitMinutes = Math.max(15, Math.round(distanceKm * 1.3 + 12));

    const recommendedTransfer = Math.min(requiredQty, safeSurplus);
    const resilienceBefore = donor.resilienceScore || 80;
    const resilienceDrop = Math.round((recommendedTransfer / Math.max(1, donorInHandStock)) * 15);
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
      routeCode: `Corridor ${donor.district.split(' ')[0]}-${destinationPhc.district.split(' ')[0]}`,
      inHandStock: donorInHandStock,
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

  // Sort: eligible donors ranked by score descending, followed by blocked/rejected
  return evaluations.sort((a, b) => {
    if (a.status === 'eligible' && b.status !== 'eligible') return -1;
    if (a.status !== 'eligible' && b.status === 'eligible') return 1;
    if (a.status === 'eligible' && b.status === 'eligible') {
      return (b.rankingScore || 0) - (a.rankingScore || 0);
    }
    return a.distanceKm - b.distanceKm;
  });
}

/**
 * Generates an end-to-end TransferRecommendation object connecting shortage state with the optimal safe donor.
 */
export function generateTransferRecommendation(
  destinationPhc: PHC,
  shortageMedicine: Medicine,
  candidateDonors: DonorEvaluation[],
  customTransferQty?: number
): TransferRecommendation {
  const topEligible = candidateDonors.find((d) => d.status === 'eligible') || candidateDonors[0];
  const destDaily = shortageMedicine.dailyConsumption || shortageMedicine.burnRatePerDay || 150;
  const requiredQty = calculateRequiredTransferQuantity(shortageMedicine.currentStock, destDaily, 10);
  const transferQuantity = customTransferQty ?? Math.min(requiredQty, topEligible.safeSurplus);

  const destDaysBefore = calculateDaysOfStockRemaining(shortageMedicine.currentStock, destDaily);
  const destDaysAfter = calculateDaysOfStockRemaining(shortageMedicine.currentStock + transferQuantity, destDaily);
  const destRiskBefore = calculateStockoutRisk(destDaysBefore);
  const destRiskAfter = calculateStockoutRisk(destDaysAfter);

  const donorDaily = topEligible.donorDailyConsumption || 65;
  const donorDaysBefore = calculateDaysOfStockRemaining(topEligible.inHandStock, donorDaily);
  const donorDaysAfter = calculateDaysOfStockRemaining(topEligible.inHandStock - transferQuantity, donorDaily);
  const donorRiskBefore = calculateStockoutRisk(donorDaysBefore);
  const donorRiskAfter = calculateStockoutRisk(donorDaysAfter);

  return {
    id: `REC-${Date.now().toString().slice(-6)}`,
    sourcePhcId: topEligible.phcId,
    sourcePhcName: topEligible.phcName,
    targetPhcId: destinationPhc.id,
    targetPhcName: destinationPhc.name,
    medicineName: shortageMedicine.name,
    medicineId: shortageMedicine.id,
    requestedQuantity: requiredQty,
    approvedQuantity: transferQuantity,
    safeSurplusAvailable: topEligible.safeSurplus,
    distanceKm: topEligible.distanceKm,
    transitMinutes: topEligible.transitMinutes,
    expectedShortageDate: calculatePredictedStockoutDate(destDaysBefore),
    shortageAvoidedDays: Number((destDaysAfter - destDaysBefore).toFixed(1)),
    donorSafetyBufferPercent: Math.round(((topEligible.inHandStock - transferQuantity) / (topEligible.own7DayDemand + topEligible.safetyBuffer)) * 100),
    donorRiskBefore,
    donorRiskAfter,
    targetRiskBefore: destRiskBefore,
    targetRiskAfter: destRiskAfter,
    status: 'recommended',
  };
}

/**
 * Generates dynamic early-warning shortage alert items for any medicine
 * reaching CRITICAL or HIGH RISK level.
 */
export function generateMedicineShortageAlerts(
  medicines: Medicine[],
  phcs: PHC[] = []
): Alert[] {
  const criticalOrHigh = medicines.filter((m) => {
    const computed = computeMedicineMetrics(m);
    return computed.stockoutRisk === 'critical' || computed.stockoutRisk === 'high';
  });

  return criticalOrHigh.map((med) => {
    const computed = computeMedicineMetrics(med);
    const phc = phcs.find((p) => p.id === computed.phcId) || phcs.find((p) => p.id === 'phc-alpha');
    const phcName = phc ? phc.name : 'PHC-Alpha East (Wagholi Demo)';

    return {
      id: `alert-shortage-${computed.id}`,
      severity: computed.stockoutRisk,
      phcId: computed.phcId || 'phc-alpha',
      phcName,
      problem: `Critical Medicine Shortage: ${computed.name} (${computed.dosage})`,
      predictedImpact: `In-hand stock (${computed.currentStock} ${computed.unit}) at ${computed.dailyConsumption} ${computed.unit}/day burn rate faces complete depletion in ${computed.daysOfStockRemaining} days.`,
      timeRemaining: `~${computed.daysOfStockRemaining} Days`,
      recommendedAction: 'Review inter-PHC redistribution options from safe surplus donor or dispatch emergency purchase order.',
      timestamp: 'Just now • Live Telemetry',
      resolved: false,
      category: 'supply',
    };
  });
}

