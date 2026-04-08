import React, { useState } from 'react';
import { Settings, Users, Stethoscope, Bed, CreditCard, Box, PieChart, Shield, HelpCircle, ChevronRight, Search, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ManagementHub = () => {
    const { language, t } = useLanguage();
    const [activeSection, setActiveSection] = useState('dashboard');

    const sections = [
        { id: 'dashboard', icon: PieChart, label: language === 'TH' ? 'ภาพรวมระบบ' : 'Dashboard' },
        { id: 'clinic', icon: Settings, label: language === 'TH' ? 'ข้อมูลคลินิก' : 'Clinic Info' },
        { id: 'staff', icon: Users, label: language === 'TH' ? 'จัดการพนักงาน' : 'Staff Management' },
        { id: 'services', icon: Stethoscope, label: language === 'TH' ? 'หัตถการและราคา' : 'Services & Pricing' },
        { id: 'rooms', icon: Bed, label: language === 'TH' ? 'จัดการห้องตรวจ' : 'Room Management' },
        { id: 'inventory', icon: Box, label: language === 'TH' ? 'จัดการคลังยา' : 'Inventory Settings' },
        { id: 'billing', icon: CreditCard, label: language === 'TH' ? 'ช่องทางชำระเงิน' : 'Payment Methods' },
        { id: 'roles', icon: Shield, label: language === 'TH' ? 'สิทธิ์การใช้งาน' : 'Roles & Permissions' }
    ];

    const mockStaff = [
        { id: 1, name: 'พญ. สมหญิง รักษ์ดี', role: 'ทันตแพทย์', status: 'Active' },
        { id: 2, name: 'นพ. สมเกียรติ รักษาการ', role: 'ทันตแพทย์', status: 'Active' },
        { id: 3, name: 'สมใจ บริการ', role: 'ผู้ช่วยทันตแพทย์', status: 'Inactive' }
    ];

    const renderContent = () => {
        switch(activeSection) {
            case 'dashboard':
                return (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--neutral-800)' }}>
                            {language === 'TH' ? 'ภาพรวมระบบ' : 'System Dashboard'}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--primary-500)' }}>
                                <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem', fontWeight: 600 }}>{language === 'TH' ? 'พนักงานทั้งหมด' : 'Total Staff'}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-700)' }}>24 <span style={{ fontSize: '1rem', color: 'var(--neutral-400)', fontWeight: 500 }}>คน</span></div>
                            </div>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #10b981' }}>
                                <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem', fontWeight: 600 }}>{language === 'TH' ? 'ผู้ป่วยที่ใช้งาน' : 'Active Patients'}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857' }}>1,204 <span style={{ fontSize: '1rem', color: 'var(--neutral-400)', fontWeight: 500 }}>ราย</span></div>
                            </div>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #f59e0b' }}>
                                <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem', fontWeight: 600 }}>{language === 'TH' ? 'หัตถการในระบบ' : 'Services'}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#b45309' }}>86 <span style={{ fontSize: '1rem', color: 'var(--neutral-400)', fontWeight: 500 }}>รายการ</span></div>
                            </div>
                        </div>
                    </div>
                );
            case 'staff':
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
                                {language === 'TH' ? 'จัดการพนักงาน' : 'Staff Management'}
                            </h2>
                            <button className="btn btn-primary" style={{ background: 'var(--primary-600)' }}>
                                <Plus size={18} style={{ marginRight: '8px' }} /> {language === 'TH' ? 'เพิ่มพนักงาน' : 'Add Staff'}
                            </button>
                        </div>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', gap: '1rem' }}>
                                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                                    <input 
                                        type="text" 
                                        placeholder={language === 'TH' ? 'ค้นหาพนักงาน...' : 'Search staff...'} 
                                        className="form-input"
                                        style={{ paddingLeft: '32px' }}
                                    />
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>{language === 'TH' ? 'ชื่อ' : 'Name'}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>{language === 'TH' ? 'ตำแหน่ง' : 'Role'}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>{language === 'TH' ? 'สถานะ' : 'Status'}</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{language === 'TH' ? 'จัดการ' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockStaff.map((s, i) => (
                                        <tr key={s.id} style={{ borderBottom: i === mockStaff.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--neutral-800)' }}>{s.name}</td>
                                            <td style={{ padding: '1rem', color: 'var(--neutral-600)' }}>
                                                <span style={{ padding: '4px 8px', background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{s.role}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                                                    background: s.status === 'Active' ? '#d1fae5' : '#fee2e2',
                                                    color: s.status === 'Active' ? '#047857' : '#b91c1c'
                                                }}>{s.status}</span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                                                    {language === 'TH' ? 'แก้ไข' : 'Edit'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'services':
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
                                {language === 'TH' ? 'หัตถการและราคา' : 'Services & Pricing'}
                            </h2>
                            <button className="btn btn-primary" style={{ background: 'var(--primary-600)' }}>
                                <Plus size={18} style={{ marginRight: '8px' }} /> {language === 'TH' ? 'เพิ่มหัตถการ' : 'Add Service'}
                            </button>
                        </div>
                        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            {['ขูดหินปูน (Scaling)', 'อุดฟัน (Filling)', 'ถอนฟัน (Extraction)', 'รักษารากฟัน (Root Canal)'].map((svc, idx) => (
                                <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', flex: '1 1 200px', minWidth: '200px' }}>
                                    <div style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>{svc}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{language === 'TH' ? 'ราคาเริ่มต้น' : 'Start Price'}: ฿800</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                        <Settings size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                        <h3>{language === 'TH' ? 'กำลังพัฒนาระบบนี้...' : 'Module Under Development...'}</h3>
                        <p>{language === 'TH' ? 'กรุณาเลือกเมนูอื่น' : 'Please select another section.'}</p>
                    </div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: '#f8fafc', margin: '-1.5rem' }}>
            {/* Sidebar Menu for Management */}
            <div style={{ 
                width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', 
                display: 'flex', flexDirection: 'column', padding: '1.5rem 0'
            }}>
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings color="var(--primary-500)" />
                        Management
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Centralized Clinic Control</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 1rem', overflowY: 'auto' }}>
                    {sections.map(sec => (
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

export default ManagementHub;
