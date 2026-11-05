import React, { useState, useMemo, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { getConnections } from '../services/api';
import ConnectionTable from '../components/ConnectionTable';
import ErrorState from '../components/ErrorState';
import {
  Network,
  Search,
  RefreshCw,
  Activity,
  Radio,
  Pause,
  Play,
} from 'lucide-react';

export const NetworkMonitor: React.FC = () => {
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  // Real-time WebSocket connection
  const { isLive, deltaStats, isPaused, togglePause } = useWebSocket();

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
    autoRefresh && !isPaused ? 5000 : undefined
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
          {/* WebSocket Live Telemetry Indicator */}
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-emerald-500/30 text-emerald-400 font-mono text-xs">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>WS Stream Active</span>
              {deltaStats.newCount > 0 && (
                <span className="text-[10px] text-emerald-300">+{deltaStats.newCount}</span>
              )}
            </div>
          )}

          {/* Pause / Resume Live Stream Button */}
          {isLive && (
            <button
              onClick={togglePause}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                isPaused
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-[#1e2538] text-slate-300 border-[#2d3548] hover:text-white hover:border-cyan-500/50'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </>
              )}
            </button>
          )}

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoRefresh
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
                : 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            {autoRefresh ? 'Live Poll: ON' : 'Live Poll: OFF'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-[#2d3548] text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all duration-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-4 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search process name, PID, or IP address (e.g. chrome, 8000, 127.0.0.1)..."
              className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#2d3548] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Protocol Selector */}
            <div className="flex items-center bg-[#111827] border border-[#2d3548] rounded-lg p-1 text-xs">
              <span className="text-[10px] text-slate-500 uppercase px-2 font-semibold">
                Proto
              </span>
              {['ALL', 'TCP', 'UDP'].map((proto) => (
                <button
                  key={proto}
                  onClick={() => {
                    setSelectedProtocol(proto);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    selectedProtocol === proto
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>

            {/* Status Selector */}
            <div className="flex items-center bg-[#111827] border border-[#2d3548] rounded-lg p-1 text-xs">
              <span className="text-[10px] text-slate-500 uppercase px-2 font-semibold">
                State
              </span>
              {['ALL', 'ESTABLISHED', 'LISTEN', 'TIME_WAIT'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    selectedStatus === st
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Reset Filters */}
            {(selectedProtocol !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-[#242b3d] border border-transparent hover:border-[#2d3548] transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Stats Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-[#2d3548]/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Matched Sockets:</span>
            <span className="font-mono font-semibold text-slate-200">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">TCP Streams:</span>
            <span className="font-mono font-semibold text-blue-400">{stats.tcp}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">UDP Sockets:</span>
            <span className="font-mono font-semibold text-purple-400">{stats.udp}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Established:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {stats.established}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Listeners:</span>
            <span className="font-mono font-semibold text-cyan-400">{stats.listening}</span>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          message={`Failed to retrieve real-time network stream: ${error}`}
          onRetry={() => refetch()}
        />
      )}

      {/* Main Connection Table with Pagination */}
      <ConnectionTable
        connections={paginatedConnections}
        loading={loading && rawConnections.length === 0}
        total={filteredConnections.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        emptyTitle="No matching network sockets"
        emptyDescription="Try clearing your filters or search query to view active system sockets."
      />
    </div>
  );
};

export default NetworkMonitor;
