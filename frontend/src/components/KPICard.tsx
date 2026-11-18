import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type KPICardColor = 'green' | 'emerald' | 'red' | 'amber' | 'blue' | 'purple' | 'cyan';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: KPICardColor;
  loading?: boolean;
}

const colorMap: Record<KPICardColor, { hex: string; glow: string }> = {
  green:   { hex: 'var(--accent)', glow: 'var(--accent-glow)' },
  emerald: { hex: 'var(--accent)', glow: 'var(--accent-glow)' },
  red:     { hex: '#ef4444',       glow: 'rgba(239,68,68,0.25)' },
  amber:   { hex: '#f59e0b',       glow: 'rgba(245,158,11,0.25)' },
  blue:    { hex: '#3b82f6',       glow: 'rgba(59,130,246,0.25)' },
  purple:  { hex: '#a855f7',       glow: 'rgba(168,85,247,0.25)' },
  cyan:    { hex: '#22d3ee',       glow: 'rgba(34,211,238,0.25)' },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'green',
  loading = false,
}) => {
  const c = colorMap[color] || colorMap.green;

  if (loading) {
    return (
      <div
        className="rounded-xl p-5 animate-pulse"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-card-hover)' }} />
          <div className="h-10 w-10 rounded-lg" style={{ background: 'var(--bg-card-hover)' }} />
        </div>
        <div className="mt-4 h-8 w-20 rounded" style={{ background: 'var(--bg-card-hover)' }} />
        <div className="mt-2 h-3 w-32 rounded" style={{ background: 'var(--bg-card-hover)' }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 transition-all duration-200 flex flex-col justify-between cursor-default group"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = c.hex;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${c.glow}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${c.hex}18`, border: `1px solid ${c.hex}40` }}
        >
          <Icon className="h-5 w-5" style={{ color: c.hex }} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight font-mono" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="truncate max-w-[70%]" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </span>
          )}
          {trend && (
            <div className="flex items-center gap-1 ml-auto">
              {trend === 'up' && (
                <span className="flex items-center font-medium" style={{ color: 'var(--accent)' }}>
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue || 'Up'}
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center font-medium" style={{ color: '#ef4444' }}>
                  <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue || 'Down'}
                </span>
              )}
              {trend === 'neutral' && (
                <span className="flex items-center font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Minus className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue || 'Stable'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
