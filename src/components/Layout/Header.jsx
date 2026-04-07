import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu, Package, Calendar, Clock, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const Header = ({ onMenuClick }) => {
    const { language, toggleLanguage, t } = useLanguage();
    const { inventory, appointments } = useData();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = React.useState(false);

    // Map routes to titles
    const getTitle = (path) => {
        if (path === '/') return t('nav_dashboard');
        if (path.startsWith('/patients')) return t('nav_patients');
        if (path.startsWith('/schedule')) return t('nav_schedule');
        if (path.startsWith('/inventory')) return t('nav_inventory');
        if (path.startsWith('/billing')) return t('nav_billing');
        if (path.startsWith('/labs')) return t('nav_labs');
        if (path.startsWith('/backscan')) return t('nav_backscan');
        return t('nav_dashboard');
    };

    const title = getTitle(location.pathname);

    // Filter notifications
    const lowStockItems = inventory?.filter(item => item.stock <= (item.min_stock || 5)) || [];
    const today = new Date().toISOString().split('T')[0];
    const todayApts = appointments?.filter(apt => apt.date === today && apt.status !== 'Completed') || [];

    const totalNotifications = lowStockItems.length + todayApts.length;

    return (
        <header className="top-header">
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={onMenuClick}
                aria-label="Toggle menu"
            >
                <Menu size={24} />
            </button>

            <h1 className="page-title">{title}</h1>

            <div className="header-actions">
                {/* Search */}
                <div className="search-bar">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t('search_placeholder')}
                    />
                </div>

                {/* Language Switcher */}
                <button
                    className="btn btn-secondary language-switcher"
                    onClick={toggleLanguage}
                    style={{
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--neutral-200)',
                        background: 'var(--glass-premium-bg)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{ opacity: language === 'TH' ? 1 : 0.3, display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.3s' }}>
                        <img src="https://flagcdn.com/w40/th.png" style={{ width: '20px', height: 'auto', borderRadius: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} alt="TH" />
                        <span style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>TH</span>
                    </div>
                    <div style={{ width: '1px', height: '16px', background: 'var(--neutral-200)' }}></div>
                    <div style={{ opacity: language === 'EN' ? 1 : 0.3, display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.3s' }}>
                        <img src="https://flagcdn.com/w40/gb.png" style={{ width: '20px', height: 'auto', borderRadius: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} alt="EN" />
                        <span style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>EN</span>
                    </div>
                </button>

                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                    <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={20} />
                        {totalNotifications > 0 && <span className="notification-dot"></span>}
                    </button>

                    {showNotifications && (
                        <>
                            <div 
                                style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                                onClick={() => setShowNotifications(false)}
                            />
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '1rem',
                                width: '340px', background: 'var(--glass-premium-bg)', borderRadius: 'var(--radius-xl)',
                                backdropFilter: 'blur(24px) saturate(180%)',
                                boxShadow: 'var(--shadow-xl)',
                                border: '1px solid var(--neutral-200)', zIndex: 999,
                                overflow: 'hidden',
                                animation: 'slideDown 0.3s ease-out'
                            }}>
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neutral-900)' }}>{language === 'TH' ? 'แจ้งเตือน' : 'Notifications'}</h3>
                                    <button onClick={() => setShowNotifications(false)} className="modal-close" style={{ padding: '4px' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {totalNotifications === 0 ? (
                                        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                                <Bell size={32} style={{ opacity: 0.3 }} />
                                            </div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{language === 'TH' ? 'ไม่มีการแจ้งเตือนใหม่' : 'Your inbox is empty'}</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {lowStockItems.map(item => (
                                                <div key={item.id} style={{ padding: '1rem', display: 'flex', gap: '1rem', borderRadius: 'var(--radius-lg)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover:bg-white">
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Package size={20} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--neutral-900)' }}>{language === 'TH' ? 'วัสดุใกล้หมด' : 'Low Stock Alert'}</p>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', margin: '4px 0 0' }}>{item.name} {language === 'TH' ? 'เหลือเพียง' : 'only'} {item.stock} {item.unit}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {todayApts.map(apt => (
                                                <div key={apt.id} style={{ padding: '1rem', display: 'flex', gap: '1rem', borderRadius: 'var(--radius-lg)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover:bg-white">
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--info-light)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--neutral-900)' }}>{language === 'TH' ? 'นัดหมายวันนี้' : 'Upcoming Appointment'}</p>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', margin: '4px 0 0' }}>{apt.patientName} • {apt.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Header;
