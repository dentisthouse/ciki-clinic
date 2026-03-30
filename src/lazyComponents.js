// Code splitting - Lazy load heavy components
import { lazy } from 'react';

// Heavy pages that should be lazy loaded
export const AnalyticsDashboard = lazy(() => import('./components/Analytics/AnalyticsDashboard'));
export const AdvancedAnalyticsDashboard = lazy(() => import('./components/Analytics/AdvancedAnalyticsDashboard'));
export const FloorManagement = lazy(() => import('./pages/FloorManagement'));
export const Staff = lazy(() => import('./pages/Staff'));
export const CustomerRelationship = lazy(() => import('./pages/CustomerRelationship'));

// Heavy components
export const TreatmentPlanTab = lazy(() => import('./components/EHR/TreatmentPlanTab'));
export const DentalChart = lazy(() => import('./components/Charting/DentalChart'));
export const BillingReport = lazy(() => import('./components/Billing/BillingReport'));

// Loading fallback component
export const LazyLoadingFallback = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
    }}>
        <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid var(--primary-600)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--neutral-500)' }}>กำลังโหลด...</p>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);
