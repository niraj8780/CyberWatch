import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import NetworkMonitor from './pages/NetworkMonitor';
import Processes from './pages/Processes';
import Settings from './pages/Settings';
import ComingSoon from './pages/ComingSoon';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Core Monitoring Pages */}
        <Route index element={<Overview />} />
        <Route path="network" element={<NetworkMonitor />} />
        <Route path="processes" element={<Processes />} />
        <Route path="settings" element={<Settings />} />

        {/* Future Phase Placeholder Modules */}
        <Route
          path="threats"
          element={
            <ComingSoon
              title="Threat Detection Engine"
              description="Real-time heuristic threat detection, port scan recognition, anomaly detection algorithms, and signature analysis."
              phase={3}
            />
          }
        />
        <Route
          path="alerts"
          element={
            <ComingSoon
              title="Alerts & Incident Management"
              description="Triage alerts, configure custom webhook notifications, set severity escalation rules, and trace incident lifecycles."
              phase={4}
            />
          }
        />
        <Route
          path="ai-analyst"
          element={
            <ComingSoon
              title="AI Security Analyst"
              description="Automated LLM-driven incident investigation, threat actor attribution, and actionable mitigation guidance."
              phase={5}
            />
          }
        />
        <Route
          path="reports"
          element={
            <ComingSoon
              title="Executive Security Reports"
              description="Comprehensive compliance, posture reports, PDF summaries, and scheduled executive vulnerability digests."
              phase={7}
            />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
