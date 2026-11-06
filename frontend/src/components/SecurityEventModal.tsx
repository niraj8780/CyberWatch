import React, { useState } from 'react';
import {
  X,
  Shield,
  Clock,
  Terminal,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  FileCode,
} from 'lucide-react';
import { SecurityEvent } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface SecurityEventModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
}

export const SecurityEventModal: React.FC<SecurityEventModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedConfidence = `${Math.round(event.confidence * 100)}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#0f172a] border border-[#334155] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between bg-[#111c33]/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400 tracking-wider">
                  {event.rule_id}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-cyan-400 uppercase">
                  {event.detection_type}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 mt-0.5">
                {event.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SeverityBadge severity={event.severity} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Key Context Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#131d33] border border-[#223254] rounded-lg p-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Detected Time
              </span>
              <p className="font-mono text-xs text-slate-200 mt-1">
                {new Date(event.timestamp).toLocaleTimeString()}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {new Date(event.timestamp).toLocaleDateString()}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Process / PID
              </span>
              <p className="font-mono text-xs text-slate-200 mt-1 truncate">
                {event.process_name || 'System / Unattributed'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                PID: {event.pid ?? 'N/A'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400">
                Confidence Rating
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: formattedConfidence }}
                  />
                </div>
                <span className="font-mono text-xs text-cyan-300 font-semibold">
                  {formattedConfidence}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400">
                Transport Protocol
              </span>
              <p className="font-mono text-xs text-slate-200 mt-1">
                {(event.protocol || 'TCP').toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                ID: {event.id}
              </p>
            </div>
          </div>

          {/* Network Socket Trajectory */}
          <div className="bg-[#131d33] border border-[#223254] rounded-lg p-3">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2">
              Network Trajectory
            </span>
            <div className="flex items-center justify-between font-mono text-xs bg-[#0b101e] px-4 py-2.5 rounded border border-[#1b2640]">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">SOURCE</span>
                <span className="text-slate-200 font-medium">
                  {event.source_ip || '*'}:{event.source_port || '*'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 mx-2" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400">DESTINATION</span>
                <span className="text-rose-300 font-medium">
                  {event.dest_ip || '*'}:{event.dest_port || '*'}
                </span>
              </div>
            </div>
          </div>

          {/* Threat Explanation */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Threat Description & Analysis
            </h3>
            <div className="bg-[#131d33] border border-[#223254] rounded-lg p-3.5 text-slate-300 leading-relaxed text-xs">
              {event.description}
            </div>
          </div>

          {/* Technical Evidence Payload */}
          {event.evidence && Object.keys(event.evidence).length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                Technical Evidence
              </h3>
              <div className="bg-[#090d16] border border-[#1b2640] rounded-lg p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-40">
                <pre>{JSON.stringify(event.evidence, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* SOC Recommended Investigation Checklist */}
          {event.recommendations && event.recommendations.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Recommended SOC Remediation Checklist
              </h3>
              <div className="space-y-2">
                {event.recommendations.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-[#131d33] border border-[#223254] rounded-lg p-3 text-xs text-slate-300"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-snug pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1e293b] flex items-center justify-between bg-[#111c33]/70">
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-slate-100 bg-[#1e293b] hover:bg-[#334155] px-3 py-1.5 rounded-lg border border-[#334155] transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Event JSON</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-200 bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 rounded-lg transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
