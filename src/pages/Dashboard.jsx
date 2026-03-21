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
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';


const StatCard = ({ title, value, icon: Icon, trend, colorClass, delay, t }) => (
    <div className={`stat-card animate-slide-up ${delay}`}>
        <div className="stat-header">
            <div className="stat-info">
                <p>{title}</p>
                <h3>{value}</h3>
            </div>
            <div className={`stat-icon-wrapper ${colorClass}`} style={{ backgroundColor: `var(--${colorClass.split('-')[1]}-50)` }}>
                <Icon className={colorClass.replace('bg-', 'text-')} />
            </div>
        </div>
        <div className="stat-trend">
            <span style={{ color: trend >= 0 ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center' }}>
                {trend >= 0 ? <TrendingUp size={16} style={{ marginRight: '4px' }} /> : <TrendingUp size={16} style={{ marginRight: '4px', transform: 'rotate(180deg)' }} />}
                {Math.abs(trend)}%
            </span>
            <span style={{ color: 'var(--neutral-400)', marginLeft: '8px' }}>vs last month</span>
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
    const { patients, appointments, invoices } = useData();
    const [showSSOReport, setShowSSOReport] = useState(false);

    // Calculate Stats
    const totalPatients = patients ? patients.length : 0;
    const totalRevenue = Array.isArray(invoices)
        ? invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0)
        : 0;
    const todayAppointments = Array.isArray(appointments)
        ? appointments
            .filter(apt => new Date(apt.date).toDateString() === today.toDateString())
            .sort((a, b) => a.time.localeCompare(b.time))
        : [];
    const appointmentCount = todayAppointments.length;

    // Efficiency (Mock calculation for now, or based on completed appointments)
    const completedApts = todayAppointments.filter(a => a.status === 'Completed').length;
    const efficiency = appointmentCount > 0 ? Math.round((completedApts / appointmentCount) * 100) : 100;

    // --- Executive Data ---
    const todayStr = today.toISOString().split('T')[0];
    const todayRevenue = Array.isArray(invoices)
        ? invoices
            .filter(inv => inv.status === 'Paid' && inv.date === todayStr)
            .reduce((sum, inv) => sum + inv.amount, 0)
        : 0;

    // Mock "Last 7 Days" revenue for mini-graph
    const revenueTrendData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            day: format(d, 'EEE'),
            amt: Math.floor(Math.random() * 5000) + 2000 + (i === 6 ? todayRevenue : 0) // Mock trend
        };
    });

    // Mock "New Patients" (Assuming last 2 patients are new for demo)
    const newPatientsCount = 3;

    // Top Services
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

    return (
        <div className="dashboard-container">
            <SSOReportModal isOpen={showSSOReport} onClose={() => setShowSSOReport(false)} />
            {/* Header */}
            <div className="dashboard-header animate-fade-in">
                <div className="header-welcome">
                    <h1>{t('dash_welcome_morning')}</h1>
                    <div className="header-date">
                        <Calendar size={14} style={{ marginRight: '8px' }} />
                        {format(today, language === 'EN' ? 'EEEE, d MMMM yyyy' : 'd MMMM yyyy')}
                    </div>
                </div>
                <div className="header-buttons">
                    <button className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--neutral-200)' }} onClick={() => navigate('/patients')}>
                        <Search size={16} style={{ marginRight: '8px' }} />
                        {language === 'EN' ? 'Search Patient' : 'ค้นหาคนไข้'}
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/schedule?action=new')}>
                        <Plus size={16} style={{ marginRight: '8px' }} />
                        {t('sch_new_apt')}
                    </button>
                </div>
            </div>

            {/* --- Executive Summary Section --- */}
            <div className="executive-summary animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* 1. Daily Revenue Graph */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '180px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', zIndex: 1 }}>
                        <div>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Today's Revenue</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534' }}>฿{todayRevenue.toLocaleString()}</h2>
                        </div>
                        <div style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', opacity: 0.5 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrendData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="amt" stroke="#166534" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. New Patients */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', height: '180px', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                    <div style={{ width: '60px', height: '60px', background: '#3b82f6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>New Patients (Today)</p>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e40af', lineHeight: 1 }}>+{newPatientsCount}</h2>
                        <p style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: '0.25rem' }}>Last 30 days: +42</p>
                    </div>
                </div>

                {/* 3. Top Services */}
                <div className="card" style={{ padding: '1.5rem', height: '180px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--neutral-600)' }}>Top Services</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {topServices.length > 0 ? topServices.map((svc, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309' }} />
                                    <span>{svc.name}</span>
                                </div>
                                <span style={{ fontWeight: 600 }}>{svc.count}</span>
                            </div>
                        )) : (
                            <div style={{ color: '#ccc', textAlign: 'center', fontSize: '0.9rem' }}>No data yet</div>
                        )}
                    </div>
                </div>

            </div>

            {/* Quick Stats Grid (Secondary) */}
            <div className="stats-grid">
                <StatCard
                    title={t('dash_total_patients')}
                    value={totalPatients.toLocaleString()}
                    trend={12}
                    icon={Users}
                    colorClass="text-primary-600"
                    delay="delay-0"
                    t={t}
                />
                <StatCard
                    title={t('dash_revenue')}
                    value={`฿${(totalRevenue / 1000).toFixed(1)}k`}
                    trend={8.5}
                    icon={DollarSign}
                    colorClass="text-green-600"
                    delay="delay-100"
                    t={t}
                />
                <StatCard
                    title={t('dash_appointments')}
                    value={appointmentCount}
                    trend={-2.4}
                    icon={Calendar}
                    colorClass="text-purple-600"
                    delay="delay-200"
                    t={t}
                />
                <StatCard
                    title={t('dash_efficiency')}
                    value={`${efficiency}%`}
                    trend={1.2}
                    icon={TrendingUp}
                    colorClass="text-orange-600"
                    delay="delay-300"
                    t={t}
                />
            </div>

            {/* Main Content Area */}
            <div className="dashboard-main">
                {/* Left Column */}
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

                    <div className="quick-actions-grid animate-slide-up delay-200">
                        <button className="action-btn" onClick={() => navigate('/patients?action=new')}>
                            <div className="action-icon"><Plus size={20} /></div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('btn_register_patient')}</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/billing?action=new')}>
                            <div className="action-icon"><Plus size={20} /></div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('btn_create_invoice')}</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/labs?action=new')}>
                            <div className="action-icon"><Plus size={20} /></div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('btn_lab_order')}</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/inventory')}>
                            <div className="action-icon"><Plus size={20} /></div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('btn_stock_check')}</span>
                        </button>
                        <button className="action-btn" onClick={() => setShowSSOReport(true)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div className="action-icon" style={{ color: '#166534', background: '#dcfce7' }}><TrendingUp size={20} /></div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#166534' }}>SSO Report</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/analytics')} style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                            <div className="action-icon" style={{ color: '#1d4ed8', background: '#dbeafe' }}><TrendingUp size={20} /></div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1d4ed8' }}>Analytics</span>
                        </button>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="section-card animate-slide-up delay-300" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>{t('dash_clinic_pulse')}</h3>
                        <div className="pulse-list">
                            <div className="pulse-item">
                                <div className="pulse-indicator">
                                    <div className="dot dot-blue"></div>
                                    <div className="pulse-line"></div>
                                </div>
                                <div className="pulse-content">
                                    <h4>{t('dash_pulse_new_review_title')}</h4>
                                    <p>{t('dash_pulse_new_review_desc')}</p>
                                    <div className="pulse-time">{t('dash_pulse_time_2_mins_ago')}</div>
                                </div>
                            </div>
                            <div className="pulse-item">
                                <div className="pulse-indicator">
                                    <div className="dot dot-green"></div>
                                    <div className="pulse-line"></div>
                                </div>
                                <div className="pulse-content">
                                    <h4>{t('dash_pulse_stock_low_title')}</h4>
                                    <p>{t('dash_pulse_stock_low_desc')}</p>
                                    <div className="pulse-time">{t('dash_pulse_time_1_hour_ago')}</div>
                                </div>
                            </div>
                            <div className="pulse-item">
                                <div className="pulse-indicator">
                                    <div className="dot dot-purple"></div>
                                </div>
                                <div className="pulse-content">
                                    <h4>{t('dash_pulse_lab_result_title')}</h4>
                                    <p>{t('dash_pulse_lab_result_desc')}</p>
                                    <div className="pulse-time">{t('dash_pulse_time_3_hours_ago')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="recall-card animate-slide-up delay-300">
                        <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('dash_recall_next')}</p>
                        <h3>02:00 PM</h3>
                        <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Mrs. Suda Rakdee</p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>{t('btn_details')}</button>
                            <button className="btn btn-white" style={{ fontSize: '0.75rem' }}>{t('btn_checkin')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
