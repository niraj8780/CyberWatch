import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-[#1e2538]/50 border border-[#2d3548] rounded-xl ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#242b3d] text-slate-400 mb-3 border border-[#2d3548]">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-[#242b3d] border border-[#2d3548] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
