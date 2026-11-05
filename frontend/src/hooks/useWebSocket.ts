import { useState, useEffect, useRef, useCallback } from 'react';
import {
  WebSocketMessage,
  WebSocketStatus,
  NetworkStatistics,
  LiveConnectionEvent,
  Connection,
} from '../types';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  heartbeatIntervalMs?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, heartbeatIntervalMs = 10000 } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<NetworkStatistics | null>(null);
  const [recentEvents, setRecentEvents] = useState<LiveConnectionEvent[]>([]);
  const [recentConnections, setRecentConnections] = useState<Connection[]>([]);
  const [deltaStats, setDeltaStats] = useState<{ newCount: number; closedCount: number }>({
    newCount: 0,
    closedCount: 0,
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimestampRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);

  isPausedRef.current = isPaused;

  const getWebSocketUrl = useCallback(() => {
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Proxied through Vite's dev server or directly in prod
    return `${protocol}//${host}/api/v1/ws/network`;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setStatus('connecting');
    const wsUrl = getWebSocketUrl();

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        // Start heartbeat ping
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingTimestampRef.current = performance.now();
            ws.send(JSON.stringify({ action: 'ping', timestamp: new Date().toISOString() }));
          }
        }, heartbeatIntervalMs);
      };

      ws.onmessage = (event) => {
        if (isPausedRef.current) return;

        try {
          const msg = JSON.parse(event.data) as WebSocketMessage;

          if (msg.type === 'snapshot') {
            if (msg.data.statistics) setStatistics(msg.data.statistics);
            if (msg.data.connections) setRecentConnections(msg.data.connections);
            if (msg.data.recent_events) setRecentEvents(msg.data.recent_events);
          } else if (msg.type === 'update') {
            if (msg.data.statistics) setStatistics(msg.data.statistics);
            if (msg.data.connections_sample && msg.data.connections_sample.length > 0) {
              setRecentConnections(msg.data.connections_sample);
            }
            if (msg.data.recent_events) {
              setRecentEvents(msg.data.recent_events);
            }
            if (msg.data.delta) {
              setDeltaStats({
                newCount: msg.data.delta.new_count,
                closedCount: msg.data.delta.closed_count,
              });
            }
          } else if (msg.type === 'pong') {
            if (pingTimestampRef.current !== null) {
              const rtt = Math.round(performance.now() - pingTimestampRef.current);
              setLatencyMs(rtt);
              pingTimestampRef.current = null;
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        setLatencyMs(null);
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }

        // Attempt reconnection after 3 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error('Error initiating WebSocket connection:', err);
      setStatus('error');
    }
  }, [getWebSocketUrl, heartbeatIntervalMs]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setLatencyMs(null);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    isLive: status === 'connected',
    latencyMs,
    statistics,
    recentEvents,
    recentConnections,
    deltaStats,
    isPaused,
    togglePause,
    reconnect: connect,
    disconnect,
  };
}
