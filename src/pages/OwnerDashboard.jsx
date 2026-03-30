import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    Users, 
    DollarSign, 
    Calendar, 
    AlertTriangle, 
    Activity,
    Building,
    Clock,
    Target,
    BarChart3,
    PieChart,
    Eye,
    Settings,
    Download,
    RefreshCw,
    Bell,
    TrendingDown,
    UserCheck,
    ShoppingCart,
    CreditCard,
    Package,
    Stethoscope
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isToday, isThisMonth } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const OwnerDashboard = () => {
    const { language } = useLanguage();
    const { appointments, patients, billingRecords, expenses, inventory } = useData();
    const { staff, isAdmin } = useAuth();
    
    const [selectedPeriod, setSelectedPeriod] = useState('month'); // day, week, month, quarter, year
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [realTimeData, setRealTimeData] = useState({
        activePatients: 0,
        todayRevenue: 0,
        todayAppointments: 0,
        staffOnline: 0,
        lowStockItems: 0,
        pendingApprovals: 0
    });
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // ข้อมูลสาขา (จำลอง)
    const branches = [
        { id: 'all', name: { TH: 'ทุกสาขา', EN: 'All Branches' } },
        { id: 'main', name: { TH: 'สาขาหลัก', EN: 'Main Branch' } },
        { id: 'branch1', name: { TH: 'สาขา 1', EN: 'Branch 1' } },
        { id: 'branch2', name: { TH: 'สาขา 2', EN: 'Branch 2' } }
    ];

    useEffect(() => {
        if (!isAdmin) return;
        
        loadRealTimeData();
        loadAlerts();
        
        // จำลอง Real-time updates
        const interval = setInterval(() => {
            loadRealTimeData();
        }, 30000); // อัพเดททุก 30 วินาที
        
        return () => clearInterval(interval);
    }, [selectedPeriod, selectedBranch]);

    const loadRealTimeData = () => {
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));
        
        // คำนวณข้อมูลวันนี้
        const todayAppts = appointments?.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= todayStart && aptDate <= todayEnd;
        }) || [];
        
        const todayBilling = billingRecords?.filter(bill => {
            const billDate = new Date(bill.date || bill.createdAt);
            return billDate >= todayStart && billDate <= todayEnd;
        }) || [];
        
        const lowStock = inventory?.filter(item => item.stock <= item.reorderPoint) || [];
        
        setRealTimeData({
            activePatients: patients?.filter(p => p.lastVisit && isThisMonth(new Date(p.lastVisit))).length || 0,
            todayRevenue: todayBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0),
            todayAppointments: todayAppts.length,
            staffOnline: Math.floor(Math.random() * staff?.length || 0) + 1,
            lowStockItems: lowStock.length,
            pendingApprovals: Math.floor(Math.random() * 5) + 1
        });
    };

    const loadAlerts = () => {
        const mockAlerts = [
            {
                id: 1,
                type: 'warning',
                title: language === 'TH' ? 'สต็อกต่ำ' : 'Low Stock',
                message: language === 'TH' ? 'วัสดุอุดฟัน Composite ใกล้หมด' : 'Composite filling material running low',
                time: '5 นาทีที่แล้ว',
                priority: 'high'
            },
            {
                id: 2,
                type: 'info',
                title: language === 'TH' ? 'ผู้ป่วยใหม่' : 'New Patient',
                message: language === 'TH' ? 'มีผู้ป่วยใหม่ 3 รายวันนี้' : '3 new patients registered today',
                time: '15 นาทีที่แล้ว',
                priority: 'medium'
            },
            {
                id: 3,
                type: 'success',
                title: language === 'TH' ? 'เป้าหมายเดือน' : 'Monthly Target',
                message: language === 'TH' ? 'บรรลุเป้าหมายรายได้ 85%' : 'Achieved 85% of monthly revenue target',
                time: '1 ชั่วโมงที่แล้ว',
                priority: 'low'
            }
        ];
        setAlerts(mockAlerts);
    };

    const getPeriodData = () => {
        const now = new Date();
        let startDate, endDate;
        
        switch (selectedPeriod) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                endDate = new Date(now.setDate(now.getDate() + (6 - now.getDay())));
                break;
            case 'month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
        }
        
        return { startDate, endDate };
    };

    const calculateKPIs = () => {
        const { startDate, endDate } = getPeriodData();
        
        const periodAppts = appointments?.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= startDate && aptDate <= endDate;
        }) || [];
        
        const periodBilling = billingRecords?.filter(bill => {
            const billDate = new Date(bill.date || bill.createdAt);
            return billDate >= startDate && billDate <= endDate;
        }) || [];
        
        const newPatients = patients?.filter(p => {
            const regDate = new Date(p.createdAt || p.registrationDate);
            return regDate >= startDate && regDate <= endDate;
        }) || [];
        
        const totalRevenue = periodBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
        const profit = totalRevenue - totalExpenses;
        
        // คำนวณอัตราการมานัด
        const completedAppts = periodAppts.filter(apt => apt.status === 'completed').length;
        const noShowAppts = periodAppts.filter(apt => apt.status === 'no-show').length;
        const showRate = periodAppts.length > 0 ? ((completedAppts / periodAppts.length) * 100).toFixed(1) : 0;
        
        return {
            totalRevenue,
            totalExpenses,
            profit,
            totalPatients: patients?.length || 0,
            newPatients: newPatients.length,
            totalAppointments: periodAppts.length,
            completedAppointments: completedAppts,
            showRate,
            averageTransaction: periodBilling.length > 0 ? (totalRevenue / periodBilling.length).toFixed(0) : 0,
            patientGrowth: calculateGrowth(newPatients.length),
            revenueGrowth: calculateGrowth(totalRevenue)
        };
    };

    const calculateGrowth = (currentValue) => {
        // จำลองการคำนวณ growth rate
        const previousValue = currentValue * 0.85; // สมมติว่าเดือนที่แล้วน้อยกว่า 15%
        const growth = ((currentValue - previousValue) / previousValue * 100).toFixed(1);
        return parseFloat(growth);
    };

    const kpis = calculateKPIs();

    const KPICard = ({ title, value, icon: Icon, color, trend, subtitle, changeType }) => (
        <div className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'white',
            border: `1px solid ${color}20`,
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                    <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {title}
                    </p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--neutral-900)' }}>
                        {typeof value === 'number' && value >= 1000 ? 
                            value.toLocaleString() : value}
                    </h3>
                    {subtitle && (
                        <p style={{ color: 'var(--neutral-500)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: `${color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon size={24} color={color} />
                </div>
            </div>
            
            {trend !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {trend > 0 ? (
                        <TrendingUp size={16} color="#10b981" />
                    ) : trend < 0 ? (
                        <TrendingDown size={16} color="#ef4444" />
                    ) : null}
                    <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#6b7280'
                    }}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                        {language === 'TH' ? 'จากเดือนที่แล้ว' : 'vs last month'}
                    </span>
                </div>
            )}
        </div>
    );

    const AlertCard = ({ alert }) => {
        const getAlertIcon = () => {
            switch (alert.type) {
                case 'warning': return <AlertTriangle size={16} color="#f59e0b" />;
                case 'success': return <Target size={16} color="#10b981" />;
                default: return <Bell size={16} color="#3b82f6" />;
            }
        };
        
        const getAlertColor = () => {
            switch (alert.priority) {
                case 'high': return '#fef2f2';
                case 'medium': return '#fef3c7';
                default: return '#eff6ff';
            }
        };
        
        return (
            <div style={{
                padding: '1rem',
                background: getAlertColor(),
                border: `1px solid ${alert.priority === 'high' ? '#fecaca' : alert.priority === 'medium' ? '#fde68a' : '#dbeafe'}`,
                borderRadius: '8px',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'start'
            }}>
                {getAlertIcon()}
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                        {alert.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                        {alert.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                        {alert.time}
                    </div>
                </div>
            </div>
        );
    };

    if (!isAdmin) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Settings size={48} color="var(--neutral-400)" />
                <h2 style={{ marginTop: '1rem' }}>
                    {language === 'TH' ? 'เข้าถึงไม่ได้' : 'Access Denied'}
                </h2>
                <p style={{ color: 'var(--neutral-600)' }}>
                    {language === 'TH' ? 'หน้านี้สำหรับ Owner เท่านั้น' : 'This page is for Owner only'}
                </p>
            </div>
        );
    }

    return (
        <div className="owner-dashboard" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Building size={32} color="var(--primary-600)" />
                        {language === 'TH' ? 'แดชบอร์ดเจ้าของ' : 'Owner Dashboard'}
                    </h1>
                    <p style={{ color: 'var(--neutral-600)', marginTop: '0.5rem' }}>
                        {format(new Date(), language === 'TH' ? 'd MMMM yyyy' : 'MMMM d, yyyy', { locale: language === 'TH' ? th : enUS })}
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        style={{ 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            border: '1px solid var(--neutral-200)',
                            background: 'white'
                        }}
                    >
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name[language]}
                            </option>
                        ))}
                    </select>
                    
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        style={{ 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            border: '1px solid var(--neutral-200)',
                            background: 'white'
                        }}
                    >
                        <option value="today">{language === 'TH' ? 'วันนี้' : 'Today'}</option>
                        <option value="week">{language === 'TH' ? 'สัปดาห์นี้' : 'This Week'}</option>
                        <option value="month">{language === 'TH' ? 'เดือนนี้' : 'This Month'}</option>
                        <option value="quarter">{language === 'TH' ? 'ไตรมาสนี้' : 'This Quarter'}</option>
                        <option value="year">{language === 'TH' ? 'ปีนี้' : 'This Year'}</option>
                    </select>
                    
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={18} />
                        {language === 'TH' ? 'ส่งออกรายงาน' : 'Export Report'}
                    </button>
                </div>
            </div>

            {/* Real-time Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {realTimeData.activePatients}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        {language === 'TH' ? 'ผู้ป่วยเดือนนี้' : 'Active Patients'}
                    </div>
                </div>
                
                <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        ฿{realTimeData.todayRevenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        {language === 'TH' ? 'รายได้วันนี้' : "Today's Revenue"}
                    </div>
                </div>
                
                <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {realTimeData.todayAppointments}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        {language === 'TH' ? 'นัดหมายวันนี้' : "Today's Appointments"}
                    </div>
                </div>
                
                <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {realTimeData.staffOnline}/{staff?.length || 0}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        {language === 'TH' ? 'พนักงานออนไลน์' : 'Staff Online'}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <KPICard
                    title={language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}
                    value={`฿${kpis.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="#22c55e"
                    trend={kpis.revenueGrowth}
                />
                
                <KPICard
                    title={language === 'TH' ? 'กำไร' : 'Profit'}
                    value={`฿${kpis.profit.toLocaleString()}`}
                    icon={TrendingUp}
                    color={kpis.profit >= 0 ? "#10b981" : "#ef4444"}
                    trend={kpis.revenueGrowth * 0.8}
                />
                
                <KPICard
                    title={language === 'TH' ? 'ผู้ป่วยทั้งหมด' : 'Total Patients'}
                    value={kpis.totalPatients}
                    icon={Users}
                    color="#3b82f6"
                    trend={kpis.patientGrowth}
                />
                
                <KPICard
                    title={language === 'TH' ? 'ผู้ป่วยใหม่' : 'New Patients'}
                    value={kpis.newPatients}
                    icon={UserCheck}
                    color="#8b5cf6"
                    subtitle={language === 'TH' ? `เติบโต ${kpis.patientGrowth}%` : `Growth ${kpis.patientGrowth}%`}
                />
                
                <KPICard
                    title={language === 'TH' ? 'นัดหมายทั้งหมด' : 'Total Appointments'}
                    value={kpis.totalAppointments}
                    icon={Calendar}
                    color="#f59e0b"
                    subtitle={language === 'TH' ? `เสร็จ ${kpis.completedAppointments}` : `Completed ${kpis.completedAppointments}`}
                />
                
                <KPICard
                    title={language === 'TH' ? 'อัตราการมานัด' : 'Show Rate'}
                    value={`${kpis.showRate}%`}
                    icon={Target}
                    color="#06b6d4"
                />
            </div>

            {/* Alerts and Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Alerts */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'การแจ้งเตือน' : 'Alerts'}
                        <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            background: '#ef4444',
                            color: 'white'
                        }}>
                            {alerts.length}
                        </span>
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {alerts.map(alert => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'การกระทำด่วน' : 'Quick Actions'}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button className="btn btn-primary" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            justifyContent: 'flex-start',
                            padding: '1rem'
                        }}>
                            <Users size={18} />
                            {language === 'TH' ? 'จัดการผู้ป่วย' : 'Manage Patients'}
                        </button>
                        
                        <button className="btn btn-secondary" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            justifyContent: 'flex-start',
                            padding: '1rem'
                        }}>
                            <Package size={18} />
                            {language === 'TH' ? 'ตรวจสอบสต็อก' : 'Check Inventory'}
                        </button>
                        
                        <button className="btn btn-secondary" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            justifyContent: 'flex-start',
                            padding: '1rem'
                        }}>
                            <Stethoscope size={18} />
                            {language === 'TH' ? 'ดูตารางแพทย์' : 'View Doctor Schedule'}
                        </button>
                        
                        <button className="btn btn-secondary" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            justifyContent: 'flex-start',
                            padding: '1rem'
                        }}>
                            <BarChart3 size={18} />
                            {language === 'TH' ? 'รายงานขั้นสูง' : 'Advanced Reports'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Revenue Chart Placeholder */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'แนวโน้มรายได้' : 'Revenue Trend'}
                    </h3>
                    <div style={{ 
                        height: '300px', 
                        background: 'var(--neutral-50)', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--neutral-500)'
                    }}>
                        {language === 'TH' ? 'กราฟแสดงแนวโน้มรายได้' : 'Revenue trend chart'}
                    </div>
                </div>

                {/* Patient Distribution */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChart size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'การกระจายผู้ป่วย' : 'Patient Distribution'}
                    </h3>
                    <div style={{ 
                        height: '300px', 
                        background: 'var(--neutral-50)', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--neutral-500)'
                    }}>
                        {language === 'TH' ? 'แผนภูมิการกระจายผู้ป่วย' : 'Patient distribution chart'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
