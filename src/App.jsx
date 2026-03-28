import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import Schedule from './pages/Schedule';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import LabTracking from './pages/LabTracking';
import SocialSecurity from './pages/SocialSecurity';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import AdvancedAnalyticsDashboard from './components/Analytics/AdvancedAnalyticsDashboard';
import LinePortal from './pages/LinePortal';
import Attendance from './pages/Attendance';
import Staff from './pages/Staff';
import Expenses from './pages/Expenses';

import HelpCenter from './pages/HelpCenter';
import Charting from './pages/Charting';
import QueueDisplay from './pages/QueueDisplay';

// Placeholder components
const Placeholder = ({ title }) => (
  <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p style={{ color: 'var(--neutral-500)' }}>Coming soon in next module.</p>
  </div>
);

import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/System/AuthGuard';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AuthGuard>
                <Routes>
                  <Route path="queue" element={<QueueDisplay />} />
                  <Route path="line-portal" element={<LinePortal />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="patients" element={<Patients />} />
                    <Route path="patients/:id" element={<PatientProfile />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="charting" element={<Charting />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="labs" element={<LabTracking />} />
                    <Route path="sso" element={<SocialSecurity />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="advanced-analytics" element={<AdvancedAnalyticsDashboard />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="expenses" element={<Expenses />} />

                    <Route path="help" element={<HelpCenter />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </AuthGuard>
            </BrowserRouter>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
