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
        className="bg-[#0f172a] border border-[#334155] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between bg-[#111c33]/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{alert.id}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-xs text-slate-400">
                  {new Date(alert.created_at).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 mt-0.5">{alert.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} size="sm" />
            <AlertStatusBadge status={alert.status} size="sm" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Action Ribbon: Triage Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#131d33] border border-[#223254] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px] uppercase">Incident State:</span>
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
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded text-xs font-mono font-medium shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze with AI</span>
              </button>
            )}
          </div>

          {/* Context Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#131d33] border border-[#223254] rounded-lg p-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Assigned To</span>
              <p className="font-mono text-slate-200 mt-1 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                {alert.assigned_to}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Process (PID)</span>
              <p className="font-mono text-slate-200 mt-1 truncate">
                {alert.process_name || 'System'}{' '}
                {alert.pid ? <span className="text-slate-500">({alert.pid})</span> : ''}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Network Path</span>
              <p className="font-mono text-slate-200 mt-1 flex items-center gap-1 truncate">
                <span>{alert.source_ip || '*'}:{alert.source_port || '*'}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-rose-300 font-bold">{alert.dest_ip || '*'}:{alert.dest_port || '*'}</span>
              </p>
            </div>
          </div>

          {/* Incident Description */}
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
              Incident Narrative
            </span>
            <div className="p-3 bg-[#131d33] border border-[#223254] rounded-lg text-slate-300 leading-relaxed text-xs">
              {alert.description}
            </div>
          </div>

          {/* Remediation Recommendations */}
          {alert.recommendations && alert.recommendations.length > 0 && (
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
                Containment Checklist
              </span>
              <div className="space-y-1.5">
                {alert.recommendations.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-[#131d33] border border-[#223254] rounded text-slate-300 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst Notes Log */}
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              Triage Investigation Notes ({alert.notes.length})
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto mb-2">
              {alert.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 bg-[#0a0e17] border border-[#1b2640] rounded text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-cyan-400 font-bold">{note.author}</span>
                    <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300">{note.content}</p>
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
                className="flex-1 bg-[#131d33] border border-[#223254] rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs disabled:opacity-40 flex items-center gap-1 transition"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1e293b] flex justify-end bg-[#111c33]/70">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
