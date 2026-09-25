import { db } from './prisma.service.js';
import type { StaffMember } from '../types/index.js';

// ================= PATIENT METRICS =================
export async function getPatientMetrics(phcId?: string) {
  const all = await db.orm.public.PatientMetrics.all();
  if (phcId) {
    return all.filter((m) => m.phcId === phcId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createPatientMetrics(data: {
  phcId: string;
  totalPatients: number;
  newPatients: number;
  underTreatment: number;
  recovered: number;
  discharged: number;
  admitted: number;
  emergencyCases: number;
  criticalPatients: number;
  referredPatients: number;
  date?: string | undefined;
}) {
  const now = new Date().toISOString();
  return db.orm.public.PatientMetrics.create({
    phcId: data.phcId,
    date: data.date || now,
    totalPatients: data.totalPatients,
    newPatients: data.newPatients,
    underTreatment: data.underTreatment,
    recovered: data.recovered,
    discharged: data.discharged,
    admitted: data.admitted,
    emergencyCases: data.emergencyCases,
    criticalPatients: data.criticalPatients,
    referredPatients: data.referredPatients,
    createdAt: now,
  });
}

// ================= BED METRICS =================
export async function getBedMetrics(phcId?: string) {
  const all = await db.orm.public.BedMetrics.all();
  if (phcId) {
    return all.filter((m) => m.phcId === phcId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createBedMetrics(data: {
  phcId: string;
  totalBeds: number;
  occupiedBeds: number;
  emergencyBeds: number;
  emergencyBedsOccupied: number;
  icuBeds: number;
  icuBedsOccupied: number;
  patientsAdmitted: number;
  patientsDischarged: number;
  patientsReferred: number;
  date?: string | undefined;
}) {
  const now = new Date().toISOString();
  return db.orm.public.BedMetrics.create({
    phcId: data.phcId,
    date: data.date || now,
    totalBeds: data.totalBeds,
    occupiedBeds: data.occupiedBeds,
    emergencyBeds: data.emergencyBeds,
    emergencyBedsOccupied: data.emergencyBedsOccupied,
    icuBeds: data.icuBeds,
    icuBedsOccupied: data.icuBedsOccupied,
    patientsAdmitted: data.patientsAdmitted,
    patientsDischarged: data.patientsDischarged,
    patientsReferred: data.patientsReferred,
    createdAt: now,
  });
}

// ================= STAFF METRICS & MEMBERS =================
export async function getStaffMetrics(phcId?: string) {
  const all = await db.orm.public.StaffMetrics.all();
  if (phcId) {
    return all.filter((m) => m.phcId === phcId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getStaffMembers(phcId?: string): Promise<StaffMember[]> {
  const allPhcs = await db.orm.public.PHC.all();
  const allMembers = await db.orm.public.StaffMember.all();

  const phcMap = new Map(allPhcs.map((p) => [p.id, p.name]));

  let members = allMembers;
  if (phcId) {
    members = members.filter((m) => m.phcId === phcId);
  }

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role as any,
    phcId: m.phcId,
    phcName: phcMap.get(m.phcId) || 'PHC Facility',
    shift: m.shift as any,
    status: m.status as any,
    patientsSeenToday: m.patientsSeenToday,
    specialty: m.specialty || undefined,
  }));
}
