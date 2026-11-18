import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <Loader2
        className={`${sizeMap[size]} animate-spin transition-all`}
        style={{ color: 'var(--accent)' }}
      />
      {message && (
        <p className="mt-3 text-sm font-medium animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
