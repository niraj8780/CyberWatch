import React, { useState } from 'react';
import { ProcessInfo } from '../types';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import { Cpu, ChevronDown, ChevronRight, Hash, Network } from 'lucide-react';

interface ProcessTableProps {
  processes: ProcessInfo[];
  loading?: boolean;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  processes,
  loading = false,
}) => {
  const [expandedPids, setExpandedPids] = useState<Set<number>>(new Set());

  const toggleExpand = (pid: number) => {
    setExpandedPids((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg animate-pulse">
        <div className="p-4 border-b border-[#2d3548]">
          <div className="h-5 w-48 bg-[#2d3548] rounded" />
        </div>
        <div className="divide-y divide-[#2d3548]/60">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-4 w-12 bg-[#2d3548] rounded" />
              <div className="h-4 w-44 bg-[#2d3548] rounded" />
              <div className="h-6 w-20 bg-[#2d3548] rounded" />
              <div className="h-4 w-16 bg-[#2d3548] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <EmptyState
        icon={Cpu}
        title="No processes found"
        description="No matching processes were returned by the telemetry daemon."
      />
    );
  }

  return (
    <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2d3548] bg-[#111827]/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th scope="col" className="w-10 px-4 py-3"></th>
              <th scope="col" className="px-4 py-3">PID</th>
              <th scope="col" className="px-4 py-3">Process Name</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Active Sockets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d3548]/40">
            {processes.map((proc) => {
              const isExpanded = expandedPids.has(proc.pid);
              const hasConnections = proc.connections && proc.connections.length > 0;

              return (
                <React.Fragment key={proc.pid}>
                  <tr
                    onClick={() => toggleExpand(proc.pid)}
                    className="hover:bg-[#242b3d] cursor-pointer transition-colors duration-150 odd:bg-transparent even:bg-[#111827]/30"
                  >
                    {/* Expand icon */}
                    <td className="px-4 py-3 text-slate-400 text-center">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-cyan-400 inline" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500 inline" />
                      )}
                    </td>

                    {/* PID */}
                    <td className="px-4 py-3 font-mono">
                      <span className="inline-flex items-center gap-0.5 text-slate-300 bg-[#242b3d] px-2 py-0.5 rounded border border-[#2d3548] text-xs">
                        <Hash className="h-3 w-3 text-slate-500" />
                        {proc.pid}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-slate-100 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Cpu className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate max-w-xs">{proc.name}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                          proc.status?.toLowerCase() === 'running'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
                        {proc.status || 'UNKNOWN'}
                      </span>
                    </td>

                    {/* Connections count */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                          proc.connections_count > 0
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        <Network className="h-3 w-3" />
                        {proc.connections_count}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Sub-table */}
                  {isExpanded && (
                    <tr className="bg-[#111827]/80">
                      <td colSpan={5} className="p-4 pl-12 border-t border-[#2d3548]/40">
                        <div className="rounded-lg border border-[#2d3548] bg-[#1a1f2e] p-3">
                          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Network className="h-3.5 w-3.5 text-cyan-400" />
                            Active Sockets for PID {proc.pid} ({proc.name})
                          </h4>

                          {hasConnections ? (
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-[#2d3548] text-slate-400 text-[10px] uppercase font-semibold">
                                  <th className="py-2 px-2">Protocol</th>
                                  <th className="py-2 px-2">Local Endpoint</th>
                                  <th className="py-2 px-2">Remote Endpoint</th>
                                  <th className="py-2 px-2">State</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#2d3548]/30 font-mono">
                                {proc.connections.map((c, i) => (
                                  <tr key={i} className="hover:bg-[#242b3d]/50">
                                    <td className="py-1.5 px-2">
                                      <StatusBadge status={c.protocol} variant="protocol" />
                                    </td>
                                    <td className="py-1.5 px-2 text-cyan-400">
                                      {c.local_ip || '*'}:{c.local_port || '*'}
                                    </td>
                                    <td className="py-1.5 px-2 text-slate-300">
                                      {c.remote_ip || c.remote_port
                                        ? `${c.remote_ip || '*'}:${c.remote_port || '*'}`
                                        : '—'}
                                    </td>
                                    <td className="py-1.5 px-2">
                                      <StatusBadge status={c.status} variant="connection" />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2">
                              No active network sockets open for this process.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessTable;
