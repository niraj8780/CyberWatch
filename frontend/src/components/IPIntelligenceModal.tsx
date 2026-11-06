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
        className="bg-[#0f172a] border border-[#334155] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono">{ip}</h2>
              <span className="text-[11px] font-mono text-cyan-400 uppercase">
                IP Geolocation & Threat Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-slate-400">
            Querying threat intelligence database...
          </div>
        ) : intel ? (
          <div className="space-y-4 text-xs">
            {/* Risk Score Indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#131d33] border border-[#223254]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">
                  Threat Reputation Score
                </span>
                <span className="text-sm font-bold font-mono text-slate-200">
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
            <div className="grid grid-cols-2 gap-3 bg-[#131d33] border border-[#223254] rounded-lg p-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Location
                </span>
                <p className="font-medium text-slate-200 mt-1">
                  {intel.city ? `${intel.city}, ` : ''}{intel.country_name || 'Internal Network'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Code: {intel.country_code || 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> Network Operator
                </span>
                <p className="font-medium text-slate-200 mt-1 truncate">
                  {intel.organization || 'Private Network'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ASN: {intel.asn || 'RFC-1918'}
                </p>
              </div>
            </div>

            {/* Flags */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-2">
                Security Attributes & Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {intel.flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No intelligence records found.
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#1e293b]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
