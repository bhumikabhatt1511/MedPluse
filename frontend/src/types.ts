export type RiskLevel = 'stable' | 'warning' | 'high' | 'critical';

export interface Pressures {
  patient: number; // percentage variance, e.g. +32
  bed: number;     // occupancy percentage, e.g. 91
  medicine: 'low' | 'moderate' | 'high' | 'critical';
  staff: number;   // doctor availability percentage, e.g. 75
}

export interface PHC {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  riskLevel: RiskLevel;
  riskScore: number;       // 0 - 100 (higher = higher risk)
  resilienceScore: number; // 0 - 100 (higher = more resilient)
  patientsToday: number;
  walkInPatients: number;
  underTreatment: number;
  recovering: number;
  recoveredToday: number;
  dischargedToday: number;
  admittedToday: number;
  emergencyCases: number;
  criticalPatients: number;
  referredPatients: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  emergencyBedsTotal: number;
  emergencyBedsOccupied: number;
  emergencyBedsAvailable: number;
  icuBedsTotal: number;
  icuBedsOccupied: number;
  doctorsPresent: number;
  doctorsTotal: number;
  nursesPresent: number;
  nursesTotal: number;
  medicineRisk: 'low' | 'moderate' | 'high' | 'critical';
  pressures: Pressures;
  stockoutPredictionDays: number;
  expiryRisksCount: number;
  isDonorCandidate?: boolean;
  distanceFromTargetKm?: number;
  transitMinutes?: number;
}

export interface Medicine {
  id: string;
  medicineId?: string;
  name: string;
  medicineName?: string;
  phcId?: string;
  category: string;
  dosage: string;
  currentStock: number;
  openingStock?: number;
  unit: string;
  usedToday: number;
  receivedToday: number;
  dailyConsumption?: number;
  averageDailyConsumption?: number;
  receivedQuantity?: number;
  usedQuantity?: number;
  reorderLevel: number;
  expiryDate: string;
  daysUntilExpiry: number;
  wastedQuantity: number;
  safetyBuffer?: number;
  predictedDemand?: number;
  daysOfStockRemaining: number;
  predictedStockoutDate: string;
  stockoutRisk: RiskLevel;
  expiryRisk: 'normal' | 'moderate' | 'urgent';
  burnRatePerDay: number;
  surgeVectorPercent: number;
}


export interface Alert {
  id: string;
  severity: RiskLevel;
  phcId: string;
  phcName: string;
  problem: string;
  predictedImpact: string;
  timeRemaining: string;
  recommendedAction: string;
  timestamp: string;
  resolved: boolean;
  category: 'supply' | 'bed' | 'staff' | 'epidemic';
}

export interface DonorEvaluation {
  phcId: string;
  phcName: string;
  district: string;
  distanceKm: number;
  transitMinutes: number;
  routeCode: string;
  inHandStock: number;
  own7DayDemand: number;
  safetyBuffer: number;
  safeSurplus: number;
  status: 'eligible' | 'rejected' | 'blocked';
  rejectionReason?: string;
  resilienceBefore: number;
  resilienceAfter: number;
  guardrailViolated?: string;
  coldChainReady: boolean;
  vehicleStatus: string;
  rankingScore?: number;
  recommendedTransfer?: number;
  donorDailyConsumption?: number;
}

export interface TransferRecommendation {
  id: string;
  sourcePhcId: string;
  sourcePhcName: string;
  targetPhcId: string;
  targetPhcName: string;
  medicineName: string;
  medicineId?: string;
  requestedQuantity: number;
  approvedQuantity: number;
  safeSurplusAvailable: number;
  distanceKm: number;
  transitMinutes: number;
  expectedShortageDate: string;
  shortageAvoidedDays: number;
  donorSafetyBufferPercent: number;
  donorRiskBefore: RiskLevel;
  donorRiskAfter: RiskLevel;
  targetRiskBefore: RiskLevel;
  targetRiskAfter: RiskLevel;
  status: 'recommended' | 'approved' | 'dispatched' | 'completed' | 'rejected';
  dispatchTime?: string;
  reasoningPillars?: string[];
  explanation?: string;
}

export interface TransferHistoryItem {
  id: string;
  transferId?: string;
  timestamp: string;
  approvedAt?: string;
  sourcePhcName: string;
  donorPHC?: string;
  targetPhcName: string;
  destinationPHC?: string;
  medicineId?: string;
  medicineName: string;
  quantity: number;
  distanceKm?: number;
  transitMinutes?: number;
  status: 'completed' | 'in_transit' | 'rejected' | 'COMPLETED' | 'Dispatched' | 'Rejected';
  carrier?: string;
  temperatureCelsius?: number;
  resilienceLift?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Medical Officer' | 'Senior Physician' | 'Triage Nurse' | 'Pharmacist' | 'Lab Technician';
  phcId: string;
  phcName: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'On-Call';
  status: 'on_duty' | 'break' | 'off_duty' | 'standby';
  patientsSeenToday: number;
  specialty?: string;
}

export interface FederatedNode {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  institution: string;
  enclaveName: string;
  datasetStatus: string;
  recordsCount: string;
  recordsTrained?: number;
  modelVersion: string;
  localAccuracy: number;
  lossMetric?: number;
  weightHash?: string;
  verificationStatus: 'verified_active' | 'syncing' | 'offline';
  latencyMs: number;
  lastWeightUpload: string;
  lastSync?: string;
  contributedInsights?: string;
  rawVaultStatus: string;
}

export interface DemandForecastPoint {
  day: string;
  date: string;
  historicalDemand?: number;
  projectedDemand: number;
  projectedStockRemaining: number;
  upperConfidenceBound: number;
  lowerConfidenceBound: number;
  intervenedStockRemaining?: number;
}

export type DemoPersonaId = 'phc-mo' | 'dho' | 'scm';

export interface DemoPersona {
  id: DemoPersonaId;
  title: string;
  titleHi: string;
  name: string;
  nameHi: string;
  roleBadge: string;
  roleBadgeHi: string;
  initials: string;
  focus: string;
  focusHi: string;
}

