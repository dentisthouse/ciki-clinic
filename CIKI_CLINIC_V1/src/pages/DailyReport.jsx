import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileText, 
    DollarSign, 
    Users, 
    Calendar, 
    Clock, 
    TrendingUp, 
    Download, 
    CheckCircle,
    AlertCircle,
    CreditCard,
    Receipt,
    PiggyBank,
    Activity,
    ArrowRight,
    Printer,
    ChevronRight,
    Search
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import '../styles/dashboard.css'; // Reusing premium animations and glass styles

const StatCard = ({ title, value, icon: Icon, colorVar, delay, unit = '฿' }) => (
    <div className={`stat-card glass-panel-premium animate-slide-up ${delay}`} style={{ background: 'white' }}>
        <div className="stat-header">
            <div className="stat-info">
                <p>{title}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    {unit === '฿' && <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neutral-400)' }}>฿</span>}
                    <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
                </div>
            </div>
            <div className={`stat-icon-wrapper floating-icon`} style={{ 
                background: `linear-gradient(135deg, var(--neutral-50) 0%, white 100%)`, 
                color: `var(--${colorVar})`,
                border: `1px solid var(--neutral-100)`
            }}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const DailyReport = () => {
    const { t, language } = useLanguage();
    const { appointments = [], patients = [], invoices = [], expenses = [] } = useData();
    const { staff } = useAuth();
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Calculate report data using useMemo for performance
    const reportData = useMemo(() => {
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);
        
        // Filter data by selected date
        const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= start && aptDate <= end;
        });

        const dayBilling = invoices.filter(bill => {
            const billDate = new Date(bill.date || bill.createdAt);
            return billDate >= start && billDate <= end;
        });

        const dayExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });

        // Statistics
        const totalRevenue = dayBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const totalExpenses = dayExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        
        const completedAppointments = dayAppointments.filter(apt => apt.status === 'completed' || apt.status === 'Completed').length;
        const cancelledAppointments = dayAppointments.filter(apt => apt.status === 'cancelled' || apt.status === 'Cancelled').length;
        
        const paymentMethods = [
            { name: t('bill_cash'), value: dayBilling.filter(b => b.paymentMethod === 'cash' || b.paymentMethod === 'Cash').reduce((s, b) => s + (b.amount || 0), 0), color: '#10b981' },
            { name: t('bill_card'), value: dayBilling.filter(b => b.paymentMethod === 'card' || b.paymentMethod === 'Credit Card').reduce((s, b) => s + (b.amount || 0), 0), color: '#3b82f6' },
            { name: t('bill_transfer'), value: dayBilling.filter(b => b.paymentMethod === 'transfer' || b.paymentMethod === 'Transfer').reduce((s, b) => s + (b.amount || 0), 0), color: '#f59e0b' },
            { name: t('bill_insurance'), value: dayBilling.filter(b => b.paymentMethod === 'insurance' || b.paymentMethod === 'Claim').reduce((s, b) => s + (b.amount || 0), 0), color: '#8b5cf6' }
        ].filter(method => method.value > 0);

        const treatmentMap = {};
        dayAppointments.forEach(apt => {
            const treatment = apt.procedure || apt.treatment || 'General';
            treatmentMap[treatment] = (treatmentMap[treatment] || 0) + 1;
        });
        const treatmentStats = Object.entries(treatmentMap).map(([name, value]) => ({ name, value }));

        return {
            summary: {
                totalPatients: dayAppointments.length,
                completedAppointments,
                totalRevenue,
                totalExpenses,
                netProfit
            },
            appointments: dayAppointments.sort((a,b) => (a.time || '').localeCompare(b.time || '')),
            paymentMethods,
            treatmentStats,
            staff: staff?.name || 'Admin'
        };
    }, [selectedDate, appointments, invoices, expenses, staff, t]);

    const exportToPDF = () => {
        window.print();
    };

    const closeDailyReport = async () => {
        if (!window.confirm(t('rep_confirm_close'))) return;

        setIsClosing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const closingReport = {
            ...reportData,
            closedAt: new Date().toISOString(),
            closedBy: staff?.name || 'Admin',
            status: 'closed'
        };

        const closedReports = JSON.parse(localStorage.getItem('closedDailyReports') || '[]');
        closedReports.push(closingReport);
        localStorage.setItem('closedDailyReports', JSON.stringify(closedReports));

        setIsClosing(false);
        alert(t('rep_closed_success'));
    };

    return (
        <div className="dashboard-container" style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div className="dashboard-header animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div className="header-welcome">
                    <h1>{t('rep_title')}</h1>
                    <div className="header-date">
                        <Calendar size={14} style={{ marginRight: '8px' }} />
                        {format(selectedDate, language === 'TH' ? 'd MMMM yyyy' : 'MMMM d, yyyy', { locale: language === 'TH' ? th : enUS })}
                    </div>
                </div>
                <div className="header-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div className="glass-panel-premium" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', background: 'white', borderRadius: '16px' }}>
                        <Clock size={16} style={{ color: 'var(--neutral-400)', marginRight: '0.5rem' }} />
                        <input
                            type="date"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: 'var(--neutral-700)' }}
                        />
                    </div>
                    <button onClick={exportToPDF} className="btn" style={{ background: 'white', border: '1px solid var(--neutral-200)' }}>
                        <Printer size={16} style={{ marginRight: '8px' }} />
                        {t('rep_export')}
                    </button>
                    <button onClick={closeDailyReport} disabled={isClosing} className="btn btn-primary">
                        {isClosing ? (
                            <>
                                <div className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                                {t('rep_closing')}
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} style={{ marginRight: '8px' }} />
                                {t('rep_close_report')}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="stats-grid">
                <StatCard 
                    title={t('rep_stats_patients')} 
                    value={reportData.summary.totalPatients}
                    icon={Users}
                    colorVar="info"
                    unit="qty"
                    delay="delay-0"
                />
                <StatCard 
                    title={t('rep_stats_completed')} 
                    value={reportData.summary.completedAppointments}
                    icon={CheckCircle}
                    colorVar="success"
                    unit="qty"
                    delay="delay-100"
                />
                <StatCard 
                    title={t('rep_stats_revenue')} 
                    value={reportData.summary.totalRevenue}
                    icon={DollarSign}
                    colorVar="primary-600"
                    delay="delay-200"
                />
                <StatCard 
                    title={t('rep_stats_profit')} 
                    value={reportData.summary.netProfit}
                    icon={PiggyBank}
                    colorVar={reportData.summary.netProfit >= 0 ? "success" : "danger"}
                    delay="delay-300"
                />
            </div>

            {/* Charts & Details Section */}
            <div className="dashboard-main">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Appointments List */}
                    <div className="glass-panel-premium animate-slide-up delay-100" style={{ overflow: 'hidden' }}>
                        <div className="section-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={20} />
                                </div>
                                <h3 style={{ margin: 0 }}>{t('rep_appointments')}</h3>
                            </div>
                        </div>
                        <div className="appointment-list">
                            {reportData.appointments.length === 0 ? (
                                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                                    <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                    <p>{t('rep_no_data')}</p>
                                </div>
                            ) : (
                                reportData.appointments.map((apt, idx) => (
                                    <div key={idx} className="appointment-item" style={{ padding: '1.25rem 1.5rem' }}>
                                        <div className="apt-time" style={{ color: 'var(--primary-600)', fontWeight: 700 }}>{apt.time}</div>
                                        <div className="apt-info">
                                            <div className="apt-name">{apt.patientName || apt.patient}</div>
                                            <div className="apt-type">{apt.procedure || apt.treatment}</div>
                                        </div>
                                        <div style={{ 
                                            padding: '0.35rem 0.85rem', 
                                            borderRadius: '12px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 700,
                                            background: apt.status?.toLowerCase() === 'completed' ? 'var(--success-light)' : 'var(--warning-light)',
                                            color: apt.status?.toLowerCase() === 'completed' ? 'var(--success-700)' : 'var(--warning-700)'
                                        }}>
                                            {apt.status}
                                        </div>
                                        <ChevronRight size={16} style={{ marginLeft: '1rem', color: 'var(--neutral-300)' }} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Treatment Stats Chart */}
                    <div className="glass-panel-premium animate-slide-up delay-200" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--amber-50)', color: 'var(--amber-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity size={20} />
                            </div>
                            <h3 style={{ margin: 0 }}>{t('rep_treatments')}</h3>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.treatmentStats} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} fontSize={12} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                                    <Bar dataKey="value" fill="var(--primary-500)" radius={[0, 8, 8, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Payment Breakdown Pie Chart */}
                    <div className="glass-panel-premium animate-slide-up delay-200" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CreditCard size={20} />
                            </div>
                            <h3 style={{ margin: 0 }}>{t('rep_payments')}</h3>
                        </div>
                        <div style={{ height: '240px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={reportData.paymentMethods}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {reportData.paymentMethods.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                            {reportData.paymentMethods.map((method, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: method.color }} />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{method.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 800 }}>฿{method.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Staff / System Info */}
                    <div className="recall-card animate-slide-up delay-300" style={{ textAlign: 'left', padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={28} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{reportData.staff}</h4>
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Reporting Officer</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9, lineHeight: 1.6 }}>
                            This daily report summarizes all financial transactions and clinical patient records captured on {format(selectedDate, 'PPP')}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyReport;
