import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  Flame,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sliders,
  CheckSquare,
  Square,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Share2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ListOrdered,
  Play,
  Pause,
  FastForward,
} from 'lucide-react';
import { PHC } from '../../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  simulateEmergencyScenario,
  EmergencyAnalysisResult,
  isGeminiConfigured,
} from '../../services/gemini';
import { LanguageCode, getTranslation } from '../../utils/i18n';

interface EmergencySimulatorViewProps {
  phcs: PHC[];
  onOpenOptimizer: () => void;
  language?: LanguageCode;
}

export interface SimulationStage {
  hour: number;
  label: string;
  labelHi: string;
  patientSurge: number;
  medicineSurge: number;
  staffDepletion: number;
  emergencySurge: number;
  isMitigated: boolean;
  description: string;
  descriptionHi: string;
}

export const SIMULATION_STAGES: SimulationStage[] = [
  {
    hour: 0,
    label: 'Baseline',
    labelHi: 'बेसलाइन',
    patientSurge: 10,
    medicineSurge: 10,
    staffDepletion: 0,
    emergencySurge: 20,
    isMitigated: false,
    description: 'Hour 0: Nominal grid operation. Telemetry baseline established.',
    descriptionHi: 'घंटा 0: मानक ग्रिड संचालन। टेलीमेट्री बेसलाइन स्थापित।',
  },
  {
    hour: 2,
    label: 'Inflow +25%',
    labelHi: 'प्रवाह +25%',
    patientSurge: 25,
    medicineSurge: 25,
    staffDepletion: 0,
    emergencySurge: 20,
    isMitigated: false,
    description: 'Hour 2: Early ambulatory surge onset (+25%). Triage intake expanding.',
    descriptionHi: 'घंटा 2: प्रारंभिक मरीज प्रवाह वृद्धि (+25%)। ट्राइएज कतारें बढ़ रही हैं।',
  },
  {
    hour: 4,
    label: 'Strain +50%',
    labelHi: 'दबाव +50%',
    patientSurge: 50,
    medicineSurge: 25,
    staffDepletion: 1,
    emergencySurge: 30,
    isMitigated: false,
    description: 'Hour 4: Compounding strain. Clinician isolated; critical deficit alert generated.',
    descriptionHi: 'घंटा 4: संचयी दबाव। 1 चिकित्सक अनुपस्थित; महत्वपूर्ण घाटे की चेतावनी।',
  },
  {
    hour: 6,
    label: 'Peak Crisis',
    labelHi: 'चरम संकट',
    patientSurge: 100,
    medicineSurge: 40,
    staffDepletion: 1,
    emergencySurge: 50,
    isMitigated: true,
    description: 'Hour 6: Peak crisis conditions. Preemptive multi-PHC mitigation package deployed.',
    descriptionHi: 'घंटा 6: चरम संकट स्थिति। AI पूर्वव्यापी शमन पैकेज सक्रिय किया गया।',
  },
  {
    hour: 8,
    label: 'Buffer Active',
    labelHi: 'बफर सक्रिय',
    patientSurge: 100,
    medicineSurge: 40,
    staffDepletion: 1,
    emergencySurge: 30,
    isMitigated: true,
    description: 'Hour 8: Bed occupancy plateauing. Emergency PO and diversions taking effect.',
    descriptionHi: 'घंटा 8: बिस्तर अधिभोग स्थिर। आपातकालीन आपूर्ति और डायवर्जन प्रभावी।',
  },
  {
    hour: 10,
    label: 'Rebalancing',
    labelHi: 'पुनर्संतुलन',
    patientSurge: 50,
    medicineSurge: 25,
    staffDepletion: 0,
    emergencySurge: 20,
    isMitigated: true,
    description: 'Hour 10: Network resilience rebounding toward 84/100. Emergency stabilized.',
    descriptionHi: 'घंटा 10: नेटवर्क लचीलापन 84/100 की ओर बढ़ रहा है। आपातकाल नियंत्रित।',
  },
  {
    hour: 12,
    label: 'Stabilized',
    labelHi: 'स्थिरीकृत',
    patientSurge: 10,
    medicineSurge: 10,
    staffDepletion: 0,
    emergencySurge: 20,
    isMitigated: true,
    description: 'Hour 12: Simulation complete. Grid resilience restored across all 18 nodes.',
    descriptionHi: 'घंटा 12: सिमुलेशन पूर्ण। सभी 18 नोड्स पर ग्रिड लचीलापन बहाल।',
  },
];

export const EmergencySimulatorView: React.FC<EmergencySimulatorViewProps> = ({
  phcs,
  onOpenOptimizer,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const [patientSurge, setPatientSurge] = useState<number>(25); // +25%
  const [medicineSurge, setMedicineSurge] = useState<number>(25); // +25%
  const [staffDepletion, setStaffDepletion] = useState<number>(1); // -1 doctor
  const [emergencySurge, setEmergencySurge] = useState<number>(30); // +30%

  const [isMitigated, setIsMitigated] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accelerated Autoplay Timeline State
  const [currentHour, setCurrentHour] = useState<number>(4);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Gemini AI Emergency Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<EmergencyAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Preemptive actions toggles
  const [actions, setActions] = useState({
    reallocateMeds: true,
    mobilizeStaff: true,
    divertWalkIns: true,
    emergencyPO: true,
  });

  // Calculate dynamic before vs after
  const simulationResults = useMemo(() => {
    const criticalNodes = Math.min(18, Math.round(1 + (patientSurge / 25) * 1.5 + (medicineSurge / 20) * 1.2));
    const bedOccupancy = Math.min(99, Math.round(72 + (patientSurge * 0.4) + (emergencySurge * 0.3)));
    const resilienceScore = Math.max(25, Math.round(82 - (patientSurge * 0.45) - (medicineSurge * 0.3) - (staffDepletion * 8)));
    const stockoutDays = Math.max(0.6, Number((2.8 / (1 + medicineSurge / 100)).toFixed(1)));

    // Post-mitigation recovery stats
    const mitigatedCritical = Math.max(1, criticalNodes - 3);
    const mitigatedBedOccupancy = Math.max(76, bedOccupancy - 12);
    const mitigatedResilience = Math.min(86, resilienceScore + 28);

    return {
      criticalNodes,
      bedOccupancy,
      resilienceScore,
      stockoutDays,
      mitigatedCritical,
      mitigatedBedOccupancy,
      mitigatedResilience,
    };
  }, [patientSurge, medicineSurge, staffDepletion, emergencySurge]);

  // 12-Hour Crisis Collapse Trajectory Curve
  const trajectoryData = useMemo(() => {
    const collapseDrop = Math.round((82 - simulationResults.resilienceScore) / 6);
    return [
      { hour: language === 'hi' ? 'घंटा 0' : 'Hour 0', baselineResilience: 82, crisisTrajectory: 82, mitigatedTrajectory: 82 },
      { hour: language === 'hi' ? 'घंटा 2' : 'Hour 2', baselineResilience: 82, crisisTrajectory: Math.max(30, 82 - collapseDrop), mitigatedTrajectory: 80 },
      { hour: language === 'hi' ? 'घंटा 4' : 'Hour 4', baselineResilience: 81, crisisTrajectory: Math.max(28, 82 - collapseDrop * 2), mitigatedTrajectory: 78 },
      { hour: language === 'hi' ? 'घंटा 6' : 'Hour 6', baselineResilience: 81, crisisTrajectory: Math.max(25, 82 - collapseDrop * 3), mitigatedTrajectory: 79 },
      { hour: language === 'hi' ? 'घंटा 8' : 'Hour 8', baselineResilience: 80, crisisTrajectory: Math.max(25, 82 - collapseDrop * 4), mitigatedTrajectory: 82 },
      { hour: language === 'hi' ? 'घंटा 10' : 'Hour 10', baselineResilience: 80, crisisTrajectory: Math.max(25, 82 - collapseDrop * 5), mitigatedTrajectory: 84 },
      { hour: language === 'hi' ? 'घंटा 12' : 'Hour 12', baselineResilience: 80, crisisTrajectory: simulationResults.resilienceScore, mitigatedTrajectory: 86 },
    ];
  }, [simulationResults.resilienceScore, language]);

  // Run Gemini Emergency Analysis
  const runAiEmergencyAnalysis = useCallback(async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await simulateEmergencyScenario({
        patientSurge,
        medicineSurge,
        staffDepletion,
        emergencySurge,
        criticalNodesCount: simulationResults.criticalNodes,
        bedOccupancyPercent: simulationResults.bedOccupancy,
        resilienceScore: simulationResults.resilienceScore,
        stockoutDays: simulationResults.stockoutDays,
        phcs,
      });
      setAiAnalysis(result);
      if (result.error && result.isLiveAI === false && isGeminiConfigured()) {
        setAiError(result.error);
      }
    } catch (err: any) {
      setAiError(err.message || 'Error running emergency simulation.');
    } finally {
      setIsAiLoading(false);
    }
  }, [
    patientSurge,
    medicineSurge,
    staffDepletion,
    emergencySurge,
    simulationResults,
    phcs,
  ]);

  // Initial and reactive evaluation
  useEffect(() => {
    runAiEmergencyAnalysis();
  }, [runAiEmergencyAnalysis]);

  // Stage application helper
  const applyStage = useCallback((hour: number) => {
    const stage = SIMULATION_STAGES.find((s) => s.hour === hour) || SIMULATION_STAGES[0];
    setCurrentHour(stage.hour);
    setPatientSurge(stage.patientSurge);
    setMedicineSurge(stage.medicineSurge);
    setStaffDepletion(stage.staffDepletion);
    setEmergencySurge(stage.emergencySurge);
    setIsMitigated(stage.isMitigated);
  }, []);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startAutoplay = useCallback((fromHour?: number) => {
    stopAutoplay();
    setIsPlaying(true);
    let startH = fromHour !== undefined ? fromHour : currentHour;
    if (startH >= 12) {
      startH = 0;
      applyStage(0);
    }

    const hours = [0, 2, 4, 6, 8, 10, 12];
    let currentIndex = hours.indexOf(startH);
    if (currentIndex === -1) currentIndex = 0;

    autoplayTimerRef.current = setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= hours.length) {
        stopAutoplay();
        return;
      }
      const nextHour = hours[currentIndex];
      applyStage(nextHour);
      if (nextHour >= 12) {
        stopAutoplay();
      }
    }, 1500);
  }, [currentHour, applyStage, stopAutoplay]);

  const toggleAutoplay = () => {
    if (isPlaying) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, []);

  const handleAuthorizeMitigation = () => {
    setIsMitigated(true);
    setToastMessage(
      language === 'hi'
        ? 'पूर्वव्यापी आपातकालीन शमन पैकेज अधिकृत: अंतर-PHC आपूर्ति चैनल सक्रिय, स्टैंडबाय डॉक्टर अलर्ट, वॉक-इन डायवर्जन तैयार।'
        : 'Preemptive Emergency Mitigation Package AUTHORIZED: Inter-PHC supply channels activated, standby clinicians alerted, walk-in diversions staged.'
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleResetSimulation = () => {
    stopAutoplay();
    applyStage(0);
    setPatientSurge(10);
    setMedicineSurge(10);
    setStaffDepletion(0);
    setEmergencySurge(20);
    setIsMitigated(false);
  };

  const currentStageObj = SIMULATION_STAGES.find((s) => s.hour === currentHour) || SIMULATION_STAGES[0];

  return (
    <div id="emergency-simulator-view" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-cyan-500/50 text-xs flex items-center gap-2.5 max-w-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-2xl p-5 border border-amber-500/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'तनाव-परीक्षण इंजन' : 'Stress-Testing Engine'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {language === 'hi' ? 'रीयल-टाइम डायनेमिक सैंडबॉक्स' : 'Real-Time Dynamic Sandbox'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-cyan-500/30 border border-amber-300/40 text-amber-200 text-[10px] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {t.poweredByGemini}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            {language === 'hi'
              ? '"क्या-अगर" आपातकालीन संकट और उछाल सिम्युलेटर'
              : '“What-If” Emergency Crisis & Surge Simulator'}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            {language === 'hi'
              ? 'जटिल तनावों के तहत स्वास्थ्य सेवा ग्रिड लचीलेपन का परीक्षण करें: महामारी स्पाइक्स, अचानक बाढ़, स्टाफ कमी, और तीव्र दवा समाप्ति।'
              : 'Test healthcare grid resilience under compounding stresses: epidemic spikes, flash floods, sudden staff quarantine, and acute pharmaceutical depletion.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Demo Auto-Play Control */}
          <button
            type="button"
            onClick={toggleAutoplay}
            className={`px-3 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 ring-2 ring-amber-300'
                : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500'
            }`}
            aria-label={
              isPlaying
                ? 'Pause accelerated demo simulation'
                : currentHour === 12
                ? 'Replay accelerated demo simulation'
                : 'Start accelerated demo simulation'
            }
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'रोकें' : 'Pause'}</span>
              </>
            ) : currentHour === 12 ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'पुनः चलाएं' : 'Replay Auto-Play'}</span>
              </>
            ) : currentHour > 0 && currentHour < 12 ? (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{language === 'hi' ? 'जारी रखें' : 'Resume Auto-Play'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{language === 'hi' ? 'डेमो ऑटो-प्ले' : 'Demo Auto-Play'}</span>
              </>
            )}
          </button>

          <button
            onClick={runAiEmergencyAnalysis}
            disabled={isAiLoading}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
            {isAiLoading
              ? (language === 'hi' ? 'सिम्युलेटिंग...' : 'Simulating...')
              : (language === 'hi' ? 'आपातकाल का अनुकरण करें' : 'Simulate Emergency')}
          </button>

          <button
            onClick={handleResetSimulation}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.reset}
          </button>
        </div>
      </div>

      {/* 12-Hour Crisis Simulation Timeline Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FastForward className="w-4 h-4 text-cyan-600" />
              {language === 'hi' ? '12-घंटे का संकट समयरेखा प्रगति' : '12-Hour Crisis Progression Timeline'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
              {language === 'hi' ? 'त्वरित डेमो सिमुलेशन (~1.5s/चरण)' : 'Accelerated Demo (~1.5s/stage)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {language === 'hi' ? 'वर्तमान चरण:' : 'Current Phase:'}
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-cyan-300 rounded">
              Hour {currentHour} / 12
            </span>
          </div>
        </div>

        {/* 7-Step Timeline Stepper */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
          {SIMULATION_STAGES.map((stage) => {
            const isActive = stage.hour === currentHour;
            const isPast = stage.hour < currentHour;
            return (
              <button
                key={stage.hour}
                type="button"
                onClick={() => {
                  stopAutoplay();
                  applyStage(stage.hour);
                }}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[64px] ${
                  isActive
                    ? 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-300 text-cyan-950 font-bold shadow-xs'
                    : isPast
                    ? 'bg-slate-50 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                }`}
                title={`Click to jump to Hour ${stage.hour}`}
              >
                <span className="text-[10px] sm:text-xs font-mono font-bold">
                  {language === 'hi' ? `घंटा ${stage.hour}` : `Hour ${stage.hour}`}
                </span>
                <span
                  className={`w-2 h-2 rounded-full my-1 ${
                    isActive
                      ? 'bg-cyan-600 animate-ping'
                      : isPast
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
                <span className="text-[9px] sm:text-[10px] truncate max-w-full leading-tight">
                  {language === 'hi' ? stage.labelHi : stage.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stage Status Description Banner */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-700 font-medium">
              {language === 'hi' ? currentStageObj.descriptionHi : currentStageObj.description}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden sm:inline">
            {isPlaying
              ? (language === 'hi' ? 'ऑटो-प्ले सक्रिय' : 'Autoplay Running')
              : (language === 'hi' ? 'मैन्युअल / रोका गया' : 'Manual / Paused')}
          </span>
        </div>
      </div>

      {/* Simulator Control Board: 4 Parameter Sliders / Chips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-600" />
          {language === 'hi' ? 'आपातकालीन तनाव पैरामीटर (इंटरैक्टिव नियंत्रण)' : 'Emergency Stress Parameters (Interactive Controls)'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Parameter 1: Patient Surge */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {language === 'hi' ? 'मरीज वृद्धि' : 'Patient Surge'}
              </span>
              <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                +{patientSurge}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => setPatientSurge(val)}
                  className={`py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                    patientSurge === val
                      ? 'bg-cyan-600 text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{val}%
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {language === 'hi' ? 'एम्बुलेटरी वॉक-इन में वृद्धि' : 'Ambulatory walk-ins increase'}
            </span>
          </div>

          {/* Parameter 2: Medicine Demand */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {language === 'hi' ? 'दवा खपत दर' : 'Medicine Burn Rate'}
              </span>
              <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                +{medicineSurge}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[10, 25, 40, 60].map((val) => (
                <button
                  key={val}
                  onClick={() => setMedicineSurge(val)}
                  className={`py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                    medicineSurge === val
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{val}%
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {language === 'hi' ? 'एंटीबायोटिक और IV खपत में तेजी' : 'Antibiotic & IV consumption acceleration'}
            </span>
          </div>

          {/* Parameter 3: Staff Depletion */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {language === 'hi' ? 'चिकित्सक कमी' : 'Clinician Depletion'}
              </span>
              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                -{staffDepletion} {language === 'hi' ? 'डॉक्टर' : 'Doctors'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((val) => (
                <button
                  key={val}
                  onClick={() => setStaffDepletion(val)}
                  className={`py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                    staffDepletion === val
                      ? 'bg-amber-600 text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  -{val} {language === 'hi' ? 'डॉ.' : (val === 1 ? 'Dr' : 'Drs')}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {language === 'hi' ? 'तीव्र बीमारी या क्वारंटीन के कारण' : 'Due to acute illness or quarantine'}
            </span>
          </div>

          {/* Parameter 4: Emergency Admissions */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {language === 'hi' ? 'आपातकालीन प्रवेश' : 'Emergency Admissions'}
              </span>
              <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                +{emergencySurge}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[20, 30, 50].map((val) => (
                <button
                  key={val}
                  onClick={() => setEmergencySurge(val)}
                  className={`py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                    emergencySurge === val
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{val}%
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {language === 'hi' ? 'आघात और गंभीर बाल चिकित्सा प्रवेश' : 'Trauma & severe pediatric admissions'}
            </span>
          </div>
        </div>
      </div>

      {/* AI EMERGENCY INCIDENT BRIEFING (POWERED BY GEMINI) */}
      <div
        id="ai-emergency-insight-box"
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 rounded-2xl p-5 text-white border border-amber-500/40 shadow-lg space-y-4 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {language === 'hi'
                    ? 'AI आपातकालीन घटना ब्रीफिंग और कार्य योजना'
                    : 'AI Emergency Incident Briefing & Action Matrix'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                  {t.poweredByGemini}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                {language === 'hi'
                  ? 'मरीज वृद्धि, स्टाफ कमी और आपूर्ति रिक्तीकरण पर स्वायत्त बहु-आयामी विश्लेषण'
                  : 'Autonomous multi-vector reasoning over patient surge, staff attrition & supply depletion'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              aiAnalysis?.priorityOrder === 'Immediate'
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-amber-500 text-slate-950'
            }`}>
              {language === 'hi' ? 'प्राथमिकता' : 'Priority'}: {aiAnalysis?.priorityOrder || (language === 'hi' ? 'अत्यावश्यक' : 'Urgent')}
            </span>
            <button
              onClick={runAiEmergencyAnalysis}
              disabled={isAiLoading}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{isAiLoading ? (language === 'hi' ? 'मूल्यांकन...' : 'Evaluating...') : (language === 'hi' ? 'पुनर्मूल्यांकन' : 'Re-Evaluate')}</span>
            </button>
          </div>
        </div>

        {isAiLoading ? (
          <div className="p-6 text-center space-y-3 relative z-10">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold text-xs animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>
                {language === 'hi'
                  ? 'जेमिनी प्रणालीगत मल्टी-सुविधा तनाव प्रसार का मूल्यांकन कर रहा है...'
                  : 'Gemini is evaluating systemic multi-facility stress propagation...'}
              </span>
            </div>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full w-2/3 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {/* Risk Explanation Narrative */}
            <div className="p-3.5 bg-white/5 backdrop-blur-xs rounded-xl border border-amber-500/30 text-xs text-amber-100 leading-relaxed font-medium">
              &ldquo;{aiAnalysis?.riskExplanation}&rdquo;
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Problems Identified */}
              <div className="bg-rose-950/30 rounded-xl border border-rose-500/30 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  {language === 'hi' ? 'पहचानी गई मुख्य समस्याएं और कमजोरियां:' : 'Key Problems & Vulnerabilities Identified:'}
                </div>
                <div className="space-y-1.5">
                  {aiAnalysis?.keyProblems.map((prob, i) => (
                    <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{prob}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-cyan-950/30 rounded-xl border border-cyan-500/30 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
                  {language === 'hi' ? 'अनुशंसित कार्य योजना (प्राथमिकता क्रम):' : 'Recommended Action Plan (Priority Order):'}
                </div>
                <div className="space-y-1.5">
                  {aiAnalysis?.recommendedActions.map((act, i) => (
                    <div key={i} className="text-[11px] text-slate-200 flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">{i + 1}.</span>
                      <span>{act.replace(/^[0-9]+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Impact Comparison: Baseline vs Simulated Crisis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline State */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === 'hi' ? 'वर्तमान बेसलाइन ऑपरेटिंग ग्रिड' : 'Current Baseline Operating Grid'}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {language === 'hi' ? 'मानक' : 'Standard'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'गंभीर घाटे वाले नोड्स:' : 'Critical Deficit Nodes:'}
              </span>
              <div className="font-mono text-xl font-bold text-slate-900 mt-1">1 PHC</div>
              <span className="text-[10px] text-slate-400">PHC-Alpha East</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'औसत बेड अधिभोग:' : 'Average Bed Occupancy:'}
              </span>
              <div className="font-mono text-xl font-bold text-slate-900 mt-1">72%</div>
              <span className="text-[10px] text-slate-400">
                {language === 'hi' ? '102 बेड उपलब्ध' : '102 beds available'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'ग्रिड लचीलापन स्कोर:' : 'Grid Resilience Score:'}
              </span>
              <div className="font-mono text-xl font-bold text-emerald-700 mt-1">82 / 100</div>
              <span className="text-[10px] text-emerald-600">
                {language === 'hi' ? 'स्थिर संचालन' : 'Stable operations'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'एमोक्सिसिलिन रिक्तीकरण:' : 'Amoxicillin Depletion:'}
              </span>
              <div className="font-mono text-xl font-bold text-slate-900 mt-1">
                2.8 {language === 'hi' ? 'दिन' : 'Days'}
              </div>
              <span className="text-[10px] text-slate-400">
                {language === 'hi' ? 'मानक बफर' : 'Standard buffer'}
              </span>
            </div>
          </div>
        </div>

        {/* Simulated Crisis State */}
        <div className={`rounded-2xl border p-5 shadow-sm space-y-3 transition-colors ${
          isMitigated
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              {isMitigated
                ? (language === 'hi' ? 'शमित हस्तक्षेप-पश्चात स्थिति' : 'Mitigated Post-Intervention State')
                : (language === 'hi' ? 'सिम्युलेटेड संकट प्रक्षेपवक्र (अनशमित)' : 'Simulated Crisis Trajectory (Unmitigated)')}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isMitigated
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800 animate-pulse'
              }`}
            >
              {isMitigated
                ? (language === 'hi' ? 'स्थिर' : 'Stabilized')
                : (language === 'hi' ? 'प्रणालीगत पतन जोखिम' : 'Systemic Collapse Risk')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'गंभीर घाटे वाले नोड्स:' : 'Critical Deficit Nodes:'}
              </span>
              <div
                className={`font-mono text-xl font-bold mt-1 ${
                  isMitigated ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {isMitigated
                  ? `${simulationResults.mitigatedCritical} PHCs`
                  : `${simulationResults.criticalNodes} PHCs`}
              </div>
              <span className="text-[10px] text-slate-500">
                {isMitigated
                  ? (language === 'hi' ? '3 नोड्स सुरक्षित' : '3 Nodes Saved')
                  : (language === 'hi' ? '+4 क्रमिक विफलताएं' : '+4 Cascading failures')}
              </span>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'औसत बेड अधिभोग:' : 'Average Bed Occupancy:'}
              </span>
              <div
                className={`font-mono text-xl font-bold mt-1 ${
                  isMitigated ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {isMitigated ? `${simulationResults.mitigatedBedOccupancy}%` : `${simulationResults.bedOccupancy}%`}
              </div>
              <span className="text-[10px] text-slate-500">
                {isMitigated
                  ? (language === 'hi' ? 'ट्राइएज डायवर्जन सक्रिय' : 'Triage diverts active')
                  : (language === 'hi' ? 'अत्यधिक आपातकालीन भीड़' : 'Acute trauma overflow')}
              </span>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'ग्रिड लचीलापन स्कोर:' : 'Grid Resilience Score:'}
              </span>
              <div
                className={`font-mono text-xl font-bold mt-1 ${
                  isMitigated ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {isMitigated ? `${simulationResults.mitigatedResilience}/100` : `${simulationResults.resilienceScore}/100`}
              </div>
              <span className="text-[10px] text-slate-500">
                {isMitigated
                  ? (language === 'hi' ? 'पुनर्प्राप्ति प्रक्षेपवक्र' : 'Recovery trajectory')
                  : (language === 'hi' ? '-38 सूचकांक अंक' : '-38 Index points')}
              </span>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">
                {language === 'hi' ? 'एमोक्सिसिलिन रिक्तीकरण:' : 'Amoxicillin Depletion:'}
              </span>
              <div
                className={`font-mono text-xl font-bold mt-1 ${
                  isMitigated ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {isMitigated
                  ? `11.8 ${language === 'hi' ? 'दिन' : 'Days'}`
                  : `${simulationResults.stockoutDays} ${language === 'hi' ? 'दिन' : 'Days'}`}
              </div>
              <span className="text-[10px] text-slate-500">
                {isMitigated
                  ? (language === 'hi' ? 'स्थानांतरण बफ़र्ड' : 'Transfer buffered')
                  : (language === 'hi' ? 'तीव्र स्टॉक समाप्ति' : 'Rapid stockout')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Hour Crisis Collapse Graph (Recharts) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'hi'
                ? '12-घंटे का लचीलापन प्रक्षेपवक्र और पुनर्प्राप्ति वक्र'
                : '12-Hour Resilience Trajectory & Recovery Curve'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'बिना हस्तक्षेप के प्रणालीगत पतन बनाम पूर्वव्यापी मल्टी-PHC शमन के साथ त्वरित पुनर्प्राप्ति का अनुकरण'
                : 'Simulating systemic collapse without intervention vs rapid recovery with preemptive multi-PHC mitigation'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-3 h-0.5 bg-slate-400 inline-block" /> {language === 'hi' ? 'बेसलाइन (82)' : 'Baseline (82)'}
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" /> {language === 'hi' ? 'अनशमित संकट' : 'Unmitigated Crisis'}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" /> {language === 'hi' ? 'पूर्वव्यापी शमन' : 'Preemptive Mitigation'}
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[20, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Line
                type="monotone"
                dataKey="baselineResilience"
                name={language === 'hi' ? 'बेसलाइन लचीलापन' : 'Baseline Resilience'}
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="crisisTrajectory"
                name={language === 'hi' ? 'अनशमित पतन' : 'Unmitigated Collapse'}
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444' }}
              />
              <Line
                type="monotone"
                dataKey="mitigatedTrajectory"
                name={language === 'hi' ? 'शमन पैकेज के साथ' : 'With Mitigation Package'}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
              />
              <ReferenceLine
                y={50}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={language === 'hi' ? 'गंभीर पतन रेखा (50)' : 'Critical Collapse Line (50)'}
              />
              <ReferenceLine
                x={language === 'hi' ? `घंटा ${currentHour}` : `Hour ${currentHour}`}
                stroke="#0891b2"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: language === 'hi' ? `घंटा ${currentHour}` : `Hour ${currentHour}`,
                  position: 'top',
                  fill: '#0891b2',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Preemptive Mitigation Package Selection & Authorization */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {language === 'hi' ? 'AI पूर्वव्यापी शमन हस्तक्षेप पैकेज' : 'AI Preemptive Mitigation Intervention Package'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'कैस्केडिंग स्वास्थ्य सेवा प्रणाली विफलता को रोकने के लिए सुरक्षात्मक प्रोटोकॉल चुनें:'
                : 'Select protective protocols to prevent cascading healthcare system failure:'}
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg">
            {language === 'hi' ? '4 प्रोटोकॉल तैयार' : '4 Protocols Ready'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={actions.reallocateMeds}
              onChange={(e) => setActions({ ...actions, reallocateMeds: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <div className="text-xs">
              <strong className="text-slate-900 block">
                {language === 'hi' ? 'अंतर-PHC स्टॉक स्थानांतरण स्वतः ट्रिगर करें' : 'Auto-Trigger Inter-PHC Stock Transfers'}
              </strong>
              <span className="text-slate-600">
                {language === 'hi'
                  ? 'PHC-Beta South से तुरंत 300 यूनिट एमोक्सिसिलिन और 200 यूनिट IV तरल पदार्थ भेजता है।'
                  : 'Immediately dispatches 300 units of Amoxicillin and 200 units of IV fluids from PHC-Beta South.'}
              </span>
            </div>
          </label>

          <label className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={actions.mobilizeStaff}
              onChange={(e) => setActions({ ...actions, mobilizeStaff: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <div className="text-xs">
              <strong className="text-slate-900 block">
                {language === 'hi' ? 'क्षेत्रीय स्टैंडबाय चिकित्सकों को सक्रिय करें' : 'Mobilize Regional Standby Clinicians'}
              </strong>
              <span className="text-slate-600">
                {language === 'hi'
                  ? 'शाम की भीड़ के लिए 4 ऑन-कॉल चिकित्सा अधिकारियों और 8 वरिष्ठ ट्राइएज नर्सों को सक्रिय करता है।'
                  : 'Activates 4 on-call medical officers and 8 senior triage nurses for evening surge shifts.'}
              </span>
            </div>
          </label>

          <label className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={actions.divertWalkIns}
              onChange={(e) => setActions({ ...actions, divertWalkIns: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <div className="text-xs">
              <strong className="text-slate-900 block">
                {language === 'hi' ? 'परिधीय उप-केंद्र ट्राइएज डायवर्जन' : 'Peripheral Sub-Centre Triage Diversion'}
              </strong>
              <span className="text-slate-600">
                {language === 'hi'
                  ? 'हल्के वॉक-इन मरीजों को 6 स्थानीय उप-केंद्रों पर पुनर्निर्देशित करता है, जिससे अस्पताल के ट्रॉमा बेड खाली होते हैं।'
                  : 'Reroutes mild ambulatory walk-ins to 6 local wellness sub-centers, freeing hospital trauma beds.'}
              </span>
            </div>
          </label>

          <label className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={actions.emergencyPO}
              onChange={(e) => setActions({ ...actions, emergencyPO: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <div className="text-xs">
              <strong className="text-slate-900 block">
                {language === 'hi' ? 'राज्य रिजर्व आपातकालीन खरीद आदेश जारी करें' : 'State Reserve Emergency PO Release'}
              </strong>
              <span className="text-slate-600">
                {language === 'hi'
                  ? 'जिला केंद्रीय डिपो से 2,000 एंटीबायोटिक पाठ्यक्रमों के लिए त्वरित इलेक्ट्रॉनिक रिलीज ऑर्डर जारी करता है।'
                  : 'Issues expedited electronic release order for 2,000 antibiotic courses from District Central Depot.'}
              </span>
            </div>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            {language === 'hi' ? 'पूर्ण स्थिरीकरण का अनुमानित समय:' : 'Estimated time to full stabilization:'}{' '}
            <strong>4.5 {language === 'hi' ? 'घंटे' : 'Hours'}</strong>
          </span>

          <button
            onClick={handleAuthorizeMitigation}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
          >
            <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
            {language === 'hi' ? 'पूर्वव्यापी हस्तक्षेप अधिकृत करें' : 'Authorize Preemptive Interventions'}
          </button>
        </div>
      </div>
    </div>
  );
};
