import React, { useState } from 'react';
import { 
    FileText, DollarSign, Users, Activity, Box, TrendingUp, Calendar, Download, Search, 
    ChevronRight, PieChart as PieChartIcon, BarChart3, Settings, ChevronLeft, Printer, Zap, TrendingDown,
    UserCheck, CreditCard, Clock, Star, Percent, Package, Brain
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, BarChart, Bar, LineChart, Line, ComposedChart,
    PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

import BusinessAnalytics from './BusinessAnalytics';
import AdvancedReports from './AdvancedReports';

const MetricCard = ({ title, value, sub, type = 'text', percent = 0, fraction = '', color = 'var(--primary-600)', prefix = '' }) => (
    <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>{title}</div>
        {type === 'gauge' ? (
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#f59e0b' }}>
                    {percent.toFixed(0)}%
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie data={[{ value: percent }, { value: 100 - percent }]} innerRadius={28} outerRadius={36} startAngle={90} endAngle={450} dataKey="value" stroke="none">
                            <Cell fill="#f59e0b" />
                            <Cell fill="#f1f5f9" />
                        </Pie>
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: color, marginBottom: '0.25rem' }}>
                {typeof value === 'number' ? `${prefix}${value.toLocaleString()}` : value}
            </div>
        )}
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>
            {fraction || sub}
        </div>
    </div>
);

const PremiumReportView = ({ title, metrics = [], charts = [], tableData = [], tableCols = [], emptyTrends, language, selectedRange, onRangeChange, moneyCols = [2, 3] }) => (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 44, height: 44, background: 'var(--primary-100)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>KPI {title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date().toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' })}</span>
                        <span style={{ fontSize: '0.65rem', color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>LIVE</span>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={() => onRangeChange('daily')}
                    className={`btn ${selectedRange === 'daily' ? 'active' : ''}`} 
                    style={{ background: selectedRange === 'daily' ? 'var(--primary-600)' : 'white', border: '1px solid #e2e8f0', color: selectedRange === 'daily' ? 'white' : '#64748b', fontSize: '0.75rem', padding: '8px 14px', borderRadius: '10px', fontWeight: 600 }}
                >
                    รายวัน
                </button>
                <button 
                    onClick={() => onRangeChange('weekly')}
                    className={`btn ${selectedRange === 'weekly' ? 'active' : ''}`} 
                    style={{ background: selectedRange === 'weekly' ? 'var(--primary-600)' : 'white', border: '1px solid #e2e8f0', color: selectedRange === 'weekly' ? 'white' : '#64748b', fontSize: '0.75rem', padding: '8px 14px', borderRadius: '10px', fontWeight: 600 }}
                >
                    รายสัปดาห์
                </button>
                <button 
                    onClick={() => onRangeChange('monthly')}
                    className={`btn ${selectedRange === 'monthly' ? 'active' : ''}`} 
                    style={{ background: selectedRange === 'monthly' ? 'var(--primary-600)' : 'white', border: '1px solid #e2e8f0', color: selectedRange === 'monthly' ? 'white' : '#64748b', fontSize: '0.75rem', padding: '8px 14px', borderRadius: '10px', fontWeight: 600 }}
                >
                    รายเดือน
                </button>
                <button 
                    onClick={() => onRangeChange('yearly')}
                    className={`btn ${selectedRange === 'yearly' ? 'active' : ''}`} 
                    style={{ background: selectedRange === 'yearly' ? 'var(--primary-600)' : 'white', border: '1px solid #e2e8f0', color: selectedRange === 'yearly' ? 'white' : '#64748b', fontSize: '0.75rem', padding: '8px 14px', borderRadius: '10px', fontWeight: 600 }}
                >
                    รายปี
                </button>
                <button className="btn" style={{ background: 'var(--neutral-900)', color: 'white', border: 'none', fontSize: '0.75rem', padding: '8px 16px', borderRadius: '10px', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 600 }}>
                    <Printer size={14} /> พิมพ์รายงาน
                </button>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {metrics.slice(0, 4).map((m, i) => <MetricCard key={i} {...m} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {metrics.slice(4, 7).map((m, i) => <MetricCard key={i} {...m} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {charts.map((chart, i) => (
                <div key={i} className="card" style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                        <div style={{ width: 28, height: 28, background: 'var(--primary-50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                            {chart.icon && <chart.icon size={14} />}
                        </div>
                        {chart.title}
                    </h3>
                    <div style={{ height: '210px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            {chart.type === 'area' ? (
                                <AreaChart data={chart.data && chart.data.length > 0 ? chart.data : emptyTrends}>
                                    <defs>
                                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chart.color || "var(--primary-500)"} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={chart.color || "var(--primary-500)"} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="value" stroke={chart.color || "var(--primary-600)"} strokeWidth={3} fillOpacity={1} fill={`url(#grad-${i})`} />
                                </AreaChart>
                            ) : chart.type === 'composed' ? (
                                <ComposedChart data={chart.data && chart.data.length > 0 ? chart.data : emptyTrends}>
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={16} />
                                    <Line type="monotone" dataKey="rate" stroke="var(--primary-600)" strokeWidth={3} dot={{ r: 4, fill: 'white', strokeWidth: 2 }} />
                                </ComposedChart>
                            ) : (
                                <BarChart data={chart.data && chart.data.length > 0 ? chart.data : emptyTrends}>
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="value" fill={chart.color || "#8b5cf6"} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            ))}
        </div>

        <div className="card" style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>ตารางสรุปข้อมูลรายละเอียด</h3>
                <button style={{ color: 'var(--primary-600)', fontSize: '0.75rem', fontWeight: 700, background: 'var(--primary-50)', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>ส่งออก CSV</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left' }}>
                            {tableCols.map((c, i) => (
                                <th key={i} style={{ padding: '0 12px 8px 12px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.length > 0 ? tableData.map((row, i) => (
                            <tr key={i} style={{ background: '#f8fafc' }}>
                                {Object.values(row).map((val, ci) => (
                                    <td key={ci} style={{ 
                                        padding: '12px', fontSize: '0.8rem', fontWeight: ci === 0 ? 800 : 500, 
                                        color: ci === 0 ? '#1e293b' : '#64748b',
                                        borderRadius: ci === 0 ? '12px 0 0 12px' : ci === Object.values(row).length - 1 ? '0 12px 12px 0' : '0'
                                    }}>
                                        {typeof val === 'number' && moneyCols.includes(ci) ? `฿${val.toLocaleString()}` : val}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr><td colSpan={tableCols.length} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>ไม่พบข้อมูลในช่วงเวลานี้</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const ReportsHub = () => {
    const { language } = useLanguage();
    const { invoices, appointments, patients, expenses, staff, inventory: inventoryData } = useData();
    const [activeSection, setActiveSection] = useState('financial');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeRange, setTimeRange] = useState('monthly');
    const monthNames = language === 'TH' 
        ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getMonthData = (data, dateField, valueField = null) => {
        const result = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const name = monthNames[m];
            
            const filtered = (data || []).filter(item => {
                const dateVal = item[dateField] || item.date || item.createdAt || item.timestamp;
                if (!dateVal) return false;
                const itemDate = new Date(dateVal);
                return itemDate.getMonth() === m && itemDate.getFullYear() === y;
            });

            const value = valueField 
                ? filtered.reduce((sum, item) => {
                    const val = Number(item[valueField]) || Number(item.amount) || Number(item.total) || 0;
                    return sum + val;
                  }, 0)
                : filtered.length;

            result.push({ name, value });
        }
        return result;
    };

    const reportCategories = [
        { id: 'financial', icon: DollarSign, label: language === 'TH' ? 'รายงานการเงิน' : 'Financial Reports' },
        { id: 'clinical', icon: Activity, label: language === 'TH' ? 'รายงานแพทย์และหัตถการ' : 'Clinical Reports' },
        { id: 'patients', icon: Users, label: language === 'TH' ? 'รายงานคนไข้' : 'Patient Reports' },
        { id: 'inventory', icon: Box, label: language === 'TH' ? 'รายงานคลังสินค้า' : 'Inventory Reports' },
        { id: 'appointments', icon: Calendar, label: language === 'TH' ? 'รายงานการนัดหมาย' : 'Appointment Reports' },

        { id: 'business-analytics', icon: TrendingUp, label: language === 'TH' ? 'วิเคราะห์ธุรกิจ' : 'Business Analytics' },
        { id: 'demographics', icon: Users, label: language === 'TH' ? 'ข้อมูลประชากร' : 'Demographics' },

    ];

    // --- Data Aggregation filter based on timeRange ---
    const filterByRange = (data, dateField = 'date') => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return (data || []).filter(item => {
            const dateVal = item[dateField] || item.date || item.createdAt || item.timestamp;
            if (!dateVal) return false;
            const itemDate = new Date(dateVal);
            itemDate.setHours(0, 0, 0, 0);

            if (timeRange === 'daily') {
                return itemDate.getTime() === today.getTime();
            } else if (timeRange === 'weekly') {
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return itemDate >= weekAgo;
            } else if (timeRange === 'monthly') {
                return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            } else if (timeRange === 'yearly') {
                return itemDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    };

    const filteredInvoices = filterByRange(invoices);
    const filteredAppointments = filterByRange(appointments);
    const filteredPatients = filterByRange(patients, 'createdAt');
    const filteredExpenses = filterByRange(expenses);

    const totalRev = filteredInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPendingAmount = filteredInvoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPendingInvoices = filteredInvoices.filter(inv => inv.status !== 'Paid').length;
    const invCount = filteredInvoices.length;
    const totalAppts = filteredAppointments.length;
    const compAppts = filteredAppointments.filter(a => a.status === 'Completed').length;
    const showRate = totalAppts > 0 ? (compAppts / totalAppts) * 100 : 0;



    // Charts adaptation based on range
    const getChartData = () => {
        if (timeRange === 'daily') {
            // Last 24 hours mapping (hourly segments or just today/yesterday)
            return [
                { name: language === 'TH' ? 'เมื่อวาน' : 'Yesterday', value: 0 },
                { name: language === 'TH' ? 'วันนี้' : 'Today', value: totalRev }
            ];
        }
        return getMonthData(invoices, 'date', 'amount');
    };

    const revenueTrends = getChartData();
    const appointmentTrends = getMonthData(filteredAppointments, 'date');
    const newPatientTrends = getMonthData(filteredPatients, 'createdAt');
    const expenseTrends = getMonthData(filteredExpenses, 'date', 'amount');


    // Fallback data if no trends exist
    const emptyTrends = monthNames.slice(0, 6).map(m => ({ name: m, value: 0 }));

    // Payment method distribution
    const paymentMethodData = (invoices || []).reduce((acc, inv) => {
        const m = inv.paymentMethod || 'Other';
        const found = acc.find(x => x.name === m);
        if (found) {
            found.total += inv.amount || 0;
            found.value += 1;
        } else {
            acc.push({ name: m, total: inv.amount || 0, value: 1, rate: 0 });
        }
        return acc;
    }, []).map(item => ({
        ...item,
        rate: totalRev > 0 ? (item.total / totalRev) * 100 : 0
    })).sort((a,b) => b.total - a.total);

    // Service Popularity
    const servicePopularity = (() => {
        const services = {};
        (appointments || []).forEach(apt => {
            const s = apt.procedure || apt.treatment || 'General';
            services[s] = (services[s] || 0) + 1;
        });
        return Object.entries(services)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 6);
    })();

    // Asset Value for Inventory
    const inventoryAssetValue = (inventoryData || []).reduce((sum, item) => sum + ((item.stock || 0) * (item.price || 0)), 0);
    const lowStockItems = (inventoryData || []).filter(item => (item.stock || 0) <= (item.reorderPoint || 5));

    const renderContent = () => {
        const doctors = (staff || []).filter(s => s.role?.toLowerCase() === 'dentist' || s.role?.toLowerCase() === 'doctor');
        
        switch(activeSection) {
            case 'financial':
                const paidRev = (invoices || []).filter(inv => inv.status === 'Paid').reduce((sum, i) => sum + (i.amount || 0), 0);
                const payRate = invCount > 0 ? (paidRev / (totalRev || 1)) * 100 : 100;

                return (
                    <PremiumReportView 
                        title="รายงานการเงิน"
                        emptyTrends={emptyTrends}
                        language={language}
                        selectedRange={timeRange}
                        onRangeChange={setTimeRange}
                        metrics={[
                            { title: 'รายได้สะสมรวม', value: paidRev, prefix: '฿', sub: `${(invoices || []).filter(inv => inv.status === 'Paid').length} เคสสำเร็จ`, color: 'var(--primary-600)' },
                            { title: 'ความสำเร็จชำระ', type: 'gauge', percent: payRate, fraction: `สำเร็จ ${payRate.toFixed(1)}%` },
                            { title: 'ยอดค้างชำระหือรอเคลม', value: totalPendingAmount, prefix: '฿', sub: `${totalPendingInvoices} รายการ`, color: '#ef4444' },
                            { title: 'เฉลี่ยต่อเคส', value: (invCount > 0 ? paidRev / invCount : 0), prefix: '฿', sub: 'ต่อใบเสร็จ' },
                            { title: 'กำไรขั้นต้น (Est.)', value: (paidRev * 0.6), prefix: '฿', sub: 'Gross Margin 60%', color: '#10b981' },
                            { title: 'ค่าใช้จ่ายแพทย์สะสม', value: (paidRev * 0.35), prefix: '฿', sub: 'DF Est. Total' },
                            { title: 'รายงานรายจ่าย', value: (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0), prefix: '฿', sub: 'OPEX', color: '#f59e0b' }
                        ]}
                        charts={[
                            { title: 'เทรนด์รายได้สะสม', type: 'area', data: revenueTrends, icon: DollarSign, color: 'var(--primary-500)' },
                            { title: 'แยกตามช่องทาง', type: 'composed', data: paymentMethodData, icon: CreditCard },
                            { title: 'เทรนด์รายจ่าย', type: 'bar', data: expenseTrends, color: '#f87171', icon: TrendingDown }
                        ]}
                        tableCols={['วันที่', 'ประเภท', 'รายการ', 'ยอดเงิน']}
                        tableData={(invoices || []).slice(0, 10).map(i => ({ d: i.date, t: i.treatmentType, n: i.items?.map(it => it.name).join(', ') || 'Treatment', a: i.amount }))}
                        moneyCols={[3]}
                    />
                );
            case 'clinical':
                return (
                    <PremiumReportView 
                        title="รายงานคลินิก"
                        emptyTrends={emptyTrends}
                        language={language}
                        selectedRange={timeRange}
                        onRangeChange={setTimeRange}
                        metrics={[
                            { title: 'เคสสำเร็จรวม', value: compAppts, sub: 'หัตถการเสร็จสิ้น', color: 'var(--primary-600)' },
                            { title: 'Show-up Rate', type: 'gauge', percent: showRate, fraction: `${showRate.toFixed(1)}%` },
                            { title: 'เคสกำลังดำเนินการ', value: (appointments || []).filter(a => a.status === 'Confirmed').length, sub: 'Confirmed Case', color: '#f59e0b' },
                            { title: 'ปริมาณงานแพทย์', value: compAppts, sub: 'รวมทุกท่าน' },
                            { title: 'Load เฉลี่ย', value: doctors.length > 0 ? (compAppts / doctors.length).toFixed(1) : compAppts, sub: 'เคส/ท่าน' },
                            { title: 'หัตถการยอดนิยม', value: servicePopularity[0]?.name || '-', sub: `Done ${servicePopularity[0]?.value || 0} times` },
                            { title: 'Doctor Count', value: doctors.length, sub: 'Active Dentists', color: '#10b981' }
                        ]}
                        charts={[
                            { title: 'ปริมาณเคสรายเดือน', type: 'bar', data: appointmentTrends, icon: Activity, color: 'var(--primary-500)' },
                            { title: 'ความนิยมหัตถการ', type: 'bar', data: servicePopularity, color: '#10b981', icon: Clock },
                            { title: 'เทรนด์หัตถการรายเดือน', type: 'area', data: appointmentTrends, color: '#f59e0b', icon: TrendingUp }
                        ]}
                        tableCols={['แพทย์/เจ้าหน้าที่', 'เคสที่ดูแล', 'รายรับรวม', 'DF (Est.)']}
                        tableData={doctors.map(d => {
                             const dAppts = (appointments || []).filter(a => a.dentist === d.name && a.status === 'Completed').length;
                             const dRev = (invoices || []).filter(i => i.doctorName === d.name && i.status === 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
                             return { n: d.name, c: dAppts, r: dRev, df: dRev * ((d.commissionRate || 50) / 100) };
                        })}
                        moneyCols={[2, 3]}
                    />
                );
            case 'patients':
                const today = new Date().toISOString().split('T')[0];
                const newToday = (patients || []).filter(p => (p.createdAt || p.dateRegister)?.startsWith(today)).length;
                return (
                    <PremiumReportView 
                        title="รายงานคนไข้"
                        emptyTrends={emptyTrends}
                        language={language}
                        selectedRange={timeRange}
                        onRangeChange={setTimeRange}
                        metrics={[
                            { title: 'คนไข้ใหม่วันนี้', value: newToday, sub: 'REGISTER TODAY', color: 'var(--primary-600)' },
                            { title: 'สัดส่วนคนไข้ใหม่', type: 'gauge', percent: patients?.length > 0 ? (newToday / patients.length) * 100 : 0, fraction: 'Growth Rate' },
                            { title: 'ทะเบียนเคสรวม', value: (patients || []).length, sub: 'คนไข้ทั้งหมด' },
                            { title: 'สิทธิ์การรักษา (Active)', value: (patients || []).filter(p => p.insurance).length, sub: 'มีประกัน/สิทธิ์' },
                            { title: 'มาซ้ำเดือนนี้', value: (appointments || []).filter(a => a.status === 'Completed').length, sub: 'Retained Patients', color: '#10b981' },
                            { title: 'ยอดสะสม/คน', value: patients?.length > 0 ? (totalRev / patients.length).toFixed(0) : 0, prefix: '฿', sub: 'CLV Average' },
                            { title: 'นัดหมายหน้า', value: (appointments || []).filter(a => new Date(a.date) > new Date()).length, sub: 'Future Visits' }
                        ]}
                        charts={[
                            { title: 'คนไข้ใหม่รายเดือน', type: 'bar', data: newPatientTrends, icon: Users, color: 'var(--primary-500)' },
                            { title: 'แนวโน้มการเติบโต', type: 'area', data: newPatientTrends, color: '#ec4899', icon: Activity },
                            { title: 'ความหนาแน่นคนไข้', type: 'composed', data: appointmentTrends, icon: Calendar }
                        ]}
                        tableCols={['ชื่อ-นามสกุล', 'เบอร์โทร', 'ยอดใช้จ่ายสะสม', 'เข้าใช้ล่าสุด']}
                        tableData={(patients || []).slice(0, 10).map(p => ({ n: p.name, t: p.phone, a: p.totalSpent || 0, l: p.lastVisit || '-' }))}
                        moneyCols={[2]}
                    />
                );
            case 'inventory':
                return (
                    <PremiumReportView 
                        title="รายงานคลัง"
                        emptyTrends={emptyTrends}
                        language={language}
                        selectedRange={timeRange}
                        onRangeChange={setTimeRange}
                        metrics={[
                            { title: 'รายการสินค้า', value: (inventoryData || []).length, sub: 'SKUS', color: 'var(--primary-600)' },
                            { title: 'Stock Health', type: 'gauge', percent: inventoryData?.length > 0 ? ((inventoryData.length - lowStockItems.length) / inventoryData.length) * 100 : 100, fraction: 'Healthy Stock' },
                            { title: 'มูลค่าคลังประเมิน', value: inventoryAssetValue, prefix: '฿', sub: 'Assets total value', color: '#10b981' },
                            { title: 'Items ในคลัง', value: (inventoryData || []).reduce((sum, i) => sum + (i.stock || 0), 0), sub: 'Total Quantity' },
                            { title: 'สินค้าใกล้หมด', value: lowStockItems.length, sub: 'Low Stock Alert', color: '#ef4444' },
                            { title: 'สินค้าขาดสต๊อก', value: (inventoryData || []).filter(i => (i.stock || 0) <= 0).length, sub: 'Out of stock' },
                            { title: 'ราคาเฉลี่ยต่อชิ้น', value: inventoryData?.length > 0 ? (inventoryAssetValue / (inventoryData.length || 1)).toFixed(0) : 0, prefix: '฿', sub: 'Avg SKU Value' }
                        ]}
                        charts={[
                            { title: 'แนวโน้มคลัง (Placeholder)', type: 'area', data: emptyTrends, icon: Package, color: 'var(--primary-500)' },
                            { title: 'ปริมาณสินค้าคงคลัง', type: 'bar', data: (inventoryData || []).slice(0, 7).map(i => ({ name: i.name.substring(0, 6), value: i.stock })), color: '#ef4444', icon: Box },
                            { title: 'มูลค่าสต๊อก (Placeholder)', type: 'area', data: emptyTrends, color: '#f59e0b', icon: TrendingUp }
                        ]}
                        tableCols={['ID', 'ชื่อสินค้า', 'คงเหลือ', 'ราคา']}
                        tableData={(inventoryData || []).slice(0, 8).map(i => ({ id: i.id?.substring(0, 8), n: i.name, q: i.stock, p: i.price }))}
                        moneyCols={[3]}
                    />
                );
            case 'appointments':
                return (
                    <PremiumReportView 
                        title="รายงานนัดหมาย"
                        emptyTrends={emptyTrends}
                        language={language}
                        selectedRange={timeRange}
                        onRangeChange={setTimeRange}
                        metrics={[
                            { title: 'นัดหมายสะสม', value: totalAppts, sub: 'TOTAL RECORDS', color: 'var(--primary-600)' },
                            { title: 'Show-up Rate', type: 'gauge', percent: showRate, fraction: `${showRate.toFixed(1)}%` },
                            { title: 'No-show / Lost', value: totalAppts - compAppts, sub: 'Dropped Case', color: '#ef4444' },
                            { title: 'นัดหมายเดือนนี้', value: appointmentTrends[appointmentTrends.length - 1]?.value || 0, sub: 'Current Month' },
                            { title: 'เฉลี่ยนัดหมาย/สัปดาห์', value: (totalAppts / 4).toFixed(0), sub: 'Weekly Avg' },
                            { title: 'ยกเลิก / เลื่อน', value: (appointments || []).filter(a => a.status === 'Cancelled').length, sub: 'Cancelled Count' },
                            { title: 'กำลังรอตรวจ (Queue)', value: (appointments || []).filter(a => a.status === 'Arrived').length, sub: 'Patient in Clinic' }
                        ]}
                        charts={[
                            { title: 'นัดหมายรายเดือน', type: 'area', data: appointmentTrends, icon: Calendar, color: 'var(--primary-500)' },
                            { title: 'ประสิทธิภาพการนัด', type: 'composed', data: appointmentTrends.map(t => ({...t, total: t.value, rate: showRate})), icon: UserCheck },
                            { title: 'ยอดนัดหมายแบ่งหมอ (Est.)', type: 'bar', data: doctors.map(d => ({ name: d.name.substring(0, 6), value: (appointments || []).filter(a => a.dentist === d.name).length })), color: '#6366f1', icon: Clock }
                        ]}
                        tableCols={['เวลา', 'คนไข้', 'หัตถการ', 'แพทย์', 'สถานะ']}
                        tableData={(appointments || []).slice(0, 8).map(a => ({ t: a.time, p: a.patientName, s: a.treatment || a.procedure || 'Consult', d: a.dentist, st: a.status }))}
                    />
                );
            case 'custom':
                return (
                    <div className="animate-fade-in" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', padding: '1rem', border: '1px solid #f1f5f9' }}>
                        <AdvancedReports />
                    </div>
                );

            case 'business-analytics':
                return (
                    <div className="animate-fade-in" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', padding: '1rem', border: '1px solid #f1f5f9' }}>
                        <BusinessAnalytics />
                    </div>
                );
            case 'demographics':
                const genderDist = { Male: 0, Female: 0, Other: 0 };
                const ageDist = { 'Under 18': 0, '19-35': 0, '36-50': 0, '51-65': 0, 'Over 65': 0 };
                const areaDist = {};
                
                (patients || []).forEach(c => {
                    const g = c.gender || 'Other';
                    if (g === 'Male' || g === 'ชาย') genderDist.Male++;
                    else if (g === 'Female' || g === 'หญิง') genderDist.Female++;
                    else genderDist.Other++;

                    const age = Number(c.age);
                    if (age < 18) ageDist['Under 18']++;
                    else if (age <= 35) ageDist['19-35']++;
                    else if (age <= 50) ageDist['36-50']++;
                    else if (age <= 65) ageDist['51-65']++;
                    else ageDist['Over 65']++;

                    const addr = c.address || '';
                    const areas = ['กรุงเทพ', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'ชลบุรี'];
                    let foundArea = language === 'TH' ? 'อื่นๆ' : 'Other';
                    for (const a of areas) {
                        if (addr.includes(a)) {
                            foundArea = a;
                            break;
                        }
                    }
                    areaDist[foundArea] = (areaDist[foundArea] || 0) + 1;
                });

                return (
                    <PremiumReportView 
                        title="รายงานข้อมูลประชากร"
                        emptyTrends={emptyTrends}
                        language={language}
                        selectedRange={timeRange}
                        onRangeChange={setTimeRange}
                        metrics={[
                            { title: 'คนไข้ชาย', value: genderDist.Male, sub: 'PERSONS', color: '#0ea5e9' },
                            { title: 'คนไข้หญิง', value: genderDist.Female, sub: 'PERSONS', color: '#f472b6' },
                            { title: 'วัยทำงาน (19-50)', value: ageDist['19-35'] + ageDist['36-50'], sub: 'CORE SEGMENT', color: '#8b5cf6' },
                            { title: 'คนไข้ในกรุงเทพ', value: areaDist['กรุงเทพ'] || 0, sub: 'LOCATION PEAK', color: '#10b981' }
                        ]}
                        charts={[
                            { title: 'สัดส่วนเพศ', type: 'composed', data: Object.entries(genderDist).map(([name, value]) => ({ name, value })), icon: Users },
                            { title: 'ช่วงอายุคนไข้', type: 'bar', data: Object.entries(ageDist).map(([name, value]) => ({ name, value })), color: '#8b5cf6', icon: Activity },
                            { title: 'ยอดสะสมรายคน (Chart)', type: 'area', data: getMonthData(patients, 'createdAt'), color: '#3b82f6', icon: UserCheck }
                        ]}
                        tableCols={['กลุ่มพื้นที่', 'จำนวนคนไข้', 'สัดส่วน %']}
                        tableData={Object.entries(areaDist).sort((a,b) => b[1] - a[1]).map(([area, count]) => ({
                            a: area,
                            c: count,
                            p: `${((count / (patients?.length || 1)) * 100).toFixed(1)}%`
                        }))}
                    />
                );
            default: return null;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
            {/* Unified Clinical Navbar */}
            <div style={{ 
                width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', 
                display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0
            }}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                        <div style={{ width: 36, height: 36, background: 'var(--primary-600)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp color="white" size={20} />
                        </div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>KPI CLINIC</h1>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>Business Analytics Engine</p>
                </div>
                
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.5rem 0.5rem 0.5rem' }}>
                        Reporting Suite
                    </p>
                    {reportCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveSection(cat.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 14px', borderRadius: '12px', border: 'none',
                                background: activeSection === cat.id ? 'var(--primary-50)' : 'transparent',
                                color: activeSection === cat.id ? 'var(--primary-700)' : '#64748b',
                                fontWeight: activeSection === cat.id ? 800 : 600,
                                cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
                                fontSize: '0.85rem'
                            }}
                        >
                            <cat.icon size={18} color={activeSection === cat.id ? 'var(--primary-600)' : '#cbd5e1'} />
                            <span style={{ flex: 1 }}>{cat.label}</span>
                            {activeSection === cat.id && <ChevronRight size={14} />}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', margin: '1rem', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e293b' }}>AI INSIGHT</span>
                    </div>
                    <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                        ยอดรายได้เดือนนี้สูงกว่าค่าเฉลี่ย 12.5% แนะนำให้เพิ่ม Slot นัดหมายในช่วงเย็น
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, height: '100vh', overflowY: 'auto', padding: '2rem 3rem', background: 'white' }}>
                 {renderContent() || (
                    <div style={{ textAlign: 'center', padding: '10rem 0', color: '#94a3b8' }}>
                        <Activity size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Select a Report Category</h2>
                        <p>Explore deep-dive analytics for your clinic operations</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default ReportsHub;
