import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Building2,
  ChevronDown,
  Activity,
  Bed,
  Pill,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Share2,
  CheckCircle2,
  Clock,
  Compass,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { PHC, Medicine, StaffMember } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { calculateRiskEngine } from '../../utils/riskEngine';
import { NavView } from '../common/Sidebar';
import { generatePHCDiagnostic } from '../../services/gemini';
import { LanguageCode, getTranslation, getLocalizedPHC, getLocalizedRiskLevel } from '../../utils/i18n';

interface PHCDetailsViewProps {
  phc?: PHC;
  allPhcs?: PHC[];
  medicines?: Medicine[];
  staff?: StaffMember[];
  onSelectPhc: (id: string) => void;
  onNavigate: (view: NavView) => void;
  onOpenOptimizer: (targetPhcId: string) => void;
  language?: LanguageCode;
}

export const PHCDetailsView: React.FC<PHCDetailsViewProps> = ({
  phc,
  allPhcs = [],
  medicines = [],
  staff = [],
  onSelectPhc,
  onNavigate,
  onOpenOptimizer,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const safeStaff = staff || [];
  const riskAnalysis = useMemo(() => (phc ? calculateRiskEngine(phc) : null), [phc]);

  // AI Diagnostic State
  const [aiDiagnostic, setAiDiagnostic] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const phcStaff = useMemo(() => {
    if (!phc) return [];
    return safeStaff.filter((s) => s.phcId === phc.id);
  }, [safeStaff, phc]);

  const fetchAiDiagnostic = useCallback(async () => {
    if (!phc) return;
    setIsAiLoading(true);
    try {
      const res = await generatePHCDiagnostic({ phc });
      setAiDiagnostic(res.diagnostic);
    } catch {
      setAiDiagnostic(
        `${phc.name} reports ${phc.riskLevel.toUpperCase()} operational risk with a resilience index of ${phc.resilienceScore}/100.`
      );
    } finally {
      setIsAiLoading(false);
    }
  }, [phc]);

  useEffect(() => {
    fetchAiDiagnostic();
  }, [fetchAiDiagnostic]);

  if (!phc) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No PHC selected. Please choose a facility from the network map.</p>
        <button
          onClick={() => onNavigate('phc-network')}
          className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          View PHC Network
        </button>
      </div>
    );
  }

  const locPhc = getLocalizedPHC(phc, language);
  const bedOccupancyPercent = Math.round((phc.occupiedBeds / phc.totalBeds) * 100);
  const emergencyBedOccPercent = Math.round(
    (phc.emergencyBedsOccupied / phc.emergencyBedsTotal) * 100
  );
  const icuBedOccPercent = Math.round((phc.icuBedsOccupied / phc.icuBedsTotal) * 100);

  return (
    <div id="phc-details-view" className="space-y-6">
      {/* Top Selector & Summary Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 font-bold shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{locPhc.name}</h1>
                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {phc.code}
                </span>
                <RiskBadge level={phc.riskLevel} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{locPhc.district}, {locPhc.state}</span>
                <span>•</span>
                <span className="font-mono">Lat: {phc.lat.toFixed(4)}°N, Lng: {phc.lng.toFixed(4)}°E</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {language === 'hi' ? 'पीएचसी टेलीमेट्री चुनें:' : 'Switch PHC Telemetry:'}
              </label>
              <select
                value={phc.id}
                onChange={(e) => onSelectPhc(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
              >
                {allPhcs.map((p) => {
                  const lp = getLocalizedPHC(p, language);
                  return (
                    <option key={p.id} value={p.id}>
                      {lp.name} ({getLocalizedRiskLevel(p.riskLevel, language).toUpperCase()})
                    </option>
                  );
                })}
              </select>
            </div>

            {(phc.riskLevel === 'critical' || phc.riskLevel === 'warning') && (
              <button
                onClick={() => onOpenOptimizer(phc.id)}
                className="mt-2 sm:mt-0 sm:self-end px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                {t.resourceOptimizer}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Clinical & Operational Diagnostic Card (Powered by Gemini) */}
      <div
        id="ai-phc-diagnostic-card"
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-md space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {t.aiDiagnosticTitle}
              </span>
              <span className="ml-2 px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px] font-bold">
                Powered by Gemini
              </span>
            </div>
          </div>

          <button
            onClick={fetchAiDiagnostic}
            disabled={isAiLoading}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-cyan-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shrink-0 self-end sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{language === 'hi' ? 'पुनः विश्लेषण' : 'Re-Diagnose'}</span>
          </button>
        </div>

        {isAiLoading ? (
          <p className="text-xs text-cyan-200/80 animate-pulse">
            {t.diagnosticGenerating}
          </p>
        ) : (
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            &ldquo;{aiDiagnostic}&rdquo;
          </p>
        )}
      </div>

      {/* Primary Risk Analysis Breakdown Box */}
      {riskAnalysis && (
        <div
          id="phc-risk-diagnostic-panel"
          className={`rounded-2xl p-5 border shadow-sm ${
            phc.riskLevel === 'critical'
              ? 'bg-rose-50/60 border-rose-200'
              : phc.riskLevel === 'warning'
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-emerald-50/50 border-emerald-200'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === 'hi' ? 'जोखिम डायग्नोस्टिक सारांश' : 'Deterministic Risk Diagnostic Summary'}
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                  {language === 'hi' ? 'जोखिम स्कोर' : 'Risk Score'}: {riskAnalysis.overallScore}/100
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-emerald-700">
                  {t.resilienceIndex}: {riskAnalysis.resilienceScore}/100
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{riskAnalysis.summaryReason}</h2>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {riskAnalysis.contributingDrivers.map((driver, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold bg-white/90 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                  >
                    ⚠ {driver}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0 bg-white/95 rounded-xl p-3 border border-slate-200 shadow-2xs min-w-[220px]">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">
                {language === 'hi' ? 'स्वचालित शमन कार्रवाई' : 'Automated Mitigation Action'}
              </div>
              <div className="text-xs font-bold text-slate-900">
                {phc.riskLevel === 'critical'
                  ? (language === 'hi' ? 'पीएचसी-बीटा दक्षिण से तत्काल इंटर-पीएचसी स्टॉक पुनर्वितरण आवश्यक' : 'Immediate inter-PHC stock reallocation required from PHC-Beta South')
                  : phc.riskLevel === 'warning'
                  ? (language === 'hi' ? 'शाम की ट्राइएज क्षमता की निगरानी करें और ऑन-कॉल नर्स सक्रिय करें' : 'Monitor evening triage capacity and activate on-call nurse')
                  : (language === 'hi' ? 'सामान्य परिचालन स्थिति। दाता नोड के रूप में पात्र।' : 'Nominal operational status. Eligible as donor node.')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Pressure Gauges (Patient, Bed, Medicine, Staff) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patient Pressure */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-600" />
              {language === 'hi' ? 'मरीज़ दबाव' : 'Patient Pressure'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                phc.pressures.patient > 20
                  ? 'bg-rose-100 text-rose-700'
                  : phc.pressures.patient > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {phc.pressures.patient > 0 ? `+${phc.pressures.patient}% ${language === 'hi' ? 'उछाल' : 'Surge'}` : (language === 'hi' ? 'सामान्य' : 'Normal')}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {phc.patientsToday}
            <span className="text-xs font-normal text-slate-400 ml-1.5">{language === 'hi' ? 'आज के मरीज़' : 'visits today'}</span>
          </div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>{language === 'hi' ? 'वॉक-इन' : 'Walk-ins'}: {phc.walkInPatients}</span>
            <span>{language === 'hi' ? 'इमरजेंसी' : 'Emergency'}: {phc.emergencyCases}</span>
          </div>
        </div>

        {/* Bed Pressure */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-blue-600" />
              {language === 'hi' ? 'बेड दबाव' : 'Bed Pressure'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                bedOccupancyPercent >= 90
                  ? 'bg-rose-100 text-rose-700'
                  : bedOccupancyPercent >= 75
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {bedOccupancyPercent}% {language === 'hi' ? 'अधिभोग' : 'Occupied'}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {phc.occupiedBeds} / {phc.totalBeds}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({phc.availableBeds} {language === 'hi' ? 'खाली' : 'free'})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                bedOccupancyPercent >= 90
                  ? 'bg-rose-500'
                  : bedOccupancyPercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${bedOccupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Medicine Pressure */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-rose-600" />
              {language === 'hi' ? 'दवा दबाव' : 'Medicine Pressure'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                phc.medicineRisk === 'critical'
                  ? 'bg-rose-100 text-rose-700 font-bold'
                  : phc.medicineRisk === 'moderate'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {getLocalizedRiskLevel(phc.medicineRisk as any, language)}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {phc.stockoutPredictionDays}
            <span className="text-xs font-normal text-slate-400 ml-1.5">{language === 'hi' ? 'दिनों में स्टॉकआउट' : 'days to stockout'}</span>
          </div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>{language === 'hi' ? 'गंभीर कमी: एमोक्सिसिलिन' : 'Critical Deficit: Amoxicillin'}</span>
          </div>
        </div>

        {/* Staff Pressure */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              {language === 'hi' ? 'स्टाफ दबाव' : 'Staff Pressure'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                phc.doctorsPresent < phc.doctorsTotal
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {Math.round((phc.doctorsPresent / phc.doctorsTotal) * 100)}% {language === 'hi' ? 'रोस्टर' : 'Roster'}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {phc.doctorsPresent} / {phc.doctorsTotal}
            <span className="text-xs font-normal text-slate-400 ml-1.5">{t.doctorsOnDuty}</span>
          </div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>{language === 'hi' ? 'नर्स' : 'Nurses'}: {phc.nursesPresent}/{phc.nursesTotal}</span>
            <span>{language === 'hi' ? 'अनुपात' : 'Ratio'}: 1:{Math.round(phc.patientsToday / Math.max(1, phc.doctorsPresent))}</span>
          </div>
        </div>
      </div>

      {/* Bed Breakdown & Staff Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bed Capacity Detailed Visualizer */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Bed className="w-4 h-4 text-blue-600" />
            {t.bedBreakdownTitle}
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">{language === 'hi' ? 'सामान्य वार्ड बेड' : 'General Ward Beds'}</span>
                <span className="font-mono text-slate-900">
                  {phc.occupiedBeds - phc.emergencyBedsOccupied - phc.icuBedsOccupied} /{' '}
                  {phc.totalBeds - phc.emergencyBedsTotal - phc.icuBedsTotal} {language === 'hi' ? 'अधिभोग' : 'Occupied'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.round(
                      ((phc.occupiedBeds - phc.emergencyBedsOccupied - phc.icuBedsOccupied) /
                        Math.max(1, phc.totalBeds - phc.emergencyBedsTotal - phc.icuBedsTotal)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">{t.emergencyBedsTitle}</span>
                <span className="font-mono font-bold text-rose-600">
                  {phc.emergencyBedsOccupied} / {phc.emergencyBedsTotal} {language === 'hi' ? 'अधिभोग' : 'Occupied'} ({emergencyBedOccPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${emergencyBedOccPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {phc.emergencyBedsAvailable} {language === 'hi' ? 'आपातकालीन बेड ट्राइएज हेतु खाली है' : 'Emergency bed currently free for trauma intake'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">{t.icuBedsTitle}</span>
                <span className="font-mono font-bold text-slate-900">
                  {phc.icuBedsOccupied} / {phc.icuBedsTotal} {language === 'hi' ? 'अधिभोग' : 'Occupied'} ({icuBedOccPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${icuBedOccPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">{language === 'hi' ? 'परिचालन डायवर्जन नियम:' : 'Operational Ingress Rule:'}</div>
            <div>
              {language === 'hi' 
                ? 'यदि आपातकालीन बेड 90% से अधिक भर जाते हैं, तो नए ट्राइएज मामले स्वचालित रूप से स्टेट हाईवे 64 कॉरिडोर के माध्यम से निकटतम सहायता केंद्रों पर पुनर्निर्देशित किए जाते हैं।'
                : 'If emergency beds exceed 90% occupancy, incoming trauma cases are automatically redirected along State Highway 64 Corridor to Demo PHC-Beta South (Saswad) and Demo PHC-Gamma Metro (Bhosari).'}
            </div>
          </div>
        </div>

        {/* Staff Availability at this PHC */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                {t.staffOnDutyTitle}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {phc.doctorsPresent}/{phc.doctorsTotal} {language === 'hi' ? 'डॉक्टर' : 'Drs'} • {phc.nursesPresent}/{phc.nursesTotal} {language === 'hi' ? 'नर्स' : 'Nurses'}
              </span>
            </div>

            <div className="space-y-2">
              {phcStaff.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {language === 'hi' ? 'क्षेत्रीय पूल के माध्यम से सभी ड्यूटी स्टाफ रोस्टर किए गए।' : 'All clinical staff on duty rostered through regional pool.'}
                </div>
              ) : (
                phcStaff.map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{st.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {st.role} • {st.specialty || (language === 'hi' ? 'सामान्य चिकित्सा' : 'General Care')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          st.status === 'on_duty'
                            ? 'bg-emerald-100 text-emerald-700'
                            : st.status === 'standby'
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {st.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {st.shift} {language === 'hi' ? 'शिफ्ट' : 'Shift'} ({st.patientsSeenToday} {language === 'hi' ? 'मरीज़ देखे' : 'seen'})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{language === 'hi' ? 'शिफ्ट हैंडओवर: 16:00 UTC' : 'Shift handover at 16:00 UTC'}</span>
            <button
              onClick={() => onNavigate('staff-availability')}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer"
            >
              {language === 'hi' ? 'संपूर्ण रोस्टर देखें →' : 'View Full Grid Roster →'}
            </button>
          </div>
        </div>
      </div>

      {/* Local Medicine Stock Status for this PHC */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Pill className="w-4 h-4 text-rose-600" />
            {t.inventoryBreakdownTitle} - {locPhc.name}
          </h3>
          <button
            onClick={() => onNavigate('medicines-inventory')}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer"
          >
            {t.medicinesInventory} →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">{t.colDrugName}</th>
                <th className="py-2.5 px-3">{t.colCategory}</th>
                <th className="py-2.5 px-3 text-right">{t.colCurrentStock}</th>
                <th className="py-2.5 px-3 text-right">{t.colBurnRate}</th>
                <th className="py-2.5 px-3 text-right">{t.colDaysRemaining}</th>
                <th className="py-2.5 px-3 text-center">{t.colStockoutRisk}</th>
                <th className="py-2.5 px-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.slice(0, 5).map((med) => {
                const isCritical = med.stockoutRisk === 'critical';
                return (
                  <tr key={med.id} className={isCritical ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {med.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{med.dosage}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{med.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {med.currentStock} {med.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {med.usedToday} / {language === 'hi' ? 'दिन' : 'day'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={isCritical ? 'text-rose-600' : 'text-slate-800'}>
                        {med.daysOfStockRemaining} {language === 'hi' ? 'दिन' : 'days'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <RiskBadge level={med.stockoutRisk} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isCritical ? (
                        <button
                          onClick={() => onOpenOptimizer(phc.id)}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer"
                        >
                          {t.btnReallocate}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">{language === 'hi' ? 'सुरक्षित बफर' : 'Buffered'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
