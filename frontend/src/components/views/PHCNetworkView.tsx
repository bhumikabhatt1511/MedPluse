import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Activity,
  UserCheck,
  Bed,
  Pill,
  ArrowUpDown,
  Navigation,
} from 'lucide-react';
import { PHC, RiskLevel } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { LanguageCode, getLocalizedPHC, getTranslation, getLocalizedRiskLevel, getLocalizedMedicineRisk } from '../../utils/i18n';

interface PHCNetworkViewProps {
  phcs: PHC[];
  onSelectPhc: (phcId: string) => void;
  onOpenOptimizer: (phcId: string) => void;
  language?: LanguageCode;
}

export const PHCNetworkView: React.FC<PHCNetworkViewProps> = ({
  phcs,
  onSelectPhc,
  onOpenOptimizer,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<'all' | RiskLevel>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'patients' | 'beds' | 'stockout'>('risk');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const states = useMemo(() => {
    const list = Array.from(new Set(phcs.map((p) => p.state)));
    return ['all', ...list];
  }, [phcs]);

  const filteredPhcs = useMemo(() => {
    return phcs
      .filter((phc) => {
        const matchesSearch =
          phc.name.toLowerCase().includes(search.toLowerCase()) ||
          phc.code.toLowerCase().includes(search.toLowerCase()) ||
          phc.district.toLowerCase().includes(search.toLowerCase());

        const matchesState = selectedState === 'all' || phc.state === selectedState;
        const matchesRisk = selectedRisk === 'all' || phc.riskLevel === selectedRisk;

        return matchesSearch && matchesState && matchesRisk;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') return b.riskScore - a.riskScore;
        if (sortBy === 'patients') return b.patientsToday - a.patientsToday;
        if (sortBy === 'beds') return b.availableBeds - a.availableBeds;
        if (sortBy === 'stockout') return a.stockoutPredictionDays - b.stockoutPredictionDays;
        return 0;
      });
  }, [phcs, search, selectedState, selectedRisk, sortBy]);

  return (
    <div id="phc-network-view" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-600" />
              {t.phcDirectoryTitle}
            </h1>
            <p className="text-xs text-slate-500">
              {t.phcDirectorySubtitle} ({phcs.length} {language === 'hi' ? 'केंद्र' : 'Nodes'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPhcPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0 font-medium">{language === 'hi' ? 'राज्य:' : 'State:'}</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="all">{t.filterAllStates} ({phcs.length})</option>
              {states.filter((s) => s !== 'all').map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0 font-medium">{language === 'hi' ? 'जोखिम:' : 'Risk:'}</label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="all">{t.filterAllRisks} ({phcs.length})</option>
              <option value="critical">{language === 'hi' ? 'गंभीर' : 'Critical'} ({phcs.filter((p) => p.riskLevel === 'critical').length})</option>
              <option value="high">{language === 'hi' ? 'उच्च जोखिम' : 'High Risk'} ({phcs.filter((p) => p.riskLevel === 'high').length})</option>
              <option value="warning">{language === 'hi' ? 'चेतावनी' : 'Warning'} ({phcs.filter((p) => p.riskLevel === 'warning').length})</option>
              <option value="stable">{language === 'hi' ? 'स्थिर' : 'Stable'} ({phcs.filter((p) => p.riskLevel === 'stable').length})</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0 font-medium">{language === 'hi' ? 'क्रम:' : 'Sort:'}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="risk">{t.sortByRisk}</option>
              <option value="patients">{t.sortByPatients}</option>
              <option value="beds">{t.sortByBeds}</option>
              <option value="stockout">{t.sortByStockout}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhcs.map((phc) => {
            const locPhc = getLocalizedPHC(phc, language);
            const bedOccPercent = Math.round((phc.occupiedBeds / phc.totalBeds) * 100);
            return (
              <div
                key={phc.id}
                id={`phc-card-${phc.id}`}
                className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  phc.riskLevel === 'critical'
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : phc.riskLevel === 'warning'
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-sm hover:text-cyan-700 cursor-pointer" onClick={() => onSelectPhc(phc.id)}>
                          {locPhc.name}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500">{locPhc.district}, {locPhc.state}</span>
                    </div>
                    <RiskBadge level={phc.riskLevel} size="sm" />
                  </div>

                  {/* Resilience & Risk Bar */}
                  <div className="my-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Resilience Index:
                      </span>
                      <span className="font-mono text-slate-900">{phc.resilienceScore}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          phc.resilienceScore > 75
                            ? 'bg-emerald-500'
                            : phc.resilienceScore > 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${phc.resilienceScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics 4-Box Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-600" /> Patients
                      </div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {phc.patientsToday}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">
                          ({phc.emergencyCases} emerg.)
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Bed className="w-3 h-3 text-blue-600" /> Beds Occupied
                      </div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {phc.occupiedBeds} / {phc.totalBeds}
                        <span className={`text-[10px] ml-1 font-semibold ${bedOccPercent > 85 ? 'text-rose-600' : 'text-slate-500'}`}>
                          ({bedOccPercent}%)
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" /> Doctors
                      </div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {phc.doctorsPresent} / {phc.doctorsTotal} Active
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Pill className="w-3 h-3 text-rose-500" /> Medicine Risk
                      </div>
                      <div className={`text-[11px] font-bold mt-0.5 uppercase ${
                        phc.medicineRisk === 'critical' ? 'text-rose-600' : phc.medicineRisk === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {phc.medicineRisk}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onSelectPhc(phc.id)}
                    className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {t.viewTelemetryBtn}
                  </button>
                  {(phc.riskLevel === 'critical' || phc.riskLevel === 'warning') && (
                    <button
                      onClick={() => onOpenOptimizer(phc.id)}
                      className="py-1.5 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Run Optimization Algorithm"
                    >
                      {language === 'hi' ? 'अनुकूलन' : 'Optimize'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{t.tableColPhc}</th>
                  <th className="py-3 px-3">{t.tableColDistrict}</th>
                  <th className="py-3 px-3 text-center">{t.tableColRisk}</th>
                  <th className="py-3 px-3 text-center">{t.resilienceIndex}</th>
                  <th className="py-3 px-3 text-right">{t.tableColPatients}</th>
                  <th className="py-3 px-3 text-right">{t.tableColBeds}</th>
                  <th className="py-3 px-3 text-center">{t.tableColDoctors}</th>
                  <th className="py-3 px-3 text-center">{t.tableColMedicine}</th>
                  <th className="py-3 px-4 text-right">{t.tableColAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPhcs.map((phc) => {
                  const locPhc = getLocalizedPHC(phc, language);
                  const localizedMed = getLocalizedMedicineRisk(phc.medicineRisk, language);
                  return (
                  <tr key={phc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="font-bold">{locPhc.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{phc.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{locPhc.district}</div>
                      <div className="text-[10px] text-slate-400">{locPhc.state}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <RiskBadge level={phc.riskLevel} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      <span className={phc.resilienceScore > 75 ? 'text-emerald-600' : phc.resilienceScore > 50 ? 'text-amber-600' : 'text-rose-600'}>
                        {phc.resilienceScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {phc.patientsToday}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {phc.occupiedBeds}/{phc.totalBeds} ({Math.round((phc.occupiedBeds / phc.totalBeds) * 100)}%)
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {phc.doctorsPresent}/{phc.doctorsTotal}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold uppercase text-[10px]">
                      <span className={phc.medicineRisk === 'critical' ? 'text-rose-600 font-bold' : phc.medicineRisk === 'moderate' ? 'text-amber-600' : 'text-emerald-600'}>
                        {localizedMed}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPhc(phc.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-xs transition-colors cursor-pointer"
                        >
                          {t.viewTelemetryBtn}
                        </button>
                        {(phc.riskLevel === 'critical' || phc.riskLevel === 'warning') && (
                          <button
                            onClick={() => onOpenOptimizer(phc.id)}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium text-xs transition-colors cursor-pointer"
                          >
                            {language === 'hi' ? 'अनुकूलन' : 'Optimize'}
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
      )}
    </div>
  );
};
