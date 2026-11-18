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
  TrendingUp,
  Cpu,
  ShieldAlert,
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
  AreaChart,
  Area,
} from 'recharts';
import RiskDial from '../components/RiskDial';

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

  // Rolling Wave telemetry data for subtle wave chart (reference aesthetic)
  const [waveHistory, setWaveHistory] = React.useState<Array<{ time: string; sockets: number; established: number }>>([
    { time: '12s', sockets: 45, established: 32 },
    { time: '10s', sockets: 52, established: 38 },
    { time: '8s',  sockets: 48, established: 35 },
    { time: '6s',  sockets: 60, established: 44 },
    { time: '4s',  sockets: 55, established: 41 },
    { time: '2s',  sockets: 62, established: 46 },
    { time: 'now', sockets: 68, established: 50 },
  ]);

  React.useEffect(() => {
    if (activeStats?.total_connections) {
      setWaveHistory((prev) => {
        const now = new Date().toLocaleTimeString(undefined, { minute: '2-digit', second: '2-digit' });
        return [
          ...prev.slice(-8),
          {
            time: now,
            sockets: activeStats.total_connections,
            established: activeStats.established || Math.round(activeStats.total_connections * 0.72),
          },
        ];
      });
    }
  }, [activeStats?.total_connections, activeStats?.established]);

  const riskScore = React.useMemo(() => {
    if (!activeStats) return 18;
    const total = activeStats.total_connections || 1;
    const listening = activeStats.listening_ports || 0;
    // Normalized baseline risk: 15-28% during normal operation
    const ratio = Math.round((listening / Math.max(total, 120)) * 65);
    return Math.max(14, Math.min(85, ratio));
  }, [activeStats]);

  // Dynamic wave styling: Green for normal desktop baseline (up to 450 sockets for active browser/apps),
  // Cyber Purple only triggers on genuine surges: abnormal flood (>500 sockets), rapid socket bursts (>20 new/sec), or critical threat risk
  const isSurgeTraffic = React.useMemo(() => {
    if (!activeStats) return false;
    const total = activeStats.total_connections || 0;
    const hasBurst = (deltaStats?.newCount || 0) >= 20;
    const isOverCapacity = total > 500;
    const isElevatedRisk = riskScore >= 70;
    return hasBurst || isOverCapacity || isElevatedRisk;
  }, [activeStats, deltaStats, riskScore]);

  const waveLineColor = isSurgeTraffic ? '#c084fc' : '#00ff88';
  const waveGlowShadow = isSurgeTraffic ? 'rgba(192, 132, 252, 0.45)' : 'rgba(0, 255, 136, 0.4)';

  const barColors = ['#00e676', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1
            className="text-xl font-bold flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <Activity className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Security Overview Dashboard
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time socket metrics, bidirectional WebSocket telemetry, and live connection stream.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Pause / Play Live Stream Button */}
          {isLive && (
            <button
              onClick={togglePause}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200"
              style={
                isPaused
                  ? { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }
                  : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 self-start sm:self-auto"
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

      {/* Visual Telemetry HUD: Dial Gauge & Wave Spline (Reference Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Speedometer Gauge Dial (3 cols) */}
        <div className="lg:col-span-3">
          <RiskDial
            score={riskScore}
            level={riskScore < 35 ? 'Low' : riskScore < 70 ? 'Medium' : 'High'}
            label="Host Threat Gauge"
            sublabel={`${activeStats?.listening_ports || 0} listening ports monitored`}
          />
        </div>

        {/* Smooth Emerald Wave Activity Chart (6 cols) */}
        <div
          className="lg:col-span-6 rounded-2xl p-4 flex flex-col justify-between"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: waveLineColor }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Socket Traffic &amp; Wave Activity
              </h3>
            </div>
            <span
              className="text-[10px] font-mono flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                background: isSurgeTraffic ? 'rgba(192, 132, 252, 0.15)' : 'var(--accent-dim)',
                color: waveLineColor,
                border: `1px solid ${isSurgeTraffic ? 'rgba(192, 132, 252, 0.3)' : 'var(--border)'}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: waveLineColor }}
              />
              {isSurgeTraffic ? 'ELEVATED SURGE (PURPLE)' : 'NOMINAL (GREEN)'}
            </span>
          </div>

          <div className="h-32 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waveHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="neonDynamicWave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={waveLineColor} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={waveLineColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sockets"
                  stroke={waveLineColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#neonDynamicWave)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono pt-1" style={{ color: 'var(--text-muted)' }}>
            <span>Live socket pulse</span>
            <span style={{ color: waveLineColor }}>Peak: {Math.max(...waveHistory.map((w) => w.sockets), 1)} conns</span>
          </div>
        </div>

        {/* Concentric Telemetry Indicators (3 cols) */}
        <div
          className="lg:col-span-3 rounded-2xl p-4 flex flex-col justify-between"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Telemetry Ratios
            </span>
            <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--accent)' }}>
              HEALTH 98%
            </span>
          </div>

          <div className="space-y-3 my-1 text-xs">
            {/* Metric 1 */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>Established Ratio</span>
                <span style={{ color: 'var(--accent)' }}>
                  {Math.round(((activeStats?.established || 0) / Math.max(activeStats?.total_connections || 1, 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(((activeStats?.established || 0) / Math.max(activeStats?.total_connections || 1, 1)) * 100)}%`,
                    background: 'var(--accent)',
                    boxShadow: '0 0 8px var(--accent-glow)',
                  }}
                />
              </div>
            </div>

            {/* Metric 2 */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>TCP Stream Share</span>
                <span style={{ color: '#3b82f6' }}>
                  {Math.round(((activeStats?.tcp_connections || 0) / Math.max(activeStats?.total_connections || 1, 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(((activeStats?.tcp_connections || 0) / Math.max(activeStats?.total_connections || 1, 1)) * 100)}%`,
                    background: '#3b82f6',
                  }}
                />
              </div>
            </div>

            {/* Metric 3 */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>UDP Datagram Share</span>
                <span style={{ color: '#a855f7' }}>
                  {Math.round(((activeStats?.udp_connections || 0) / Math.max(activeStats?.total_connections || 1, 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(((activeStats?.udp_connections || 0) / Math.max(activeStats?.total_connections || 1, 1)) * 100)}%`,
                    background: '#a855f7',
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] font-mono text-center pt-1" style={{ color: 'var(--text-muted)' }}>
            Automated sensor stream
          </p>
        </div>
      </div>

      {/* Middle Row: Visual Telemetry + Live Socket Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection States Bar Chart (5 columns) */}
        <div
          className="lg:col-span-5 rounded-xl p-5 shadow-lg flex flex-col"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between mb-4 pb-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Connection State Breakdown
              </h3>
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              States count
            </span>
          </div>

          <div className="h-64 w-full">
            {statsLoading && !activeStats ? (
              <div
                className="h-full w-full flex items-center justify-center rounded-lg animate-pulse"
                style={{ background: 'var(--bg-primary)', opacity: 0.4 }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Loading metrics...
                </span>
              </div>
            ) : stateChartData.length === 0 ? (
              <div
                className="h-full w-full flex items-center justify-center text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
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
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
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
        <div
          className="lg:col-span-3 rounded-xl p-5 shadow-lg flex flex-col"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between mb-4 pb-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Protocol Share
              </h3>
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              TCP / UDP
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statsLoading && !activeStats ? (
              <div
                className="h-full w-full flex items-center justify-center rounded-lg animate-pulse"
                style={{ background: 'var(--bg-primary)', opacity: 0.4 }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Calculating proportions...
                </span>
              </div>
            ) : protocolData.length === 0 ? (
              <div
                className="h-full w-full flex items-center justify-center text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
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
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
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
          <h2
            className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Network className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            Active Connections Stream
          </h2>
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
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
