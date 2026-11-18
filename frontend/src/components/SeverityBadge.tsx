import React from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { SeverityLevel } from '../types';

interface SeverityBadgeProps {
  severity: SeverityLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
}) => {
  const norm = (severity || 'low').toLowerCase();

  let colorClasses = '';
  let inlineStyle: React.CSSProperties = { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' };
  let IconComponent = Info;
  let pulseClass = '';

  if (norm === 'high' || norm === 'critical') {
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
    inlineStyle = {};
    IconComponent = AlertTriangle;
    pulseClass = 'animate-pulse';
  } else if (norm === 'medium') {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
    inlineStyle = {};
    IconComponent = AlertCircle;
  } else {
    // low / info — use accent (neon green)
    IconComponent = ShieldAlert;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono uppercase font-medium rounded-md border tracking-wider select-none ${colorClasses} ${sizeClasses}`}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {showIcon && <IconComponent className={`${iconSizes} ${pulseClass}`} />}
      <span>{norm.toUpperCase()}</span>
    </span>
  );
};
