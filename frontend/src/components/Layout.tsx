import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getHealth } from '../services/api';
import { Clock, ShieldCheck, Wifi, Menu, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Real-time clock update
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

  // Poll health status for header indicator
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await getHealth();
        if (isMounted) {
          setIsHealthy(res.status === 'healthy' || res.monitoring_active);
        }
      } catch {
        if (isMounted) {
          setIsHealthy(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <Sidebar isMonitoringActive={isHealthy} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-64 h-full bg-[#111827]">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-[#1e2538] border border-[#2d3548]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar isMonitoringActive={isHealthy} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0">
        {/* Header Bar */}
        <header className="h-16 bg-[#111827]/80 backdrop-blur-md border-b border-[#2d3548] px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#1e2538] border border-[#2d3548] md:hidden"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400 hidden sm:block" />
              <span className="font-semibold text-sm sm:text-base text-slate-200 tracking-wide">
                Security Operations Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs">
            {/* System Clock */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-[#2d3548] font-mono text-slate-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{currentTime}</span>
            </div>

            {/* Health / Daemon Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2538] border border-[#2d3548]">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isHealthy ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="font-medium text-slate-300 hidden sm:inline">
                {isHealthy ? 'System Online' : 'Daemon Disconnected'}
              </span>
              <Wifi
                className={`h-3.5 w-3.5 ${
                  isHealthy ? 'text-emerald-400' : 'text-rose-500'
                }`}
              />
            </div>
          </div>
        </header>

        {/* Scrollable Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
