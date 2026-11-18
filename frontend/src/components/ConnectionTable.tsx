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
      <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="h-5 w-40 rounded animate-pulse" style={{ background: 'var(--bg-card-hover)' }} />
        </div>
        <div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="h-6 w-16 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-4 w-36 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-4 w-36 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-6 w-24 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-4 w-28 rounded" style={{ background: 'var(--bg-card-hover)' }} />
              <div className="h-4 w-12 rounded" style={{ background: 'var(--bg-card-hover)' }} />
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
    <div className="rounded-xl overflow-hidden shadow-lg flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="font-semibold uppercase tracking-wider text-[11px]" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <th scope="col" className="px-4 py-3">Protocol</th>
              <th scope="col" className="px-4 py-3">Local Address</th>
              <th scope="col" className="px-4 py-3">Remote Address</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Process</th>
              <th scope="col" className="px-4 py-3 text-right">PID</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {connections.map((conn, index) => (
              <tr
                key={`${conn.local_ip}-${conn.local_port}-${conn.remote_ip}-${conn.remote_port}-${conn.pid}-${index}`}
                className="transition-colors duration-150"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Protocol */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={conn.protocol} variant="protocol" />
                </td>

                {/* Local Address */}
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--accent)' }} className="font-medium">
                    {formatAddress(conn.local_ip, conn.local_port)}
                  </span>
                </td>

                {/* Remote Address */}
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  {conn.remote_ip || conn.remote_port ? (
                    <span>{formatAddress(conn.remote_ip, conn.remote_port)}</span>
                  ) : (
                    <span className="font-sans italic" style={{ color: 'var(--text-muted)' }}>none</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={conn.status} variant="connection" />
                </td>

                {/* Process */}
                <td className="px-4 py-3 whitespace-nowrap font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {conn.process_name ? (
                    <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      {conn.process_name}
                    </span>
                  ) : (
                    <span className="italic" style={{ color: 'var(--text-muted)' }}>Unknown</span>
                  )}
                </td>

                {/* PID */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {conn.pid !== null ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px]" style={{ color: 'var(--text-secondary)', background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}>
                      <Hash className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                      {conn.pid}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <div>
            Showing{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{' '}
            of <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
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
