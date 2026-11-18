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
    <div
      className="rounded-xl p-5 shadow-lg flex flex-col h-full"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Radio
            className={`h-4 w-4 ${isLive ? 'animate-pulse' : ''}`}
            style={{ color: isLive ? '#34d399' : 'var(--text-muted)' }}
          />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Real-Time Socket Stream
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {deltaStats && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span style={{ color: '#34d399' }}>+{deltaStats.newCount} new</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span className="text-amber-400">-{deltaStats.closedCount} closed</span>
            </div>
          )}
          <span
            className="px-1.5 py-0.5 text-[9px] font-mono rounded font-semibold uppercase tracking-wider"
            style={
              isLive
                ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }
                : { background: 'var(--bg-card-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
          >
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Stream list */}
      <div className="flex-1 overflow-y-auto max-h-80 space-y-2 pr-1 custom-scrollbar">
        {events.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <Clock className="h-6 w-6 mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Awaiting stream telemetry...</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
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
                className="flex items-center justify-between p-2.5 rounded-lg transition-all text-xs font-mono group"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
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
                      <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {evt.process_name}
                      </span>
                      {evt.pid && (
                        <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                          PID:{evt.pid}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {evt.protocol} &bull; {evt.local_address}{' '}
                      {evt.remote_address && evt.remote_address !== 'None' ? (
                        <>➔ {evt.remote_address}</>
                      ) : (
                        <span className="font-sans" style={{ color: 'var(--accent)' }}>({evt.status})</span>
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
                  <span className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeStr}</span>
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
