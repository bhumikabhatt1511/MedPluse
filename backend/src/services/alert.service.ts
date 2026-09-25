import { db } from './prisma.service.js';
import type { Alert, RiskLevel } from '../types/index.js';
import { getShortages } from './medicine.service.js';
import { getAllPHCs } from './phc.service.js';

export async function getAllAlerts(): Promise<Alert[]> {
  const dbAlerts = await db.orm.public.Alert.all();
  const allPhcs = await getAllPHCs();
  const phcMap = new Map(allPhcs.map((p) => [p.id, p.name]));

  const formattedDbAlerts: Alert[] = dbAlerts.map((a) => ({
    id: a.id,
    severity: a.severity as RiskLevel,
    phcId: a.phcId,
    phcName: phcMap.get(a.phcId) || 'PHC Facility',
    problem: a.title,
    predictedImpact: a.message,
    timeRemaining: a.timeRemaining || 'Immediate',
    recommendedAction: a.recommendedAction || 'Review triage buffer and redistribute supplies.',
    timestamp: new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    resolved: a.resolved,
    category: a.type as any,
  }));

  // Generate dynamic medicine shortage alerts for medicines reaching CRITICAL or HIGH risk
  const shortages = await getShortages();
  const dynamicShortageAlerts: Alert[] = shortages.map((med) => {
    const phcName = phcMap.get(med.phcId || 'phc-alpha') || 'PHC-Alpha East';
    return {
      id: `alert-shortage-${med.id}-${med.phcId || 'phc-alpha'}`,
      severity: med.stockoutRisk,
      phcId: med.phcId || 'phc-alpha',
      phcName,
      problem: `Critical Medicine Shortage: ${med.name} (${med.dosage})`,
      predictedImpact: `In-hand stock (${med.currentStock} ${med.unit}) at ${med.dailyConsumption} ${med.unit}/day burn rate faces complete depletion in ${med.daysOfStockRemaining} days.`,
      timeRemaining: `~${med.daysOfStockRemaining} Days`,
      recommendedAction: 'Review inter-PHC redistribution options from safe surplus donor or dispatch emergency purchase order.',
      timestamp: 'Live Telemetry',
      resolved: false,
      category: 'supply',
    };
  });

  // Deduplicate
  const existingIds = new Set(formattedDbAlerts.map((a) => a.id));
  const newShortages = dynamicShortageAlerts.filter((da) => !existingIds.has(da.id));

  return [...formattedDbAlerts, ...newShortages];
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const all = await getAllAlerts();
  return all.find((a) => a.id === id) || null;
}

export async function resolveAlert(id: string): Promise<{ success: boolean; error?: string }> {
  const dbAlerts = await db.orm.public.Alert.all();
  const target = dbAlerts.find((a) => a.id === id);

  const now = new Date().toISOString();
  if (target) {
    await db.orm.public.Alert.where({ id }).update({
      resolved: true,
      status: 'resolved',
      resolvedAt: now,
    });
    return { success: true };
  }

  // If dynamic alert, create a resolved record in DB
  await db.orm.public.Alert.create({
    id,
    phcId: 'phc-alpha',
    type: 'supply',
    severity: 'stable',
    title: 'Resolved Supply Alert',
    message: 'Shortage issue resolved via redistribution.',
    status: 'resolved',
    resolved: true,
    timeRemaining: null,
    recommendedAction: null,
    createdAt: now,
    resolvedAt: now,
  });

  return { success: true };
}

export async function createAlert(data: {
  phcId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timeRemaining?: string;
  recommendedAction?: string;
}): Promise<Alert> {
  const now = new Date().toISOString();
  const created = await db.orm.public.Alert.create({
    id: `alt-${Date.now()}`,
    phcId: data.phcId,
    type: data.type,
    severity: data.severity,
    title: data.title,
    message: data.message,
    timeRemaining: data.timeRemaining ?? null,
    recommendedAction: data.recommendedAction ?? null,
    status: 'active',
    resolved: false,
    createdAt: now,
    resolvedAt: null,
  });

  const allPhcs = await getAllPHCs();
  const phc = allPhcs.find((p) => p.id === data.phcId);

  return {
    id: created.id,
    severity: created.severity as RiskLevel,
    phcId: created.phcId,
    phcName: phc?.name || 'PHC Facility',
    problem: created.title,
    predictedImpact: created.message,
    timeRemaining: created.timeRemaining || 'Immediate',
    recommendedAction: created.recommendedAction || '',
    timestamp: 'Just now',
    resolved: false,
    category: created.type as any,
  };
}
