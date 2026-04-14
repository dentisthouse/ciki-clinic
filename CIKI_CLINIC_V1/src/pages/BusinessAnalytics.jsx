import React, { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, Users, Calendar, Activity,
    BarChart3, PieChart, Target, Award, ArrowUpRight, ArrowDownRight,
    Filter, Download, RefreshCw, Layers, Zap, Clock, CreditCard,
    UserCheck, Star, Percent, Package, FileText, Brain, Printer, ChevronLeft
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, BarChart, Bar, LineChart, Line, ComposedChart,
    PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

const MetricCard = ({ title, value, sub, type = 'text', percent = 0, fraction = '' }) => (
    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '1rem' }}>{title}</div>
        {type === 'gauge' ? (
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#f59e0b' }}>
                    {percent.toFixed(1)}%
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie data={[{ value: percent }, { value: 100 - percent }]} innerRadius={35} outerRadius={45} startAngle={90} endAngle={450} dataKey="value" stroke="none">
                            <Cell fill="#f59e0b" />
                            <Cell fill="#f1f5f9" />
                        </Pie>
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3b82f6', marginBottom: '0.5rem' }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
        )}
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            {fraction || sub}
        </div>
    </div>
);

const BusinessAnalytics = () => {
    const { language } = useLanguage();
    const { patients, appointments, invoices, staff } = useData();
    const [selectedMonth, setSelectedMonth] = useState('เมษายน');
    const [selectedYear, setSelectedYear] = useState('2026');

    // --- Real-time Data Analytics Engine ---
    const stats = useMemo(() => {
        const totalRev = (invoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const invCount = (invoices || []).length;
        const avgRev = invCount > 0 ? totalRev / invCount : 0;
        
        const totalAppts = (appointments || []).length;
        const completedAppts = (appointments || []).filter(a => ['Completed', 'completed', 'ชำระเงินแล้ว'].includes(a.status)).length;
        const noshowAppts = (appointments || []).filter(a => ['Cancelled', 'cancelled', 'No Show', 'no-show'].includes(a.status)).length;
        
        const showRate = totalAppts > 0 ? (completedAppts / totalAppts) * 100 : 0;
        const noshowRate = totalAppts > 0 ? (noshowAppts / totalAppts) * 100 : 0;
        
        const newPatientsCount = (patients || []).length;
        const patientAppointments = {};
        (appointments || []).forEach(a => {
            patientAppointments[a.patientId] = (patientAppointments[a.patientId] || 0) + 1;
        });
        
        const totalPatientsSeen = Object.keys(patientAppointments).length;
        const returningPatientsCount = Object.values(patientAppointments).filter(count => count > 1).length;
        const returningRate = totalPatientsSeen > 0 ? (returningPatientsCount / totalPatientsSeen) * 100 : 0;
        
        return {
            totalRev,
            invCount,
            avgRev,
            totalAppts,
            completedAppts,
            noshowAppts,
            showRate,
            noshowRate,
            newPatientsCount,
            totalPatientsSeen,
            returningPatientsCount,
            returningRate
        };
    }, [invoices, appointments, patients]);

    const getMonthSeries = (data, dateField, valueField = null) => {
        const months = language === 'TH' 
            ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const result = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const name = months[m] + ' ' + (y + (language === 'TH' ? 543 : 0)).toString().slice(-2);
            
            const filtered = (data || []).filter(item => {
                const itemDate = new Date(item[dateField] || item.createdAt || Date.now());
                return itemDate.getMonth() === m && itemDate.getFullYear() === y;
            });

            const value = valueField 
                ? filtered.reduce((sum, item) => sum + (Number(item[valueField]) || 0), 0)
                : filtered.length;

            result.push({ name, revenue: value, new: filtered.length, total: filtered.length, rate: filtered.length > 0 ? (filtered.filter(a => a.status === 'Completed').length / filtered.length) * 100 : 0 });
        }
        return result;
    };

    const chartData6Months = useMemo(() => getMonthSeries(invoices, 'date', 'amount'), [invoices, language]);
    const apptTrendData = useMemo(() => getMonthSeries(appointments, 'date'), [appointments, language]);
    const newPatientData = useMemo(() => getMonthSeries(patients, 'createdAt'), [patients, language]);

    const topServices = useMemo(() => {
        const services = {};
        (invoices || []).forEach(inv => {
            const items = inv.items || [];
            items.forEach(item => {
                const name = item.name || item.description || 'Other';
                services[name] = (services[name] || 0) + (item.total || item.amount || 0);
            });
        });
        const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        return Object.entries(services)
            .map(([name, revenue], idx) => ({ name, revenue, color: colors[idx % colors.length] }))
            .sort((a,b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [invoices]);

    return (
        <div style={{ padding: '2rem', background: '#f4f7fb', minHeight: '100vh' }}>
            {/* KPI Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn" style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity color="#3b82f6" /> KPI คลินิก
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>วันพฤหัสบดีที่ 9 เม.ย. 2569</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#eef2ff', padding: '0.25rem', borderRadius: '10px' }}>
                        <button style={{ padding: '0.5rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, color: '#4f46e5' }}>{selectedMonth}</button>
                    </div>
                    <div style={{ display: 'flex', background: '#eef2ff', padding: '0.25rem', borderRadius: '10px' }}>
                        <button style={{ padding: '0.5rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, color: '#4f46e5' }}>ปี {selectedYear}</button>
                    </div>
                    <button className="btn" style={{ background: 'white', border: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Printer size={16} /> พิมพ์
                    </button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <MetricCard title="รายได้เดือนนี้" value={stats.totalRev} sub={`${stats.invCount} ใบเสร็จ`} />
                <MetricCard title="อัตราสำเร็จนัดพบมา" type="gauge" percent={stats.showRate} fraction={`${stats.completedAppts}/${stats.totalAppts} ครั้ง`} />
                <MetricCard title="อัตราไม่มาตามนัด" type="gauge" percent={stats.noshowRate} fraction={`${stats.noshowAppts} จาก ${stats.totalAppts} ครั้ง`} />
                <MetricCard title="อัตราผู้กลับมาใช้บริการ" type="gauge" percent={stats.returningRate} fraction={`ใหม่ ${stats.newPatientsCount} | กลับมา ${stats.returningPatientsCount}`} />
            </div>

            {/* Middle Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <MetricCard title="ยอดเฉลี่ยต่อใบเสร็จ" value={stats.avgRev.toFixed(0)} sub={`${stats.invCount} ใบเสร็จ`} />
                <MetricCard title="ผู้รับบริการเฉพาะราย" value={stats.totalPatientsSeen} sub={`ใหม่ ${stats.newPatientsCount} ราย`} />
                <MetricCard title="นัดหมายทั้งหมด" value={stats.totalAppts} sub={`สำเร็จ ${stats.completedAppts} | ไม่มา ${stats.noshowAppts}`} />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} color="#3b82f6" /> แนวโน้มรายได้ (6 เดือน)
                    </h3>
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData6Months}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" />
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#10b981" /> นัดหมาย & อัตราสำเร็จ
                    </h3>
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={apptTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} color="#8b5cf6" /> ผู้รับบริการใหม่ (6 เดือน)
                    </h3>
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={newPatientData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="new" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} color="#3b82f6" /> ผลงานทันตแพทย์ — เมษายน 2026
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                <th style={{ padding: '12px', fontSize: '0.75rem', color: '#64748b' }}>ทันตแพทย์</th>
                                <th style={{ padding: '12px', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>เคส</th>
                                <th style={{ padding: '12px', fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>รายได้</th>
                                <th style={{ padding: '12px', fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>เฉลี่ย/เคส</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(staff || []).filter(s => s.role === 'Doctor' || s.role === 'Dentist').map((doc, idx) => {
                                const docApts = (appointments || []).filter(a => a.dentist === doc.name);
                                const docRevenue = (invoices || []).filter(inv => inv.doctorName === doc.name).reduce((sum, i) => sum + (i.amount || 0), 0);
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700 }}>{doc.name}</td>
                                        <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                                            <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                {docApts.length}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 700 }}>{docRevenue.toLocaleString()}</td>
                                        <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', color: '#64748b' }}>
                                            {docApts.length > 0 ? (docRevenue / docApts.length).toFixed(0) : '0'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="#f59e0b" /> บริการยอดนิยม 5 อันดับ
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {topServices.map((service, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                    <div style={{ 
                                        width: '24px', height: '24px', borderRadius: '50%', background: service.color, color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                        {service.name}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6' }}>
                                    {service.revenue.toLocaleString()} ฿
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessAnalytics;
