import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import NetworkMonitor from './pages/NetworkMonitor';
import Processes from './pages/Processes';
import Settings from './pages/Settings';
import { ThreatDetection } from './pages/ThreatDetection';
import { Alerts } from './pages/Alerts';
import { AiAnalyst } from './pages/AiAnalyst';
import { Reports } from './pages/Reports';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Core Monitoring & SOC Pages */}
        <Route index element={<Overview />} />
        <Route path="network" element={<NetworkMonitor />} />
        <Route path="threats" element={<ThreatDetection />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="processes" element={<Processes />} />
        <Route path="ai-analyst" element={<AiAnalyst />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
