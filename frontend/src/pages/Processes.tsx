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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#2d3548]">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Cpu className="h-5 w-5 text-cyan-400" />
            Active Process Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time process inspection and socket mapping to identify suspicious background daemons.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Auto refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoRefresh
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
                : 'bg-[#1e2538] border-[#2d3548] text-slate-400'
            }`}
          >
            <CheckCircle2
              className={`h-3.5 w-3.5 ${
                autoRefresh ? 'text-cyan-400' : 'text-slate-500'
              }`}
            />
            Auto-refresh (5s)
          </button>

          {/* Manual refresh button */}
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-[#2d3548] text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all duration-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by process name or PID..."
            className="w-full bg-[#111827] border border-[#2d3548] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Socket filter toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-[#111827] px-3 py-2 rounded-lg border border-[#2d3548] text-xs text-slate-300 select-none hover:border-[#3d4558]">
            <input
              type="checkbox"
              checked={onlyWithSockets}
              onChange={(e) => setOnlyWithSockets(e.target.checked)}
              className="rounded bg-[#1e2538] border-[#2d3548] text-cyan-500 focus:ring-0 focus:ring-offset-0"
            />
            <Network className="h-3.5 w-3.5 text-cyan-400" />
            <span>Only with open sockets</span>
          </label>

          {/* Process Count Badge */}
          <div className="px-3 py-2 rounded-lg bg-[#111827] border border-[#2d3548] text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>
              Showing <strong className="text-cyan-400">{filteredProcesses.length}</strong> / {totalCount}
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
