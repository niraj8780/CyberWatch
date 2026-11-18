import React, { useEffect, useState } from 'react';
import { X, Globe, Shield, MapPin, Server, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getIPIntelligence } from '../services/api';
import { IPIntelligence } from '../types';

interface IPIntelligenceModalProps {
  ip: string | null;
  onClose: () => void;
}

export const IPIntelligenceModal: React.FC<IPIntelligenceModalProps> = ({ ip, onClose }) => {
  const [intel, setIntel] = useState<IPIntelligence | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ip) return;
    setLoading(true);
    getIPIntelligence(ip)
      .then(setIntel)
      .catch((err) => console.error('Failed to get IP intelligence:', err))
      .finally(() => setLoading(false));
  }, [ip]);

  if (!ip) return null;

  const scoreColor =
    (intel?.threat_score ?? 0) >= 70
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      : (intel?.threat_score ?? 0) >= 30
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{ip}</h2>
              <span className="text-[11px] font-mono uppercase" style={{ color: 'var(--accent)' }}>
                IP Geolocation &amp; Threat Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            Querying threat intelligence database...
          </div>
        ) : intel ? (
          <div className="space-y-4 text-xs">
            {/* Risk Score Indicator */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <div>
                <span className="block text-[10px] uppercase font-mono" style={{ color: 'var(--text-secondary)' }}>
                  Threat Reputation Score
                </span>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {intel.reputation.toUpperCase()}
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-lg border font-mono text-sm font-bold ${scoreColor}`}
              >
                {intel.threat_score} / 100
              </div>
            </div>

            {/* Geographical & ISP Details */}
            <div
              className="grid grid-cols-2 gap-3 rounded-lg p-3"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <div>
                <span className="text-[10px] uppercase font-mono flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Location
                </span>
                <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                  {intel.city ? `${intel.city}, ` : ''}{intel.country_name || 'Internal Network'}
                </p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Code: {intel.country_code || 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Server className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Network Operator
                </span>
                <p className="font-medium mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
                  {intel.organization || 'Private Network'}
                </p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  ASN: {intel.asn || 'RFC-1918'}
                </p>
              </div>
            </div>

            {/* Flags */}
            <div>
              <span className="text-[10px] uppercase font-mono block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Security Attributes &amp; Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {intel.flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded font-mono text-[10px]"
                    style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
            No intelligence records found.
          </div>
        )}

        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 600 }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
