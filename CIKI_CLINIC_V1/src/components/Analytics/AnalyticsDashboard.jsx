import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Calendar, DollarSign, TrendingUp, Users, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticsDashboard = () => {
    const { invoices, appointments } = useData();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 1y

    // --- 1. Revenue Analysis ---
    const revenueData = useMemo(() => {
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
        const today = new Date();
        let startDate = subDays(today, 7);

        if (timeRange === '30d') startDate = subDays(today, 30);
        if (timeRange === '1y') startDate = subDays(today, 365);

        // Generate all dates in range
        const days = eachDayOfInterval({ start: startDate, end: today });

        return days.map(day => {
            const dayRevenue = paidInvoices
                .filter(inv => isSameDay(new Date(inv.date), day))
                .reduce((sum, inv) => sum + inv.amount, 0);

            return {
                date: format(day, 'dd MMM'),
                revenue: dayRevenue
            };
        });
    }, [invoices, timeRange]);

    const totalRevenueInRange = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);

    // --- 2. Procedure Breakdown ---
    const procedureData = useMemo(() => {
        const counts = {};
        appointments.forEach(apt => {
            const proc = apt.procedure || 'General';
            counts[proc] = (counts[proc] || 0) + 1;
        });

        return Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5
    }, [appointments]);

    // --- 3. Doctor Performance ---
    const doctorPerformance = useMemo(() => {
        const stats = {};
        appointments.forEach(apt => {
            const doc = apt.doctor || 'Unassigned';
            if (!stats[doc]) stats[doc] = { name: doc, patients: 0, revenue: 0 };
            stats[doc].patients += 1;
            // Mock revenue estimation per doctor if not directly linked
            stats[doc].revenue += 1500;
        });
        return Object.values(stats).sort((a, b) => b.patients - a.patients);
    }, [appointments]);

    // --- 4. Peak Hours ---
    const peakHoursData = useMemo(() => {
        const hours = {};
        appointments.forEach(apt => {
            const hour = apt.time.split(':')[0]; // "09:30" -> "09"
            hours[hour] = (hours[hour] || 0) + 1;
        });

        return Object.keys(hours).map(h => ({
            hour: `${h}:00`,
            count: hours[h]
        })).sort((a, b) => a.hour.localeCompare(b.hour));
    }, [appointments]);

    return (
        <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{language === 'TH' ? 'รายงานและวิเคราะห์ผล' : 'Analytics & Reports'}</h1>
                        <p style={{ color: 'var(--neutral-500)' }}>Mock Data Analysis based on current records</p>
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
                            {range === '1y' ? 'Yearly' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-500)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Total Revenue ({timeRange})</p>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.5rem 0' }}>฿{totalRevenueInRange.toLocaleString()}</h2>
                        </div>
                        <div style={{ padding: '0.5rem', background: 'var(--primary-100)', borderRadius: '8px', color: 'var(--primary-600)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Total Patients Seen</p>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.5rem 0' }}>{appointments.length}</h2>
                        </div>
                        <div style={{ padding: '0.5rem', background: '#d1fae5', borderRadius: '8px', color: '#059669' }}>
                            <Users size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* 1. Revenue Trends */}
                <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <TrendingUp className="icon-primary" />
                        <h3>{language === 'TH' ? 'แนวโน้มรายได้' : 'Revenue Trend'}</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Procedure Breakdown (Pie) */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <PieChartIcon className="icon-primary" size={24} />
                        <h3>{language === 'TH' ? 'สัดส่วนการรักษา' : 'Treatments by Type'}</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={procedureData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {procedureData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Peak Hours (Bar) */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Clock className="icon-primary" size={24} />
                        <h3>{language === 'TH' ? 'ช่วงเวลาหนาแน่น' : 'Peak Hours'}</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakHoursData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Top Doctors */}
                <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Users className="icon-primary" />
                        <h3>{language === 'TH' ? 'ประสิทธิภาพทันตแพทย์' : 'Doctor Performance'}</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Doctor Name</th>
                                    <th>Total Patients</th>
                                    <th style={{ textAlign: 'right' }}>Est. Revenue</th>
                                    <th>Efficiency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctorPerformance.map((doc, index) => (
                                    <tr key={index}>
                                        <td>
                                            <span className="badge" style={{ background: index === 0 ? '#fef3c7' : 'var(--neutral-100)', color: index === 0 ? '#d97706' : 'var(--neutral-600)' }}>
                                                #{index + 1}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{doc.name}</td>
                                        <td>{doc.patients} cases</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>฿{doc.revenue.toLocaleString()}</td>
                                        <td>
                                            <div style={{ width: '100px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(100, (doc.patients / 10) * 100)}%`, height: '100%', background: 'var(--primary-500)' }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Icons helper
const PieChartIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
);

// Import helper for area chart
import { AreaChart, Area } from 'recharts';

export default AnalyticsDashboard;
