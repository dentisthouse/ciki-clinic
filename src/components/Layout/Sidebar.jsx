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
    MessageCircle,
    Shield,
    Layout,
    Bell,
    Target,
    TrendingUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';



const Sidebar = ({ isOpen, onClose }) => {
    const { t, language } = useLanguage();
    const { inventory, clearAllData } = useData();
    const { permissions, isAdmin, logout, staff } = useAuth();

    // Check for low stock items
    const hasLowStock = inventory && inventory.some(item => item.stock <= item.reorderPoint);

    // Permission check helper
    const canView = (key) => {
        if (isAdmin) return true;
        if (!key) return true;
        return permissions[key]?.view || false;
    };

    const navItems = [
        { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/', excludeRole: 'dentist' },
        { icon: Users, label: t('nav_patients'), path: '/patients', pKey: 'patients' },
        { icon: Calendar, label: t('nav_schedule'), path: '/schedule', pKey: 'schedule' },
        { icon: Activity, label: t('nav_queue'), path: '/queue', role: 'receptionist' }, 
        { icon: Layout, label: language === 'TH' ? 'สถานะคิวรายห้อง' : 'Floor Management', path: '/floor', pKey: 'schedule' },
        { icon: TrendingUp, label: language === 'TH' ? 'รายงานประจำวัน' : 'Daily Report', path: '/daily-report', pKey: 'analytics', role: 'receptionist' },
        { icon: Bell, label: language === 'TH' ? 'ตั้งค่าแจ้งเตือน' : 'Notification Settings', path: '/notification-settings', pKey: 'schedule', role: 'receptionist' },
        { icon: Package, label: t('nav_inventory'), path: '/inventory', pKey: 'inventory' },
        { icon: Truck, label: t('nav_labs'), path: '/labs', pKey: 'inventory' },

        { icon: ShieldCheck, label: t('nav_sso'), path: '/sso', pKey: 'sso' },
        { icon: CreditCard, label: t('nav_billing'), path: '/billing', pKey: 'billing' },
        { icon: BarChart3, label: language === 'TH' ? 'วิเคราะห์พื้นฐาน' : 'Basic Analytics', path: '/analytics', pKey: 'analytics', excludeRole: 'dentist' },
        { icon: Brain, label: language === 'TH' ? 'วิเคราะห์ขั้นสูง' : 'Advanced Analytics', path: '/advanced-analytics', pKey: 'analytics', excludeRole: 'dentist' },
        { icon: MessageCircle, label: 'LINE Portal', path: '/line-portal', pKey: 'staff' },
        { icon: UserCog, label: language === 'TH' ? 'พนักงาน' : 'Staff', path: '/staff', pKey: 'staff' },
        { icon: Clock, label: language === 'TH' ? 'ลงเวลา' : 'Attendance', path: '/attendance', excludeRole: 'dentist' },
        { icon: Wallet, label: language === 'TH' ? 'รายจ่าย' : 'Expenses', path: '/expenses', pKey: 'expenses' },
        ...(isAdmin ? [{ icon: Shield, label: language === 'TH' ? 'ตั้งค่าสิทธิ์' : 'Role Settings', path: '/role-settings' }] : []),
    ].filter(item => {
        const hasPermission = canView(item.pKey);
        const hasRole = !item.role || staff?.role === item.role;
        const isExcluded = item.excludeRole && staff?.role === item.excludeRole;
        
        if (isAdmin) return true;
        return hasPermission && hasRole && !isExcluded;
    });

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
                {isAdmin && (
                    <button 
                        onClick={clearAllData}
                        className="logout-btn" 
                        style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 800, border: '1.5px solid #fee2e2', marginBottom: '0.5rem' }}
                    >
                        <X className="nav-icon" size={18} />
                        <span>{language === 'TH' ? 'ล้างข้อมูลระบบ' : 'Reset System'}</span>
                    </button>
                )}

                {staff && (
                    <div style={{ padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: '12px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                            {staff.name?.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neutral-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', textTransform: 'capitalize' }}>{staff.role}</div>
                        </div>
                    </div>
                )}

                <button onClick={logout} className="logout-btn" style={{ background: 'var(--neutral-50)', color: 'var(--neutral-500)', fontWeight: 700 }}>
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
