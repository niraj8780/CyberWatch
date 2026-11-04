import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Network,
  ShieldAlert,
  Bell,
  Cpu,
  Brain,
  FileText,
  Settings,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  isMonitoringActive?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  soon?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Network Monitor', path: '/network', icon: Network },
  { label: 'Threat Detection', path: '/threats', icon: ShieldAlert, soon: true },
  { label: 'Alerts', path: '/alerts', icon: Bell, soon: true },
  { label: 'Processes', path: '/processes', icon: Cpu },
  { label: 'AI Analyst', path: '/ai-analyst', icon: Brain, soon: true },
  { label: 'Reports', path: '/reports', icon: FileText, soon: true },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMonitoringActive = true }) => {
  return (
    <aside className="w-64 bg-[#111827] border-r border-[#2d3548] flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#2d3548] bg-[#0a0e1a]/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="h-5 w-5 text-navy-900 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5">
              CYBER<span className="text-cyan-400">WATCH</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              SOC MONITOR v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2538]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-cyan-300" />
                <span>{item.label}</span>
              </div>
              {item.soon && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-[#242b3d] text-slate-400 border border-[#2d3548]">
                  Soon
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Status Panel */}
      <div className="p-4 border-t border-[#2d3548] bg-[#0a0e1a]/80">
        <div className="rounded-lg bg-[#1e2538] border border-[#2d3548] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span
                className={`flex h-2.5 w-2.5 rounded-full ${
                  isMonitoringActive ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              {isMonitoringActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 top-0 left-0" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">
                {isMonitoringActive ? 'Sensor Active' : 'Sensor Offline'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Real-time daemon
              </span>
            </div>
          </div>
          <Activity
            className={`h-4 w-4 ${
              isMonitoringActive ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
