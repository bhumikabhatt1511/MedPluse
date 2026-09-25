/**
 * MedPulse BRICS — Centralized Multilingual Dictionary (English & हिन्दी)
 * 100% Local, Deterministic & Offline-Verified Translations.
 */

import { PHC, RiskLevel } from '../types';

export type LanguageCode = 'en' | 'hi';

export interface Translations {
  // App brand & header
  appName: string;
  tagline: string;
  motto: string;
  syntheticDataNotice: string;
  searchPlaceholder: string;
  jurisdiction: string;
  selectJurisdiction: string;
  demoDatasets: string;
  privacyNotice: string;
  offlineVerified: string;
  activeNations: string;
  liveSyncActive: string;
  operationalAlerts: string;
  viewAllAlerts: string;
  noAlertsFound: string;
  searchResults: string;
  noSearchResults: string;
  resilienceScore: string;
  gridResilience: string;
  readAloud: string;
  stopAudio: string;

  // Sidebar navigation & categories
  commandCentre: string;
  phcNetwork: string;
  phcDetails: string;
  medicinesInventory: string;
  patientsCapacity: string;
  staffAvailability: string;
  aiDemandForecast: string;
  resourceOptimizer: string;
  alerts: string;
  emergencySimulator: string;
  bricsFederatedAi: string;
  settings: string;
  sectionOperations: string;
  sectionClinical: string;
  sectionIntelligence: string;
  sectionPlatform: string;
  abdmCompliant: string;

  // Command Centre
  activePhcs: string;
  patientsToday: string;
  criticalStockouts: string;
  bedOccupancy: string;
  doctorsOnDuty: string;
  emergencyCases: string;
  gridTelemetryTitle: string;
  gridTelemetrySubtitle: string;
  viewGridTable: string;
  networkRiskDistTitle: string;
  criticalDeficitNodes: string;
  warningNodes: string;
  stableCenters: string;
  earlyWarningFeed: string;
  activeAlerts: string;
  preemptiveNotice: string;
  actionReady: string;
  aiGuardrailValidated: string;
  interPhcSupplyTransfer: string;
  targetShortageNotice: string;
  donorSurplusNotice: string;
  reviewOptimizationPlan: string;
  authorizeTransfer: string;
  federatedQuorumStatus: string;
  federatedQuorumSub: string;
  checkMedicines: string;
  sevenDayForecast: string;

  // Map Controls & Filters
  mapFilter: string;
  mapFilterAll: string;
  mapFilterCritical: string;
  mapFilterWarning: string;
  mapFilterStable: string;
  mapFilterHigh: string;
  mapActionAllIndia: string;
  mapActionPuneCluster: string;
  mapActionCorridors: string;
  mapActionCorridorsOff: string;
  mapActionLocate: string;
  mapPatientsToday: string;
  mapBedAvailable: string;
  mapDoctorsRoster: string;
  mapMedicineRisk: string;
  mapViewDetails: string;
  mapOpenOptimizer: string;
  mapCorridorTitle: string;
  mapCorridorFrom: string;
  mapCorridorTo: string;
  mapCorridorDistance: string;
  mapLegendTitle: string;
  mapLegendStable: string;
  mapLegendWarning: string;
  mapLegendHighRisk: string;
  mapLegendCritical: string;
  mapGridTitle: string;
  mapActiveCenters: string;
  mapPuneMenuTitle: string;
  mapAllPunePhcs: string;
  mapPuneAlphaEast: string;
  mapPuneBetaSouth: string;
  mapPuneGammaMetro: string;
  mapPuneDeltaNorth: string;
  mapPuneEpsilonFoothills: string;

  // PHC Network View
  phcDirectoryTitle: string;
  phcDirectorySubtitle: string;
  searchPhcPlaceholder: string;
  filterAllStates: string;
  filterAllRisks: string;
  sortByRisk: string;
  sortByPatients: string;
  sortByBeds: string;
  sortByStockout: string;
  tableColPhc: string;
  tableColDistrict: string;
  tableColRisk: string;
  tableColPatients: string;
  tableColBeds: string;
  tableColDoctors: string;
  tableColMedicine: string;
  tableColAction: string;
  viewTelemetryBtn: string;
  noPhcFound: string;

  // PHC Details View
  facilityIntelligenceTitle: string;
  facilityIntelligenceSubtitle: string;
  resilienceIndex: string;
  emergencyTriageFloor: string;
  icuBedsTitle: string;
  clinicalStaffPresent: string;
  stockoutForecastTitle: string;
  daysRemaining: string;
  sevenDayBurnRate: string;
  dispatchReliefVan: string;
  aiDiagnosticTitle: string;
  generateDiagnosticBtn: string;
  diagnosticGenerating: string;
  staffOnDutyTitle: string;
  inventoryBreakdownTitle: string;

  // Medicines Inventory View
  medicinesInventoryTitle: string;
  medicinesInventorySubtitle: string;
  searchMedicinesPlaceholder: string;
  filterAllCategories: string;
  colDrugName: string;
  colCategory: string;
  colCurrentStock: string;
  colBurnRate: string;
  colDaysRemaining: string;
  colStockoutRisk: string;
  colExpiryStatus: string;
  colAction: string;
  btnRestock: string;
  btnReallocate: string;
  restockModalTitle: string;
  restockModalSubtitle: string;
  restockQuantity: string;
  confirmRestockBtn: string;
  cancelBtn: string;

  // Patients & Capacity View
  patientsCapacityTitle: string;
  patientsCapacitySubtitle: string;
  totalAdmittedToday: string;
  underTreatmentTitle: string;
  recoveringTitle: string;
  dischargedTitle: string;
  emergencyBedsTitle: string;
  bedBreakdownTitle: string;
  hourlyTriageTitle: string;

  // Staff Availability View
  staffRosterTitle: string;
  staffRosterSubtitle: string;
  searchStaffPlaceholder: string;
  filterAllRoles: string;
  filterAllShifts: string;
  colStaffName: string;
  colRole: string;
  colPhcFacility: string;
  colShift: string;
  colDutyStatus: string;
  colPatientsSeen: string;
  requestCoverBtn: string;
  doctorPatientRatioTitle: string;

  // AI Demand Forecast View
  demandForecastTitle: string;
  demandForecastSubtitle: string;
  forecastScenarioBaseline: string;
  forecastScenarioMonsoon: string;
  forecastScenarioEpidemic: string;
  intervenedStockCurve: string;
  unintervenedStockCurve: string;
  projectedDepletionDate: string;
  confidenceIntervalBand: string;
  geminiExplainerTitle: string;

  // Resource Optimizer View
  optimizerTitle: string;
  optimizerSubtitle: string;
  candidateDonorsTitle: string;
  targetDeficitTitle: string;
  donorResilienceGuardrail: string;
  transitRouteTitle: string;
  safeSurplusAvailable: string;
  approveTransferModalTitle: string;
  dispatchConsignmentBtn: string;
  rejectionReasonPlaceholder: string;
  transferHistoryTitle: string;
  approveTransfer: string;
  rejectTransfer: string;
  recommendedDonor: string;
  safeSurplus: string;
  transferQuantity: string;
  whyThisDonor: string;
  transferHistory: string;
  statusCompleted: string;
  statusRejected: string;
  transferBlocked: string;
  donorStatusSafe: string;

  // Early Warning Alerts View
  earlyWarningTitle: string;
  earlyWarningSubtitle: string;
  filterAllSeverities: string;
  filterAllCategoriesAlert: string;
  resolveAlertBtn: string;
  alertResolvedBadge: string;
  timeRemainingAlert: string;

  // Emergency Simulator View
  simulatorTitle: string;
  simulatorSubtitle: string;
  scenarioPresetViral: string;
  scenarioPresetDisaster: string;
  scenarioPresetHeatwave: string;
  scenarioPresetMassCasualty: string;
  surgeMultiplierTitle: string;
  stockDepletionMultiplier: string;
  staffStrainFactor: string;
  executeSimulationBtn: string;
  resetSimulationBtn: string;
  simulationActiveNotice: string;

  // BRICS Federated AI View
  bricsFederatedTitle: string;
  bricsFederatedSubtitle: string;
  enclaveQuorumTitle: string;
  modelVersionTitle: string;
  lossMetricTitle: string;
  weightHashVerification: string;
  triggerSyncBtn: string;
  syncInProgress: string;
  privacyComplianceTitle: string;

  // Platform Settings View
  settingsTitle: string;
  settingsSubtitle: string;
  languageSelectTitle: string;
  languageSelectSub: string;
  audioTelemetryTitle: string;
  audioTelemetrySub: string;
  geminiKeyTitle: string;
  geminiKeySub: string;
  saveKeyBtn: string;
  testConnectionBtn: string;
  resetSyntheticDataTitle: string;
  resetSyntheticDataSub: string;
  resetDataBtn: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    // App brand & header
    appName: 'MedPulse BRICS',
    tagline: 'AI-Powered Predictive Health & Supply Chain Resilience Platform',
    motto: 'PREDICT → ALERT → ACT',
    syntheticDataNotice: 'Demo / Synthetic Data • National Health Mission Protocol Standard',
    searchPlaceholder: 'Search PHCs, medicines (e.g. Amoxicillin), alerts, sections...',
    jurisdiction: 'Jurisdiction',
    selectJurisdiction: 'Select Sovereign Telemetry Grid',
    demoDatasets: 'Demo Datasets',
    privacyNotice: 'Privacy: Zero external API calls',
    offlineVerified: 'Offline Verified',
    activeNations: 'BRICS Nodes',
    liveSyncActive: 'FEDERATED: ACTIVE',
    operationalAlerts: 'Operational Alerts',
    viewAllAlerts: 'View All Alerts',
    noAlertsFound: 'Zero active critical alerts.',
    searchResults: 'Search Results',
    noSearchResults: 'No matching items found.',
    resilienceScore: 'Grid Resilience Score',
    gridResilience: 'Grid Resilience',
    readAloud: 'Read Aloud',
    stopAudio: 'Stop Audio',

    // Sidebar navigation & categories
    commandCentre: 'Command Centre',
    phcNetwork: 'PHC Network',
    phcDetails: 'PHC Telemetry Details',
    medicinesInventory: 'Medicines & Inventory',
    patientsCapacity: 'Patients & Bed Capacity',
    staffAvailability: 'Staff Availability & Shifts',
    aiDemandForecast: 'AI Demand Forecast',
    resourceOptimizer: 'Resource Optimizer',
    alerts: 'Early Warning Sentinel Alerts',
    emergencySimulator: 'Emergency Simulator',
    bricsFederatedAi: 'BRICS Federated AI Mesh',
    settings: 'Platform Settings',
    sectionOperations: 'OPERATIONS',
    sectionClinical: 'CLINICAL & LOGISTICS',
    sectionIntelligence: 'INTELLIGENCE & ACTIONS',
    sectionPlatform: 'SOVEREIGN PLATFORM',
    abdmCompliant: 'DPDP & ABDM Compliant',

    // Command Centre
    activePhcs: 'Active PHCs',
    patientsToday: 'Patients Today',
    criticalStockouts: 'Critical Stockouts',
    bedOccupancy: 'Bed Occupancy',
    doctorsOnDuty: 'Doctors on Duty',
    emergencyCases: 'Emergency Cases',
    gridTelemetryTitle: 'Primary Health Centre Network Telemetry',
    gridTelemetrySubtitle: 'Live geospatial status across centers in selected jurisdiction',
    viewGridTable: 'View Grid Table',
    networkRiskDistTitle: 'Network Risk Distribution',
    criticalDeficitNodes: 'Critical Deficit Nodes',
    warningNodes: 'Warning Nodes',
    stableCenters: 'Stable Centers',
    earlyWarningFeed: 'Early Warning Feed',
    activeAlerts: 'Active Alerts',
    preemptiveNotice: 'Preemptive alerts generated by deterministic edge risk engine',
    actionReady: 'Action Ready',
    aiGuardrailValidated: 'AI Guardrail Validated Action',
    interPhcSupplyTransfer: 'Inter-PHC Supply Transfer',
    targetShortageNotice: 'Target facility facing acute stock depletion.',
    donorSurplusNotice: 'Donor retains safe resilience and reserve buffer floor.',
    reviewOptimizationPlan: 'Review Optimization Plan',
    authorizeTransfer: 'Authorize Inter-PHC Transfer',
    federatedQuorumStatus: 'Federated Health Quorum: Synchronized',
    federatedQuorumSub: 'Privacy-Preserving Edge Models • Round #1,280 • 5 Sovereign Enclaves Active',
    checkMedicines: 'Check Medicines',
    sevenDayForecast: '7-Day Forecast',

    // Map Controls & Filters
    mapFilter: 'Filter:',
    mapFilterAll: 'All',
    mapFilterCritical: 'Critical',
    mapFilterWarning: 'Warning',
    mapFilterStable: 'Stable',
    mapFilterHigh: 'High Risk',
    mapActionAllIndia: '🇮🇳 All India',
    mapActionPuneCluster: '📍 Pune Cluster',
    mapActionCorridors: 'Corridors',
    mapActionCorridorsOff: 'Corridors Off',
    mapActionLocate: 'Locate',
    mapPatientsToday: 'Patients Today',
    mapBedAvailable: 'Bed Available',
    mapDoctorsRoster: 'Doctors Roster',
    mapMedicineRisk: 'Medicine Risk',
    mapViewDetails: 'View Full PHC Telemetry',
    mapOpenOptimizer: 'Open AI Resource Optimizer',
    mapCorridorTitle: 'Active Reallocation Corridor: SH-64 / Hadapsar',
    mapCorridorFrom: 'From',
    mapCorridorTo: 'To',
    mapCorridorDistance: 'Distance: 28.4 km • Transit: 42 min (Cold-Chain)',
    mapLegendTitle: 'Marker Legend:',
    mapLegendStable: 'Stable (0–39)',
    mapLegendWarning: 'Warning (40–59)',
    mapLegendHighRisk: 'High Risk (60–79)',
    mapLegendCritical: 'Critical (80–100)',
    mapGridTitle: 'National PHC Telemetry Grid',
    mapActiveCenters: 'Active Centers Displayed',
    mapPuneMenuTitle: 'Pune Cluster Sub-Division',
    mapAllPunePhcs: 'All Pune PHCs',
    mapPuneAlphaEast: 'PHC-Alpha East — Wagholi',
    mapPuneBetaSouth: 'PHC-Beta South — Saswad',
    mapPuneGammaMetro: 'PHC-Gamma Metro — Bhosari',
    mapPuneDeltaNorth: 'PHC-Delta North — Chakan',
    mapPuneEpsilonFoothills: 'PHC-Epsilon Foothills — Paud',

    // PHC Network View
    phcDirectoryTitle: 'Primary Health Centre (PHC) Directory',
    phcDirectorySubtitle: 'Live telemetry across regional primary health networks',
    searchPhcPlaceholder: 'Search PHC name, code, or district...',
    filterAllStates: 'All States / UTs',
    filterAllRisks: 'All Risk Levels',
    sortByRisk: 'Sort by Risk Score',
    sortByPatients: 'Sort by Patient Volume',
    sortByBeds: 'Sort by Available Beds',
    sortByStockout: 'Sort by Stockout Days',
    tableColPhc: 'PHC Facility',
    tableColDistrict: 'District & State',
    tableColRisk: 'Risk Status',
    tableColPatients: 'Patients Today',
    tableColBeds: 'Beds Available',
    tableColDoctors: 'Doctors on Duty',
    tableColMedicine: 'Medicine Risk',
    tableColAction: 'Action',
    viewTelemetryBtn: 'View Telemetry',
    noPhcFound: 'No primary health centers match the selected filter criteria.',

    // PHC Details View
    facilityIntelligenceTitle: 'Real-Time Facility Intelligence & Clinical Telemetry',
    facilityIntelligenceSubtitle: 'Live sensor telemetry, pharmacy burn rates & shift rosters',
    resilienceIndex: 'Resilience Index',
    emergencyTriageFloor: 'Emergency Triage Floor',
    icuBedsTitle: 'ICU & Critical Beds',
    clinicalStaffPresent: 'Clinical Staff Present',
    stockoutForecastTitle: 'Medicine Stockout Forecast',
    daysRemaining: 'Days Remaining',
    sevenDayBurnRate: '7-Day Burn Rate',
    dispatchReliefVan: 'Dispatch Relief Van',
    aiDiagnosticTitle: 'AI Clinical Copilot & Diagnostic Analysis',
    generateDiagnosticBtn: 'Generate AI Clinical Analysis',
    diagnosticGenerating: 'Synthesizing clinical signals with Gemini...',
    staffOnDutyTitle: 'Active Duty Shift Roster',
    inventoryBreakdownTitle: 'Essential Pharmacy Inventory & Cold-Chain',

    // Medicines Inventory View
    medicinesInventoryTitle: 'Essential Medicines & Inventory Stockpile',
    medicinesInventorySubtitle: 'Live tracking of emergency pharmacy supplies, cold-chain status & stockout risks',
    searchMedicinesPlaceholder: 'Search drug name, therapeutic category, dosage...',
    filterAllCategories: 'All Categories',
    colDrugName: 'Medicine / Drug Name',
    colCategory: 'Therapeutic Category',
    colCurrentStock: 'Current Stock',
    colBurnRate: '24h Burn Rate',
    colDaysRemaining: 'Days Remaining',
    colStockoutRisk: 'Stockout Risk',
    colExpiryStatus: 'Expiry Horizon',
    colAction: 'Action',
    btnRestock: 'Restock Buffer',
    btnReallocate: 'Inter-PHC Transfer',
    restockModalTitle: 'Emergency Restock Buffer Intake',
    restockModalSubtitle: 'Log inbound supply consignment from Central Warehouse',
    restockQuantity: 'Restock Quantity (Units):',
    confirmRestockBtn: 'Confirm Intake',
    cancelBtn: 'Cancel',

    // Patients & Capacity View
    patientsCapacityTitle: 'Patient Inflow, Admissions & Bed Capacity',
    patientsCapacitySubtitle: 'Real-time ambulatory load, triage distribution & bed occupancy analytics',
    totalAdmittedToday: 'Admitted Today',
    underTreatmentTitle: 'Under Treatment',
    recoveringTitle: 'Recovering & Observation',
    dischargedTitle: 'Discharged Today',
    emergencyBedsTitle: 'Emergency Beds',
    bedBreakdownTitle: 'Bed Utilization & Occupancy Breakdown',
    hourlyTriageTitle: 'Hourly Inflow & Ambulatory Triage Trend',

    // Staff Availability View
    staffRosterTitle: 'Medical Officer & Clinical Staff Roster',
    staffRosterSubtitle: 'Shift management, on-call doctor coverage & clinical attendance verification',
    searchStaffPlaceholder: 'Search doctor, nurse, specialist, or facility name...',
    filterAllRoles: 'All Clinical Roles',
    filterAllShifts: 'All Shifts',
    colStaffName: 'Staff Member',
    colRole: 'Designation / Role',
    colPhcFacility: 'Assigned PHC Facility',
    colShift: 'Duty Shift',
    colDutyStatus: 'Status',
    colPatientsSeen: 'Patients Seen',
    requestCoverBtn: 'Broadcast Relief Request',
    doctorPatientRatioTitle: 'Doctor-to-Patient Ratio',

    // AI Demand Forecast View
    demandForecastTitle: 'AI Demand Forecast & Stockout Prediction (7-Day)',
    demandForecastSubtitle: 'Predictive epidemiological surge modeling & stock depletion trajectory',
    forecastScenarioBaseline: 'Baseline Seasonal',
    forecastScenarioMonsoon: 'Monsoon Spike (+25%)',
    forecastScenarioEpidemic: 'Epidemic Surge (+45%)',
    intervenedStockCurve: 'Intervened Stock Level (with Safe Transfer)',
    unintervenedStockCurve: 'Unintervened Projected Stock Depletion',
    projectedDepletionDate: 'Zero-Stock Inflexion Point',
    confidenceIntervalBand: '95% Bayesian Confidence Interval',
    geminiExplainerTitle: 'Gemini Epidemiological Surge Analysis',

    // Resource Optimizer View
    optimizerTitle: 'AI Resource Optimizer (Inter-PHC Redistribution)',
    optimizerSubtitle: 'Zero-risk donor evaluation preserving minimum 75% resilience guardrails',
    candidateDonorsTitle: 'Candidate Donor Facilities Evaluation',
    targetDeficitTitle: 'Target Deficit Node',
    donorResilienceGuardrail: 'Donor Resilience Guardrail',
    transitRouteTitle: 'Transit Route & Logistics',
    safeSurplusAvailable: 'Safe Surplus Available',
    approveTransferModalTitle: 'Authorize Inter-PHC Redistribution Consignment',
    dispatchConsignmentBtn: 'Authorize & Dispatch Transfer',
    rejectionReasonPlaceholder: 'State reason for manual override or rejection...',
    transferHistoryTitle: 'Recent Inter-PHC Reallocation Audit Log',
    approveTransfer: 'Approve Transfer',
    rejectTransfer: 'Reject',
    recommendedDonor: 'Recommended Donor',
    safeSurplus: 'Safe Surplus',
    transferQuantity: 'Transfer Quantity',
    whyThisDonor: 'Why This Donor?',
    transferHistory: 'Transfer History',
    statusCompleted: 'Completed',
    statusRejected: 'Rejected',
    transferBlocked: 'Transfer Blocked',
    donorStatusSafe: 'SAFE',

    // Early Warning Alerts View
    earlyWarningTitle: 'Early Warning Sentinel Alerts',
    earlyWarningSubtitle: 'Deterministic threshold alerts and multi-vector anomaly detection',
    filterAllSeverities: 'All Severities',
    filterAllCategoriesAlert: 'All Categories',
    resolveAlertBtn: 'Mark Resolved',
    alertResolvedBadge: 'Resolved',
    timeRemainingAlert: 'Time Remaining:',

    // Emergency Simulator View
    simulatorTitle: 'Emergency Stress Simulator (What-If Sandbox)',
    simulatorSubtitle: 'Test network resilience under simulated disasters, epidemics & mass-casualty surges',
    scenarioPresetViral: 'Seasonal Viral Outbreak (+25% Load)',
    scenarioPresetDisaster: 'Flooding / Landslide Disaster (+50% Load)',
    scenarioPresetHeatwave: 'Heatwave Dehydration Surge (+30% Load)',
    scenarioPresetMassCasualty: 'Highway Mass Casualty Event (+60% Triage)',
    surgeMultiplierTitle: 'Inflow Surge Multiplier',
    stockDepletionMultiplier: 'Medicine Consumption Surge',
    staffStrainFactor: 'Staffing Strain / Absence',
    executeSimulationBtn: 'Inject Simulated Surge Event',
    resetSimulationBtn: 'Reset to Live Baseline',
    simulationActiveNotice: 'Simulation Active: Live values modified for stress testing.',

    // BRICS Federated AI View
    bricsFederatedTitle: 'BRICS Federated AI Clinical Mesh',
    bricsFederatedSubtitle: 'Cross-border privacy-preserving edge machine learning without raw data export',
    enclaveQuorumTitle: 'Sovereign Enclave Quorum Status',
    modelVersionTitle: 'Global Model Iteration',
    lossMetricTitle: 'Convergence Loss',
    weightHashVerification: 'Cryptographic Weight Hash',
    triggerSyncBtn: 'Trigger Federated Consensus Round',
    syncInProgress: 'Synchronizing sovereign gradient weights...',
    privacyComplianceTitle: 'DPDP, LGPD & POPIA Sovereign Data Vaults',

    // Platform Settings View
    settingsTitle: 'Platform Settings & Node Configuration',
    settingsSubtitle: 'Manage multilingual preferences, speech telemetry, offline storage & AI keys',
    languageSelectTitle: 'Application Language (भाषा)',
    languageSelectSub: 'Switch between English and हिन्दी (Hindi)',
    audioTelemetryTitle: 'Audio Telemetry & Voice Readout',
    audioTelemetrySub: 'Enable synthetic speech synthesis for hands-free clinical triage',
    geminiKeyTitle: 'Google Gemini API Key Integration',
    geminiKeySub: 'Powers AI explanations, demand diagnostics, and emergency simulation reasoning',
    saveKeyBtn: 'Save API Key',
    testConnectionBtn: 'Test Gemini Connection',
    resetSyntheticDataTitle: 'Reset Demo Data to Initial State',
    resetSyntheticDataSub: 'Restores all synthetic PHCs, medicines, alerts, and stock values',
    resetDataBtn: 'Reset All Demo Data',
  },
  hi: {
    // App brand & header
    appName: 'मेडपल्स ब्रिक्स (MedPulse BRICS)',
    tagline: 'एआई-संचालित स्वास्थ्य एवं आपूर्ति-श्रृंखला प्रत्यास्थता मंच',
    motto: 'पूर्वानुमान (PREDICT) → चेतावनी (ALERT) → कार्रवाई (ACT)',
    syntheticDataNotice: 'डेमो / सिंथेटिक डेटा • राष्ट्रीय स्वास्थ्य मिशन मानक',
    searchPlaceholder: 'पीएचसी, दवाइयाँ (उदा. एमोक्सिसिलिन), अलर्ट, सेक्शन खोजें...',
    jurisdiction: 'अधिकार क्षेत्र',
    selectJurisdiction: 'सॉवरेन टेलीमेट्री ग्रिड चुनें',
    demoDatasets: 'डेमो डेटासेट',
    privacyNotice: 'गोपनीयता: शून्य बाहरी एपीआई कॉल',
    offlineVerified: 'ऑफ़लाइन सत्यापित',
    activeNations: 'ब्रिक्स नोड्स',
    liveSyncActive: 'फेडरेटेड: सक्रिय',
    operationalAlerts: 'संचालन संबंधी अलर्ट',
    viewAllAlerts: 'सभी अलर्ट देखें',
    noAlertsFound: 'कोई सक्रिय गंभीर अलर्ट नहीं है।',
    searchResults: 'खोज परिणाम',
    noSearchResults: 'कोई परिणाम नहीं मिला।',
    resilienceScore: 'नेटवर्क प्रत्यास्थता स्कोर',
    gridResilience: 'ग्रिड प्रत्यास्थता',
    readAloud: 'आवाज़ में सुनें',
    stopAudio: 'आवाज़ रोकें',

    // Sidebar navigation & categories
    commandCentre: 'कमांड सेंटर',
    phcNetwork: 'PHC नेटवर्क',
    phcDetails: 'पीएचसी विवरण एवं टेलीमेट्री',
    medicinesInventory: 'दवाइयाँ एवं इन्वेंट्री',
    patientsCapacity: 'मरीज़ एवं बेड क्षमता',
    staffAvailability: 'स्टाफ व चिकित्सक उपलब्धता',
    aiDemandForecast: 'AI माँग पूर्वानुमान',
    resourceOptimizer: 'संसाधन अनुकूलक',
    alerts: 'प्रारंभिक चेतावनी अलर्ट',
    emergencySimulator: 'आपातकालीन सिम्युलेटर',
    bricsFederatedAi: 'ब्रिक्स फेडरेटेड AI',
    settings: 'प्लेटफ़ॉर्म सेटिंग्स',
    sectionOperations: 'संचालन (OPERATIONS)',
    sectionClinical: 'क्लिनिकल एवं लॉजिस्टिक्स',
    sectionIntelligence: 'इंटेलिजेंस एवं कार्यवाई',
    sectionPlatform: 'सॉवरेन प्लेटफ़ॉर्म',
    abdmCompliant: 'DPDP एवं ABDM अनुपालन',

    // Command Centre
    activePhcs: 'सक्रिय पीएचसी केंद्र',
    patientsToday: 'आज के मरीज़',
    criticalStockouts: 'गंभीर दवा कमी',
    bedOccupancy: 'बेड अधिभोग दर',
    doctorsOnDuty: 'ड्यूटी पर डॉक्टर',
    emergencyCases: 'आपातकालीन मामले',
    gridTelemetryTitle: 'प्राथमिक स्वास्थ्य केंद्र नेटवर्क टेलीमेट्री',
    gridTelemetrySubtitle: 'चयनित अधिकार क्षेत्र में लाइव भू-स्थानिक स्थिति',
    viewGridTable: 'ग्रिड तालिका देखें',
    networkRiskDistTitle: 'नेटवर्क जोखिम वितरण',
    criticalDeficitNodes: 'गंभीर कमी वाले केंद्र',
    warningNodes: 'चेतावनी केंद्र',
    stableCenters: 'स्थिर सुरक्षित केंद्र',
    earlyWarningFeed: 'प्रारंभिक चेतावनी अलर्ट फीड',
    activeAlerts: 'सक्रिय अलर्ट',
    preemptiveNotice: 'लोकल रिस्क इंजन द्वारा उत्पन्न प्रारंभिक चेतावनी',
    actionReady: 'कार्रवाई तैयार',
    aiGuardrailValidated: 'AI सुरक्षा गार्डरेल द्वारा सत्यापित कार्यवाई',
    interPhcSupplyTransfer: 'इंटर-पीएचसी दवा पुनर्वितरण',
    targetShortageNotice: 'लक्षित पीएचसी में तीव्र दवा संकट का पूर्वानुमान।',
    donorSurplusNotice: 'दाता केंद्र 75%+ सुरक्षा बफर के साथ आपूर्ति प्रदान करता है।',
    reviewOptimizationPlan: 'अनुकूलन योजना की समीक्षा करें',
    authorizeTransfer: 'हस्तांतरण स्वीकृत करें',
    federatedQuorumStatus: 'फेडरेटेड स्वास्थ्य कोरम स्थिति: सिंक्रनाइज़्ड',
    federatedQuorumSub: 'गोपनीयता-संरक्षित एज मॉडल • राउंड #1,280 • 5 सॉवरेन एन्क्लेव सक्रिय',
    checkMedicines: 'दवाइयाँ देखें',
    sevenDayForecast: '7-दिवसीय पूर्वानुमान',

    // Map Controls & Filters
    mapFilter: 'फ़िल्टर:',
    mapFilterAll: 'सभी',
    mapFilterCritical: 'गंभीर',
    mapFilterWarning: 'चेतावनी',
    mapFilterStable: 'स्थिर',
    mapFilterHigh: 'उच्च जोखिम',
    mapActionAllIndia: '🇮🇳 संपूर्ण भारत',
    mapActionPuneCluster: '📍 पुणे क्लस्टर',
    mapActionCorridors: 'कॉरिडोर',
    mapActionCorridorsOff: 'कॉरिडोर बंद',
    mapActionLocate: 'स्थान',
    mapPatientsToday: 'आज के मरीज़',
    mapBedAvailable: 'उपलब्ध बेड',
    mapDoctorsRoster: 'ड्यूटी डॉक्टर',
    mapMedicineRisk: 'दवा जोखिम',
    mapViewDetails: 'संपूर्ण पीएचसी टेलीमेट्री देखें',
    mapOpenOptimizer: 'AI संसाधन अनुकूलक खोलें',
    mapCorridorTitle: 'सक्रिय पुनर्वितरण कॉरिडोर: एसएच-64 / हड़पसर',
    mapCorridorFrom: 'स्रोत केंद्र',
    mapCorridorTo: 'गंतव्य केंद्र',
    mapCorridorDistance: 'दूरी: 28.4 किमी • पारगमन: 42 मिनट (कोल्ड-चेन)',
    mapLegendTitle: 'मार्कर संकेत सूची:',
    mapLegendStable: 'स्थिर (0–39)',
    mapLegendWarning: 'चेतावनी (40–59)',
    mapLegendHighRisk: 'उच्च जोखिम (60–79)',
    mapLegendCritical: 'गंभीर (80–100)',
    mapGridTitle: 'राष्ट्रीय पीएचसी टेलीमेट्री ग्रिड',
    mapActiveCenters: 'सक्रिय केंद्र प्रदर्शित',
    mapPuneMenuTitle: 'पुणे क्लस्टर उप-प्रभाग',
    mapAllPunePhcs: 'सभी पुणे PHC',
    mapPuneAlphaEast: 'PHC-Alpha East — वाघोली',
    mapPuneBetaSouth: 'PHC-Beta South — सासवड',
    mapPuneGammaMetro: 'PHC-Gamma Metro — भोसरी',
    mapPuneDeltaNorth: 'PHC-Delta North — चाकण',
    mapPuneEpsilonFoothills: 'PHC-Epsilon Foothills — पौड',

    // PHC Network View
    phcDirectoryTitle: 'प्राथमिक स्वास्थ्य केंद्र (PHC) निर्देशिका',
    phcDirectorySubtitle: 'राष्ट्रीय प्राथमिक स्वास्थ्य नेटवर्क की लाइव क्षमता व लॉजिस्टिक्स',
    searchPhcPlaceholder: 'पीएचसी नाम, कोड या जिला खोजें...',
    filterAllStates: 'सभी राज्य / केंद्र शासित प्रदेश',
    filterAllRisks: 'सभी जोखिम स्तर',
    sortByRisk: 'जोखिम स्कोर अनुसार',
    sortByPatients: 'मरीज़ संख्या अनुसार',
    sortByBeds: 'उपलब्ध बेड अनुसार',
    sortByStockout: 'स्टॉकआउट दिनों अनुसार',
    tableColPhc: 'पीएचसी केंद्र',
    tableColDistrict: 'जिला एवं राज्य',
    tableColRisk: 'जोखिम स्तर',
    tableColPatients: 'आज के मरीज़',
    tableColBeds: 'उपलब्ध बेड',
    tableColDoctors: 'ड्यूटी डॉक्टर',
    tableColMedicine: 'दवा जोखिम',
    tableColAction: 'कार्रवाई',
    viewTelemetryBtn: 'टेलीमेट्री देखें',
    noPhcFound: 'फ़िल्टर के अनुसार कोई प्राथमिक स्वास्थ्य केंद्र नहीं मिला।',

    // PHC Details View
    facilityIntelligenceTitle: 'रियल-टाइम पीएचसी क्लिनिकल एवं सप्लाई टेलीमेट्री',
    facilityIntelligenceSubtitle: 'लाइव सेंसर डेटा, फार्मेसी बर्न रेट व ड्यूटी रोस्टर',
    resilienceIndex: 'प्रत्यास्थता सूचकांक',
    emergencyTriageFloor: 'आपातकालीन ट्राइएज क्षमता',
    icuBedsTitle: 'आईसीयू एवं क्रिटिकल बेड',
    clinicalStaffPresent: 'उपस्थित क्लिनिकल स्टाफ',
    stockoutForecastTitle: 'दवा स्टॉकआउट पूर्वानुमान',
    daysRemaining: 'शेष दिन',
    sevenDayBurnRate: '7-दिवसीय खपत दर',
    dispatchReliefVan: 'राहत वैन रवाना करें',
    aiDiagnosticTitle: 'AI क्लिनिकल विश्लेषण एवं सह-पायलट',
    generateDiagnosticBtn: 'AI क्लिनिकल विश्लेषण जनरेट करें',
    diagnosticGenerating: 'जेमिनी द्वारा क्लिनिकल डेटा का विश्लेषण जारी...',
    staffOnDutyTitle: 'सक्रिय ड्यूटी शिफ्ट रोस्टर',
    inventoryBreakdownTitle: 'आवश्यक फार्मेसी इन्वेंट्री एवं कोल्ड-चेन',

    // Medicines Inventory View
    medicinesInventoryTitle: 'आवश्यक दवाइयाँ एवं इन्वेंट्री स्टॉकपाइल',
    medicinesInventorySubtitle: 'आपातकालीन दवा आपूर्ति, कोल्ड-चेन स्थिति और स्टॉकआउट जोखिम का लाइव प्रबंधन',
    searchMedicinesPlaceholder: 'दवा का नाम, श्रेणी, खुराक खोजें...',
    filterAllCategories: 'सभी श्रेणियाँ',
    colDrugName: 'दवा का नाम एवं खुराक',
    colCategory: 'चिकित्सीय श्रेणी',
    colCurrentStock: 'वर्तमान स्टॉक',
    colBurnRate: '24-घंटे की खपत',
    colDaysRemaining: 'शेष दिन',
    colStockoutRisk: 'स्टॉकआउट जोखिम',
    colExpiryStatus: 'समाप्ति स्थिति',
    colAction: 'कार्रवाई',
    btnRestock: 'रीस्टॉक बफर',
    btnReallocate: 'इंटर-पीएचसी ट्रांसफर',
    restockModalTitle: 'आपातकालीन रीस्टॉक बफर इनटेक',
    restockModalSubtitle: 'केंद्रीय डिपो से प्राप्त नई खेप को इन्वेंट्री में दर्ज करें',
    restockQuantity: 'रीस्टॉक मात्रा (इकाइयाँ):',
    confirmRestockBtn: 'इनटेक स्वीकृत करें',
    cancelBtn: 'रद्द करें',

    // Patients & Capacity View
    patientsCapacityTitle: 'मरीज़ प्रवाह, प्रवेश एवं बेड क्षमता',
    patientsCapacitySubtitle: 'रियल-टाइम ओपीडी लोड, ट्राइएज वितरण एवं बेड उपयोगिता विश्लेषण',
    totalAdmittedToday: 'आज भर्ती मरीज़',
    underTreatmentTitle: 'उपचाराधीन मरीज़',
    recoveringTitle: 'निगरानी एवं रिकवरी',
    dischargedTitle: 'आज डिस्चार्ज किए गए',
    emergencyBedsTitle: 'आपातकालीन बेड',
    bedBreakdownTitle: 'बेड उपयोगिता एवं अधिभोग विवरण',
    hourlyTriageTitle: 'प्रति घंटा मरीज़ प्रवाह एवं ट्राइएज प्रवृत्ति',

    // Staff Availability View
    staffRosterTitle: 'चिकित्सा अधिकारी एवं स्टाफ रोस्टर',
    staffRosterSubtitle: 'ड्यूटी प्रबंधन, ऑन-कॉल बैकअप एवं क्लिनिकल उपस्थिति सत्यापन',
    searchStaffPlaceholder: 'डॉक्टर, नर्स, विशेषज्ञ या केंद्र का नाम खोजें...',
    filterAllRoles: 'सभी क्लिनिकल पद',
    filterAllShifts: 'सभी शिफ्ट',
    colStaffName: 'स्टाफ सदस्य',
    colRole: 'पद / विशेषज्ञता',
    colPhcFacility: 'तैनात पीएचसी केंद्र',
    colShift: 'ड्यूटी शिफ्ट',
    colDutyStatus: 'स्थिति',
    colPatientsSeen: 'देखे गए मरीज़',
    requestCoverBtn: 'राहत ड्यूटी अनुरोध भेजें',
    doctorPatientRatioTitle: 'डॉक्टर-मरीज़ अनुपात',

    // AI Demand Forecast View
    demandForecastTitle: 'AI माँग पूर्वानुमान एवं स्टॉकआउट भविष्यवाणी (7-दिवसीय)',
    demandForecastSubtitle: 'महामारी संबंधी उछाल व दवा खपत का भविष्यसूचक मॉडल',
    forecastScenarioBaseline: 'सामान्य मौसमी स्तर',
    forecastScenarioMonsoon: 'मानसून मौसमी उछाल (+25%)',
    forecastScenarioEpidemic: 'महामारी जनित उछाल (+45%)',
    intervenedStockCurve: 'हस्तांतरण उपरांत अनुमानित सुरक्षित स्टॉक',
    unintervenedStockCurve: 'हस्तांतरण रहित स्टॉक गिरावट वक्र',
    projectedDepletionDate: 'शून्य-स्टॉक संकट बिंदु',
    confidenceIntervalBand: '95% बायेसियन विश्वसनीयता अंतराल',
    geminiExplainerTitle: 'जेमिनी महामारी विशेषज्ञीय अंतर्दृष्टि',

    // Resource Optimizer View
    optimizerTitle: 'AI संसाधन अनुकूलक (इंटर-पीएचसी पुनर्वितरण)',
    optimizerSubtitle: '75%+ सुरक्षित प्रत्यास्थता गार्डरेल के साथ स्वतः दाता मूल्यांकन',
    candidateDonorsTitle: 'उपयुक्त दाता केंद्रों का मूल्यांकन',
    targetDeficitTitle: 'लक्षित कमी केंद्र',
    donorResilienceGuardrail: 'दाता प्रत्यास्थता गार्डरेल',
    transitRouteTitle: 'परिवहन मार्ग एवं लॉजिस्टिक्स',
    safeSurplusAvailable: 'उपलब्ध सुरक्षित अधिशेष',
    approveTransferModalTitle: 'इंटर-पीएचसी पुनर्वितरण खेप को अधिकृत करें',
    dispatchConsignmentBtn: 'स्वीकृत करें व वैन रवाना करें',
    rejectionReasonPlaceholder: 'मैन्युअल अस्वीकृति या कारण दर्ज करें...',
    transferHistoryTitle: 'हालिया इंटर-पीएचसी पुनर्वितरण ऑडिट लॉग',
    approveTransfer: 'हस्तांतरण स्वीकृत करें',
    rejectTransfer: 'अस्वीकार करें',
    recommendedDonor: 'अनुशंसित दाता केंद्र',
    safeSurplus: 'सुरक्षित अधिशेष',
    transferQuantity: 'हस्तांतरण मात्रा',
    whyThisDonor: 'यही दाता केंद्र क्यों?',
    transferHistory: 'हस्तांतरण इतिहास',
    statusCompleted: 'पूर्ण',
    statusRejected: 'अस्वीकृत',
    transferBlocked: 'हस्तांतरण अवरुद्ध',
    donorStatusSafe: 'सुरक्षित',

    // Early Warning Alerts View
    earlyWarningTitle: 'प्रारंभिक चेतावनी एवं सेंटिनल अलर्ट',
    earlyWarningSubtitle: 'स्वचालित थ्रेशोल्ड निगरानी एवं मल्टी-वेक्टर विसंगति चेतावनी',
    filterAllSeverities: 'सभी गंभीरता स्तर',
    filterAllCategoriesAlert: 'सभी श्रेणियाँ',
    resolveAlertBtn: 'निस्तारित चिह्नित करें',
    alertResolvedBadge: 'निस्तारित',
    timeRemainingAlert: 'शेष समय सीमा:',

    // Emergency Simulator View
    simulatorTitle: 'आपातकालीन स्ट्रेस सिम्युलेटर (What-If सैंडबॉक्स)',
    simulatorSubtitle: 'आपदा, महामारी व आपातकालीन उछाल में नेटवर्क प्रत्यास्थता का परीक्षण करें',
    scenarioPresetViral: 'मौसमी वायरल प्रकोप (+25% मरीज़)',
    scenarioPresetDisaster: 'बाढ़ / भूस्खलन आपदा (+50% मरीज़)',
    scenarioPresetHeatwave: 'लू / डिहाइड्रेशन लहर (+30% मरीज़)',
    scenarioPresetMassCasualty: 'हाइवे दुर्घटना आपातकाल (+60% ट्राइएज)',
    surgeMultiplierTitle: 'मरीज़ प्रवाह उछाल गुणक',
    stockDepletionMultiplier: 'दवा खपत उछाल गुणक',
    staffStrainFactor: 'स्टाफ अनुपलब्धता कारक',
    executeSimulationBtn: 'सिम्युलेटेड आपातकाल लागू करें',
    resetSimulationBtn: 'लाइव बेसलाइन पर रीसेट करें',
    simulationActiveNotice: 'सिम्युलेशन सक्रिय: परीक्षण हेतु डेटा अस्थायी रूप से संशोधित है।',

    // BRICS Federated AI View
    bricsFederatedTitle: 'ब्रिक्स फेडरेटेड AI क्लिनिकल मेश',
    bricsFederatedSubtitle: 'सीमा-पार गोपनीयता-संरक्षित एज लर्निंग (बिना मूल डेटा साझा किए)',
    enclaveQuorumTitle: 'सॉवरेन एन्क्लेव कोरम स्थिति',
    modelVersionTitle: 'वैश्विक मॉडल पुनरावृत्ति',
    lossMetricTitle: 'अभिसरण लॉस मीट्रिक',
    weightHashVerification: 'क्रिप्टोग्राफ़िक वेट हैश',
    triggerSyncBtn: 'फेडरेटेड आम सहमति राउंड शुरू करें',
    syncInProgress: 'सॉवरेन ग्रेडिएंट भार सिंक्रनाइज़ हो रहे हैं...',
    privacyComplianceTitle: 'DPDP, LGPD एवं POPIA सॉवरेन डेटा वॉल्ट',

    // Platform Settings View
    settingsTitle: 'प्लेटफ़ॉर्म सेटिंग्स एवं नोड कॉन्फ़िगरेशन',
    settingsSubtitle: 'भाषा विकल्प, वॉइस टेलीमेट्री, ऑफ़लाइन स्टोरेज व AI कुंजियों का प्रबंधन',
    languageSelectTitle: 'एप्लिकेशन भाषा (Language)',
    languageSelectSub: 'English और हिन्दी के मध्य स्विच करें',
    audioTelemetryTitle: 'ऑडियो टेलीमेट्री एवं वॉइस आउटपुट',
    audioTelemetrySub: 'हाथ-मुक्त क्लिनिकल ट्राइएज हेतु सिंथेटिक वॉइस आउटपुट',
    geminiKeyTitle: 'Google Gemini API कुंजी एकीकरण',
    geminiKeySub: 'AI स्पष्टीकरण, माँग निदान और आपातकालीन सिमुलेशन हेतु',
    saveKeyBtn: 'API कुंजी सुरक्षित करें',
    testConnectionBtn: 'जेमिनी कनेक्शन जांचें',
    resetSyntheticDataTitle: 'डेमो डेटा को प्रारंभिक स्थिति पर रीसेट करें',
    resetSyntheticDataSub: 'सभी सिंथेटिक पीएचसी, दवाइयों, अलर्ट और स्टॉक को पुनर्स्थापित करें',
    resetDataBtn: 'सभी डेमो डेटा रीसेट करें',
  },
};

export function getTranslation(lang: LanguageCode = 'en'): Translations {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

export interface LocalizedPHCInfo {
  name: string;
  district: string;
  state: string;
}

export const PHC_LOCALIZATIONS: Record<string, { hi: LocalizedPHCInfo }> = {
  'phc-alpha': {
    hi: {
      name: 'पीएचसी-अल्फा पूर्व (वाघोली डेमो)',
      district: 'पुणे पूर्व / हवेली उप-प्रभाग',
      state: 'महाराष्ट्र',
    },
  },
  'phc-beta': {
    hi: {
      name: 'पीएचसी-बीटा दक्षिण (सासवड डेमो)',
      district: 'पुरंदर / सासवड बेसिन',
      state: 'महाराष्ट्र',
    },
  },
  'phc-gamma': {
    hi: {
      name: 'पीएचसी-गामा मेट्रो (भोसरी डेमो)',
      district: 'पिंपरी-चिंचवड़ मेट्रो',
      state: 'महाराष्ट्र',
    },
  },
  'phc-delta': {
    hi: {
      name: 'पीएचसी-डेल्टा उत्तर (चाकण डेमो)',
      district: 'खेड / चाकण कॉरिडोर',
      state: 'महाराष्ट्र',
    },
  },
  'phc-epsilon': {
    hi: {
      name: 'पीएचसी-एप्सिलॉन फुटहिल्स (पौड डेमो)',
      district: 'मुळशी घाटी / पौड',
      state: 'महाराष्ट्र',
    },
  },
  'phc-ka-01': {
    hi: {
      name: 'पीएचसी-देवनाहल्ली ग्रामीण (डेमो)',
      district: 'बेंगलुरु ग्रामीण उप-प्रभाग',
      state: 'कर्नाटक',
    },
  },
  'phc-ka-02': {
    hi: {
      name: 'पीएचसी-नेलमंगला हाईवे (डेमो)',
      district: 'बेंगलुरु उत्तर-पश्चिम कॉरिडोर',
      state: 'कर्नाटक',
    },
  },
  'phc-ka-03': {
    hi: {
      name: 'पीएचसी-रामनगर सिल्क बेसिन (डेमो)',
      district: 'रामनगर उप-प्रभाग',
      state: 'कर्नाटक',
    },
  },
  'phc-ka-04': {
    hi: {
      name: 'पीएचसी-हुबली जंक्शन पोस्ट (डेमो)',
      district: 'धारवाड़ उत्तर कॉरिडोर',
      state: 'कर्नाटक',
    },
  },
  'phc-gj-01': {
    hi: {
      name: 'पीएचसी-साणंद औद्योगिक (डेमो)',
      district: 'अहमदाबाद ग्रामीण बेसिन',
      state: 'गुजरात',
    },
  },
  'phc-gj-02': {
    hi: {
      name: 'पीएचसी-गांधीनगर ट्राइबल फ्रिंज (डेमो)',
      district: 'गांधीनगर उत्तर सेक्टर',
      state: 'गुजरात',
    },
  },
  'phc-gj-03': {
    hi: {
      name: 'पीएचसी-सूरत कोस्टल डेल्टा (डेमो)',
      district: 'सूरत शहरी परिधि',
      state: 'गुजरात',
    },
  },
  'phc-rj-01': {
    hi: {
      name: 'पीएचसी-सांगानेर ग्रामीण स्वास्थ्य (डेमो)',
      district: 'जयपुर ग्रामीण सेक्टर',
      state: 'राजस्थान',
    },
  },
  'phc-rj-02': {
    hi: {
      name: 'पीएचसी-जोधपुर डेजर्ट बेसिन (डेमो)',
      district: 'जोधपुर थार बेसिन',
      state: 'राजस्थान',
    },
  },
  'phc-rj-03': {
    hi: {
      name: 'पीएचसी-आमेर रिज आउटपोस्ट (डेमो)',
      district: 'जयपुर उत्तर अरावली रेंज',
      state: 'राजस्थान',
    },
  },
  'phc-up-01': {
    hi: {
      name: 'पीएचसी-वाराणसी घाट स्वास्थ्य केंद्र (डेमो)',
      district: 'काशी ग्रामीण बेल्ट',
      state: 'उत्तर प्रदेश',
    },
  },
  'phc-up-02': {
    hi: {
      name: 'पीएचसी-लखनऊ परिधीय (डेमो)',
      district: 'मोहनलालगंज एग्रो-बेल्ट',
      state: 'उत्तर प्रदेश',
    },
  },
  'phc-up-03': {
    hi: {
      name: 'पीएचसी-गोरखपुर तराई चौकी (डेमो)',
      district: 'गोरखपुर उत्तर बेसिन',
      state: 'उत्तर प्रदेश',
    },
  },
  'phc-up-04': {
    hi: {
      name: 'पीएचसी-कानपुर देहात ग्रामीण (डेमो)',
      district: 'कानपुर ग्रामीण उप-प्रभाग',
      state: 'उत्तर प्रदेश',
    },
  },
  'phc-br-01': {
    hi: {
      name: 'पीएचसी-दानापुर छावनी (डेमो)',
      district: 'पटना पश्चिम बेसिन',
      state: 'बिहार',
    },
  },
  'phc-br-02': {
    hi: {
      name: 'पीएचसी-फुलवारी शरीफ (डेमो)',
      district: 'पटना दक्षिण कॉरिडोर',
      state: 'बिहार',
    },
  },
  'phc-br-03': {
    hi: {
      name: 'पीएचसी-गया बोधगया तीर्थ हब (डेमो)',
      district: 'गया फाल्गु नदी कॉरिडोर',
      state: 'बिहार',
    },
  },
  'phc-wb-01': {
    hi: {
      name: 'पीएचसी-राजारहाट पेरी-अर्बन (डेमो)',
      district: 'उत्तर 24 परगना कॉरिडोर',
      state: 'पश्चिम बंगाल',
    },
  },
  'phc-wb-02': {
    hi: {
      name: 'पीएचसी-बारुईपुर कोस्टल रीच (डेमो)',
      district: 'दक्षिण 24 परगना डेल्टा',
      state: 'पश्चिम बंगाल',
    },
  },
  'phc-wb-03': {
    hi: {
      name: 'पीएचसी-सिलीगुड़ी फुटहिल्स चौकी (डेमो)',
      district: 'दार्जिलिंग तराई फ्रिंज',
      state: 'पश्चिम बंगाल',
    },
  },
  'phc-tn-01': {
    hi: {
      name: 'पीएचसी-श्रीपेरंबुदूर औद्योगिक (डेमो)',
      district: 'कांचीपुरम उत्तर बेल्ट',
      state: 'तमिलनाडु',
    },
  },
  'phc-tn-02': {
    hi: {
      name: 'पीएचसी-मदुरै ग्रामीण कृषि केंद्र (डेमो)',
      district: 'मदुरै वैगई बेसिन',
      state: 'तमिलनाडु',
    },
  },
  'phc-tn-03': {
    hi: {
      name: 'पीएचसी-कोयंबटूर फुटहिल्स (डेमो)',
      district: 'कोयंबटूर पश्चिम घाट',
      state: 'तमिलनाडु',
    },
  },
  'phc-ts-01': {
    hi: {
      name: 'पीएचसी-मेडचल इंडस्ट्रियल रिंग (डेमो)',
      district: 'हैदराबाद उत्तर उप-प्रभाग',
      state: 'तेलंगाना',
    },
  },
  'phc-ts-02': {
    hi: {
      name: 'पीएचसी-वारंगल हेरिटेज हेल्थ (डेमो)',
      district: 'वारंगल ग्रामीण उप-प्रभाग',
      state: 'तेलंगाना',
    },
  },
  'phc-dl-01': {
    hi: {
      name: 'पीएचसी-नजफगढ़ प्रशिक्षण केंद्र (डेमो)',
      district: 'दक्षिण-पश्चिम दिल्ली ग्रामीण बेल्ट',
      state: 'दिल्ली',
    },
  },
  'phc-kl-01': {
    hi: {
      name: 'पीएचसी-अलुवा पेरियार क्लिनिक (डेमो)',
      district: 'एर्नाकुलम नदीय कॉरिडोर',
      state: 'केरल',
    },
  },
  'phc-kl-02': {
    hi: {
      name: 'पीएचसी-वायनाड हाई-रेंज (डेमो)',
      district: 'वायनाड पहाड़ी जनजातीय उप-प्रभाग',
      state: 'केरल',
    },
  },
  'phc-as-01': {
    hi: {
      name: 'पीएचसी-जालुकबारी ब्रह्मपुत्र (डेमो)',
      district: 'कामरूप मेट्रो नदीय चौकी',
      state: 'असम',
    },
  },
  'phc-mp-01': {
    hi: {
      name: 'पीएचसी-भोपाल सीहोर एग्रो-पोस्ट (डेमो)',
      district: 'सीहोर केंद्रीय पठार',
      state: 'मध्य प्रदेश',
    },
  },
  'phc-or-01': {
    hi: {
      name: 'पीएचसी-भुवनेश्वर खोरधा तटीय (डेमो)',
      district: 'खोरधा तटीय बेसिन',
      state: 'ओडिशा',
    },
  },
  'phc-uk-01': {
    hi: {
      name: 'पीएचसी-देहरादून ग्रामीण फुटहिल्स (डेमो)',
      district: 'देहरादून घाटी उप-प्रभाग',
      state: 'उत्तराखंड',
    },
  },
  'phc-uk-02': {
    hi: {
      name: 'पीएचसी-हरिद्वार परिधीय बेसिन (डेमो)',
      district: 'हरिद्वार तीर्थ कॉरिडोर',
      state: 'उत्तराखंड',
    },
  },
  'phc-uk-03': {
    hi: {
      name: 'पीएचसी-अल्मोड़ा हिल चौकी (डेमो)',
      district: 'अल्मोड़ा कुमाऊं उच्च-श्रेणी',
      state: 'उत्तराखंड',
    },
  },
};

/**
 * Returns localized PHC name, district, state, and short display name.
 */
export function getLocalizedPHC(
  phc: PHC,
  lang: LanguageCode = 'en'
): { name: string; shortName: string; district: string; state: string } {
  if (lang === 'hi' && PHC_LOCALIZATIONS[phc.id]?.hi) {
    const loc = PHC_LOCALIZATIONS[phc.id].hi;
    return {
      name: loc.name,
      shortName: loc.name.replace(/^पीएचसी-/, ''),
      district: loc.district,
      state: loc.state,
    };
  }
  return {
    name: phc.name,
    shortName: phc.name.replace(/^PHC-/, ''),
    district: phc.district,
    state: phc.state,
  };
}

/**
 * Returns localized risk level label.
 */
export function getLocalizedRiskLevel(risk: RiskLevel, lang: LanguageCode = 'en'): string {
  if (lang === 'hi') {
    switch (risk) {
      case 'critical':
        return 'गंभीर';
      case 'high':
        return 'उच्च जोखिम';
      case 'warning':
        return 'चेतावनी';
      case 'stable':
        return 'स्थिर';
    }
  }
  switch (risk) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High Risk';
    case 'warning':
      return 'Warning';
    case 'stable':
      return 'Stable';
  }
}

/**
 * Returns localized medicine risk level label.
 */
export function getLocalizedMedicineRisk(risk: string, lang: LanguageCode = 'en'): string {
  const normalized = risk.toLowerCase();
  if (lang === 'hi') {
    switch (normalized) {
      case 'critical':
        return 'गंभीर';
      case 'high':
        return 'उच्च';
      case 'moderate':
      case 'warning':
        return 'मध्यम';
      case 'low':
      case 'stable':
        return 'कम जोखिम';
      default:
        return risk;
    }
  }
  switch (normalized) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'moderate':
    case 'warning':
      return 'Moderate';
    case 'low':
    case 'stable':
      return 'Low';
    default:
      return risk.toUpperCase();
  }
}
