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
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Executive Security Reports & Audit Export
            </h1>
            <span className="font-mono text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Compliance & Posture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated enterprise security posture assessments, compliance frameworks alignment, and CSV/PDF export.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 bg-[#172136] hover:bg-[#22304d] text-slate-300 border border-[#2d3548] rounded-lg text-xs font-mono transition"
            title="Refresh Audit"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#172136] hover:bg-[#22304d] text-slate-200 border border-[#2d3548] rounded-lg text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg text-xs font-mono font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-slate-400 flex flex-col items-center gap-3">
          <RotateCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Generating comprehensive security posture digest...</span>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Posture Score Top Card */}
          <div className="bg-[#111827] border border-[#2d3548] rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Host Posture Evaluation
                </span>
                <h2 className="text-lg font-bold text-slate-100">
                  {report.hostname} — Security Health Index
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {report.executive_summary}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2">
                  <span>Audited Sockets: <strong className="text-slate-200">{report.total_sockets_audited}</strong></span>
                  <span>•</span>
                  <span>Open Alerts: <strong className="text-amber-400">{report.open_alerts_count}</strong></span>
                  <span>•</span>
                  <span>Resolved: <strong className="text-emerald-400">{report.resolved_incidents_count}</strong></span>
                </div>
              </div>

              {/* Circular / Large Score Badge */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0c121e] border border-[#223254] min-w-[200px]">
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                  Posture Rating
                </span>
                <div className={`text-4xl font-extrabold font-mono mt-1 ${scoreColor.split(' ')[0]}`}>
                  {report.overall_posture_score}
                  <span className="text-lg text-slate-500 font-normal">/100</span>
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
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Enterprise Cybersecurity Compliance Posture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.compliance_evaluations.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-[#111827] border border-[#2d3548] rounded-xl p-4 shadow-lg space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate">
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
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {comp.details}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400 text-[10px]">Alignment</span>
                    <span className="font-bold text-cyan-400">{comp.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Remediation Directives */}
          <div className="bg-[#111827] border border-[#2d3548] rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Strategic Security Recommendations
            </h3>
            <div className="space-y-2">
              {report.strategic_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-[#131d33] border border-[#223254] rounded-lg text-xs text-slate-300 font-mono"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
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
