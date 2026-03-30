import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    Download, 
    Filter, 
    Calendar, 
    FileText, 
    Settings, 
    Plus, 
    Eye, 
    Edit3, 
    Trash2,
    Save,
    RefreshCw,
    Printer,
    Mail,
    Share2,
    Database,
    Target,
    Users,
    DollarSign,
    Activity,
    Clock,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const AdvancedReports = () => {
    const { language } = useLanguage();
    const { appointments, patients, billingRecords, expenses, inventory } = useData();
    const { isAdmin } = useAuth();
    
    const [activeTab, setActiveTab] = useState('builder'); // builder, templates, scheduled, history
    const [selectedReport, setSelectedReport] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    
    // Report Builder State
    const [reportConfig, setReportConfig] = useState({
        name: '',
        description: '',
        type: 'summary', // summary, detailed, trend, comparison
        dataSource: 'all', // all, patients, appointments, billing, inventory, expenses
        dateRange: 'month', // today, week, month, quarter, year, custom
        customStartDate: '',
        customEndDate: '',
        filters: {},
        groupBy: 'none', // none, day, week, month, category, doctor, service
        metrics: [], // revenue, patients, appointments, profit, etc.
        charts: ['table'], // table, bar, pie, line, area
        exportFormat: 'pdf' // pdf, excel, csv
    });

    // Report Templates
    const [reportTemplates, setReportTemplates] = useState([
        {
            id: 1,
            name: { TH: 'รายงานรายได้รายเดือน', EN: 'Monthly Revenue Report' },
            description: { TH: 'รายงานสรุปรายได้และกำไรรายเดือน', EN: 'Monthly revenue and profit summary' },
            type: 'financial',
            dataSource: 'billing',
            frequency: 'monthly',
            metrics: ['revenue', 'profit', 'expenses', 'patient_count'],
            charts: ['table', 'bar', 'line'],
            active: true
        },
        {
            id: 2,
            name: { TH: 'รายงานสถิติผู้ป่วย', EN: 'Patient Statistics Report' },
            description: { TH: 'สถิติผู้ป่วยใหม่และผู้ป่วยประจำ', EN: 'New and returning patient statistics' },
            type: 'patient',
            dataSource: 'patients',
            frequency: 'monthly',
            metrics: ['new_patients', 'returning_patients', 'demographics', 'treatment_types'],
            charts: ['table', 'pie'],
            active: true
        },
        {
            id: 3,
            name: { TH: 'รายงานประสิทธิภาพทันตแพทย์', EN: 'Dentist Performance Report' },
            description: { TH: 'ประสิทธิภาพและประสิทธิการรักษาของทันตแพทย์แต่ละคน', EN: 'Individual dentist performance metrics' },
            type: 'performance',
            dataSource: 'appointments',
            frequency: 'monthly',
            metrics: ['patient_count', 'revenue', 'treatments', 'satisfaction'],
            charts: ['table', 'bar'],
            active: true
        },
        {
            id: 4,
            name: { TH: 'รายงานสต็อกสินค้า', EN: 'Inventory Report' },
            description: { TH: 'รายงานสต็อกสินค้าและการเคลื่อนไหว', EN: 'Stock levels and movement report' },
            type: 'inventory',
            dataSource: 'inventory',
            frequency: 'weekly',
            metrics: ['stock_levels', 'low_stock', 'usage_rate', 'value'],
            charts: ['table', 'bar'],
            active: false
        }
    ]);

    // Scheduled Reports
    const [scheduledReports, setScheduledReports] = useState([
        {
            id: 1,
            templateId: 1,
            name: 'รายงานรายได้รายเดือน',
            schedule: 'monthly',
            nextRun: '2024-04-01',
            recipients: ['owner@ciki.com', 'manager@ciki.com'],
            format: 'pdf',
            active: true
        },
        {
            id: 2,
            templateId: 2,
            name: 'รายงานสถิติผู้ป่วยรายสัปดาห์',
            schedule: 'weekly',
            nextRun: '2024-03-25',
            recipients: ['marketing@ciki.com'],
            format: 'excel',
            active: true
        }
    ]);

    // Report History
    const [reportHistory, setReportHistory] = useState([
        {
            id: 1,
            name: 'รายงานรายได้เดือนกุมภาพันธ์ 2567',
            type: 'financial',
            generatedAt: '2024-03-01 09:00',
            generatedBy: 'หมออ้อม',
            format: 'pdf',
            size: '2.4 MB',
            status: 'completed'
        },
        {
            id: 2,
            name: 'รายงานสถิติผู้ป่วยเดือนกุมภาพันธ์ 2567',
            type: 'patient',
            generatedAt: '2024-03-01 10:30',
            generatedBy: 'ระบบอัตโนมัติ',
            format: 'excel',
            size: '1.8 MB',
            status: 'completed'
        }
    ]);

    const availableMetrics = {
        revenue: { TH: 'รายได้', EN: 'Revenue' },
        profit: { TH: 'กำไร', EN: 'Profit' },
        expenses: { TH: 'รายจ่าย', EN: 'Expenses' },
        patient_count: { TH: 'จำนวนผู้ป่วย', EN: 'Patient Count' },
        new_patients: { TH: 'ผู้ป่วยใหม่', EN: 'New Patients' },
        appointment_count: { TH: 'จำนวนนัดหมาย', EN: 'Appointment Count' },
        treatment_count: { TH: 'จำนวนการรักษา', EN: 'Treatment Count' },
        satisfaction: { TH: 'ความพึงพอใจ', EN: 'Satisfaction Score' },
        show_rate: { TH: 'อัตราการมานัด', EN: 'Show Rate' },
        average_transaction: { TH: 'มูลค่าธุรกรรมเฉลี่ยว', EN: 'Average Transaction' }
    };

    const dataSources = {
        all: { TH: 'ทั้งหมด', EN: 'All Data' },
        patients: { TH: 'ข้อมูลผู้ป่วย', EN: 'Patient Data' },
        appointments: { TH: 'ข้อมูลนัดหมาย', EN: 'Appointment Data' },
        billing: { TH: 'ข้อมูลการเงิน', EN: 'Billing Data' },
        inventory: { TH: 'ข้อมูลสต็อก', EN: 'Inventory Data' },
        expenses: { TH: 'ข้อมูลรายจ่าย', EN: 'Expense Data' }
    };

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = () => {
        // จำลองการโหลดข้อมูลรายงาน
        console.log('Loading report data...');
    };

    const generateReport = async () => {
        setIsGenerating(true);
        
        try {
            // จำลองการสร้างรายงาน
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockData = {
                summary: {
                    totalRevenue: 1250000,
                    totalExpenses: 450000,
                    netProfit: 800000,
                    totalPatients: 1240,
                    newPatients: 85,
                    totalAppointments: 2100,
                    averageTransaction: 595
                },
                details: [
                    { date: '2024-03-01', revenue: 45000, patients: 15, appointments: 25 },
                    { date: '2024-03-02', revenue: 52000, patients: 18, appointments: 28 },
                    { date: '2024-03-03', revenue: 48000, patients: 16, appointments: 26 }
                ],
                charts: {
                    revenueTrend: [45000, 52000, 48000, 55000, 51000],
                    patientDemographics: { new: 85, returning: 1155 },
                    treatmentTypes: { cleaning: 45, filling: 30, extraction: 15, other: 10 }
                }
            };
            
            setReportData(mockData);
            
            // เพิ่มลงประวัติ
            const newHistory = {
                id: Date.now(),
                name: reportConfig.name || 'Custom Report',
                type: reportConfig.type,
                generatedAt: new Date().toLocaleString(),
                generatedBy: 'Current User',
                format: reportConfig.exportFormat,
                size: '1.2 MB',
                status: 'completed'
            };
            setReportHistory([newHistory, ...reportHistory]);
            
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const saveReportTemplate = () => {
        const newTemplate = {
            id: Date.now(),
            name: reportConfig.name,
            description: reportConfig.description,
            type: reportConfig.type,
            dataSource: reportConfig.dataSource,
            frequency: 'manual',
            metrics: reportConfig.metrics,
            charts: reportConfig.charts,
            active: true
        };
        
        setReportTemplates([...reportTemplates, newTemplate]);
        
        // รีเซ็ตฟอร์ม
        setReportConfig({
            name: '',
            description: '',
            type: 'summary',
            dataSource: 'all',
            dateRange: 'month',
            metrics: [],
            charts: ['table']
        });
    };

    const deleteReportTemplate = (id) => {
        if (confirm(language === 'TH' ? 'ยืนยันการลบเทมเพลตรายงาน?' : 'Confirm report template deletion?')) {
            setReportTemplates(reportTemplates.filter(template => template.id !== id));
        }
    };

    const exportReport = (format) => {
        // จำลองการส่งออกรายงาน
        console.log(`Exporting report as ${format}...`);
        
        // สร้างข้อมูลจำลอง
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const MetricSelector = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                {language === 'TH' ? 'เลือกตัวชี้วัด' : 'Select Metrics'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {Object.entries(availableMetrics).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--neutral-200)', borderRadius: '6px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={reportConfig.metrics.includes(key)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setReportConfig(prev => ({ ...prev, metrics: [...prev.metrics, key] }));
                                } else {
                                    setReportConfig(prev => ({ ...prev, metrics: prev.metrics.filter(m => m !== key) }));
                                }
                            }}
                        />
                        <span style={{ fontSize: '0.875rem' }}>{label[language]}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    const ReportPreview = () => {
        if (!reportData) return null;
        
        return (
            <div style={{ marginTop: '2rem' }}>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                            ฿{reportData.summary.totalRevenue.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}
                        </div>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                            ฿{reportData.summary.netProfit.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'กำไรสุทธิ' : 'Net Profit'}
                        </div>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                            {reportData.summary.totalPatients.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'ผู้ป่วยทั้งหมด' : 'Total Patients'}
                        </div>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                            {reportData.summary.newPatients}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'ผู้ป่วยใหม่' : 'New Patients'}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div style={{ background: 'white', border: '1px solid var(--neutral-200)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Database size={16} />
                            {language === 'TH' ? 'ข้อมูลละเอียด' : 'Detailed Data'}
                        </h4>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'วันที่' : 'Date'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'รายได้' : 'Revenue'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ผู้ป่วย' : 'Patients'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'นัดหมาย' : 'Appointments'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.details.map((row, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '1rem' }}>{row.date}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                            ฿{row.revenue.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{row.patients}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{row.appointments}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    if (!isAdmin) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <FileText size={48} color="var(--neutral-400)" />
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
        <div className="advanced-reports" style={{ padding: '2rem' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={32} color="var(--primary-600)" />
                        {language === 'TH' ? 'รายงานขั้นสูง' : 'Advanced Reports'}
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCw size={18} />
                            {language === 'TH' ? 'รีเฟรช' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
                    {[
                        { id: 'builder', label: { TH: 'สร้างรายงาน', EN: 'Report Builder' } },
                        { id: 'templates', label: { TH: 'เทมเพลต', EN: 'Templates' } },
                        { id: 'scheduled', label: { TH: 'ตั้งเวลา', EN: 'Scheduled' } },
                        { id: 'history', label: { TH: 'ประวัติ', EN: 'History' } }
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

            {/* Report Builder Tab */}
            {activeTab === 'builder' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'สร้างรายงานแบบกำหนดเอง' : 'Custom Report Builder'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Configuration */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {language === 'TH' ? 'ชื่อรายงาน' : 'Report Name'}
                                </label>
                                <input
                                    type="text"
                                    value={reportConfig.name}
                                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={language === 'TH' ? 'ระบุชื่อรายงาน...' : 'Enter report name...'}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {language === 'TH' ? 'รายละเอียด' : 'Description'}
                                </label>
                                <textarea
                                    value={reportConfig.description}
                                    onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder={language === 'TH' ? 'รายละเอียดรายงาน...' : 'Enter report description...'}
                                    rows={3}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {language === 'TH' ? 'แหล่งข้อมูล' : 'Data Source'}
                                </label>
                                <select
                                    value={reportConfig.dataSource}
                                    onChange={(e) => setReportConfig(prev => ({ ...prev, dataSource: e.target.value }))}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)',
                                        background: 'white'
                                    }}
                                >
                                    {Object.entries(dataSources).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label[language]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {language === 'TH' ? 'ช่วงเวลา' : 'Date Range'}
                                </label>
                                <select
                                    value={reportConfig.dateRange}
                                    onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                                    style={{ 
                                        width: '100%', 
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
                                    <option value="custom">{language === 'TH' ? 'กำหนดเอง' : 'Custom Range'}</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <MetricSelector />
                            
                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {language === 'TH' ? 'รูปแบบกราฟ' : 'Chart Types'}
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['table', 'bar', 'pie', 'line'].map(chart => (
                                        <label key={chart} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--neutral-200)', borderRadius: '6px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={reportConfig.charts.includes(chart)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setReportConfig(prev => ({ ...prev, charts: [...prev.charts, chart] }));
                                                    } else {
                                                        setReportConfig(prev => ({ ...prev, charts: prev.charts.filter(c => c !== chart) }));
                                                    }
                                                }}
                                            />
                                            <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{chart}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--neutral-200)' }}>
                        <button 
                            onClick={saveReportTemplate}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Save size={18} />
                            {language === 'TH' ? 'บันทึกเป็นเทมเพลต' : 'Save as Template'}
                        </button>
                        
                        <button 
                            onClick={generateReport}
                            disabled={isGenerating || !reportConfig.name || reportConfig.metrics.length === 0}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                                    {language === 'TH' ? 'กำลังสร้าง...' : 'Generating...'}
                                </>
                            ) : (
                                <>
                                    <Target size={18} />
                                    {language === 'TH' ? 'สร้างรายงาน' : 'Generate Report'}
                                </>
                            )}
                        </button>
                    </div>
                    
                    {/* Report Preview */}
                    {reportData && <ReportPreview />}
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'เทมเพลตรายงาน' : 'Report Templates'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {reportTemplates.map(template => (
                            <div key={template.id} style={{
                                padding: '1.5rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                background: 'white',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{template.name[language]}</h4>
                                        <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                            {template.description[language]}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: '#f3f4f6',
                                                color: '#6b7280'
                                            }}>
                                                {template.type}
                                            </span>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: template.active ? '#dcfce7' : '#fee2e2',
                                                color: template.active ? '#16a34a' : '#dc2626'
                                            }}>
                                                {template.active ? (language === 'TH' ? 'ใช้งาน' : 'Active') : (language === 'TH' ? 'ไม่ใช้งาน' : 'Inactive')}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                            <Eye size={16} />
                                        </button>
                                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => deleteReportTemplate(template.id)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    <div style={{ marginBottom: '0.25rem' }}>
                                        {language === 'TH' ? 'แหล่งข้อมูล:' : 'Data Source:'} {dataSources[template.dataSource]?.[language]}
                                    </div>
                                    <div style={{ marginBottom: '0.25rem' }}>
                                        {language === 'TH' ? 'ความถี่:' : 'Frequency:'} {template.frequency}
                                    </div>
                                    <div>
                                        {language === 'TH' ? 'ตัวชี้วัด:' : 'Metrics:'} {template.metrics.map(m => availableMetrics[m]?.[language]).join(', ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Scheduled Reports Tab */}
            {activeTab === 'scheduled' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'รายงานตั้งเวลา' : 'Scheduled Reports'}
                    </h3>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ชื่อรายงาน' : 'Report Name'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ตั้งเวลา' : 'Schedule'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'รันครั้ง' : 'Next Run'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ผู้รับ' : 'Recipients'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {language === 'TH' ? 'สถานะ' : 'Status'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {language === 'TH' ? 'จัดการ' : 'Actions'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {scheduledReports.map(report => (
                                    <tr key={report.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '1rem' }}>{report.name}</td>
                                        <td style={{ padding: '1rem' }}>{report.schedule}</td>
                                        <td style={{ padding: '1rem' }}>{report.nextRun}</td>
                                        <td style={{ padding: '1rem' }}>{report.recipients.join(', ')}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: report.active ? '#dcfce7' : '#fee2e2',
                                                color: report.active ? '#16a34a' : '#dc2626'
                                            }}>
                                                {report.active ? (language === 'TH' ? 'ใช้งาน' : 'Active') : (language === 'TH' ? 'หยุด' : 'Paused')}
                                            </span>
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

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ประวัติรายงาน' : 'Report History'}
                    </h3>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ชื่อรายงาน' : 'Report Name'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'สร้างเมื่อ' : 'Generated'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'สร้างโดย' : 'Generated By'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'รูปแบบ' : 'Format'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ขนาด' : 'Size'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {language === 'TH' ? 'สถานะ' : 'Status'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {language === 'TH' ? 'จัดการ' : 'Actions'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportHistory.map(report => (
                                    <tr key={report.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{report.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                                                    {report.type}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{report.generatedAt}</td>
                                        <td style={{ padding: '1rem' }}>{report.generatedBy}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: '#f3f4f6',
                                                color: '#6b7280',
                                                textTransform: 'uppercase'
                                            }}>
                                                {report.format}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{report.size}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: report.status === 'completed' ? '#dcfce7' : '#fee2e2',
                                                color: report.status === 'completed' ? '#16a34a' : '#dc2626'
                                            }}>
                                                {report.status === 'completed' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                                {report.status === 'completed' ? (language === 'TH' ? 'สำเร็จ' : 'Completed') : (language === 'TH' ? 'ล้มเหลว' : 'Failed')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                                                    <Eye size={14} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                                                    <Download size={14} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                                                    <Mail size={14} />
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
        </div>
    );
};

export default AdvancedReports;
