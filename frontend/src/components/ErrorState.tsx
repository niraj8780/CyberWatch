import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4 ring-1 ring-red-500/20">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-red-200">
        Monitoring Service Error
      </h3>
      <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
        {message || 'Unable to connect to the CyberWatch telemetry service.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600/20 px-4 py-2 text-xs font-semibold text-red-300 ring-1 ring-red-500/30 transition-all duration-200 hover:bg-red-600/30 hover:text-red-200 active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default ErrorState;
