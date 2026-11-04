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
        <div className="h-20 w-20 rounded-2xl bg-[#1e2538] border border-[#2d3548] flex items-center justify-center shadow-xl shadow-cyan-950/20">
          <Lock className="h-9 w-9 text-cyan-400" />
        </div>
        <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase mb-3">
        <Shield className="h-3 w-3" />
        Scheduled Feature &bull; Phase {phase}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
        {title}
      </h1>

      <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e2538] border border-[#2d3548] text-xs font-medium text-slate-200 hover:text-white hover:border-cyan-500/40 transition-all duration-200"
        >
          Return to Overview
        </Link>
        <Link
          to="/network"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-200"
        >
          Open Network Monitor
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
