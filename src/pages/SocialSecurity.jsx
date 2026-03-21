import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import QuotaChecker from '../components/SSO/QuotaChecker';
import ClaimWizard from '../components/SSO/ClaimWizard';
import ClaimTracking from '../components/SSO/ClaimTracking';
import { ShieldCheck, BarChart2 } from 'lucide-react';

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
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={32} className="text-primary" />
                        {t('sso_title')}
                    </h1>
                    <p className="page-subtitle">Manage Social Security rights, claims, and reimbursements.</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <BarChart2 size={18} />
                    {t('sso_tab_dashboard')}
                </button>
                <button
                    className={`tab ${activeTab === 'check' ? 'active' : ''}`}
                    onClick={() => setActiveTab('check')}
                >
                    <ShieldCheck size={18} />
                    {t('sso_tab_check')}
                </button>
            </div>

            {/* Content */}
            <div className="tab-content" style={{ marginTop: '2rem' }}>
                {activeTab === 'dashboard' && <ClaimTracking />}

                {activeTab === 'check' && (
                    <>
                        {viewMode === 'check' && (
                            <QuotaChecker onVerified={handlePatientVerified} />
                        )}
                        {viewMode === 'wizard' && verifiedPatient && (
                            <ClaimWizard
                                patient={verifiedPatient}
                                onComplete={handleClaimCompleted}
                                onCancel={() => setVerifiedPatient(null)} // Back to check
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SocialSecurity;
