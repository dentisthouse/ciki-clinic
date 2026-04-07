import React, { useState } from 'react';
import {
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    Plus,
    Search,
    ArrowRight,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import SSOReportModal from '../components/Billing/SSOReportModal';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import {
    AreaChart, Area, ResponsiveContainer
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, colorClass, delay, t }) => (
    <div className={`stat-card glass-panel-premium animate-slide-up ${delay}`} style={{ 
        background: 'var(--glass-premium-bg)',
        border: '1px solid var(--glass-premium-border)',
        boxShadow: 'var(--glass-premium-shadow)',
        borderRadius: 'var(--radius-xl)'
    }}>
        <div className="stat-header">
            <div className="stat-info">
                <p style={{ color: 'var(--neutral-500)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>{value}</h3>
            </div>
            <div className={`stat-icon-wrapper floating-icon`} style={{ 
                background: `linear-gradient(135deg, var(--primary-50) 0%, white 100%)`, 
                color: `var(--primary-600)`,
                width: '48px', height: '48px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                border: `1px solid var(--primary-100)`
            }}>
                <Icon size={24} />
            </div>
        </div>
        <div className="stat-trend" style={{ marginTop: '1.25rem' }}>
            <div className={`trend-badge ${trend >= 0 ? 'trend-up' : 'trend-down'}`} style={{
                background: trend >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
                padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: '4px'
            }}>
                {trend >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
                <span>{Math.abs(trend)}%</span>
            </div>
            <span style={{ color: 'var(--neutral-400)', marginLeft: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                vs last month
            </span>
        </div>
    </div>
);

const AppointmentRow = ({ time, patient, type, status }) => (
    <div className="appointment-item">
        <div className="apt-time">{time}</div>
        <div className="apt-info">
            <div className="apt-name">{patient}</div>
            <div className="apt-type">{type}</div>
        </div>
        <div className="apt-status">
            <span className={`badge ${status === 'Completed' ? 'badge-success' :
                status === 'In Progress' ? 'badge-info' :
                    'badge-warning'
                }`}>
                {status}
            </span>
        </div>
        <ArrowRight size={16} color="var(--neutral-300)" style={{ marginLeft: '1rem' }} />
    </div>
);

const Dashboard = () => {
    const today = new Date();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { patients, appointments, invoices, inventory, labOrders } = useData();
    const [showSSOReport, setShowSSOReport] = useState(false);

    // Calculate Stats
    const totalPatients = patients ? patients.length : 0;
    
    // Use local date format YYYY-MM-DD instead of UTC string
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Revenue calculations
    const todayRevenue = Array.isArray(invoices)
        ? invoices
            .filter(inv => inv.status === 'Paid' && inv.date === todayStr)
            .reduce((sum, inv) => sum + (inv.amount || 0), 0)
        : 0;

    // Calculate payment methods for today
    const todayCash = Array.isArray(invoices)
        ? invoices
            .filter(inv => inv.status === 'Paid' && inv.date === todayStr && inv.paymentMethod === 'Cash')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0)
        : 0;

    const todayTransfer = Array.isArray(invoices)
        ? invoices
            .filter(inv => inv.status === 'Paid' && inv.date === todayStr && inv.paymentMethod === 'Transfer')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0)
        : 0;

    const todayCredit = Array.isArray(invoices)
        ? invoices
            .filter(inv => inv.status === 'Paid' && inv.date === todayStr && inv.paymentMethod === 'Credit Card')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0)
        : 0;

    const totalRevenue = Array.isArray(invoices)
        ? invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0)
        : 0;

    const todayAppointments = Array.isArray(appointments)
        ? appointments
            .filter(apt => apt.date === todayStr)
            .sort((a, b) => a.time.localeCompare(b.time))
        : [];
    const appointmentCount = todayAppointments.length;

    // Calculate completed appointments
    const completedApts = Array.isArray(appointments)
        ? appointments.filter(apt => apt.status === 'Completed' || apt.status === 'Confirmed').length
        : 0;

    // Filter appointments for trends
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const patientsThisMonth = patients?.filter(p => {
        const d = new Date(p.created_at || p.dateRegister);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length || 0;

    const patientsLastMonth = patients?.filter(p => {
        const d = new Date(p.created_at || p.dateRegister);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length || 0;

    const getTrend = (thisVal, lastVal) => {
        if (!lastVal || lastVal === 0) return thisVal > 0 ? 100 : 0;
        return parseFloat((((thisVal - lastVal) / lastVal) * 100).toFixed(1));
    };

    const patientTrend = getTrend(patientsThisMonth, patientsLastMonth);

    const revenueThisMonth = invoices?.filter(inv => {
        const d = new Date(inv.date);
        return inv.status === 'Paid' && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

    const revenueLastMonth = invoices?.filter(inv => {
        const d = new Date(inv.date);
        return inv.status === 'Paid' && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

    const revenueTrend = getTrend(revenueThisMonth, revenueLastMonth);

    // Filter Top Services
    const serviceCounts = {};
    if (Array.isArray(appointments)) {
        appointments.forEach(a => {
            serviceCounts[a.procedure] = (serviceCounts[a.procedure] || 0) + 1;
        });
    }
    const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

    // Revenue trend data (uses actual invoices if available, else zero)
    const revenueTrendData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayStr = d.toISOString().split('T')[0];
        const dayRevenue = Array.isArray(invoices)
            ? invoices
                .filter(inv => inv.status === 'Paid' && inv.date === dayStr)
                .reduce((sum, inv) => sum + (inv.amount || 0), 0)
            : 0;
            
        return {
            day: format(d, 'EEE'),
            amt: dayRevenue
        };
    });

    return (
        <div className="dashboard-container">
            <SSOReportModal isOpen={showSSOReport} onClose={() => setShowSSOReport(false)} />
            
            {/* Header */}
            <div className="dashboard-header animate-fade-in" style={{ marginBottom: '2.5rem' }}>
                <div className="header-welcome">
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                        {t('dash_welcome_morning')}
                    </h1>
                    <div className="header-date" style={{ color: 'var(--neutral-500)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
                        <Calendar size={16} style={{ marginRight: '8px', color: 'var(--primary-600)' }} />
                        {format(today, language === 'EN' ? 'EEEE, d MMMM yyyy' : 'd MMMM yyyy')}
                    </div>
                </div>
                <div className="header-buttons" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ 
                        backgroundColor: 'white', 
                        border: '1.5px solid var(--neutral-200)', 
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: 700,
                        color: 'var(--neutral-700)',
                        boxShadow: 'var(--shadow-sm)'
                    }} onClick={() => navigate('/patients')}>
                        <Search size={18} style={{ marginRight: '8px', color: 'var(--primary-600)' }} />
                        {language === 'EN' ? 'Search Patient' : 'ค้นหาคนไข้'}
                    </button>
                    <button className="btn btn-primary" style={{ 
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: 800,
                        boxShadow: 'var(--shadow-md)',
                        background: 'var(--gradient-primary)'
                    }} onClick={() => navigate('/schedule?action=new')}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        {t('sch_new_apt')}
                    </button>
                </div>
            </div>

            {/* Executive Summary Section */}
            <div className="executive-summary animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card glass-panel-premium" style={{ 
                    padding: '1.75rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '280px', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', zIndex: 1 }}>
                        <div>
                            <p style={{ color: 'var(--success-700)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash_today_revenue')}</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-600)' }}>฿</span>
                                <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.05em' }}>{todayRevenue.toLocaleString()}</h2>
                            </div>
                        </div>
                        <div className="floating-icon" style={{ width: '56px', height: '56px', background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-600)', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)', border: '1px solid var(--success-100)' }}>
                            <DollarSign size={28} />
                        </div>
                    </div>
                    
                    {/* Payment Methods Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: 'auto', zIndex: 1 }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--success-100)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', fontWeight: 600 }}>เงินสด</span>
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neutral-900)' }}>฿{todayCash.toLocaleString()}</div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--primary-100)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', fontWeight: 600 }}>โอน</span>
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neutral-900)' }}>฿{todayTransfer.toLocaleString()}</div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--amber-100)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', fontWeight: 600 }}>บัตร</span>
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neutral-900)' }}>฿{todayCredit.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div style={{ position: 'absolute', bottom: -10, left: 0, right: 0, height: '80px', opacity: 0.6 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrendData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="amt" stroke="#10b981" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={4} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card glass-panel-premium" style={{ 
                    padding: '1.75rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    height: '280px', 
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <div className="floating-icon" style={{ width: '64px', height: '64px', background: 'var(--primary-600)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.4)', marginBottom: '1.5rem' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--primary-800)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash_new_patients_today')}</p>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--neutral-900)', lineHeight: 0.9, letterSpacing: '-0.05em', margin: '0.5rem 0' }}>{patients?.filter(p => (p.created_at || p.dateRegister)?.startsWith(todayStr)).length || 0}</h2>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.5)', padding: '4px 12px', borderRadius: '12px', marginTop: '0.5rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-600)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 700 }}>{language === 'EN' ? 'This month' : 'เดือนนี้'}: {patientsThisMonth}</span>
                        </div>
                    </div>
                </div>

                <div className="card glass-panel-premium" style={{ padding: '1.75rem', height: '280px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--neutral-100)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-600)' }}>
                            <TrendingUp size={18} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--neutral-800)' }}>{language === 'EN' ? 'Top Services' : 'หัตถการยอดนิยม'}</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                        {topServices.length > 0 ? topServices.map((svc, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    <div style={{ 
                                        width: '36px', 
                                        height: '36px', 
                                        borderRadius: '12px', 
                                        background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#fff7ed',
                                        color: i === 0 ? '#d97706' : i === 1 ? '#475569' : '#c2410c',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.85rem',
                                        fontWeight: 900
                                    }}>
                                        {i + 1}
                                    </div>
                                    <span style={{ fontWeight: 700, color: 'var(--neutral-700)', fontSize: '0.95rem' }}>{svc.name}</span>
                                </div>
                                <span style={{ fontWeight: 900, color: 'var(--neutral-900)', background: 'var(--neutral-100)', padding: '4px 12px', borderRadius: '10px', fontSize: '0.85rem' }}>{svc.count}</span>
                            </div>
                        )) : (
                            <div style={{ color: 'var(--neutral-400)', textAlign: 'center', fontSize: '0.95rem', padding: '2rem', fontStyle: 'italic' }}>{language === 'EN' ? 'No data yet' : 'ยังไม่มีข้อมูล'}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    title={t('dash_total_patients')}
                    value={totalPatients.toLocaleString()}
                    trend={patientTrend}
                    icon={Users}
                    colorClass="bg-blue-500"
                    delay="delay-0"
                    t={t}
                />
                <StatCard
                    title={t('dash_revenue')}
                    value={`฿${(totalRevenue / 1000).toFixed(1)}k`}
                    trend={revenueTrend}
                    icon={DollarSign}
                    colorClass="bg-green-500"
                    delay="delay-100"
                    t={t}
                />
                <StatCard
                    title={t('dash_appointments')}
                    value={appointmentCount.toString()}
                    trend={0}
                    icon={Calendar}
                    colorClass="bg-purple-500"
                    delay="delay-200"
                    t={t}
                />
                <StatCard
                    title={t('dash_efficiency')}
                    value={`${appointmentCount > 0 ? Math.round((completedApts / appointmentCount) * 100) : 100}%`}
                    trend={0}
                    icon={CheckCircle}
                    colorClass="bg-amber-500"
                    delay="delay-300"
                    t={t}
                />
            </div>

            {/* Main Content */}
            <div className="dashboard-main">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="section-card animate-slide-up delay-200">
                        <div className="section-header">
                            <div>
                                <h3 style={{ fontSize: '1.125rem' }}>{t('dash_today_schedule')}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>{appointmentCount} {t('dash_appointments_remaining')}</p>
                            </div>
                            <button className="btn" style={{ color: 'var(--primary-600)', padding: 0, background: 'none' }} onClick={() => navigate('/schedule')}>{t('dash_see_all')}</button>
                        </div>
                        <div className="appointment-list">
                            {todayAppointments.length > 0 ? (
                                todayAppointments.map((apt, index) => (
                                    <AppointmentRow
                                        key={index}
                                        time={apt.time}
                                        patient={apt.patientName}
                                        type={apt.procedure}
                                        status={apt.status}
                                    />
                                ))
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                                    No appointments for today
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="section-card animate-slide-up delay-300" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>{t('dash_clinic_pulse')}</h3>
                        <div className="pulse-list">
                            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                                {language === 'EN' ? 'No recent activity' : 'ยังไม่มีความเคลื่อนไหว'}
                            </div>
                        </div>
                    </div>

                    <div className="recall-card animate-slide-up delay-300">
                        <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('dash_recall_next')}</p>
                        {todayAppointments.length > 0 ? (
                            <>
                                <h3>{todayAppointments[0].time}</h3>
                                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>{todayAppointments[0].patientName}</p>
                            </>
                        ) : (
                            <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>No upcoming appointments</p>
                        )}
                        <button className="btn btn-white" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/schedule')}>
                            View Schedule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
