import React from 'react';
import {
  Activity,
  Network,
  Hospital,
  Pill,
  Users,
  UserCheck,
  TrendingUp,
  Share2,
  BellRing,
  Globe2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LanguageCode, getTranslation } from '../../utils/i18n';

export type NavView =
  | 'command-centre'
  | 'phc-network'
  | 'phc-details'
  | 'medicines-inventory'
  | 'patients-capacity'
  | 'staff-availability'
  | 'ai-demand-forecast'
  | 'resource-optimizer'
  | 'alerts'
  | 'emergency-simulator'
  | 'brics-federated-ai'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView?: (view: NavView) => void;
  onNavigate?: (view: NavView) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  criticalAlertsCount: number;
  isOpen?: boolean;
  onClose?: () => void;
  language?: LanguageCode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  criticalAlertsCount,
  isOpen = false,
  onClose,
  language = 'en',
}) => {
  const t = getTranslation(language);

  const handleNav = (view: NavView) => {
    if (onSelectView) onSelectView(view);
    if (onNavigate) onNavigate(view);
    if (onClose) onClose();
  };

  const navItems: {
    id: NavView;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    section?: string;
  }[] = [
    {
      id: 'command-centre',
      label: t.commandCentre,
      icon: <Activity className="w-5 h-5 shrink-0" />,
      section: t.sectionOperations,
    },
    {
      id: 'phc-network',
      label: t.phcNetwork,
      icon: <Network className="w-5 h-5 shrink-0" />,
      badge: language === 'hi' ? '39 केंद्र' : '39 Nodes',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'phc-details',
      label: t.phcDetails,
      icon: <Hospital className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'medicines-inventory',
      label: t.medicinesInventory,
      icon: <Pill className="w-5 h-5 shrink-0" />,
      badge: language === 'hi' ? '1 जोखिम' : '1 Stockout Risk',
      badgeColor: 'bg-rose-100 text-rose-700 font-bold',
      section: t.sectionClinical,
    },
    {
      id: 'patients-capacity',
      label: t.patientsCapacity,
      icon: <Users className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'staff-availability',
      label: t.staffAvailability,
      icon: <UserCheck className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'ai-demand-forecast',
      label: t.aiDemandForecast,
      icon: <TrendingUp className="w-5 h-5 shrink-0" />,
      badge: language === 'hi' ? '7-दिवसीय' : '7-Day ML',
      badgeColor: 'bg-cyan-100 text-cyan-800',
      section: t.sectionIntelligence,
    },
    {
      id: 'resource-optimizer',
      label: t.resourceOptimizer,
      icon: <Share2 className="w-5 h-5 shrink-0" />,
      badge: language === 'hi' ? '1 सक्रिय' : '1 Active',
      badgeColor: 'bg-cyan-600 text-white font-semibold',
    },
    {
      id: 'alerts',
      label: t.alerts,
      icon: <BellRing className="w-5 h-5 shrink-0" />,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}` : undefined,
      badgeColor: 'bg-rose-600 text-white font-bold animate-pulse',
    },
    {
      id: 'emergency-simulator',
      label: t.emergencySimulator,
      icon: <Zap className="w-5 h-5 shrink-0" />,
      badge: language === 'hi' ? 'सैंडबॉक्स' : 'What-If',
      badgeColor: 'bg-amber-100 text-amber-800',
      section: t.sectionPlatform,
    },
    {
      id: 'brics-federated-ai',
      label: t.bricsFederatedAi,
      icon: <Globe2 className="w-5 h-5 shrink-0" />,
      badge: language === 'hi' ? '5 देश' : '5 Nations',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'settings',
      label: t.settings,
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        id="main-sidebar"
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shrink-0 select-none ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          isOpen
            ? 'fixed inset-y-0 left-0 z-50 shadow-2xl flex max-w-[85vw]'
            : 'hidden lg:flex'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div
            onClick={() => handleNav('command-centre')}
            className="flex items-center gap-3 overflow-hidden cursor-pointer group"
            title="MedPulse BRICS - Command Centre"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <span className="font-mono tracking-tighter">MP</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1">
                  MEDPULSE <span className="text-cyan-700 font-black">BRICS</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-600 truncate uppercase tracking-wider">
                  {language === 'hi' ? 'स्वास्थ्य एवं आपूर्ति मंच' : 'Health & Supply Platform'}
                </span>
              </div>
            )}
          </div>
          <button
            id="sidebar-toggle-btn"
            onClick={() => {
              if (isOpen && onClose) {
                onClose();
              } else if (onToggleCollapse) {
                onToggleCollapse();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
            title={isOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <React.Fragment key={item.id}>
                {item.section && !collapsed && (
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.section}
                  </div>
                )}
                <button
                  id={`nav-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all relative group cursor-pointer ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-900 shadow-xs border border-cyan-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div
                    className={`${
                      isActive ? 'text-cyan-700' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  >
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                        item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-600 rounded-r-full" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Resilience Indicator */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          {!collapsed ? (
            <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {t.gridResilience}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600">82 / 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  {language === 'hi' ? 'स्थिति: ' : 'Status: '}
                  <strong className="text-emerald-700 font-semibold">
                    {language === 'hi' ? 'स्थिर' : 'Stable'}
                  </strong>
                </span>
                <span>{language === 'hi' ? '1 कमी केंद्र' : '1 Deficit Node'}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-mono font-bold text-slate-600">82%</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
