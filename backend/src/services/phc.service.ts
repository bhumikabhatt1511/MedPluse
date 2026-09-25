import { db } from './prisma.service.js';
import type { PHC, RiskLevel } from '../types/index.js';
import {
  calculateDaysOfStockRemaining,
  calculateStockoutRisk,
  calculatePHCRisk,
} from '../utils/calculations.js';

export async function getAllPHCs(jurisdiction?: string, district?: string): Promise<PHC[]> {
  const phcRecords = await db.orm.public.PHC.all();
  const allInventories = await db.orm.public.PHCMedicineInventory.all();
  const allPatientMetrics = await db.orm.public.PatientMetrics.all();
  const allBedMetrics = await db.orm.public.BedMetrics.all();
  const allStaffMetrics = await db.orm.public.StaffMetrics.all();

  const enrichedPhcs: PHC[] = phcRecords.map((record) => {
    // Latest metrics
    const phcInvs = allInventories.filter((inv) => inv.phcId === record.id);
    const patMetrics = allPatientMetrics
      .filter((m) => m.phcId === record.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const bedMetrics = allBedMetrics
      .filter((m) => m.phcId === record.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const staffMetrics = allStaffMetrics
      .filter((m) => m.phcId === record.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    // Compute medicine risk & min stockout days
    let minDays = 999;
    let worstMedRisk: RiskLevel = 'stable';
    let expiryRisksCount = 0;
    const now = new Date();

    for (const inv of phcInvs) {
      const days = calculateDaysOfStockRemaining(inv.currentStock, inv.dailyConsumption);
      if (days < minDays) minDays = days;
      const r = calculateStockoutRisk(days);
      if (r === 'critical') worstMedRisk = 'critical';
      else if (r === 'high' && worstMedRisk !== 'critical') worstMedRisk = 'high';
      else if (r === 'warning' && worstMedRisk !== 'critical' && worstMedRisk !== 'high') worstMedRisk = 'warning';

      const expiry = new Date(inv.expiryDate);
      const daysToExpiry = Math.round((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (daysToExpiry <= 45) {
        expiryRisksCount++;
      }
    }

    const medRiskLabel: 'low' | 'moderate' | 'high' | 'critical' =
      worstMedRisk === 'critical' ? 'critical' : worstMedRisk === 'high' ? 'high' : worstMedRisk === 'warning' ? 'moderate' : 'low';

    // Bed calculations
    const totalBeds = bedMetrics?.totalBeds ?? 24;
    const occupiedBeds = bedMetrics?.occupiedBeds ?? 18;
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const emergencyBedsTotal = bedMetrics?.emergencyBeds ?? 6;
    const emergencyBedsOccupied = bedMetrics?.emergencyBedsOccupied ?? 4;
    const emergencyBedsAvailable = Math.max(0, emergencyBedsTotal - emergencyBedsOccupied);
    const icuBedsTotal = bedMetrics?.icuBeds ?? 2;
    const icuBedsOccupied = bedMetrics?.icuBedsOccupied ?? 1;

    // Staff calculations
    const doctorsTotal = staffMetrics?.doctorsScheduled ?? 4;
    const doctorsPresent = staffMetrics?.doctorsPresent ?? 3;
    const nursesTotal = staffMetrics?.nursesScheduled ?? 8;
    const nursesPresent = staffMetrics?.nursesPresent ?? 7;

    // Patient metrics
    const patientsToday = patMetrics?.totalPatients ?? 120;
    const walkInPatients = patMetrics?.newPatients ?? 85;
    const underTreatment = patMetrics?.underTreatment ?? 35;
    const recovering = Math.round(underTreatment * 0.6);
    const recoveredToday = patMetrics?.recovered ?? 22;
    const dischargedToday = patMetrics?.discharged ?? 14;
    const admittedToday = patMetrics?.admitted ?? 8;
    const emergencyCases = patMetrics?.emergencyCases ?? 6;
    const criticalPatients = patMetrics?.criticalPatients ?? 2;
    const referredPatients = patMetrics?.referredPatients ?? 3;

    // Pressures
    const patientPressureVariance = Math.round(((patientsToday - 100) / 100) * 100);
    const bedOccupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const doctorAvailabilityPercent = doctorsTotal > 0 ? Math.round((doctorsPresent / doctorsTotal) * 100) : 100;

    // Deterministic Risk Engine (Phase 9)
    const riskAnalysis = calculatePHCRisk(
      patientPressureVariance,
      totalBeds,
      occupiedBeds,
      medRiskLabel,
      doctorsTotal,
      doctorsPresent,
      emergencyBedsAvailable
    );

    return {
      id: record.id,
      name: record.name,
      code: record.code,
      district: record.district,
      state: record.state,
      lat: record.latitude,
      lng: record.longitude,
      status: record.status,
      riskLevel: riskAnalysis.severity,
      riskScore: riskAnalysis.score,
      resilienceScore: riskAnalysis.resilienceScore,
      patientsToday,
      walkInPatients,
      underTreatment,
      recovering,
      recoveredToday,
      dischargedToday,
      admittedToday,
      emergencyCases,
      criticalPatients,
      referredPatients,
      totalBeds,
      occupiedBeds,
      availableBeds,
      emergencyBedsTotal,
      emergencyBedsOccupied,
      emergencyBedsAvailable,
      icuBedsTotal,
      icuBedsOccupied,
      doctorsPresent,
      doctorsTotal,
      nursesPresent,
      nursesTotal,
      medicineRisk: medRiskLabel,
      pressures: {
        patient: patientPressureVariance,
        bed: bedOccupancyPercent,
        medicine: medRiskLabel,
        staff: doctorAvailabilityPercent,
      },
      stockoutPredictionDays: minDays < 999 ? minDays : 18,
      expiryRisksCount,
    };
  });

  let result = enrichedPhcs;
  if (district && district !== 'all') {
    result = result.filter((p) => p.district.toLowerCase() === district.toLowerCase());
  }
  if (jurisdiction && !jurisdiction.includes('All India') && !jurisdiction.includes('National')) {
    result = result.filter((p) => jurisdiction.toLowerCase().includes(p.state.toLowerCase()));
  }

  return result;
}

export async function getPHCById(id: string): Promise<PHC | null> {
  const all = await getAllPHCs();
  return all.find((p) => p.id === id) || null;
}

export async function createPHC(data: {
  id: string;
  name: string;
  code: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  status?: string | undefined;
  riskScore?: number | undefined;
  resilienceScore?: number | undefined;
}): Promise<PHC | null> {
  const now = new Date().toISOString();
  await db.orm.public.PHC.create({
    id: data.id,
    name: data.name,
    code: data.code,
    state: data.state,
    district: data.district,
    latitude: data.latitude,
    longitude: data.longitude,
    status: data.status || 'ACTIVE',
    riskLevel: 'stable',
    riskScore: data.riskScore || 25,
    resilienceScore: data.resilienceScore || 80,
    createdAt: now,
    updatedAt: now,
  });

  await db.orm.public.BedMetrics.create({
    phcId: data.id,
    date: now,
    totalBeds: 24,
    occupiedBeds: 16,
    emergencyBeds: 6,
    emergencyBedsOccupied: 3,
    icuBeds: 2,
    icuBedsOccupied: 1,
    patientsAdmitted: 6,
    patientsDischarged: 4,
    patientsReferred: 1,
    createdAt: now,
  });

  await db.orm.public.StaffMetrics.create({
    phcId: data.id,
    date: now,
    shift: 'Morning',
    doctorsScheduled: 4,
    doctorsPresent: 3,
    doctorsAbsent: 1,
    nursesScheduled: 8,
    nursesPresent: 7,
    nursesAbsent: 1,
    otherStaffScheduled: 6,
    otherStaffPresent: 6,
    otherStaffAbsent: 0,
    createdAt: now,
  });

  await db.orm.public.PatientMetrics.create({
    phcId: data.id,
    date: now,
    totalPatients: 110,
    newPatients: 75,
    underTreatment: 35,
    recovered: 20,
    discharged: 12,
    admitted: 6,
    emergencyCases: 5,
    criticalPatients: 1,
    referredPatients: 2,
    createdAt: now,
  });

  return getPHCById(data.id);
}

export async function updatePHC(
  id: string,
  data: Partial<{
    name: string;
    state: string;
    district: string;
    latitude: number;
    longitude: number;
    status: string;
    riskScore: number;
    resilienceScore: number;
    riskLevel: string;
  }>
): Promise<PHC | null> {
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.district !== undefined) updateData.district = data.district;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.riskScore !== undefined) updateData.riskScore = data.riskScore;
  if (data.resilienceScore !== undefined) updateData.resilienceScore = data.resilienceScore;
  if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;

  await db.orm.public.PHC.where({ id }).update(updateData);
  return getPHCById(id);
}
