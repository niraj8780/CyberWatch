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
        className="rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {event.rule_id}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span className="text-xs font-mono uppercase" style={{ color: 'var(--accent)' }}>
                  {event.detection_type}
                </span>
              </div>
              <h2 className="text-base font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {event.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SeverityBadge severity={event.severity} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Key Context Metrics Bar */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg p-3"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <div>
              <span className="text-[11px] font-mono uppercase flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                Detected Time
              </span>
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-primary)' }}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                {new Date(event.timestamp).toLocaleDateString()}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                Process / PID
              </span>
              <p className="font-mono text-xs mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {event.process_name || 'System / Unattributed'}
              </p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                PID: {event.pid ?? 'N/A'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase" style={{ color: 'var(--text-secondary)' }}>
                Confidence Rating
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: formattedConfidence, background: 'var(--accent)' }}
                  />
                </div>
                <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  {formattedConfidence}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase" style={{ color: 'var(--text-secondary)' }}>
                Transport Protocol
              </span>
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-primary)' }}>
                {(event.protocol || 'TCP').toUpperCase()}
              </p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                ID: {event.id}
              </p>
            </div>
          </div>

          {/* Network Socket Trajectory */}
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <span className="text-[11px] font-mono uppercase block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Network Trajectory
            </span>
            <div
              className="flex items-center justify-between font-mono text-xs px-4 py-2.5 rounded"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col">
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>SOURCE</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {event.source_ip || '*'}:{event.source_port || '*'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 mx-2" style={{ color: 'var(--accent)' }} />
              <div className="flex flex-col text-right">
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>DESTINATION</span>
                <span className="text-rose-300 font-medium">
                  {event.dest_ip || '*'}:{event.dest_port || '*'}
                </span>
              </div>
            </div>
          </div>

          {/* Threat Explanation */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              Threat Description &amp; Analysis
            </h3>
            <div
              className="rounded-lg p-3.5 leading-relaxed text-xs"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {event.description}
            </div>
          </div>

          {/* Technical Evidence Payload */}
          {event.evidence && Object.keys(event.evidence).length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <FileCode className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                Technical Evidence
              </h3>
              <div
                className="rounded-lg p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-40"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
              >
                <pre>{JSON.stringify(event.evidence, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* SOC Recommended Investigation Checklist */}
          {event.recommendations && event.recommendations.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                Recommended SOC Remediation Checklist
              </h3>
              <div className="space-y-2">
                {event.recommendations.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg p-3 text-xs"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full font-mono text-[10px] font-bold"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
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
        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                <span>Copy Event JSON</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="text-xs font-medium px-4 py-1.5 rounded-lg transition"
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 600 }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
