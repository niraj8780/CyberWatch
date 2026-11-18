import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  Send,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { updateAlert } from '../services/api';
import { Alert, AlertStatus } from '../types';
import { AlertStatusBadge } from './AlertStatusBadge';
import { SeverityBadge } from './SeverityBadge';

interface IncidentTriageModalProps {
  alert: Alert | null;
  onClose: () => void;
  onUpdated: () => void;
  onOpenAIInvestigate?: (alert: Alert) => void;
}

export const IncidentTriageModal: React.FC<IncidentTriageModalProps> = ({
  alert,
  onClose,
  onUpdated,
  onOpenAIInvestigate,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!alert) return null;

  const handleStatusChange = async (newStatus: AlertStatus) => {
    setIsSubmitting(true);
    try {
      await updateAlert(alert.id, {
        status: newStatus,
        note: `Status updated to ${newStatus.toUpperCase()} by SOC Analyst.`,
      });
      onUpdated();
    } catch (err) {
      console.error('Failed to update alert status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await updateAlert(alert.id, { note: newNote });
      setNewNote('');
      onUpdated();
    } catch (err) {
      console.error('Failed to append triage note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{alert.id}</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(alert.created_at).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-base font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{alert.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} size="sm" />
            <AlertStatusBadge status={alert.status} size="sm" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition ml-2"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Action Ribbon: Triage Controls */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase" style={{ color: 'var(--text-secondary)' }}>Incident State:</span>
              {alert.status !== 'acknowledged' && alert.status !== 'resolved' && (
                <button
                  disabled={isSubmitting}
                  onClick={() => handleStatusChange('acknowledged' as AlertStatus)}
                  className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded text-xs font-mono transition"
                >
                  Acknowledge
                </button>
              )}
              {alert.status !== 'resolved' && (
                <button
                  disabled={isSubmitting}
                  onClick={() => handleStatusChange('resolved' as AlertStatus)}
                  className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded text-xs font-mono transition"
                >
                  Mark Resolved
                </button>
              )}
              {alert.status === 'resolved' && (
                <span className="text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Incident Closed
                </span>
              )}
            </div>

            {onOpenAIInvestigate && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAIInvestigate(alert);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition"
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  boxShadow: 'var(--accent-glow)',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze with AI</span>
              </button>
            )}
          </div>

          {/* Context Details */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg p-3"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <div>
              <span className="text-[10px] uppercase font-mono" style={{ color: 'var(--text-secondary)' }}>Assigned To</span>
              <p className="font-mono mt-1 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                <User className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                {alert.assigned_to}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono" style={{ color: 'var(--text-secondary)' }}>Process (PID)</span>
              <p className="font-mono mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {alert.process_name || 'System'}{' '}
                {alert.pid ? <span style={{ color: 'var(--text-muted)' }}>({alert.pid})</span> : ''}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-mono" style={{ color: 'var(--text-secondary)' }}>Network Path</span>
              <p className="font-mono mt-1 flex items-center gap-1 truncate" style={{ color: 'var(--text-primary)' }}>
                <span>{alert.source_ip || '*'}:{alert.source_port || '*'}</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="text-rose-300 font-bold">{alert.dest_ip || '*'}:{alert.dest_port || '*'}</span>
              </p>
            </div>
          </div>

          {/* Incident Description */}
          <div>
            <span className="text-[11px] font-mono uppercase block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Incident Narrative
            </span>
            <div
              className="p-3 rounded-lg leading-relaxed text-xs"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {alert.description}
            </div>
          </div>

          {/* Remediation Recommendations */}
          {alert.recommendations && alert.recommendations.length > 0 && (
            <div>
              <span className="text-[11px] font-mono uppercase block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Containment Checklist
              </span>
              <div className="space-y-1.5">
                {alert.recommendations.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded text-xs"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst Notes Log */}
          <div>
            <span className="text-[11px] font-mono uppercase block mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              Triage Investigation Notes ({alert.notes.length})
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto mb-2">
              {alert.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded text-xs space-y-1 font-mono"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>{note.author}</span>
                    <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{note.content}</p>
                </div>
              ))}
            </div>

            {/* Append Note Input */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add analyst investigation note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 rounded px-3 py-1.5 text-xs placeholder-slate-500 focus:outline-none font-mono"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className="px-3 py-1.5 rounded font-mono text-xs disabled:opacity-40 flex items-center gap-1 transition"
                style={{ background: 'var(--accent)', color: '#000', fontWeight: 600 }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex justify-end"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-mono transition"
            style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
