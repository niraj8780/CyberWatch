import React from 'react';
import { LiveConnectionEvent } from '../types';
import { Radio, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface LiveEventFeedProps {
  events: LiveConnectionEvent[];
  isLive: boolean;
  deltaStats?: { newCount: number; closedCount: number };
}

export const LiveEventFeed: React.FC<LiveEventFeedProps> = ({
  events,
  isLive,
  deltaStats,
}) => {
  return (
    <div className="bg-[#1e2538] border border-[#2d3548] rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#2d3548] pb-3">
        <div className="flex items-center gap-2">
          <Radio
            className={`h-4 w-4 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}
          />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Real-Time Socket Stream
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {deltaStats && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-emerald-400">+{deltaStats.newCount} new</span>
              <span className="text-slate-600">/</span>
              <span className="text-amber-400">-{deltaStats.closedCount} closed</span>
            </div>
          )}
          <span
            className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-semibold uppercase tracking-wider ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Stream list */}
      <div className="flex-1 overflow-y-auto max-h-80 space-y-2 pr-1 custom-scrollbar">
        {events.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <Clock className="h-6 w-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">Awaiting stream telemetry...</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Connection events will appear here in real-time as processes open and close sockets.
            </p>
          </div>
        ) : (
          events.map((evt) => {
            const isConnect = evt.event_type === 'CONNECTED';
            const timeStr = new Date(evt.timestamp).toLocaleTimeString();

            return (
              <div
                key={evt.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#111827]/60 border border-[#2d3548]/80 hover:border-cyan-500/30 transition-all text-xs font-mono group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${
                      isConnect
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isConnect ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-200 truncate">
                        {evt.process_name}
                      </span>
                      {evt.pid && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          PID:{evt.pid}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">
                      {evt.protocol} &bull; {evt.local_address}{' '}
                      {evt.remote_address && evt.remote_address !== 'None' ? (
                        <>➔ {evt.remote_address}</>
                      ) : (
                        <span className="text-cyan-400 font-sans">({evt.status})</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span
                    className={`text-[9px] font-bold tracking-wider uppercase px-1 rounded ${
                      isConnect
                        ? 'text-emerald-400 bg-emerald-950/40'
                        : 'text-amber-400 bg-amber-950/40'
                    }`}
                  >
                    {evt.event_type}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">{timeStr}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveEventFeed;
