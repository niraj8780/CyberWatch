import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getHealth } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Clock, ShieldCheck, Wifi, Menu, X, Radio, Sun, Moon } from 'lucide-react';

export const Layout: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const location = useLocation();
  const { status: wsStatus, isLive, latencyMs } = useWebSocket();

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  }, [isDark]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' UTC'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await getHealth();
        if (isMounted) setIsHealthy(res.status === 'healthy' || res.monitoring_active);
      } catch {
        if (isMounted) setIsHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <Sidebar isMonitoringActive={isHealthy} />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-50 w-64 h-full" style={{ background: 'var(--bg-secondary)' }}>
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar isMonitoringActive={isHealthy} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-16 px-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md"
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg md:hidden transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 hidden sm:block" style={{ color: 'var(--accent)' }} />
              <span className="font-semibold text-sm sm:text-base tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Security Operations Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* WS Badge */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-mono text-[11px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <Radio
                className="h-3.5 w-3.5"
                style={{ color: isLive ? 'var(--accent)' : 'var(--text-muted)' }}
              />
              <span
                className="font-semibold tracking-wider"
                style={{ color: isLive ? 'var(--accent)' : wsStatus === 'connecting' ? '#f59e0b' : 'var(--text-muted)' }}
              >
                {isLive ? `LIVE ${latencyMs !== null ? `(${latencyMs}ms)` : ''}` : wsStatus === 'connecting' ? 'CONNECTING' : 'POLLING'}
              </span>
            </div>

            {/* Clock */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              <span>{currentTime}</span>
            </div>

            {/* Health */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                  style={{ background: isHealthy ? 'var(--accent)' : '#ef4444' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: isHealthy ? 'var(--accent)' : '#ef4444', boxShadow: isHealthy ? '0 0 6px var(--accent)' : 'none' }}
                />
              </span>
              <span className="font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                {isHealthy ? 'Active' : 'Offline'}
              </span>
              <Wifi className="h-3.5 w-3.5" style={{ color: isHealthy ? 'var(--accent)' : '#6b7280' }} />
            </div>

            {/* Dark / Light toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} /> : <Moon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
              <span className="hidden sm:inline text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                {isDark ? 'LIGHT' : 'DARK'}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
