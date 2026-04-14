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
import '../styles/reports.css';

const AdvancedReports = () => {
    const { language } = useLanguage();
    const { appointments, patients, invoices, expenses, inventory } = useData();
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
        average_transaction: { TH: 'มูลค่าธุรกรรมเฉลี่ย', EN: 'Average Transaction' }
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
            // Simulate generation latency for UX feels
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // --- Real Data Engine ---
            const totalRevenue = (invoices || []).reduce((sum, i) => sum + (i.amount || 0), 0);
            const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
            const totalPatients = (patients || []).length;
            const newPatients = (patients || []).filter(p => {
                const regDate = new Date(p.createdAt || Date.now());
                return regDate.getMonth() === new Date().getMonth();
            }).length;
            const totalAppts = (appointments || []).length;
            
            // Map timeline (last 7 days for detail view)
            const details = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                const dayBills = (invoices || []).filter(inv => (inv.date || '').includes(dStr));
                const dayAppts = (appointments || []).filter(apt => (apt.date || '').includes(dStr));
                details.push({
                    date: dStr,
                    revenue: dayBills.reduce((s, b) => s + (b.amount || 0), 0),
                    patients: new Set(dayAppts.map(a => a.patientId)).size,
                    appointments: dayAppts.length
                });
            }

            // Treatment distribution
            const treatmentTypes = {};
            (appointments || []).forEach(apt => {
                const type = apt.procedure || apt.treatment || 'Other';
                treatmentTypes[type] = (treatmentTypes[type] || 0) + 1;
            });

            const realData = {
                summary: {
                    totalRevenue,
                    totalExpenses,
                    netProfit: totalRevenue - totalExpenses,
                    totalPatients,
                    newPatients,
                    totalAppointments: totalAppts,
                    averageTransaction: totalAppts > 0 ? totalRevenue / totalAppts : 0
                },
                details,
                charts: {
                    revenueTrend: details.map(d => d.revenue),
                    patientDemographics: { new: newPatients, returning: totalPatients - newPatients },
                    treatmentTypes
                }
            };
            
            setReportData(realData);
            
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
        <div className="config-section">
            <label>{language === 'TH' ? 'ตัวชี้วัด' : 'Report Metrics'}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {Object.entries(availableMetrics).map(([key, label]) => (
                    <label key={key} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.65rem', 
                        padding: '0.85rem', 
                        border: '1px solid var(--neutral-100)', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        background: reportConfig.metrics.includes(key) ? '#f5f3ff' : 'var(--neutral-50)',
                        border: reportConfig.metrics.includes(key) ? '1px solid #7c3aed' : '1px solid var(--neutral-100)',
                        transition: 'all 0.2s ease'
                    }}>
                        <input
                            type="checkbox"
                            style={{ accentColor: '#7c3aed' }}
                            checked={reportConfig.metrics.includes(key)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setReportConfig(prev => ({ ...prev, metrics: [...prev.metrics, key] }));
                                } else {
                                    setReportConfig(prev => ({ ...prev, metrics: prev.metrics.filter(m => m !== key) }));
                                }
                            }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 850, color: reportConfig.metrics.includes(key) ? '#7c3aed' : 'var(--neutral-600)' }}>
                            {label[language]}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );

    const ReportPreview = () => {
        if (!reportData) return null;
        
        return (
            <div className="report-content-area animate-fade-in">
                {/* Summary Cards */}
                <div className="report-stat-grid">
                    <div className="report-stat-card">
                        <div className="stat-value" style={{ color: '#4f46e5' }}>
                            ฿{reportData.summary.totalRevenue.toLocaleString()}
                        </div>
                        <div className="stat-label">
                            {language === 'TH' ? 'รายได้รวม' : 'Gross Revenue'}
                        </div>
                    </div>
                    <div className="report-stat-card">
                        <div className="stat-value" style={{ color: '#059669' }}>
                            ฿{reportData.summary.netProfit.toLocaleString()}
                        </div>
                        <div className="stat-label">
                            {language === 'TH' ? 'กำไรสุทธิ' : 'Net Operating Income'}
                        </div>
                    </div>
                    <div className="report-stat-card">
                        <div className="stat-value" style={{ color: '#3b82f6' }}>
                            {reportData.summary.totalPatients.toLocaleString()}
                        </div>
                        <div className="stat-label">
                            {language === 'TH' ? 'ผู้ป่วยทั้งหมด' : 'Global Patient Base'}
                        </div>
                    </div>
                    <div className="report-stat-card">
                        <div className="stat-value" style={{ color: '#d97706' }}>
                            {reportData.summary.newPatients}
                        </div>
                        <div className="stat-label">
                            {language === 'TH' ? 'ผู้ป่วยใหม่' : 'New Acquisitions'}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="report-preview-glass" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--neutral-50)', background: 'var(--neutral-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Database size={20} color="#4f46e5" />
                            {language === 'TH' ? 'ข้อมูลรายละเอียดเชิงลึก' : 'Granular Performance Data'}
                        </h4>
                        <button onClick={() => exportReport('pdf')} className="btn-billing secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                            <Download size={14} />
                            Export PDF
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="report-premium-table">
                            <thead>
                                <tr>
                                    <th>{language === 'TH' ? 'วันที่' : 'Metric Date'}</th>
                                    <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'รายได้' : 'Revenue'}</th>
                                    <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ผู้ป่วย' : 'Patients'}</th>
                                    <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'นัดหมาย' : 'Cases'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.details.map((row, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: 800 }}>{row.date}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 950, color: 'var(--neutral-900)' }}>
                                            ฿{row.revenue.toLocaleString()}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.patients}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.appointments}</td>
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
            <div className="report-status-screen animate-fade-in">
                <div className="status-icon-box">
                    <FileText size={48} />
                </div>
                <h2>{language === 'TH' ? 'เข้าถึงไม่ได้' : 'Access Denied'}</h2>
                <p>{language === 'TH' ? 'หน้านี้สำหรับ Owner/Admin เท่านั้น' : 'This page is for Owner/Admin only'}</p>
                <button className="report-primary-btn" onClick={() => window.history.back()}>
                    {language === 'TH' ? 'กลับไปหน้าหลัก' : 'Return to Dashboard'}
                </button>
            </div>
        );
    }

    return (
        <div className="reports-modern-container">
            {/* Header */}
            <header className="report-hub-header animate-slide-down">
                <div className="report-info-cluster">
                    <div className="report-icon-cube">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1>{language === 'TH' ? 'รายงานขั้นสูง' : 'Advanced Reports'}</h1>
                        <p className="report-subtitle">
                            {language === 'TH' ? 'วิเคราะห์ข้อมูลเชิงลึกและประสิทธิภาพของคลินิก' : 'Analyze insights and institutional performance metrics'}
                        </p>
                    </div>
                </div>

                <div className="report-action-group">
                    <button className="report-secondary-btn">
                        <RefreshCw size={18} />
                        <span>{language === 'TH' ? 'รีเฟรช' : 'Refresh'}</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <nav className="report-tab-rail">
                {[
                    { id: 'builder', label: { TH: 'สร้างรายงาน', EN: 'Report Builder' } },
                    { id: 'templates', label: { TH: 'เทมเพลต', EN: 'Templates' } },
                    { id: 'scheduled', label: { TH: 'ตั้งเวลา', EN: 'Scheduled' } },
                    { id: 'history', label: { TH: 'ประวัติ', EN: 'History' } }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`report-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label[language]}
                    </button>
                ))}
            </nav>

            {/* Report Builder Tab */}
            {activeTab === 'builder' && (
                <div className="report-builder-grid animate-fade-in">
                    {/* Configuration */}
                    <div className="report-config-card">
                        <div className="config-section">
                            <label>{language === 'TH' ? 'ชื่อรายงาน' : 'Model Identifier'}</label>
                            <input
                                type="text"
                                className="config-input"
                                value={reportConfig.name}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={language === 'TH' ? 'โปรดระบุชื่อรุ่นรายงาน...' : 'Enter target model name...'}
                            />
                        </div>
                        
                        <div className="config-section">
                            <label>{language === 'TH' ? 'รายละเอียดวัตถุประสงค์' : 'Business Logic Target'}</label>
                            <textarea
                                className="config-textarea"
                                value={reportConfig.description}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                                placeholder={language === 'TH' ? 'ระบุขอบเขตการคำนวณ...' : 'Define analysis objective...'}
                                rows={3}
                            />
                        </div>
                        
                        <div className="config-section">
                            <label>{language === 'TH' ? 'คลังข้อมูลหลัก' : 'Primary Dataset'}</label>
                            <select
                                className="config-select"
                                value={reportConfig.dataSource}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, dataSource: e.target.value }))}
                            >
                                {Object.entries(dataSources).map(([key, label]) => (
                                    <option key={key} value={key}>{label[language]}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="config-section">
                            <label>{language === 'TH' ? 'ขอบเขตเวลาวิเคราะห์' : 'Temporal Horizon'}</label>
                            <select
                                className="config-select"
                                value={reportConfig.dateRange}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                            >
                                <option value="today">{language === 'TH' ? 'วันนี้' : 'Today'}</option>
                                <option value="week">{language === 'TH' ? 'สัปดาห์ปัจจุบัน' : 'Current Week'}</option>
                                <option value="month">{language === 'TH' ? 'เดือนปัจจุบัน' : 'Current Month'}</option>
                                <option value="quarter">{language === 'TH' ? 'ไตรมาสปัจจุบัน' : 'Fiscal Quarter'}</option>
                                <option value="year">{language === 'TH' ? 'ปีงบประมาณ' : 'Fiscal Year'}</option>
                                <option value="custom">{language === 'TH' ? 'ช่วงเวลากำหนดเอง' : 'Custom Interval'}</option>
                            </select>
                        </div>

                        <MetricSelector />

                        <div className="config-section">
                            <label>{language === 'TH' ? 'รูปแบบการนำเสนอ' : 'Visualization Type'}</label>
                            <div className="vis-type-grid">
                                {['table', 'bar', 'pie', 'line'].map(chart => (
                                    <label key={chart} className={`vis-type-pill ${reportConfig.charts.includes(chart) ? 'active' : ''}`}>
                                        <input
                                            type="checkbox"
                                            hidden
                                            checked={reportConfig.charts.includes(chart)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setReportConfig(prev => ({ ...prev, charts: [...prev.charts, chart] }));
                                                } else {
                                                    setReportConfig(prev => ({ ...prev, charts: prev.charts.filter(c => c !== chart) }));
                                                }
                                            }}
                                        />
                                        <span>{chart.toUpperCase()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="builder-actions">
                            <button onClick={saveReportTemplate} className="report-secondary-btn">
                                <Save size={18} />
                                {language === 'TH' ? 'บันทึก' : 'Save'}
                            </button>
                            <button 
                                onClick={generateReport} 
                                disabled={isGenerating || !reportConfig.name || reportConfig.metrics.length === 0} 
                                className="report-primary-btn"
                            >
                                {isGenerating ? (
                                    <div className="report-spinner" />
                                ) : (
                                    <>
                                        <Activity size={18} />
                                        {language === 'TH' ? 'ประมวลผล' : 'Execute Analysis'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="report-preview-canvas">
                        {reportData ? <ReportPreview /> : (
                            <div className="report-empty-preview">
                                <div className="empty-preview-icon">
                                    <TrendingUp size={40} />
                                </div>
                                <h3>{language === 'TH' ? 'พร้อมสำหรับการวิเคราะห์' : 'Ready for Analysis'}</h3>
                                <p>
                                    {language === 'TH' ? 'กำหนดพารามิเตอร์ด้านซ้ายเพื่อสร้างรายงานเชิงลึก' : 'Configure analysis parameters in the studio to generate intelligence reports.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="templates-grid animate-fade-in">
                    {reportTemplates.map(template => (
                        <div key={template.id} className="template-card">
                            <div className="template-icon-row">
                                <div className="template-type-icon">
                                    {template.type === 'financial' ? <DollarSign size={24} /> : 
                                     template.type === 'patient' ? <Users size={24} /> : 
                                     template.type === 'performance' ? <Activity size={24} /> : 
                                     <PieChart size={24} />}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-adj" style={{ padding: '8px' }}>
                                        <Eye size={16} />
                                    </button>
                                    <button onClick={() => deleteReportTemplate(template.id)} className="btn-adj" style={{ padding: '8px', color: '#dc2626', background: '#fef2f2' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="template-content">
                                <h4>{template.name[language]}</h4>
                                <p className="template-desc">{template.description[language]}</p>
                                
                                <div style={{ borderTop: '1px dashed var(--neutral-100)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {template.metrics.slice(0, 3).map(m => (
                                            <span key={m} style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--neutral-400)', background: 'var(--neutral-50)', padding: '4px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>
                                                {availableMetrics[m]?.[language]}
                                            </span>
                                        ))}
                                        {template.metrics.length > 3 && <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--neutral-400)' }}>+{template.metrics.length - 3}</span>}
                                    </div>
                                    <button className="btn-billing primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', border: 'none', background: '#f5f3ff', color: '#7c3aed' }}>
                                        {language === 'TH' ? 'เตรียมใช้งาน' : 'Deploy Model'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Scheduled Reports Tab */}
            {activeTab === 'scheduled' && (
                <div className="report-preview-glass animate-fade-in" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 950, color: 'var(--neutral-900)' }}>
                        <Clock size={24} color="#4f46e5" />
                        {language === 'TH' ? 'กำหนดการส่งรายงานอัตโนมัติ' : 'Automated Sequence Control'}
                    </h3>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table className="report-premium-table">
                            <thead>
                                <tr>
                                    <th>{language === 'TH' ? 'ชื่อรายงาน' : 'Sequence Name'}</th>
                                    <th>{language === 'TH' ? 'กำหนดการ' : 'Frequency'}</th>
                                    <th>{language === 'TH' ? 'รอบถัดไป' : 'Next Execution'}</th>
                                    <th>{language === 'TH' ? 'ผู้รับปลายทาง' : 'Recipients'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'สถานะ' : 'State'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'จัดการ' : 'Command'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scheduledReports.map(report => (
                                    <tr key={report.id}>
                                        <td style={{ fontWeight: 900, color: 'var(--neutral-900)' }}>{report.name}</td>
                                        <td style={{ fontWeight: 700 }}>{report.schedule}</td>
                                        <td style={{ fontWeight: 800 }}>{report.nextRun}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{report.recipients.join(', ')}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '30px',
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                background: report.active ? '#ecfdf5' : '#fef2f2',
                                                color: report.active ? '#059669' : '#dc2626',
                                                border: `1px solid ${report.active ? '#059669' : '#dc2626'}30`
                                            }}>
                                                {report.active ? 'ACTIVE' : 'IDLE'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
                                                <button className="btn-adj" style={{ padding: '6px' }}>
                                                    <Edit3 size={14} />
                                                </button>
                                                <button className="btn-adj" style={{ padding: '6px', color: '#dc2626', background: '#fef2f2' }}>
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
                <div className="report-preview-glass animate-fade-in" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 950, color: 'var(--neutral-900)' }}>
                        <Activity size={24} color="#4f46e5" />
                        {language === 'TH' ? 'คลังรายงานที่สร้างแล้ว' : 'Institutional Report Archive'}
                    </h3>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table className="report-premium-table">
                            <thead>
                                <tr>
                                    <th>{language === 'TH' ? 'รายงาน' : 'Model Identifier'}</th>
                                    <th>{language === 'TH' ? 'ความถี่/สร้างเมื่อ' : 'Source / Generated'}</th>
                                    <th>{language === 'TH' ? 'รูปแบบ/ขนาด' : 'Protocol / Payload'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'สถานะ' : 'State'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'จัดการ' : 'Command'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportHistory.map(report => (
                                    <tr key={report.id}>
                                        <td>
                                            <div style={{ fontWeight: 900, color: 'var(--neutral-900)' }}>{report.name}</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-400)' }}>{report.generatedBy}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{report.type}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{report.generatedAt}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800 }}>{report.format.toUpperCase()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{report.size}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '30px',
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                background: report.status === 'completed' ? '#ecfdf5' : '#fef2f2',
                                                color: report.status === 'completed' ? '#059669' : '#dc2626',
                                                border: `1px solid ${report.status === 'completed' ? '#059669' : '#dc2626'}30`
                                            }}>
                                                {report.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
                                                <button className="btn-adj" style={{ padding: '6px' }}>
                                                    <Download size={14} />
                                                </button>
                                                <button className="btn-adj" style={{ padding: '6px', color: '#dc2626', background: '#fef2f2' }}>
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
        </div>
    );
};

export default AdvancedReports;
