import React, { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { getProcesses } from '../services/api';
import ProcessTable from '../components/ProcessTable';
import ErrorState from '../components/ErrorState';
import {
  Cpu,
  Search,
  Filter,
  RefreshCw,
  Network,
  CheckCircle2,
} from 'lucide-react';

export const Processes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyWithSockets, setOnlyWithSockets] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchProcessesData = useCallback(() => {
    return getProcesses({
      search: searchTerm.trim() || undefined,
      with_connections: onlyWithSockets ? true : undefined,
    });
  }, [searchTerm, onlyWithSockets]);

  const { data, loading, error, refetch } = useApi(
    fetchProcessesData,
    autoRefresh ? 5000 : undefined
  );

  const processes = data?.processes || [];
  const totalCount = data?.total ?? processes.length;

  // Filter client-side as well for instant responsiveness if API returns all
  const filteredProcesses = processes.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.pid).includes(searchTerm);
    const matchesSockets = !onlyWithSockets || p.connections_count > 0;
    return matchesSearch && matchesSockets;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1
            className="text-xl font-bold flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Active Process Telemetry
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time process inspection and socket mapping to identify suspicious background daemons.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Auto refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={
              autoRefresh
                ? { background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
            }
          >
            <CheckCircle2
              className="h-3.5 w-3.5"
              style={{ color: autoRefresh ? 'var(--accent)' : 'var(--text-muted)' }}
            />
            Auto-refresh (5s)
          </button>

          {/* Manual refresh button */}
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by process name or PID..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs placeholder-slate-500 focus:outline-none transition-all font-mono"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Socket filter toggle */}
          <label
            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-xs select-none"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <input
              type="checkbox"
              checked={onlyWithSockets}
              onChange={(e) => setOnlyWithSockets(e.target.checked)}
              className="rounded focus:ring-0 focus:ring-offset-0"
              style={{ accentColor: 'var(--accent)' }}
            />
            <Network className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
            <span>Only with open sockets</span>
          </label>

          {/* Process Count Badge */}
          <div
            className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Filter className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
            <span>
              Showing{' '}
              <strong style={{ color: 'var(--accent)' }}>{filteredProcesses.length}</strong>{' '}
              / {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          message={`Unable to retrieve process list: ${error}`}
          onRetry={refetch}
        />
      )}

      {/* Main Table */}
      <ProcessTable processes={filteredProcesses} loading={loading} />
    </div>
  );
};

export default Processes;
