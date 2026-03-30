import React, { useState, useEffect } from 'react';
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    PieChart, 
    BarChart3, 
    Calendar, 
    Download, 
    Filter,
    Plus,
    Edit3,
    Trash2,
    Eye,
    Target,
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Wallet,
    Receipt,
    Building,
    Users,
    ShoppingCart,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isThisMonth } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const FinancialManagement = () => {
    const { language } = useLanguage();
    const { billingRecords, expenses, appointments, patients } = useData();
    const { isAdmin } = useAuth();
    
    const [activeTab, setActiveTab] = useState('overview'); // overview, p&l, forecast, expenses, reports
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showForecastDetails, setShowForecastDetails] = useState(false);

    // ข้อมูลสาขา
    const branches = [
        { id: 'all', name: { TH: 'ทุกสาขา', EN: 'All Branches' } },
        { id: 'main', name: { TH: 'สาขาหลัก', EN: 'Main Branch' } },
        { id: 'branch1', name: { TH: 'สาขา 1', EN: 'Branch 1' } }
    ];

    // ข้อมูลรายจ่าย (จำลอง)
    const [expensesData, setExpensesData] = useState([
        { id: 1, category: 'rent', amount: 50000, date: '2024-03-01', description: 'ค่าเช่าสำนักงาน', branch: 'main' },
        { id: 2, category: 'utilities', amount: 8000, date: '2024-03-05', description: 'ค่าไฟฟ้า-น้ำ', branch: 'main' },
        { id: 3, category: 'salary', amount: 250000, date: '2024-03-10', description: 'เงินเดือนพนักงาน', branch: 'main' },
        { id: 4, category: 'supplies', amount: 45000, date: '2024-03-15', description: 'วัสดุทางทันตกรรม', branch: 'main' },
        { id: 5, category: 'marketing', amount: 15000, date: '2024-03-20', description: 'ค่าโฆษณา', branch: 'main' }
    ]);

    const expenseCategories = {
        rent: { TH: 'ค่าเช่า', EN: 'Rent', color: '#ef4444' },
        utilities: { TH: 'สาธารณูปโภค', EN: 'Utilities', color: '#f59e0b' },
        salary: { TH: 'เงินเดือน', EN: 'Salary', color: '#3b82f6' },
        supplies: { TH: 'วัสดุ', EN: 'Supplies', color: '#8b5cf6' },
        marketing: { TH: 'การตลาด', EN: 'Marketing', color: '#10b981' },
        insurance: { TH: 'ประกัน', EN: 'Insurance', color: '#06b6d4' },
        maintenance: { TH: 'ซ่อมบำรุง', EN: 'Maintenance', color: '#f97316' },
        other: { TH: 'อื่นๆ', EN: 'Other', color: '#6b7280' }
    };

    useEffect(() => {
        loadFinancialData();
    }, [selectedPeriod, selectedBranch]);

    const loadFinancialData = () => {
        // จำลองการโหลดข้อมูลการเงิน
        console.log('Loading financial data...');
    };

    const getPeriodData = () => {
        const now = new Date();
        let startDate, endDate;
        
        switch (selectedPeriod) {
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

    const calculateFinancials = () => {
        const { startDate, endDate } = getPeriodData();
        
        // กรองข้อมูลตามช่วงเวลา
        const periodBilling = billingRecords?.filter(bill => {
            const billDate = new Date(bill.date || bill.createdAt);
            return billDate >= startDate && billDate <= endDate;
        }) || [];
        
        const periodExpenses = expensesData.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startDate && expDate <= endDate;
        });
        
        // คำนวณรายได้
        const totalRevenue = periodBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const treatmentRevenue = periodBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const productRevenue = 15000; // จำลองรายได้จากขายสินค้า
        
        // แยกตามประเภทรายได้
        const revenueByCategory = {
            treatment: treatmentRevenue,
            products: productRevenue,
            consultation: totalRevenue * 0.1,
            other: totalRevenue * 0.05
        };
        
        // คำนวณรายจ่าย
        const totalExpenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const expensesByCategory = {};
        periodExpenses.forEach(exp => {
            expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
        });
        
        // คำนวณกำไร
        const grossProfit = totalRevenue - (expensesByCategory.supplies || 0);
        const operatingExpenses = (expensesByCategory.rent || 0) + (expensesByCategory.utilities || 0) + (expensesByCategory.salary || 0);
        const operatingProfit = grossProfit - operatingExpenses;
        const netProfit = operatingProfit - ((expensesByCategory.marketing || 0) + (expensesByCategory.other || 0));
        
        // คำนวณอัตรากำไร
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(1) : 0;
        const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue * 100).toFixed(1) : 0;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0;
        
        return {
            totalRevenue,
            totalExpenses,
            grossProfit,
            operatingProfit,
            netProfit,
            grossMargin,
            operatingMargin,
            netMargin,
            revenueByCategory,
            expensesByCategory,
            cashFlow: totalRevenue - totalExpenses
        };
    };

    const generateForecast = () => {
        const current = calculateFinancials();
        const months = [];
        
        for (let i = 1; i <= 12; i++) {
            const growthRate = 0.05 + (Math.random() * 0.1); // 5-15% growth
            const seasonalFactor = 1 + (Math.sin(i * Math.PI / 6) * 0.2); // Seasonal variation
            
            months.push({
                month: i,
                projectedRevenue: current.totalRevenue * (1 + growthRate) * seasonalFactor,
                projectedExpenses: current.totalExpenses * (1 + 0.03), // 3% expense growth
                projectedProfit: 0
            });
            
            months[i - 1].projectedProfit = months[i - 1].projectedRevenue - months[i - 1].projectedExpenses;
        }
        
        return months;
    };

    const financials = calculateFinancials();
    const forecast = generateForecast();

    const MetricCard = ({ title, value, icon: Icon, color, trend, subtitle, format = 'number' }) => (
        <div className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'white',
            border: `1px solid ${color}20`,
            borderRadius: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                    <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {title}
                    </p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--neutral-900)' }}>
                        {format === 'currency' ? `฿${value.toLocaleString()}` : 
                         format === 'percent' ? `${value}%` : 
                         value.toLocaleString()}
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
                        <ArrowUpRight size={16} color="#10b981" />
                    ) : trend < 0 ? (
                        <ArrowDownRight size={16} color="#ef4444" />
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

    if (!isAdmin) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <DollarSign size={48} color="var(--neutral-400)" />
                <h2 style={{ marginTop: '1rem' }}>
                    {language === 'TH' ? 'เข้าถึงไม่ได้' : 'Access Denied'}
                </h2>
                <p style={{ color: 'var(--neutral-600)' }}>
                    {language === 'TH' ? 'หน้านี้สำหรับ Owner/Admin เท่านั้น' : 'This page is for Owner/Admin only'}
                </p>
            </div>
        );
    }

    return (
        <div className="financial-management" style={{ padding: '2rem' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <DollarSign size={32} color="var(--primary-600)" />
                        {language === 'TH' ? 'การจัดการการเงิน' : 'Financial Management'}
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
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
                            <option value="month">{language === 'TH' ? 'เดือนนี้' : 'This Month'}</option>
                            <option value="quarter">{language === 'TH' ? 'ไตรมาสนี้' : 'This Quarter'}</option>
                            <option value="year">{language === 'TH' ? 'ปีนี้' : 'This Year'}</option>
                        </select>
                        
                        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} />
                            {language === 'TH' ? 'ส่งออกรายงาน' : 'Export Report'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
                    {[
                        { id: 'overview', label: { TH: 'ภาพรวม', EN: 'Overview' } },
                        { id: 'p&l', label: { TH: 'กำไร-ขาดทุน', EN: 'P&L Statement' } },
                        { id: 'forecast', label: { TH: 'พยากรณ์', EN: 'Forecast' } },
                        { id: 'expenses', label: { TH: 'รายจ่าย', EN: 'Expenses' } },
                        { id: 'reports', label: { TH: 'รายงาน', EN: 'Reports' } }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--neutral-600)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {tab.label[language]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Key Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <MetricCard
                            title={language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}
                            value={financials.totalRevenue}
                            icon={DollarSign}
                            color="#22c55e"
                            trend={12.5}
                            format="currency"
                        />
                        
                        <MetricCard
                            title={language === 'TH' ? 'กำไรขั้นต้น' : 'Gross Profit'}
                            value={financials.grossProfit}
                            icon={TrendingUp}
                            color={financials.grossProfit >= 0 ? "#10b981" : "#ef4444"}
                            trend={8.3}
                            format="currency"
                        />
                        
                        <MetricCard
                            title={language === 'TH' ? 'กำไรจากการดำเนินงาน' : 'Operating Profit'}
                            value={financials.operatingProfit}
                            icon={Activity}
                            color={financials.operatingProfit >= 0 ? "#10b981" : "#ef4444"}
                            trend={5.2}
                            format="currency"
                        />
                        
                        <MetricCard
                            title={language === 'TH' ? 'กำไรสุทธิ' : 'Net Profit'}
                            value={financials.netProfit}
                            icon={Target}
                            color={financials.netProfit >= 0 ? "#10b981" : "#ef4444"}
                            trend={3.8}
                            format="currency"
                        />
                        
                        <MetricCard
                            title={language === 'TH' ? 'อัตรากำไรขั้นต้น' : 'Gross Margin'}
                            value={financials.grossMargin}
                            icon={PieChart}
                            color="#3b82f6"
                            trend={1.2}
                            format="percent"
                        />
                        
                        <MetricCard
                            title={language === 'TH' ? 'อัตรากำไรสุทธิ' : 'Net Margin'}
                            value={financials.netMargin}
                            icon={BarChart3}
                            color="#8b5cf6"
                            trend={-0.5}
                            format="percent"
                        />
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
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

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <PieChart size={20} color="var(--primary-600)" />
                                {language === 'TH' ? 'การกระจายรายได้' : 'Revenue Breakdown'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {Object.entries(financials.revenueByCategory).map(([category, amount]) => (
                                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem' }}>
                                            {category === 'treatment' ? (language === 'TH' ? 'การรักษา' : 'Treatment') :
                                             category === 'products' ? (language === 'TH' ? 'สินค้า' : 'Products') :
                                             category === 'consultation' ? (language === 'TH' ? 'ปรึกษา' : 'Consultation') :
                                             (language === 'TH' ? 'อื่นๆ' : 'Other')}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>฿{amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* P&L Tab */}
            {activeTab === 'p&l' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Receipt size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'งบกำไร-ขาดทุน' : 'Profit & Loss Statement'}
                    </h3>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'รายการ' : 'Item'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'จำนวน' : 'Amount'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        ฿{financials.totalRevenue.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1rem', paddingLeft: '2rem' }}>
                                        {language === 'TH' ? 'ต้นทุนสินค้า' : 'Cost of Goods Sold'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        (฿{(financials.expensesByCategory.supplies || 0).toLocaleString()})
                                    </td>
                                </tr>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {language === 'TH' ? 'กำไรขั้นต้น' : 'Gross Profit'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        ฿{financials.grossProfit.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1rem', paddingLeft: '2rem' }}>
                                        {language === 'TH' ? 'ค่าใช้จ่ายดำเนินงาน' : 'Operating Expenses'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}></td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1rem', paddingLeft: '3rem' }}>
                                        {language === 'TH' ? 'ค่าเช่า' : 'Rent'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        ฿{(financials.expensesByCategory.rent || 0).toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1rem', paddingLeft: '3rem' }}>
                                        {language === 'TH' ? 'ค่าจ้าง' : 'Salaries'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        ฿{(financials.expensesByCategory.salary || 0).toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1rem', paddingLeft: '3rem' }}>
                                        {language === 'TH' ? 'สาธารณูปโภค' : 'Utilities'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        ฿{(financials.expensesByCategory.utilities || 0).toLocaleString()}
                                    </td>
                                </tr>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {language === 'TH' ? 'กำไรจากการดำเนินงาน' : 'Operating Profit'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        ฿{financials.operatingProfit.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1rem', paddingLeft: '2rem' }}>
                                        {language === 'TH' ? 'ค่าใช้จ่ายอื่นๆ' : 'Other Expenses'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        ฿{((financials.expensesByCategory.marketing || 0) + (financials.expensesByCategory.other || 0)).toLocaleString()}
                                    </td>
                                </tr>
                                <tr style={{ background: '#f0f9ff', fontWeight: 700 }}>
                                    <td style={{ padding: '1rem' }}>
                                        {language === 'TH' ? 'กำไรสุทธิ' : 'Net Profit'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                                        ฿{financials.netProfit.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Forecast Tab */}
            {activeTab === 'forecast' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'พยากรณ์การเงิน' : 'Financial Forecast'}
                    </h3>
                    
                    <div style={{ 
                        height: '400px', 
                        background: 'var(--neutral-50)', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--neutral-500)'
                    }}>
                        {language === 'TH' ? 'กราฟพยากรณ์รายได้และกำไร' : 'Revenue and profit forecast chart'}
                    </div>
                    
                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>
                            {language === 'TH' ? 'สรุปพยากรณ์ 12 เดือน' : '12-Month Forecast Summary'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <MetricCard
                                title={language === 'TH' ? 'รายได้โปรจ' : 'Projected Revenue'}
                                value={forecast.reduce((sum, m) => sum + m.projectedRevenue, 0)}
                                icon={DollarSign}
                                color="#22c55e"
                                format="currency"
                            />
                            <MetricCard
                                title={language === 'TH' ? 'รายจ่ายโปรจ' : 'Projected Expenses'}
                                value={forecast.reduce((sum, m) => sum + m.projectedExpenses, 0)}
                                icon={Wallet}
                                color="#ef4444"
                                format="currency"
                            />
                            <MetricCard
                                title={language === 'TH' ? 'กำไรโปรจ' : 'Projected Profit'}
                                value={forecast.reduce((sum, m) => sum + m.projectedProfit, 0)}
                                icon={TrendingUp}
                                color="#10b981"
                                format="currency"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Wallet size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'จัดการรายจ่าย' : 'Expense Management'}
                        </h3>
                        <button 
                            onClick={() => setShowAddExpense(true)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} />
                            {language === 'TH' ? 'เพิ่มรายจ่าย' : 'Add Expense'}
                        </button>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'วันที่' : 'Date'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'หมวด' : 'Category'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'รายละเอียด' : 'Description'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'จำนวน' : 'Amount'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {language === 'TH' ? 'จัดการ' : 'Actions'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {expensesData.map(expense => (
                                    <tr key={expense.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {format(new Date(expense.date), language === 'TH' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: `${expenseCategories[expense.category]?.color}10`,
                                                color: expenseCategories[expense.category]?.color
                                            }}>
                                                {expenseCategories[expense.category]?.[language]}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {expense.description}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                            ฿{expense.amount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                                                    <Edit3 size={14} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'รายงานการเงิน' : 'Financial Reports'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <button className="btn btn-secondary" style={{ 
                            padding: '2rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '1rem',
                            height: '150px'
                        }}>
                            <Receipt size={32} color="var(--primary-600)" />
                            <span style={{ fontWeight: 600 }}>
                                {language === 'TH' ? 'รายงานกำไร-ขาดทุน' : 'P&L Report'}
                            </span>
                        </button>
                        
                        <button className="btn btn-secondary" style={{ 
                            padding: '2rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '1rem',
                            height: '150px'
                        }}>
                            <PieChart size={32} color="var(--primary-600)" />
                            <span style={{ fontWeight: 600 }}>
                                {language === 'TH' ? 'รายงานกระแจกงบประมาณ' : 'Cash Flow Report'}
                            </span>
                        </button>
                        
                        <button className="btn btn-secondary" style={{ 
                            padding: '2rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '1rem',
                            height: '150px'
                        }}>
                            <Target size={32} color="var(--primary-600)" />
                            <span style={{ fontWeight: 600 }}>
                                {language === 'TH' ? 'รายงานงบประมาณ' : 'Budget Report'}
                            </span>
                        </button>
                        
                        <button className="btn btn-secondary" style={{ 
                            padding: '2rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '1rem',
                            height: '150px'
                        }}>
                            <Activity size={32} color="var(--primary-600)" />
                            <span style={{ fontWeight: 600 }}>
                                {language === 'TH' ? 'รายงานภาษี' : 'Tax Report'}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialManagement;
