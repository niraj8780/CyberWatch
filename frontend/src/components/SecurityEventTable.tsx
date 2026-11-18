import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SecurityEvent } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface SecurityEventTableProps {
  events: SecurityEvent[];
  onSelectEvent: (event: SecurityEvent) => void;
  isLoading?: boolean;
}

export const SecurityEventTable: React.FC<SecurityEventTableProps> = ({
  events,
  onSelectEvent,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      searchTerm === '' ||
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.process_name && evt.process_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.dest_ip && evt.dest_ip.includes(searchTerm)) ||
      evt.rule_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === 'all' || evt.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Table Filter Controls */}
      <div
        className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search threats, processes, IPs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none transition font-mono"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg text-xs py-1.5 px-3 focus:outline-none font-mono transition"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              className="text-[11px] font-mono uppercase select-none"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Rule / Threat</th>
              <th className="py-3 px-4">Process (PID)</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4 text-center">Confidence</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 font-mono" style={{ color: 'var(--text-secondary)' }}>
                  Loading detected security events...
                </td>
              </tr>
            ) : paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No Threats Detected</span>
                    <span className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
                      {searchTerm || severityFilter !== 'all'
                        ? 'No events match your current filter parameters.'
                        : 'Active heuristics report no anomalous socket activity or signature matches on monitored interfaces.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEvents.map((evt) => {
                const confPercent = Math.round(evt.confidence * 100);
                return (
                  <tr
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="cursor-pointer transition group"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-3 px-4 font-mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={evt.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div
                        className="font-medium transition truncate"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.color = 'var(--accent)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)')}
                      >
                        {evt.title}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {evt.rule_id} • {evt.detection_type}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{evt.process_name || 'System'}</span>
                      {evt.pid && <span className="ml-1" style={{ color: 'var(--text-muted)' }}>({evt.pid})</span>}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {evt.dest_ip ? (
                        <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <span>{evt.dest_ip}</span>
                          {evt.dest_port && (
                            <span className="text-rose-400 font-bold">:{evt.dest_port}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Inbound / Listening</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>{confPercent}%</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[11px] transition"
                        style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
                          (e.currentTarget as HTMLButtonElement).style.color = '#000';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                        }}
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredEvents.length > itemsPerPage && (
        <div
          className="p-3 flex items-center justify-between text-xs font-mono"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}{' '}
            threats
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
