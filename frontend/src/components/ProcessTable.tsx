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
      <div className="rounded-xl overflow-hidden shadow-lg animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="h-5 w-48 rounded" style={{ background: 'var(--bg-card-hover)' }} />
        </div>
        <div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="h-4 w-12 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-4 w-44 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-6 w-20 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-4 w-16 rounded" style={{ background: 'var(--bg-card-hover)' }} />
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
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="font-semibold uppercase tracking-wider text-[11px]" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <th scope="col" className="w-10 px-4 py-3"></th>
              <th scope="col" className="px-4 py-3">PID</th>
              <th scope="col" className="px-4 py-3">Process Name</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Active Sockets</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => {
              const isExpanded = expandedPids.has(proc.pid);
              const hasConnections = proc.connections && proc.connections.length > 0;

              return (
                <React.Fragment key={proc.pid}>
                  <tr
                    onClick={() => toggleExpand(proc.pid)}
                    className="cursor-pointer transition-colors duration-150"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Expand icon */}
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 inline" style={{ color: 'var(--accent)' }} />
                      ) : (
                        <ChevronRight className="h-4 w-4 inline" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </td>

                    {/* PID */}
                    <td className="px-4 py-3 font-mono">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs" style={{ color: 'var(--text-secondary)', background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}>
                        <Hash className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                        {proc.pid}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
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
                            : ''
                        }`}
                        style={proc.status?.toLowerCase() !== 'running' ? { background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
                        {proc.status || 'UNKNOWN'}
                      </span>
                    </td>

                    {/* Connections count */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
                        style={
                          proc.connections_count > 0
                            ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }
                            : { background: 'var(--bg-card-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }
                      >
                        <Network className="h-3 w-3" />
                        {proc.connections_count}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Sub-table */}
                  {isExpanded && (
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <td colSpan={5} className="p-4 pl-12" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <Network className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                            Active Sockets for PID {proc.pid} ({proc.name})
                          </h4>

                          {hasConnections ? (
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="text-[10px] uppercase font-semibold" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                  <th className="py-2 px-2">Protocol</th>
                                  <th className="py-2 px-2">Local Endpoint</th>
                                  <th className="py-2 px-2">Remote Endpoint</th>
                                  <th className="py-2 px-2">State</th>
                                </tr>
                              </thead>
                              <tbody className="font-mono">
                                {proc.connections.map((c, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <td className="py-1.5 px-2">
                                      <StatusBadge status={c.protocol} variant="protocol" />
                                    </td>
                                    <td className="py-1.5 px-2" style={{ color: 'var(--accent)' }}>
                                      {c.local_ip || '*'}:{c.local_port || '*'}
                                    </td>
                                    <td className="py-1.5 px-2" style={{ color: 'var(--text-secondary)' }}>
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
                            <p className="text-xs italic py-2" style={{ color: 'var(--text-secondary)' }}>
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
