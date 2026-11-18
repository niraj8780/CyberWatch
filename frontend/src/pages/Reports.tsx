import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Cpu,
  Layers,
  Award,
} from 'lucide-react';
import { getExecutiveReport, getReportCsvDownloadUrl } from '../services/api';
import { ExecutiveReport } from '../types';

export const Reports: React.FC = () => {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getExecutiveReport();
      setReport(data);
    } catch (err) {
      console.error('Failed to load executive report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const url = getReportCsvDownloadUrl();
    window.open(url, '_blank');
  };

  const scoreColor =
    (report?.overall_posture_score ?? 0) >= 80
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : (report?.overall_posture_score ?? 0) >= 60
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/40 bg-rose-500/10';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              Executive Security Reports &amp; Audit Export
            </h1>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
              }}
            >
              Compliance &amp; Posture
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Automated enterprise security posture assessments, compliance frameworks alignment, and CSV/PDF export.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 rounded-lg text-xs font-mono transition"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            title="Refresh Audit"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono transition"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <Download className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition shadow-lg"
            style={{
              background: 'var(--accent)',
              color: '#050810',
              boxShadow: '0 0 15px var(--accent-glow)',
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-mono flex flex-col items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
          <RotateCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
          <span>Generating comprehensive security posture digest...</span>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Posture Score Top Card */}
          <div
            className="rounded-xl p-6 shadow-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span
                  className="text-[11px] font-mono uppercase tracking-widest font-semibold flex items-center gap-1.5"
                  style={{ color: 'var(--accent)' }}
                >
                  <Award className="w-4 h-4" />
                  Host Posture Evaluation
                </span>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {report.hostname} — Security Health Index
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {report.executive_summary}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono pt-2" style={{ color: 'var(--text-muted)' }}>
                  <span>Audited Sockets: <strong style={{ color: 'var(--text-primary)' }}>{report.total_sockets_audited}</strong></span>
                  <span>•</span>
                  <span>Open Alerts: <strong className="text-amber-400">{report.open_alerts_count}</strong></span>
                  <span>•</span>
                  <span>Resolved: <strong className="text-emerald-400">{report.resolved_incidents_count}</strong></span>
                </div>
              </div>

              {/* Circular / Large Score Badge */}
              <div
                className="flex flex-col items-center justify-center p-6 rounded-2xl min-w-[200px]"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <span className="text-[10px] uppercase font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Posture Rating
                </span>
                <div className={`text-4xl font-extrabold font-mono mt-1 ${scoreColor.split(' ')[0]}`}>
                  {report.overall_posture_score}
                  <span className="text-lg opacity-60 font-normal">/100</span>
                </div>
                <span
                  className={`mt-2 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${scoreColor}`}
                >
                  {report.risk_tier} RISK
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Framework Scorecards */}
          <div>
            <h3
              className="text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Enterprise Cybersecurity Compliance Posture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.compliance_evaluations.map((comp, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-4 shadow-lg space-y-3 flex flex-col justify-between"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {comp.framework.split('(')[0].trim()}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          comp.status === 'Compliant'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                      {comp.details}
                    </p>
                  </div>

                  <div
                    className="pt-2 flex items-center justify-between font-mono text-xs"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Alignment</span>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>{comp.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Remediation Directives */}
          <div
            className="rounded-xl p-5 shadow-lg space-y-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Strategic Security Recommendations
            </h3>
            <div className="space-y-2">
              {report.strategic_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg text-xs font-mono"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                  >
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
