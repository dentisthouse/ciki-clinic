import React, { useState, useEffect } from 'react';
import { Lock, Key, ShieldCheck, AlertTriangle } from 'lucide-react';

const LicenseGuard = ({ children }) => {
    const [isLocked, setIsLocked] = useState(true);
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [expiryDate, setExpiryDate] = useState(null);

    useEffect(() => {
        checkLicense();
    }, []);

    const checkLicense = () => {
        const storedKey = localStorage.getItem('ciki_license_key');
        const storedExpiry = localStorage.getItem('ciki_license_expiry');

        if (storedKey && storedExpiry) {
            const now = new Date();
            const expiry = new Date(storedExpiry);

            if (now < expiry) {
                setIsLocked(false);
                setExpiryDate(expiry.toLocaleDateString('th-TH'));
            } else {
                setIsLocked(true);
                setError('License expired. Please contact support.');
                localStorage.removeItem('ciki_license_key'); // Clear expired key
            }
        } else {
            setIsLocked(true);
        }
    };

    const handleUnlock = () => {
        // Simple Validation Logic for Demo
        // Format: CIKI-[DAYS]-[RANDOM]
        // Example: CIKI-365-DEMO -> 365 Days

        const validPrefix = 'CIKI';
        const parts = licenseKey.split('-');

        if (parts.length === 3 && parts[0] === validPrefix) {
            const days = parseInt(parts[1]);
            if (!isNaN(days) && days > 0) {
                const now = new Date();
                const expiry = new Date(now.setDate(now.getDate() + days));

                localStorage.setItem('ciki_license_key', licenseKey);
                localStorage.setItem('ciki_license_expiry', expiry.toISOString());

                setIsLocked(false);
                setError('');
                alert(`License Activated! Valid until ${expiry.toLocaleDateString('th-TH')}`);
                window.location.reload(); // Reload to apply
            } else {
                setError('Invalid key format (Days invalid).');
            }
        } else if (licenseKey === 'ADMIN-UNLOCK') {
            // Backdoor for emergency
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 10);
            localStorage.setItem('ciki_license_key', licenseKey);
            localStorage.setItem('ciki_license_expiry', expiry.toISOString());
            setIsLocked(false);
            window.location.reload();
        } else {
            setError('Invalid License Key.');
        }
    };

    if (isLocked) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                color: 'white', fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '3rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Lock size={40} color="#fff" />
                    </div>

                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 700 }}>System Locked</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Please enter your product key to continue.</p>

                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Key size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                            placeholder="CIKI-365-XXXX"
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                letterSpacing: '2px',
                                textTransform: 'uppercase'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'
                        }}>
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleUnlock}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ShieldCheck size={20} />
                        Activate License
                    </button>

                    <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
                        Device ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {children}
            {/* Developer Reset License Button */}
            <button
                onClick={() => {
                    if (window.confirm('Clear License Key and Lock System?')) {
                        localStorage.removeItem('ciki_license_key');
                        localStorage.removeItem('ciki_license_expiry');
                        window.location.reload();
                    }
                }}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    opacity: 0.5
                }}
                title="Reset License (Dev Only)"
            >
                Reset License
            </button>
        </>
    );
};

export default LicenseGuard;
