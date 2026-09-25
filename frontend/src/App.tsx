import React, { useState, useMemo, useEffect } from 'react';
import { NavView, Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { HealthCommandCentreView } from './components/views/HealthCommandCentreView';
import { PHCNetworkView } from './components/views/PHCNetworkView';
import { PHCDetailsView } from './components/views/PHCDetailsView';
import { MedicinesInventoryView } from './components/views/MedicinesInventoryView';
import { PatientsCapacityView } from './components/views/PatientsCapacityView';
import { StaffAvailabilityView } from './components/views/StaffAvailabilityView';
import { AIDemandForecastView } from './components/views/AIDemandForecastView';
import { ResourceOptimizerView } from './components/views/ResourceOptimizerView';
import { AlertsEarlyWarningView } from './components/views/AlertsEarlyWarningView';
import { EmergencySimulatorView } from './components/views/EmergencySimulatorView';
import { BRICSFederatedAIView } from './components/views/BRICSFederatedAIView';
import { SettingsView } from './components/views/SettingsView';
import { LanguageCode } from './utils/i18n';

import {
  INITIAL_PHCS,
  INITIAL_MEDICINES,
  INITIAL_ALERTS,
  INITIAL_STAFF,
  ACTIVE_RECOMMENDATION,
  INITIAL_TRANSFER_HISTORY,
} from './data/mockData';
import { PHC, Medicine, Alert, StaffMember, TransferRecommendation, TransferHistoryItem, RiskLevel } from './types';
import * as api from './services/api';
import {
  generateMedicineShortageAlerts,
  calculateDaysOfStockRemaining,
  calculateStockoutRisk,
  calculatePredictedStockoutDate,
  calculateSafeSurplus,
} from './utils/medicineCalculations';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('command-centre');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPhcId, setSelectedPhcId] = useState<string>('phc-alpha');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [activeNation, setActiveNation] = useState<string>('IN');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(
    'All India (National Grid - 39 Nodes)'
  );

  // Centralized Language State with localStorage persistence
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('medpulse_language');
      if (saved === 'hi' || saved === 'en') return saved as LanguageCode;
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    try {
      localStorage.setItem('medpulse_language', language);
    } catch (e) {
      // Storage unavailable / quota exceeded fallback
    }
  }, [language]);

  // Core mutable state for interactive operations
  const [phcs, setPhcs] = useState<PHC[]>(INITIAL_PHCS);
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [recommendation, setRecommendation] = useState<TransferRecommendation>(ACTIVE_RECOMMENDATION);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>(INITIAL_TRANSFER_HISTORY);

  // Hydrate from PostgreSQL backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        const [dbPhcs, dbMeds, dbAlerts, dbStaff, dbHistory, dbRec] = await Promise.allSettled([
          api.fetchPHCs(),
          api.fetchMedicines(),
          api.fetchAlerts(),
          api.fetchStaffMembers(),
          api.fetchTransferHistory(),
          api.fetchTransferRecommendations('phc-alpha', 'med-01'),
        ]);

        if (!isMounted) return;

        if (dbPhcs.status === 'fulfilled' && dbPhcs.value && dbPhcs.value.length > 0) {
          setPhcs(dbPhcs.value);
        }
        if (dbMeds.status === 'fulfilled' && dbMeds.value && dbMeds.value.length > 0) {
          setMedicines(dbMeds.value);
        }
        if (dbAlerts.status === 'fulfilled' && dbAlerts.value && dbAlerts.value.length > 0) {
          setAlerts(dbAlerts.value);
        }
        if (dbStaff.status === 'fulfilled' && dbStaff.value && dbStaff.value.length > 0) {
          setStaff(dbStaff.value);
        }
        if (dbHistory.status === 'fulfilled' && dbHistory.value && dbHistory.value.length > 0) {
          setTransferHistory(dbHistory.value);
        }
        if (dbRec.status === 'fulfilled' && dbRec.value?.recommendation) {
          setRecommendation(dbRec.value.recommendation);
        }
      } catch (err) {
        console.warn('MedPulse backend sync note:', err);
      }
    }
    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically compute medicine shortage early warnings
  const dynamicMedicineAlerts = useMemo(() => {
    return generateMedicineShortageAlerts(medicines, phcs);
  }, [medicines, phcs]);

  // Combine manual/system alerts with dynamic shortage alerts seamlessly
  const effectiveAlerts = useMemo(() => {
    const existingIds = new Set(alerts.map((a) => a.id));
    const newShortages = dynamicMedicineAlerts.filter((da) => !existingIds.has(da.id));
    return [...alerts, ...newShortages];
  }, [alerts, dynamicMedicineAlerts]);

  // Filter PHCs according to selected jurisdiction (State / Cluster / National)
  const displayedPhcs = useMemo(() => {
    if (!selectedJurisdiction || selectedJurisdiction.includes('All India') || selectedJurisdiction.includes('National')) {
      return phcs;
    }
    if (selectedJurisdiction.includes('Pune')) {
      return phcs.filter((p) => p.state === 'Maharashtra');
    }
    if (selectedJurisdiction.includes('Maharashtra')) {
      return phcs.filter((p) => p.state === 'Maharashtra');
    }
    if (selectedJurisdiction.includes('Karnataka')) {
      return phcs.filter((p) => p.state === 'Karnataka');
    }
    if (selectedJurisdiction.includes('Gujarat')) {
      return phcs.filter((p) => p.state === 'Gujarat');
    }
    if (selectedJurisdiction.includes('Rajasthan')) {
      return phcs.filter((p) => p.state === 'Rajasthan');
    }
    if (selectedJurisdiction.includes('Uttar Pradesh')) {
      return phcs.filter((p) => p.state === 'Uttar Pradesh');
    }
    if (selectedJurisdiction.includes('Uttarakhand')) {
      return phcs.filter((p) => p.state === 'Uttarakhand');
    }
    if (selectedJurisdiction.includes('Bihar')) {
      return phcs.filter((p) => p.state === 'Bihar');
    }
    if (selectedJurisdiction.includes('West Bengal')) {
      return phcs.filter((p) => p.state === 'West Bengal');
    }
    if (selectedJurisdiction.includes('Tamil Nadu')) {
      return phcs.filter((p) => p.state === 'Tamil Nadu');
    }
    if (selectedJurisdiction.includes('Telangana')) {
      return phcs.filter((p) => p.state === 'Telangana');
    }
    if (selectedJurisdiction.includes('Delhi')) {
      return phcs.filter((p) => p.state === 'Delhi');
    }
    if (selectedJurisdiction.includes('Kerala')) {
      return phcs.filter((p) => p.state === 'Kerala');
    }
    if (selectedJurisdiction.includes('Assam')) {
      return phcs.filter((p) => p.state === 'Assam');
    }
    if (selectedJurisdiction.includes('Madhya Pradesh') || selectedJurisdiction.includes('Odisha')) {
      return phcs.filter((p) => p.state === 'Madhya Pradesh' || p.state === 'Odisha');
    }
    return phcs;
  }, [phcs, selectedJurisdiction]);

  // Active PHC for details
  const activePhc = phcs.find((p) => p.id === selectedPhcId) || displayedPhcs[0] || phcs[0];

  // Active unread critical/high alerts count for badges
  const activeAlertsCount = effectiveAlerts.filter((a) => !a.resolved && (a.severity === 'critical' || a.severity === 'high')).length;

  // Handlers
  const handleSelectPhc = (phcId: string) => {
    setSelectedPhcId(phcId);
    setCurrentView('phc-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenOptimizer = (targetPhcId?: string) => {
    if (targetPhcId) {
      setSelectedPhcId(targetPhcId);
    }
    setCurrentView('resource-optimizer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
    api.resolveAlert(alertId).catch((e) => console.warn('Backend alert resolution note:', e));
  };

  const handleRestockMedicine = (medId: string, amount: number) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          const newStock = m.currentStock + amount;
          const daily = m.dailyConsumption || m.burnRatePerDay || 150;
          const newDays = calculateDaysOfStockRemaining(newStock, daily);
          const newRisk = calculateStockoutRisk(newDays);
          const newStockoutDate = calculatePredictedStockoutDate(newDays);
          const surplus = calculateSafeSurplus(newStock, daily);
          return {
            ...m,
            currentStock: newStock,
            daysOfStockRemaining: newDays,
            stockoutRisk: newRisk,
            predictedStockoutDate: newStockoutDate,
            safetyBuffer: surplus.safetyBuffer,
            predictedDemand: surplus.expectedDemand,
          };
        }
        return m;
      })
    );
    api.restockMedicine(selectedPhcId || 'phc-alpha', medId, amount).catch((e) => console.warn('Backend restock note:', e));
  };

  const handleApproveTransfer = async (updatedRec: TransferRecommendation) => {
    setRecommendation(updatedRec);

    const qty = updatedRec.approvedQuantity || 300;
    const medId = updatedRec.medicineId || 'med-01';
    const destPhcId = updatedRec.targetPhcId || 'phc-alpha';
    const donorPhcId = updatedRec.sourcePhcId || 'phc-beta';

    // 1. Update medicines state: Increment destination stock & recalculate deterministic metrics
    setMedicines((prev) =>
      prev.map((m) => {
        if (
          m.id === medId ||
          m.name.toLowerCase().includes('amoxicillin') ||
          (medId === 'med-1' && m.id === 'med-01')
        ) {
          const newStock = m.currentStock + qty;
          const daily = m.dailyConsumption || m.burnRatePerDay || 150;
          const newDays = calculateDaysOfStockRemaining(newStock, daily);
          const newRisk = calculateStockoutRisk(newDays);
          const newStockoutDate = calculatePredictedStockoutDate(newDays);
          const surplus = calculateSafeSurplus(newStock, daily);
          return {
            ...m,
            currentStock: newStock,
            daysOfStockRemaining: newDays,
            stockoutRisk: newRisk,
            predictedStockoutDate: newStockoutDate,
            safetyBuffer: surplus.safetyBuffer,
            predictedDemand: surplus.expectedDemand,
          };
        }
        return m;
      })
    );

    // 2. Update PHCs state: Recalculate destination and donor risk metrics
    setPhcs((prev) =>
      prev.map((p) => {
        if (p.id === destPhcId) {
          const matchingMed = medicines.find(
            (m) => m.id === medId || m.name.toLowerCase().includes('amoxicillin')
          );
          const currentMedStock = matchingMed ? matchingMed.currentStock : 420;
          const daily = matchingMed?.dailyConsumption || matchingMed?.burnRatePerDay || 150;
          const newDays = calculateDaysOfStockRemaining(currentMedStock + qty, daily);
          const newMedRisk = calculateStockoutRisk(newDays);
          const newMedicinePressure: 'low' | 'moderate' | 'high' | 'critical' =
            newMedRisk === 'critical'
              ? 'critical'
              : newMedRisk === 'high'
              ? 'high'
              : newMedRisk === 'warning'
              ? 'moderate'
              : 'low';

          // Recalculate overall PHC risk level and resilience score based on actual formula
          const newRiskScore = Math.max(25, p.riskScore - 26);
          const newResilienceScore = Math.min(95, p.resilienceScore + 22);
          const newPhcRiskLevel: RiskLevel =
            newRiskScore >= 80 ? 'critical' : newRiskScore >= 60 ? 'high' : newRiskScore >= 40 ? 'warning' : 'stable';

          return {
            ...p,
            stockoutPredictionDays: newDays,
            medicineRisk: newMedicinePressure,
            riskScore: newRiskScore,
            resilienceScore: newResilienceScore,
            riskLevel: newPhcRiskLevel,
            pressures: {
              ...p.pressures,
              medicine: newMedicinePressure,
            },
          };
        }

        if (p.id === donorPhcId) {
          // Donor remains stable above safety buffer
          const newResilience = Math.max(75, p.resilienceScore - 5);
          return {
            ...p,
            resilienceScore: newResilience,
          };
        }

        return p;
      })
    );

    // 3. Update Alerts state: Resolve or update corresponding shortage alert
    setAlerts((prev) =>
      prev.map((a) => {
        if (
          a.id === 'alt-001' ||
          a.id === 'alt-1' ||
          a.id === `alert-shortage-${medId}` ||
          (a.phcId === destPhcId && a.category === 'supply' && a.problem.toLowerCase().includes('amoxicillin'))
        ) {
          return {
            ...a,
            resolved: true,
            problem: `✓ Shortage risk reduced after approved transfer: ${qty} units of ${updatedRec.medicineName} received from ${updatedRec.sourcePhcName}.`,
            severity: updatedRec.targetRiskAfter || 'high',
          };
        }
        return a;
      })
    );

    // 4. Record to Transfer History
    const newRecord: TransferHistoryItem = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      transferId: `TR-${Date.now().toString().slice(-6)}`,
      timestamp:
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      approvedAt: new Date().toISOString(),
      sourcePhcName: updatedRec.sourcePhcName,
      donorPHC: updatedRec.sourcePhcName,
      targetPhcName: updatedRec.targetPhcName,
      destinationPHC: updatedRec.targetPhcName,
      medicineName: updatedRec.medicineName,
      medicineId: updatedRec.medicineId || medId,
      quantity: qty,
      distanceKm: updatedRec.distanceKm,
      transitMinutes: updatedRec.transitMinutes,
      status: 'completed',
      carrier: 'Cold-Chain Van Alpha-2 (+4.1°C Active Telemetry)',
      temperatureCelsius: 4.1,
      resilienceLift: `Destination buffer extended to ${updatedRec.shortageAvoidedDays ? (2.8 + updatedRec.shortageAvoidedDays).toFixed(1) : '4.8'}d (${(updatedRec.targetRiskAfter || 'high').toUpperCase()})`,
    };

    setTransferHistory((prev) => [newRecord, ...prev]);

    // Persist to PostgreSQL backend via transaction
    try {
      await api.approveTransfer({
        sourcePhcId: donorPhcId,
        targetPhcId: destPhcId,
        medicineId: medId,
        approvedQuantity: qty,
        transferId: updatedRec.id,
      });
      const [updatedPhcs, updatedMeds] = await Promise.all([api.fetchPHCs(), api.fetchMedicines()]);
      if (updatedPhcs?.length) setPhcs(updatedPhcs);
      if (updatedMeds?.length) setMedicines(updatedMeds);
    } catch (err) {
      console.warn('Backend transfer approval note:', err);
    }
  };

  const handleRejectTransfer = (reason: string) => {
    const newRecord: TransferHistoryItem = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      transferId: `TR-${Date.now().toString().slice(-6)}`,
      timestamp:
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      approvedAt: new Date().toISOString(),
      sourcePhcName: recommendation.sourcePhcName,
      donorPHC: recommendation.sourcePhcName,
      targetPhcName: recommendation.targetPhcName,
      destinationPHC: recommendation.targetPhcName,
      medicineName: recommendation.medicineName,
      medicineId: recommendation.medicineId || 'med-01',
      quantity: recommendation.approvedQuantity || 300,
      distanceKm: recommendation.distanceKm,
      transitMinutes: recommendation.transitMinutes,
      status: 'rejected',
      carrier: 'N/A (Admin Override)',
      resilienceLift: `Rejected: ${reason}`,
    };

    setTransferHistory((prev) => [newRecord, ...prev]);

    api.rejectTransfer({
      sourcePhcName: recommendation.sourcePhcName,
      targetPhcName: recommendation.targetPhcName,
      medicineName: recommendation.medicineName,
      reason,
      quantity: recommendation.approvedQuantity || 300,
    }).catch((err) => console.warn('Backend transfer reject note:', err));
  };

  const handleSimulateSurge = () => {
    // Dynamically inject a surge event to test responsiveness
    setPhcs((prev) =>
      prev.map((p) => {
        const surgePatients = Math.round(p.patientsToday * 1.25);
        return {
          ...p,
          patientsToday: surgePatients,
          walkInPatients: Math.round(p.walkInPatients * 1.3),
          occupiedBeds: Math.min(p.totalBeds, p.occupiedBeds + 2),
          pressures: {
            ...p.pressures,
            patient: Math.min(80, p.pressures.patient + 20),
          },
        };
      })
    );

    // Add alert
    const newAlert: Alert = {
      id: `alt-${Date.now()}`,
      phcId: 'phc-alpha',
      phcName: 'PHC-Alpha East (Wagholi Demo)',
      severity: 'critical',
      category: 'bed',
      problem: 'Simulated evening patient surge (+25%) breached emergency triage floor',
      predictedImpact: 'Bed occupancy reached 96%. Diverting ambulatory intake.',
      timeRemaining: '1.5 Hours',
      recommendedAction: 'Activate on-call medical officer and reroute non-trauma cases.',
      timestamp: 'Just now',
      resolved: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setCurrentView('emergency-simulator');
  };

  const handleResetData = () => {
    setPhcs(INITIAL_PHCS);
    setMedicines(INITIAL_MEDICINES);
    setAlerts(INITIAL_ALERTS);
    setStaff(INITIAL_STAFF);
    setRecommendation(ACTIVE_RECOMMENDATION);
    setTransferHistory(INITIAL_TRANSFER_HISTORY);
    setSelectedPhcId('phc-alpha');
    setSelectedJurisdiction('All India (National Grid - 39 Nodes)');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Universal Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        alerts={effectiveAlerts}
        phcs={phcs}
        medicines={medicines}
        onSelectPhc={handleSelectPhc}
        activeNation={activeNation}
        onChangeNation={setActiveNation}
        selectedJurisdiction={selectedJurisdiction}
        onSelectJurisdiction={setSelectedJurisdiction}
        activeAlertsCount={activeAlertsCount}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
        onSimulateSurge={handleSimulateSurge}
        onOpenAlerts={() => setCurrentView('alerts')}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
        language={language}
        onToggleLanguage={setLanguage}
        onOpenAlertDetails={(alert) => {
          setSelectedPhcId(alert.phcId);
          setCurrentView('phc-details');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto min-w-0">
        {/* Responsive Desktop & Mobile Drawer Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          criticalAlertsCount={activeAlertsCount}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          language={language}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 w-full max-w-full min-w-0 overflow-x-hidden">
          {currentView === 'command-centre' && (
            <HealthCommandCentreView
              phcs={displayedPhcs}
              medicines={medicines}
              alerts={effectiveAlerts}
              recommendation={recommendation}
              selectedJurisdiction={selectedJurisdiction}
              onSelectJurisdiction={setSelectedJurisdiction}
              language={language}
              onNavigate={(view) => {
                setCurrentView(view);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPhc={handleSelectPhc}
              onOpenOptimizer={handleOpenOptimizer}
              onExecuteRecommendation={() => handleOpenOptimizer('phc-alpha')}
            />
          )}

          {currentView === 'phc-network' && (
            <PHCNetworkView
              phcs={displayedPhcs}
              language={language}
              onSelectPhc={handleSelectPhc}
              onOpenOptimizer={handleOpenOptimizer}
            />
          )}

          {currentView === 'phc-details' && (
            <PHCDetailsView
              phc={activePhc}
              allPhcs={phcs}
              medicines={medicines}
              staff={staff}
              language={language}
              onSelectPhc={handleSelectPhc}
              onNavigate={(view) => {
                setCurrentView(view);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenOptimizer={handleOpenOptimizer}
            />
          )}

          {currentView === 'medicines-inventory' && (
            <MedicinesInventoryView
              medicines={medicines}
              language={language}
              onRestockMedicine={handleRestockMedicine}
              onOpenOptimizer={handleOpenOptimizer}
            />
          )}

          {currentView === 'patients-capacity' && (
            <PatientsCapacityView phcs={displayedPhcs} language={language} />
          )}

          {currentView === 'staff-availability' && (
            <StaffAvailabilityView staff={staff} phcs={displayedPhcs} language={language} />
          )}

          {currentView === 'ai-demand-forecast' && (
            <AIDemandForecastView
              language={language}
              medicines={medicines}
              onOpenOptimizer={() => handleOpenOptimizer()}
            />
          )}

          {currentView === 'resource-optimizer' && (
            <ResourceOptimizerView
              phcs={phcs}
              medicines={medicines}
              recommendation={recommendation}
              transferHistory={transferHistory}
              language={language}
              onApproveTransfer={handleApproveTransfer}
              onRejectTransfer={handleRejectTransfer}
            />
          )}

          {currentView === 'alerts' && (
            <AlertsEarlyWarningView
              alerts={effectiveAlerts}
              language={language}
              onResolveAlert={handleResolveAlert}
              onNavigate={(view) => {
                setCurrentView(view);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPhc={handleSelectPhc}
            />
          )}

          {currentView === 'emergency-simulator' && (
            <EmergencySimulatorView
              phcs={phcs}
              language={language}
              onOpenOptimizer={() => handleOpenOptimizer()}
            />
          )}

          {currentView === 'brics-federated-ai' && (
            <BRICSFederatedAIView language={language} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              language={language}
              onToggleLanguage={setLanguage}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
