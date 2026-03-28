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
        if (path.startsWith('/charting')) return t('nav_charting');
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
                    className="btn btn-secondary"
                    onClick={toggleLanguage}
                    style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: '60px',
                        justifyContent: 'center'
                    }}
                >
                    <span style={{ opacity: language === 'TH' ? 1 : 0.3 }}>TH</span>
                    <div style={{ width: '1px', height: '12px', background: 'var(--neutral-200)' }}></div>
                    <span style={{ opacity: language === 'EN' ? 1 : 0.3 }}>EN</span>
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
                                position: 'absolute', top: '100%', right: 0, marginTop: '0.75rem',
                                width: '320px', background: 'white', borderRadius: '16px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                border: '1px solid var(--neutral-200)', zIndex: 999,
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{language === 'TH' ? 'แจ้งเตือน' : 'Notifications'}</h3>
                                    <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {totalNotifications === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                                            <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                            <p style={{ fontSize: '0.85rem' }}>{language === 'TH' ? 'ไม่มีการแจ้งเตือนใหม่' : 'No new notifications'}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {lowStockItems.map(item => (
                                                <div key={item.id} style={{ padding: '1rem', display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--neutral-50)' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Package size={18} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{language === 'TH' ? 'วัสดุใกล้หมด' : 'Low Stock Alert'}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', margin: '2px 0' }}>{item.name} {language === 'TH' ? 'เหลือเพียง' : 'only'} {item.stock} {item.unit}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {todayApts.map(apt => (
                                                <div key={apt.id} style={{ padding: '1rem', display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--neutral-50)' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{language === 'TH' ? 'นัดหมายวันนี้' : 'Today\'s Appointment'}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', margin: '2px 0' }}>{apt.patientName} - {apt.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>


                {/* User Profile */}
                <div className="user-profile">
                    <div className="user-avatar">
                        dr
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
