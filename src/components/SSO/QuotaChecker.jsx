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

        // Current: Simulation
        setTimeout(() => {
            setLoading(false);
            // Mock Result: Randomize balance for demo purposes
            const mockBalance = Math.random() > 0.5 ? 900 : 400;
            const mockData = {
                id: id,
                name: "นาย สมชาย ใจดี",
                hospital: "รพ.จุฬาลงกรณ์",
                rights: "ม.33 (ส่งเงินสมทบครบ 3 เดือน)",
                balance: mockBalance,
                total: 900,
                expiry: "31/12/2026"
            };
            setResult(mockData);
        }, 1000);
    };

    const handleContinue = () => {
        if (onVerified && result) {
            onVerified(result);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Input Section */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle className="icon-primary" size={24} />
                    {t('sso_custom_title')}
                    <span className="badge" style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.8rem', marginLeft: 'auto' }}>
                        Simulation Mode
                    </span>
                </h3>

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <button
                        className="btn-primary"
                        style={{ padding: '2rem', fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', height: 'auto' }}
                        onClick={handleReadCard}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="spin" size={32} /> : <CreditCard size={48} />}
                        <span>{loading ? "Reading Smart Card..." : t('sso_btn_read_card')}</span>
                    </button>

                    <div className="divider" style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>OR</div>

                    <div className="form-group">
                        <label>{t('sso_id_card_placeholder')}</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="1-XXXX-XXXXX-XX-X"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                            />
                            <button className="btn-secondary" onClick={handleManualCheck} disabled={loading}>
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result Section */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {result ? (
                    <div className="animate-fade-in" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-100)', color: 'var(--primary-600)', borderRadius: '50%' }}>
                                {result.name.charAt(0)}
                            </div>
                            <h2>{result.name}</h2>
                            <p style={{ color: 'var(--neutral-500)' }}>ID: {result.id}</p>
                            <span className="badge badge-success" style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: '#dcfce7', color: '#166534' }}>
                                {result.rights}
                            </span>
                        </div>

                        <div style={{ background: 'var(--neutral-50)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span>{t('sso_quota_total')}</span>
                                <strong>{result.total} THB</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary-600)', borderTop: '1px solid var(--neutral-200)', paddingTop: '1rem' }}>
                                <span>{t('sso_quota_remaining')}</span>
                                <strong>{result.balance} THB</strong>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={handleContinue}
                        >
                            {t('sso_btn_create_claim')}
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>Waiting for verify...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotaChecker;
