import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Users,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowRightLeft,
  ShieldCheck,
} from 'lucide-react';
import { StaffMember, PHC } from '../../types';

import { LanguageCode, getTranslation } from '../../utils/i18n';

interface StaffAvailabilityViewProps {
  language?: LanguageCode;
  staff?: StaffMember[];
  phcs?: PHC[];
}

export const StaffAvailabilityView: React.FC<StaffAvailabilityViewProps> = ({
  language = 'en',
  staff = [],
  phcs = [],
}) => {
  const t = getTranslation(language);
  const [search, setSearch] = useState('');
  const [selectedPhc, setSelectedPhc] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const safePhcs = phcs || [];
  const safeStaff = staff || [];

  const totalDoctorsOnDuty = safePhcs.reduce((acc, p) => acc + p.doctorsPresent, 0);
  const totalDoctorsRostered = safePhcs.reduce((acc, p) => acc + p.doctorsTotal, 0);
  const totalNursesOnDuty = safePhcs.reduce((acc, p) => acc + p.nursesPresent, 0);
  const totalNursesRostered = safePhcs.reduce((acc, p) => acc + p.nursesTotal, 0);
  const totalPatients = safePhcs.reduce((acc, p) => acc + p.patientsToday, 0);

  const avgDoctorPatientRatio = Math.round(totalPatients / Math.max(1, totalDoctorsOnDuty));

  const filteredStaff = useMemo(() => {
    return safeStaff.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phcName.toLowerCase().includes(search.toLowerCase()) ||
        (s.specialty && s.specialty.toLowerCase().includes(search.toLowerCase()));

      const matchPhc = selectedPhc === 'all' || s.phcId === selectedPhc;
      const matchRole = selectedRole === 'all' || s.role === selectedRole;
      const matchShift = selectedShift === 'all' || s.shift === selectedShift;

      return matchSearch && matchPhc && matchRole && matchShift;
    });
  }, [staff, search, selectedPhc, selectedRole, selectedShift]);

  const handleRequestCover = (st: StaffMember) => {
    setToastMessage(
      `Relief shift request broadcasted for ${st.name} (${st.phcName}). Sector-2 on-call pool alerted.`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div id="staff-availability-view" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-cyan-500/40 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & KPI Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              {t.staffRosterTitle}
            </h1>
            <p className="text-xs text-slate-500">
              {t.staffRosterSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {language === 'hi' ? 'रोस्टर सत्यनिष्ठा: 91%' : 'Roster Integrity: 91%'}
            </span>
          </div>
        </div>

        {/* 4 Core Human Resource Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">{t.doctorsOnDuty}</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalDoctorsOnDuty} / {totalDoctorsRostered}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">{language === 'hi' ? '87% ग्रिड कवरेज' : '87% Grid Coverage'}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'सक्रिय नर्सिंग स्टाफ' : 'Nursing Staff Active'}</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalNursesOnDuty} / {totalNursesRostered}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">{language === 'hi' ? '93% सक्रिय शिफ्ट' : '93% Active Shifts'}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">{t.doctorPatientRatioTitle}</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              1 : {avgDoctorPatientRatio}
            </div>
            <span className="text-[10px] text-slate-500">{language === 'hi' ? 'लक्षित अनुपात < 1:50' : 'Target ratio < 1:50'}</span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800">{language === 'hi' ? 'गंभीर शिफ्ट घाटा' : 'Critical Shift Deficits'}</span>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
              1 {language === 'hi' ? 'केंद्र' : 'Center'}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">PHC-Alpha East (2 / 4)</span>
          </div>
        </div>

        {/* Bottleneck Warning Callout */}
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 flex-1">
              <strong>{language === 'hi' ? 'चिकित्सीय बाधा चेतावनी (PHC-Alpha East):' : 'Clinical Bottleneck Warning (PHC-Alpha East):'}</strong> {language === 'hi' ? 'सुबह के समय केवल 2 डॉक्टर सक्रिय हैं; प्रतीक्षा समय +45 मिनट चल रहा है। डॉ. अनन्या शर्मा PHC-Beta South में ऑन-कॉल उपलब्ध हैं।' : 'Only 2 out of 4 doctors active for morning surge; consult wait-time is tracking at +45 minutes. Dr. Ananya Sharma is currently on-call at PHC-Beta South and available for dynamic inter-PHC relief.'}
            </div>
          </div>
          <button
            onClick={() => {
              setToastMessage(language === 'hi' ? 'PHC-Alpha East में राहत हैंडओवर के लिए डॉ. अनन्या शर्मा को जुटाया गया।' : 'Mobilized Dr. Ananya Sharma for relief handover at PHC-Alpha East.');
              setTimeout(() => setToastMessage(null), 4000);
            }}
            className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shrink-0 shadow-2xs text-center cursor-pointer"
          >
            {language === 'hi' ? 'राहत डॉक्टर जुटाएं' : 'Mobilize Relief Doctor'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchStaffPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0">{language === 'hi' ? 'क्लिनिक:' : 'Clinic:'}</label>
            <select
              value={selectedPhc}
              onChange={(e) => setSelectedPhc(e.target.value)}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">{language === 'hi' ? 'सभी क्लिनिक' : 'All Clinics'}</option>
              {phcs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0">{language === 'hi' ? 'पद:' : 'Role:'}</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">{t.filterAllRoles}</option>
              <option value="Medical Officer">{language === 'hi' ? 'चिकित्सा अधिकारी (MO)' : 'Medical Officer'}</option>
              <option value="Senior Physician">{language === 'hi' ? 'वरिष्ठ चिकित्सक' : 'Senior Physician'}</option>
              <option value="Triage Nurse">{language === 'hi' ? 'ट्राइएज नर्स' : 'Triage Nurse'}</option>
              <option value="Pharmacist">{language === 'hi' ? 'फार्मासिस्ट' : 'Pharmacist'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0">{language === 'hi' ? 'शिफ्ट:' : 'Shift:'}</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">{t.filterAllShifts}</option>
              <option value="Morning">{language === 'hi' ? 'सुबह (08:00 - 16:00)' : 'Morning (08:00 - 16:00)'}</option>
              <option value="Evening">{language === 'hi' ? 'शाम (16:00 - 00:00)' : 'Evening (16:00 - 00:00)'}</option>
              <option value="Night">{language === 'hi' ? 'रात (00:00 - 08:00)' : 'Night (00:00 - 08:00)'}</option>
              <option value="On-Call">{language === 'hi' ? 'ऑन-कॉल स्टैंडबाय' : 'On-Call Standby'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.colStaffName}</th>
                <th className="py-3 px-3">{t.colRole}</th>
                <th className="py-3 px-3">{t.colPhcFacility}</th>
                <th className="py-3 px-3">{t.colShift}</th>
                <th className="py-3 px-3 text-center">{t.colDutyStatus}</th>
                <th className="py-3 px-3 text-right">{t.colPatientsSeen}</th>
                <th className="py-3 px-4 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStaff.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{st.name}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800">{st.role}</span>
                    {st.specialty && (
                      <span className="text-[10px] text-slate-400 block">{st.specialty}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">{st.phcName}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {st.shift}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        st.status === 'on_duty'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.status === 'standby'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {language === 'hi'
                        ? st.status === 'on_duty' ? 'ड्यूटी पर' : st.status === 'standby' ? 'स्टैंडबाय' : 'छुट्टी पर'
                        : st.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {st.patientsSeenToday}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRequestCover(st)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-xs transition-colors cursor-pointer"
                    >
                      {t.requestCoverBtn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
