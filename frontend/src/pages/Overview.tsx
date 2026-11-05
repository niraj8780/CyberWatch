import React from 'react';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { getNetworkStats, getConnections, getHealth } from '../services/api';
import KPICard from '../components/KPICard';
import ConnectionTable from '../components/ConnectionTable';
import LiveEventFeed from '../components/LiveEventFeed';
import ErrorState from '../components/ErrorState';
import {
  Network,
  Server,
  Radio,
  Ear,
  Link2,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Pause,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Overview: React.FC = () => {
  // Real-time WebSocket live updates
  const {
    isLive,
    statistics: wsStats,
    recentEvents: wsEvents,
    recentConnections: wsConns,
    deltaStats,
    isPaused,
    togglePause,
  } = useWebSocket();

  // HTTP polling fallback every 5s if WebSocket is offline or initial load
  const {
    data: httpStats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApi(getNetworkStats, isLive ? undefined : 5000);

  // Fetch recent connections
  const {
    data: connData,
    loading: connLoading,
    error: connError,
    refetch: refetchConnections,
  } = useApi(() => getConnections({ limit: 20 }), isLive ? undefined : 5000);

  // Fetch health status
  const {
    data: health,
    loading: healthLoading,
    refetch: refetchHealth,
  } = useApi(getHealth, 10000);

  // Prioritize WebSocket live stats over HTTP polled stats
  const activeStats = wsStats || httpStats;
  const activeConnections = wsConns.length > 0 ? wsConns : connData?.connections || [];

  const handleRefreshAll = () => {
    refetchStats();
    refetchConnections();
    refetchHealth();
  };

  const hasFatalError = Boolean(statsError && connError && !isLive);

  // Prepare Bar Chart data from states dict
  const stateChartData = React.useMemo(() => {
    if (!activeStats?.states) return [];
    return Object.entries(activeStats.states)
      .map(([state, count]) => ({
        name: state,
        count: count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeStats]);

  // Prepare Pie Chart data (TCP vs UDP)
  const protocolData = React.useMemo(() => {
    if (!activeStats) return [];
    return [
      { name: 'TCP', value: activeStats.tcp_connections || 0, color: '#3b82f6' },
      { name: 'UDP', value: activeStats.udp_connections || 0, color: '#a855f7' },
    ].filter((item) => item.value > 0);
  }, [activeStats]);

  const barColors = ['#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2d3548]">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-cyan-400" />
            Security Overview Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time socket metrics, bidirectional WebSocket telemetry, and live connection stream.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Pause / Play Live Stream Button */}
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
                  Resume Live
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause Stream
                </>
              )}
            </button>
          )}

          <button
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-[#2d3548] text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all duration-200 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state if backend completely down and no WS */}
      {hasFatalError && (
        <ErrorState
          message={`Unable to connect to backend telemetry service: ${statsError || connError}`}
          onRetry={handleRefreshAll}
        />
      )}

      {/* Top Row: 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Connections */}
        <KPICard
          title="Total Sockets"
          value={activeStats?.total_connections ?? '—'}
          subtitle={isLive ? 'Live via WebSocket' : 'All active sockets'}
          icon={Network}
          color="cyan"
          loading={statsLoading && !activeStats}
        />

        {/* TCP Connections */}
        <KPICard
          title="TCP Connections"
          value={activeStats?.tcp_connections ?? '—'}
          subtitle="Stream oriented"
          icon={Server}
          color="blue"
          loading={statsLoading && !activeStats}
        />

        {/* UDP Sockets */}
        <KPICard
          title="UDP Sockets"
          value={activeStats?.udp_connections ?? '—'}
          subtitle="Datagram oriented"
          icon={Radio}
          color="purple"
          loading={statsLoading && !activeStats}
        />

        {/* Listening Ports */}
        <KPICard
          title="Listening Ports"
          value={activeStats?.listening_ports ?? '—'}
          subtitle="Inbound listeners"
          icon={Ear}
          color="emerald"
          loading={statsLoading && !activeStats}
        />

        {/* Established */}
        <KPICard
          title="Established"
          value={activeStats?.established ?? '—'}
          subtitle="Active handshakes"
          icon={Link2}
          color="emerald"
          loading={statsLoading && !activeStats}
        />

        {/* Monitoring Status */}
        <KPICard
          title="Daemon Sensor"
          value={
            isLive
              ? 'STREAMING'
              : health?.monitoring_active
              ? 'ACTIVE'
              : health?.status === 'healthy'
              ? 'ONLINE'
              : 'OFFLINE'
          }
          subtitle={isLive ? 'Real-time WebSocket' : 'Continuous sniffing'}
          icon={Activity}
          color={isLive || health?.monitoring_active ? 'cyan' : 'red'}
          loading={healthLoading && !activeStats}
        />
      </div>

      {/* Middle Row: Visual Telemetry + Live Socket Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection States Bar Chart (5 columns) */}
        <div className="lg:col-span-5 bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-[#2d3548] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Connection State Breakdown
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">States count</span>
          </div>

          <div className="h-64 w-full">
            {statsLoading && !activeStats ? (
              <div className="h-full w-full flex items-center justify-center bg-[#111827]/40 rounded-lg animate-pulse">
                <span className="text-xs text-slate-500">Loading metrics...</span>
              </div>
            ) : stateChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                No connection state telemetry recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#2d3548',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stateChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={barColors[index % barColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Transport Protocol Share (3 columns) */}
        <div className="lg:col-span-3 bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-[#2d3548] pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Protocol Share
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">TCP / UDP</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statsLoading && !activeStats ? (
              <div className="h-full w-full flex items-center justify-center bg-[#111827]/40 rounded-lg animate-pulse">
                <span className="text-xs text-slate-500">Calculating proportions...</span>
              </div>
            ) : protocolData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                No protocol data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {protocolData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#2d3548',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Real-Time Socket Stream Feed (4 columns) */}
        <div className="lg:col-span-4">
          <LiveEventFeed
            events={wsEvents}
            isLive={isLive}
            deltaStats={deltaStats}
          />
        </div>
      </div>

      {/* Bottom Row: Recent Connections Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-400" />
            Active Connections Stream
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {isLive ? 'Live via WebSocket' : 'Auto-refreshing every 5s'}
          </span>
        </div>

        <ConnectionTable
          connections={activeConnections.slice(0, 20)}
          loading={connLoading && activeConnections.length === 0}
          total={activeStats?.total_connections || activeConnections.length}
          showPagination={false}
          emptyTitle="No active connections"
          emptyDescription="Waiting for network telemetry packets from daemon."
        />
      </div>
    </div>
  );
};

export default Overview;
