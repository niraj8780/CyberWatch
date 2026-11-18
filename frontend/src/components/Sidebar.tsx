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
  User,
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
  { label: 'Overview',         path: '/',           icon: LayoutDashboard },
  { label: 'Network Monitor',  path: '/network',    icon: Network },
  { label: 'Threat Detection', path: '/threats',    icon: ShieldAlert },
  { label: 'Alerts',           path: '/alerts',     icon: Bell },
  { label: 'Processes',        path: '/processes',  icon: Cpu },
  { label: 'AI Analyst',       path: '/ai-analyst', icon: Brain },
  { label: 'Reports',          path: '/reports',    icon: FileText },
  { label: 'Settings',         path: '/settings',   icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMonitoringActive = true }) => {
  return (
    <aside
      className="w-64 flex flex-col h-screen fixed left-0 top-0 z-30 select-none"
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand */}
      <div
        className="h-16 flex items-center px-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              boxShadow: '0 0 14px var(--accent-glow)',
            }}
          >
            <Shield className="h-5 w-5" style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-primary)' }}>
              CYBER<span style={{ color: 'var(--accent)' }}>WATCH</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              SOC MONITOR v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Analyst Avatar (Reference Design) */}
      <div
        className="px-5 py-3 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{
              background: 'var(--accent-dim)',
              border: '1.5px solid var(--accent)',
              boxShadow: '0 0 8px var(--accent-glow)',
            }}
          >
            <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border"
            style={{ background: 'var(--accent)', borderColor: 'var(--bg-secondary)' }}
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            Security Analyst
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--accent)' }}>
            Active Monitor
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="section-label px-3 pb-3">Core Modules</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                  isActive ? 'nav-active' : 'nav-idle'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      boxShadow: '0 0 10px var(--accent-glow)',
                    }
                  : {
                      color: 'var(--text-secondary)',
                      border: '1px solid transparent',
                    }
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.soon && (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                >
                  Soon
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Status */}
      <div
        className="p-4 shrink-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}
      >
        <div
          className="rounded-lg p-3 flex items-center justify-between"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <span
                className="flex h-2.5 w-2.5 rounded-full"
                style={{ background: isMonitoringActive ? 'var(--accent)' : '#ef4444', boxShadow: isMonitoringActive ? '0 0 8px var(--accent)' : 'none' }}
              />
              {isMonitoringActive && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full top-0 left-0 opacity-60"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {isMonitoringActive ? 'Sensor Active' : 'Sensor Offline'}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                Real-time daemon
              </span>
            </div>
          </div>
          <Activity className="h-4 w-4" style={{ color: isMonitoringActive ? 'var(--accent)' : '#6b7280' }} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
