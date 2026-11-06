import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
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
    <div className="bg-[#111827] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg">
      {/* Table Filter Controls */}
      <div className="p-4 border-b border-[#2d3548] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0e1422]">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search threats, processes, IPs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-[#172136] border border-[#2d3548] rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#172136] border border-[#2d3548] rounded-lg text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:border-cyan-500 font-mono transition"
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
            <tr className="border-b border-[#2d3548] bg-[#0c121e] text-[11px] font-mono uppercase text-slate-400 select-none">
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Rule / Threat</th>
              <th className="py-3 px-4">Process (PID)</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4 text-center">Confidence</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 font-mono">
                  Loading detected security events...
                </td>
              </tr>
            ) : paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-slate-600" />
                    <span className="text-sm text-slate-300 font-medium">No Threats Detected</span>
                    <span className="text-xs text-slate-500 max-w-sm">
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
                    className="hover:bg-[#152033] cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={evt.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-200 group-hover:text-cyan-300 transition truncate">
                        {evt.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {evt.rule_id} • {evt.detection_type}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className="text-slate-200 font-medium">{evt.process_name || 'System'}</span>
                      {evt.pid && <span className="text-slate-500 ml-1">({evt.pid})</span>}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {evt.dest_ip ? (
                        <div className="flex items-center gap-1 text-slate-300">
                          <span>{evt.dest_ip}</span>
                          {evt.dest_port && (
                            <span className="text-rose-400 font-bold">:{evt.dest_port}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">Inbound / Listening</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-mono text-cyan-400 font-semibold">{confPercent}%</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e293b] hover:bg-cyan-600 hover:text-white text-slate-300 font-mono text-[11px] transition"
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
        <div className="p-3 border-t border-[#2d3548] flex items-center justify-between text-xs text-slate-400 bg-[#0e1422] font-mono">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}{' '}
            threats
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-[#2d3548] bg-[#172136] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#22304d] text-slate-200 transition"
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
              className="p-1.5 rounded border border-[#2d3548] bg-[#172136] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#22304d] text-slate-200 transition"
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
