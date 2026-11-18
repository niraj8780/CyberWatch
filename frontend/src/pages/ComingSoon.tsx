import React from 'react';
import { Lock, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description: string;
  phase: string | number;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description,
  phase,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
      <div className="relative mb-6">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-xl"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}
        >
          <Lock className="h-9 w-9" style={{ color: 'var(--accent)' }} />
        </div>
        <div
          className="absolute -top-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--border)',
          }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
        </div>
      </div>

      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase mb-3"
        style={{
          background: 'var(--accent-dim)',
          border: '1px solid var(--border)',
          color: 'var(--accent)',
        }}
      >
        <Shield className="h-3 w-3" />
        Scheduled Feature &bull; Phase {phase}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h1>

      <p className="mt-3 text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          Return to Overview
        </Link>
        <Link
          to="/network"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg transition-all duration-200"
          style={{
            background: 'var(--accent)',
            color: '#050810',
            boxShadow: '0 0 15px var(--accent-glow)',
          }}
        >
          Open Network Monitor
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
