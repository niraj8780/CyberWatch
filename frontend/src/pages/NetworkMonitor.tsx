import React, { useState, useMemo, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { getConnections } from '../services/api';
import ConnectionTable from '../components/ConnectionTable';
import ErrorState from '../components/ErrorState';
import {
  Network,
  Search,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Activity,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const NetworkMonitor: React.FC = () => {
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  const fetchConnectionsData = useCallback(() => {
    return getConnections({
      protocol: selectedProtocol !== 'ALL' ? selectedProtocol.toLowerCase() : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      process_name: searchQuery.trim() || undefined,
      limit: 500,
    });
  }, [selectedProtocol, selectedStatus, searchQuery]);

  const { data, loading, error, refetch } = useApi(
    fetchConnectionsData,
    autoRefresh ? 5000 : undefined
  );

  const rawConnections = data?.connections || [];

  // Filter client-side to allow rapid instant filtering
  const filteredConnections = useMemo(() => {
    return rawConnections.filter((conn) => {
      // Protocol filter
      if (
        selectedProtocol !== 'ALL' &&
        conn.protocol.toUpperCase() !== selectedProtocol.toUpperCase()
      ) {
        return false;
      }

      // Status filter
      if (
        selectedStatus !== 'ALL' &&
        conn.status.toUpperCase() !== selectedStatus.toUpperCase()
      ) {
        return false;
      }

      // Search query (process name, local ip/port, remote ip/port, or PID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const procMatch = conn.process_name?.toLowerCase().includes(query) ?? false;
        const localMatch = `${conn.local_ip}:${conn.local_port}`.toLowerCase().includes(query);
        const remoteMatch = `${conn.remote_ip}:${conn.remote_port}`.toLowerCase().includes(query);
        const pidMatch = conn.pid !== null && String(conn.pid).includes(query);

        if (!procMatch && !localMatch && !remoteMatch && !pidMatch) {
          return false;
        }
      }

      return true;
    });
  }, [rawConnections, selectedProtocol, selectedStatus, searchQuery]);

  // Paginated slice
  const paginatedConnections = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredConnections.slice(startIndex, startIndex + pageSize);
  }, [filteredConnections, currentPage, pageSize]);

  // Statistics calculation for the summary bar
  const stats = useMemo(() => {
    let tcpCount = 0;
    let udpCount = 0;
    let establishedCount = 0;
    let listenCount = 0;

    for (const c of filteredConnections) {
      const proto = c.protocol.toUpperCase();
      const st = c.status.toUpperCase();

      if (proto === 'TCP') tcpCount++;
      if (proto === 'UDP') udpCount++;
      if (st === 'ESTABLISHED') establishedCount++;
      if (st === 'LISTEN' || st === 'LISTENING') listenCount++;
    }

    return {
      total: filteredConnections.length,
      tcp: tcpCount,
      udp: udpCount,
      established: establishedCount,
      listening: listenCount,
    };
  }, [filteredConnections]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleResetFilters = () => {
    setSelectedProtocol('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#2d3548]">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Network className="h-5 w-5 text-cyan-400" />
            Live Network Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time socket inspection, packet states, and endpoint connection mapping.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Auto Refresh Toggle */}
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

          {/* Manual Refresh */}
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-[#2d3548] text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all duration-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Filtered</div>
            <div className="text-lg font-bold font-mono text-cyan-400">{stats.total}</div>
          </div>
          <Layers className="h-5 w-5 text-slate-500" />
        </div>
        <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">TCP Connections</div>
            <div className="text-lg font-bold font-mono text-blue-400">{stats.tcp}</div>
          </div>
          <Activity className="h-5 w-5 text-blue-500/50" />
        </div>
        <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">UDP Sockets</div>
            <div className="text-lg font-bold font-mono text-purple-400">{stats.udp}</div>
          </div>
          <Activity className="h-5 w-5 text-purple-500/50" />
        </div>
        <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Established</div>
            <div className="text-lg font-bold font-mono text-emerald-400">{stats.established}</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500/50" />
        </div>
        <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-3 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Listening</div>
            <div className="text-lg font-bold font-mono text-cyan-300">{stats.listening}</div>
          </div>
          <ShieldAlert className="h-5 w-5 text-cyan-500/50" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search IP, port, process name, or PID..."
            className="w-full bg-[#111827] border border-[#2d3548] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all font-mono"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Protocol dropdown */}
          <div className="flex items-center gap-1.5 bg-[#111827] border border-[#2d3548] rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Protocol:</span>
            <select
              value={selectedProtocol}
              onChange={(e) => {
                setSelectedProtocol(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono cursor-pointer"
            >
              <option value="ALL" className="bg-[#111827]">All</option>
              <option value="TCP" className="bg-[#111827]">TCP</option>
              <option value="UDP" className="bg-[#111827]">UDP</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div className="flex items-center gap-1.5 bg-[#111827] border border-[#2d3548] rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono cursor-pointer"
            >
              <option value="ALL" className="bg-[#111827]">All Statuses</option>
              <option value="ESTABLISHED" className="bg-[#111827]">ESTABLISHED</option>
              <option value="LISTEN" className="bg-[#111827]">LISTEN</option>
              <option value="TIME_WAIT" className="bg-[#111827]">TIME_WAIT</option>
              <option value="CLOSE_WAIT" className="bg-[#111827]">CLOSE_WAIT</option>
              <option value="SYN_SENT" className="bg-[#111827]">SYN_SENT</option>
              <option value="SYN_RECV" className="bg-[#111827]">SYN_RECV</option>
              <option value="FIN_WAIT1" className="bg-[#111827]">FIN_WAIT1</option>
              <option value="FIN_WAIT2" className="bg-[#111827]">FIN_WAIT2</option>
              <option value="LAST_ACK" className="bg-[#111827]">LAST_ACK</option>
              <option value="CLOSING" className="bg-[#111827]">CLOSING</option>
              <option value="NONE" className="bg-[#111827]">NONE</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(selectedProtocol !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#242b3d] text-slate-300 hover:text-white text-xs border border-[#2d3548] transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          message={`Failed to query network connections: ${error}`}
          onRetry={refetch}
        />
      )}

      {/* Connection Table */}
      <ConnectionTable
        connections={paginatedConnections}
        loading={loading}
        total={filteredConnections.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        showPagination={true}
      />
    </div>
  );
};

export default NetworkMonitor;
