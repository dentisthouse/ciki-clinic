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
    TrendingUp,
    Pill,
    FileSignature,
    Ticket,
    Heart,
    Settings,
    ClipboardList,
    Crown,
    Lock,
    KeyRound,
    Stethoscope,
    ChevronLeft,
    Menu as MenuIcon
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';



const Sidebar = ({ isOpen, onClose, isCollapsed, onToggle }) => {
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

    const groupedItems = [
        {
            category: t('nav_cat_overview'),
            items: [
                { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/' }
            ]
        },
        {
            category: t('nav_cat_clinical'),
            items: [
                { icon: Users, label: t('nav_patients'), path: '/patients', pKey: 'patients' },
                { icon: Calendar, label: t('nav_schedule'), path: '/schedule', pKey: 'schedule' },
                { icon: Activity, label: t('nav_queue'), path: '/queue', role: 'receptionist' }, 
            ]
        },
        {
            category: t('nav_cat_financial'),
            items: [
                { icon: CreditCard, label: t('nav_billing'), path: '/billing', pKey: 'billing' },
            ]
        },
        {
            category: t('nav_cat_operations'),
            items: [
                { icon: Package, label: t('nav_inventory'), path: '/inventory', pKey: 'inventory' },
                { icon: Truck, label: t('nav_labs'), path: '/labs' },
            ]
        },
        {
            category: t('nav_cat_analytics'),
            items: [
                { icon: BarChart3, label: language === 'TH' ? 'ศูนย์รวมการวิเคราะห์' : 'Analytics & Reports', path: '/reports', pKey: 'analytics', excludeRole: 'dentist' },
            ]
        },
        {
            category: t('nav_cat_system'),
            items: [
                { icon: Settings, label: language === 'TH' ? 'ศูนย์รวมการจัดการ' : 'Management Hub', path: '/management', pKey: 'staff', excludeRole: 'dentist' },
                { icon: Clock, label: language === 'TH' ? 'ลงเวลา' : 'Attendance', path: '/attendance', excludeRole: 'dentist' },
            ]
        }
    ].map(group => ({
        ...group,
        items: group.items.filter(item => {
            const hasPermission = canView(item.pKey);
            const hasRole = !item.role || staff?.role === item.role;
            const isExcluded = item.excludeRole && staff?.role === item.excludeRole;
            
            if (isAdmin) return true;
            return hasPermission && hasRole && !isExcluded;
        })
    })).filter(group => group.items.length > 0);

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Brand */}
            <div className="brand">
                <div className="brand-logo-container">
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="brand-logo-img"
                    />
                </div>

                {/* Collapse toggle (Desktop only) */}
                <button className="desktop-collapse-btn" onClick={onToggle}>
                    {isCollapsed ? <MenuIcon size={18} /> : <ChevronLeft size={18} />}
                </button>

                {/* Close button for mobile */}
                <button className="mobile-menu-btn mobile-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="nav-menu">
                {groupedItems.map((group) => (
                    <div key={group.category} className="nav-section">
                        {!isCollapsed && (
                            <div className="nav-section-title">
                                {group.category}
                            </div>
                        )}
                        {group.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive ? 'nav-item active' : 'nav-item'
                                }
                                onClick={onClose}
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon className="nav-icon" size={18} />
                                <span className="nav-label">{item.label}</span>
                                {item.path === '/inventory' && hasLowStock && (
                                    <span className="low-stock-indicator" />
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                {isAdmin && (
                    <button onClick={clearAllData} className="btn-reset-system" title={language === 'TH' ? 'ล้างข้อมูลระบบ' : 'Reset System'}>
                        <X size={18} />
                        <span className="nav-label">{language === 'TH' ? 'ล้างข้อมูลระบบ' : 'Reset System'}</span>
                    </button>
                )}

                {staff && (
                    <div className="user-profile-mini">
                        <div className="user-avatar-mini">
                            {staff.name?.charAt(0)}
                        </div>
                        <div className="user-info-mini">
                            <div className="user-name-mini">{staff.name}</div>
                            <div className="user-role-mini">{staff.role}</div>
                        </div>
                    </div>
                )}

                <button onClick={logout} className="logout-btn" title={t('nav_signout')}>
                    <LogOut size={18} />
                    <span className="nav-label">{t('nav_signout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
