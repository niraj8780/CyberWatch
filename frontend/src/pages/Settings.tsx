import React from 'react';
import { useApi } from '../hooks/useApi';
import { getHealth, getSystemInfo } from '../services/api';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import {
  Settings as SettingsIcon,
  Server,
  Activity,
  HardDrive,
  Cpu,
  Clock,
  ShieldAlert,
  Info,
  RefreshCw,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    data: health,
    loading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useApi(getHealth, 15000);

  const {
    data: system,
    loading: systemLoading,
    error: systemError,
    refetch: refetchSystem,
  } = useApi(getSystemInfo, 30000);

  const handleRefreshAll = () => {
    refetchHealth();
    refetchSystem();
  };

  const hasError = healthError && systemError;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2d3548]">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <SettingsIcon className="h-5 w-5 text-cyan-400" />
            System &amp; Sensor Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Telemetry daemon diagnostics, host platform specifications, and monitoring configuration.
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-[#2d3548] text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all duration-200 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Status
        </button>
      </div>

      {hasError && (
        <ErrorState
          message="Failed to contact the CyberWatch monitoring daemon. Ensure the FastAPI backend is running on port 8000."
          onRetry={handleRefreshAll}
        />
      )}

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Daemon Status */}
        <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#2d3548] pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Monitoring Service Health
            </h2>
            {health && (
              <StatusBadge
                status={health.status}
                variant="health"
              />
            )}
          </div>

          {healthLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-[#2d3548] rounded" />
              ))}
            </div>
          ) : health ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400">Application Name</span>
                <span className="font-mono text-slate-200">{health.app}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400">Daemon Version</span>
                <span className="font-mono text-cyan-400 font-semibold">{health.version}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400">Uptime</span>
                <span className="font-mono text-slate-200">
                  {Math.floor(health.uptime_seconds / 3600)}h{' '}
                  {Math.floor((health.uptime_seconds % 3600) / 60)}m{' '}
                  {Math.floor(health.uptime_seconds % 60)}s
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Background Packet Capture</span>
                <span className="font-mono">
                  {health.monitoring_active ? (
                    <span className="text-emerald-400 font-medium">ENABLED &amp; CAPTURING</span>
                  ) : (
                    <span className="text-rose-400 font-medium">DISABLED</span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-400">
              {healthError || 'Unable to retrieve service health status.'}
            </p>
          )}
        </div>

        {/* Host Machine Specifications */}
        <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#2d3548] pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" />
              Host Telemetry System
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#242b3d] text-slate-400 border border-[#2d3548]">
              Read-Only
            </span>
          </div>

          {systemLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-[#2d3548] rounded" />
              ))}
            </div>
          ) : system ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-slate-500" /> Hostname
                </span>
                <span className="font-mono text-slate-200 font-semibold">{system.hostname}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" /> OS Platform
                </span>
                <span className="font-mono text-slate-200">{system.platform}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" /> CPU Cores
                </span>
                <span className="font-mono text-cyan-400">{system.cpu_count} logical cores</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-slate-500" /> Physical RAM
                </span>
                <span className="font-mono text-slate-200">
                  {system.memory_available_gb} GB free / {system.memory_total_gb} GB ({system.memory_percent}%)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#2d3548]/40">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Boot Timestamp
                </span>
                <span className="font-mono text-slate-300">{system.boot_time}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-500" /> Runtime Engine
                </span>
                <span className="font-mono text-slate-400">Python {system.python_version}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-400">
              {systemError || 'Host system details currently unavailable.'}
            </p>
          )}
        </div>
      </div>

      {/* Monitoring Config Notice */}
      <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Advanced Telemetry Controls
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Detection thresholds, automated packet capture filters, AI analyzer model weights, and custom alerting webhooks can be inspected here.
              Dynamic threshold configuration and sensor management will be fully unlocked in future phases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
