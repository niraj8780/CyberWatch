import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  Play,
  RotateCw,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Activity,
  BarChart2,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  clearSecurityEvents,
  getDetectionRules,
  getSecurityEvents,
  getSecuritySummary,
  toggleDetectionRule,
  triggerSecurityScan,
} from '../services/api';
import { DetectionRule, SecurityEvent, SecuritySummary } from '../types';
import { KPICard } from '../components/KPICard';
import { SecurityEventTable } from '../components/SecurityEventTable';
import { SecurityEventModal } from '../components/SecurityEventModal';
import { DetectionRuleManager } from '../components/DetectionRuleManager';

export const ThreatDetection: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'rules' | 'analytics'>('events');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Fetch all threat detection data
  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, rulesRes, summaryRes] = await Promise.all([
        getSecurityEvents({ limit: 100 }),
        getDetectionRules(),
        getSecuritySummary(),
      ]);
      setEvents(eventsRes.items || []);
      setRules(rulesRes || []);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load threat detection data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 8 seconds for background threats
    const timer = setInterval(fetchData, 8000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Handle manual scan
  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await triggerSecurityScan();
      setScanMessage(
        `Scan complete in ${res.scan_duration_ms}ms: Scanned ${res.scanned_connections_count} sockets, detected ${res.new_threats_detected} new threat(s).`
      );
      await fetchData();
    } catch (err) {
      console.error('Manual scan failed:', err);
      setScanMessage('Failed to trigger scan. Please verify backend connection.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  // Handle clearing events
  const handleClearEvents = async () => {
    if (!window.confirm('Clear all recorded security threat events?')) return;
    try {
      await clearSecurityEvents();
      await fetchData();
    } catch (err) {
      console.error('Failed to clear events:', err);
    }
  };

  // Handle toggling rule
  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const updated = await toggleDetectionRule(ruleId, enabled);
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle detection rule:', err);
    }
  };

  const threatColor =
    summary?.threat_level === 'CRITICAL' || summary?.threat_level === 'HIGH'
      ? 'red'
      : summary?.threat_level === 'ELEVATED'
      ? 'amber'
      : 'emerald';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Threat Detection Engine
            </h1>
            <span className="font-mono text-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Phase 3 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time heuristic anomaly detection, LOLBin activity tracking, and port scan recognition.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearEvents}
            disabled={events.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#172136] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-[#2d3548] hover:border-rose-500/40 rounded-lg text-xs font-mono transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear threat event log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>

          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg text-xs font-mono font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)] transition disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Sockets...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Threat Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scan Feedback Banner */}
      {scanMessage && (
        <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg flex items-center gap-2.5 text-xs font-mono text-cyan-200 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Threats Detected"
          value={summary?.total_events ?? events.length}
          subtitle={`High: ${summary?.high_severity_count ?? 0} | Med: ${summary?.medium_severity_count ?? 0} | Low: ${summary?.low_severity_count ?? 0}`}
          icon={ShieldAlert}
          color="red"
          loading={isLoading}
        />
        <KPICard
          title="High Severity Alerts"
          value={summary?.high_severity_count ?? 0}
          subtitle="Critical threats requiring immediate triage"
          icon={AlertTriangle}
          color="red"
          loading={isLoading}
        />
        <KPICard
          title="Active Detection Rules"
          value={`${summary?.active_rules_count ?? rules.filter((r) => r.enabled).length} / ${summary?.total_rules_count ?? rules.length}`}
          subtitle="Heuristic and signature modules active"
          icon={Sliders}
          color="cyan"
          loading={isLoading}
        />
        <KPICard
          title="Host Threat Level"
          value={summary?.threat_level ?? 'LOW'}
          subtitle={`Last scan: ${summary?.last_scan_time ? new Date(summary.last_scan_time).toLocaleTimeString() : 'Active'}`}
          icon={ShieldCheck}
          color={threatColor}
          loading={isLoading}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#2d3548] gap-6 text-xs font-mono select-none">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'events'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Threat Events ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'rules'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Detection Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Threat Analytics</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'events' && (
        <SecurityEventTable
          events={events}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'rules' && (
        <DetectionRuleManager
          rules={rules}
          onToggleRule={handleToggleRule}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Flagged Processes */}
          <div className="bg-[#111827] border border-[#2d3548] rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2d3548] mb-4">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Top Flagged Processes
              </h3>
            </div>
            {summary?.top_flagged_processes && summary.top_flagged_processes.length > 0 ? (
              <div className="space-y-3">
                {summary.top_flagged_processes.map((proc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#172136] rounded-lg border border-[#2d3548] font-mono text-xs"
                  >
                    <span className="text-slate-200 font-medium">{proc.process_name}</span>
                    <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {proc.count} detections
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs font-mono text-slate-400">
                No process-specific threats recorded yet.
              </div>
            )}
          </div>

          {/* Top Flagged Destination Ports */}
          <div className="bg-[#111827] border border-[#2d3548] rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2d3548] mb-4">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Top Targeted Dangerous Ports
              </h3>
            </div>
            {summary?.top_flagged_ports && summary.top_flagged_ports.length > 0 ? (
              <div className="space-y-3">
                {summary.top_flagged_ports.map((portItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#172136] rounded-lg border border-[#2d3548] font-mono text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">Port {portItem.port}</span>
                    </div>
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {portItem.count} hits
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs font-mono text-slate-400">
                No suspicious destination ports recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Details Drawer/Modal */}
      <SecurityEventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
