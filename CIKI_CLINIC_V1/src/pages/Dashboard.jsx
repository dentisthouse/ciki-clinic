import React, { useState, useMemo } from 'react';
import {
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    TrendingDown,
    Plus,
    Search,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Clock,
    Package,
    FlaskConical,
    Activity,
    Award,
    XCircle,
    UserPlus,
    BarChart3,
    Filter
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, addHours, startOfDay, getHours } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import SSOReportModal from '../components/Billing/SSOReportModal';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, delay, color = 'primary' }) => {
    const { t } = useLanguage();
    return (
        <div className={`stat-card-premium animate-slide-up ${delay}`}>
            <div className={`stat-accent-bar bg-${color}`}></div>
            <div className="stat-content">
                <div className="stat-main-info">
                    <p className="stat-label-modern">{title}</p>
                    <div className="stat-value-container">
                        {value.toString().includes('฿') && <span className="stat-currency">฿</span>}
                        <h3 className="stat-value-modern">{value.toString().replace('฿', '')}</h3>
                    </div>
                </div>
                <div className={`stat-icon-outer bg-light-${color}`}>
                    <div className={`stat-icon-inner bg-${color}`}>
                        <Icon size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>
            
            {trend !== undefined && (
                <div className="stat-footer-modern">
                    <div className={`trend-tag ${trend >= 0 ? 'up' : 'down'}`}>
                        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                    <span className="trend-label-small">{title.includes('Profit') || title.includes('Revenue') ? t('dash_vs_last_month') : t('dash_vs_last_week')}</span>
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const today = new Date();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { patients, appointments, invoices, expenses, labOrders, inventory, logs } = useData();
    const { staff, user } = useAuth();
    const isDentist = staff?.role?.toLowerCase() === 'dentist';
    const [activeTab, setActiveTab] = useState('financial'); // financial, operational, resources
    const [timeRange, setTimeRange] = useState('monthly'); // daily, weekly, monthly
    const [showSSOReport, setShowSSOReport] = useState(false);
    
    const todayStr = format(today, 'yyyy-MM-dd');
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    // -------------------------------------------------------------------------
    // 1. DATA PROCESSING ENGINE (Memoized for performance)
    // -------------------------------------------------------------------------
    const metrics = useMemo(() => {
        if (!patients || !invoices || !appointments) return null;

        // --- FILTER DATA FOR DENTIST ROLE ---
        const isDentist = staff?.role?.toLowerCase() === 'dentist';
        const dentistName = staff?.name;

        let paidInvoices = (invoices || []).filter(inv => inv.status === 'Paid');
        let currentAppointments = (appointments || []);
        let currentExpenses = (expenses || []);

        if (isDentist) {
            paidInvoices = paidInvoices.filter(inv => 
                inv.doctorName === dentistName || 
                inv.dentistId === staff.id ||
                inv.created_by === user?.id
            );
            currentAppointments = currentAppointments.filter(apt => 
                apt.doctorName === dentistName || 
                apt.dentistId === staff.id
            );
            // Dentists typically don't see clinic-wide expenses
            currentExpenses = [];
        }

        // Revenue by time range
        const revToday = paidInvoices.filter(inv => inv.date === todayStr).reduce((sum, inv) => sum + (inv.amount || 0), 0);
        
        const startOfThisWeek = startOfWeek(today);
        const endOfThisWeek = endOfWeek(today);
        const revWeekly = paidInvoices.filter(inv => {
            const d = new Date(inv.date);
            return isWithinInterval(d, { start: startOfThisWeek, end: endOfThisWeek });
        }).reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const revMonthly = paidInvoices.filter(inv => {
            const d = new Date(inv.date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const totalExpenses = currentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const totalRevenueNet = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        
        // FOR DENTISTS: "Net Profit" is their total commission
        // FOR ADMINS: "Net Profit" is Total Revenue - Total Expenses
        let netProfit = 0;
        if (isDentist) {
            const commissionRate = (staff.commissionRate || 50) / 100;
            netProfit = totalRevenueNet * commissionRate;
        } else {
            netProfit = totalRevenueNet - totalExpenses;
        }

        // Revenue by Category (grouped by procedure category)
        const revByCat = {};
        paidInvoices.forEach(inv => {
            const items = inv.billingItems || [];
            if (items.length > 0) {
                items.forEach(item => {
                    const cat = item.category || 'General';
                    revByCat[cat] = (revByCat[cat] || 0) + (item.price || 0);
                });
            } else {
                // Fallback for invoices with only top-level amount
                revByCat['Other'] = (revByCat['Other'] || 0) + (inv.amount || 0);
            }
        });
        const revenueByCatData = Object.entries(revByCat)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // --- TREND DATA (Last 30 days for daily, 12 weeks for weekly, 12 months for yearly) ---
        const trendData = [];
        if (timeRange === 'monthly') {
            // Every day of current month
            const monthStart = startOfMonth(today);
            const monthEnd = endOfMonth(today);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
            
            days.forEach(d => {
                const dayStr = format(d, 'yyyy-MM-dd');
                const label = format(d, 'd');
                
                const dayInvoices = paidInvoices.filter(inv => inv.date === dayStr);
                const revenue = dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
                const patientsCount = new Set(dayInvoices.map(inv => inv.patientId)).size;
                
                trendData.push({ name: label, revenue, patients: patientsCount });
            });
        } else if (timeRange === 'weekly') {
            // Days of current week
            const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
            
            days.forEach(d => {
                const dayStr = format(d, 'yyyy-MM-dd');
                const label = d.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { weekday: 'short' });
                
                const dayInvoices = paidInvoices.filter(inv => inv.date === dayStr);
                const revenue = dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
                const patientsCount = new Set(dayInvoices.map(inv => inv.patientId)).size;
                
                trendData.push({ name: label, revenue, patients: patientsCount });
            });
        } else {
            // Hourly for Today (09:00 - 20:00)
            for (let h = 9; h <= 20; h++) {
                const label = `${h.toString().padStart(2, '0')}:00`;
                
                // Track revenue and patients specifically for this hour
                // Note: We use invoice 'time' if available, or correlate with appointments
                const hourlyInvoices = paidInvoices.filter(inv => {
                    if (inv.date !== todayStr) return false;
                    const invDate = new Date(inv.created_at || inv.date);
                    // If we have created_at, use its hour. Otherwise, we might not have hourly precision for legacy data.
                    return inv.created_at ? getHours(new Date(inv.created_at)) === h : false;
                });

                const hourlyApps = (appointments || []).filter(a => {
                    if (a.date !== todayStr) return false;
                    const aptHour = parseInt(a.time?.split(':')[0] || '-1');
                    return aptHour === h;
                });

                const revenue = hourlyInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
                const patientsCount = new Set(hourlyApps.map(a => a.patientId)).size;
                
                trendData.push({ name: label, revenue, patients: patientsCount });
            }
        }

        const avgRevPerPatient = patients.length > 0 ? totalRevenueNet / patients.length : 0;

        // --- TREND CALCULATIONS (Current vs Past) ---
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const revLastMonth = paidInvoices.filter(inv => {
            const d = new Date(inv.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        }).reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const expensesLastMonth = currentExpenses.filter(exp => {
            const d = new Date(exp.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        }).reduce((sum, exp) => sum + (exp.amount || 0), 0);

        const profitLastMonth = revLastMonth - expensesLastMonth;
        const profitTrend = profitLastMonth > 0 ? ((netProfit - profitLastMonth) / profitLastMonth) * 100 : 0;

        // Today vs Yesterday Revenue
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        const revYesterday = paidInvoices.filter(inv => inv.date === yesterdayStr).reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const dailyRevTrend = revYesterday > 0 ? ((revToday - revYesterday) / revYesterday) * 100 : 0;

        // --- OPERATIONAL METRICS ---
        const totalSlots = 12; // 12 slots per day (9:00 - 18:00, 45m blocks)
        const appsToday = currentAppointments.filter(a => a.date === todayStr);
        const occupancyRate = totalSlots > 0 ? (appsToday.length / totalSlots) * 100 : 0;

        const totalApps = currentAppointments.length;
        const noShowApps = currentAppointments.filter(a => a.status === 'Cancelled' || a.status === 'No-show').length;
        const noShowRate = totalApps > 0 ? (noShowApps / totalApps) * 100 : 0;

        // New vs Returning (This Month)
        const newPats = (patients || []).filter(p => {
            const d = new Date(p.created_at || p.registrationDate);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length;
        const returningPats = patients.length - newPats;

        // Real Wait Time Logic (Experimental based on logs)
        let realAvgWaitTime = 0;
        const statusLogs = (logs || []).filter(l => l.action === 'update_status' && l.module === 'appointments');
        
        // Match Arrived -> In Progress transitions
        const waitTimes = [];
        const arrivalEvents = statusLogs.filter(l => l.details.includes('Arrived') || l.details.includes('Check-in'));
        const processingEvents = statusLogs.filter(l => l.details.includes('In Progress'));
        
        processingEvents.forEach(pe => {
            const aptId = pe.details.match(/บัตรคิว: (.*?) เป็น/)?.[1];
            if (aptId) {
                const arrival = arrivalEvents.find(ae => ae.details.includes(aptId));
                if (arrival) {
                    const diff = (new Date(pe.timestamp) - new Date(arrival.timestamp)) / 60000;
                    if (diff > 0 && diff < 120) waitTimes.push(diff); // Filter outliers
                }
            }
        });
        
        realAvgWaitTime = waitTimes.length > 0 ? waitTimes.reduce((a,b) => a + b) / waitTimes.length : 0; // Fallback to 0 if no data

        // --- RESOURCE METRICS ---
        // Doctor Performance (Hide for dentists as they only see themselves)
        const drPerf = {};
        if (!isDentist) {
            paidInvoices.forEach(inv => {
                if (inv.doctorName) {
                    drPerf[inv.doctorName] = (drPerf[inv.doctorName] || 0) + (inv.amount || 0);
                }
            });
        }
        const drPerformanceData = Object.entries(drPerf).map(([name, revenue]) => ({ name, revenue }));

        const inventoryAlerts = (inventory || []).filter(item => item.current_stock <= (item.min_stock_level || 10)).length;
        const activeLabs = (labOrders || []).filter(l => l.status !== 'Delivered' && l.status !== 'Received').length;

        return {
            financial: {
                today: revToday,
                todayTrend: dailyRevTrend,
                weekly: revWeekly,
                monthly: revMonthly,
                netProfit,
                profitTrend,
                avgRevPerPatient,
                revenueByCatData,
                trendData
            },
            operational: {
                occupancyRate,
                noShowRate,
                newPats,
                returningPats,
                avgWaitTime: Math.round(realAvgWaitTime),
                cancellations: noShowApps
            },
            resources: {
                drPerformanceData,
                inventoryAlerts,
                activeLabs
            }
        };
    }, [patients, appointments, invoices, expenses, labOrders, inventory, todayStr, thisMonth, thisYear, timeRange, language]);

    if (!metrics) return <div className="loading-container">{t('dash_loading')}</div>;

    const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

    return (
        <div className="dashboard-container-v2 animate-fade-in">
            <SSOReportModal isOpen={showSSOReport} onClose={() => setShowSSOReport(false)} />

            {/* Top Toolbar */}
            <div className="dashboard-toolbar">
                <div className="toolbar-info">
                    <h1>{t('dash_main_title')}</h1>
                    <p className="toolbar-subtitle">{t('dash_main_subtitle')}</p>
                </div>
                <div className="toolbar-actions">
                    <div className="tab-navigation">
                        <button 
                            className={`tab-item ${activeTab === 'financial' ? 'active' : ''}`}
                            onClick={() => setActiveTab('financial')}
                        >
                            <DollarSign size={18} />
                            {t('dash_cat_financial')}
                        </button>
                        <button 
                            className={`tab-item ${activeTab === 'operational' ? 'active' : ''}`}
                            onClick={() => setActiveTab('operational')}
                        >
                            <Activity size={18} />
                            {t('dash_cat_operational')}
                        </button>
                        {!isDentist && (
                            <button 
                                className={`tab-item ${activeTab === 'resources' ? 'active' : ''}`}
                                onClick={() => setActiveTab('resources')}
                            >
                                <Package size={18} />
                                {t('dash_cat_resource')}
                            </button>
                        )}
                    </div>

                    {activeTab === 'financial' && (
                        <div className="time-period-selector glass-panel-premium">
                            <button 
                                className={`period-btn ${timeRange === 'daily' ? 'active' : ''}`}
                                onClick={() => setTimeRange('daily')}
                            >
                                {t('dash_filter_daily')}
                            </button>
                            <button 
                                className={`period-btn ${timeRange === 'weekly' ? 'active' : ''}`}
                                onClick={() => setTimeRange('weekly')}
                            >
                                {t('dash_filter_weekly')}
                            </button>
                            <button 
                                className={`period-btn ${timeRange === 'monthly' ? 'active' : ''}`}
                                onClick={() => setTimeRange('monthly')}
                            >
                                {t('dash_filter_monthly')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main KPI Row */}
            <div className="kpi-grid-primary">
                {activeTab === 'financial' && (
                    <>
                        <StatCard 
                            title={t('dash_daily')} 
                            value={`฿${metrics.financial.today.toLocaleString()}`} 
                            icon={Clock} 
                            trend={Math.round(metrics.financial.todayTrend)}
                            color="info"
                            delay="delay-100"
                        />
                        <StatCard 
                            title={isDentist ? (language === 'TH' ? 'ส่วนแบ่งที่ได้รับ' : 'Your Commission') : t('dash_net_profit')} 
                            value={`฿${metrics.financial.netProfit.toLocaleString()}`} 
                            icon={TrendingUp} 
                            trend={Math.round(metrics.financial.profitTrend)}
                            color="success"
                            delay="delay-200"
                        />
                        <StatCard 
                            title={t('dash_avg_revenue_patient')} 
                            value={`฿${metrics.financial.avgRevPerPatient.toFixed(0)}`} 
                            icon={Users} 
                            color="warning"
                            delay="delay-300"
                        />
                    </>
                )}

                {activeTab === 'operational' && (
                    <>
                        <StatCard 
                            title={t('dash_occupancy_rate')} 
                            value={`${metrics.operational.occupancyRate.toFixed(1)}%`} 
                            icon={Calendar} 
                            color="primary"
                            delay="delay-0"
                        />
                        <StatCard 
                            title={t('dash_no_show_rate')} 
                            value={`${metrics.operational.noShowRate.toFixed(1)}%`} 
                            icon={XCircle} 
                            color="danger"
                            delay="delay-100"
                        />
                        <StatCard 
                            title={t('dash_wait_time')} 
                            value={`${metrics.operational.avgWaitTime} ${t('dash_unit_mins')}`} 
                            icon={Clock} 
                            color="warning"
                            delay="delay-200"
                        />
                        <StatCard 
                            title={t('dash_new_vs_returning')} 
                            value={`${metrics.operational.newPats} / ${metrics.operational.returningPats}`} 
                            icon={UserPlus} 
                            color="success"
                            delay="delay-300"
                        />
                    </>
                )}

                {activeTab === 'resources' && (
                    <>
                        <StatCard 
                            title={t('dash_dr_performance')} 
                            value={metrics.resources.drPerformanceData.length} 
                            icon={Award} 
                            color="primary"
                            delay="delay-0"
                        />
                        <StatCard 
                            title={t('dash_inventory_alerts')} 
                            value={metrics.resources.inventoryAlerts} 
                            icon={Package} 
                            color="danger"
                            delay="delay-100"
                        />
                        <StatCard 
                            title={t('dash_lab_status')} 
                            value={metrics.resources.activeLabs} 
                            icon={FlaskConical} 
                            color="info"
                            delay="delay-200"
                        />
                         <StatCard 
                            title={t('dash_appointments')} 
                            value={(appointments?.length || 0)} 
                            icon={Search} 
                            color="neutral"
                            delay="delay-300"
                        />
                    </>
                )}
            </div>

            {/* Visual Insights Section */}
            <div className="insights-grid">
                    <>
                        <div className="insight-card full-width animate-slide-up">
                            <div className="insight-header">
                                <h3>{t('dash_revenue_by_cat')}</h3>
                                <BarChart3 size={18} />
                            </div>
                            <div className="chart-wrapper-large">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={metrics.financial.revenueByCatData}>
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'var(--neutral-50)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {metrics.financial.revenueByCatData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="insight-card full-width animate-slide-up delay-100">
                            <div className="insight-header">
                                <div>
                                    <h3>{t('dash_trend_title')}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 500 }}>
                                        {t('dash_trend_subtitle')}
                                    </p>
                                </div>
                            </div>
                            <div className="chart-wrapper-large">
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={metrics.financial.trendData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-100)" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--neutral-500)' }}
                                        />
                                        <YAxis 
                                            yAxisId="left"
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--neutral-500)' }}
                                            tickFormatter={(value) => `฿${value.toLocaleString()}`}
                                        />
                                        <YAxis 
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--neutral-500)' }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                        />
                                        <Area 
                                            yAxisId="left"
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="var(--primary-500)" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorRev)" 
                                            name={t('dash_trend_revenue')}
                                        />
                                        <Area 
                                            yAxisId="right"
                                            type="monotone" 
                                            dataKey="patients" 
                                            stroke="var(--warning-500)" 
                                            strokeWidth={3}
                                            fill="transparent"
                                            name={t('dash_trend_patients')}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>


                {activeTab === 'operational' && (
                    <div className="insight-card animate-slide-up">
                         <div className="insight-header">
                            <h3>{t('dash_patient_composition')}</h3>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: t('dash_new_pats'), value: metrics.operational.newPats },
                                            { name: t('dash_returning_pats'), value: metrics.operational.returningPats }
                                        ]}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="var(--primary-500)" />
                                        <Cell fill="var(--neutral-200)" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="insight-card full-width animate-slide-up">
                        <div className="insight-header">
                            <h3>{t('dash_dr_performance')}</h3>
                        </div>
                        <div className="chart-wrapper-large">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={metrics.resources.drPerformanceData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" fontSize={12} width={100} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="var(--primary-600)" radius={[0, 6, 6, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Agenda & Alerts */}
            <div className="agenda-alerts-row">
                <div className="agenda-section glass-panel-premium">
                    <div className="section-title-row">
                        <h3>{t('dash_agenda_title')}</h3>
                        <span className="badge-today">{metrics.operational.occupancyRate.toFixed(0)}% {t('dash_full')}</span>
                    </div>
                    <div className="agenda-list">
                        {(appointments || []).filter(a => a.date === todayStr).sort((a,b) => (a.time || '').localeCompare(b.time || '')).slice(0, 5).map((apt, i) => (
                            <div key={i} className="agenda-item">
                                <span className="apt-time-badge">{apt.time}</span>
                                <div className="apt-main">
                                    <p className="apt-patient-name">{apt.patientName}</p>
                                    <p className="apt-procedure-text">{apt.procedure}</p>
                                </div>
                                <div className={`status-pill ${apt.status?.toLowerCase()}`}>
                                    {apt.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="alerts-section glass-panel-premium">
                    <div className="section-title-row">
                        <h3>{t('dash_critical_insights')}</h3>
                        <Filter size={18} />
                    </div>
                    <div className="alerts-list">
                        {metrics.resources.inventoryAlerts > 0 && (
                            <div className="alert-item danger">
                                <Package size={20} />
                                <div className="alert-info">
                                    <p className="alert-title">{t('dash_items_low').replace('{count}', metrics.resources.inventoryAlerts)}</p>
                                    <p className="alert-desc">{t('dash_inventory_alert_desc')}</p>
                                </div>
                            </div>
                        )}
                        {metrics.resources.activeLabs > 0 && (
                            <div className="alert-item info">
                                <FlaskConical size={20} />
                                <div className="alert-info">
                                    <p className="alert-title">{t('dash_labs_pending').replace('{count}', metrics.resources.activeLabs)}</p>
                                    <p className="alert-desc">{t('dash_lab_alert_desc')}</p>
                                </div>
                            </div>
                        )}
                        {metrics.operational.noShowRate > 20 && (
                            <div className="alert-item warning">
                                <XCircle size={20} />
                                <div className="alert-info">
                                    <p className="alert-title">{t('dash_no_show_alert_title').replace('{percent}', metrics.operational.noShowRate.toFixed(1))}</p>
                                    <p className="alert-desc">{t('dash_no_show_alert_desc')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
