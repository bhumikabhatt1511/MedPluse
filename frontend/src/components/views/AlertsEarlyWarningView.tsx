import React, { useState, useMemo } from 'react';
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  Zap,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Alert, RiskLevel } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { NavView } from '../common/Sidebar';

import { LanguageCode, getTranslation } from '../../utils/i18n';

interface AlertsEarlyWarningViewProps {
  language?: LanguageCode;
  alerts?: Alert[];
  onResolveAlert: (alertId: string) => void;
  onNavigate: (view: NavView) => void;
  onSelectPhc: (phcId: string) => void;
}

export const AlertsEarlyWarningView: React.FC<AlertsEarlyWarningViewProps> = ({
  language = 'en',
  alerts = [],
  onResolveAlert,
  onNavigate,
  onSelectPhc,
}) => {
  const t = getTranslation(language);
  const [severityFilter, setSeverityFilter] = useState<'all' | RiskLevel | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const safeAlerts = alerts || [];
  const criticalCount = safeAlerts.filter((a) => a.severity === 'critical' && !a.resolved).length;
  const highCount = safeAlerts.filter((a) => a.severity === 'high' && !a.resolved).length;
  const warningCount = safeAlerts.filter((a) => a.severity === 'warning' && !a.resolved).length;
  const resolvedCount = safeAlerts.filter((a) => a.resolved).length;

  const filteredAlerts = useMemo(() => {
    return safeAlerts.filter((a) => {
      const matchSeverity =
        severityFilter === 'all'
          ? true
          : severityFilter === 'resolved'
          ? a.resolved
          : a.severity === severityFilter && !a.resolved;

      const matchCategory = categoryFilter === 'all' || a.category === categoryFilter;

      const matchSearch =
        a.phcName.toLowerCase().includes(search.toLowerCase()) ||
        a.problem.toLowerCase().includes(search.toLowerCase()) ||
        a.predictedImpact.toLowerCase().includes(search.toLowerCase());

      return matchSeverity && matchCategory && matchSearch;
    });
  }, [alerts, severityFilter, categoryFilter, search]);

  const handleActionClick = (alert: Alert) => {
    onSelectPhc(alert.phcId);
    if (alert.category === 'supply') {
      onNavigate('resource-optimizer');
    } else if (alert.category === 'bed') {
      onNavigate('patients-capacity');
    } else if (alert.category === 'staff') {
      onNavigate('staff-availability');
    } else {
      onNavigate('phc-details');
    }
  };

  return (
    <div id="alerts-early-warning-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-rose-600" />
              {t.earlyWarningTitle}
            </h1>
            <p className="text-xs text-slate-500">
              {t.earlyWarningSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              {language === 'hi' ? `${criticalCount} गंभीर कार्रवाई आवश्यक` : `${criticalCount} Critical Action Required`}
            </span>
          </div>
        </div>

        {/* 4 Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              severityFilter === 'critical'
                ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-200'
                : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70'
            }`}
          >
            <span className="text-[11px] font-semibold text-rose-700">
              {language === 'hi' ? 'गंभीर (<4घंटे या <3दिन)' : 'Critical (<4h or <3d)'}
            </span>
            <div className="text-2xl font-bold font-mono text-rose-900 mt-0.5">{criticalCount}</div>
          </button>

          <button
            onClick={() => setSeverityFilter('high')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              severityFilter === 'high'
                ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200'
                : 'bg-orange-50/70 border-orange-200 hover:bg-orange-100/70'
            }`}
          >
            <span className="text-[11px] font-semibold text-orange-700">
              {language === 'hi' ? 'उच्च जोखिम (<12घंटे)' : 'High Risk (<12h)'}
            </span>
            <div className="text-2xl font-bold font-mono text-orange-900 mt-0.5">{highCount}</div>
          </button>

          <button
            onClick={() => setSeverityFilter('warning')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              severityFilter === 'warning'
                ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-200'
                : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <span className="text-[11px] font-semibold text-amber-700">
              {language === 'hi' ? 'चेतावनी (सलाहकार)' : 'Warning (Advisory)'}
            </span>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-0.5">{warningCount}</div>
          </button>

          <button
            onClick={() => setSeverityFilter('resolved')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              severityFilter === 'resolved'
                ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
            }`}
          >
            <span className="text-[11px] font-semibold text-emerald-700">
              {language === 'hi' ? 'आज हल किए गए' : 'Resolved Today'}
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">{resolvedCount}</div>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'hi' ? 'पीएचसी, समस्या या प्रभाव से खोजें...' : 'Search alert by PHC, problem or impact...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0 font-medium">{language === 'hi' ? 'गंभीरता:' : 'Severity:'}</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 cursor-pointer"
            >
              <option value="all">{t.filterAllSeverities}</option>
              <option value="critical">{language === 'hi' ? 'केवल गंभीर' : 'Critical Only'}</option>
              <option value="high">{language === 'hi' ? 'केवल उच्च जोखिम' : 'High Risk Only'}</option>
              <option value="warning">{language === 'hi' ? 'केवल चेतावनी' : 'Warning Only'}</option>
              <option value="resolved">{language === 'hi' ? 'केवल हल किए गए' : 'Resolved Only'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0 font-medium">{language === 'hi' ? 'श्रेणी:' : 'Category:'}</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 cursor-pointer"
            >
              <option value="all">{t.filterAllCategoriesAlert}</option>
              <option value="supply">{language === 'hi' ? 'आपूर्ति श्रृंखला / स्टॉकआउट' : 'Supply Chain / Stockout'}</option>
              <option value="bed">{language === 'hi' ? 'बेड एवं ट्रॉमा क्षमता' : 'Bed & Trauma Capacity'}</option>
              <option value="staff">{language === 'hi' ? 'स्टाफिंग एवं डॉक्टर रोस्टर' : 'Staffing & Doctor Roster'}</option>
              <option value="epidemic">{language === 'hi' ? 'महामारी विज्ञान वेक्टर' : 'Epidemiological Vector'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'कोई मेल खाने वाले अलर्ट नहीं मिले' : 'No matching alerts found'}
            </div>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'सभी चयनित फिल्टर सामान्य नैदानिक स्थिति की रिपोर्ट करते हैं।' : 'All selected filters report nominal clinical parameters.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.resolved;
            const isCritical = alert.severity === 'critical';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all space-y-3 ${
                  isResolved
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isCritical
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : alert.severity === 'high'
                    ? 'border-orange-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <RiskBadge level={alert.severity} showPulse={isCritical && !isResolved} language={language} />
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{alert.phcName}</h2>
                      <span className="text-[11px] text-slate-500">
                        {language === 'hi' ? 'श्रेणी:' : 'Category:'} <strong className="capitalize">{alert.category}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t.timeRemainingAlert} <strong className={isCritical ? 'text-rose-600' : 'text-slate-800'}>{alert.timeRemaining}</strong>
                    </span>
                    <span>•</span>
                    <span>{language === 'hi' ? 'दर्ज' : 'Logged'} {alert.timestamp}</span>
                  </div>
                </div>

                {/* Problem & Impact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block mb-1">{language === 'hi' ? 'पहचानी गई समस्या:' : 'Detected Problem:'}</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{alert.problem}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block mb-1">{language === 'hi' ? 'अनुमानित परिचालन प्रभाव:' : 'Predicted Operational Impact:'}</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{alert.predictedImpact}</p>
                  </div>
                </div>

                {/* Recommended AI Action Box & Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2 text-xs flex-1">
                    <Zap className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700">{language === 'hi' ? 'अनुशंसित कार्रवाई:' : 'Recommended Action:'} </span>
                      <span className="text-slate-600">{alert.recommendedAction}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isResolved ? (
                      <>
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {t.resolveAlertBtn}
                        </button>
                        <button
                          onClick={() => handleActionClick(alert)}
                          className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {language === 'hi' ? 'हस्तक्षेप निष्पादित करें' : 'Execute Intervention'} <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" /> {language === 'hi' ? 'कार्रवाई निष्पादित एवं हल' : 'Action Executed & Resolved'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
