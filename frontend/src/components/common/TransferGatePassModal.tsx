import React, { useEffect } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Building2,
  Pill,
  FileText,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { LanguageCode } from '../../utils/i18n';
import { DemoPersonaId } from '../../types';
import { DEMO_PERSONAS } from './Header';

export interface TransferGatePassData {
  transferId: string;
  timestamp: string;
  status: 'completed' | 'dispatched' | 'approved' | string;
  priority?: string;
  
  // Donor Details
  donorPhcName: string;
  donorDistrict?: string;
  donorState?: string;
  donorSafeSurplus?: number;
  donorBufferDays?: number;
  donorInHandStock?: number;

  // Recipient Details
  targetPhcName: string;
  targetDistrict?: string;
  targetState?: string;
  targetPreStockDays?: number;
  targetPostStockDays?: number;

  // Resource Details
  medicineName: string;
  medicineCategory?: string;
  quantity: number;
  unit?: string;
  batchNumber?: string;

  // Logistics Details
  distanceKm?: number;
  transitMinutes?: number;
  carrier?: string;
  corridor?: string;
  temperatureCelsius?: number;
  guardrailStatus?: string;

  // AI & Rationale
  reasoningPillars?: string[];
  explanation?: string;

  // Sign-off
  approvedBy?: string;
  approvedRole?: string;
}

interface TransferGatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TransferGatePassData | null;
  language?: LanguageCode;
  activePersonaId?: DemoPersonaId;
}

export const TransferGatePassModal: React.FC<TransferGatePassModalProps> = ({
  isOpen,
  onClose,
  data,
  language = 'en',
  activePersonaId = 'dho',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const currentPersona = DEMO_PERSONAS.find((p) => p.id === activePersonaId) || DEMO_PERSONAS[0];
  const approverName = data.approvedBy || (language === 'hi' ? currentPersona.nameHi : currentPersona.name);
  const approverRole = data.approvedRole || (language === 'hi' ? currentPersona.roleBadgeHi : currentPersona.roleBadge);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Transfer Gate Pass Preview"
    >
      {/* Modal Card Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Screen-only Modal Header Bar */}
        <div className="no-print px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {language === 'hi' ? 'हस्तांतरण गेट पास पूर्वावलोकन' : 'Transfer Gate Pass Preview'}
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-cyan-900 text-cyan-200 rounded border border-cyan-700">
                  {data.transferId}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'प्रदर्शन और प्रिंट के लिए आधिकारिक हस्तांतरण प्रपत्र' : 'Browser-native printable manifest for verified inter-PHC transfers'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Print Transfer Gate Pass"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'प्रिंट करें (A4)' : 'Print Pass (A4)'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
          <div
            id="transfer-gate-pass-print-area"
            className="printable-gate-pass bg-white rounded-xl shadow-xs border border-slate-300 p-6 sm:p-8 text-slate-900 mx-auto max-w-[760px] space-y-5"
          >
            {/* Top Prototype Watermark / Notice Banner */}
            <div className="border border-slate-300 bg-slate-50 rounded-lg p-2.5 flex items-center justify-between text-[10px] text-slate-600 font-mono">
              <span className="font-bold tracking-wider text-slate-800 uppercase flex items-center gap-1">
                <Info className="w-3 h-3 text-cyan-700 shrink-0" />
                DEMO / PROTOTYPE — NOT A GOVERNMENT DOCUMENT
              </span>
              <span className="text-slate-500">Autonomous Logistics Protocol v4.2</span>
            </div>

            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                    MP
                  </div>
                  <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                    MedPulse Telemetry Network
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  RESOURCE TRANSFER GATE PASS
                </h1>
                <p className="text-xs text-slate-500">
                  Automated Inter-Facility Medicine Redistribution & Cold-Chain Transit Manifest
                </p>
              </div>

              {/* Manifest Metadata Box */}
              <div className="text-right sm:text-right font-mono text-xs space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px] uppercase font-sans">Pass Reference Number</div>
                <div className="font-bold text-slate-900 text-sm">{data.transferId}</div>
                <div className="text-[10px] text-emerald-700 font-bold uppercase flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  STATUS: {data.status.toUpperCase()}
                </div>
                <div className="text-[10px] text-slate-500">{data.timestamp}</div>
              </div>
            </div>

            {/* Donor & Recipient Dual Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Donor (Origin) */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-600" />
                  ORIGIN (DONOR NODE)
                </div>
                <div className="font-bold text-sm text-slate-900">{data.donorPhcName}</div>
                <div className="text-xs text-slate-600">
                  {data.donorDistrict || 'Pune District'}, {data.donorState || 'Maharashtra'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/80 space-y-0.5">
                  <div>Safe Surplus: <span className="font-bold text-slate-800">+{data.donorSafeSurplus || 300}u verified</span></div>
                  <div>Safety Buffer Preserved: <span className="text-emerald-700 font-bold">{data.donorBufferDays || '10+'} Days Safe</span></div>
                </div>
              </div>

              {/* Recipient (Destination) */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-cyan-600" />
                  DESTINATION (RECIPIENT NODE)
                </div>
                <div className="font-bold text-sm text-slate-900">{data.targetPhcName}</div>
                <div className="text-xs text-slate-600">
                  {data.targetDistrict || 'Pune District'}, {data.targetState || 'Maharashtra'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/80 space-y-0.5">
                  <div>Pre-Transfer Coverage: <span className="font-bold text-rose-700">{data.targetPreStockDays || 1.2} Days (Critical)</span></div>
                  <div>Post-Transfer Coverage: <span className="text-cyan-700 font-bold">{data.targetPostStockDays || 8.7} Days Safe</span></div>
                </div>
              </div>
            </div>

            {/* Consignment Resource Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white px-3.5 py-2 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-cyan-400" />
                  CONSIGNMENT PARTICULARS
                </span>
                <span className="text-[10px] font-mono text-cyan-200">
                  Priority: {data.priority || 'HIGH — IMMINENT SHORTAGE PREVENTION'}
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3.5">Resource Description</th>
                    <th className="py-2 px-3.5">Category</th>
                    <th className="py-2 px-3.5 text-right">Authorized Qty</th>
                    <th className="py-2 px-3.5 text-right">Unit / Batch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {data.medicineName}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      {data.medicineCategory || 'Essential Primary Care'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-sm text-cyan-800">
                      {data.quantity} {data.unit || 'Units'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-500">
                      {data.batchNumber || 'BATCH-2026-MED01'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Logistics & Transit Route */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Truck className="w-3 h-3 text-cyan-600" />
                LOGISTICS & CHAIN OF CUSTODY
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block font-sans">Distance</span>
                  <span className="font-bold text-slate-800">{data.distanceKm ? `${data.distanceKm} km` : '18.4 km'}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block font-sans">Est. Transit</span>
                  <span className="font-bold text-slate-800">~{data.transitMinutes || 28} mins</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block font-sans">Carrier Vehicle</span>
                  <span className="font-bold text-slate-800 truncate block" title={data.carrier}>
                    {data.carrier || 'Cold-Chain Van Alpha-2'}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block font-sans">Temperature</span>
                  <span className="font-bold text-emerald-700">
                    {data.temperatureCelsius !== undefined ? `+${data.temperatureCelsius}°C` : '+4.1°C Active'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Guardrail Status: 10-Day Safe Surplus Rule Enforced • Zero Secondary Shortage Risk Guaranteed.</span>
              </div>
            </div>

            {/* AI Decision Support Rationale (if available) */}
            {data.explanation && (
              <div className="border border-cyan-200 bg-cyan-50/50 rounded-xl p-3 text-xs space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-600" />
                  AI DECISION SUPPORT (GEMINI TELEMETRY)
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed italic">
                  &ldquo;{data.explanation}&rdquo;
                </p>
                {data.reasoningPillars && data.reasoningPillars.length > 0 && (
                  <ul className="text-[10px] text-slate-600 list-disc list-inside space-y-0.5 pt-0.5">
                    {data.reasoningPillars.slice(0, 2).map((pillar, idx) => (
                      <li key={idx} className="truncate">{pillar}</li>
                    ))}
                  </ul>
                )}
                <div className="text-[9px] text-slate-400">
                  * Note: AI decision support is generated for clinical and operational planning context; non-prescriptive.
                </div>
              </div>
            )}

            {/* Sign-off & Verification Matrix */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  AUTHORIZED BY (DEMO OPERATIONAL PERSONA)
                </span>
                <div className="font-bold text-slate-900">{approverName}</div>
                <div className="text-[11px] text-slate-600">{approverRole}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-2">
                  Digital Timestamp: {data.timestamp}
                </div>
              </div>

              <div className="space-y-1 text-right flex flex-col items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    TELEMETRY VERIFICATION HASH
                  </span>
                  <div className="font-mono text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200 mt-1">
                    SHA-256: 8f4a-92b1-c03e-77d4
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  MedPulse Demo Node • Non-Production Manifest
                </div>
              </div>
            </div>

            {/* Document Footer Disclaimer */}
            <div className="pt-2 border-t border-dashed border-slate-200 text-center text-[9px] text-slate-400 font-mono">
              Generated by MedPulse Autonomous Resource Telemetry Grid • Synthetic Demonstration Data
            </div>
          </div>
        </div>

        {/* Screen-only Modal Footer */}
        <div className="no-print px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            {language === 'hi'
              ? 'प्रिंट करने के लिए ऊपर दिए गए "प्रिंट करें (A4)" बटन का उपयोग करें।'
              : 'Click "Print Pass (A4)" or use Ctrl+P / Cmd+P to print.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'प्रिंट करें' : 'Print Gate Pass'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
