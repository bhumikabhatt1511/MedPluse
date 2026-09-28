import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Menu,
  ShieldCheck,
  Building2,
  ExternalLink,
  Check,
  X,
  Hospital,
  Pill,
  BellRing,
  Activity,
  ArrowRight,
  Globe2,
} from 'lucide-react';
import { Alert, PHC, Medicine, DemoPersonaId, DemoPersona } from '../../types';
import { NavView } from './Sidebar';
import { LanguageCode, getTranslation } from '../../utils/i18n';

export interface DemoPersonaOption extends DemoPersona {
  icon: React.ReactNode;
}

export const DEMO_PERSONAS: DemoPersonaOption[] = [
  {
    id: 'dho',
    title: 'District Health Officer',
    titleHi: 'जिला स्वास्थ्य अधिकारी',
    name: 'Dr. Elena Rostova',
    nameHi: 'डॉ. एलेना रोस्तोवा',
    roleBadge: 'District Health Officer',
    roleBadgeHi: 'जिला स्वास्थ्य अधिकारी',
    initials: 'DHO',
    focus: 'Cross-PHC visibility, shortages, resource redistribution & emergency response',
    focusHi: 'अंतर-पीएचसी निगरानी, कमी निवारण, सुरक्षित पुनर्वितरण और आपातकालीन प्रतिक्रिया',
    icon: <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />,
  },
  {
    id: 'phc-mo',
    title: 'PHC Medical Officer',
    titleHi: 'पीएचसी चिकित्सा अधिकारी',
    name: 'Dr. Rajesh Sharma',
    nameHi: 'डॉ. राजेश शर्मा',
    roleBadge: 'PHC Medical Officer',
    roleBadgeHi: 'पीएचसी चिकित्सा अधिकारी',
    initials: 'MO',
    focus: 'Local PHC status, triage, beds, staff rosters, patient telemetry & local supply',
    focusHi: 'स्थानीय पीएचसी स्थिति, ट्राइएज, बिस्तर, स्टाफ रोस्टर, मरीज और आवश्यक दवाएं',
    icon: <Hospital className="w-4 h-4 text-emerald-600 shrink-0" />,
  },
  {
    id: 'scm',
    title: 'Supply Chain Manager',
    titleHi: 'आपूर्ति श्रृंखला प्रबंधक',
    name: 'Vikram Malhotra',
    nameHi: 'विक्रम मल्होत्रा',
    roleBadge: 'Supply Chain Manager',
    roleBadgeHi: 'आपूर्ति श्रृंखला प्रबंधक',
    initials: 'SCM',
    focus: 'Medicine inventory, stockout risk, 7-day demand forecasts & cold-chain logistics',
    focusHi: 'दवा इन्वेंट्री, स्टॉकआउट जोखिम, 7-दिवसीय मांग पूर्वानुमान और कोल्ड-चेन लॉजिस्टिक्स',
    icon: <Pill className="w-4 h-4 text-amber-600 shrink-0" />,
  },
];

interface HeaderProps {
  currentView?: NavView;
  onNavigate?: (view: NavView) => void;
  onToggleMobileMenu?: () => void;
  alerts?: Alert[];
  phcs?: PHC[];
  medicines?: Medicine[];
  onSelectPhc?: (phcId: string) => void;
  onOpenAlertDetails?: (alert: Alert) => void;
  activeNation?: string;
  onChangeNation?: (nationCode: string) => void;
  onSearchQuery?: (q: string) => void;
  activeAlertsCount?: number;
  selectedDistrict?: string;
  onSelectDistrict?: (district: string) => void;
  onSimulateSurge?: () => void;
  onOpenAlerts?: () => void;
  isMobileMenuOpen?: boolean;
  selectedJurisdiction?: string;
  onSelectJurisdiction?: (jurisdiction: string) => void;
  language?: 'en' | 'hi';
  onToggleLanguage?: (lang: 'en' | 'hi') => void;
  activePersona?: DemoPersonaId;
  onSelectPersona?: (personaId: DemoPersonaId) => void;
}

interface JurisdictionOption {
  id: string;
  label: string;
  badge: string;
  description: string;
}

const JURISDICTION_OPTIONS: JurisdictionOption[] = [
  {
    id: 'all-india',
    label: 'All India (National Grid - 39 Nodes)',
    badge: '39 Nodes',
    description: 'Complete inter-state primary healthcare telemetry network across 15 Indian states / UTs (Demo)',
  },
  {
    id: 'state-maharashtra',
    label: 'Maharashtra (Western Grid - 5 Nodes)',
    badge: '5 Nodes',
    description: 'Wagholi, Saswad, Bhosari, Chakan & Paud primary care network (Demo)',
  },
  {
    id: 'cluster-pune',
    label: 'Pune District Sub-Division (5 Nodes)',
    badge: '5 Nodes',
    description: 'Inter-PHC resource optimization & safe surplus demonstration cluster (Demo)',
  },
  {
    id: 'state-karnataka',
    label: 'Karnataka (Southern Grid - 4 Nodes)',
    badge: '4 Nodes',
    description: 'Devanahalli, Nelamangala, Ramanagara & Hubballi primary health network (Demo)',
  },
  {
    id: 'state-gujarat',
    label: 'Gujarat (Western Industrial - 3 Nodes)',
    badge: '3 Nodes',
    description: 'Sanand Industrial, Gandhinagar Tribal Fringe & Surat Coastal Delta (Demo)',
  },
  {
    id: 'state-rajasthan',
    label: 'Rajasthan (Thar Desert Grid - 3 Nodes)',
    badge: '3 Nodes',
    description: 'Sanganer, Jodhpur Desert Basin & Amber Ridge primary health network (Demo)',
  },
  {
    id: 'state-uttar-pradesh',
    label: 'Uttar Pradesh (Gangetic Grid - 4 Nodes)',
    badge: '4 Nodes',
    description: 'Varanasi Ghats, Lucknow Peripheral, Gorakhpur Terai & Kanpur Dehat (Demo)',
  },
  {
    id: 'state-uttarakhand',
    label: 'Uttarakhand (Himalayan Grid - 3 Nodes)',
    badge: '3 Nodes',
    description: 'Dehradun Rural Foothills, Haridwar Basin & Almora Hill Outpost (Demo)',
  },
  {
    id: 'state-bihar',
    label: 'Bihar (Eastern Agro-Grid - 3 Nodes)',
    badge: '3 Nodes',
    description: 'Danapur Cantonment, Phulwari Sharif & Gaya Bodhgaya Pilgrim Hub (Demo)',
  },
  {
    id: 'state-west-bengal',
    label: 'West Bengal (Eastern Riverine - 3 Nodes)',
    badge: '3 Nodes',
    description: 'Rajarhat Peri-Urban, Baruipur Coastal & Siliguri Foothills Outpost (Demo)',
  },
  {
    id: 'state-tamil-nadu',
    label: 'Tamil Nadu (Southern Coastal - 3 Nodes)',
    badge: '3 Nodes',
    description: 'Sriperumbudur Industrial, Madurai Agrarian & Coimbatore Foothills (Demo)',
  },
  {
    id: 'state-telangana',
    label: 'Telangana (Deccan Plateau - 2 Nodes)',
    badge: '2 Nodes',
    description: 'Medchal Industrial Ring & Warangal Heritage primary health network (Demo)',
  },
  {
    id: 'state-delhi',
    label: 'Delhi (NCT Capital Belt - 1 Node)',
    badge: '1 Node',
    description: 'Najafgarh rural emergency observation & training triage (Demo)',
  },
  {
    id: 'state-kerala',
    label: 'Kerala (Western Highlands - 2 Nodes)',
    badge: '2 Nodes',
    description: 'Aluva Periyar Riverine Clinic & Wayanad High-Range Tribal Sub-Division (Demo)',
  },
  {
    id: 'state-assam',
    label: 'Assam (Northeast Brahmaputra - 1 Node)',
    badge: '1 Node',
    description: 'Jalukbari Brahmaputra Riverine Primary Care Outpost (Demo)',
  },
  {
    id: 'state-mp-or',
    label: 'Madhya Pradesh & Odisha (Central & Coast - 2 Nodes)',
    badge: '2 Nodes',
    description: 'Bhopal Sehore Agro-Post & Bhubaneswar Khurda Coastal Basin (Demo)',
  },
];

interface NavigationItemMeta {
  id: NavView;
  title: string;
  category: string;
}

const ALL_NAV_SECTIONS: NavigationItemMeta[] = [
  { id: 'command-centre', title: 'Command Centre', category: 'Operations' },
  { id: 'phc-network', title: 'PHC Network (18 Nodes)', category: 'Operations' },
  { id: 'phc-details', title: 'PHC Telemetry Details', category: 'Operations' },
  { id: 'medicines-inventory', title: 'Medicines & Inventory', category: 'Clinical & Logistics' },
  { id: 'patients-capacity', title: 'Patients & Bed Capacity', category: 'Clinical & Logistics' },
  { id: 'staff-availability', title: 'Staff Availability & Shifts', category: 'Clinical & Logistics' },
  { id: 'ai-demand-forecast', title: 'AI Demand Forecast (7-Day)', category: 'Intelligence' },
  { id: 'resource-optimizer', title: 'Resource Optimizer (Inter-PHC)', category: 'Intelligence' },
  { id: 'alerts', title: 'Early Warning Sentinel Alerts', category: 'Intelligence' },
  { id: 'emergency-simulator', title: 'Emergency Simulator (What-If)', category: 'Platform' },
  { id: 'brics-federated-ai', title: 'BRICS Federated AI Mesh', category: 'Platform' },
  { id: 'settings', title: 'Platform Settings & Node Config', category: 'Platform' },
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate = (_view?: NavView) => {},
  onToggleMobileMenu = () => {},
  alerts = [],
  phcs = [],
  medicines = [],
  onSelectPhc,
  onOpenAlertDetails,
  activeNation = 'IN',
  onChangeNation = (_nationCode?: string) => {},
  onSearchQuery,
  activeAlertsCount,
  selectedDistrict = 'all',
  onSelectDistrict,
  onSimulateSurge,
  onOpenAlerts,
  isMobileMenuOpen,
  selectedJurisdiction = 'Pune & Maharashtra Demo Grid (18 PHCs)',
  onSelectJurisdiction,
  language = 'en',
  onToggleLanguage,
  activePersona = 'dho',
  onSelectPersona,
}) => {
  const t = getTranslation(language);
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showJurisdictionDropdown, setShowJurisdictionDropdown] = useState<boolean>(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState<boolean>(false);
  const [currentJurisdiction, setCurrentJurisdiction] = useState<string>(selectedJurisdiction);
  const [searchVal, setSearchVal] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [nationNotification, setNationNotification] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const jurisdictionRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  const currentPersona = DEMO_PERSONAS.find((p) => p.id === activePersona) || DEMO_PERSONAS[0];

  useEffect(() => {
    setCurrentJurisdiction(selectedJurisdiction);
  }, [selectedJurisdiction]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeUtc(`${hours}:${mins}:${secs} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        jurisdictionRef.current &&
        !jurisdictionRef.current.contains(event.target as Node)
      ) {
        setShowJurisdictionDropdown(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        personaRef.current &&
        !personaRef.current.contains(event.target as Node)
      ) {
        setShowPersonaDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPersonaDropdown(false);
        setShowJurisdictionDropdown(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectPersona = (personaId: DemoPersonaId) => {
    if (onSelectPersona) {
      onSelectPersona(personaId);
    }
    setShowPersonaDropdown(false);
  };

  const bricsNations = [
    { code: 'IN', name: 'India', flag: '🇮🇳', subtitle: 'National Health Mission' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', subtitle: 'SUS Fiocruz Enclave' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', subtitle: 'Sechenov Health Mesh' },
    { code: 'CN', name: 'China', flag: '🇨🇳', subtitle: 'Tsinghua Clinical Lab' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', subtitle: 'Gauteng Health Telemetry' },
  ];

  const safeAlerts = alerts || [];
  const unreadAlerts = safeAlerts.filter((a) => !a.resolved);
  const criticalCount = safeAlerts.filter((a) => a.severity === 'critical' && !a.resolved).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (onSearchQuery) {
      onSearchQuery(val);
    }
  };

  const handleSelectJurisdiction = (option: JurisdictionOption) => {
    setCurrentJurisdiction(option.label);
    if (onSelectJurisdiction) {
      onSelectJurisdiction(option.label);
    }
    setShowJurisdictionDropdown(false);
  };

  const handleNationClick = (code: string) => {
    onChangeNation(code);
    const nation = bricsNations.find((n) => n.code === code);
    if (nation) {
      setNationNotification(
        `Switched node context: ${nation.name} ${nation.flag} (${nation.subtitle} • Demo Node)`
      );
      setTimeout(() => setNationNotification(null), 3500);
    }
  };

  // Compute search matches
  const query = searchVal.trim().toLowerCase();
  const hasQuery = query.length > 0;

  const matchingPhcs = hasQuery
    ? phcs
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.code.toLowerCase().includes(query) ||
            p.district.toLowerCase().includes(query)
        )
        .slice(0, 4)
    : [];

  const matchingMedicines = hasQuery
    ? medicines
        .filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.category.toLowerCase().includes(query)
        )
        .slice(0, 4)
    : [];

  const matchingAlerts = hasQuery
    ? safeAlerts
        .filter(
          (a) =>
            a.problem.toLowerCase().includes(query) ||
            a.phcName.toLowerCase().includes(query)
        )
        .slice(0, 3)
    : [];

  const matchingViews = hasQuery
    ? ALL_NAV_SECTIONS.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.category.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const totalResultsCount =
    matchingPhcs.length +
    matchingMedicines.length +
    matchingAlerts.length +
    matchingViews.length;

  const clearSearch = () => {
    setSearchVal('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    if (onSearchQuery) {
      onSearchQuery('');
    }
  };

  return (
    <header
      id="main-header"
      className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-4 flex items-center justify-between gap-3 z-30 shrink-0 sticky top-0"
    >
      {/* Country Switch Feedback Banner */}
      {nationNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2 rounded-xl shadow-lg border border-cyan-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Globe2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{nationNotification}</span>
        </div>
      )}

      {/* Left: Mobile trigger & Network Jurisdiction */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="mobile-menu-trigger"
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative" ref={jurisdictionRef}>
          <button
            id="jurisdiction-selector-btn"
            onClick={() => setShowJurisdictionDropdown(!showJurisdictionDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer text-left"
            title="Switch Demo Jurisdiction Network"
            aria-expanded={showJurisdictionDropdown}
          >
            <Building2 className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="hidden sm:inline text-slate-500 font-normal">{t.jurisdiction}:</span>
            <span className="font-bold text-slate-900 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-none">
              {currentJurisdiction}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                showJurisdictionDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Jurisdiction Popover Dropdown */}
          {showJurisdictionDropdown && (
            <div
              id="jurisdiction-dropdown-panel"
              className="absolute left-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.selectJurisdiction}
                </span>
                <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-semibold">
                  {t.demoDatasets}
                </span>
              </div>

              <div className="p-1 space-y-1">
                {JURISDICTION_OPTIONS.map((option) => {
                  const isSelected = currentJurisdiction === option.label;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectJurisdiction(option)}
                      className={`w-full p-2.5 rounded-lg text-left transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50/80 text-cyan-950 border border-cyan-200'
                          : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{option.label}</span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-500 rounded-b-xl flex items-center justify-between">
                <span>{t.privacyNotice}</span>
                <span className="font-mono text-emerald-600 font-semibold">{t.offlineVerified}</span>
              </div>
            </div>
          )}
        </div>

        {/* Resilience Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-emerald-800">Resilience: 82/100</span>
          <span className="text-[11px] text-emerald-600 font-medium">(1 Deficit)</span>
        </div>
      </div>

      {/* Middle: Desktop Search Box */}
      <div
        ref={searchContainerRef}
        className="hidden lg:flex items-center flex-1 max-w-md relative"
      >
        <button
          type="button"
          onClick={() => searchInputRef.current?.focus()}
          className="p-1 absolute left-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
          title="Focus Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <input
          ref={searchInputRef}
          id="global-search-input"
          type="text"
          value={searchVal}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
        />
        {searchVal && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Desktop Search Dropdown */}
        {isSearchFocused && hasQuery && (
          <div
            id="search-results-dropdown"
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 max-h-96 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>Search Results ({totalResultsCount})</span>
              <span className="font-mono text-[10px] text-slate-400">Esc to close</span>
            </div>

            {totalResultsCount === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching PHCs, medicines, alerts or sections found for &ldquo;{searchVal}&rdquo;.
              </div>
            ) : (
              <>
                {/* PHCs */}
                {matchingPhcs.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                      <Hospital className="w-3 h-3 text-cyan-600" />
                      Primary Health Centres
                    </div>
                    {matchingPhcs.map((phc) => (
                      <button
                        key={phc.id}
                        onClick={() => {
                          if (onSelectPhc) onSelectPhc(phc.id);
                          onNavigate('phc-details');
                          clearSearch();
                        }}
                        className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{phc.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {phc.code} • {phc.district}, {phc.state}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            phc.riskLevel === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : phc.riskLevel === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {phc.riskLevel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Medicines */}
                {matchingMedicines.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                      <Pill className="w-3 h-3 text-rose-600" />
                      Medicines & Supplies
                    </div>
                    {matchingMedicines.map((med) => (
                      <button
                        key={med.id}
                        onClick={() => {
                          onNavigate('medicines-inventory');
                          clearSearch();
                        }}
                        className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{med.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {med.category} • In-stock: {med.currentStock} {med.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold ${
                              med.stockoutRisk === 'critical'
                                ? 'text-rose-600'
                                : med.stockoutRisk === 'warning'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {med.daysOfStockRemaining}d left
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Alerts */}
                {matchingAlerts.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <BellRing className="w-3 h-3 text-amber-600" />
                      Active Alerts
                    </div>
                    {matchingAlerts.map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => {
                          if (onOpenAlertDetails) onOpenAlertDetails(alert);
                          else onNavigate('alerts');
                          clearSearch();
                        }}
                        className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{alert.phcName}</span>
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                              alert.severity === 'critical'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {alert.problem}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Navigation Sections */}
                {matchingViews.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-slate-400" />
                      Platform Views
                    </div>
                    {matchingViews.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          clearSearch();
                        }}
                        className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{item.title}</div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Operational Status, BRICS Switcher, Time, Notifications & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Icon Trigger */}
        <button
          onClick={() => {
            setIsMobileSearchOpen(!isMobileSearchOpen);
            setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
          }}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="Search telemetry"
          aria-label="Search telemetry"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Real-time Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeUtc || '14:30:00 UTC'}</span>
        </div>

        {/* BRICS Sovereign Nations Switcher */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-slate-200">
          {bricsNations.map((nat) => {
            const isSelected = activeNation === nat.code;
            return (
              <button
                key={nat.code}
                id={`brics-btn-${nat.code}`}
                onClick={() => handleNationClick(nat.code)}
                title={`${nat.name} Sovereign Node: ${nat.subtitle}`}
                className={`px-1 sm:px-1.5 py-0.5 text-xs rounded transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200 ring-1 ring-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className="text-xs">{nat.flag}</span>
                <span className="hidden xs:inline text-[10px] font-mono font-semibold">{nat.code}</span>
              </button>
            );
          })}
        </div>

        {/* Multilingual Switcher (English / हिन्दी) */}
        {onToggleLanguage && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              id="lang-btn-en"
              onClick={() => onToggleLanguage('en')}
              className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="English interface"
            >
              EN
            </button>
            <button
              id="lang-btn-hi"
              onClick={() => onToggleLanguage('hi')}
              className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="हिन्दी इंटरफ़ेस (Hindi)"
            >
              हिन्दी
            </button>
          </div>
        )}

        {/* Federated Sync Live Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-medium text-cyan-800">
          <Radio className="w-3 h-3 text-cyan-600 animate-pulse" />
          <span className="font-mono text-[10px]">{t.liveSyncActive}</span>
          <span className="text-[10px] text-cyan-600 font-mono font-bold">• 14ms</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="notifications-button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition-colors cursor-pointer"
            title={t.operationalAlerts}
            aria-label={t.operationalAlerts}
            aria-expanded={showNotifications}
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span
                className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
                  criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
                }`}
              >
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div
              id="notifications-dropdown-panel"
              className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">
                  {t.activeAlerts} ({unreadAlerts.length})
                </span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('alerts');
                  }}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {t.viewAllAlerts} <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {unreadAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    {t.noAlertsFound}
                  </div>
                ) : (
                  unreadAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (onOpenAlertDetails) onOpenAlertDetails(alert);
                        else onNavigate('alerts');
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900">{alert.phcName}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            alert.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{alert.problem}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>{t.timeRemainingAlert} {alert.timeRemaining}</span>
                        <span className="font-mono">{alert.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('resource-optimizer');
                  }}
                  className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {t.resourceOptimizer}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Demo Operational Persona Switcher */}
        <div className="relative pl-1 border-l border-slate-200" ref={personaRef}>
          <button
            type="button"
            onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:py-1.5 rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
              showPersonaDropdown
                ? 'bg-cyan-50/80 border-cyan-300 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
            }`}
            aria-expanded={showPersonaDropdown}
            aria-haspopup="listbox"
            aria-label={`Current operational demo persona: ${language === 'hi' ? currentPersona.titleHi : currentPersona.title}. Click to switch persona.`}
            title={language === 'hi' ? `डेमो व्यक्तित्व: ${currentPersona.titleHi}` : `Demo Persona: ${currentPersona.title}`}
          >
            {/* Persona Avatar / Icon */}
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 shadow-xs transition-colors ${
                currentPersona.id === 'phc-mo'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                  : currentPersona.id === 'scm'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                  : 'bg-cyan-100 text-cyan-800 border border-cyan-300/80'
              }`}
            >
              {currentPersona.icon}
            </div>

            {/* Persona Labels (Compact on small, Title on md/lg, Full on 2xl) */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline-block text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px] md:max-w-[160px] 2xl:max-w-[190px]">
                  {language === 'hi' ? currentPersona.titleHi : currentPersona.title}
                </span>
                <span className="sm:hidden text-xs font-bold text-slate-800 leading-tight">
                  {currentPersona.initials}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.2 bg-slate-100 text-slate-500 rounded border border-slate-200">
                  Demo
                </span>
              </div>
              <span className="hidden 2xl:inline-block text-[10px] text-slate-500 leading-tight truncate max-w-[190px]">
                {language === 'hi' ? currentPersona.nameHi : currentPersona.name}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                showPersonaDropdown ? 'rotate-180 text-cyan-600' : ''
              }`}
            />
          </button>

          {/* Persona Dropdown Popover */}
          {showPersonaDropdown && (
            <div
              className="absolute right-0 mt-1.5 w-76 sm:w-84 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150"
              role="listbox"
              aria-label="Select Demo Operational Persona"
            >
              {/* Popover Header */}
              <div className="px-3.5 py-2 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {language === 'hi' ? 'डेमो ऑपरेशनल व्यक्तित्व' : 'Demo Operational Persona'}
                  </span>
                  <span className="text-[10px] font-medium text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                    {DEMO_PERSONAS.length} {language === 'hi' ? 'भूमिकाएँ' : 'Roles'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {language === 'hi'
                    ? 'विभिन्न स्वास्थ्य परिचालन दृष्टिकोणों को प्रदर्शित करने के लिए स्विच करें'
                    : 'Switch perspective to preview operational context & priority metrics'}
                </p>
              </div>

              {/* Persona Options List */}
              <div className="py-1">
                {DEMO_PERSONAS.map((persona) => {
                  const isSelected = persona.id === activePersona;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectPersona(persona.id)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50/70 text-slate-900 border-l-2 border-cyan-600'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {/* Persona Icon Badge */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                          persona.id === 'phc-mo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : persona.id === 'scm'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}
                      >
                        {persona.icon}
                      </div>

                      {/* Info & Focus */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-cyan-950' : 'text-slate-800'}`}>
                            {language === 'hi' ? persona.titleHi : persona.title}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500">
                          {language === 'hi' ? persona.nameHi : persona.name}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug mt-1 line-clamp-2">
                          {language === 'hi' ? persona.focusHi : persona.focus}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer Notice */}
              <div className="px-3 py-1.5 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400">
                <span>{language === 'hi' ? 'डेमो संदर्भ मोड' : 'Demo Context Layer'}</span>
                <span className="font-mono text-[9px]">{language === 'hi' ? 'सक्रिय' : 'Active: ' + currentPersona.initials}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Expandable Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-x-0 top-0 h-16 bg-white px-3 flex items-center gap-2 z-50 border-b border-slate-200 shadow-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={mobileSearchInputRef}
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search PHCs, medicines, alerts..."
            className="flex-1 py-2 text-xs text-slate-900 bg-transparent focus:outline-none"
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal('')}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              setIsMobileSearchOpen(false);
              clearSearch();
            }}
            className="text-xs font-semibold text-cyan-700 px-2 py-1 cursor-pointer"
          >
            Cancel
          </button>

          {/* Mobile Search Results Dropdown */}
          {hasQuery && (
            <div className="absolute left-0 right-0 top-16 bg-white border-b border-slate-200 shadow-xl max-h-80 overflow-y-auto divide-y divide-slate-100 z-50">
              {totalResultsCount === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching records found.
                </div>
              ) : (
                <>
                  {matchingPhcs.map((phc) => (
                    <div
                      key={phc.id}
                      onClick={() => {
                        if (onSelectPhc) onSelectPhc(phc.id);
                        onNavigate('phc-details');
                        clearSearch();
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{phc.name}</div>
                        <div className="text-[10px] text-slate-500">{phc.district}</div>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-600">
                        {phc.riskLevel}
                      </span>
                    </div>
                  ))}

                  {matchingMedicines.map((med) => (
                    <div
                      key={med.id}
                      onClick={() => {
                        onNavigate('medicines-inventory');
                        clearSearch();
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{med.name}</div>
                        <div className="text-[10px] text-slate-500">{med.category}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-700">
                        {med.daysOfStockRemaining}d left
                      </span>
                    </div>
                  ))}

                  {matchingViews.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        clearSearch();
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
