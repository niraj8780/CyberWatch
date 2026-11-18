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
            <h1
              className="text-xl font-bold tracking-tight flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <ShieldAlert className="w-5 h-5" style={{ color: '#f43f5e' }} />
              Threat Detection Engine
            </h1>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}
            >
              Phase 3 Active
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time heuristic anomaly detection, LOLBin activity tracking, and port scan recognition.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearEvents}
            disabled={events.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            title="Clear threat event log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>

          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition disabled:opacity-50"
            style={{
              background: 'linear-gradient(to right, #e11d48, #f43f5e)',
              color: '#fff',
              boxShadow: '0 0 15px rgba(244,63,94,0.3)',
            }}
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
        <div
          className="p-3 rounded-lg flex items-center gap-2.5 text-xs font-mono animate-fadeIn"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--border-hover)',
            color: 'var(--accent)',
          }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
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
      <div
        className="flex gap-6 text-xs font-mono select-none"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setActiveTab('events')}
          className="pb-3 flex items-center gap-2 border-b-2 transition"
          style={
            activeTab === 'events'
              ? { borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 }
              : { borderColor: 'transparent', color: 'var(--text-secondary)' }
          }
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Threat Events ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className="pb-3 flex items-center gap-2 border-b-2 transition"
          style={
            activeTab === 'rules'
              ? { borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 }
              : { borderColor: 'transparent', color: 'var(--text-secondary)' }
          }
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Detection Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className="pb-3 flex items-center gap-2 border-b-2 transition"
          style={
            activeTab === 'analytics'
              ? { borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 }
              : { borderColor: 'transparent', color: 'var(--text-secondary)' }
          }
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
          <div
            className="rounded-xl p-5 shadow-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center gap-2 pb-3 mb-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <Cpu className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3
                className="text-xs font-semibold uppercase tracking-wider font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                Top Flagged Processes
              </h3>
            </div>
            {summary?.top_flagged_processes && summary.top_flagged_processes.length > 0 ? (
              <div className="space-y-3">
                {summary.top_flagged_processes.map((proc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg font-mono text-xs"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {proc.process_name}
                    </span>
                    <span
                      className="font-bold px-2 py-0.5 rounded"
                      style={{
                        color: '#f43f5e',
                        background: 'rgba(244,63,94,0.1)',
                        border: '1px solid rgba(244,63,94,0.2)',
                      }}
                    >
                      {proc.count} detections
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                No process-specific threats recorded yet.
              </div>
            )}
          </div>

          {/* Top Flagged Destination Ports */}
          <div
            className="rounded-xl p-5 shadow-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center gap-2 pb-3 mb-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3
                className="text-xs font-semibold uppercase tracking-wider font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                Top Targeted Dangerous Ports
              </h3>
            </div>
            {summary?.top_flagged_ports && summary.top_flagged_ports.length > 0 ? (
              <div className="space-y-3">
                {summary.top_flagged_ports.map((portItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg font-mono text-xs"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>
                        Port {portItem.port}
                      </span>
                    </div>
                    <span
                      className="font-bold px-2 py-0.5 rounded"
                      style={{
                        color: '#f59e0b',
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                      }}
                    >
                      {portItem.count} hits
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
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
