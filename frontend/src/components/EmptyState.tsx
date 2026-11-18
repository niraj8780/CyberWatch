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
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full mb-3"
        style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        <Icon className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
      </div>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="mt-1 text-xs max-w-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
          style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
