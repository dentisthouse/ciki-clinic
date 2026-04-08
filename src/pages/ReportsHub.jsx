import React, { useState } from 'react';
import { 
    FileText, 
    DollarSign, 
    Users, 
    Activity, 
    Box, 
    TrendingUp, 
    Calendar, 
    Download, 
    Search,
    ChevronRight,
    PieChart,
    BarChart3
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ReportsHub = () => {
    const { language, t } = useLanguage();
    const [activeSection, setActiveSection] = useState('financial');

    const reportCategories = [
        { id: 'financial', icon: DollarSign, label: language === 'TH' ? 'รายงานการเงิน' : 'Financial Reports' },
        { id: 'clinical', icon: Activity, label: language === 'TH' ? 'รายงานแพทย์และหัตถการ' : 'Clinical Reports' },
        { id: 'patients', icon: Users, label: language === 'TH' ? 'รายงานคนไข้' : 'Patient Reports' },
        { id: 'inventory', icon: Box, label: language === 'TH' ? 'รายงานคลังสินค้า' : 'Inventory Reports' },
        { id: 'appointments', icon: Calendar, label: language === 'TH' ? 'รายงานการนัดหมาย' : 'Appointment Reports' },
        { id: 'custom', icon: PieChart, label: language === 'TH' ? 'สร้างรายงาน (Custom)' : 'Custom Builder' }
    ];

    const mockFinancialReports = [
        { id: 1, name: 'รายงานสรุปยอดรายรับประจำวัน', desc: 'ยอดชำระเงินแยกตามช่องทาง (เงินสด, โอนเงิน, บัตรเครดิต)' },
        { id: 2, name: 'รายงานลูกหนี้ค้างชำระ', desc: 'รายการที่ยังไม่ได้ชำระเงินทั้งหมด เพื่อการติดตามหนี้' },
        { id: 3, name: 'รายงานสรุปรายได้ตามสาขา', desc: 'เปรียบเทียบยอดขายสุทธิในแต่ละสาขา' },
        { id: 4, name: 'รายงานสรุปค่าใช้จ่ายคลินิก', desc: 'รายการเบิกจ่ายและเอกสารค่าใช้จ่ายทั้งหมด' }
    ];

    const mockClinicalReports = [
        { id: 1, name: 'รายงานค่าตอบแทนแพทย์ (DF)', desc: 'ส่วนแบ่งและค่ามือของแพทย์ที่ทำหัตถการ' },
        { id: 2, name: 'รายงานความนิยมของหัตถการ', desc: 'จำนวนสรุปรายหัตถการที่ให้บริการในแต่ละวัน/เดือน' },
        { id: 3, name: 'รายงานส่งแล็บ', desc: 'สถานะงานแล็บที่ดำเนินการและยังค้างอยู่' }
    ];

    const renderReportList = (reports) => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {reports.map((report) => (
                <div key={report.id} className="card" style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-400)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                    <div>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '10px', 
                            background: 'var(--primary-50)', color: 'var(--primary-600)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '1rem'
                        }}>
                            <FileText size={20} />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: '0.5rem' }}>
                            {report.name}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', lineHeight: '1.5' }}>
                            {report.desc}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                        <button style={{ 
                            flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--primary-200)', 
                            background: 'white', color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.8rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}>
                            <Search size={14} /> {language === 'TH' ? 'ดูรายงาน' : 'View'}
                        </button>
                        <button style={{ 
                            flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', 
                            background: 'var(--primary-600)', color: 'white', fontWeight: 600, fontSize: '0.8rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}>
                            <Download size={14} /> {language === 'TH' ? 'ส่งออก' : 'Export'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
        switch(activeSection) {
            case 'financial':
                return (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
                            {language === 'TH' ? 'รายงานการเงิน' : 'Financial Reports'}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {language === 'TH' ? 'ดูและส่งออกรายงานสรุปยอดทางการเงินของคลินิก' : 'View and export clinic financial summaries.'}
                        </p>
                        {renderReportList(mockFinancialReports)}
                    </div>
                );
            case 'clinical':
                return (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
                            {language === 'TH' ? 'รายงานแพทย์และหัตถการ' : 'Clinical Reports'}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {language === 'TH' ? 'ตรวจสอบสถิติการรักษาและส่วนแบ่งแพทย์' : 'Review treatment statistics and doctor commissions.'}
                        </p>
                        {renderReportList(mockClinicalReports)}
                    </div>
                );
            case 'custom':
                return (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                        <BarChart3 size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--neutral-700)' }}>{language === 'TH' ? 'Advanced Report Builder' : 'Custom Report Builder'}</h3>
                        <p>{language === 'TH' ? 'คุณสามารถเลือกฟิลด์ข้อมูลที่ต้องการมาสร้างรายงานเองได้เร็วๆ นี้' : 'Custom dynamic reporting is coming soon.'}</p>
                    </div>
                );
            default:
                return (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                        <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                        <h3>{language === 'TH' ? 'กำลังดึงข้อมูลรายงาน...' : 'Loading Data...'}</h3>
                        <p>{language === 'TH' ? 'โมดูลนี้อยู่ระหว่างการปรับปรุง' : 'This section is under maintenance.'}</p>
                    </div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: '#f8fafc', margin: '-1.5rem' }}>
            {/* Sidebar Menu for Reports */}
            <div style={{ 
                width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', 
                display: 'flex', flexDirection: 'column', padding: '1.5rem 0'
            }}>
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 color="var(--primary-500)" />
                        Reports Hub
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Comprehensive Clinic Analytics</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 1rem', overflowY: 'auto' }}>
                    {reportCategories.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 16px', borderRadius: '12px', border: 'none',
                                background: activeSection === sec.id ? 'var(--primary-50)' : 'transparent',
                                color: activeSection === sec.id ? 'var(--primary-700)' : '#475569',
                                fontWeight: activeSection === sec.id ? 700 : 500,
                                cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left'
                            }}
                        >
                            <sec.icon size={18} color={activeSection === sec.id ? 'var(--primary-600)' : '#94a3b8'} />
                            <span style={{ flex: 1 }}>{sec.label}</span>
                            {activeSection === sec.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f4f7fb' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default ReportsHub;
