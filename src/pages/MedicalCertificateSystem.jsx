import React, { useState } from 'react';
import {
    FileText, Printer, Download, Plus, Search, Calendar, User,
    Shield, Hash, Pen, Stamp, Clock, Eye, Copy, Trash2, Filter,
    ChevronDown, ChevronRight, CheckCircle, AlertCircle, FileSignature
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

// --- Document Templates ---
const CERT_TEMPLATES = [
    { id: 'general', name: 'ใบรับรองแพทย์ทั่วไป', nameEN: 'General Medical Certificate', icon: '📋', color: '#0d9488' },
    { id: 'treatment', name: 'ใบตรวจรักษาผู้ป่วย (OPD Card)', nameEN: 'Treatment Record (OPD)', icon: '🏥', color: '#3b82f6' },
    { id: 'referral', name: 'ใบส่งตัว', nameEN: 'Referral Letter', icon: '📤', color: '#8b5cf6' },
    { id: 'sick_leave', name: 'ใบรับรองการเจ็บป่วย', nameEN: 'Sick Leave Certificate', icon: '🤒', color: '#f59e0b' },
    { id: 'ten_disease', name: 'ใบรับรองแพทย์ 10 โรค', nameEN: '10-Disease Certificate', icon: '🔬', color: '#ef4444' },
    { id: 'confined_space', name: 'ใบรับรองแพทย์อับอากาศ', nameEN: 'Confined Space Certificate', icon: '🏗️', color: '#64748b' },
    { id: 'covid', name: 'ใบรับรองแพทย์ Covid', nameEN: 'Covid Certificate', icon: '🦠', color: '#10b981' },
    { id: 'lab_request', name: 'ใบส่งตรวจแล็บ', nameEN: 'Lab Request Form', icon: '🧪', color: '#6366f1' },
    { id: 'lab_result', name: 'ใบผลตรวจแล็บ', nameEN: 'Lab Result Report', icon: '📊', color: '#14b8a6' },
];

const CLINIC_INFO = {
    name: 'คลินิกทันตกรรม บ้านหมอฟัน',
    nameEN: "Dentist's House Dental Clinic",
    address: '123 ถ.ปราจีนอนุสรณ์ ต.หน้าเมือง อ.เมือง จ.ปราจีนบุรี 25000',
    phone: '037-XXX-XXX',
    license: 'เลขที่ใบอนุญาต สพ.XXX/2567',
};

const MedicalCertificateSystem = () => {
    const { language } = useLanguage();
    const { patients } = useData();
    const [activeView, setActiveView] = useState('templates');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [issuedCerts, setIssuedCerts] = useState([]);
    const [runningNumber, setRunningNumber] = useState(1);

    const [certData, setCertData] = useState({
        patientName: '',
        hn: '',
        age: '',
        gender: '',
        idCard: '',
        diagnosis: '',
        diagnosisEN: '',
        icd10: '',
        treatmentSummary: '',
        recommendation: '',
        restDays: '',
        restFrom: '',
        restTo: '',
        referTo: '',
        referReason: '',
        doctorName: '',
        doctorLicense: '',
        issueDate: new Date().toISOString().split('T')[0],
        opinion: 'สุขภาพดี ไม่พบโรคต้องห้าม',
    });

    const generateDocNumber = () => {
        const year = new Date().getFullYear() + 543; // Buddhist Era
        const num = String(runningNumber).padStart(4, '0');
        return `MC-${year}-${num}`;
    };

    const issueCertificate = () => {
        const newCert = {
            ...certData,
            id: Date.now(),
            docNumber: generateDocNumber(),
            templateId: selectedTemplate,
            templateName: CERT_TEMPLATES.find(t => t.id === selectedTemplate)?.name,
            issuedAt: new Date().toISOString(),
        };
        setIssuedCerts(prev => [newCert, ...prev]);
        setRunningNumber(prev => prev + 1);
        alert('ออกใบรับรองแพทย์เรียบร้อย เลขที่: ' + newCert.docNumber);
    };

    const handlePrint = () => {
        window.print();
    };

    // ===== TEMPLATE SELECTION VIEW =====
    if (activeView === 'templates') {
        return (
            <div style={{ padding: '1.5rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                            <FileSignature size={22} />
                        </div>
                        {language === 'TH' ? 'ระบบออกใบรับรองแพทย์' : 'Medical Certificate System'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        {language === 'TH' ? 'สร้างเอกสารทางการแพทย์ที่ได้มาตรฐาน พร้อมระบบรันเลขที่เอกสารอัตโนมัติ' : 'Generate standardized medical documents with auto-running numbers'}
                    </p>
                </div>

                {/* Stats Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'ใบรับรองที่ออก', value: issuedCerts.length, icon: FileText, color: '#0d9488' },
                        { label: 'เลขที่ล่าสุด', value: generateDocNumber(), icon: Hash, color: '#6366f1' },
                        { label: 'เทมเพลต', value: CERT_TEMPLATES.length, icon: Copy, color: '#f59e0b' },
                        { label: 'วันนี้', value: issuedCerts.filter(c => c.issuedAt?.startsWith(new Date().toISOString().split('T')[0])).length, icon: Calendar, color: '#ef4444' },
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '14px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--neutral-800)' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Template Grid */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>📋 เลือกเทมเพลตเอกสาร</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {CERT_TEMPLATES.map(template => (
                            <div key={template.id} onClick={() => { setSelectedTemplate(template.id); setActiveView('create'); }}
                                className="card" style={{
                                    padding: '1.5rem', cursor: 'pointer', transition: 'all 0.25s',
                                    border: '2px solid transparent', position: 'relative', overflow: 'hidden'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = template.color; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${template.color}20`; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                            >
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `${template.color}10`, borderRadius: '0 0 0 100%' }} />
                                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{template.icon}</div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--neutral-800)' }}>
                                    {template.name}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{template.nameEN}</p>
                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: template.color, fontSize: '0.8rem', fontWeight: 700 }}>
                                    <ChevronRight size={16} /> สร้างเอกสาร
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Issued Certificates History */}
                {issuedCerts.length > 0 && (
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>📂 ประวัติการออกเอกสาร</h2>
                        <div className="card" style={{ overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-100)' }}>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--neutral-500)' }}>เลขที่</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--neutral-500)' }}>ประเภท</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--neutral-500)' }}>ผู้ป่วย</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--neutral-500)' }}>วันที่ออก</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--neutral-500)' }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issuedCerts.slice(0, 10).map(cert => (
                                        <tr key={cert.id} style={{ borderBottom: '1px solid var(--neutral-50)' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-600)' }}>{cert.docNumber}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{cert.templateName}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>{cert.patientName || '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{new Date(cert.issuedAt).toLocaleString('th-TH')}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                <button style={{ padding: '0.4rem', border: 'none', background: 'var(--neutral-50)', borderRadius: '8px', cursor: 'pointer', marginRight: '0.5rem' }}>
                                                    <Eye size={16} color="var(--neutral-500)" />
                                                </button>
                                                <button style={{ padding: '0.4rem', border: 'none', background: 'var(--neutral-50)', borderRadius: '8px', cursor: 'pointer' }}>
                                                    <Printer size={16} color="var(--neutral-500)" />
                                                </button>
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
    }

    // ===== CREATE CERTIFICATE VIEW =====
    const currentTemplate = CERT_TEMPLATES.find(t => t.id === selectedTemplate);

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setActiveView('templates')} style={{
                        background: 'var(--neutral-50)', border: 'none', borderRadius: '10px',
                        padding: '0.6rem', cursor: 'pointer', color: 'var(--neutral-600)'
                    }}>
                        ← กลับ
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.75rem' }}>{currentTemplate?.icon}</span>
                            {currentTemplate?.name}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>เลขที่เอกสาร: <strong style={{ color: 'var(--primary-600)' }}>{generateDocNumber()}</strong></p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handlePrint} style={{
                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                        background: 'var(--neutral-100)', color: 'var(--neutral-700)',
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <Printer size={16} /> พิมพ์
                    </button>
                    <button onClick={issueCertificate} style={{
                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                        fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
                    }}>
                        <CheckCircle size={16} /> ออกเอกสาร
                    </button>
                </div>
            </div>

            {/* Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Patient Info */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={18} color="var(--primary-600)" /> ข้อมูลผู้ป่วย
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { key: 'patientName', label: 'ชื่อ-สกุล', placeholder: 'ชื่อ-นามสกุล' },
                            { key: 'hn', label: 'HN', placeholder: 'HN-XXXX' },
                            { key: 'age', label: 'อายุ', placeholder: 'เช่น 35 ปี' },
                            { key: 'idCard', label: 'เลขบัตรประชาชน', placeholder: 'X-XXXX-XXXXX-XX-X' },
                        ].map(field => (
                            <div key={field.key}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>{field.label}</label>
                                <input type="text" value={certData[field.key]} onChange={e => setCertData(p => ({ ...p, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                        ))}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>เพศ</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['ชาย', 'หญิง'].map(g => (
                                    <button key={g} onClick={() => setCertData(p => ({ ...p, gender: g }))} style={{
                                        flex: 1, padding: '0.7rem', borderRadius: '10px', border: '1.5px solid',
                                        borderColor: certData.gender === g ? 'var(--primary-500)' : 'var(--neutral-200)',
                                        background: certData.gender === g ? 'var(--primary-50)' : 'white',
                                        color: certData.gender === g ? 'var(--primary-700)' : 'var(--neutral-600)',
                                        fontWeight: 700, cursor: 'pointer'
                                    }}>{g}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clinical Info */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} color="var(--primary-600)" /> ข้อมูลทางคลินิก
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>การวินิจฉัย</label>
                            <textarea value={certData.diagnosis} onChange={e => setCertData(p => ({ ...p, diagnosis: e.target.value }))}
                                placeholder="ผลการตรวจวินิจฉัย..." rows={3}
                                style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>รหัส ICD-10</label>
                            <input type="text" value={certData.icd10} onChange={e => setCertData(p => ({ ...p, icd10: e.target.value }))}
                                placeholder="เช่น K02.1"
                                style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ความเห็นแพทย์</label>
                            <textarea value={certData.opinion} onChange={e => setCertData(p => ({ ...p, opinion: e.target.value }))}
                                rows={2}
                                style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical' }}
                            />
                        </div>

                        {(selectedTemplate === 'sick_leave' || selectedTemplate === 'general') && (
                            <>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>จำนวนวันลาพัก</label>
                                    <input type="number" value={certData.restDays} onChange={e => setCertData(p => ({ ...p, restDays: e.target.value }))}
                                        placeholder="เช่น 3"
                                        style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ตั้งแต่วันที่</label>
                                        <input type="date" value={certData.restFrom} onChange={e => setCertData(p => ({ ...p, restFrom: e.target.value }))}
                                            style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ถึงวันที่</label>
                                        <input type="date" value={certData.restTo} onChange={e => setCertData(p => ({ ...p, restTo: e.target.value }))}
                                            style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedTemplate === 'referral' && (
                            <>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ส่งตัวไปยัง</label>
                                    <input type="text" value={certData.referTo} onChange={e => setCertData(p => ({ ...p, referTo: e.target.value }))}
                                        placeholder="ชื่อโรงพยาบาล/คลินิก"
                                        style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>เหตุผลการส่งตัว</label>
                                    <textarea value={certData.referReason} onChange={e => setCertData(p => ({ ...p, referReason: e.target.value }))}
                                        rows={2} placeholder="เหตุผลการส่งตัว..."
                                        style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical' }}
                                    />
                                </div>
                            </>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>แพทย์ผู้ออก</label>
                                <input type="text" value={certData.doctorName} onChange={e => setCertData(p => ({ ...p, doctorName: e.target.value }))}
                                    placeholder="ชื่อแพทย์"
                                    style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>เลขที่ใบอนุญาต</label>
                                <input type="text" value={certData.doctorLicense} onChange={e => setCertData(p => ({ ...p, doctorLicense: e.target.value }))}
                                    placeholder="ท.XXX"
                                    style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Digital Signature Area */}
            <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pen size={18} color="var(--primary-600)" /> ลายเซ็นดิจิทัลและตราประทับ
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        height: '150px', border: '2px dashed var(--neutral-200)', borderRadius: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--neutral-400)', transition: 'all 0.2s',
                        background: 'var(--neutral-50)'
                    }}>
                        <Pen size={32} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}>อัพโหลดลายเซ็นแพทย์</span>
                        <span style={{ fontSize: '0.7rem' }}>หรือวาดลายเซ็นที่นี่</span>
                    </div>
                    <div style={{
                        height: '150px', border: '2px dashed var(--neutral-200)', borderRadius: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--neutral-400)', transition: 'all 0.2s',
                        background: 'var(--neutral-50)'
                    }}>
                        <Stamp size={32} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}>อัพโหลดตราประทับคลินิก</span>
                        <span style={{ fontSize: '0.7rem' }}>PNG ขนาด 200x200px</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalCertificateSystem;
