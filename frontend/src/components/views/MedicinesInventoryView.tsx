import React, { useState, useMemo } from 'react';
import {
  Pill,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowDownToLine,
  TrendingDown,
  Plus,
  Truck,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Medicine, RiskLevel } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { LanguageCode, getTranslation } from '../../utils/i18n';
import { computeMedicineMetrics } from '../../utils/medicineCalculations';
import {
  explainMedicineShortageRisk,
  MedicineShortageExplanationResult,
  isGeminiConfigured,
} from '../../services/gemini';

interface MedicinesInventoryViewProps {
  language?: LanguageCode;
  medicines?: Medicine[];
  onRestockMedicine: (medId: string, amount: number) => void;
  onOpenOptimizer: (medName: string) => void;
}

export const MedicinesInventoryView: React.FC<MedicinesInventoryViewProps> = ({
  language = 'en',
  medicines = [],
  onRestockMedicine,
  onOpenOptimizer,
}) => {
  const t = getTranslation(language);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [selectedRestockMed, setSelectedRestockMed] = useState<Medicine | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(500);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gemini AI Shortage Explanation Modal State
  const [explainingMed, setExplainingMed] = useState<Medicine | null>(null);
  const [aiExplanation, setAiExplanation] = useState<MedicineShortageExplanationResult | null>(null);
  const [isAiExplaining, setIsAiExplaining] = useState<boolean>(false);

  // Enforce deterministic calculations on all medicines
  const computedMedicines = useMemo(() => {
    return (medicines || []).map((m) => computeMedicineMetrics(m));
  }, [medicines]);

  const categories = useMemo(() => {
    const set = new Set(computedMedicines.map((m) => m.category.split('/')[0].trim()));
    return ['all', ...Array.from(set)];
  }, [computedMedicines]);

  const filteredMedicines = useMemo(() => {
    return computedMedicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === 'all' || m.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchRisk = riskFilter === 'all' || m.stockoutRisk === riskFilter;
      return matchSearch && matchCategory && matchRisk;
    });
  }, [computedMedicines, search, categoryFilter, riskFilter]);

  const criticalCount = computedMedicines.filter((m) => m.stockoutRisk === 'critical').length;
  const highRiskCount = computedMedicines.filter((m) => m.stockoutRisk === 'high').length;
  const warningCount = computedMedicines.filter((m) => m.stockoutRisk === 'warning').length;
  const urgentExpiryCount = computedMedicines.filter((m) => m.daysUntilExpiry <= 60).length;

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockMed) return;
    onRestockMedicine(selectedRestockMed.id, Number(restockAmount));
    setToastMessage(
      language === 'hi'
        ? `${selectedRestockMed.name} के लिए ${restockAmount} ${selectedRestockMed.unit} की पुनःपूर्ति दर्ज की गई।`
        : `Successfully received replenishment of ${restockAmount} ${selectedRestockMed.unit} for ${selectedRestockMed.name}. Inventory levels normalized.`
    );
    setSelectedRestockMed(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAiExplainer = async (med: Medicine) => {
    setExplainingMed(med);
    setIsAiExplaining(true);
    setAiExplanation(null);

    try {
      const result = await explainMedicineShortageRisk({
        medicineName: med.name,
        dosage: med.dosage,
        currentStock: med.currentStock,
        dailyConsumption: med.dailyConsumption || med.burnRatePerDay,
        daysRemaining: med.daysOfStockRemaining,
        reorderLevel: med.reorderLevel,
        patientDemand: 184,
        riskLevel: med.stockoutRisk,
        phcName: 'PHC-Alpha East (Wagholi Demo)',
      });
      setAiExplanation(result);
    } catch (err: any) {
      console.error('Failed to generate AI shortage explanation:', err);
    } finally {
      setIsAiExplaining(false);
    }
  };

  return (
    <div id="medicines-inventory-view" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-cyan-500/40 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Inventory Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-cyan-600" />
              {t.medicinesInventoryTitle}
            </h1>
            <p className="text-xs text-slate-500">
              {t.medicinesInventorySubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRestockMed(computedMedicines[0]);
                setRestockAmount(500);
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              {language === 'hi' ? 'आवक खेप दर्ज करें' : 'Log Inbound Shipment'}
            </button>
          </div>
        </div>

        {/* 4 Summary Micro-KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'hi' ? 'कुल ट्रैक की गई दवाइयाँ' : 'Total Tracked SKUs'}
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {computedMedicines.length} {language === 'hi' ? 'दवाइयाँ' : 'Formulations'}
            </div>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
            <span className="text-[11px] font-semibold text-rose-700">
              {language === 'hi' ? 'गंभीर स्टॉकआउट (≤3 दिन)' : 'Critical Stockouts (≤3d)'}
            </span>
            <div className="text-xl font-bold font-mono text-rose-900 mt-0.5">
              {criticalCount} {language === 'hi' ? 'गंभीर' : 'Critical'}
            </div>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-700">
              {language === 'hi' ? 'उच्च/चेतावनी जोखिम (4–14 दिन)' : 'High / Warning (4–14d)'}
            </span>
            <div className="text-xl font-bold font-mono text-amber-900 mt-0.5">
              {highRiskCount + warningCount} {language === 'hi' ? 'आइटम' : 'Items'}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'hi' ? 'निकट समाप्ति (<60 दिन)' : 'Near Expiry (<60 Days)'}
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {urgentExpiryCount} SKU
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchMedicinesPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0 font-medium">{t.filterCategory}:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="all">{t.filterAllCategories}</option>
              {categories.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0 font-medium">{t.filterRisk}:</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="all">{t.mapFilterAll}</option>
              <option value="critical">{t.mapFilterCritical} (≤3d)</option>
              <option value="high">{language === 'hi' ? 'उच्च जोखिम (4–7 दिन)' : 'High Risk (4–7d)'}</option>
              <option value="warning">{t.mapFilterWarning} (8–14d)</option>
              <option value="stable">{t.mapFilterStable} (&gt;14d)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.colDrugName}</th>
                <th className="py-3 px-3">{t.colCategory}</th>
                <th className="py-3 px-3 text-right">{t.colCurrentStock}</th>
                <th className="py-3 px-3 text-right">{t.colBurnRate}</th>
                <th className="py-3 px-3 text-right">{language === 'hi' ? 'पुनःआदेश स्तर' : 'Reorder Level'}</th>
                <th className="py-3 px-3 text-center">{t.colDaysRemaining}</th>
                <th className="py-3 px-3 text-center">{t.colStockoutRisk}</th>
                <th className="py-3 px-3">{language === 'hi' ? 'अनुमानित स्टॉकआउट तिथि' : 'Projected Stock-out'}</th>
                <th className="py-3 px-4 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMedicines.map((med) => {
                const isCritical = med.stockoutRisk === 'critical';
                const isHigh = med.stockoutRisk === 'high';
                const isWarning = med.stockoutRisk === 'warning';
                const isNearExpiry = med.daysUntilExpiry <= 60;

                return (
                  <tr
                    key={med.id}
                    className={`transition-colors ${
                      isCritical
                        ? 'bg-rose-50/60 hover:bg-rose-50'
                        : isHigh
                        ? 'bg-orange-50/40 hover:bg-orange-50/70'
                        : isWarning
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Name & Dosage */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{med.dosage}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {med.category}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {med.currentStock.toLocaleString()}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">{med.unit}</span>
                    </td>

                    {/* Daily Usage / Burn Rate */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {med.dailyConsumption} {med.unit}/d
                    </td>

                    {/* Reorder Level */}
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {med.reorderLevel} {med.unit}
                    </td>

                    {/* Days Supply Left */}
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span
                        className={
                          isCritical
                            ? 'text-rose-600 text-sm font-extrabold'
                            : isHigh
                            ? 'text-orange-600 font-bold'
                            : isWarning
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }
                      >
                        {med.daysOfStockRemaining}d
                      </span>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-3 text-center">
                      <RiskBadge level={med.stockoutRisk} size="sm" language={language} />
                    </td>

                    {/* Predicted Stockout Date */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-xs text-slate-800 font-medium">
                        {med.predictedStockoutDate}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isNearExpiry ? (
                          <span className="text-orange-600 font-semibold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> {med.daysUntilExpiry}{language === 'hi' ? ' दिन में समाप्ति' : 'd expiry'}
                          </span>
                        ) : (
                          <span>{language === 'hi' ? 'समाप्ति: ' : 'Exp: '}{med.expiryDate}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAiExplainer(med)}
                          className="px-2 py-1 bg-gradient-to-r from-amber-500/10 to-cyan-500/10 hover:from-amber-500/20 hover:to-cyan-500/20 text-slate-800 border border-slate-200 rounded font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Explain Shortage Risk with Gemini AI"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span className="hidden sm:inline">{language === 'hi' ? 'AI विश्लेषण' : 'AI Analysis'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedRestockMed(med)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title={language === 'hi' ? 'आवक स्टॉक दर्ज करें' : 'Log Inbound Stock'}
                        >
                          <Plus className="w-3 h-3" /> {t.btnRestock}
                        </button>

                        {(isCritical || isHigh) && (
                          <button
                            onClick={() => onOpenOptimizer(med.name)}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            {t.btnReallocate}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Shortage Reasoner Modal */}
      {explainingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 text-white rounded-2xl shadow-2xl border border-amber-500/40 max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    {language === 'hi' ? 'दवा कमी AI विश्लेषण व निदान' : 'Medicine Shortage AI Diagnostic'}
                    <span className="px-2 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px]">
                      {t.poweredByGemini}
                    </span>
                  </h3>
                  <div className="text-[11px] text-amber-200/80">
                    {explainingMed.name} ({explainingMed.dosage}) • PHC-Alpha East
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExplainingMed(null)}
                className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Calculated Deterministic Telemetry Card */}
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock'}</span>
                <span className="font-mono font-bold text-white">{explainingMed.currentStock} {explainingMed.unit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'दैनिक खपत' : 'Daily Burn'}</span>
                <span className="font-mono font-bold text-rose-300">{explainingMed.dailyConsumption} {explainingMed.unit}/d</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'शेष आपूर्ति' : 'Days Remaining'}</span>
                <span className={`font-mono font-bold ${explainingMed.daysOfStockRemaining <= 3 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {explainingMed.daysOfStockRemaining} {language === 'hi' ? 'दिन' : 'Days'}
                </span>
              </div>
            </div>

            {/* AI Explanation Content */}
            {isAiExplaining ? (
              <div className="py-6 text-center space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                <p className="text-xs text-amber-200">
                  {language === 'hi'
                    ? 'Google Gemini आपूर्ति श्रृंखला व क्लिनिकल डेटा का विश्लेषण कर रहा है...'
                    : 'Google Gemini is evaluating multi-factor supply depletion vectors...'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Executive Summary */}
                <div className="p-3 bg-white/5 rounded-xl border border-amber-500/30 text-amber-100 leading-relaxed font-medium">
                  &ldquo;{aiExplanation?.explanation}&rdquo;
                </div>

                {/* Root Causes */}
                <div className="space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    {language === 'hi' ? 'पहचाने गए मुख्य कारण:' : 'Identified Risk Drivers & Root Causes:'}
                  </div>
                  {aiExplanation?.rootCauses.map((cause, i) => (
                    <div key={i} className="text-slate-300 text-[11px] flex items-start gap-1.5 pl-1">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{cause}</span>
                    </div>
                  ))}
                </div>

                {/* Clinical Implication */}
                <div className="p-2.5 bg-rose-950/40 rounded-lg border border-rose-500/30 text-[11px] text-rose-200">
                  <strong>{language === 'hi' ? 'क्लिनिकल प्रभाव:' : 'Clinical Care Implication:'}</strong>{' '}
                  {aiExplanation?.clinicalImplication}
                </div>

                {/* Recommended Next Step */}
                <div className="p-2.5 bg-cyan-950/40 rounded-lg border border-cyan-500/30 text-[11px] text-cyan-200 flex items-center justify-between gap-2">
                  <div>
                    <strong>{language === 'hi' ? 'अनुशंसित अगला कदम:' : 'Recommended Action:'}</strong>{' '}
                    {aiExplanation?.recommendedNextStep}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-[10px] text-slate-400 font-mono">
                {aiExplanation?.modelUsed || 'Google Gemini 2.5 Flash'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExplainingMed(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const medName = explainingMed.name;
                    setExplainingMed(null);
                    onOpenOptimizer(medName);
                  }}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'संसाधन अनुकूलक खोलें' : 'Open Resource Optimizer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {selectedRestockMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {t.restockModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRestockMed(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  {t.colDrugName}:
                </label>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 break-words">
                  {selectedRestockMed.name} ({selectedRestockMed.dosage})
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    {t.colCurrentStock}:
                  </label>
                  <div className="p-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-700">
                    {selectedRestockMed.currentStock} {selectedRestockMed.unit}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    {t.restockQuantity} ({selectedRestockMed.unit}):
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  {language === 'hi' ? 'आपूर्तिकर्ता / आपूर्ति-श्रृंखला स्रोत:' : 'Supplier / Supply Chain Source:'}
                </label>
                <select className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800">
                  <option>{language === 'hi' ? 'केंद्रीय जिला चिकित्सा डिपो (पुणे क्षेत्रीय हब)' : 'Central District Medical Depot (Pune Regional Hub)'}</option>
                  <option>{language === 'hi' ? 'राज्य आपातकालीन आपदा रिज़र्व (महाराष्ट्र NHM)' : 'State Emergency Disaster Reserve (Maharashtra NHM)'}</option>
                  <option>{language === 'hi' ? 'डब्ल्यूएचओ / राष्ट्रीय स्वास्थ्य मिशन खेप' : 'WHO / National Health Mission Consignment'}</option>
                </select>
              </div>

              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-[11px] text-cyan-900 space-y-1">
                <strong>{language === 'hi' ? 'पुनःपूर्ति के बाद अनुमानित स्टॉक:' : 'Projected Inventory Post-Restock:'}</strong>
                <div>
                  {language === 'hi' ? 'नया शेष:' : 'New Balance:'} <span className="font-mono font-bold">{selectedRestockMed.currentStock + Number(restockAmount)} {selectedRestockMed.unit}</span>
                </div>
                <div>
                  {language === 'hi' ? 'आपूर्ति अवधि बढ़कर होगी:' : 'Days of Supply will expand to'}{' '}
                  <span className="font-mono font-bold">
                    {((selectedRestockMed.currentStock + Number(restockAmount)) / selectedRestockMed.dailyConsumption!).toFixed(1)}{' '}
                    {language === 'hi' ? 'दिन' : 'days'}
                  </span>{' '}
                  ({language === 'hi' ? 'जोखिम: स्थिर' : 'Risk: Stable'}).
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRestockMed(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {t.confirmRestockBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
