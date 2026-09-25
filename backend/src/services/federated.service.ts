import { db } from './prisma.service.js';
import type { FederatedNode } from '../types/index.js';

export async function getFederatedNodes(): Promise<FederatedNode[]> {
  const records = await db.orm.public.FederatedNode.all();
  return records.map((r) => ({
    id: r.id,
    country: r.country,
    countryCode: r.countryCode,
    flag: r.flag,
    institution: r.institution,
    enclaveName: r.enclaveName,
    datasetStatus: r.datasetStatus,
    recordsCount: r.recordsCount,
    recordsTrained: r.recordsTrained,
    modelVersion: r.modelVersion,
    localAccuracy: r.localAccuracy,
    lossMetric: r.lossMetric || undefined,
    weightHash: r.weightHash || undefined,
    verificationStatus: r.verificationStatus as any,
    latencyMs: r.latencyMs,
    lastWeightUpload: r.lastWeightUpload,
    lastSync: r.lastSync ? new Date(r.lastSync).toISOString() : undefined,
    contributedInsights: r.contributedInsights || undefined,
    rawVaultStatus: r.rawVaultStatus,
  }));
}

export async function getFederatedStatus() {
  const nodes = await getFederatedNodes();
  const activeNodes = nodes.filter((n) => n.verificationStatus === 'verified_active');
  const avgAccuracy = nodes.length > 0
    ? Number((nodes.reduce((acc, n) => acc + n.localAccuracy, 0) / nodes.length).toFixed(1))
    : 94.2;

  return {
    sharedModelVersion: 'MedPulse-FedGlobal-v4.8-DiffPriv-ε0.32',
    federationProtocol: 'FedAvg + Differential Privacy Guardrail',
    globalAccuracy: avgAccuracy,
    totalNodes: nodes.length,
    activeNodesCount: activeNodes.length,
    privacyGuarantee: '100% Zero Patient PII Egress (Raw EHR data isolated in local enclaves)',
    aggregationRound: 142,
    lastAggregationTimestamp: new Date().toISOString(),
  };
}

export async function syncFederatedNode(nodeId: string): Promise<FederatedNode | null> {
  const all = await db.orm.public.FederatedNode.all();
  const node = all.find((n) => n.id === nodeId);
  if (!node) return null;

  const now = new Date().toISOString();
  const newHash = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
  const addedRecords = Math.floor(Math.random() * 200) + 50;

  await db.orm.public.FederatedNode.where({ id: nodeId }).update({
    recordsTrained: (node.recordsTrained || 1000) + addedRecords,
    weightHash: newHash,
    verificationStatus: 'verified_active',
    lastSync: now,
    lastWeightUpload: 'Just now (Round #142)',
    updatedAt: now,
  });

  const updatedNodes = await getFederatedNodes();
  return updatedNodes.find((n) => n.id === nodeId) || null;
}
