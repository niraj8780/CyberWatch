import React from 'react';

interface RiskDialProps {
  score?: number; // 0 to 100
  level?: 'Low' | 'Medium' | 'High' | 'Critical';
  label?: string;
  sublabel?: string;
}

export const RiskDial: React.FC<RiskDialProps> = ({
  score = 28,
  level = 'Low',
  label = 'Host Threat Index',
  sublabel = 'Real-time Telemetry Health',
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  // Map score (0 to 100) to angle (-90 to +90 degrees)
  const angle = -90 + (clampedScore / 100) * 180;

  const color =
    clampedScore < 40
      ? 'var(--accent)'
      : clampedScore < 75
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div
      className="rounded-2xl p-4 flex flex-col justify-between h-full"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }}
        >
          {level}
        </span>
      </div>

      {/* Speedometer Gauge Arc & Needle */}
      <div className="flex flex-col items-center justify-center my-1 pt-1">
        <svg width="190" height="105" viewBox="0 0 200 110" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#00ff88" stopOpacity="1" />
              <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00ff88" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Track Arc: radius 70, center at (100, 95) */}
          <path
            d="M 30 95 A 70 70 0 0 1 170 95"
            fill="none"
            stroke="var(--bg-secondary)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Colored Arc (Arc length = PI * 70 ≈ 219.9) */}
          <path
            d="M 30 95 A 70 70 0 0 1 170 95"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="219.9"
            strokeDashoffset={219.9 - (clampedScore / 100) * 219.9}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />

          {/* Ticks: Low, Med, Max */}
          <text x="24" y="108" fill="var(--text-muted)" fontSize="9" fontFamily="monospace" textAnchor="middle">Low</text>
          <text x="100" y="20" fill="var(--text-muted)" fontSize="9" fontFamily="monospace" textAnchor="middle">Med</text>
          <text x="176" y="108" fill="var(--text-muted)" fontSize="9" fontFamily="monospace" textAnchor="middle">Max</text>

          {/* Pivot point */}
          <circle cx="100" cy="95" r="5" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="100" cy="95" r="2" fill="var(--accent)" />

          {/* Needle swinging around (100, 95) */}
          <g
            transform={`rotate(${angle} 100 95)`}
            style={{ transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="38"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
            />
          </g>
        </svg>

        {/* Distinct Score Display Below Gauge (Clean spacing, completely separated from pivot circle) */}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-extrabold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {clampedScore}
          </span>
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent)' }}>
            %
          </span>
          <span className="text-[10px] font-mono ml-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            LOAD
          </span>
        </div>
      </div>

      {/* Sublabel */}
      <p className="text-[10px] font-mono text-center truncate w-full pt-1" style={{ color: 'var(--text-secondary)' }}>
        {sublabel}
      </p>
    </div>
  );
};

export default RiskDial;
