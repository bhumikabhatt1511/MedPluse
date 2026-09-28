import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Share2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Truck,
  Navigation,
  Clock,
  Pill,
  Sliders,
  Check,
  Zap,
  Info,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Volume2,
  VolumeX,
  History,
  X,
  RotateCcw,
  ArrowUpRight,
  ChevronDown,
  Printer,
  FileText,
} from 'lucide-react';
import { PHC, TransferRecommendation, TransferHistoryItem, Medicine, DemoPersonaId } from '../../types';
import { INITIAL_TRANSFER_HISTORY, INITIAL_MEDICINES } from '../../data/mockData';
import { RiskBadge } from '../common/RiskBadge';
import { TransferGatePassModal, TransferGatePassData } from '../common/TransferGatePassModal';
import {
  explainResourceTransferRecommendation,
  RecommendationExplanationResult,
  isGeminiConfigured,
} from '../../services/gemini';
import {
  computeMedicineMetrics,
  calculateDaysOfStockRemaining,
  calculateStockoutRisk,
  calculatePredictedStockoutDate,
  calculateRequiredTransferQuantity,
  evaluateDonorCandidates,
  generateTransferRecommendation,
  verifyDonorProtection,
} from '../../utils/medicineCalculations';
import { speakText, stopSpeech, isSpeechSupported } from '../../utils/speech';
import { LanguageCode, getTranslation } from '../../utils/i18n';

interface ResourceOptimizerViewProps {
  language?: LanguageCode;
  phcs: PHC[];
  medicines?: Medicine[];
  recommendation: TransferRecommendation;
  transferHistory?: TransferHistoryItem[];
  onApproveTransfer: (updatedRec: TransferRecommendation) => void;
  onRejectTransfer?: (reason: string) => void;
  activePersonaId?: DemoPersonaId;
}

export const ResourceOptimizerView: React.FC<ResourceOptimizerViewProps> = ({
  language = 'en',
  phcs,
  medicines = INITIAL_MEDICINES,
  recommendation,
  transferHistory: initialTransferHistory = INITIAL_TRANSFER_HISTORY,
  onApproveTransfer,
  onRejectTransfer,
  activePersonaId = 'dho',
}) => {
  const t = getTranslation(language);

  // Computed medicines with deterministic metrics
  const computedMedicines = useMemo(() => {
    return (medicines || []).map((m) => computeMedicineMetrics(m));
  }, [medicines]);

  // Find all medicines with critical or high shortage risk
  const shortageMedicines = useMemo(() => {
    const criticalOrHigh = computedMedicines.filter(
      (m) => m.stockoutRisk === 'critical' || m.stockoutRisk === 'high' || m.stockoutRisk === 'warning'
    );
    return criticalOrHigh.length > 0 ? criticalOrHigh : computedMedicines;
  }, [computedMedicines]);

  // Selected shortage & destination state
  const [selectedShortageId, setSelectedShortageId] = useState<string>(() => {
    const matching = computedMedicines.find(
      (m) => m.name.includes(recommendation.medicineName) || m.id === recommendation.medicineId
    );
    return matching?.id || shortageMedicines[0]?.id || computedMedicines[0]?.id || 'med-01';
  });

  const [selectedDestinationPhcId, setSelectedDestinationPhcId] = useState<string>(
    recommendation.targetPhcId || 'phc-alpha'
  );

  const destinationPhc = useMemo(() => {
    return phcs.find((p) => p.id === selectedDestinationPhcId) || phcs[0];
  }, [phcs, selectedDestinationPhcId]);

  const activeShortageMed = useMemo(() => {
    return (
      computedMedicines.find((m) => m.id === selectedShortageId) ||
      shortageMedicines[0] ||
      computedMedicines[0]
    );
  }, [computedMedicines, shortageMedicines, selectedShortageId]);

  // Dynamically evaluate and rank all potential donor PHCs
  const evaluatedDonors = useMemo(() => {
    return evaluateDonorCandidates(destinationPhc, activeShortageMed, phcs);
  }, [destinationPhc, activeShortageMed, phcs]);

  // Selected donor state (default to top-ranked eligible donor)
  const [selectedDonorId, setSelectedDonorId] = useState<string>(() => {
    const topEligible = evaluatedDonors.find((d) => d.status === 'eligible');
    return topEligible?.phcId || evaluatedDonors[0]?.phcId || 'phc-beta';
  });

  // Keep selectedDonor synchronized when evaluatedDonors change
  useEffect(() => {
    if (!evaluatedDonors.some((d) => d.phcId === selectedDonorId)) {
      const topEligible = evaluatedDonors.find((d) => d.status === 'eligible');
      if (topEligible) {
        setSelectedDonorId(topEligible.phcId);
      }
    }
  }, [evaluatedDonors, selectedDonorId]);

  const selectedDonor = useMemo(() => {
    return (
      evaluatedDonors.find((d) => d.phcId === selectedDonorId) ||
      evaluatedDonors.find((d) => d.status === 'eligible') ||
      evaluatedDonors[0]
    );
  }, [evaluatedDonors, selectedDonorId]);

  // Dynamic required quantity calculation
  const destDaily = activeShortageMed.dailyConsumption || activeShortageMed.burnRatePerDay || 150;
  const destCurrentStock = activeShortageMed.currentStock;
  const destDaysRemaining = activeShortageMed.daysOfStockRemaining;
  const dynamicallyRequiredQty = useMemo(() => {
    return calculateRequiredTransferQuantity(destCurrentStock, destDaily, 10);
  }, [destCurrentStock, destDaily]);

  // Transfer quantity slider state (default bounded to donor safe surplus)
  const defaultQty = useMemo(() => {
    const maxSafe = selectedDonor?.safeSurplus || 300;
    return Math.min(dynamicallyRequiredQty, maxSafe);
  }, [dynamicallyRequiredQty, selectedDonor]);

  const [transferQty, setTransferQty] = useState<number>(defaultQty);

  // Update transferQty when selected donor or shortage changes
  useEffect(() => {
    const maxSafe = selectedDonor?.safeSurplus || 300;
    setTransferQty(Math.min(dynamicallyRequiredQty, Math.max(50, maxSafe)));
  }, [selectedDonor, dynamicallyRequiredQty]);

  // Donor Protection Verification
  const donorDaily = selectedDonor?.donorDailyConsumption || 65;
  const donorProtection = useMemo(() => {
    if (!selectedDonor) return { isAllowed: true };
    return verifyDonorProtection(selectedDonor.inHandStock, donorDaily, transferQty);
  }, [selectedDonor, donorDaily, transferQty]);

  // UI state
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Local buffer reallocation preferred.');
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>(initialTransferHistory);
  const [gatePassModalOpen, setGatePassModalOpen] = useState<boolean>(false);
  const [activeGatePassData, setActiveGatePassData] = useState<TransferGatePassData | null>(null);

  // Sync transferHistory from parent
  useEffect(() => {
    setTransferHistory(initialTransferHistory);
  }, [initialTransferHistory]);

  // Gemini AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<RecommendationExplanationResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Dynamic Post-Transfer Calculations
  const calculatedDonorStockPost = Math.max(0, (selectedDonor?.inHandStock || 1420) - transferQty);
  const calculatedDonorRemainingSurplus = Math.max(0, (selectedDonor?.safeSurplus || 420) - transferQty);
  const calculatedDonorDaysPost = calculateDaysOfStockRemaining(calculatedDonorStockPost, donorDaily);
  const calculatedDonorRiskPost = calculateStockoutRisk(calculatedDonorDaysPost);

  const calculatedTargetStockPost = destCurrentStock + transferQty;
  const calculatedTargetDaysPost = calculateDaysOfStockRemaining(calculatedTargetStockPost, destDaily);
  const calculatedTargetRiskPost = calculateStockoutRisk(calculatedTargetDaysPost);

  const calculatedDonorResiliencePost = Math.max(
    50,
    Math.round((selectedDonor?.resilienceBefore || 88) - (transferQty / Math.max(1, selectedDonor?.inHandStock || 1420)) * 10)
  );

  // Function to fetch AI explanation from Gemini
  const fetchAiExplanation = useCallback(async () => {
    if (!selectedDonor) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await explainResourceTransferRecommendation({
        destinationPhcName: destinationPhc.name,
        medicineName: activeShortageMed.name,
        destinationCurrentStock: destCurrentStock,
        destinationDailyConsumption: destDaily,
        destinationDaysRemaining: destDaysRemaining,
        destinationRisk: activeShortageMed.stockoutRisk,
        donorPhcName: selectedDonor.phcName,
        donorStock: selectedDonor.inHandStock,
        donorDailyConsumption: donorDaily,
        donorSafeSurplus: selectedDonor.safeSurplus,
        transferQuantity: transferQty,
        donorPostTransferStock: calculatedDonorStockPost,
        donorPostTransferDays: calculatedDonorDaysPost,
        destinationPostTransferDays: calculatedTargetDaysPost,
        distanceKm: selectedDonor.distanceKm,
        transitMinutes: selectedDonor.transitMinutes,
      });
      setAiExplanation(result);
      if (result.error && result.isLiveAI === false && isGeminiConfigured()) {
        setAiError(result.error);
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI explanation.');
    } finally {
      setIsAiLoading(false);
    }
  }, [
    destinationPhc,
    activeShortageMed,
    destCurrentStock,
    destDaily,
    destDaysRemaining,
    selectedDonor,
    donorDaily,
    transferQty,
    calculatedDonorStockPost,
    calculatedDonorDaysPost,
    calculatedTargetDaysPost,
  ]);

  // Initial load of explanation
  useEffect(() => {
    fetchAiExplanation();
    return () => {
      stopSpeech();
    };
  }, [fetchAiExplanation]);

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      if (!aiExplanation) return;
      const textToSpeak = `${aiExplanation.explanation}. Key reasoning: ${aiExplanation.reasoningPillars.join('. ')}`;
      speakText(textToSpeak, 'en-IN');
      setIsSpeaking(true);
    }
  };

  const handleAuthorize = () => {
    if (!donorProtection.isAllowed) {
      alert(donorProtection.error || 'Transfer blocked by donor protection rule.');
      return;
    }

    setIsDispatched(true);
    setShowApprovalModal(false);

    // Build the executed transfer record
    const newRecord: TransferHistoryItem = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      timestamp:
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      approvedAt: new Date().toISOString(),
      sourcePhcName: selectedDonor.phcName,
      donorPHC: selectedDonor.phcName,
      targetPhcName: destinationPhc.name,
      destinationPHC: destinationPhc.name,
      medicineName: activeShortageMed.name,
      medicineId: activeShortageMed.id,
      quantity: transferQty,
      distanceKm: selectedDonor.distanceKm,
      transitMinutes: selectedDonor.transitMinutes,
      status: 'completed',
      carrier: 'Cold-Chain Van Alpha-2 (+4.1°C Active)',
      temperatureCelsius: 4.1,
      resilienceLift: `${destDaysRemaining}d → ${calculatedTargetDaysPost}d (+${(calculatedTargetDaysPost - destDaysRemaining).toFixed(1)}d buffer)`,
    };

    setTransferHistory((prev) => [newRecord, ...prev]);

    // Construct printable gate pass manifest data
    const gatePass: TransferGatePassData = {
      transferId: newRecord.id,
      timestamp: newRecord.timestamp,
      status: 'approved',
      priority: 'HIGH PRIORITY — CRITICAL STOCKOUT PREVENTION',
      donorPhcName: selectedDonor.phcName,
      donorDistrict: selectedDonor.district || destinationPhc.district,
      donorState: destinationPhc.state || 'Maharashtra',
      donorSafeSurplus: selectedDonor.safeSurplus,
      donorBufferDays: calculatedDonorDaysPost,
      donorInHandStock: selectedDonor.inHandStock,
      targetPhcName: destinationPhc.name,
      targetDistrict: destinationPhc.district,
      targetState: destinationPhc.state || 'Maharashtra',
      targetPreStockDays: destDaysRemaining,
      targetPostStockDays: calculatedTargetDaysPost,
      medicineName: activeShortageMed.name,
      medicineCategory: activeShortageMed.category,
      quantity: transferQty,
      unit: activeShortageMed.unit || 'Units',
      batchNumber: `BATCH-2026-${activeShortageMed.id.toUpperCase()}`,
      distanceKm: selectedDonor.distanceKm,
      transitMinutes: selectedDonor.transitMinutes,
      carrier: newRecord.carrier || 'Cold-Chain Van Alpha-2 (+4.1°C Active)',
      corridor: `${selectedDonor.phcName.split('(')[0].trim()} → ${destinationPhc.name.split('(')[0].trim()} Express Corridor`,
      temperatureCelsius: 4.1,
      guardrailStatus: '10-Day Safe Surplus Rule Enforced • Zero Secondary Shortage Risk',
      reasoningPillars: aiExplanation?.reasoningPillars,
      explanation: aiExplanation?.explanation,
    };
    setActiveGatePassData(gatePass);

    // Construct updated recommendation payload
    const updatedRec: TransferRecommendation = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      sourcePhcId: selectedDonor.phcId,
      sourcePhcName: selectedDonor.phcName,
      targetPhcId: destinationPhc.id,
      targetPhcName: destinationPhc.name,
      medicineName: activeShortageMed.name,
      medicineId: activeShortageMed.id,
      requestedQuantity: dynamicallyRequiredQty,
      approvedQuantity: transferQty,
      safeSurplusAvailable: selectedDonor.safeSurplus,
      distanceKm: selectedDonor.distanceKm,
      transitMinutes: selectedDonor.transitMinutes,
      expectedShortageDate: calculatePredictedStockoutDate(destDaysRemaining),
      shortageAvoidedDays: Number((calculatedTargetDaysPost - destDaysRemaining).toFixed(1)),
      donorSafetyBufferPercent: Math.round((calculatedDonorStockPost / ((selectedDonor.own7DayDemand || 450) + (selectedDonor.safetyBuffer || 200))) * 100),
      donorRiskBefore: 'stable',
      donorRiskAfter: calculatedDonorRiskPost,
      targetRiskBefore: activeShortageMed.stockoutRisk,
      targetRiskAfter: calculatedTargetRiskPost,
      status: 'completed',
      dispatchTime: new Date().toISOString(),
      reasoningPillars: aiExplanation?.reasoningPillars,
      explanation: aiExplanation?.explanation,
    };

    onApproveTransfer(updatedRec);
  };

  const handleConfirmReject = () => {
    setIsRejected(true);
    setShowRejectModal(false);

    const newRecord: TransferHistoryItem = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      timestamp:
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      approvedAt: new Date().toISOString(),
      sourcePhcName: selectedDonor.phcName,
      donorPHC: selectedDonor.phcName,
      targetPhcName: destinationPhc.name,
      destinationPHC: destinationPhc.name,
      medicineName: activeShortageMed.name,
      medicineId: activeShortageMed.id,
      quantity: transferQty,
      distanceKm: selectedDonor.distanceKm,
      transitMinutes: selectedDonor.transitMinutes,
      status: 'rejected',
      carrier: 'N/A (Admin Override)',
      temperatureCelsius: 0,
      resilienceLift: `Rejected (${rejectReason})`,
    };

    setTransferHistory((prev) => [newRecord, ...prev]);

    if (onRejectTransfer) {
      onRejectTransfer(rejectReason);
    }
  };

  const handleResetWorkflow = () => {
    setIsDispatched(false);
    setIsRejected(false);
    setTransferQty(defaultQty);
  };

  return (
    <div id="resource-optimizer-view" className="space-y-6">
      {/* Guiding Axiom Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'स्वायत्त संतुलन इंजन' : 'Autonomous Balancing Engine'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Algorithm v4.2 • Deterministic</span>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 border border-cyan-300/40 text-cyan-200 text-[10px] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              Powered by Gemini
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            {t.optimizerTitle}
          </h1>
          <p className="text-xs text-cyan-200/90 max-w-2xl font-medium">
            {language === 'hi'
              ? 'गंभीर औषधि कमी को पहचानें, सुरक्षित अधिशेष वाले दाता खोजें, और शून्य द्वितीयक जोखिम के साथ पुनर्वितरण निष्पादित करें।'
              : 'Identify critical medicine shortages, find donors with verified safe surplus, and execute redistribution with zero secondary shortage risk.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] text-slate-300 uppercase font-bold">
              {language === 'hi' ? 'अनुकूलन लक्ष्य' : 'Optimization Target'}
            </div>
            <div className="text-sm font-bold text-cyan-300">
              {destinationPhc.name.split('(')[0]} ({activeShortageMed.name})
            </div>
          </div>
        </div>
      </div>

      {/* 1. SHORTAGE SELECTION & REDISTRIBUTION NEED BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-cyan-600" />
              {language === 'hi' ? 'पहचानी गई औषधि कमी एवं पुनर्वितरण आवश्यकता' : 'Identified Shortage & Redistribution Need'}
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {destinationPhc.name} — {activeShortageMed.name}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-500 font-semibold">{language === 'hi' ? 'कमी चुनें:' : 'Select Shortage:'}</label>
            <select
              value={selectedShortageId}
              onChange={(e) => setSelectedShortageId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer max-w-xs truncate"
            >
              {shortageMedicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.stockoutRisk.toUpperCase()} - {m.daysOfStockRemaining}d remaining)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Telemetry Metrics for Destination Shortage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs font-mono">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-sans">{language === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock'}</span>
            <span className="font-bold text-slate-900 text-sm">{destCurrentStock} {activeShortageMed.unit}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-sans">{language === 'hi' ? 'दैनिक खपत' : 'Daily Consumption'}</span>
            <span className="font-bold text-slate-900 text-sm">{destDaily} {activeShortageMed.unit}/d</span>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-[10px] text-rose-700 block font-sans">{language === 'hi' ? 'शेष दिन एवं जोखिम' : 'Days Left & Risk'}</span>
            <span className="font-bold text-rose-900 text-sm">{destDaysRemaining}d ({activeShortageMed.stockoutRisk.toUpperCase()})</span>
          </div>
          <div className="p-2.5 bg-cyan-50 rounded-xl border border-cyan-200">
            <span className="text-[10px] text-cyan-800 block font-sans">{language === 'hi' ? 'गतिशील आवश्यक मात्रा (10d बफर)' : 'Required Quantity (10d Buffer)'}</span>
            <span className="font-bold text-cyan-950 text-sm">{dynamicallyRequiredQty} {activeShortageMed.unit}</span>
          </div>
        </div>
      </div>

      {/* Strict AI Guardrail Rules Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          {t.donorResilienceGuardrail}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {language === 'hi' ? 'गार्डरेल 01: दाता प्रत्यास्थता तल' : 'Guardrail 01: Donor Resilience Floor'}
            </div>
            <p className="text-[11px] text-emerald-800 mt-1">
              {language === 'hi' ? 'हस्तांतरण के बाद दाता की प्रत्यास्थता 75% से नीचे नहीं जानी चाहिए।' : 'Donor resilience score must NOT drop below 75% post-transfer. Eliminates secondary cascade failure.'}
            </p>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {language === 'hi' ? 'गार्डरेल 02: सुरक्षित अधिशेष सूत्र' : 'Guardrail 02: Safe Surplus Formula'}
            </div>
            <p className="text-[11px] text-emerald-800 mt-1 font-mono text-[10px]">
              Surplus = In-Hand - (Demand_7d) - Buffer_3d
              <span className="block font-sans text-[11px] text-emerald-700 mt-0.5">
                {language === 'hi' ? 'हस्तांतरण केवल गणितीय रूप से सकारात्मक अधिशेष से ही किया जाएगा।' : 'Transfers may ONLY draw from mathematically positive surplus.'}
              </span>
            </p>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {language === 'hi' ? 'गार्डरेल 03: कोल्ड-चेन पारगमन अवधि' : 'Guardrail 03: Cold-Chain Transit Window'}
            </div>
            <p className="text-[11px] text-emerald-800 mt-1">
              {language === 'hi' ? 'सड़क गलियारे में पारगमन ≤ 90 मिनट में सक्रिय प्रशीतन (+2°C से +8°C) के साथ पूरा होना चाहिए।' : 'Road corridor transit must complete in ≤ 90 minutes with verified active refrigeration (+2°C to +8°C).'}
            </p>
          </div>
        </div>
      </div>

      {/* Target Deficit & Reallocation Route Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-600" />
            {t.transitRouteTitle}
          </h2>
          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
            Protocol: TR-AP-2026-0914 • Live Sync
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Source Donor */}
          <div className="md:col-span-4 bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-700">{language === 'hi' ? 'स्रोत दाता नोड' : 'Source Donor Node'}</span>
              <RiskBadge level={calculatedDonorRiskPost} size="sm" language={language} />
            </div>
            <div className="text-base font-bold text-slate-900">{selectedDonor?.phcName}</div>
            <div className="text-xs text-slate-500">{selectedDonor?.district}</div>
            <div className="pt-2 border-t border-emerald-200 text-xs font-mono space-y-0.5 text-slate-700">
              <div>{language === 'hi' ? 'उपलब्ध स्टॉक:' : 'In-Hand Stock:'} <strong>{selectedDonor?.inHandStock}u</strong></div>
              <div>{language === 'hi' ? 'सुरक्षित अधिशेष:' : 'Safe Surplus:'} <strong className="text-emerald-700 font-bold">{selectedDonor?.safeSurplus}u {language === 'hi' ? 'उपलब्ध' : 'available'}</strong></div>
              <div>{language === 'hi' ? 'हस्तांतरण उपरांत प्रत्यास्थता:' : 'Resilience After Transfer:'} <strong className="text-emerald-700 font-bold">{calculatedDonorResiliencePost}%</strong></div>
            </div>
          </div>

          {/* Transfer Telemetry Middle */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-2 text-center space-y-2">
            <div className="w-full flex items-center justify-center gap-2">
              <div className="h-0.5 flex-1 bg-cyan-200" />
              <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div className="h-0.5 flex-1 bg-cyan-200" />
            </div>
            <div className="text-xs font-bold text-slate-900">
              {language === 'hi' ? `${transferQty} यूनिट्स पुनर्आवंटित हो रही हैं` : `Reallocating ${transferQty} Units`}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {activeShortageMed.name} • {selectedDonor?.distanceKm} km • ~{selectedDonor?.transitMinutes} min {language === 'hi' ? 'पारगमन' : 'Transit'}
            </div>
            <div className="text-[10px] bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 rounded font-semibold">
              {language === 'hi' ? 'चिकित्सा वैन अल्फा-2 (+4.1°C सत्यापित)' : 'Medical Van Alpha-2 (+4.1°C Validated)'}
            </div>
          </div>

          {/* Destination Target */}
          <div className="md:col-span-4 bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-rose-700">{t.targetDeficitTitle}</span>
              <RiskBadge level={isDispatched ? calculatedTargetRiskPost : activeShortageMed.stockoutRisk} size="sm" language={language} />
            </div>
            <div className="text-base font-bold text-slate-900">{destinationPhc.name}</div>
            <div className="text-xs text-slate-500">{destinationPhc.district}</div>
            <div className="pt-2 border-t border-rose-200 text-xs font-mono space-y-0.5 text-slate-700">
              <div>{language === 'hi' ? 'वर्तमान स्टॉक:' : 'Current In-Hand:'} <strong>{destCurrentStock}u ({destDaysRemaining}d left)</strong></div>
              <div>{language === 'hi' ? 'हस्तांतरण उपरांत स्टॉक:' : 'Post-Transfer Stock:'} <strong className="text-emerald-700 font-bold">{calculatedTargetStockPost}u</strong></div>
              <div>{language === 'hi' ? 'विस्तारित सुरक्षित बफर:' : 'Buffer Extended to:'} <strong className="text-emerald-700 font-bold">{calculatedTargetDaysPost} {language === 'hi' ? 'दिन सुरक्षित' : 'Days Safe'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI RECOMMENDATION EXPLANATION ("WHY THIS DONOR?" — POWERED BY GEMINI) */}
      <div
        id="ai-recommendation-explanation-box"
        className="bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 rounded-2xl p-5 text-white border border-cyan-500/40 shadow-lg space-y-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {language === 'hi' ? '\"यही दाता क्यों?\" — जेमिनी व्याख्या' : '\"Why This Donor?\" — Gemini Explanation'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold">
                  Powered by Gemini
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80">
                {language === 'hi' ? 'नैदानिक मीट्रिक, सुरक्षित अधिशेष एवं सड़क पारगमन पर आधारित एआई तर्क' : 'Grounding AI reasoning over safe surplus math, donor protection floors & road network risks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="text-[10px] font-mono text-slate-400">
              {aiExplanation?.modelUsed || 'Gemini 2.5 Flash'}
            </span>
            {isSpeechSupported() && (
              <button
                onClick={handleToggleVoice}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-cyan-200'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? t.stopAudio : t.readAloud}</span>
              </button>
            )}
            <button
              onClick={fetchAiExplanation}
              disabled={isAiLoading}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-200 text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{isAiLoading ? (language === 'hi' ? 'विश्लेषण...' : 'Analyzing...') : (language === 'hi' ? 'पुनः उत्पन्न करें' : 'Regenerate')}</span>
            </button>
          </div>
        </div>

        {/* AI Loading State */}
        {isAiLoading ? (
          <div className="p-6 text-center space-y-3 relative z-10">
            <div className="flex items-center justify-center gap-2 text-cyan-300 font-semibold text-xs animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Gemini is analyzing donor safe surplus & clinical resilience telemetry...</span>
            </div>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full w-2/3 animate-pulse" />
            </div>
          </div>
        ) : (
          /* AI Explanation Content */
          <div className="space-y-4 relative z-10">
            <div className="p-3.5 bg-white/5 backdrop-blur-xs rounded-xl border border-cyan-500/30 text-xs text-cyan-100 leading-relaxed font-medium">
              &ldquo;{aiExplanation?.explanation}&rdquo;
            </div>

            {/* 4 Reasoning Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {aiExplanation?.reasoningPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-900/60 rounded-xl border border-white/10 flex items-start gap-2 text-slate-300 text-[11px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{pillar}</span>
                </div>
              ))}
            </div>

            {/* Outcomes Comparison Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cyan-500/20 text-xs">
              <div className="flex items-center justify-between bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
                <span className="text-emerald-300 text-[11px]">Donor Post-Transfer Buffer:</span>
                <span className="font-bold text-emerald-200">{aiExplanation?.donorImpact}</span>
              </div>
              <div className="flex items-center justify-between bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/30">
                <span className="text-cyan-300 text-[11px]">Destination Stock Extension:</span>
                <span className="font-bold text-cyan-200">{aiExplanation?.recipientImpact}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. RANKED DONOR CANDIDATES & VOLUME ADJUSTMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Multi-Candidate Donor Evaluation Cards */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t.candidateDonorsTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'एआई ने नेटवर्क नोड्स का मूल्यांकन किया। केवल वही स्वीकृत हैं जिनका सुरक्षित अधिशेष सकारात्मक है।'
                : 'All network nodes evaluated deterministically. Ranked by Safe Surplus, Proximity, and Post-Transfer Resilience.'}
            </p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {evaluatedDonors.slice(0, 5).map((donor) => {
              const isSelected = selectedDonorId === donor.phcId;
              const isEligible = donor.status === 'eligible';

              return (
                <div
                  key={donor.phcId}
                  onClick={() => isEligible && setSelectedDonorId(donor.phcId)}
                  className={`p-4 rounded-xl border transition-all ${
                    isEligible
                      ? isSelected
                        ? 'bg-cyan-50/60 border-cyan-400 ring-2 ring-cyan-200 cursor-pointer'
                        : 'bg-white border-slate-200 hover:border-cyan-300 cursor-pointer'
                      : 'bg-slate-50/80 border-slate-200 opacity-80 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{donor.phcName}</span>
                        <span className="text-xs text-slate-400">({donor.district})</span>
                        {donor.rankingScore && donor.rankingScore > 0 ? (
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                            Score: {donor.rankingScore}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {language === 'hi' ? 'दूरी:' : 'Distance:'} {donor.distanceKm} km • {language === 'hi' ? 'पारगमन:' : 'Transit:'} ~{donor.transitMinutes} min
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        donor.status === 'eligible'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : donor.status === 'rejected'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {language === 'hi'
                        ? donor.status === 'eligible'
                          ? 'पात्र (सुरक्षित)'
                          : donor.status === 'rejected'
                          ? 'अस्वीकृत'
                          : 'अवरुद्ध'
                        : donor.status === 'eligible'
                        ? 'SAFE / ELIGIBLE'
                        : donor.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Math Breakdown Table */}
                  <div className="grid grid-cols-4 gap-2 text-xs bg-white/90 p-2 rounded-lg border border-slate-100 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{language === 'hi' ? 'स्टॉक' : 'Stock'}</span>
                      <span className="font-bold text-slate-800">{donor.inHandStock}u</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{language === 'hi' ? '7d मांग' : '7d Demand'}</span>
                      <span className="text-slate-600">-{donor.own7DayDemand}u</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{language === 'hi' ? '3d बफर' : '3d Buffer'}</span>
                      <span className="text-slate-600">-{donor.safetyBuffer}u</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{language === 'hi' ? 'सुरक्षित अधिशेष' : 'Safe Surplus'}</span>
                      <span
                        className={`font-bold ${
                          donor.safeSurplus > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        ={donor.safeSurplus}u
                      </span>
                    </div>
                  </div>

                  {/* Rejection / Resilience Reason */}
                  {donor.status === 'eligible' ? (
                    <div className="mt-2 text-xs text-emerald-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {language === 'hi'
                          ? `प्रत्यास्थता उच्च बनी रहती है: ${donor.resilienceBefore}% → ${donor.resilienceAfter}% (सुरक्षित > 75%)`
                          : `Resilience stays high: ${donor.resilienceBefore}% → ${donor.resilienceAfter}% (Safe > 75%)`}
                      </span>
                      <span className="text-[11px] font-semibold text-cyan-700">
                        {language === 'hi' ? `सुझाव: ${donor.recommendedTransfer}u` : `Rec: ${donor.recommendedTransfer}u`}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-rose-700 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{donor.rejectionReason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Interactive Volume Slider & Approval */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Interactive Transfer Volume Slider Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-600" />
                {language === 'hi' ? 'हस्तांतरण मात्रा समायोजन' : 'Transfer Volume Adjustment'}
              </h3>
              <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                {language === 'hi' ? 'अधिकतम सुरक्षित:' : 'Max Safe Surplus:'} {selectedDonor?.safeSurplus || 0}u
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-600 font-semibold">
                  {language === 'hi' ? 'हस्तांतरण मात्रा:' : 'Transfer Quantity:'}
                </label>
                <span className="font-mono text-lg font-bold text-cyan-800">
                  {transferQty} {activeShortageMed.unit}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max={Math.max(50, selectedDonor?.safeSurplus || 300)}
                step="25"
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                disabled={isDispatched || isRejected}
                className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Min: 50u</span>
                <span>{language === 'hi' ? `आवश्यक: ${dynamicallyRequiredQty}u` : `Req: ${dynamicallyRequiredQty}u`}</span>
                <span>Max: {selectedDonor?.safeSurplus || 0}u</span>
              </div>
            </div>

            {/* Donor Protection Warning if invalid */}
            {!donorProtection.isAllowed && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{donorProtection.error || (language === 'hi' ? 'हस्तांतरण अवरुद्ध: दाता सुरक्षा सीमा का उल्लंघन होगा।' : 'Transfer blocked: donor safety threshold would be violated.')}</span>
              </div>
            )}

            {/* Impact Calculation Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700">{language === 'hi' ? 'परिणाम टेलीमेट्री:' : 'Simulated Outcome Telemetry:'}</div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{language === 'hi' ? 'दाता के पास शेष अधिशेष:' : 'Donor Surplus Remaining:'}</span>
                <span className="font-mono font-bold text-slate-900">
                  {calculatedDonorRemainingSurplus} {activeShortageMed.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{language === 'hi' ? 'दाता की सुरक्षा:' : 'Donor Safety:'}</span>
                <span className="font-mono font-bold text-emerald-700">
                  {calculatedDonorDaysPost} {language === 'hi' ? 'दिन (सुरक्षित)' : 'Days (Safe)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{language === 'hi' ? 'लक्षित पीएचसी कवरेज विस्तार:' : 'Target PHC Coverage Extended:'}</span>
                <span className="font-mono font-bold text-emerald-700">
                  {destDaysRemaining}d → {calculatedTargetDaysPost} {language === 'hi' ? 'दिन सुरक्षित' : 'Days Safe'}
                </span>
              </div>
            </div>

            {/* Authorization / Rejection Actions */}
            {!isDispatched && !isRejected ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4 text-rose-500" />
                  {language === 'hi' ? 'अस्वीकार करें' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  disabled={!donorProtection.isAllowed}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  {language === 'hi' ? `हस्तांतरण स्वीकृत करें (${transferQty}u)` : `Approve Transfer (${transferQty}u)`}
                </button>
              </div>
            ) : isDispatched ? (
              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'हस्तांतरण पूर्ण • इन्वेंटरी और अलर्ट तुरंत अपडेट किए गए'
                      : 'Transfer Completed • Inventory & Alerts Updated Immediately'}
                  </span>
                </div>

                {/* Print Gate Pass Action */}
                <button
                  type="button"
                  onClick={() => setGatePassModalOpen(true)}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>{language === 'hi' ? 'हस्तांतरण गेट पास प्रिंट करें (A4)' : 'Print Transfer Gate Pass (A4)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetWorkflow}
                  className="w-full py-1.5 text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === 'hi' ? 'नया हस्तांतरण निष्पादित करें' : 'Execute Another Transfer'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{language === 'hi' ? `हस्तांतरण अस्वीकृत • ${rejectReason}` : `Transfer Rejected • ${rejectReason}`}</span>
                </div>
                <button
                  onClick={handleResetWorkflow}
                  className="w-full py-1.5 text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === 'hi' ? 'पुनर्मूल्यांकन करें' : 'Re-evaluate Optimization Plan'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Security & Cold-Chain Badge */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-600 text-[10px] block">
              {language === 'hi' ? 'स्वायत्त प्रेषण सत्यापन' : 'Autonomous Dispatch Verification'}
            </span>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <strong>{language === 'hi' ? 'वाहन:' : 'Carrier:'}</strong> Cold-Chain Medical Van Alpha-2 (+4.1°C IoT Telemetry)
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <strong>{language === 'hi' ? 'दूरी/समय:' : 'Transit:'}</strong> {selectedDonor?.distanceKm} km (~{selectedDonor?.transitMinutes} min)
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <strong>{language === 'hi' ? 'हस्ताक्षर:' : 'Sign-off:'}</strong> National Health Mission Protocol TR-AP-2026-0914
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRANSFER HISTORY AUDIT LOG */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t.transferHistoryTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi'
                  ? 'सभी स्वचालित एवं स्वीकृत संसाधन पुनर्वितरण का पारदर्शी ऑडिट ट्रेल'
                  : 'Transparent audit trail of all automated & approved resource redistributions'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {transferHistory.length} {language === 'hi' ? 'दर्ज लेनदेन' : 'Logged Transactions'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">{language === 'hi' ? 'आईडी' : 'Transfer ID'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? 'समय' : 'Date / Time'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? 'स्रोत (दाता)' : 'Source (Donor)'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? 'गंतव्य' : 'Destination'}</th>
                <th className="py-2.5 px-3">{t.colDrugName}</th>
                <th className="py-2.5 px-3 text-right">{language === 'hi' ? 'मात्रा' : 'Quantity'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? 'वाहन / परिणाम' : 'Carrier / Impact'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'hi' ? 'गेट पास' : 'Gate Pass'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {transferHistory.map((item) => {
                const isItemCompleted =
                  item.status === 'completed' || item.status === 'COMPLETED' || item.status === 'Dispatched';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.id}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">{item.timestamp}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-sans">{item.sourcePhcName || item.donorPHC}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-sans">{item.targetPhcName || item.destinationPHC}</td>
                    <td className="py-2.5 px-3 text-cyan-700 font-semibold font-sans">{item.medicineName}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.quantity}u</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isItemCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isItemCompleted ? (language === 'hi' ? 'पूर्ण' : 'COMPLETED') : (language === 'hi' ? 'अस्वीकृत' : 'REJECTED')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px] font-sans">
                      {item.resilienceLift || item.carrier}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      {isItemCompleted ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGatePassData({
                              transferId: item.id,
                              timestamp: item.timestamp,
                              status: 'completed',
                              priority: 'VERIFIED REDISTRIBUTION MANIFEST',
                              donorPhcName: item.sourcePhcName || item.donorPHC || 'PHC Donor Node',
                              targetPhcName: item.targetPhcName || item.destinationPHC || 'PHC Recipient Node',
                              medicineName: item.medicineName,
                              quantity: item.quantity,
                              unit: 'Units',
                              distanceKm: item.distanceKm || 18.4,
                              transitMinutes: item.transitMinutes || 28,
                              carrier: item.carrier || 'Cold-Chain Van Alpha-2 (+4.1°C Active)',
                              temperatureCelsius: item.temperatureCelsius || 4.1,
                            });
                            setGatePassModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                          title="Print Transfer Gate Pass"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>{language === 'hi' ? 'पास' : 'Print'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t.approveTransferModalTitle}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Transfer Protocol: TR-AP-2026-0914
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'hi'
                ? 'आप क्षेत्रीय प्राथमिक स्वास्थ्य केंद्रों के बीच औषधीय आपूर्ति के तत्काल प्रेषण को अधिकृत कर रहे हैं।'
                : 'You are authorizing the immediate physical dispatch of pharmaceutical supplies across regional primary health centers.'}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{t.colDrugName}:</span>
                <span className="font-bold text-slate-900 text-right">{activeShortageMed.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{language === 'hi' ? 'मात्रा:' : 'Quantity:'}</span>
                <span className="font-bold text-cyan-700 text-right">{transferQty} {activeShortageMed.unit}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{language === 'hi' ? 'स्रोत (दाता):' : 'Source Donor:'}</span>
                <span className="text-slate-800 text-right">{selectedDonor?.phcName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{language === 'hi' ? 'गंतव्य:' : 'Destination:'}</span>
                <span className="text-slate-800 text-right">{destinationPhc.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{language === 'hi' ? 'दाता सुरक्षा बफर:' : 'Donor Buffer Preserved:'}</span>
                <span className="text-emerald-700 font-bold text-right">{calculatedDonorDaysPost} Days Safe</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={handleAuthorize}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs text-center cursor-pointer"
              >
                {t.dispatchConsignmentBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'hi' ? 'अनुकूलन अनुशंसा अस्वीकार करें' : 'Reject Optimization Recommendation'}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Administrative Override Protocol
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'hi'
                ? 'कृपया इस स्वचालित पुनर्वितरण प्रस्ताव को अस्वीकार करने का प्रशासनिक या नैदानिक कारण बताएं:'
                : 'Please specify the administrative or clinical rationale for declining this automated redistribution proposal:'}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">{language === 'hi' ? 'अस्वीकृति का कारण:' : 'Rejection Rationale:'}</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="Local buffer reallocation preferred.">{language === 'hi' ? 'स्थानीय बफर पुनर्आवंटन को प्राथमिकता दी गई' : 'Local buffer reallocation preferred'}</option>
                <option value="Supplier replenishment shipment already en route.">{language === 'hi' ? 'आपूर्तिकर्ता पुनःपूर्ति खेप पहले से ही मार्ग में है' : 'Supplier replenishment shipment already en route'}</option>
                <option value="Donor node expecting local community vaccination drive.">{language === 'hi' ? 'दाता नोड स्थानीय टीकाकरण अभियान की तैयारी में है' : 'Donor node expecting local community vaccination drive'}</option>
                <option value="Weather / Road corridor maintenance impedes rapid transit.">{language === 'hi' ? 'मौसम / सड़क रखरखाव के कारण तीव्र पारगमन बाधित' : 'Weather / Road corridor maintenance impedes rapid transit'}</option>
                <option value="Alternative non-governmental batch available.">{language === 'hi' ? 'वैकल्पिक गैर-सरकारी बैच उपलब्ध है' : 'Alternative non-governmental batch available'}</option>
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center cursor-pointer"
              >
                {language === 'hi' ? 'समीक्षा पर वापस जाएं' : 'Back to Review'}
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs text-center cursor-pointer"
              >
                {language === 'hi' ? 'अस्वीकृति की पुष्टि करें' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Transfer Gate Pass Modal */}
      <TransferGatePassModal
        isOpen={gatePassModalOpen}
        onClose={() => setGatePassModalOpen(false)}
        data={activeGatePassData}
        language={language}
        activePersonaId={activePersonaId}
      />
    </div>
  );
};

