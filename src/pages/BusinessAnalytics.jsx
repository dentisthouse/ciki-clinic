import React, { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, Users, Calendar, Activity,
    BarChart3, PieChart, Target, Award, ArrowUpRight, ArrowDownRight,
    Filter, Download, RefreshCw, Layers, Zap, Clock, CreditCard,
    UserCheck, Star, Percent, Package, FileText, Brain
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

const BusinessAnalytics = () => {
    const { language } = useLanguage();
    const { patients, appointments, inventory } = useData();
    const [timeRange, setTimeRange] = useState('month');
    const [activeSection, setActiveSection] = useState('overview');

    // --- Computed Metrics ---
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const monthlyPatients = useMemo(() => {
        return (patients || []).filter(p => {
            const regDate = new Date(p.registrationDate || p.registration_date);
            return regDate.getMonth() === thisMonth && regDate.getFullYear() === thisYear;
        }).length;
    }, [patients, thisMonth, thisYear]);

    const totalRevenue = useMemo(() => {
        return (patients || []).reduce((sum, p) => sum + (p.totalBilled || p.total_billed || 0), 0);
    }, [patients]);

    const totalExpenses = 1250000; // Demo value - integrate when expenses module is ready

    const totalAppointments = (appointments || []).length;
    const completedAppointments = (appointments || []).filter(a => a.status === 'Completed').length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // --- Service Breakdown (Mock data for visualization) ---
    const serviceBreakdown = [
        { name: 'ขูดหินปูน', revenue: 185000, count: 142, growth: 12 },
        { name: 'อุดฟัน', revenue: 245000, count: 98, growth: 8 },
        { name: 'รักษารากฟัน', revenue: 520000, count: 34, growth: -3 },
        { name: 'ครอบฟัน', revenue: 680000, count: 28, growth: 15 },
        { name: 'รากฟันเทียม', revenue: 1200000, count: 12, growth: 22 },
        { name: 'จัดฟัน', revenue: 890000, count: 18, growth: 5 },
        { name: 'ฟอกสีฟัน', revenue: 95000, count: 45, growth: 18 },
        { name: 'ถอนฟัน', revenue: 120000, count: 67, growth: -2 },
    ];

    const maxRevenue = Math.max(...serviceBreakdown.map(s => s.revenue));

    // --- KPI Cards ---
    const kpis = [
        { label: 'รายได้รวม', value: `฿${(totalRevenue || 3850000).toLocaleString()}`, change: '+12.5%', trend: 'up', icon: DollarSign, color: '#0d9488', bg: '#f0fdfa' },
        { label: 'ค่าใช้จ่าย', value: `฿${(totalExpenses || 1250000).toLocaleString()}`, change: '+3.2%', trend: 'up', icon: CreditCard, color: '#ef4444', bg: '#fef2f2' },
        { label: 'กำไรสุทธิ', value: `฿${((totalRevenue - totalExpenses) || 2600000).toLocaleString()}`, change: '+18.3%', trend: 'up', icon: TrendingUp, color: '#22c55e', bg: '#f0fdf4' },
        { label: 'คนไข้ใหม่/เดือน', value: monthlyPatients || 47, change: '+8', trend: 'up', icon: Users, color: '#6366f1', bg: '#eef2ff' },
        { label: 'นัดหมายทั้งหมด', value: totalAppointments || 312, change: `${completionRate}% สำเร็จ`, trend: 'neutral', icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'อัตราการกลับมา', value: '73%', change: '+5%', trend: 'up', icon: UserCheck, color: '#ec4899', bg: '#fdf2f8' },
    ];

    // --- Sections Navigation ---
    const sections = [
        { id: 'overview', label: '📊 ภาพรวม', labelEN: 'Overview' },
        { id: 'revenue', label: '💰 รายได้', labelEN: 'Revenue' },
        { id: 'services', label: '🦷 วิเคราะห์บริการ', labelEN: 'Services' },
        { id: 'patients', label: '👥 ลูกค้า', labelEN: 'Patients' },
        { id: 'team', label: '👨‍⚕️ ทีมงาน', labelEN: 'Team' },
        { id: 'forecast', label: '🔮 คาดการณ์', labelEN: 'Forecast' },
    ];

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #0d9488, #14b8a6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(13, 148, 136, 0.2)' }}>
                            <Brain size={22} />
                        </div>
                        {language === 'TH' ? 'วิเคราะห์ธุรกิจ' : 'Business Analytics'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        {language === 'TH' ? 'เปลี่ยนข้อมูลหลังบ้านให้เป็นภาพรวมผลการดำเนินงานที่ชัดเจน' : 'Transform backend data into actionable business insights'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Time Range */}
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--neutral-50)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--neutral-100)' }}>
                        {[
                            { id: 'week', label: 'สัปดาห์' },
                            { id: 'month', label: 'เดือน' },
                            { id: 'quarter', label: 'ไตรมาส' },
                            { id: 'year', label: 'ปี' },
                        ].map(t => (
                            <button key={t.id} onClick={() => setTimeRange(t.id)} style={{
                                padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s',
                                background: timeRange === t.id ? 'white' : 'transparent',
                                color: timeRange === t.id ? 'var(--primary-700)' : 'var(--neutral-500)',
                                boxShadow: timeRange === t.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                            }}>{t.label}</button>
                        ))}
                    </div>
                    <button style={{
                        padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid var(--neutral-200)',
                        background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontWeight: 700, fontSize: '0.85rem', color: 'var(--neutral-700)'
                    }}>
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Section Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {sections.map(sec => (
                    <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                        padding: '0.7rem 1.25rem', borderRadius: '12px', border: '1.5px solid',
                        borderColor: activeSection === sec.id ? 'var(--primary-500)' : 'var(--neutral-200)',
                        background: activeSection === sec.id ? 'var(--primary-50)' : 'white',
                        color: activeSection === sec.id ? 'var(--primary-700)' : 'var(--neutral-600)',
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                        {language === 'TH' ? sec.label : sec.labelEN}
                    </button>
                ))}
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {kpis.map((kpi, i) => (
                    <div key={i} className="card" style={{
                        padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: `${kpi.color}08`, borderRadius: '0 0 0 100%' }} />
                        <div style={{ width: 48, height: 48, borderRadius: '14px', background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <kpi.icon size={22} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.25rem' }}>{kpi.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neutral-800)', marginBottom: '0.25rem' }}>{kpi.value}</div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700,
                                color: kpi.trend === 'up' ? '#22c55e' : kpi.trend === 'down' ? '#ef4444' : 'var(--neutral-500)'
                            }}>
                                {kpi.trend === 'up' && <ArrowUpRight size={14} />}
                                {kpi.trend === 'down' && <ArrowDownRight size={14} />}
                                {kpi.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Revenue Chart (Visual Bar Chart) */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>📊 สรุปรายได้-ค่าใช้จ่าย</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'].map((month, i) => {
                            const revenue = [320, 380, 410, 350, 450, 420][i] * 1000;
                            const expense = [180, 200, 190, 210, 220, 195][i] * 1000;
                            const maxVal = 500000;
                            return (
                                <div key={month}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                                        <span>{month}</span>
                                        <span style={{ color: '#22c55e' }}>฿{(revenue / 1000).toFixed(0)}K</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem', height: '20px' }}>
                                        <div style={{ width: `${(revenue / maxVal) * 100}%`, background: 'linear-gradient(90deg, #0d9488, #14b8a6)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                        <div style={{ width: `${(expense / maxVal) * 100}%`, background: 'linear-gradient(90deg, #f87171, #fca5a5)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, background: '#0d9488', borderRadius: '3px' }} /> รายได้</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, background: '#f87171', borderRadius: '3px' }} /> ค่าใช้จ่าย</div>
                    </div>
                </div>

                {/* Service Ranking */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>🦷 วิเคราะห์บริการ Top Performers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {serviceBreakdown.sort((a, b) => b.revenue - a.revenue).slice(0, 6).map((service, i) => (
                            <div key={service.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 900,
                                    background: i < 3 ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'var(--neutral-100)',
                                    color: i < 3 ? 'white' : 'var(--neutral-500)'
                                }}>{i + 1}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{service.name}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--neutral-700)' }}>฿{(service.revenue / 1000).toFixed(0)}K</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--neutral-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '3px',
                                            width: `${(service.revenue / maxRevenue) * 100}%`,
                                            background: i < 3 ? 'linear-gradient(90deg, #0d9488, #14b8a6)' : 'var(--neutral-300)',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--neutral-500)' }}>
                                        <span>{service.count} ครั้ง</span>
                                        <span style={{ color: service.growth >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                                            {service.growth >= 0 ? '↑' : '↓'} {Math.abs(service.growth)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team Performance */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>👨‍⚕️ ผลงานทีมแพทย์</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { name: 'หมอบิ๊ก', role: 'ทันตแพทย์', patients: 85, revenue: 890000, rating: 4.9, avatar: '👨‍⚕️' },
                            { name: 'หมออ้อม', role: 'ทันตแพทย์จัดฟัน', patients: 45, revenue: 720000, rating: 4.8, avatar: '👩‍⚕️' },
                            { name: 'หมอเปิ้ล', role: 'ทันตแพทย์', patients: 62, revenue: 540000, rating: 4.7, avatar: '👩‍⚕️' },
                        ].map(doc => (
                            <div key={doc.name} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', background: 'var(--neutral-50)', borderRadius: '12px'
                            }}>
                                <div style={{ fontSize: '2rem' }}>{doc.avatar}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{doc.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{doc.role}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-600)' }}>฿{(doc.revenue / 1000).toFixed(0)}K</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)' }}>{doc.patients} คนไข้</div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    padding: '0.3rem 0.6rem', background: '#fffbeb', borderRadius: '8px'
                                }}>
                                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#d97706' }}>{doc.rating}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Profit & Cost Analysis */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>💰 วิเคราะห์กำไรและต้นทุน</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { label: 'ค่าวัสดุทำฟัน', amount: 320000, percent: 25.6, color: '#ef4444' },
                            { label: 'ค่าแรงพนักงาน', amount: 480000, percent: 38.4, color: '#f59e0b' },
                            { label: 'ค่าเช่า/สาธารณูปโภค', amount: 150000, percent: 12.0, color: '#3b82f6' },
                            { label: 'ค่าอุปกรณ์ทางการแพทย์', amount: 180000, percent: 14.4, color: '#8b5cf6' },
                            { label: 'ค่าการตลาด', amount: 65000, percent: 5.2, color: '#ec4899' },
                            { label: 'อื่นๆ', amount: 55000, percent: 4.4, color: '#64748b' },
                        ].map(item => (
                            <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    <span>{item.label}</span>
                                    <span style={{ color: 'var(--neutral-700)' }}>฿{(item.amount / 1000).toFixed(0)}K ({item.percent}%)</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--neutral-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: '4px', width: `${item.percent * 2.5}%`, background: item.color, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f0fdf4', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d' }}>กำไรสุทธิ (Net Profit)</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d' }}>฿2,600,000</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessAnalytics;
