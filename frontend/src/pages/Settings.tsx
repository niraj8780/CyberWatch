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
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <SettingsIcon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            System &amp; Sensor Settings
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Telemetry daemon diagnostics, host platform specifications, and monitoring configuration.
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 self-start sm:self-auto"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
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
        <div
          className="rounded-xl p-5 shadow-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between pb-3 mb-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="h-4 w-4" style={{ color: 'var(--accent)' }} />
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
                <div key={i} className="h-4 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              ))}
            </div>
          ) : health ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Application Name</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{health.app}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Daemon Version</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>{health.version}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Uptime</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {Math.floor(health.uptime_seconds / 3600)}h{' '}
                  {Math.floor((health.uptime_seconds % 3600) / 60)}m{' '}
                  {Math.floor(health.uptime_seconds % 60)}s
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span style={{ color: 'var(--text-secondary)' }}>Background Packet Capture</span>
                <span className="font-mono">
                  {health.monitoring_active ? (
                    <span className="font-medium" style={{ color: 'var(--accent)' }}>ENABLED &amp; CAPTURING</span>
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
        <div
          className="rounded-xl p-5 shadow-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between pb-3 mb-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Server className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              Host Telemetry System
            </h2>
            <span
              className="text-[10px] uppercase font-mono px-2 py-0.5 rounded"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              Read-Only
            </span>
          </div>

          {systemLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              ))}
            </div>
          ) : system ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Server className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} /> Hostname
                </span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{system.hostname}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Cpu className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} /> OS Platform
                </span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{system.platform}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Cpu className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} /> CPU Cores
                </span>
                <span className="font-mono" style={{ color: 'var(--accent)' }}>{system.cpu_count} logical cores</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <HardDrive className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} /> Physical RAM
                </span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {system.memory_available_gb} GB free / {system.memory_total_gb} GB ({system.memory_percent}%)
                </span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} /> Boot Timestamp
                </span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{system.boot_time}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Info className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} /> Runtime Engine
                </span>
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>Python {system.python_version}</span>
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
      <div
        className="rounded-xl p-5 shadow-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Advanced Telemetry Controls
            </h3>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
