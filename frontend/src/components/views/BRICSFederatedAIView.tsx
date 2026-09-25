import React, { useState } from 'react';
import {
  Globe2,
  ShieldCheck,
  Cpu,
  Lock,
  RefreshCw,
  Layers,
  Database,
  CheckCircle2,
  Zap,
  ArrowRight,
  TrendingUp,
  Server,
  Share2,
} from 'lucide-react';
import { FEDERATED_NODES } from '../../data/mockData';
import { FederatedNode } from '../../types';
import { LanguageCode, getTranslation } from '../../utils/i18n';

interface BRICSFederatedAIViewProps {
  language?: LanguageCode;
}

export const BRICSFederatedAIView: React.FC<BRICSFederatedAIViewProps> = ({
  language = 'en',
}) => {
  const t = getTranslation(language);
  const [nodes, setNodes] = useState<FederatedNode[]>(FEDERATED_NODES);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(142);

  const totalRecordsTrained = nodes.reduce((acc, n) => acc + n.recordsTrained, 0);

  const handleTriggerFederatedSync = () => {
    setIsSyncing(true);
    setSyncSuccess(false);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setCurrentEpoch((prev) => prev + 1);

      // Refresh node sync times
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          lastSync: language === 'hi' ? 'अभी-अभी' : 'Just now',
          lossMetric: Number((n.lossMetric * 0.98).toFixed(3)),
        }))
      );

      setTimeout(() => setSyncSuccess(false), 5000);
    }, 2200);
  };

  return (
    <div id="brics-federated-ai-view" className="space-y-6">
      {/* Sovereign Privacy Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                {language === 'hi' ? 'ब्रिक्स स्वास्थ्य एन्क्लेव प्रोटोकॉल' : 'BRICS Health Enclave Protocol'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {language === 'hi' ? 'सर्वसम्मति कोरम: 5/5 सक्रिय' : 'Consensus Quorum: 5/5 Active'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-indigo-400" />
              {language === 'hi' ? 'ब्रिक्स संप्रभु फेडेरेटेड AI नेटवर्क' : 'BRICS Sovereign Federated AI Network'}
            </h1>
            <p className="text-xs text-indigo-200/90 max-w-3xl mt-0.5 font-medium leading-relaxed">
              {language === 'hi' ? (
                <>
                  कठोर गणितीय गोपनीयता:{' '}
                  <span className="text-white font-bold">
                    &ldquo;स्थानीय रूप से प्रशिक्षित करें, वैश्विक स्तर पर एकत्रित करें, केवल मॉडल भार साझा करें — कभी भी कच्चा मरीज डेटा नहीं।&rdquo;
                  </span>{' '}
                  राष्ट्रीय सीमाओं के पार शून्य मेडिकल रिकॉर्ड जाते हैं; केवल एन्क्रिप्टेड ग्रेडिएंट टेंसर संश्लेषित किए जाते हैं।
                </>
              ) : (
                <>
                  Strict Mathematical Privacy:{' '}
                  <span className="text-white font-bold">
                    &ldquo;Train locally, aggregate globally, share model weights only — NEVER raw patient data.&rdquo;
                  </span>{' '}
                  Zero medical records cross national borders; only encrypted gradient tensors are synthesized.
                </>
              )}
            </p>
          </div>

          <button
            onClick={handleTriggerFederatedSync}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 hover:scale-[1.01] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing
              ? (language === 'hi' ? 'ग्रेडिएंट एकत्रित हो रहे हैं...' : 'Aggregating Gradients...')
              : (language === 'hi' ? 'फेडेरेटेड भार सिंक चलाएं' : 'Run Federated Weight Sync')}
          </button>
        </div>

        {/* Sync Success Notification */}
        {syncSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {language === 'hi' ? (
                <>
                  <strong>फेडेरेटेड राउंड #{currentEpoch} पूर्ण:</strong> FedAvg + डिफरेंशियल प्राइवेसी (&epsilon;=0.85) के माध्यम से ग्रेडिएंट सुरक्षित रूप से एकत्रित किए गए। सभी 5 राष्ट्रीय केंद्रों में मॉडल भार अपडेट किए गए।
                </>
              ) : (
                <>
                  <strong>Federated Round #{currentEpoch} Completed:</strong> Gradients securely aggregated via FedAvg + Differential Privacy (&epsilon;=0.85). Model weights updated across all 5 national hubs.
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Global Aggregator Telemetry: 4 Macro Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'hi' ? 'ग्लोबल मॉडल संस्करण' : 'Global Model Version'}
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            MedPulse-v4.2
          </div>
          <span className="text-[10px] text-indigo-600 font-semibold font-mono">
            {language === 'hi' ? `युग #${currentEpoch}` : `Epoch #${currentEpoch}`}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'hi' ? 'संचयी प्रशिक्षित रिकॉर्ड' : 'Cumulative Records Trained'}
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {(totalRecordsTrained / 1000000).toFixed(2)}M {language === 'hi' ? 'मरीज' : 'Patients'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {language === 'hi' ? '100% अज्ञात एन्क्लेव' : '100% Anonymized Enclave'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'hi' ? 'गोपनीयता बजट (ε गारंटी)' : 'Privacy Budget (\u03b5 Guarantee)'}
          </span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            &epsilon; = 0.85
          </div>
          <span className="text-[10px] text-slate-500">
            {language === 'hi' ? 'औपचारिक विभेदक गोपनीयता' : 'Formal Differential Privacy'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'hi' ? 'क्रॉस-बॉर्डर सटीकता वृद्धि' : 'Cross-Border Accuracy Lift'}
          </span>
          <div className="text-xl font-bold font-mono text-cyan-700 mt-1">
            +18.4% {language === 'hi' ? 'वृद्धि' : 'Lift'}
          </div>
          <span className="text-[10px] text-cyan-600 font-semibold">
            {language === 'hi' ? 'पृथक स्थानीय मॉडल की तुलना में' : 'Vs isolated local model'}
          </span>
        </div>
      </div>

      {/* 5 Participating BRICS Sovereign Nodes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              {language === 'hi' ? 'संप्रभु राष्ट्रीय कंप्यूटिंग नोड्स' : 'Sovereign National Computing Nodes'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'प्रत्येक सदस्य देश डेटा निकास के बिना घरेलू नैदानिक ​​बुनियादी ढांचे पर तंत्रिका भार को प्रशिक्षित करता है।'
                : 'Each member country trains neural weights on domestic clinical infrastructure without data egress.'}
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {language === 'hi' ? '5 / 5 कोरम सिंक्रनाइज़्ड' : '5 / 5 Quorum Synchronized'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{node.flag}</span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{node.country}</h3>
                    <div className="text-[11px] text-slate-500">{node.institution}</div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {language === 'hi' ? 'सक्रिय' : 'ONLINE'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {language === 'hi' ? 'रिकॉर्ड्स' : 'Records'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {(node.recordsTrained / 1000).toLocaleString()}k
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {language === 'hi' ? 'हानि मीट्रिक' : 'Loss Metric'}
                  </span>
                  <span className="font-bold text-indigo-700">{node.lossMetric}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {language === 'hi' ? 'भार हैश' : 'Weight Hash'}
                  </span>
                  <span className="text-[11px] text-slate-600 truncate block">
                    {node.weightHash}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {language === 'hi' ? 'अंतिम एकत्रीकरण' : 'Last Aggregated'}
                  </span>
                  <span className="text-[11px] text-slate-600">{node.lastSync}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 font-sans">
                <strong>{language === 'hi' ? 'स्थानीय योगदान:' : 'Local Contribution:'}</strong> {node.contributedInsights}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Border Knowledge Transfer Case Study Box */}
      <div className="bg-indigo-50/60 rounded-2xl border border-indigo-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-700" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900">
            {language === 'hi'
              ? 'वास्तविक सीमा-पार महामारी विज्ञान ज्ञान स्थानांतरण प्रमाण'
              : 'Realized Cross-Border Epidemiological Transfer Proof'}
          </h3>
        </div>

        <p className="text-xs text-indigo-900 leading-relaxed">
          {language === 'hi' ? (
            <>
              2025/2026 दक्षिणी गोलार्ध मानसून चक्र के दौरान, ब्राजील के Fiocruz नोड ने उच्च सापेक्ष आर्द्रता के तहत बाल चिकित्सा श्वसन तनाव के संबंध में ग्रेडिएंट समायोजन का योगदान दिया। इन भारों को फेडेरेटेड वैश्विक मॉडल में शामिल करके, भारत के प्राथमिक स्वास्थ्य केंद्रों को एंटीबायोटिक-प्रतिरोधी ब्रोंकाइटिस के लिए <strong>14.2% पहले पहचान क्षितिज</strong> प्राप्त हुआ, जिससे भौतिक क्लिनिक कतारों में वृद्धि से 3.2 दिन पहले पूर्वव्यापी स्टॉक पुनर्वितरण संभव हो सका।
            </>
          ) : (
            <>
              During the 2025/2026 southern hemisphere monsoon cycle, Brazil&apos;s Fiocruz node contributed gradient adjustments regarding pediatric respiratory strain under high relative humidity. By incorporating these weights into the federated global model, India&apos;s primary health centers gained a <strong>14.2% earlier detection horizon</strong> for antibiotic-resistant bronchitis, enabling preemptive stock reallocation 3.2 days before physical clinic queues spiked.
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-indigo-800 pt-1">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />{' '}
            {language === 'hi' ? 'AES-256 GCM होमोमोर्फिक एन्क्रिप्शन' : 'AES-256 GCM Homomorphic Encryption'}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />{' '}
            {language === 'hi' ? 'GDPR और भारत DPDP अधिनियम 2023 अनुपालन' : 'GDPR & India DPDP Act 2023 Compliant'}
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />{' '}
            {language === 'hi' ? 'FedAvg भार समेकन प्रोटोकॉल' : 'FedAvg Weight Consolidation Protocol'}
          </span>
        </div>
      </div>
    </div>
  );
};
