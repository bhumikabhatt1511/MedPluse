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
  status: string;
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
  isDonorCandidate?: boolean | undefined;
  distanceFromTargetKm?: number | undefined;
  transitMinutes?: number | undefined;
}

export interface Medicine {
  id: string;
  medicineId?: string | undefined;
  name: string;
  medicineName?: string | undefined;
  phcId?: string | undefined;
  category: string;
  dosage: string;
  currentStock: number;
  openingStock?: number | undefined;
  unit: string;
  usedToday: number;
  receivedToday: number;
  dailyConsumption?: number | undefined;
  averageDailyConsumption?: number | undefined;
  receivedQuantity?: number | undefined;
  usedQuantity?: number | undefined;
  reorderLevel: number;
  expiryDate: string;
  daysUntilExpiry: number;
  wastedQuantity: number;
  safetyBuffer?: number | undefined;
  predictedDemand?: number | undefined;
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
  rejectionReason?: string | undefined;
  resilienceBefore: number;
  resilienceAfter: number;
  guardrailViolated?: string | undefined;
  coldChainReady: boolean;
  vehicleStatus: string;
  rankingScore?: number | undefined;
  recommendedTransfer?: number | undefined;
  donorDailyConsumption?: number | undefined;
}

export interface TransferRecommendation {
  id: string;
  sourcePhcId: string;
  sourcePhcName: string;
  targetPhcId: string;
  targetPhcName: string;
  medicineName: string;
  medicineId?: string | undefined;
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
  dispatchTime?: string | undefined;
  reasoningPillars?: string[] | undefined;
  explanation?: string | undefined;
}

export interface TransferHistoryItem {
  id: string;
  transferId?: string | undefined;
  timestamp: string;
  approvedAt?: string | undefined;
  sourcePhcName: string;
  donorPHC?: string | undefined;
  targetPhcName: string;
  destinationPHC?: string | undefined;
  medicineId?: string | undefined;
  medicineName: string;
  quantity: number;
  distanceKm?: number | undefined;
  transitMinutes?: number | undefined;
  status: 'completed' | 'in_transit' | 'rejected' | 'COMPLETED' | 'Dispatched' | 'Rejected';
  carrier?: string | undefined;
  temperatureCelsius?: number | undefined;
  resilienceLift?: string | undefined;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phcId: string;
  phcName?: string | undefined;
  shift: string;
  status: string;
  patientsSeenToday: number;
  specialty?: string | undefined;
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
  recordsTrained?: number | undefined;
  modelVersion: string;
  localAccuracy: number;
  lossMetric?: number | undefined;
  weightHash?: string | undefined;
  verificationStatus: 'verified_active' | 'syncing' | 'offline';
  latencyMs: number;
  lastWeightUpload: string;
  lastSync?: string | undefined;
  contributedInsights?: string | undefined;
  rawVaultStatus: string;
}

export interface DemandForecastPoint {
  day: string;
  date: string;
  historicalDemand?: number | undefined;
  projectedDemand: number;
  projectedStockRemaining: number;
  upperConfidenceBound: number;
  lowerConfidenceBound: number;
  intervenedStockRemaining?: number | undefined;
}

export interface EmergencySimulationParams {
  patientSurge: number;
  medicineSurge: number;
  staffDepletion: number;
  emergencySurge: number;
  targetPhcId?: string | undefined;
}

export interface EmergencySimulationResult {
  before: {
    criticalNodes: number;
    bedOccupancy: number;
    resilienceScore: number;
    stockoutDays: number;
    patientPressure: number;
    staffAvailability: number;
    riskScore: number;
    riskLevel: RiskLevel;
  };
  after: {
    criticalNodes: number;
    bedOccupancy: number;
    resilienceScore: number;
    stockoutDays: number;
    patientPressure: number;
    staffAvailability: number;
    riskScore: number;
    riskLevel: RiskLevel;
  };
  mitigated: {
    criticalNodes: number;
    bedOccupancy: number;
    resilienceScore: number;
    stockoutDays: number;
    riskLevel: RiskLevel;
  };
  trajectory: Array<{
    hour: string;
    baselineResilience: number;
    crisisTrajectory: number;
    mitigatedTrajectory: number;
  }>;
  predictedShortages: Array<{
    medicineName: string;
    currentStock: number;
    burnRate: number;
    daysRemaining: number;
    shortageDate: string;
  }>;
  recommendedInterventions: string[];
}

export interface RecommendationExplanationParams {
  recommendation: TransferRecommendation;
  sourcePhc?: PHC | undefined;
  targetPhc?: PHC | undefined;
  medicine?: Medicine | undefined;
  customQuantity?: number | undefined;
}

export interface RecommendationExplanationResult {
  explanation: string;
  reasoningPillars: string[];
  donorImpact: string;
  recipientImpact: string;
  isLiveAI: boolean;
  modelUsed: string;
  error?: string | undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T | undefined;
  message?: string | undefined;
  error?: string | undefined;
  timestamp: string;
}
