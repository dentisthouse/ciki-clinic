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
                    className="lang-switcher-pill"
                    onClick={toggleLanguage}
                >
                    <div className={`lang-flag-group ${language === 'TH' ? 'lang-active' : ''}`}>
                        <img src="https://flagcdn.com/w40/th.png" className="lang-flag-mini" alt="TH" />
                        <span className="lang-text">TH</span>
                    </div>
                    <div className="lang-pill-sep"></div>
                    <div className={`lang-flag-group ${language === 'EN' ? 'lang-active' : ''}`}>
                        <img src="https://flagcdn.com/w40/gb.png" className="lang-flag-mini" alt="EN" />
                        <span className="lang-text">EN</span>
                    </div>
                </button>

                {/* Notifications */}
                <div className="notification-wrapper">
                    <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={20} />
                        {totalNotifications > 0 && <span className="notification-dot"></span>}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setShowNotifications(false)} />
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <h3>{language === 'TH' ? 'การแจ้งเตือน' : 'Notifications'}</h3>
                                    <button onClick={() => setShowNotifications(false)} className="modal-close">
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div className="notification-list">
                                    {totalNotifications === 0 ? (
                                        <div className="notification-empty">
                                            <div className="notification-empty-icon">
                                                <Bell size={32} />
                                            </div>
                                            <p>{language === 'TH' ? 'ไม่มีการแจ้งเตือนใหม่' : 'Your inbox is empty'}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {lowStockItems.map(item => (
                                                <div key={item.id} className="notification-item">
                                                    <div className="notification-icon-box bg-danger">
                                                        <Package size={20} />
                                                    </div>
                                                    <div className="notification-content">
                                                        <p className="notification-title">{language === 'TH' ? 'วัสดุใกล้หมด' : 'Low Stock Alert'}</p>
                                                        <p className="notification-desc">{item.name} {language === 'TH' ? 'เหลือเพียง' : 'only'} {item.stock} {item.unit}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {todayApts.map(apt => (
                                                <div key={apt.id} className="notification-item">
                                                    <div className="notification-icon-box bg-info">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div className="notification-content">
                                                        <p className="notification-title">{language === 'TH' ? 'นัดหมายวันนี้' : 'Upcoming Appointment'}</p>
                                                        <p className="notification-desc">{apt.patientName} • {apt.time}</p>
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
            </div>
        </header>
    );
};

export default Header;
