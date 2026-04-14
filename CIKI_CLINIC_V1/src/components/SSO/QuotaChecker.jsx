import React, { useState } from 'react';
import { CreditCard, Search, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const QuotaChecker = ({ onVerified }) => {
    const { t } = useLanguage();
    const [idNumber, setIdNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleReadCard = () => {
        setLoading(true);
        // Simulate Hardware Delay
        setTimeout(() => {
            const mockId = '1-1002-00345-67-8';
            setIdNumber(mockId);
            performCheck(mockId);
        }, 1500);
    };

    const handleManualCheck = () => {
        if (!idNumber) return;
        setLoading(true);
        performCheck(idNumber);
    };

    const performCheck = (id) => {
        // [REAL INTEGRATION POINT]
        // To use real SSO API:
        // 1. Install local smart card agent (e.g., Siam ID)
        // 2. Fetch data from http://localhost:8189/api/read-card
        // 3. Call NHSO API with the card result

        // Actual data should come from local smart card agent API in production
        setLoading(false);
        const mockData = {
            id: id,
            name: "นาย สมชาย ใจดี",
            hospital: "รพ.จุฬาลงกรณ์",
            rights: "ม.33 (ส่งเงินสมทบครบ 3 เดือน)",
            balance: 900,
            total: 900,
            expiry: "31/12/2026"
        };
        setResult(mockData);
    };

    const handleContinue = () => {
        if (onVerified && result) {
            onVerified(result);
        }
    };

    return (
        <div className="sso-input-grid">
            {/* Input Section */}
            <div className="card glass-panel-premium" style={{ padding: '2.5rem', background: 'white' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '12px' }}>
                            <CheckCircle size={20} />
                        </div>
                        {t('sso_custom_title')}
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <button
                        className="btn btn-primary animate-slide-up"
                        style={{ 
                            padding: '2.5rem 1.5rem', 
                            fontSize: '1.1rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '1.25rem', 
                            height: 'auto',
                            borderRadius: '24px',
                            background: 'var(--gradient-primary)',
                            boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.4)'
                        }}
                        onClick={handleReadCard}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="spin" size={32} /> : <CreditCard size={48} />}
                        <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{loading ? "Reading Smart Card..." : t('sso_btn_read_card')}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--neutral-400)', margin: '0.5rem 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--neutral-200)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--neutral-200)' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.5rem', display: 'block' }}>{t('sso_id_card_placeholder')}</label>
                        <div className="sso-id-input-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="1-XXXX-XXXXX-XX-X"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                style={{ flex: 1, padding: '0.85rem 1.25rem', fontSize: '1.1rem', borderRadius: '14px', border: '1.5px solid var(--neutral-100)', background: 'var(--neutral-50)' }}
                            />
                            <button 
                                className="btn btn-primary" 
                                onClick={handleManualCheck} 
                                disabled={loading}
                                style={{ width: '56px', borderRadius: '14px', padding: 0, justifyContent: 'center' }}
                            >
                                <Search size={22} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result Section */}
            <div className="card glass-panel-premium" style={{ padding: '0', overflow: 'hidden', background: 'white', display: 'flex', flexDirection: 'column' }}>
                {result ? (
                    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '2.5rem', background: 'var(--gradient-premium-primary)', borderBottom: '1px solid var(--primary-100)', textAlign: 'center' }}>
                            <div className="floating-icon" style={{ width: '90px', height: '90px', fontSize: '2.5rem', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: 'var(--primary-600)', borderRadius: '28px', boxShadow: '0 12px 24px -6px rgba(0,0,0,0.1)', fontWeight: 800 }}>
                                {result.name.charAt(0)}
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--neutral-900)', margin: '0 0 0.25rem 0' }}>{result.name}</h2>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '1rem', fontWeight: 600 }}>ID: {result.id}</p>
                            <div style={{ marginTop: '1rem' }}>
                                <span className="badge-success" style={{ padding: '0.5rem 1.25rem', borderRadius: '12px', background: 'var(--primary-600)', color: 'white', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)' }}>
                                    {result.rights}
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '2rem', flex: 1 }}>
                            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', border: '1px solid var(--neutral-100)', background: 'var(--neutral-50)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--neutral-600)' }}>
                                    <span style={{ fontWeight: 600 }}>{t('sso_quota_total')}</span>
                                    <strong style={{ fontSize: '1.1rem', color: 'var(--neutral-800)' }}>{result.total.toLocaleString()} THB</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--neutral-300)', paddingTop: '1.25rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '1rem' }}>{t('sso_quota_remaining')}</span>
                                    <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-600)', letterSpacing: '-0.02em' }}>{result.balance.toLocaleString()} THB</strong>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '16px' }}
                                onClick={handleContinue}
                            >
                                {t('sso_btn_create_claim')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'var(--neutral-300)', textAlign: 'center' }}>
                        <div className="floating-icon" style={{ width: '80px', height: '80px', background: 'var(--neutral-50)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--neutral-200)' }}>
                            <AlertCircle size={40} />
                        </div>
                        <h3 style={{ color: 'var(--neutral-400)', fontWeight: 700 }}>Waiting for verify...</h3>
                        <p style={{ fontSize: '0.9rem', maxWidth: '240px', marginTop: '0.5rem' }}>Please read a smart card or enter ID number to check rights.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotaChecker;
