import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { AlertStatus } from '../types';

interface AlertStatusBadgeProps {
  status: AlertStatus | string;
  size?: 'sm' | 'md';
}

export const AlertStatusBadge: React.FC<AlertStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const norm = (status || 'new').toLowerCase();

  let styles = 'bg-rose-500/15 text-rose-400 border-rose-500/40';
  let Icon = AlertCircle;
  let label = 'NEW';
  let dotPulse = 'animate-ping';

  if (norm === 'acknowledged') {
    styles = 'bg-amber-500/15 text-amber-400 border-amber-500/40';
    Icon = Clock;
    label = 'ACKNOWLEDGED';
    dotPulse = '';
  } else if (norm === 'resolved') {
    styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    Icon = CheckCircle2;
    label = 'RESOLVED';
    dotPulse = '';
  }

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border tracking-wider select-none ${styles} ${sizeClass}`}
    >
      <span className="relative flex h-2 w-2">
        {dotPulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 bg-current ${dotPulse}`}
          />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>
      <span>{label}</span>
    </span>
  );
};
