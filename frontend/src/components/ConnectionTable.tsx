import React from 'react';
import { Connection } from '../types';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import { Network, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

interface ConnectionTableProps {
  connections: Connection[];
  loading?: boolean;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ConnectionTable: React.FC<ConnectionTableProps> = ({
  connections,
  loading = false,
  total,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  showPagination = false,
  emptyTitle = 'No connections found',
  emptyDescription = 'There are no network connections matching the current criteria.',
}) => {
  const totalCount = total !== undefined ? total : connections.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const formatAddress = (ip: string | null, port: number | null) => {
    if (!ip && port === null) return '—';
    const displayIp = ip === null || ip === '' || ip === '0.0.0.0' ? '*' : ip;
    const displayPort = port === null ? '*' : port;
    return `${displayIp}:${displayPort}`;
  };

  if (loading) {
    return (
      <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#2d3548]">
          <div className="h-5 w-40 bg-[#2d3548] rounded animate-pulse" />
        </div>
        <div className="divide-y divide-[#2d3548]/60">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="h-6 w-16 bg-[#2d3548] rounded" />
              <div className="h-4 w-36 bg-[#2d3548] rounded" />
              <div className="h-4 w-36 bg-[#2d3548] rounded" />
              <div className="h-6 w-24 bg-[#2d3548] rounded" />
              <div className="h-4 w-28 bg-[#2d3548] rounded" />
              <div className="h-4 w-12 bg-[#2d3548] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2d3548] bg-[#111827]/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th scope="col" className="px-4 py-3">Protocol</th>
              <th scope="col" className="px-4 py-3">Local Address</th>
              <th scope="col" className="px-4 py-3">Remote Address</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Process</th>
              <th scope="col" className="px-4 py-3 text-right">PID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d3548]/40 font-mono">
            {connections.map((conn, index) => (
              <tr
                key={`${conn.local_ip}-${conn.local_port}-${conn.remote_ip}-${conn.remote_port}-${conn.pid}-${index}`}
                className="hover:bg-[#242b3d]/80 transition-colors duration-150 odd:bg-transparent even:bg-[#111827]/30"
              >
                {/* Protocol */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={conn.protocol} variant="protocol" />
                </td>

                {/* Local Address */}
                <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                  <span className="text-cyan-400 font-medium">
                    {formatAddress(conn.local_ip, conn.local_port)}
                  </span>
                </td>

                {/* Remote Address */}
                <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                  {conn.remote_ip || conn.remote_port ? (
                    <span>{formatAddress(conn.remote_ip, conn.remote_port)}</span>
                  ) : (
                    <span className="text-slate-500 font-sans italic">none</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={conn.status} variant="connection" />
                </td>

                {/* Process */}
                <td className="px-4 py-3 whitespace-nowrap font-sans font-medium text-slate-300">
                  {conn.process_name ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {conn.process_name}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Unknown</span>
                  )}
                </td>

                {/* PID */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {conn.pid !== null ? (
                    <span className="inline-flex items-center gap-0.5 text-slate-400 bg-[#242b3d] px-2 py-0.5 rounded border border-[#2d3548] text-[11px]">
                      <Hash className="h-3 w-3 text-slate-500" />
                      {conn.pid}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2d3548] bg-[#111827]/40 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-[#2d3548] bg-[#1e2538] text-slate-300 hover:text-white hover:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono font-medium text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-[#2d3548] bg-[#1e2538] text-slate-300 hover:text-white hover:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionTable;
