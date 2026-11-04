import React from 'react';

type BadgeVariant = 'connection' | 'protocol' | 'severity' | 'health';

interface StatusBadgeProps {
  status: string | null | undefined;
  variant?: BadgeVariant;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'connection',
  className = '',
}) => {
  const value = status ? status.toUpperCase() : 'UNKNOWN';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === 'connection') {
    switch (value) {
      case 'ESTABLISHED':
        colorClasses = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
        break;
      case 'LISTEN':
      case 'LISTENING':
        colorClasses = 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30';
        break;
      case 'TIME_WAIT':
        colorClasses = 'bg-amber-950/40 text-amber-400 border-amber-500/30';
        break;
      case 'CLOSE_WAIT':
        colorClasses = 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30';
        break;
      case 'SYN_SENT':
      case 'SYN_RECV':
        colorClasses = 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30';
        break;
      case 'FIN_WAIT1':
      case 'FIN_WAIT2':
      case 'CLOSING':
      case 'LAST_ACK':
        colorClasses = 'bg-orange-950/40 text-orange-400 border-orange-500/30';
        break;
      case 'NONE':
      case 'UNKNOWN':
        colorClasses = 'bg-slate-800/60 text-slate-400 border-slate-700/50';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    }
  } else if (variant === 'protocol') {
    switch (value) {
      case 'TCP':
        colorClasses = 'bg-blue-950/50 text-blue-400 border-blue-500/30';
        break;
      case 'UDP':
        colorClasses = 'bg-purple-950/50 text-purple-400 border-purple-500/30';
        break;
      case 'ICMP':
        colorClasses = 'bg-rose-950/50 text-rose-400 border-rose-500/30';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    }
  } else if (variant === 'severity') {
    switch (value) {
      case 'CRITICAL':
      case 'HIGH':
      case 'DANGER':
        colorClasses = 'bg-rose-950/50 text-rose-400 border-rose-500/30 animate-pulse';
        break;
      case 'MEDIUM':
      case 'WARNING':
        colorClasses = 'bg-amber-950/50 text-amber-400 border-amber-500/30';
        break;
      case 'LOW':
      case 'INFO':
        colorClasses = 'bg-cyan-950/50 text-cyan-400 border-cyan-500/30';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    }
  } else if (variant === 'health') {
    switch (value) {
      case 'HEALTHY':
      case 'ACTIVE':
      case 'RUNNING':
      case 'OK':
        colorClasses = 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30';
        break;
      case 'DEGRADED':
        colorClasses = 'bg-amber-950/50 text-amber-400 border-amber-500/30';
        break;
      case 'DOWN':
      case 'ERROR':
      case 'INACTIVE':
        colorClasses = 'bg-rose-950/50 text-rose-400 border-rose-500/30';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${colorClasses} tracking-wider transition-colors duration-150 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {value}
    </span>
  );
};

export default StatusBadge;
