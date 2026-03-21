import React, { useState } from 'react';
import { FileText, CreditCard, Activity, Printer, X, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const DocumentModal = ({ isOpen, onClose, patient }) => {
    if (!isOpen || !patient) return null;

    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('cert');
    const [certData, setCertData] = useState({
        diagnosis: '',
        days: 1,
        startDate: new Date().toISOString().split('T')[0],
        comments: '',
        lang: 'TH' // TH or EN
    });

    const clinicInfo = {
        nameTH: "คลินิกทันตกรรม CIKI DENTAL",
        nameEN: "CIKI DENTAL CLINIC",
        addressTH: "123 ถ.สุขุมวิท เขตวัฒนา กรุงเทพฯ 10110",
        addressEN: "123 Sukhumvit Rd, Watthana, Bangkok 10110",
        license: "1234567890"
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Tab Content Components ---

    const MedicalCertificate = () => (
        <div className="printable-content a4-page">
            <div className="doc-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                            {certData.lang === 'TH' ? clinicInfo.nameTH : clinicInfo.nameEN}
                        </h2>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>
                            {certData.lang === 'TH' ? clinicInfo.addressTH : clinicInfo.addressEN}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString('th-TH')}</p>
                        <p><strong>Lic. No:</strong> {clinicInfo.license}</p>
                    </div>
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '1.5rem 0' }} />

                <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', textTransform: 'uppercase' }}>
                    {certData.lang === 'TH' ? 'ใบรับรองแพทย์' : 'MEDICAL CERTIFICATE'}
                </h1>

                <div className="doc-body" style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    <p>
                        {certData.lang === 'TH' ? 'ข้าพเจ้า ทพ. สมชาย ใจดี (เลขที่ใบประกอบวิชาชีพ 99999) ได้ทำการตรวจร่างกาย' : 'I, Dr. Somchai Jaidee (License No. 99999), have examined'}
                    </p>
                    <p>
                        {certData.lang === 'TH' ? 'ชื่อผู้ป่วย:' : 'Patient Name:'} <strong>{patient.name}</strong> (HN: {patient.id})
                    </p>
                    <p>
                        {certData.lang === 'TH' ? 'เมื่อวันที่:' : 'On Date:'} <strong>{new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</strong>
                    </p>

                    <div style={{ margin: '2rem 0', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}>
                        <p style={{ marginBottom: '1rem' }}>
                            <strong>{certData.lang === 'TH' ? 'การวินิจฉัยโรค (Diagnosis):' : 'Diagnosis:'}</strong><br />
                            <span style={{ fontSize: '1.25rem', paddingLeft: '1rem', display: 'block', marginTop: '0.5rem' }}>
                                {certData.diagnosis || '___________________________'}
                            </span>
                        </p>
                        <p>
                            <strong>{certData.lang === 'TH' ? 'ความเห็นแพทย์ (Opinion):' : 'Opinion:'}</strong><br />
                            <span style={{ paddingLeft: '1rem', display: 'block', marginTop: '0.5rem' }}>
                                {certData.lang === 'TH'
                                    ? `สมควรให้หยุดพักรักษาตัวเป็นเวลา ${certData.days} วัน ตั้งแต่วันที่ ${new Date(certData.startDate).toLocaleDateString('th-TH')}`
                                    : `Appropriate to rest for ${certData.days} day(s) starting from ${new Date(certData.startDate).toLocaleDateString('en-US')}`
                                }
                            </span>
                        </p>
                    </div>
                </div>

                <div className="doc-footer" style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <div style={{ height: '60px', borderBottom: '1px dotted #000' }}></div>
                        <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>( ทพ. สมชาย ใจดี )</p>
                        <p style={{ fontSize: '0.9rem' }}>{certData.lang === 'TH' ? 'ทันตแพทย์ผู้ตรวจ' : 'Attending Dentist'}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const OPDCard = () => (
        <div className="printable-content a4-page">
            <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                <h2>OPD CARD / ประวัติการรักษา</h2>
                <h3>{clinicInfo.nameEN}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <div>
                    <p><strong>Name:</strong> {patient.name}</p>
                    <p><strong>HN:</strong> {patient.id}</p>
                    <p><strong>Birth Date:</strong> {new Date().getFullYear() - patient.age}-01-01 (Age: {patient.age})</p>
                    <p><strong>Gender:</strong> {patient.gender}</p>
                </div>
                <div>
                    <p><strong>Allergies:</strong> <span style={{ color: 'red' }}>{(patient.medicalHistory || []).join(', ')}</span></p>
                    <p><strong>Phone:</strong> {patient.phone}</p>
                    <p><strong>Address:</strong> {patient.address}</p>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#eee', borderBottom: '1px solid #000' }}>
                        <th style={{ border: '1px solid #000', padding: '8px' }}>Date</th>
                        <th style={{ border: '1px solid #000', padding: '8px' }}>Treatment</th>
                        <th style={{ border: '1px solid #000', padding: '8px' }}>Doctor</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Fees</th>
                    </tr>
                </thead>
                <tbody>
                    {(patient.treatments || []).map((t, i) => (
                        <tr key={i}>
                            <td style={{ border: '1px solid #000', padding: '8px' }}>{new Date(t.date).toLocaleDateString()}</td>
                            <td style={{ border: '1px solid #000', padding: '8px' }}>{t.procedure}</td>
                            <td style={{ border: '1px solid #000', padding: '8px' }}>{t.doctor || 'Dr. Somchai'}</td>
                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{t.price?.toLocaleString()}</td>
                        </tr>
                    ))}
                    {(!patient.treatments || patient.treatments.length === 0) && (
                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>No records found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const HNCard = () => (
        <div className="printable-content" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div style={{
                width: '85.6mm', height: '53.98mm',
                border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                color: 'white', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>CIKI DENTAL</h3>
                            <p style={{ fontSize: '0.6rem', opacity: 0.8 }}>Patient Identification Card</p>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>HN: {patient.id}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>{patient.name}</h2>
                            <p style={{ fontSize: '0.7rem', opacity: 0.9 }}>Issued: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div style={{ background: 'white', padding: '4px', borderRadius: '4px' }}>
                            {/* Mock QR Code */}
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${patient.id}`} alt="QR" style={{ width: '60px', height: '60px' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '900px', maxWidth: '95vw', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Document Center</h2>
                    <button onClick={onClose} className="btn-icon"><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Sidebar */}
                    <div style={{ width: '250px', borderRight: '1px solid #eee', background: '#f8fafc', padding: '1rem' }}>
                        <div className="setup-nav-item" onClick={() => setActiveTab('cert')} style={{ background: activeTab === 'cert' ? '#e0f2fe' : 'transparent', color: activeTab === 'cert' ? '#0284c7' : 'inherit' }}>
                            <FileText size={18} /> Medical Certificate
                        </div>
                        <div className="setup-nav-item" onClick={() => setActiveTab('opd')} style={{ background: activeTab === 'opd' ? '#e0f2fe' : 'transparent', color: activeTab === 'opd' ? '#0284c7' : 'inherit' }}>
                            <Activity size={18} /> OPD Card (History)
                        </div>
                        <div className="setup-nav-item" onClick={() => setActiveTab('hn')} style={{ background: activeTab === 'hn' ? '#e0f2fe' : 'transparent', color: activeTab === 'hn' ? '#0284c7' : 'inherit' }}>
                            <CreditCard size={18} /> HN Card
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ background: 'white', width: '210mm', minHeight: '297mm', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            {activeTab === 'cert' && <MedicalCertificate />}
                            {activeTab === 'opd' && <OPDCard />}
                            {activeTab === 'hn' && <HNCard />}
                        </div>
                    </div>

                    {/* Controls Sidebar (Right) */}
                    <div style={{ width: '300px', borderLeft: '1px solid #eee', background: 'white', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Settings</h3>

                        {activeTab === 'cert' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Language</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className={`btn ${certData.lang === 'TH' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCertData({ ...certData, lang: 'TH' })}>Thai</button>
                                        <button className={`btn ${certData.lang === 'EN' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCertData({ ...certData, lang: 'EN' })}>English</button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Diagnosis</label>
                                    <textarea
                                        className="input-field"
                                        rows="3"
                                        value={certData.diagnosis}
                                        onChange={e => setCertData({ ...certData, diagnosis: e.target.value })}
                                        placeholder="Enter diagnosis..."
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Rest Days</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={certData.days}
                                        onChange={e => setCertData({ ...certData, days: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Start Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={certData.startDate}
                                        onChange={e => setCertData({ ...certData, startDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto' }}>
                            <button className="btn btn-primary" onClick={handlePrint} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                                <Printer size={20} /> Print Document
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @media print { 
                    body * { visibility: hidden; } 
                    .modal-overlay { background: white; postion: absolute; inset: 0; z-index: 9999; }
                    .printable-content, .printable-content * { visibility: visible; }
                    .printable-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; }
                    .a4-page { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; }
                }
            `}</style>
        </div>
    );
};

export default DocumentModal;
