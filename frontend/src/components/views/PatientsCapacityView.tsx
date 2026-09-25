import React, { useState } from 'react';
import {
  Users,
  Bed,
  Activity,
  HeartPulse,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { PHC } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

import { LanguageCode, getTranslation } from '../../utils/i18n';

interface PatientsCapacityViewProps {
  language?: LanguageCode;
  phcs?: PHC[];
}

export const PatientsCapacityView: React.FC<PatientsCapacityViewProps> = ({
  language = 'en',
  phcs = [],
}) => {
  const t = getTranslation(language);
  const [selectedPhcFilter, setSelectedPhcFilter] = useState<string>('all');

  const safePhcs = phcs || [];
  const activeData =
    selectedPhcFilter === 'all'
      ? safePhcs
      : safePhcs.filter((p) => p.id === selectedPhcFilter);

  // Aggregated sums
  const totalPatients = activeData.reduce((acc, p) => acc + p.patientsToday, 0);
  const totalWalkIns = activeData.reduce((acc, p) => acc + p.walkInPatients, 0);
  const totalUnderTreatment = activeData.reduce((acc, p) => acc + p.underTreatment, 0);
  const totalRecovering = activeData.reduce((acc, p) => acc + p.recovering, 0);
  const totalRecovered = activeData.reduce((acc, p) => acc + p.recoveredToday, 0);
  const totalDischarged = activeData.reduce((acc, p) => acc + p.dischargedToday, 0);
  const totalAdmitted = activeData.reduce((acc, p) => acc + p.admittedToday, 0);
  const totalEmergency = activeData.reduce((acc, p) => acc + p.emergencyCases, 0);
  const totalCritical = activeData.reduce((acc, p) => acc + p.criticalPatients, 0);
  const totalReferred = activeData.reduce((acc, p) => acc + p.referredPatients, 0);

  const totalBeds = activeData.reduce((acc, p) => acc + p.totalBeds, 0);
  const occupiedBeds = activeData.reduce((acc, p) => acc + p.occupiedBeds, 0);
  const availableBeds = totalBeds - occupiedBeds;

  const totalEmergencyBeds = activeData.reduce((acc, p) => acc + p.emergencyBedsTotal, 0);
  const occupiedEmergencyBeds = activeData.reduce((acc, p) => acc + p.emergencyBedsOccupied, 0);

  const totalIcuBeds = activeData.reduce((acc, p) => acc + p.icuBedsTotal, 0);
  const occupiedIcuBeds = activeData.reduce((acc, p) => acc + p.icuBedsOccupied, 0);

  // Hourly intake trend dataset for Recharts
  const hourlyIntakeTrend = [
    { time: '08:00', walkIns: 45, emergency: 4, discharges: 10, bedOccupancy: 62 },
    { time: '10:00', walkIns: 120, emergency: 8, discharges: 18, bedOccupancy: 68 },
    { time: '12:00', walkIns: 195, emergency: 12, discharges: 32, bedOccupancy: 74 },
    { time: '14:00', walkIns: 160, emergency: 14, discharges: 45, bedOccupancy: 78 },
    { time: '16:00', walkIns: 130, emergency: 9, discharges: 28, bedOccupancy: 72 },
    { time: '18:00', walkIns: 85, emergency: 6, discharges: 15, bedOccupancy: 70 },
    { time: '20:00', walkIns: 50, emergency: 5, discharges: 8, bedOccupancy: 66 },
  ];

  // Bed distribution across selected PHC top 6
  const phcBedDistribution = phcs.slice(0, 6).map((p) => ({
    name: p.name.replace('PHC-', ''),
    occupied: p.occupiedBeds,
    available: p.availableBeds,
    emergency: p.emergencyBedsOccupied,
  }));

  return (
    <div id="patients-capacity-view" className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>{language === 'hi' ? 'सॉवरेन गोपनीयता एन्क्लेव:' : 'Sovereign Privacy Enclave:'}</strong> {language === 'hi' ? 'शून्य व्यक्तिगत डेटा (PII)। केवल कुल रोगी संख्या एवं वार्ड बेड क्षमता प्रसारित होती है।' : 'Zero PII (Personally Identifiable Information) collected or exposed. Only aggregated patient volume counts and clinical ward bed capacities are transmitted.'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <label className="text-slate-500 font-semibold">{language === 'hi' ? 'दायरा:' : 'Scope:'}</label>
          <select
            value={selectedPhcFilter}
            onChange={(e) => setSelectedPhcFilter(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800"
          >
            <option value="all">{language === 'hi' ? 'संपूर्ण ग्रिड (18 पीएचसी)' : 'Entire Grid (18 PHCs)'}</option>
            {phcs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Operational Flow Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              {t.patientsCapacityTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.patientsCapacitySubtitle}
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            {language === 'hi' ? '24 घंटे कुल:' : '24h Total:'} {totalPatients.toLocaleString()} {language === 'hi' ? 'मरीज' : 'Patients'}
          </span>
        </div>

        {/* 10 Detailed Flow Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">{t.patientsToday}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">{totalPatients}</div>
            <span className="text-[10px] text-slate-500">{language === 'hi' ? 'आज कुल दर्ज' : 'Cumulative today'}</span>
          </div>

          <div className="bg-cyan-50/60 p-2.5 sm:p-3 rounded-xl border border-cyan-100">
            <span className="text-[10px] uppercase font-bold text-cyan-700 block truncate">{language === 'hi' ? 'वॉक-इन मरीज' : 'Walk-In Patients'}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-900 mt-1">{totalWalkIns}</div>
            <span className="text-[10px] text-cyan-600">{language === 'hi' ? 'एम्बुलेटरी परामर्श' : 'Ambulatory triage'}</span>
          </div>

          <div className="bg-blue-50/60 p-2.5 sm:p-3 rounded-xl border border-blue-100">
            <span className="text-[10px] uppercase font-bold text-blue-700 block truncate">{t.underTreatmentTitle}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-900 mt-1">{totalUnderTreatment}</div>
            <span className="text-[10px] text-blue-600">{language === 'hi' ? 'सक्रिय उपचार' : 'Active consult'}</span>
          </div>

          <div className="bg-amber-50/60 p-2.5 sm:p-3 rounded-xl border border-amber-100">
            <span className="text-[10px] uppercase font-bold text-amber-700 block truncate">{t.totalAdmittedToday}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900 mt-1">{totalAdmitted}</div>
            <span className="text-[10px] text-amber-600">{language === 'hi' ? 'वार्ड में भर्ती' : 'Ward in-patients'}</span>
          </div>

          <div className="bg-rose-50/70 p-2.5 sm:p-3 rounded-xl border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-700 block truncate">{t.emergencyCases}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-900 mt-1">{totalEmergency}</div>
            <span className="text-[10px] text-rose-600">{totalCritical} {language === 'hi' ? 'गंभीर' : 'critical'}</span>
          </div>

          <div className="bg-indigo-50/60 p-2.5 sm:p-3 rounded-xl border border-indigo-100">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block truncate">{t.recoveringTitle}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-900 mt-1">{totalRecovering}</div>
            <span className="text-[10px] text-indigo-600">{language === 'hi' ? 'अवलोकन में' : 'Post-stabilization'}</span>
          </div>

          <div className="bg-emerald-50/60 p-2.5 sm:p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block truncate">{language === 'hi' ? 'आज स्वस्थ हुए' : 'Recovered Today'}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-900 mt-1">{totalRecovered}</div>
            <span className="text-[10px] text-emerald-600">{language === 'hi' ? 'सकारात्मक परिणाम' : 'Positive outcome'}</span>
          </div>

          <div className="bg-teal-50/60 p-2.5 sm:p-3 rounded-xl border border-teal-100">
            <span className="text-[10px] uppercase font-bold text-teal-700 block truncate">{t.dischargedTitle}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-teal-900 mt-1">{totalDischarged}</div>
            <span className="text-[10px] text-teal-600">{language === 'hi' ? 'डिस्चार्ज हुए' : 'Returned home'}</span>
          </div>

          <div className="bg-purple-50/60 p-2.5 sm:p-3 rounded-xl border border-purple-100">
            <span className="text-[10px] uppercase font-bold text-purple-700 block truncate">{language === 'hi' ? 'गंभीर मामले' : 'Critical Cases'}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-purple-900 mt-1">{totalCritical}</div>
            <span className="text-[10px] text-purple-600">{language === 'hi' ? 'आईसीयू निगरानी' : 'ICU monitoring'}</span>
          </div>

          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">{language === 'hi' ? 'अन्यत्र संदर्भित' : 'Referred Out'}</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-800 mt-1">{totalReferred}</div>
            <span className="text-[10px] text-slate-500">{language === 'hi' ? 'तृतीयक स्तर' : 'Tertiary referral'}</span>
          </div>
        </div>
      </div>

      {/* Bed Capacity Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Beds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-blue-600" />
              {t.bedBreakdownTitle}
            </span>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {Math.round((occupiedBeds / totalBeds) * 100)}% {language === 'hi' ? 'अधिग्रहित' : 'Occ'}
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {occupiedBeds}{' '}
            <span className="text-sm font-normal text-slate-400">/ {totalBeds} {language === 'hi' ? 'कुल' : 'total'}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${Math.round((occupiedBeds / totalBeds) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{language === 'hi' ? 'उपलब्ध:' : 'Available:'} <strong className="text-slate-800">{availableBeds} {language === 'hi' ? 'बेड' : 'beds'}</strong></span>
            <span>{language === 'hi' ? 'ग्रिड रिजर्व सामान्य' : 'Grid reserve nominal'}</span>
          </div>
        </div>

        {/* Emergency Beds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-600" />
              {t.emergencyBedsTitle}
            </span>
            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {Math.round((occupiedEmergencyBeds / totalEmergencyBeds) * 100)}% {language === 'hi' ? 'अधिग्रहित' : 'Occ'}
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {occupiedEmergencyBeds}{' '}
            <span className="text-sm font-normal text-slate-400">/ {totalEmergencyBeds} {language === 'hi' ? 'कुल' : 'total'}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${Math.round((occupiedEmergencyBeds / totalEmergencyBeds) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{language === 'hi' ? 'उपलब्ध आपातकालीन:' : 'Free Emergency:'} <strong className="text-emerald-700">{totalEmergencyBeds - occupiedEmergencyBeds} {language === 'hi' ? 'बे' : 'bays'}</strong></span>
            <span>{language === 'hi' ? 'कॉरिडोर बी तैयार' : 'Corridor B ready'}</span>
          </div>
        </div>

        {/* ICU Beds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-amber-600" />
              {t.icuBedsTitle}
            </span>
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {Math.round((occupiedIcuBeds / totalIcuBeds) * 100)}% {language === 'hi' ? 'अधिग्रहित' : 'Occ'}
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {occupiedIcuBeds}{' '}
            <span className="text-sm font-normal text-slate-400">/ {totalIcuBeds} {language === 'hi' ? 'कुल' : 'total'}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${Math.round((occupiedIcuBeds / totalIcuBeds) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{language === 'hi' ? 'उपलब्ध आईसीयू:' : 'Free ICU:'} <strong className="text-slate-800">{totalIcuBeds - occupiedIcuBeds} {language === 'hi' ? 'बे' : 'bays'}</strong></span>
            <span>{language === 'hi' ? 'वेंटिलेटर सिंक' : 'Ventilator synced'}</span>
          </div>
        </div>
      </div>

      {/* Charting: Hourly Patient Intake Velocity & PHC Bed Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Flow Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.hourlyTriageTitle}</h3>
              <p className="text-xs text-slate-500">{language === 'hi' ? 'वॉक-इन परामर्श बनाम आपातकालीन ट्रॉमा आगमन' : 'Walk-in consults vs emergency trauma arrivals'}</p>
            </div>
            <span className="text-xs text-cyan-600 font-semibold bg-cyan-50 px-2 py-0.5 rounded-full">
              Live Recharts
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyIntakeTrend}>
                <defs>
                  <linearGradient id="walkInGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="emergGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="walkIns"
                  name={language === 'hi' ? 'वॉक-इन मरीज' : 'Walk-In Patients'}
                  stroke="#0891b2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#walkInGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="emergency"
                  name={language === 'hi' ? 'आपातकालीन ट्रॉमा' : 'Emergency Trauma'}
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emergGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PHC Bed Comparison Bar Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{language === 'hi' ? 'प्रमुख नोड्स में बेड अधिभोग' : 'Bed Occupancy Across Key Nodes'}</h3>
            <p className="text-xs text-slate-500">{language === 'hi' ? 'सेक्टर में अधिग्रहित बनाम उपलब्ध क्षमता' : 'Occupied vs available capacity in sector'}</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phcBedDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="occupied" name={language === 'hi' ? 'अधिग्रहित' : 'Occupied'} fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name={language === 'hi' ? 'उपलब्ध' : 'Available'} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
