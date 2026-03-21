import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Activity,
    Package,
    Truck,
    FileText,
    CreditCard,
    LogOut,
    MessageCircle,
    HelpCircle,
    X,
    Play,
    ShieldCheck,
    UserCog,
    Clock,
    Wallet
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import logo from '../../assets/logo.png';



const Sidebar = ({ isOpen, onClose }) => {
    const { t, language } = useLanguage();
    const { inventory, loadDemoData } = useData();

    // Check for low stock items
    const hasLowStock = inventory && inventory.some(item => item.stock <= item.reorderPoint);

    const navItems = [
        { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/' },
        { icon: Users, label: t('nav_patients'), path: '/patients' },
        { icon: Calendar, label: t('nav_schedule'), path: '/schedule' },
        { icon: Activity, label: t('nav_queue'), path: '/queue' }, // Added Queue Display
        { icon: Package, label: t('nav_inventory'), path: '/inventory' },
        { icon: Truck, label: t('nav_labs'), path: '/labs' },


        { icon: ShieldCheck, label: t('nav_sso'), path: '/sso' },
        { icon: CreditCard, label: t('nav_billing'), path: '/billing' },
        { icon: UserCog, label: language === 'TH' ? 'พนักงาน' : 'Staff', path: '/staff' },
        { icon: Clock, label: language === 'TH' ? 'ลงเวลา' : 'Attendance', path: '/attendance' },
        { icon: Wallet, label: language === 'TH' ? 'รายจ่าย' : 'Expenses', path: '/expenses' },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Brand */}
            <div className="brand" style={{ height: 'auto', padding: '0.3rem 1.5rem' }}>
                <div className="brand-logo" style={{ width: '100%', height: 'auto', background: 'none', boxShadow: 'none' }}>
                    <img src={logo} alt="บ้านหมอฟัน Logo" style={{ width: '100%', maxWidth: '180px', height: 'auto', display: 'block' }} />
                </div>

                {/* Close button for mobile */}
                <button
                    className="mobile-close-btn"
                    onClick={onClose}
                    style={{
                        display: 'none',
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        color: 'var(--neutral-500)',
                        borderRadius: 'var(--radius-md)'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="nav-menu">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive ? 'nav-item active' : 'nav-item'
                        }
                        onClick={onClose}
                        style={{ position: 'relative' }}
                    >
                        <item.icon className="nav-icon" />
                        <span>{item.label}</span>
                        {item.path === '/inventory' && hasLowStock && (
                            <span style={{
                                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%',
                                boxShadow: '0 0 0 2px white'
                            }} />
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className="nav-item"
                    onClick={loadDemoData}
                    style={{
                        width: '100%',
                        background: 'var(--primary-50)',
                        color: 'var(--primary-600)',
                        marginBottom: '0.5rem',
                        border: '1px solid var(--primary-100)'
                    }}
                >
                    <Play className="nav-icon" />
                    <span style={{ fontWeight: 600 }}>Demo Mode</span>
                </button>
                <button className="logout-btn">
                    <LogOut className="nav-icon" />
                    <span>{t('nav_signout')}</span>
                </button>
            </div>

            {/* Mobile close button styles */}
            <style>{`
                @media (max-width: 768px) {
                    .mobile-close-btn {
                        display: flex !important;
                    }
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
