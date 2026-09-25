/**
 * MedPulse Backend API Client
 * Connects the frontend to the PostgreSQL-backed Express API.
 * Base URL: http://localhost:5000/api
 */

import type {
  PHC,
  Medicine,
  Alert,
  StaffMember,
  TransferRecommendation,
  TransferHistoryItem,
  FederatedNode,
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || json.message || `API error ${response.status}: ${response.statusText}`);
  }

  return json.data;
}

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
export async function fetchHealth() {
  return request<{
    status: string;
    service: string;
    database: string;
    uptimeSeconds: number;
    timestamp: string;
  }>('/health');
}

// ----------------------------------------------------
// PHC Endpoints
// ----------------------------------------------------
export async function fetchPHCs(jurisdiction?: string, district?: string): Promise<PHC[]> {
  const params = new URLSearchParams();
  if (jurisdiction) params.append('jurisdiction', jurisdiction);
  if (district && district !== 'all') params.append('district', district);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request<PHC[]>(`/phcs${query}`);
}

export async function fetchPHCById(id: string): Promise<PHC> {
  return request<PHC>(`/phcs/${id}`);
}

export async function fetchPHCRisk(id: string) {
  return request<any>(`/phcs/${id}/risk`);
}

// ----------------------------------------------------
// Medicine & Inventory Endpoints
// ----------------------------------------------------
export async function fetchMedicines(): Promise<Medicine[]> {
  return request<Medicine[]>('/medicines');
}

export async function fetchPHCInventory(phcId: string): Promise<Medicine[]> {
  return request<Medicine[]>(`/phcs/${phcId}/inventory`);
}

export async function fetchShortages(phcId?: string): Promise<Medicine[]> {
  const query = phcId ? `?phcId=${encodeURIComponent(phcId)}` : '';
  return request<Medicine[]>(`/inventory/shortages${query}`);
}

export async function fetchExpiring(threshold: number = 60, phcId?: string): Promise<Medicine[]> {
  const params = new URLSearchParams();
  params.append('threshold', threshold.toString());
  if (phcId) params.append('phcId', phcId);
  return request<Medicine[]>(`/inventory/expiring?${params.toString()}`);
}

export async function restockMedicine(phcId: string, medicineId: string, amount: number): Promise<Medicine> {
  return request<Medicine>(`/phcs/${phcId}/inventory/restock`, {
    method: 'POST',
    body: JSON.stringify({ medicineId, amount }),
  });
}

// ----------------------------------------------------
// Patient, Bed, Staff Metrics
// ----------------------------------------------------
export async function fetchPatientMetrics(phcId?: string) {
  const query = phcId ? `?phcId=${encodeURIComponent(phcId)}` : '';
  return request<any[]>(`/metrics/patients${query}`);
}

export async function fetchBedMetrics(phcId?: string) {
  const query = phcId ? `?phcId=${encodeURIComponent(phcId)}` : '';
  return request<any[]>(`/metrics/beds${query}`);
}

export async function fetchStaffMetrics(phcId?: string) {
  const query = phcId ? `?phcId=${encodeURIComponent(phcId)}` : '';
  return request<any[]>(`/metrics/staff${query}`);
}

export async function fetchStaffMembers(phcId?: string): Promise<StaffMember[]> {
  const query = phcId ? `?phcId=${encodeURIComponent(phcId)}` : '';
  return request<StaffMember[]>(`/metrics/staff/members${query}`);
}

// ----------------------------------------------------
// Alerts Endpoints
// ----------------------------------------------------
export async function fetchAlerts(): Promise<Alert[]> {
  return request<Alert[]>('/alerts');
}

export async function resolveAlert(id: string) {
  return request<{ success: boolean }>(`/alerts/${id}/resolve`, {
    method: 'POST',
  });
}

// ----------------------------------------------------
// Safe Transfer & Redistribution Endpoints
// ----------------------------------------------------
export async function fetchTransferRecommendations(
  targetPhcId: string = 'phc-alpha',
  medicineId: string = 'med-01'
): Promise<{
  recommendation: TransferRecommendation;
  alternativeDonors: any[];
}> {
  return request<{
    recommendation: TransferRecommendation;
    alternativeDonors: any[];
  }>(`/transfers/recommendations?targetPhcId=${targetPhcId}&medicineId=${medicineId}`);
}

export async function approveTransfer(payload: {
  sourcePhcId: string;
  targetPhcId: string;
  medicineId: string;
  approvedQuantity: number;
  transferId?: string;
  carrier?: string;
  temperatureCelsius?: number;
}): Promise<TransferHistoryItem> {
  return request<TransferHistoryItem>('/transfers/approve', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function rejectTransfer(payload: {
  sourcePhcName: string;
  targetPhcName: string;
  medicineName: string;
  reason: string;
  quantity: number;
}): Promise<TransferHistoryItem> {
  return request<TransferHistoryItem>('/transfers/reject', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTransferHistory(): Promise<TransferHistoryItem[]> {
  return request<TransferHistoryItem[]>('/transfers/history');
}

// ----------------------------------------------------
// Emergency Simulator Endpoint
// ----------------------------------------------------
export async function simulateEmergencyScenario(params: {
  patientSurge: number;
  medicineSurge: number;
  staffDepletion: number;
  emergencySurge: number;
  targetPhcId?: string;
}) {
  return request<any>('/simulation/emergency', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ----------------------------------------------------
// Explainable AI Endpoints
// ----------------------------------------------------
export async function explainTransferAI(payload: {
  recommendation: TransferRecommendation;
  sourcePhc?: PHC;
  targetPhc?: PHC;
  medicine?: Medicine;
  customQuantity?: number;
}) {
  return request<{
    explanation: string;
    reasoningPillars: string[];
    donorImpact: string;
    recipientImpact: string;
    isLiveAI: boolean;
    modelUsed: string;
    error?: string;
  }>('/ai/explain-transfer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function analyzeEmergencyAI(payload: any) {
  return request<any>('/ai/analyze-emergency', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAIStatus() {
  return request<{
    isConfigured: boolean;
    engine: string;
    provider: string;
  }>('/ai/status');
}

// ----------------------------------------------------
// Federated AI Simulation Endpoints
// ----------------------------------------------------
export async function fetchFederatedNodes(): Promise<FederatedNode[]> {
  return request<FederatedNode[]>('/federated/nodes');
}

export async function fetchFederatedStatus() {
  return request<any>('/federated/status');
}

export async function syncFederatedNode(nodeId: string): Promise<FederatedNode> {
  return request<FederatedNode>(`/federated/nodes/${nodeId}/sync`, {
    method: 'POST',
  });
}
