import { db } from './prisma.service.js';
import type { Medicine, RiskLevel } from '../types/index.js';
import {
  calculateDaysOfStockRemaining,
  calculateStockoutRisk,
  calculatePredictedStockoutDate,
  calculateSafeSurplus,
} from '../utils/calculations.js';

export async function getAllMedicines() {
  return db.orm.public.Medicine.all();
}

export async function getPHCInventory(phcId: string = 'phc-alpha'): Promise<Medicine[]> {
  const allMeds = await db.orm.public.Medicine.all();
  const allInventories = await db.orm.public.PHCMedicineInventory.all();
  const phcInventories = allInventories.filter((inv) => inv.phcId === phcId);

  const now = new Date();

  return phcInventories.map((inv) => {
    const medDef = allMeds.find((m) => m.id === inv.medicineId) || {
      id: inv.medicineId,
      name: 'Essential Medicine',
      category: 'General',
      dosage: 'Standard',
      unit: 'Units',
      reorderLevel: 200,
    };

    const daily = inv.dailyConsumption > 0 ? inv.dailyConsumption : 50;
    const currentStock = inv.currentStock;
    const daysRemaining = calculateDaysOfStockRemaining(currentStock, daily);
    const stockoutRisk = calculateStockoutRisk(daysRemaining);
    const predictedStockoutDate = calculatePredictedStockoutDate(daysRemaining);
    const surplus = calculateSafeSurplus(currentStock, daily);

    const expiryDateObj = new Date(inv.expiryDate);
    const daysUntilExpiry = Math.max(0, Math.round((expiryDateObj.getTime() - now.getTime()) / (1000 * 3600 * 24)));
    const expiryRisk: 'normal' | 'moderate' | 'urgent' =
      daysUntilExpiry <= 30 ? 'urgent' : daysUntilExpiry <= 90 ? 'moderate' : 'normal';

    return {
      id: inv.medicineId,
      medicineId: inv.medicineId,
      name: medDef.name,
      medicineName: medDef.name,
      phcId: inv.phcId,
      category: medDef.category,
      dosage: medDef.dosage,
      currentStock,
      unit: medDef.unit,
      usedToday: inv.usedQuantity || daily,
      receivedToday: inv.receivedQuantity || 0,
      dailyConsumption: daily,
      averageDailyConsumption: daily,
      receivedQuantity: inv.receivedQuantity,
      usedQuantity: inv.usedQuantity,
      reorderLevel: medDef.reorderLevel,
      expiryDate: expiryDateObj.toISOString().split('T')[0] || inv.expiryDate,
      daysUntilExpiry,
      wastedQuantity: inv.wastedQuantity,
      safetyBuffer: surplus.safetyBuffer,
      predictedDemand: surplus.expectedDemand,
      daysOfStockRemaining: daysRemaining,
      predictedStockoutDate,
      stockoutRisk,
      expiryRisk,
      burnRatePerDay: daily,
      surgeVectorPercent: stockoutRisk === 'critical' ? 35 : stockoutRisk === 'high' ? 20 : 5,
    };
  });
}

export async function getAllInventoriesEnriched(): Promise<Medicine[]> {
  const allPhcs = await db.orm.public.PHC.all();
  const results: Medicine[] = [];
  for (const phc of allPhcs) {
    const inv = await getPHCInventory(phc.id);
    results.push(...inv);
  }
  return results;
}

export async function getShortages(phcId?: string): Promise<Medicine[]> {
  let list: Medicine[] = [];
  if (phcId) {
    list = await getPHCInventory(phcId);
  } else {
    list = await getAllInventoriesEnriched();
  }
  return list.filter((m) => m.stockoutRisk === 'critical' || m.stockoutRisk === 'high');
}

export async function getExpiring(daysThreshold: number = 60, phcId?: string): Promise<Medicine[]> {
  let list: Medicine[] = [];
  if (phcId) {
    list = await getPHCInventory(phcId);
  } else {
    list = await getAllInventoriesEnriched();
  }
  return list.filter((m) => m.daysUntilExpiry <= daysThreshold);
}

export async function restockMedicine(
  phcId: string,
  medicineId: string,
  amount: number
): Promise<Medicine | null> {
  const allInventories = await db.orm.public.PHCMedicineInventory.all();
  const existing = allInventories.find((inv) => inv.phcId === phcId && inv.medicineId === medicineId);

  if (!existing) {
    return null;
  }

  const newStock = existing.currentStock + amount;
  const newReceived = existing.receivedQuantity + amount;

  await db.orm.public.PHCMedicineInventory.where({ id: existing.id }).update({
    currentStock: newStock,
    receivedQuantity: newReceived,
    updatedAt: new Date().toISOString(),
  });

  const updatedInv = await getPHCInventory(phcId);
  return updatedInv.find((m) => m.id === medicineId) || null;
}
