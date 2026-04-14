import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import QuotaChecker from '../components/SSO/QuotaChecker';
import ClaimWizard from '../components/SSO/ClaimWizard';
import ClaimTracking from '../components/SSO/ClaimTracking';
import { ShieldCheck, BarChart2 } from 'lucide-react';
import '../styles/sso.css';

const SocialSecurity = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [verifiedPatient, setVerifiedPatient] = useState(null);
    const [viewMode, setViewMode] = useState('check'); // check, wizard

    const handlePatientVerified = (patientData) => {
        setVerifiedPatient(patientData);
        setViewMode('wizard');
    };

    const handleClaimCompleted = () => {
        setVerifiedPatient(null);
        setViewMode('check');
        setActiveTab('dashboard'); // Go to tracking to see the new claim
    };

    return (
        <div className="animate-slide-up">
            <header className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div className="page-title-group">
                    <h1 className="flex items-center gap-4">
                        <div className="floating-icon" style={{ padding: '0.75rem', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(20, 184, 166, 0.2)' }}>
                            <ShieldCheck size={32} />
                        </div>
                        {t('sso_title')}
                    </h1>
                    <p style={{ marginTop: '0.5rem', color: 'var(--neutral-500)', fontSize: '1rem' }}>Manage Social Security rights, claims, and reimbursements.</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="sso-tabs-container">
                <button
                    className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: activeTab === 'dashboard' ? 'white' : 'transparent',
                        color: activeTab === 'dashboard' ? 'var(--primary-600)' : 'var(--neutral-500)',
                        boxShadow: activeTab === 'dashboard' ? 'var(--shadow-sm)' : 'none',
                        border: 'none',
                        fontWeight: 700,
                        transition: 'all 0.3s'
                    }}
                >
                    <BarChart2 size={18} />
                    {t('sso_tab_dashboard')}
                </button>
                <button
                    className={`tab ${activeTab === 'check' ? 'active' : ''}`}
                    onClick={() => setActiveTab('check')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: activeTab === 'check' ? 'white' : 'transparent',
                        color: activeTab === 'check' ? 'var(--primary-600)' : 'var(--neutral-500)',
                        boxShadow: activeTab === 'check' ? 'var(--shadow-sm)' : 'none',
                        border: 'none',
                        fontWeight: 700,
                        transition: 'all 0.3s'
                    }}
                >
                    <ShieldCheck size={18} />
                    {t('sso_tab_check')}
                </button>
            </div>

            {/* Content Area */}
            <div className="tab-content animate-fade-in" style={{ flex: 1 }}>
                {activeTab === 'dashboard' && <ClaimTracking />}

                {activeTab === 'check' && (
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        {viewMode === 'check' && (
                            <QuotaChecker onVerified={handlePatientVerified} />
                        )}
                        {viewMode === 'wizard' && verifiedPatient && (
                            <ClaimWizard
                                patient={verifiedPatient}
                                onComplete={handleClaimCompleted}
                                onCancel={() => setVerifiedPatient(null)}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialSecurity;
