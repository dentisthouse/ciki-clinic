import React, { useState } from 'react';
import { Lock, User, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AuthGuard = ({ children }) => {
    const { user, staff, isAdmin, permissions, loading, login, logout } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const { error: loginError } = await login(email, password);

            if (loginError) {
                setError(loginError.message === 'Invalid login credentials'
                    ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
                    : loginError.message);
            }
        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            // Note: If login is successful, the component will re-render and might unmount 
            // OR user will change. We reset it anyway to be safe.
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f8fafc'
            }}>
                <Loader2 className="animate-spin" size={40} color="var(--blue-600)" />
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: '#f1f5f9',
                backgroundImage: 'radial-gradient(at 0% 0%, hsla(210,100%,98%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(210,100%,95%,1) 0, transparent 50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                color: '#1e293b', fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    padding: '3.5rem',
                    borderRadius: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    textAlign: 'center',
                    maxWidth: '460px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
                }}>
                    {/* Logo Section */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                                width: '160px',
                                height: '160px',
                                background: '#fff',
                                borderRadius: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                                padding: '12px',
                                border: '1px solid #f1f5f9'
                            }}>
                                <img
                                    src="/logo.png"
                                    alt="บ้านหมอฟัน Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => { 
                                        e.target.style.display = 'none'; 
                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; 
                                    }}
                                />
                                <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldCheck size={70} color="#0d9488" />
                                </div>
                            </div>
                        </div>
                        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                            เข้าสู่ระบบ
                        </h1>
                        <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>บ้านหมอฟัน - คลินิกยิ้มสวย</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <User size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                required
                                style={{
                                    width: '100%',
                                    padding: '1.1rem 1.1rem 1.1rem 3.5rem',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '18px',
                                    color: '#1e293b',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '1.1rem 1.1rem 1.1rem 3.5rem',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '18px',
                                    color: '#1e293b',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fee2e2',
                                color: '#b91c1c', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem',
                                display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', textAlign: 'left'
                            }}>
                                <AlertTriangle size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: '100%',
                                padding: '1.1rem',
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                border: 'none',
                                borderRadius: '18px',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                transition: 'all 0.3s',
                                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)',
                                opacity: isLoggingIn ? 0.8 : 1
                            }}
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={22} />}
                            เข้าสู่ระบบ
                        </button>
                    </form>
                </div>
            </div>
        );
    }



    return children;
};

export default AuthGuard;
