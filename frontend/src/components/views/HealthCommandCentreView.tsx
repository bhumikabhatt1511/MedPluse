import React from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Navigation,
  Pill,
  Radio,
  Share2,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { PHC, Alert, TransferRecommendation, Medicine } from '../../types';
import { KpiCard } from '../common/KpiCard';
import { RiskBadge } from '../common/RiskBadge';
import { PHCNetworkMap } from '../map/PHCNetworkMap';
import { NavView } from '../common/Sidebar';
import { LanguageCode, getTranslation } from '../../utils/i18n';

interface HealthCommandCentreViewProps {
  phcs?: PHC[];
  alerts?: Alert[];
  recommendation?: TransferRecommendation;
  medicines?: Medicine[];
  onNavigate: (view: NavView) => void;
  onSelectPhc: (phcId: string) => void;
  onExecuteRecommendation?: () => void;
  onOpenOptimizer?: (targetPhcId?: string) => void;
  selectedJurisdiction?: string;
  onSelectJurisdiction?: (jurisdiction: string) => void;
  language?: LanguageCode;
}

export const HealthCommandCentreView: React.FC<HealthCommandCentreViewProps> = ({
  phcs = [],
  alerts = [],
  recommendation,
  medicines = [],
  onNavigate,
  onSelectPhc,
  onExecuteRecommendation,
  onOpenOptimizer,
  selectedJurisdiction = 'All India (National Grid - 39 Nodes)',
  onSelectJurisdiction,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const safePhcs = phcs || [];
  const safeAlerts = alerts || [];

  const criticalPhcs = safePhcs.filter((p) => p.riskLevel === 'critical');
  const warningPhcs = safePhcs.filter((p) => p.riskLevel === 'warning');
  const stablePhcs = safePhcs.filter((p) => p.riskLevel === 'stable');

  const totalPatientsToday = safePhcs.reduce((acc, p) => acc + p.patientsToday, 0);
  const totalBeds = safePhcs.reduce((acc, p) => acc + p.totalBeds, 0);
  const occupiedBeds = safePhcs.reduce((acc, p) => acc + p.occupiedBeds, 0);
  const avgBedOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalDoctorsPresent = safePhcs.reduce((acc, p) => acc + p.doctorsPresent, 0);
  const totalDoctors = safePhcs.reduce((acc, p) => acc + p.doctorsTotal, 0);
  const totalEmergency = safePhcs.reduce((acc, p) => acc + p.emergencyCases, 0);

  const avgResilience = safePhcs.length > 0 
    ? Math.round(safePhcs.reduce((acc, p) => acc + p.resilienceScore, 0) / safePhcs.length)
    : 84;

  const activeAlerts = safeAlerts.filter((a) => !a.resolved);
  const criticalAlert = safeAlerts.find((a) => a.severity === 'critical' && !a.resolved);

  const handleExecute = () => {
    if (onExecuteRecommendation) {
      onExecuteRecommendation();
    } else if (onOpenOptimizer) {
      onOpenOptimizer(recommendation?.targetPhcId || 'phc-alpha');
    } else {
      onNavigate('resource-optimizer');
    }
  };

  return (
    <div id="health-command-centre-view" className="space-y-6">
      {/* Top Banner: Emergency Recommendation Callout */}
      {recommendation && recommendation.status === 'recommended' && (
        <div
          id="active-recommendation-banner"
          className="bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-cyan-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 text-cyan-300">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                  {t.aiGuardrailValidated}
                </span>
                <span className="text-xs text-cyan-300 font-mono">
                  ID: {recommendation.id}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 break-words">
                {t.interPhcSupplyTransfer}: {recommendation.sourcePhcName} → {recommendation.targetPhcName}
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl mt-0.5">
                {t.targetShortageNotice} {t.donorSurplusNotice}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => onNavigate('resource-optimizer')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {t.reviewOptimizationPlan}
            </button>
            <button
              onClick={handleExecute}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              {t.authorizeTransfer}
            </button>
          </div>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <KpiCard
          id="kpi-phcs"
          title={t.activePhcs}
          value={safePhcs.length.toString()}
          unit={language === 'hi' ? 'केंद्र' : 'Nodes'}
          badge={{ text: '100% Online', variant: 'emerald' }}
          subtitle={selectedJurisdiction.split('(')[0].trim() || 'All India Network'}
          icon={<Building2 className="w-4 h-4" />}
          trend={{ value: 'Grid Synced', isPositive: true }}
          onClick={() => onNavigate('phc-network')}
        />
        <KpiCard
          id="kpi-patients"
          title={t.patientsToday}
          value={totalPatientsToday.toLocaleString()}
          unit={language === 'hi' ? 'मरीज़' : 'Visits'}
          badge={{ text: `+14% Velocity`, variant: 'amber' }}
          subtitle={`${totalEmergency} ${t.emergencyCases}`}
          icon={<Users className="w-4 h-4" />}
          trend={{ value: '+14% vs Mon', isPositive: false }}
          onClick={() => onNavigate('patients-capacity')}
        />
        <KpiCard
          id="kpi-stockout"
          title={t.criticalStockouts}
          value={criticalPhcs.length.toString()}
          unit="PHC"
          badge={{ text: criticalPhcs.length > 0 ? (language === 'hi' ? 'कार्रवाई आवश्यक' : 'Action Req.') : 'Nominal', variant: criticalPhcs.length > 0 ? 'rose' : 'emerald' }}
          subtitle={criticalPhcs.length > 0 ? `${criticalPhcs[0].name.split('(')[0]}` : (language === 'hi' ? 'शून्य गंभीर कमी' : 'Zero Critical Deficits')}
          icon={<Pill className="w-4 h-4" />}
          trend={{ value: criticalPhcs.length > 0 ? 'Reallocating' : 'Stable Supply', isPositive: criticalPhcs.length === 0 }}
          onClick={() => onNavigate('resource-optimizer')}
        />
        <KpiCard
          id="kpi-bed-occupancy"
          title={t.bedOccupancy}
          value={`${avgBedOccupancy}%`}
          unit={language === 'hi' ? 'औसत' : 'Average'}
          badge={{ text: `${totalBeds - occupiedBeds} ${language === 'hi' ? 'उपलब्ध' : 'Available'}`, variant: 'slate' }}
          subtitle={`${occupiedBeds}/${totalBeds} ${language === 'hi' ? 'भरे बेड' : 'Occupied Beds'}`}
          icon={<Activity className="w-4 h-4" />}
          trend={{ value: `${avgBedOccupancy > 80 ? '+4% Peak Surge' : 'Nominal'}`, isPositive: avgBedOccupancy <= 80 }}
          onClick={() => onNavigate('patients-capacity')}
        />
        <KpiCard
          id="kpi-doctors"
          title={t.doctorsOnDuty}
          value={`${totalDoctorsPresent}/${totalDoctors}`}
          unit={language === 'hi' ? 'सक्रिय' : 'Active'}
          badge={{ text: `${totalDoctors > 0 ? Math.round((totalDoctorsPresent / totalDoctors) * 100) : 100}% Roster`, variant: 'emerald' }}
          subtitle={language === 'hi' ? 'प्राथमिक चिकित्सा उपस्थिति' : 'Primary Care Attendance'}
          icon={<UserCheck className="w-4 h-4" />}
          trend={{ value: totalDoctors - totalDoctorsPresent > 0 ? `${totalDoctors - totalDoctorsPresent} Gaps` : 'Full Attendance', isPositive: totalDoctors === totalDoctorsPresent }}
          onClick={() => onNavigate('staff-availability')}
        />
        <KpiCard
          id="kpi-resilience"
          title={t.gridResilience}
          value={avgResilience.toString()}
          unit="/100"
          badge={{ text: avgResilience >= 80 ? (language === 'hi' ? 'सुरक्षित' : 'Stable') : (language === 'hi' ? 'चेतावनी' : 'Warning'), variant: avgResilience >= 80 ? 'emerald' : 'amber' }}
          subtitle={`Score: ${avgResilience}/100`}
          icon={<ShieldCheck className="w-4 h-4" />}
          trend={{ value: '+7.2 Projected', isPositive: true }}
          onClick={() => onNavigate('brics-federated-ai')}
        />
      </div>

      {/* Main Command Split: Interactive Map & Tactical Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Real-Time PHC Map with active transfer route */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-600" />
                {t.gridTelemetryTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {t.gridTelemetrySubtitle} ({safePhcs.length} {language === 'hi' ? 'केंद्र' : 'centers'})
              </p>
            </div>
            <button
              onClick={() => onNavigate('phc-network')}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              {t.viewGridTable} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full flex-1 min-h-[460px]">
            <PHCNetworkMap
              phcs={safePhcs}
              language={language}
              onSelectJurisdiction={onSelectJurisdiction}
              onSelectPhc={(id) => {
                onSelectPhc(id);
                onNavigate('phc-details');
              }}
              onOpenOptimizer={(id) => {
                onSelectPhc(id);
                onNavigate('resource-optimizer');
              }}
              showCorridors={true}
            />
          </div>
        </div>

        {/* Right 4 Cols: Tactical Risk Distribution & Urgent Signals */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          {/* Network Risk Distribution Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">{t.networkRiskDistTitle}</h3>
              <span className="text-xs font-mono font-semibold text-slate-500">{safePhcs.length} PHCs</span>
            </div>

            <div className="space-y-2.5">
              {/* Critical */}
              <div
                onClick={() => {
                  if (criticalPhcs.length > 0) {
                    onSelectPhc(criticalPhcs[0].id);
                    onNavigate('phc-details');
                  }
                }}
                className="p-2.5 bg-rose-50/70 hover:bg-rose-50 rounded-xl border border-rose-200 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <div>
                    <div className="text-xs font-bold text-rose-900">{criticalPhcs.length} {t.criticalDeficitNodes}</div>
                    <div className="text-[11px] text-rose-700">
                      {criticalPhcs.length > 0 ? `${criticalPhcs[0].name.split('(')[0]} (Amoxicillin <2.8d)` : (language === 'hi' ? 'शून्य गंभीर कमी' : 'Zero critical deficits')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </div>

              {/* Warning */}
              <div
                onClick={() => onNavigate('phc-network')}
                className="p-2.5 bg-amber-50/70 hover:bg-amber-50 rounded-xl border border-amber-200 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-amber-900">{warningPhcs.length} {t.warningNodes}</div>
                    <div className="text-[11px] text-amber-700">Bed Occupancy &gt;80% or Supply Burn</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </div>

              {/* Stable */}
              <div
                onClick={() => onNavigate('phc-network')}
                className="p-2.5 bg-emerald-50/70 hover:bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">{stablePhcs.length} {t.stableCenters}</div>
                    <div className="text-[11px] text-emerald-700">{language === 'hi' ? 'दाता समर्थन हेतु अधिशेष भंडार तैयार' : 'Surplus reserves ready for donor support'}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Critical Early Warning Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {t.earlyWarningFeed}
                </h3>
                <span className="text-[11px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                  {activeAlerts.length} {t.activeAlerts}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {t.preemptiveNotice}:
              </p>

              <div className="space-y-2">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => onNavigate('alerts')}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {alert.phcName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          alert.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{alert.problem}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{t.timeRemainingAlert} {alert.timeRemaining}</span>
                      <span className="font-mono text-cyan-600 font-semibold">{t.actionReady}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onNavigate('emergency-simulator')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {t.emergencySimulator}
              </button>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
              >
                {t.viewAllAlerts} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {t.federatedQuorumStatus}
            </div>
            <div className="text-[11px] text-slate-500">
              {t.federatedQuorumSub}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => onNavigate('medicines-inventory')}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Pill className="w-3.5 h-3.5" />
            {t.checkMedicines}
          </button>
          <button
            onClick={() => onNavigate('ai-demand-forecast')}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {t.sevenDayForecast}
          </button>
          <button
            onClick={() => onNavigate('resource-optimizer')}
            className="w-full sm:w-auto px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            {t.resourceOptimizer}
          </button>
        </div>
      </div>
    </div>
  );
};
