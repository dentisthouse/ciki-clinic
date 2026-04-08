import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './context/LanguageContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
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
import CustomerRelationship from './pages/CustomerRelationship';
import DrugLabelSystem from './pages/DrugLabelSystem';
import MedicalCertificateSystem from './pages/MedicalCertificateSystem';
import BusinessAnalytics from './pages/BusinessAnalytics';
import CouponManagement from './pages/CouponManagement';
import EClaimSystem from './pages/EClaimSystem';
import OnlinePaymentSystem from './pages/OnlinePaymentSystem';
import AdvancedReports from './pages/AdvancedReports';
import OwnerDashboard from './pages/OwnerDashboard';
import FinancialManagement from './pages/FinancialManagement';
import ClinicSettings from './pages/ClinicSettings';
import StaffManagement from './pages/StaffManagement';
import SecurityAudit from './pages/SecurityAudit';
import RoleSettings from './pages/RoleSettings';
import NotificationSettings from './pages/NotificationSettings';
import TreatmentPlan from './pages/TreatmentPlan';

import HelpCenter from './pages/HelpCenter';
import QueueDisplay from './pages/QueueDisplay';
import FloorManagement from './pages/FloorManagement';
import DailyReport from './pages/DailyReport';
import ManagementHub from './pages/ManagementHub';

import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/System/AuthGuard';

// Create React Query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <DataProvider>
                <NotificationProvider>
                  <BrowserRouter>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="queue" element={<QueueDisplay />} />
                      <Route path="line-portal" element={<LinePortal />} />
                      
                      {/* Protected Private Routes */}
                      <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
                        <Route index element={<Dashboard />} />
                        <Route path="patients" element={<Patients />} />
                        <Route path="patients/:id" element={<PatientProfile />} />
                        <Route path="schedule" element={<Schedule />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="billing" element={<Billing />} />
                        <Route path="labs" element={<LabTracking />} />
                        <Route path="sso" element={<SocialSecurity />} />
                        <Route path="analytics" element={<AnalyticsDashboard />} />
                        <Route path="advanced-analytics" element={<AdvancedAnalyticsDashboard />} />
                        <Route path="attendance" element={<Attendance />} />
                        <Route path="staff" element={<Staff />} />
                        <Route path="floor" element={<FloorManagement />} />
                        <Route path="daily-report" element={<DailyReport />} />
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="crm" element={<CustomerRelationship />} />
                        <Route path="drug-labels" element={<DrugLabelSystem />} />
                        <Route path="medical-certificates" element={<MedicalCertificateSystem />} />
                        <Route path="business-analytics" element={<BusinessAnalytics />} />
                        <Route path="coupons" element={<CouponManagement />} />
                        <Route path="e-claim" element={<EClaimSystem />} />
                        <Route path="online-payments" element={<OnlinePaymentSystem />} />
                        <Route path="reports" element={<AdvancedReports />} />
                        <Route path="owner-dashboard" element={<OwnerDashboard />} />
                        <Route path="financial" element={<FinancialManagement />} />
                        <Route path="settings" element={<ClinicSettings />} />
                        <Route path="staff-management" element={<StaffManagement />} />
                        <Route path="security" element={<SecurityAudit />} />
                        <Route path="roles" element={<RoleSettings />} />
                        <Route path="notifications" element={<NotificationSettings />} />
                        <Route path="treatment-plan" element={<TreatmentPlan />} />
                        <Route path="management" element={<ManagementHub />} />

                        <Route path="help" element={<HelpCenter />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </NotificationProvider>
              </DataProvider>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
