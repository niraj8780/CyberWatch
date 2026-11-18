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
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Modular Detection Rules ({rules.filter((r) => r.enabled).length}/{rules.length} Active)
          </h2>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          SOC Heuristic Engines
        </span>
      </div>

      <div>
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            Loading rule configurations...
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            No detection rules found.
          </div>
        ) : (
          rules.map((rule) => {
            const isToggling = togglingId === rule.id;
            return (
              <div
                key={rule.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className="font-mono text-xs px-2 py-0.5 rounded"
                      style={{ color: 'var(--text-secondary)', background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}
                    >
                      {rule.id}
                    </span>
                    <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {rule.name}
                    </h3>
                    <SeverityBadge severity={rule.severity} size="sm" />
                    <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--accent)' }}>
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                    {rule.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 select-none flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                      rule.enabled ? 'text-emerald-400' : ''
                    }`}
                    style={!rule.enabled ? { color: 'var(--text-muted)' } : {}}
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
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{
                      background: rule.enabled ? 'var(--accent)' : 'var(--bg-card-hover)',
                      border: '1px solid var(--border)',
                    }}
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
