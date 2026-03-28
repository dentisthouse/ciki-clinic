import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, ScatterChart, Scatter,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
    Calendar, DollarSign, TrendingUp, Users, Clock, ArrowLeft, Brain,
    Target, AlertTriangle, Crown, UserMinus, Activity, ChevronDown,
    TrendingDown, Package, Wallet, BarChart3, PieChart as PieChartIcon,
    CalendarDays, Percent, ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
    subMonths, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth,
    parseISO, differenceInDays, differenceInMonths
} from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const TIER_COLORS = {
    VIP: '#FFD700',
    Regular: '#0088FE',
    New: '#00C49F',
    'At-risk': '#FF8042',
    Lost: '#ef4444'
};

const AdvancedAnalyticsDashboard = () => {
    const { patients, appointments, invoices, expenses } = useData();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('30d');
    const [activeTab, setActiveTab] = useState('overview');
    const [revenueView, setRevenueView] = useState('daily'); // daily, monthly, yearly

    // ============ DATA PREPARATION ============
    const today = new Date();
    const paidInvoices = useMemo(() => invoices.filter(inv => inv.status === 'Paid'), [invoices]);

    // ============ 1. REVENUE TREND ANALYSIS ============
    const revenueAnalytics = useMemo(() => {
        // Daily Revenue
        const getDailyRevenue = (daysBack) => {
            const startDate = subDays(today, daysBack);
            const days = eachDayOfInterval({ start: startDate, end: today });
            return days.map(day => ({
                date: format(day, 'dd MMM'),
                fullDate: day,
                revenue: paidInvoices
                    .filter(inv => isSameDay(new Date(inv.date), day))
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0),
                count: paidInvoices.filter(inv => isSameDay(new Date(inv.date), day)).length
            }));
        };

        // Monthly Revenue
        const getMonthlyRevenue = (monthsBack) => {
            const startDate = subMonths(today, monthsBack);
            const months = eachMonthOfInterval({ start: startDate, end: today });
            return months.map(month => ({
                month: format(month, 'MMM yyyy'),
                fullMonth: month,
                revenue: paidInvoices
                    .filter(inv => isSameMonth(new Date(inv.date), month))
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0),
                count: paidInvoices.filter(inv => isSameMonth(new Date(inv.date), month)).length
            }));
        };

        // Comparison with previous period
        const currentPeriodDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
        const currentData = getDailyRevenue(currentPeriodDays);
        const previousData = getDailyRevenue(currentPeriodDays * 2).slice(0, currentPeriodDays);

        const currentTotal = currentData.reduce((sum, d) => sum + d.revenue, 0);
        const previousTotal = previousData.reduce((sum, d) => sum + d.revenue, 0);
        const growthRate = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0;

        // Monthly data for longer view
        const monthlyData = getMonthlyRevenue(11);

        // Average metrics
        const avgDailyRevenue = currentTotal / currentPeriodDays;
        const avgTransactionValue = paidInvoices.length > 0
            ? paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) / paidInvoices.length
            : 0;

        // Revenue by day of week
        const dayOfWeekRevenue = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        paidInvoices.forEach(inv => {
            const day = new Date(inv.date).getDay();
            dayOfWeekRevenue[day] = (dayOfWeekRevenue[day] || 0) + (inv.amount || 0);
        });
        const dayOfWeekData = dayNames.map((name, idx) => ({
            day: name,
            revenue: dayOfWeekRevenue[idx] || 0
        }));

        return {
            daily: currentData,
            monthly: monthlyData,
            comparison: { current: currentTotal, previous: previousTotal, growth: growthRate },
            avgDailyRevenue,
            avgTransactionValue,
            dayOfWeekData,
            totalRevenue: paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
        };
    }, [paidInvoices, timeRange]);

    // ============ 2. CUSTOMER BEHAVIOR ANALYSIS ============
    const customerBehavior = useMemo(() => {
        const patientStats = patients.map(patient => {
            const patientAppointments = appointments.filter(apt => apt.patientId === patient.id);
            const patientInvoices = paidInvoices.filter(inv => inv.patientId === patient.id);

            const totalSpent = patientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
            const visitCount = patientAppointments.length;
            const avgSpendPerVisit = visitCount > 0 ? totalSpent / visitCount : 0;

            // Last visit date
            const lastVisit = patientAppointments.length > 0
                ? patientAppointments.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
                : patient.lastVisit;

            const daysSinceLastVisit = lastVisit ? differenceInDays(today, new Date(lastVisit)) : null;

            // Appointment patterns
            const appointmentDates = patientAppointments.map(apt => new Date(apt.date)).sort((a, b) => a - b);
            let avgGapBetweenVisits = 0;
            if (appointmentDates.length > 1) {
                let totalGap = 0;
                for (let i = 1; i < appointmentDates.length; i++) {
                    totalGap += differenceInDays(appointmentDates[i], appointmentDates[i - 1]);
                }
                avgGapBetweenVisits = totalGap / (appointmentDates.length - 1);
            }

            return {
                ...patient,
                totalSpent,
                visitCount,
                avgSpendPerVisit,
                lastVisit,
                daysSinceLastVisit,
                avgGapBetweenVisits,
                firstVisit: appointmentDates.length > 0 ? appointmentDates[0] : null
            };
        });

        // Overall behavior metrics
        const totalCustomers = patients.length;
        const activeCustomers = patientStats.filter(p => p.daysSinceLastVisit !== null && p.daysSinceLastVisit <= 90).length;
        const avgCustomerValue = totalCustomers > 0
            ? patientStats.reduce((sum, p) => sum + p.totalSpent, 0) / totalCustomers
            : 0;
        const avgVisitsPerCustomer = totalCustomers > 0
            ? patientStats.reduce((sum, p) => sum + p.visitCount, 0) / totalCustomers
            : 0;

        // Visit frequency distribution
        const frequencyDistribution = [
            { range: '1 ครั้ง', count: patientStats.filter(p => p.visitCount === 1).length },
            { range: '2-3 ครั้ง', count: patientStats.filter(p => p.visitCount >= 2 && p.visitCount <= 3).length },
            { range: '4-6 ครั้ง', count: patientStats.filter(p => p.visitCount >= 4 && p.visitCount <= 6).length },
            { range: '7+ ครั้ง', count: patientStats.filter(p => p.visitCount >= 7).length }
        ];

        // Spending distribution
        const spendingRanges = [
            { range: '< ฿1,000', min: 0, max: 1000, count: 0 },
            { range: '฿1,000-5,000', min: 1000, max: 5000, count: 0 },
            { range: '฿5,000-10,000', min: 5000, max: 10000, count: 0 },
            { range: '฿10,000-25,000', min: 10000, max: 25000, count: 0 },
            { range: '> ฿25,000', min: 25000, max: Infinity, count: 0 }
        ];
        patientStats.forEach(p => {
            const range = spendingRanges.find(r => p.totalSpent >= r.min && p.totalSpent < r.max);
            if (range) range.count++;
        });

        return {
            patientStats,
            totalCustomers,
            activeCustomers,
            avgCustomerValue,
            avgVisitsPerCustomer,
            frequencyDistribution,
            spendingDistribution: spendingRanges
        };
    }, [patients, appointments, paidInvoices]);

    // ============ 3. CUSTOMER TIER SEGMENTATION ============
    const customerTiers = useMemo(() => {
        const { patientStats } = customerBehavior;

        const tiers = patientStats.map(p => {
            let tier = 'New';
            let score = 0;

            // RFM-inspired scoring
            // Recency (lower days = higher score)
            const recencyScore = p.daysSinceLastVisit === null ? 0 :
                p.daysSinceLastVisit <= 30 ? 5 :
                p.daysSinceLastVisit <= 90 ? 4 :
                p.daysSinceLastVisit <= 180 ? 3 :
                p.daysSinceLastVisit <= 365 ? 2 : 1;

            // Frequency
            const frequencyScore = p.visitCount >= 10 ? 5 :
                p.visitCount >= 6 ? 4 :
                p.visitCount >= 3 ? 3 :
                p.visitCount >= 2 ? 2 : 1;

            // Monetary
            const monetaryScore = p.totalSpent >= 50000 ? 5 :
                p.totalSpent >= 25000 ? 4 :
                p.totalSpent >= 10000 ? 3 :
                p.totalSpent >= 5000 ? 2 : 1;

            score = recencyScore + frequencyScore + monetaryScore;

            // Tier classification
            if (score >= 12) tier = 'VIP';
            else if (score >= 9) tier = 'Regular';
            else if (score >= 6) tier = 'New';
            else if (p.daysSinceLastVisit !== null && p.daysSinceLastVisit <= 180) tier = 'At-risk';
            else tier = 'Lost';

            return { ...p, tier, rfmScore: score };
        });

        const tierCounts = {
            VIP: tiers.filter(t => t.tier === 'VIP').length,
            Regular: tiers.filter(t => t.tier === 'Regular').length,
            New: tiers.filter(t => t.tier === 'New').length,
            'At-risk': tiers.filter(t => t.tier === 'At-risk').length,
            Lost: tiers.filter(t => t.tier === 'Lost').length
        };

        const tierRevenue = {
            VIP: tiers.filter(t => t.tier === 'VIP').reduce((sum, t) => sum + t.totalSpent, 0),
            Regular: tiers.filter(t => t.tier === 'Regular').reduce((sum, t) => sum + t.totalSpent, 0),
            New: tiers.filter(t => t.tier === 'New').reduce((sum, t) => sum + t.totalSpent, 0),
            'At-risk': tiers.filter(t => t.tier === 'At-risk').reduce((sum, t) => sum + t.totalSpent, 0)
        };

        const tierData = Object.entries(tierCounts).map(([name, value]) => ({
            name,
            value,
            color: TIER_COLORS[name],
            revenue: tierRevenue[name] || 0
        }));

        return { tiers, tierCounts, tierData, tierRevenue };
    }, [customerBehavior]);

    // ============ 4. CHURN PREVENTION ANALYSIS ============
    const churnAnalysis = useMemo(() => {
        const { patientStats } = customerBehavior;

        // Identify at-risk customers
        const atRiskCustomers = patientStats
            .filter(p => {
                const days = p.daysSinceLastVisit;
                return days !== null && days > 90 && days <= 180 && p.visitCount > 0;
            })
            .sort((a, b) => b.totalSpent - a.totalSpent);

        // High-risk customers (haven't visited in 6+ months)
        const highRiskCustomers = patientStats
            .filter(p => {
                const days = p.daysSinceLastVisit;
                return days !== null && days > 180 && p.visitCount > 0;
            })
            .sort((a, b) => b.totalSpent - a.totalSpent);

        // Predicted churn probability based on patterns
        const churnPredictions = patientStats.map(p => {
            let probability = 0;
            const days = p.daysSinceLastVisit || 0;

            if (days > 365) probability = 90;
            else if (days > 180) probability = 70;
            else if (days > 90) probability = 40;
            else if (p.visitCount === 1) probability = 30;
            else if (p.avgGapBetweenVisits > 0 && days > p.avgGapBetweenVisits * 1.5) probability = 50;

            // Reduce probability for high spenders
            if (p.totalSpent > 50000) probability *= 0.7;
            else if (p.totalSpent > 20000) probability *= 0.85;

            return {
                ...p,
                churnProbability: Math.round(probability),
                riskLevel: probability >= 70 ? 'High' : probability >= 40 ? 'Medium' : 'Low'
            };
        }).filter(p => p.churnProbability > 0).sort((a, b) => b.churnProbability - a.churnProbability);

        // Churn risk distribution
        const riskDistribution = [
            { name: 'สูง (70%++)', value: churnPredictions.filter(p => p.churnProbability >= 70).length, color: '#ef4444' },
            { name: 'กลาง (40-69%)', value: churnPredictions.filter(p => p.churnProbability >= 40 && p.churnProbability < 70).length, color: '#f59e0b' },
            { name: 'ต่ำ (1-39%)', value: churnPredictions.filter(p => p.churnProbability > 0 && p.churnProbability < 40).length, color: '#10b981' }
        ];

        // Estimated revenue at risk
        const revenueAtRisk = churnPredictions
            .filter(p => p.churnProbability >= 50)
            .reduce((sum, p) => sum + (p.avgSpendPerVisit * p.avgGapBetweenVisits / 30), 0);

        return {
            atRiskCustomers: atRiskCustomers.slice(0, 10),
            highRiskCustomers: highRiskCustomers.slice(0, 10),
            churnPredictions: churnPredictions.slice(0, 20),
            riskDistribution,
            revenueAtRisk,
            atRiskCount: atRiskCustomers.length,
            highRiskCount: highRiskCustomers.length
        };
    }, [customerBehavior]);

    // ============ 5. PROFIT & EXPENSE ANALYSIS ============
    const profitAnalysis = useMemo(() => {
        const dailyProfit = revenueAnalytics.daily.map(day => {
            const dayExpenses = expenses
                .filter(exp => isSameDay(new Date(exp.date), day.fullDate))
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);
            return {
                ...day,
                expenses: dayExpenses,
                profit: day.revenue - dayExpenses,
                margin: day.revenue > 0 ? ((day.revenue - dayExpenses) / day.revenue * 100).toFixed(1) : 0
            };
        });

        const totalRevenue = revenueAnalytics.totalRevenue;
        const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const grossProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(1) : 0;

        // Expense breakdown by category
        const expenseByCategory = {};
        expenses.forEach(exp => {
            expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + (exp.amount || 0);
        });
        const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({
            name,
            value,
            percentage: totalExpenses > 0 ? (value / totalExpenses * 100).toFixed(1) : 0
        })).sort((a, b) => b.value - a.value);

        return {
            dailyProfit,
            totalRevenue,
            totalExpenses,
            grossProfit,
            profitMargin,
            expenseData
        };
    }, [revenueAnalytics, expenses]);

    // ============ 6. FORECASTING ============
    const forecasting = useMemo(() => {
        const monthlyData = revenueAnalytics.monthly;
        if (monthlyData.length < 3) return null;

        // Simple moving average forecast
        const last3Months = monthlyData.slice(-3);
        const avgMonthlyRevenue = last3Months.reduce((sum, m) => sum + m.revenue, 0) / 3;

        // Trend calculation
        const firstHalf = monthlyData.slice(0, Math.floor(monthlyData.length / 2));
        const secondHalf = monthlyData.slice(Math.floor(monthlyData.length / 2));
        const firstAvg = firstHalf.reduce((sum, m) => sum + m.revenue, 0) / firstHalf.length || 1;
        const secondAvg = secondHalf.reduce((sum, m) => sum + m.revenue, 0) / secondHalf.length;
        const trend = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);

        // Next 3 months forecast
        const forecast = [];
        for (let i = 1; i <= 3; i++) {
            const forecastMonth = subMonths(today, -i);
            const trendMultiplier = 1 + (parseFloat(trend) / 100) * (i / 3);
            forecast.push({
                month: format(forecastMonth, 'MMM yyyy'),
                predicted: Math.round(avgMonthlyRevenue * trendMultiplier),
                conservative: Math.round(avgMonthlyRevenue * 0.9),
                optimistic: Math.round(avgMonthlyRevenue * 1.1 * trendMultiplier)
            });
        }

        return {
            avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
            trend,
            forecast,
            yearlyProjection: Math.round(avgMonthlyRevenue * 12 * (1 + parseFloat(trend) / 100))
        };
    }, [revenueAnalytics]);

    // ============ RENDER HELPERS ============
    const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => (
        <div className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>{title}</p>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.5rem 0' }}>{value}</h2>
                    {subtitle && <p style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{subtitle}</p>}
                    {trend && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                            {trend === 'up' ? <ArrowUpRight size={16} color="#10b981" /> : <ArrowDownRight size={16} color="#ef4444" />}
                            <span style={{ color: trend === 'up' ? '#10b981' : '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>
                                {trendValue}
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ padding: '0.5rem', background: `${color}20`, borderRadius: '8px', color }}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === id ? 'var(--primary-600)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--neutral-600)',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            {language === 'TH' ? 'วิเคราะห์ขั้นสูง (Advanced Analytics)' : 'Advanced Analytics'}
                        </h1>
                        <p style={{ color: 'var(--neutral-500)' }}>
                            {language === 'TH' ? 'วิเคราะห์ลึก แนวโน้ม พฤติกรรมลูกค้า และการคาดการณ์' : 'Deep insights, trends, customer behavior & forecasting'}
                        </p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: '8px' }}>
                    {['7d', '30d', '1y'].map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: timeRange === range ? 'var(--primary-600)' : 'transparent',
                                color: timeRange === range ? 'white' : 'var(--neutral-600)',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            {range === '1y' ? (language === 'TH' ? '1 ปี' : '1 Year') :
                             range === '7d' ? (language === 'TH' ? '7 วัน' : '7 Days') :
                             (language === 'TH' ? '30 วัน' : '30 Days')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: '8px', marginBottom: '2rem', overflowX: 'auto' }}>
                <TabButton id="overview" label={language === 'TH' ? 'ภาพรวม' : 'Overview'} icon={Activity} />
                <TabButton id="revenue" label={language === 'TH' ? 'รายได้' : 'Revenue'} icon={TrendingUp} />
                <TabButton id="customers" label={language === 'TH' ? 'ลูกค้า' : 'Customers'} icon={Users} />
                <TabButton id="tiers" label={language === 'TH' ? 'ระดับ Tier' : 'Tiers'} icon={Crown} />
                <TabButton id="churn" label={language === 'TH' ? 'ป้องกันหาย' : 'Churn'} icon={AlertTriangle} />
                <TabButton id="profit" label={language === 'TH' ? 'กำไร' : 'Profit'} icon={Wallet} />
                <TabButton id="forecast" label={language === 'TH' ? 'คาดการณ์' : 'Forecast'} icon={Brain} />
            </div>

            {/* ============ OVERVIEW TAB ============ */}
            {activeTab === 'overview' && (
                <>
                    {/* Key Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard
                            title={language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}
                            value={`฿${revenueAnalytics.totalRevenue.toLocaleString()}`}
                            subtitle={language === 'TH' ? 'จากใบแจ้งหนี้ที่ชำระแล้ว' : 'From paid invoices'}
                            icon={DollarSign}
                            color="#8b5cf6"
                            trend={revenueAnalytics.comparison.growth >= 0 ? 'up' : 'down'}
                            trendValue={`${Math.abs(revenueAnalytics.comparison.growth).toFixed(1)}%`}
                        />
                        <StatCard
                            title={language === 'TH' ? 'ลูกค้าทั้งหมด' : 'Total Customers'}
                            value={customerBehavior.totalCustomers}
                            subtitle={`${customerBehavior.activeCustomers} ${language === 'TH' ? 'คนใช้งานอยู่' : 'active'}`}
                            icon={Users}
                            color="#3b82f6"
                        />
                        <StatCard
                            title={language === 'TH' ? 'มูลค่าลูกค้าเฉลี่ย' : 'Avg Customer Value'}
                            value={`฿${Math.round(customerBehavior.avgCustomerValue).toLocaleString()}`}
                            subtitle={language === 'TH' ? 'ต่อคน' : 'per customer'}
                            icon={Target}
                            color="#10b981"
                        />
                        <StatCard
                            title={language === 'TH' ? 'เฉลี่ยเข้ารักษา' : 'Avg Visits/Customer'}
                            value={customerBehavior.avgVisitsPerCustomer.toFixed(1)}
                            subtitle={language === 'TH' ? 'ครั้งต่อคน' : 'times per customer'}
                            icon={Calendar}
                            color="#f59e0b"
                        />
                        <StatCard
                            title={language === 'TH' ? 'ลูกค้าเสี่ยงหาย' : 'At-Risk Customers'}
                            value={churnAnalysis.atRiskCount}
                            subtitle={`${churnAnalysis.highRiskCount} ${language === 'TH' ? 'เสี่ยงสูง' : 'high risk'}`}
                            icon={UserMinus}
                            color="#ef4444"
                        />
                        <StatCard
                            title={language === 'TH' ? 'อัตรากำไร' : 'Profit Margin'}
                            value={`${profitAnalysis.profitMargin}%`}
                            subtitle={language === 'TH' ? 'กำไรขั้นต้น' : 'Gross margin'}
                            icon={Percent}
                            color="#ec4899"
                        />
                    </div>

                    {/* Overview Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <TrendingUp className="icon-primary" />
                                <h3>{language === 'TH' ? 'แนวโน้มรายได้ (30 วัน)' : 'Revenue Trend (30 Days)'}</h3>
                            </div>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueAnalytics.daily}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <PieChartIcon className="icon-primary" />
                                <h3>{language === 'TH' ? 'สัดส่วน Tier ลูกค้า' : 'Customer Tier Distribution'}</h3>
                            </div>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={customerTiers.tierData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {customerTiers.tierData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ============ REVENUE TAB ============ */}
            {activeTab === 'revenue' && (
                <>
                    {/* Revenue View Toggle */}
                    <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        {['daily', 'monthly', 'dayOfWeek'].map(view => (
                            <button
                                key={view}
                                onClick={() => setRevenueView(view)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: revenueView === view ? 'var(--primary-600)' : 'transparent',
                                    color: revenueView === view ? 'white' : 'var(--neutral-600)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                {view === 'daily' ? (language === 'TH' ? 'รายวัน' : 'Daily') :
                                 view === 'monthly' ? (language === 'TH' ? 'รายเดือน' : 'Monthly') :
                                 (language === 'TH' ? 'ตามวันในสัปดาห์' : 'By Day of Week')}
                            </button>
                        ))}
                    </div>

                    {/* Revenue Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard
                            title={language === 'TH' ? 'รายได้ช่วงนี้' : 'Period Revenue'}
                            value={`฿${revenueAnalytics.comparison.current.toLocaleString()}`}
                            icon={DollarSign}
                            color="#8b5cf6"
                            trend={revenueAnalytics.comparison.growth >= 0 ? 'up' : 'down'}
                            trendValue={`${Math.abs(revenueAnalytics.comparison.growth).toFixed(1)}% vs ${language === 'TH' ? 'ช่วงก่อน' : 'previous'}`}
                        />
                        <StatCard
                            title={language === 'TH' ? 'รายได้เฉลี่ย/วัน' : 'Avg Daily Revenue'}
                            value={`฿${Math.round(revenueAnalytics.avgDailyRevenue).toLocaleString()}`}
                            icon={Calendar}
                            color="#3b82f6"
                        />
                        <StatCard
                            title={language === 'TH' ? 'มูลค่าธุรกรรมเฉลี่ย' : 'Avg Transaction Value'}
                            value={`฿${Math.round(revenueAnalytics.avgTransactionValue).toLocaleString()}`}
                            icon={BarChart3}
                            color="#10b981"
                        />
                        <StatCard
                            title={language === 'TH' ? 'จำนวนธุรกรรม' : 'Transaction Count'}
                            value={paidInvoices.length}
                            icon={Activity}
                            color="#f59e0b"
                        />
                    </div>

                    {/* Revenue Charts */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>
                            {revenueView === 'daily' ? (language === 'TH' ? 'รายได้รายวัน' : 'Daily Revenue') :
                             revenueView === 'monthly' ? (language === 'TH' ? 'รายได้รายเดือน' : 'Monthly Revenue') :
                             (language === 'TH' ? 'รายได้ตามวันในสัปดาห์' : 'Revenue by Day of Week')}
                        </h3>
                        <div style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {revenueView === 'monthly' ? (
                                    <ComposedChart data={revenueAnalytics.monthly}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <RechartsTooltip formatter={(value, name) => [
                                            name === 'revenue' ? `฿${value.toLocaleString()}` : value,
                                            name === 'revenue' ? (language === 'TH' ? 'รายได้' : 'Revenue') : (language === 'TH' ? 'จำนวน' : 'Count')
                                        ]} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" name={language === 'TH' ? 'รายได้' : 'Revenue'} radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="count" stroke="#10b981" name={language === 'TH' ? 'จำนวนบิล' : 'Invoices'} />
                                    </ComposedChart>
                                ) : revenueView === 'dayOfWeek' ? (
                                    <BarChart data={revenueAnalytics.dayOfWeekData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                            {revenueAnalytics.dayOfWeekData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                ) : (
                                    <AreaChart data={revenueAnalytics.daily}>
                                        <defs>
                                            <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#colorRevenue2)" />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'เปรียบเทียบรายได้' : 'Revenue Comparison'}</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{language === 'TH' ? 'ช่วงเวลา' : 'Period'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'รายได้' : 'Revenue'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'จำนวนธุรกรรม' : 'Transactions'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'เฉลี่ย/ธุรกรรม' : 'Avg/Transaction'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 500 }}>{language === 'TH' ? 'ช่วงปัจจุบัน' : 'Current Period'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>฿{revenueAnalytics.comparison.current.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right' }}>{paidInvoices.filter(inv => {
                                            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
                                            return differenceInDays(today, new Date(inv.date)) <= days;
                                        }).length}</td>
                                        <td style={{ textAlign: 'right' }}>฿{Math.round(revenueAnalytics.comparison.current / (paidInvoices.filter(inv => {
                                            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
                                            return differenceInDays(today, new Date(inv.date)) <= days;
                                        }).length || 1)).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 500 }}>{language === 'TH' ? 'ช่วงก่อนหน้า' : 'Previous Period'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>฿{revenueAnalytics.comparison.previous.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right' }}>-</td>
                                        <td style={{ textAlign: 'right' }}>-</td>
                                    </tr>
                                    <tr style={{ background: 'var(--neutral-50)' }}>
                                        <td style={{ fontWeight: 500 }}>{language === 'TH' ? 'การเติบโต' : 'Growth'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: revenueAnalytics.comparison.growth >= 0 ? '#10b981' : '#ef4444' }}>
                                            {revenueAnalytics.comparison.growth >= 0 ? '+' : ''}{revenueAnalytics.comparison.growth.toFixed(1)}%
                                        </td>
                                        <td style={{ textAlign: 'right' }}>-</td>
                                        <td style={{ textAlign: 'right' }}>-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ============ CUSTOMERS TAB ============ */}
            {activeTab === 'customers' && (
                <>
                    {/* Customer Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard
                            title={language === 'TH' ? 'ลูกค้าทั้งหมด' : 'Total Customers'}
                            value={customerBehavior.totalCustomers}
                            subtitle={`${customerBehavior.activeCustomers} ${language === 'TH' ? 'คนใช้งาน (90วัน)' : 'active (90 days)'}`}
                            icon={Users}
                            color="#3b82f6"
                        />
                        <StatCard
                            title={language === 'TH' ? 'มูลค่าเฉลี่ยต่อลูกค้า' : 'Avg Value/Customer'}
                            value={`฿${Math.round(customerBehavior.avgCustomerValue).toLocaleString()}`}
                            icon={Target}
                            color="#8b5cf6"
                        />
                        <StatCard
                            title={language === 'TH' ? 'เข้ารักษาเฉลี่ย' : 'Avg Visits/Customer'}
                            value={customerBehavior.avgVisitsPerCustomer.toFixed(1)}
                            subtitle={language === 'TH' ? 'ครั้งต่อคน' : 'times per person'}
                            icon={CalendarDays}
                            color="#10b981"
                        />
                        <StatCard
                            title={language === 'TH' ? 'อัตราการใช้งาน' : 'Activity Rate'}
                            value={`${(customerBehavior.activeCustomers / (customerBehavior.totalCustomers || 1) * 100).toFixed(0)}%`}
                            subtitle={language === 'TH' ? 'ลูกค้าเข้ามาใน 90 วัน' : 'visited within 90 days'}
                            icon={Activity}
                            color="#f59e0b"
                        />
                    </div>

                    {/* Customer Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'ความถี่การเข้ารักษา' : 'Visit Frequency Distribution'}</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={customerBehavior.frequencyDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="range" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'การแจกจ่ายค่าใช้จ่าย' : 'Spending Distribution'}</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={customerBehavior.spendingDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="range" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Customers Table */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'ลูกค้าที่มีมูลค่าสูงสุด (Top 10)' : 'Top Value Customers (Top 10)'}</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>{language === 'TH' ? 'ชื่อ' : 'Name'}</th>
                                        <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'จำนวนครั้ง' : 'Visits'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ใช้จ่ายรวม' : 'Total Spent'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'เฉลี่ย/ครั้ง' : 'Avg/Visit'}</th>
                                        <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'ครั้งล่าสุด' : 'Last Visit'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerBehavior.patientStats
                                        .sort((a, b) => b.totalSpent - a.totalSpent)
                                        .slice(0, 10)
                                        .map((p, idx) => (
                                            <tr key={p.id}>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: idx < 3 ? '#fef3c7' : 'var(--neutral-100)',
                                                        color: idx < 3 ? '#d97706' : 'var(--neutral-600)'
                                                    }}>
                                                        #{idx + 1}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{p.name}</td>
                                                <td style={{ textAlign: 'center' }}>{p.visitCount}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700 }}>฿{p.totalSpent.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right' }}>฿{Math.round(p.avgSpendPerVisit).toLocaleString()}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {p.daysSinceLastVisit !== null ? (
                                                        <span style={{
                                                            color: p.daysSinceLastVisit <= 30 ? '#10b981' :
                                                                   p.daysSinceLastVisit <= 90 ? '#f59e0b' : '#ef4444'
                                                        }}>
                                                            {p.daysSinceLastVisit} {language === 'TH' ? 'วัน' : 'days'}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ============ TIERS TAB ============ */}
            {activeTab === 'tiers' && (
                <>
                    {/* Tier Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {customerTiers.tierData.map(tier => (
                            <div key={tier.name} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${tier.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>{tier.name} Tier</p>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.5rem 0' }}>{tier.value} {language === 'TH' ? 'คน' : 'customers'}</h2>
                                        <p style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>
                                            {language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}: ฿{tier.revenue.toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '0.5rem',
                                        background: `${tier.color}20`,
                                        borderRadius: '8px',
                                        color: tier.color
                                    }}>
                                        <Crown size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tier Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'จำนวนลูกค้าตาม Tier' : 'Customer Count by Tier'}</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={customerTiers.tierData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {customerTiers.tierData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'รายได้ตาม Tier' : 'Revenue by Tier'}</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={customerTiers.tierData.filter(t => t.revenue > 0)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                                        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                            {customerTiers.tierData.filter(t => t.revenue > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Tier Details Table */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'รายละเอียดลูกค้าตาม Tier' : 'Customer Details by Tier'}</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tier</th>
                                        <th>{language === 'TH' ? 'ชื่อ' : 'Name'}</th>
                                        <th style={{ textAlign: 'center' }}>RFM Score</th>
                                        <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'จำนวนครั้ง' : 'Visits'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ใช้จ่ายรวม' : 'Total Spent'}</th>
                                        <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'ครั้งล่าสุด' : 'Last Visit'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerTiers.tiers
                                        .sort((a, b) => {
                                            const tierOrder = { 'VIP': 0, 'Regular': 1, 'New': 2, 'At-risk': 3, 'Lost': 4 };
                                            return tierOrder[a.tier] - tierOrder[b.tier];
                                        })
                                        .map(p => (
                                            <tr key={p.id}>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: `${TIER_COLORS[p.tier]}20`,
                                                        color: TIER_COLORS[p.tier],
                                                        fontWeight: 600
                                                    }}>
                                                        {p.tier}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{p.name}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.rfmScore}/15</td>
                                                <td style={{ textAlign: 'center' }}>{p.visitCount}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>฿{p.totalSpent.toLocaleString()}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {p.daysSinceLastVisit !== null ? `${p.daysSinceLastVisit} ${language === 'TH' ? 'วัน' : 'days'}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ============ CHURN TAB ============ */}
            {activeTab === 'churn' && (
                <>
                    {/* Churn Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard
                            title={language === 'TH' ? 'ลูกค้าเสี่ยงหาย (กลาง)' : 'At-Risk Customers'}
                            value={churnAnalysis.atRiskCount}
                            subtitle={language === 'TH' ? 'ไม่มา 90-180 วัน' : '90-180 days absent'}
                            icon={AlertTriangle}
                            color="#f59e0b"
                        />
                        <StatCard
                            title={language === 'TH' ? 'ลูกค้าเสี่ยงหาย (สูง)' : 'High Risk Customers'}
                            value={churnAnalysis.highRiskCount}
                            subtitle={language === 'TH' ? 'ไม่มา >180 วัน' : '>180 days absent'}
                            icon={TrendingDown}
                            color="#ef4444"
                        />
                        <StatCard
                            title={language === 'TH' ? 'รายได้เสี่ยงหาย' : 'Revenue at Risk'}
                            value={`฿${Math.round(churnAnalysis.revenueAtRisk).toLocaleString()}`}
                            subtitle={language === 'TH' ? 'ประมาณการ/เดือน' : 'estimated/month'}
                            icon={DollarSign}
                            color="#8b5cf6"
                        />
                        <StatCard
                            title={language === 'TH' ? 'อัตราเสี่ยงรวม' : 'Overall Risk Rate'}
                            value={`${((churnAnalysis.atRiskCount + churnAnalysis.highRiskCount) / (customerBehavior.totalCustomers || 1) * 100).toFixed(1)}%`}
                            subtitle={language === 'TH' ? 'ของลูกค้าทั้งหมด' : 'of total customers'}
                            icon={Percent}
                            color="#ec4899"
                        />
                    </div>

                    {/* Churn Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'การกระจายความเสี่ยง' : 'Risk Distribution'}</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={churnAnalysis.riskDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {churnAnalysis.riskDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'ลูกค้าควรติดต่อด่วน (Top 10)' : 'Priority Contact List (Top 10)'}</h3>
                            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                                {churnAnalysis.churnPredictions.slice(0, 10).map(p => (
                                    <div key={p.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--neutral-100)',
                                        background: p.churnProbability >= 70 ? '#fef2f2' : p.churnProbability >= 40 ? '#fffbeb' : 'transparent'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                                                {language === 'TH' ? 'ไม่มา' : 'Absent'} {p.daysSinceLastVisit} {language === 'TH' ? 'วัน' : 'days'} • ฿{p.totalSpent.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: p.churnProbability >= 70 ? '#ef4444' : p.churnProbability >= 40 ? '#f59e0b' : '#10b981',
                                            color: 'white'
                                        }}>
                                            {p.churnProbability}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* At-Risk Customers Table */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'รายละเอียดลูกค้าเสี่ยงหาย' : 'At-Risk Customer Details'}</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{language === 'TH' ? 'ความเสี่ยง' : 'Risk'}</th>
                                        <th>{language === 'TH' ? 'ชื่อ' : 'Name'}</th>
                                        <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'ไม่มา (วัน)' : 'Days Absent'}</th>
                                        <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'จำนวนครั้งก่อน' : 'Previous Visits'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ใช้จ่ายรวม' : 'Total Spent'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'มูลค่าที่เสี่ยง' : 'Value at Risk'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {churnAnalysis.churnPredictions.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <span className="badge" style={{
                                                    background: p.churnProbability >= 70 ? '#fef2f2' : p.churnProbability >= 40 ? '#fffbeb' : '#f0fdf4',
                                                    color: p.churnProbability >= 70 ? '#ef4444' : p.churnProbability >= 40 ? '#f59e0b' : '#10b981',
                                                    fontWeight: 600
                                                }}>
                                                    {p.churnProbability >= 70 ? (language === 'TH' ? 'สูง' : 'High') :
                                                     p.churnProbability >= 40 ? (language === 'TH' ? 'กลาง' : 'Medium') :
                                                     (language === 'TH' ? 'ต่ำ' : 'Low')}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                                            <td style={{ textAlign: 'center', color: p.daysSinceLastVisit > 180 ? '#ef4444' : '#f59e0b' }}>
                                                {p.daysSinceLastVisit}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{p.visitCount}</td>
                                            <td style={{ textAlign: 'right' }}>฿{p.totalSpent.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                                                ฿{Math.round(p.avgSpendPerVisit * (p.avgGapBetweenVisits / 30 || 1)).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ============ PROFIT TAB ============ */}
            {activeTab === 'profit' && (
                <>
                    {/* Profit Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard
                            title={language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}
                            value={`฿${profitAnalysis.totalRevenue.toLocaleString()}`}
                            icon={DollarSign}
                            color="#10b981"
                        />
                        <StatCard
                            title={language === 'TH' ? 'ค่าใช้จ่ายรวม' : 'Total Expenses'}
                            value={`฿${profitAnalysis.totalExpenses.toLocaleString()}`}
                            icon={TrendingDown}
                            color="#ef4444"
                        />
                        <StatCard
                            title={language === 'TH' ? 'กำไรขั้นต้น' : 'Gross Profit'}
                            value={`฿${profitAnalysis.grossProfit.toLocaleString()}`}
                            icon={Wallet}
                            color="#8b5cf6"
                            trend={profitAnalysis.grossProfit >= 0 ? 'up' : 'down'}
                            trendValue={profitAnalysis.totalRevenue > 0 ? `${(profitAnalysis.grossProfit / profitAnalysis.totalRevenue * 100).toFixed(1)}%` : '0%'}
                        />
                        <StatCard
                            title={language === 'TH' ? 'อัตรากำไร' : 'Profit Margin'}
                            value={`${profitAnalysis.profitMargin}%`}
                            icon={Percent}
                            color="#3b82f6"
                        />
                    </div>

                    {/* Profit Chart */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'รายได้ vs ค่าใช้จ่าย vs กำไร (รายวัน)' : 'Revenue vs Expenses vs Profit (Daily)'}</h3>
                        <div style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={profitAnalysis.dailyProfit}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <RechartsTooltip formatter={(value, name) => [
                                        `฿${value.toLocaleString()}`,
                                        name === 'revenue' ? (language === 'TH' ? 'รายได้' : 'Revenue') :
                                        name === 'expenses' ? (language === 'TH' ? 'ค่าใช้จ่าย' : 'Expenses') :
                                        (language === 'TH' ? 'กำไร' : 'Profit')
                                    ]} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#10b981" name={language === 'TH' ? 'รายได้' : 'Revenue'} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" fill="#ef4444" name={language === 'TH' ? 'ค่าใช้จ่าย' : 'Expenses'} radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={3} name={language === 'TH' ? 'กำไร' : 'Profit'} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'การแจกจ่ายค่าใช้จ่ายตามหมวดหมู่' : 'Expense Breakdown by Category'}</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{language === 'TH' ? 'หมวดหมู่' : 'Category'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'จำนวน' : 'Amount'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? '% ของค่าใช้จ่าย' : '% of Expenses'}</th>
                                        <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'สัดส่วน' : 'Visual'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profitAnalysis.expenseData.map((exp, idx) => (
                                        <tr key={exp.name}>
                                            <td style={{ fontWeight: 500 }}>{exp.name}</td>
                                            <td style={{ textAlign: 'right' }}>฿{exp.value.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>{exp.percentage}%</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ width: '100px', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', margin: '0 auto' }}>
                                                    <div style={{ width: `${exp.percentage}%`, height: '100%', background: COLORS[idx % COLORS.length] }}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ============ FORECAST TAB ============ */}
            {activeTab === 'forecast' && forecasting && (
                <>
                    {/* Forecast Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard
                            title={language === 'TH' ? 'รายได้เฉลี่ย/เดือน' : 'Avg Monthly Revenue'}
                            value={`฿${forecasting.avgMonthlyRevenue.toLocaleString()}`}
                            icon={Calendar}
                            color="#8b5cf6"
                        />
                        <StatCard
                            title={language === 'TH' ? 'แนวโน้ม' : 'Trend'}
                            value={`${parseFloat(forecasting.trend) >= 0 ? '+' : ''}${forecasting.trend}%`}
                            subtitle={language === 'TH' ? 'เทียบครึ่งปีแรก-หลัง' : 'First vs Second Half'}
                            icon={TrendingUp}
                            color={parseFloat(forecasting.trend) >= 0 ? '#10b981' : '#ef4444'}
                            trend={parseFloat(forecasting.trend) >= 0 ? 'up' : 'down'}
                            trendValue={`${Math.abs(parseFloat(forecasting.trend))}%`}
                        />
                        <StatCard
                            title={language === 'TH' ? 'คาดการณ์รายปี' : 'Yearly Projection'}
                            value={`฿${forecasting.yearlyProjection.toLocaleString()}`}
                            icon={Brain}
                            color="#3b82f6"
                        />
                        <StatCard
                            title={language === 'TH' ? 'ความแม่นยำ' : 'Confidence'}
                            value={revenueAnalytics.monthly.length >= 6 ? 'สูง' : 'ปานกลาง'}
                            subtitle={revenueAnalytics.monthly.length >= 6 ? (language === 'TH' ? 'ข้อมูลเพียงพอ' : 'Sufficient data') : (language === 'TH' ? 'ต้องการข้อมูลเพิ่ม' : 'Need more data')}
                            icon={Target}
                            color={revenueAnalytics.monthly.length >= 6 ? '#10b981' : '#f59e0b'}
                        />
                    </div>

                    {/* Forecast Chart */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'การคาดการณ์รายได้ 3 เดือนข้างหน้า' : '3-Month Revenue Forecast'}</h3>
                        <div style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={[
                                    ...revenueAnalytics.monthly.slice(-3).map(m => ({
                                        month: m.month,
                                        actual: m.revenue,
                                        predicted: null,
                                        conservative: null,
                                        optimistic: null
                                    })),
                                    ...forecasting.forecast.map(f => ({
                                        month: f.month,
                                        actual: null,
                                        predicted: f.predicted,
                                        conservative: f.conservative,
                                        optimistic: f.optimistic
                                    }))
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <RechartsTooltip formatter={(value, name) => [
                                        value ? `฿${value.toLocaleString()}` : '-',
                                        name === 'actual' ? (language === 'TH' ? 'รายได้จริง' : 'Actual') :
                                        name === 'predicted' ? (language === 'TH' ? 'คาดการณ์' : 'Predicted') :
                                        name === 'conservative' ? (language === 'TH' ? 'ระดับต่ำ' : 'Conservative') :
                                        (language === 'TH' ? 'ระดับสูง' : 'Optimistic')
                                    ]} />
                                    <Legend />
                                    <Bar dataKey="actual" fill="#3b82f6" name={language === 'TH' ? 'รายได้จริง' : 'Actual'} radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" name={language === 'TH' ? 'คาดการณ์' : 'Predicted'} />
                                    <Line type="monotone" dataKey="conservative" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" name={language === 'TH' ? 'ระดับต่ำ' : 'Conservative'} />
                                    <Line type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" name={language === 'TH' ? 'ระดับสูง' : 'Optimistic'} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Forecast Table */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{language === 'TH' ? 'ตารางคาดการณ์' : 'Forecast Table'}</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{language === 'TH' ? 'เดือน' : 'Month'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ระดับต่ำ' : 'Conservative'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'คาดการณ์' : 'Predicted'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ระดับสูง' : 'Optimistic'}</th>
                                        <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ช่วงความเสี่ยง' : 'Risk Range'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecasting.forecast.map((f, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 500 }}>{f.month}</td>
                                            <td style={{ textAlign: 'right' }}>฿{f.conservative.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#8b5cf6' }}>฿{f.predicted.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>฿{f.optimistic.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>±{Math.round((f.optimistic - f.predicted) / f.predicted * 100)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdvancedAnalyticsDashboard;
