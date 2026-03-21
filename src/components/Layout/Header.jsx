import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Header = ({ onMenuClick }) => {
    const { language, toggleLanguage, t } = useLanguage();
    const location = useLocation();

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
                <button className="icon-btn">
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>

                <button className="icon-btn">
                    <HelpCircle size={20} />
                </button>

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
