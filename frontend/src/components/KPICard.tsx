import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type KPICardColor = 'cyan' | 'red' | 'amber' | 'emerald' | 'blue' | 'purple';

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

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'cyan',
  loading = false,
}) => {
  const colorStyles: Record<
    KPICardColor,
    { iconBg: string; iconColor: string; borderGlow: string }
  > = {
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      iconColor: 'text-cyan-400',
      borderGlow: 'hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },
    red: {
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      iconColor: 'text-rose-400',
      borderGlow: 'hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      iconColor: 'text-amber-400',
      borderGlow: 'hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      iconColor: 'text-emerald-400',
      borderGlow: 'hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      iconColor: 'text-blue-400',
      borderGlow: 'hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      iconColor: 'text-purple-400',
      borderGlow: 'hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    },
  };

  const selectedColor = colorStyles[color] || colorStyles.cyan;

  if (loading) {
    return (
      <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-[#2d3548] rounded" />
          <div className="h-10 w-10 bg-[#2d3548] rounded-lg" />
        </div>
        <div className="mt-4 h-8 w-20 bg-[#2d3548] rounded" />
        <div className="mt-2 h-3 w-32 bg-[#2d3548] rounded" />
      </div>
    );
  }

  return (
    <div
      className={`bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg transition-all duration-200 ${selectedColor.borderGlow} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${selectedColor.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
          {value}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-slate-400 truncate max-w-[70%]">
              {subtitle}
            </span>
          )}

          {trend && (
            <div className="flex items-center gap-1 ml-auto">
              {trend === 'up' && (
                <span className="flex items-center text-emerald-400 font-medium">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue || 'Up'}
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center text-rose-400 font-medium">
                  <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue || 'Down'}
                </span>
              )}
              {trend === 'neutral' && (
                <span className="flex items-center text-slate-400 font-medium">
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
