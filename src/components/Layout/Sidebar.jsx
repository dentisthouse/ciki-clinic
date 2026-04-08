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
    Stethoscope
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

    const groupedItems = [
        {
            category: t('nav_cat_overview'),
            items: [
                { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/', excludeRole: 'dentist' },
                { icon: Crown, label: language === 'TH' ? 'หน้าเจ้าของคลินิก' : 'Owner Dashboard', path: '/owner-dashboard', pKey: 'analytics', excludeRole: 'dentist' },
            ]
        },
        {
            category: t('nav_cat_clinical'),
            items: [
                { icon: Users, label: t('nav_patients'), path: '/patients', pKey: 'patients' },
                { icon: Calendar, label: t('nav_schedule'), path: '/schedule', pKey: 'schedule' },
                { icon: Activity, label: t('nav_queue'), path: '/queue', role: 'receptionist' }, 
                { icon: Layout, label: language === 'TH' ? 'สถานะคิวรายห้อง' : 'Floor Management', path: '/floor', pKey: 'schedule' },
                { icon: Pill, label: language === 'TH' ? 'ฉลากยา' : 'Drug Labels', path: '/drug-labels', pKey: 'patients' },
                { icon: FileSignature, label: language === 'TH' ? 'ใบรับรองแพทย์' : 'Medical Certificates', path: '/medical-certificates', pKey: 'patients' },
                { icon: Stethoscope, label: language === 'TH' ? 'แผนการรักษา' : 'Treatment Plan', path: '/treatment-plan', pKey: 'patients' },
            ]
        },
        {
            category: t('nav_cat_financial'),
            items: [
                { icon: CreditCard, label: t('nav_billing'), path: '/billing', pKey: 'billing' },
                { icon: ShieldCheck, label: t('nav_sso'), path: '/sso', pKey: 'sso' },
                { icon: TrendingUp, label: language === 'TH' ? 'รายงานประจำวัน' : 'Daily Report', path: '/daily-report', pKey: 'analytics', role: 'receptionist' },
                { icon: Wallet, label: language === 'TH' ? 'รายจ่าย' : 'Expenses', path: '/expenses', pKey: 'expenses' },
                { icon: Shield, label: language === 'TH' ? 'เบิกจ่าย E-Claim' : 'E-Claim', path: '/e-claim', pKey: 'billing' },
                { icon: CreditCard, label: language === 'TH' ? 'ชำระเงินออนไลน์' : 'Online Payments', path: '/online-payments', pKey: 'billing' },
                { icon: Wallet, label: language === 'TH' ? 'การเงินคลินิก' : 'Financial Mgmt', path: '/financial', pKey: 'billing', excludeRole: 'dentist' },
            ]
        },
        {
            category: t('nav_cat_operations'),
            items: [
                { icon: Package, label: t('nav_inventory'), path: '/inventory', pKey: 'inventory' },
                { icon: Truck, label: t('nav_labs'), path: '/labs', pKey: 'inventory' },
                { icon: Ticket, label: language === 'TH' ? 'คูปองและวงเงิน' : 'Coupons & Credits', path: '/coupons', pKey: 'inventory' },
                { icon: Heart, label: language === 'TH' ? 'CRM ลูกค้าสัมพันธ์' : 'CRM', path: '/crm', pKey: 'patients' },
            ]
        },
        {
            category: t('nav_cat_analytics'),
            items: [
                { icon: BarChart3, label: language === 'TH' ? 'วิเคราะห์พื้นฐาน' : 'Basic Analytics', path: '/analytics', pKey: 'analytics', excludeRole: 'dentist' },
                { icon: Brain, label: language === 'TH' ? 'วิเคราะห์ขั้นสูง' : 'Advanced Analytics', path: '/advanced-analytics', pKey: 'analytics', excludeRole: 'dentist' },
                { icon: TrendingUp, label: language === 'TH' ? 'วิเคราะห์ธุรกิจ' : 'Business Analytics', path: '/business-analytics', pKey: 'analytics', excludeRole: 'dentist' },
                { icon: ClipboardList, label: language === 'TH' ? 'ระบบรายงาน (Reports)' : 'Reports Hub', path: '/reports', pKey: 'analytics', excludeRole: 'dentist' },
            ]
        },
        {
            category: t('nav_cat_system'),
            items: [
                { icon: UserCog, label: language === 'TH' ? 'พนักงาน' : 'Staff', path: '/staff', pKey: 'staff' },
                { icon: Users, label: language === 'TH' ? 'จัดการพนักงาน' : 'Staff Management', path: '/staff-management', pKey: 'staff', excludeRole: 'dentist' },
                { icon: Clock, label: language === 'TH' ? 'ลงเวลา' : 'Attendance', path: '/attendance', excludeRole: 'dentist' },
                { icon: KeyRound, label: language === 'TH' ? 'สิทธิ์การใช้งาน' : 'Roles', path: '/roles', pKey: 'staff', excludeRole: 'dentist' },
                { icon: Lock, label: language === 'TH' ? 'ตรวจสอบความปลอดภัย' : 'Security Audit', path: '/security', pKey: 'staff', excludeRole: 'dentist' },
                { icon: Bell, label: language === 'TH' ? 'ตั้งค่าแจ้งเตือน' : 'Notifications', path: '/notifications', pKey: 'staff' },
                { icon: Settings, label: language === 'TH' ? 'ตั้งค่าคลินิก' : 'Clinic Settings', path: '/settings', pKey: 'staff', excludeRole: 'dentist' },
                { icon: Settings, label: language === 'TH' ? 'การจัดการ (Management)' : 'Management', path: '/management', pKey: 'staff', excludeRole: 'dentist' },
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
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ background: 'white', display: 'flex', flexDirection: 'column' }}>
            {/* Brand */}
            <div className="brand" style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-50)' }}>
                <div className="brand-logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        style={{ width: '100%', maxWidth: '120px', height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }} 
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
                        background: 'var(--neutral-100)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        color: 'var(--neutral-500)',
                        borderRadius: '12px'
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="nav-menu" style={{ padding: '1.25rem 0.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {groupedItems.map((group) => (
                    <div key={group.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            color: 'var(--neutral-400)', 
                            padding: '0 0.75rem', 
                            marginBottom: '0.5rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase'
                        }}>
                            {group.category}
                        </div>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive ? 'nav-item active' : 'nav-item'
                                }
                                onClick={onClose}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    position: 'relative',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <item.icon className="nav-icon" size={18} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</span>
                                {item.path === '/inventory' && hasLowStock && (
                                    <span style={{
                                        position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                        width: '6px', height: '6px', background: 'var(--danger)', borderRadius: '50%',
                                        boxShadow: '0 0 0 2px white'
                                    }} />
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1.25rem', background: 'white', borderTop: '1px solid var(--neutral-50)', display: 'grid', gap: '0.75rem' }}>
                {isAdmin && (
                    <button 
                        onClick={clearAllData}
                        className="logout-btn" 
                        style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 800, border: '1.5px solid #fee2e2', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', width: '100%', cursor: 'pointer' }}
                    >
                        <X size={18} />
                        <span style={{ fontSize: '0.85rem' }}>{language === 'TH' ? 'ล้างข้อมูลระบบ' : 'Reset System'}</span>
                    </button>
                )}

                {staff && (
                    <div style={{ padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: '14px', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: '12px', 
                            background: 'var(--primary-600)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '0.9rem', 
                            fontWeight: 800,
                            boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)'
                        }}>
                            {staff.name?.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neutral-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', textTransform: 'capitalize', fontWeight: 600 }}>{staff.role}</div>
                        </div>
                    </div>
                )}

                <button onClick={logout} className="logout-btn" style={{ 
                    background: 'var(--neutral-50)', 
                    color: 'var(--neutral-600)', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.75rem', 
                    border: 'none', 
                    borderRadius: '12px', 
                    width: '100%', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}>
                    <LogOut size={18} />
                    <span style={{ fontSize: '0.85rem' }}>{t('nav_signout')}</span>
                </button>
            </div>

            {/* Mobile close button styles */}
            <style>{`
                @media (max-width: 768px) {
                    .mobile-close-btn {
                        display: flex !important;
                    }
                }
                .nav-item {
                    color: var(--neutral-500);
                }
                .nav-item:hover {
                    background: var(--neutral-50);
                    color: var(--primary-600);
                }
                .nav-item.active {
                    background: var(--primary-50) !important;
                    color: var(--primary-700) !important;
                }
                .nav-item.active .nav-icon {
                    color: var(--primary-600);
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
