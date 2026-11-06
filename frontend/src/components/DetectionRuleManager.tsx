import React, { useState } from 'react';
import { Sliders, ShieldCheck, ShieldOff, Check, AlertCircle } from 'lucide-react';
import { DetectionRule } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface DetectionRuleManagerProps {
  rules: DetectionRule[];
  onToggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const DetectionRuleManager: React.FC<DetectionRuleManagerProps> = ({
  rules,
  onToggleRule,
  isLoading = false,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    setTogglingId(ruleId);
    try {
      await onToggleRule(ruleId, !currentStatus);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="bg-[#111827] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[#2d3548] bg-[#0e1422] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Modular Detection Rules ({rules.filter((r) => r.enabled).length}/{rules.length} Active)
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          SOC Heuristic Engines
        </span>
      </div>

      <div className="divide-y divide-[#1e293b]">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">
            Loading rule configurations...
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">
            No detection rules found.
          </div>
        ) : (
          rules.map((rule) => {
            const isToggling = togglingId === rule.id;
            return (
              <div
                key={rule.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#152033] transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 bg-[#172136] border border-[#2d3548] px-2 py-0.5 rounded">
                      {rule.id}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-200">
                      {rule.name}
                    </h3>
                    <SeverityBadge severity={rule.severity} size="sm" />
                    <span className="text-[10px] font-mono uppercase text-cyan-400">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    {rule.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 select-none flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                      rule.enabled ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {rule.enabled ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Active
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-3.5 h-3.5" />
                        Disabled
                      </>
                    )}
                  </span>

                  {/* Accessible Toggle Button */}
                  <button
                    onClick={() => handleToggle(rule.id, rule.enabled)}
                    disabled={isToggling}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 ${
                      rule.enabled ? 'bg-cyan-600' : 'bg-slate-700'
                    }`}
                    aria-label={`Toggle ${rule.name}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
