import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { createAlert, getAlerts, getAlertsSummary } from '../services/api';
import { Alert, AlertStatus, AlertSummary } from '../types';
import { KPICard } from '../components/KPICard';
import { AlertStatusBadge } from '../components/AlertStatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { IncidentTriageModal } from '../components/IncidentTriageModal';
import { IPIntelligenceModal } from '../components/IPIntelligenceModal';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedIP, setSelectedIP] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating alert
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSev, setNewSev] = useState('medium');
  const [newProc, setNewProc] = useState('');
  const [newIP, setNewIP] = useState('');

  const fetchAlertsData = useCallback(async () => {
    try {
      const [alertsRes, summaryRes] = await Promise.all([
        getAlerts({ limit: 100 }),
        getAlertsSummary(),
      ]);
      setAlerts(alertsRes.items || []);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertsData();
    const interval = setInterval(fetchAlertsData, 7000);
    return () => clearInterval(interval);
  }, [fetchAlertsData]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createAlert({
        title: newTitle,
        description: newDesc || 'Manually reported suspicious incident.',
        severity: newSev,
        process_name: newProc || undefined,
        dest_ip: newIP || undefined,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewProc('');
      setNewIP('');
      fetchAlertsData();
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.process_name && a.process_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.dest_ip && a.dest_ip.includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Alerts & Incident Management
            </h1>
            <span className="font-mono text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Phase 4 Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security incident response queue, triage workflows, and analyst ticketing.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg text-xs font-mono font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Raise Incident</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Open Incidents"
          value={(summary?.new_alerts ?? 0) + (summary?.acknowledged_alerts ?? 0)}
          subtitle={`New: ${summary?.new_alerts ?? 0} | In Progress: ${summary?.acknowledged_alerts ?? 0}`}
          icon={Bell}
          color="cyan"
          loading={loading}
        />
        <KPICard
          title="Critical / High Priority"
          value={(summary?.critical_alerts ?? 0) + (summary?.high_alerts ?? 0)}
          subtitle="Requires immediate containment"
          icon={AlertTriangle}
          color="red"
          loading={loading}
        />
        <KPICard
          title="Resolved Incidents"
          value={summary?.resolved_alerts ?? 0}
          subtitle="Closed tickets with full audit trail"
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
        />
        <KPICard
          title="Mean Time To Resolve"
          value={summary?.mean_time_to_resolve ?? '18.5 mins'}
          subtitle={`MTTA: ${summary?.mean_time_to_acknowledge ?? '4.2 mins'}`}
          icon={Clock}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Main Alerts Table Card */}
      <div className="bg-[#111827] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg">
        {/* Table Filters & Tabs */}
        <div className="p-4 border-b border-[#2d3548] bg-[#0e1422] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex border border-[#2d3548] bg-[#131d33] rounded-lg p-1 text-xs font-mono">
            {(['all', 'new', 'acknowledged', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded transition uppercase ${
                  statusFilter === tab
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents, processes, IPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#172136] border border-[#2d3548] rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#2d3548] bg-[#0c121e] text-[11px] font-mono uppercase text-slate-400 select-none">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Incident Title</th>
                <th className="py-3 px-4">Process</th>
                <th className="py-3 px-4">Destination IP</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-mono">
                    Loading incident queue...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-mono">
                    No incidents matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-[#152033] cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <AlertStatusBadge status={alert.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition truncate">
                        {alert.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {alert.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className="text-slate-200">{alert.process_name || 'System'}</span>
                      {alert.pid && <span className="text-slate-500 ml-1">({alert.pid})</span>}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {alert.dest_ip ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIP(alert.dest_ip);
                            }}
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                            title="Inspect IP Intelligence"
                          >
                            <Globe className="w-3 h-3 text-cyan-400" />
                            <span>{alert.dest_ip}</span>
                          </button>
                          {alert.dest_port && (
                            <span className="text-rose-400 font-bold">:{alert.dest_port}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">Inbound</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {alert.assigned_to}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                          }}
                          className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-cyan-600 hover:text-white text-slate-300 font-mono text-[11px] transition"
                        >
                          Triage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Triage Modal */}
      <IncidentTriageModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onUpdated={fetchAlertsData}
        onOpenAIInvestigate={(alert) => {
          navigate('/ai-analyst', { state: { preloadedAlert: alert } });
        }}
      />

      {/* IP Intelligence Quick Modal */}
      <IPIntelligenceModal ip={selectedIP} onClose={() => setSelectedIP(null)} />

      {/* Raise Manual Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-[#0f172a] border border-[#334155] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Raise Security Incident Ticket
            </h2>
            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rogue outbound SSH socket"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#131d33] border border-[#223254] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Severity</label>
                <select
                  value={newSev}
                  onChange={(e) => setNewSev(e.target.value)}
                  className="w-full bg-[#131d33] border border-[#223254] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Process Name</label>
                  <input
                    type="text"
                    placeholder="e.g. bad_tool.exe"
                    value={newProc}
                    onChange={(e) => setNewProc(e.target.value)}
                    className="w-full bg-[#131d33] border border-[#223254] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target IP</label>
                  <input
                    type="text"
                    placeholder="e.g. 198.51.100.25"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    className="w-full bg-[#131d33] border border-[#223254] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Incident Narrative</label>
                <textarea
                  rows={3}
                  placeholder="Describe suspicious behaviors observed..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#131d33] border border-[#223254] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-500"
                >
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
