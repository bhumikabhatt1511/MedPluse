import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Zap,
  Sliders,
  Layers,
  Info,
  Sparkles,
  RefreshCw,
  Activity,
  Clock,
} from 'lucide-react';
import { Medicine } from '../../types';
import { INITIAL_MEDICINES, DEMAND_FORECAST_DATA } from '../../data/mockData';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  generateDemandForecastInsight,
  isGeminiConfigured,
} from '../../services/gemini';
import {
  computeMedicineMetrics,
  calculateDaysOfStockRemaining,
  calculatePredictedStockoutDate,
  calculateStockoutRisk,
} from '../../utils/medicineCalculations';
import { LanguageCode, getTranslation } from '../../utils/i18n';
import { RiskBadge } from '../common/RiskBadge';

interface AIDemandForecastViewProps {
  language?: LanguageCode;
  medicines?: Medicine[];
  onOpenOptimizer: () => void;
}

export const AIDemandForecastView: React.FC<AIDemandForecastViewProps> = ({
  language = 'en',
  medicines = INITIAL_MEDICINES,
  onOpenOptimizer,
}) => {
  const t = getTranslation(language);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>(
    medicines[0]?.id || 'med-01'
  );
  const [scenario, setScenario] = useState<'baseline' | 'monsoon' | 'epidemic'>('baseline');
  const [showIntervention, setShowIntervention] = useState(true);

  // Gemini AI Forecast Insight state
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isLiveAI, setIsLiveAI] = useState<boolean>(false);

  // Standardize medicines with deterministic metrics
  const computedMedicines = useMemo(() => {
    return (medicines || []).map((m) => computeMedicineMetrics(m));
  }, [medicines]);

  const activeMed = useMemo(() => {
    return (
      computedMedicines.find((m) => m.id === selectedMedicineId) ||
      computedMedicines[0] ||
      computeMedicineMetrics(INITIAL_MEDICINES[0])
    );
  }, [computedMedicines, selectedMedicineId]);

  // Scenario-adjusted metrics (deterministic calculations)
  const scenarioMultiplier =
    scenario === 'monsoon' ? 1.25 : scenario === 'epidemic' ? 1.45 : 1.0;

  const baseDailyConsumption = activeMed.dailyConsumption || activeMed.burnRatePerDay || 100;
  const dailyConsumption = Math.round(baseDailyConsumption * scenarioMultiplier);
  const currentStock = activeMed.currentStock;
  const daysOfStockRemaining = calculateDaysOfStockRemaining(currentStock, dailyConsumption);
  const stockoutRisk = calculateStockoutRisk(daysOfStockRemaining);
  const predictedStockoutDate = calculatePredictedStockoutDate(daysOfStockRemaining);
  const projectedDemand7d = dailyConsumption * 7;

  // Dynamically calculate chart trajectory data based on medicine & scenario
  const chartData = useMemo(() => {
    const dailyDelta = dailyConsumption;
    let runningUnmitigated = currentStock;
    let runningIntervened = currentStock + (showIntervention ? 300 : 0);

    return Array.from({ length: 11 }, (_, i) => {
      const dayOffset = i - 3;
      const dayLabel = dayOffset === 0 ? 'Today' : dayOffset > 0 ? `+${dayOffset}d` : `${dayOffset}d`;
      const isProjected = dayOffset > 0;

      if (dayOffset <= 0) {
        return {
          day: dayLabel,
          historicalDemand: Math.round(baseDailyConsumption * (0.9 + (i * 0.05))),
          projectedDemandAdjusted: undefined,
          projectedStockRemaining: Math.max(0, currentStock + (-dayOffset * baseDailyConsumption)),
          intervenedStockRemaining: undefined,
          upperConfidence: undefined,
          lowerConfidence: undefined,
        };
      } else {
        runningUnmitigated = Math.max(0, runningUnmitigated - dailyDelta);
        runningIntervened = Math.max(0, runningIntervened - dailyDelta);

        const confidenceMargin = Math.round(dailyDelta * 0.15 * Math.sqrt(dayOffset));

        return {
          day: dayLabel,
          historicalDemand: undefined,
          projectedDemandAdjusted: dailyDelta,
          projectedStockRemaining: runningUnmitigated,
          intervenedStockRemaining: showIntervention ? runningIntervened : undefined,
          upperConfidence: dailyDelta + confidenceMargin,
          lowerConfidence: Math.max(0, dailyDelta - confidenceMargin),
        };
      }
    });
  }, [currentStock, dailyConsumption, baseDailyConsumption, showIntervention]);

  const fetchAiInsight = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const res = await generateDemandForecastInsight({
        medicineName: activeMed.name,
        scenario,
        currentStock,
        burnRate: dailyConsumption,
        stockoutDays: daysOfStockRemaining,
        leadTimeDays: 6.5,
        historicalVelocity: `+${Math.round((scenarioMultiplier - 1) * 100)}% intake velocity under ${scenario} scenario`,
      });
      setAiInsight(res.insight);
      setIsLiveAI(res.isLiveAI);
    } catch {
      setAiInsight(
        `${activeMed.name} (${activeMed.dosage}) has ${currentStock} ${activeMed.unit} remaining. At current consumption rate of ${dailyConsumption} ${activeMed.unit}/day, projected stockout is within ${daysOfStockRemaining} days (${predictedStockoutDate}). Recommended action: Review inter-PHC redistribution or place depot requisition.`
      );
      setIsLiveAI(false);
    } finally {
      setIsAiLoading(false);
    }
  }, [activeMed, scenario, currentStock, dailyConsumption, daysOfStockRemaining, predictedStockoutDate, scenarioMultiplier]);

  useEffect(() => {
    fetchAiInsight();
  }, [fetchAiInsight]);

  return (
    <div id="ai-demand-forecast-view" className="space-y-6">
      {/* Header & Scenario Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                {t.demandForecastTitle}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-600" />
                Powered by Gemini
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'ऐतिहासिक/डेमो खपत पैटर्न पर आधारित एआई-सहायता प्राप्त मांग पूर्वानुमान।'
                : 'AI-assisted demand forecasting based on historical/demo consumption patterns.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <select
              value={selectedMedicineId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            >
              {computedMedicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.stockoutRisk.toUpperCase()} - {m.daysOfStockRemaining}d)
                </option>
              ))}
            </select>

            <button
              onClick={onOpenOptimizer}
              className="w-full sm:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              {language === 'hi' ? 'ऑप्टिमाइज़र से समाधान करें' : 'Solve with Optimizer'}
            </button>
          </div>
        </div>

        {/* Scenario Switcher Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" />
              {language === 'hi' ? 'पूर्वानुमान परिदृश्य:' : 'Predictive Scenario:'}
            </span>
            <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setScenario('baseline')}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded font-semibold text-center transition-all cursor-pointer ${
                  scenario === 'baseline'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.forecastScenarioBaseline} (1.0x)
              </button>
              <button
                onClick={() => setScenario('monsoon')}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded font-semibold text-center transition-all cursor-pointer ${
                  scenario === 'monsoon'
                    ? 'bg-white text-cyan-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.forecastScenarioMonsoon} (+25%)
              </button>
              <button
                onClick={() => setScenario('epidemic')}
                className={`w-full sm:w-auto px-2.5 sm:px-3 py-1 rounded font-semibold text-center transition-all mt-1 sm:mt-0 cursor-pointer ${
                  scenario === 'epidemic'
                    ? 'bg-white text-rose-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.forecastScenarioEpidemic} (+45%)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold cursor-pointer flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={showIntervention}
                onChange={(e) => setShowIntervention(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              {language === 'hi' ? 'पुनर्आवंटन वक्र दिखाएं (+300u)' : 'Show Reallocation Curve (+300u)'}
            </label>
          </div>
        </div>
      </div>

      {/* AI NATURAL LANGUAGE INSIGHT BOX (POWERED BY GEMINI) */}
      <div
        id="ai-demand-insight-card"
        className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-cyan-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {t.geminiExplainerTitle}
              </span>
              <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px] font-bold">
                Powered by Gemini
              </span>
            </div>
            {isAiLoading ? (
              <p className="text-xs text-cyan-200/80 animate-pulse mt-1">
                {language === 'hi'
                  ? 'जेमिनी ऐतिहासिक और डेमो खपत पैटर्न का विश्लेषण कर रहा है...'
                  : 'Gemini is analyzing historical consumption patterns and demand velocity...'}
              </p>
            ) : (
              <p className="text-xs text-slate-200 mt-1 leading-relaxed font-medium">
                &ldquo;{aiInsight}&rdquo;
              </p>
            )}
          </div>
        </div>

        <button
          onClick={fetchAiInsight}
          disabled={isAiLoading}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-cyan-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">{language === 'hi' ? 'पुनः उत्पन्न करें' : 'Regenerate'}</span>
        </button>
      </div>

      {/* 5 Deterministic Trajectory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Current Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock'}
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {currentStock.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">{activeMed.unit} in inventory</span>
        </div>

        {/* 2. Daily Consumption */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'hi' ? 'दैनिक खपत' : 'Daily Consumption'}
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {dailyConsumption}
          </div>
          <span className="text-[10px] text-slate-500">{activeMed.unit} / day</span>
        </div>

        {/* 3. Projected Demand */}
        <div className="bg-cyan-50/70 rounded-xl border border-cyan-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-cyan-800">
            {language === 'hi' ? 'अनुमानित 7-दिवसीय मांग' : 'Projected 7-Day Demand'}
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-950 mt-1">
            {projectedDemand7d.toLocaleString()}
          </div>
          <span className="text-[10px] text-cyan-700 font-medium">
            {scenario.toUpperCase()} scenario
          </span>
        </div>

        {/* 4. Days Remaining */}
        <div
          className={`rounded-xl border p-4 shadow-sm ${
            daysOfStockRemaining <= 3
              ? 'bg-rose-50 border-rose-200'
              : daysOfStockRemaining <= 7
              ? 'bg-orange-50 border-orange-200'
              : daysOfStockRemaining <= 14
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <span
            className={`text-[11px] font-semibold ${
              daysOfStockRemaining <= 3
                ? 'text-rose-800'
                : daysOfStockRemaining <= 7
                ? 'text-orange-800'
                : daysOfStockRemaining <= 14
                ? 'text-amber-800'
                : 'text-emerald-800'
            }`}
          >
            {language === 'hi' ? 'शेष स्टॉक के दिन' : 'Days Remaining'}
          </span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              daysOfStockRemaining <= 3
                ? 'text-rose-900'
                : daysOfStockRemaining <= 7
                ? 'text-orange-900'
                : daysOfStockRemaining <= 14
                ? 'text-amber-900'
                : 'text-emerald-900'
            }`}
          >
            {daysOfStockRemaining} {language === 'hi' ? 'दिन' : 'Days'}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider block mt-0.5">
            <RiskBadge level={stockoutRisk} size="sm" language={language} />
          </span>
        </div>

        {/* 5. Projected Stock-out */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-600">
            {language === 'hi' ? 'अनुमानित स्टॉक-आउट' : 'Projected Stock-out'}
          </span>
          <div className="text-sm font-bold font-mono text-slate-900 mt-1 truncate">
            {predictedStockoutDate}
          </div>
          <span className="text-[10px] text-slate-500">
            {daysOfStockRemaining <= 3
              ? (language === 'hi' ? 'तत्काल ध्यान आवश्यक' : 'Immediate action required')
              : (language === 'hi' ? 'मानक आपूर्ति बफर' : 'Standard buffer')}
          </span>
        </div>
      </div>

      {/* Main Recharts Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'मांग खपत एवं इन्वेंटरी क्षरण वक्र' : 'Demand Consumption & Inventory Depletion Curve'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'ठोस रेखा दर्ज ऐतिहासिक मांग दर्शाती है; बिंदीदार रेखा खपत गति के आधार पर 7-दिवसीय अनुमान दर्शाती है।'
                : 'Solid line represents recorded historical demand; dashed line represents 7-day forward consumption projection with estimated variance envelope.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-800 inline-block" /> {language === 'hi' ? 'ऐतिहासिक मांग' : 'Historical Demand'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-600 inline-block" /> {language === 'hi' ? 'पूर्वानुमानित मांग' : 'Forecast Demand'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" /> {t.unintervenedStockCurve}
            </span>
            {showIntervention && (
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" /> {t.intervenedStockCurve}
              </span>
            )}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '10px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />

              {/* Confidence interval area */}
              <Area
                type="monotone"
                dataKey="upperConfidence"
                stroke="none"
                fill="#06b6d4"
                fillOpacity={0.12}
                name="Variance Envelope (+15%)"
              />

              {/* Historical recorded demand */}
              <Line
                type="monotone"
                dataKey="historicalDemand"
                name="Historical Demand"
                stroke="#1e293b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#1e293b' }}
              />

              {/* Projected future demand */}
              <Line
                type="monotone"
                dataKey="projectedDemandAdjusted"
                name="Projected Demand"
                stroke="#0891b2"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#0891b2' }}
              />

              {/* Stock remaining without transfer */}
              <Line
                type="monotone"
                dataKey="projectedStockRemaining"
                name="Stock Remaining (Unmitigated)"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ef4444' }}
              />

              {/* Stock remaining with transfer */}
              {showIntervention && (
                <Line
                  type="monotone"
                  dataKey="intervenedStockRemaining"
                  name="Stock Remaining (After Reallocation)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              )}

              {/* Stock-out Threshold Line */}
              <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} label="Stockout Floor" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transparent Model Telemetry & Consumption Patterns Box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-700" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            {language === 'hi'
              ? 'पूर्वानुमान मॉडल टेलीमेट्री एवं खपत पैटर्न'
              : 'Forecast Model Telemetry & Consumption Patterns'}
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {language === 'hi'
            ? 'मांग पूर्वानुमान ऐतिहासिक दैनिक खपत दरों, स्थानीय मौसमी मांग गुणांक और नैदानिक प्राथमिकताओं के संयोजन पर आधारित है। इन-हैंड स्टॉक और दैनिक उपयोग दर का उपयोग करके स्टॉकआउट दिनों की गणना पूर्ण रूप से नियतात्मक (deterministic) है।'
            : 'Demand projections combine historical daily dispensing velocity, seasonal scenario multipliers, and clinical surge factors. Days of stock remaining and projected stockout dates are calculated using strict deterministic formulas (Stock ÷ Daily Consumption).'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Methodology</span>
            <span className="font-bold text-slate-900">AI-Assisted Demand Forecasting (Consumption Patterns)</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Deterministic Days Engine</span>
            <span className="font-bold text-emerald-700 font-mono">Stock ÷ Daily Burn (Real-time)</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Explanation Engine</span>
            <span className="font-bold text-slate-900">Gemini Clinical Insight (with offline fallback)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

