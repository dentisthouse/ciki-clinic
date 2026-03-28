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
    X,
    ShieldCheck,
    UserCog,
    Clock,
    Wallet,
    Brain,
    BarChart3,
    MessageCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import logo from '../../assets/logo.png';



const Sidebar = ({ isOpen, onClose }) => {
    const { t, language } = useLanguage();
    const { inventory, clearAllData } = useData();

    // Check for low stock items
    const hasLowStock = inventory && inventory.some(item => item.stock <= item.reorderPoint);

    const navItems = [
        { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/' },
        { icon: Users, label: t('nav_patients'), path: '/patients' },
        { icon: Calendar, label: t('nav_schedule'), path: '/schedule' },
        { icon: Activity, label: t('nav_queue'), path: '/queue' }, 
        { icon: Package, label: t('nav_inventory'), path: '/inventory' },
        { icon: Truck, label: t('nav_labs'), path: '/labs' },


        { icon: ShieldCheck, label: t('nav_sso'), path: '/sso' },
        { icon: CreditCard, label: t('nav_billing'), path: '/billing' },
        { icon: BarChart3, label: language === 'TH' ? 'วิเคราะห์พื้นฐาน' : 'Basic Analytics', path: '/analytics' },
        { icon: Brain, label: language === 'TH' ? 'วิเคราะห์ขั้นสูง' : 'Advanced Analytics', path: '/advanced-analytics' },
        { icon: MessageCircle, label: 'LINE Portal', path: '/line-portal' },
        { icon: UserCog, label: language === 'TH' ? 'พนักงาน' : 'Staff', path: '/staff' },
        { icon: Clock, label: language === 'TH' ? 'ลงเวลา' : 'Attendance', path: '/attendance' },
        { icon: Wallet, label: language === 'TH' ? 'รายจ่าย' : 'Expenses', path: '/expenses' },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ background: 'white' }}>
            {/* Brand */}
            <div className="brand" style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--neutral-50)' }}>
                <div className="brand-logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        style={{ width: '100%', maxWidth: '140px', height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }} 
                    />
                </div>

                {/* Close button for mobile */}
                <button
                    className="mobile-close-btn"
                    onClick={onClose}
                    style={{
                        display: 'none',
                        position: 'absolute',
                        right: '1rem',
                        top: '1.5rem',
                        background: 'var(--neutral-50)',
                        border: '1px solid var(--neutral-100)',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        color: 'var(--neutral-400)',
                        borderRadius: '12px'
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="nav-menu" style={{ padding: '1.5rem 0.75rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive ? 'nav-item active' : 'nav-item'
                        }
                        onClick={onClose}
                    >
                        <item.icon className="nav-icon" size={18} />
                        <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                        {item.path === '/inventory' && hasLowStock && (
                            <span style={{
                                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                width: '6px', height: '6px', background: 'var(--danger)', borderRadius: '50%',
                                boxShadow: '0 0 0 2px white'
                            }} />
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1.25rem', background: 'transparent', borderTop: '1px solid var(--neutral-50)', display: 'grid', gap: '0.75rem' }}>
                <button 
                    onClick={clearAllData}
                    className="logout-btn" 
                    style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 800, border: '1.5px solid #fee2e2' }}
                >
                    <X className="nav-icon" size={18} />
                    <span>{language === 'TH' ? 'ล้างข้อมูลระบบ' : 'Reset System'}</span>
                </button>
                <button className="logout-btn" style={{ background: 'var(--neutral-50)', color: 'var(--neutral-500)', fontWeight: 700 }}>
                    <LogOut className="nav-icon" size={18} />
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
