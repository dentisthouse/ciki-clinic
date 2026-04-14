import React, { useState } from 'react';
import {
    Shield, FileText, Search, Plus, Send, CheckCircle, XCircle,
    AlertTriangle, Clock, DollarSign, Users, Calendar, Download,
    Filter, Eye, Edit2, RefreshCw, BarChart3, Hash, Clipboard,
    Activity, ArrowRight, ChevronDown, ChevronRight, Zap, Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

// --- ICD-10 Common Dental Codes ---
const ICD10_CODES = [
    { code: 'K00', desc: 'ความผิดปกติของพัฒนาการและการงอกของฟัน', descEN: 'Disorders of tooth development and eruption' },
    { code: 'K01', desc: 'ฟันฝัง/คุด', descEN: 'Embedded and impacted teeth' },
    { code: 'K02', desc: 'ฟันผุ', descEN: 'Dental caries' },
    { code: 'K02.0', desc: 'ฟันผุจำกัดที่เคลือบฟัน', descEN: 'Caries limited to enamel' },
    { code: 'K02.1', desc: 'ฟันผุถึงเนื้อฟัน', descEN: 'Caries of dentine' },
    { code: 'K02.2', desc: 'ฟันผุถึงซีเมนต์', descEN: 'Caries of cementum' },
    { code: 'K03', desc: 'โรคเนื้อเยื่อแข็งของฟัน', descEN: 'Other diseases of hard tissues of teeth' },
    { code: 'K04', desc: 'โรคเนื้อเยื่อในฟันและบริเวณรอบปลายราก', descEN: 'Diseases of pulp and periapical tissues' },
    { code: 'K04.0', desc: 'เนื้อเยื่อในฟันอักเสบ', descEN: 'Pulpitis' },
    { code: 'K05', desc: 'โรคเหงือกอักเสบ', descEN: 'Gingivitis and periodontal diseases' },
    { code: 'K05.0', desc: 'เหงือกอักเสบเฉียบพลัน', descEN: 'Acute gingivitis' },
    { code: 'K05.1', desc: 'เหงือกอักเสบเรื้อรัง', descEN: 'Chronic gingivitis' },
    { code: 'K06', desc: 'ความผิดปกติอื่นของเหงือก', descEN: 'Other disorders of gingiva' },
    { code: 'K07', desc: 'ความผิดปกติของขากรรไกร', descEN: 'Dentofacial anomalies' },
    { code: 'K08', desc: 'ความผิดปกติอื่นของฟัน', descEN: 'Other disorders of teeth and supporting structures' },
    { code: 'K08.1', desc: 'การสูญเสียฟัน', descEN: 'Loss of teeth' },
    { code: 'K12', desc: 'แผลอักเสบของช่องปาก', descEN: 'Stomatitis and related lesions' },
    { code: 'K13', desc: 'โรคอื่นของริมฝีปากและเยื่อเมือก', descEN: 'Other diseases of lip and oral mucosa' },
];

// Procedure codes
const PROCEDURE_CODES = [
    { code: '2301', desc: 'การตรวจสุขภาพช่องปาก', price: 500 },
    { code: '2302', desc: 'ขูดหินปูน', price: 1000 },
    { code: '2303', desc: 'อุดฟันด้วยอมัลกัม', price: 800 },
    { code: '2304', desc: 'อุดฟันด้วยคอมโพสิต', price: 1200 },
    { code: '2305', desc: 'ถอนฟัน', price: 600 },
    { code: '2306', desc: 'ถอนฟันคุด', price: 3000 },
    { code: '2307', desc: 'รักษารากฟันหน้า', price: 5000 },
    { code: '2308', desc: 'รักษารากฟันกราม', price: 8000 },
    { code: '2309', desc: 'ครอบฟัน', price: 12000 },
    { code: '2310', desc: 'สะพานฟัน', price: 15000 },
    { code: '2311', desc: 'ฟันปลอมถอดได้', price: 8000 },
    { code: '2312', desc: 'รากฟันเทียม', price: 50000 },
    { code: '2313', desc: 'จัดฟัน', price: 60000 },
    { code: '2314', desc: 'ฟอกสีฟัน', price: 3000 },
    { code: '2315', desc: 'เคลือบฟลูออไรด์', price: 500 },
];

// Right type options
const CLAIM_RIGHTS = [
    { id: 'uc', name: 'สิทธิ์บัตรทอง (UC)', color: '#f59e0b' },
    { id: 'sso', name: 'ประกันสังคม (SSO)', color: '#3b82f6' },
    { id: 'cs', name: 'ข้าราชการ (CS)', color: '#8b5cf6' },
    { id: 'ofc', name: 'กองทุนทดแทน (WC)', color: '#ef4444' },
    { id: 'private', name: 'ประกันเอกชน', color: '#22c55e' },
    { id: 'self', name: 'ชำระเอง', color: '#64748b' },
];

const EClaimSystem = () => {
    const { language } = useLanguage();
    const { patients } = useData();
    const [activeTab, setActiveTab] = useState('create');
    const [searchICD, setSearchICD] = useState('');
    const [showICD10, setShowICD10] = useState(false);
    
    const [claims, setClaims] = useState([
        { id: 1, claimNo: 'EC-2569-0001', patientName: 'นายสมชาย ใจดี', hn: 'CN-0001', right: 'sso', icd10: 'K02.1', procedures: ['2302', '2304'], totalAmount: 2200, claimAmount: 1800, status: 'approved', submittedAt: '2026-04-01', approvedAt: '2026-04-05' },
        { id: 2, claimNo: 'EC-2569-0002', patientName: 'นางสาวมาลี สวยงาม', hn: 'CN-0015', right: 'uc', icd10: 'K05.1', procedures: ['2301', '2302'], totalAmount: 1500, claimAmount: 1200, status: 'pending', submittedAt: '2026-04-05' },
        { id: 3, claimNo: 'EC-2569-0003', patientName: 'เด็กชายธนกร เก่งมาก', hn: 'CN-0032', right: 'cs', icd10: 'K04.0', procedures: ['2307'], totalAmount: 5000, claimAmount: 5000, status: 'submitted', submittedAt: '2026-04-06' },
        { id: 4, claimNo: 'EC-2569-0004', patientName: 'นางสุดา รักดี', hn: 'CN-0008', right: 'sso', icd10: 'K02.0', procedures: ['2304'], totalAmount: 1200, claimAmount: 900, status: 'rejected', submittedAt: '2026-03-28', rejectedReason: 'รหัสหัตถการไม่ตรงกับการวินิจฉัย' },
    ]);

    const [newClaim, setNewClaim] = useState({
        patientName: '', hn: '', right: '', icd10: '', icd10Desc: '',
        procedures: [], notes: '', totalAmount: 0, claimAmount: 0,
    });

    const [runningNo, setRunningNo] = useState(5);

    // Stats
    const pendingClaims = claims.filter(c => c.status === 'pending' || c.status === 'submitted').length;
    const approvedClaims = claims.filter(c => c.status === 'approved').length;
    const rejectedClaims = claims.filter(c => c.status === 'rejected').length;
    const totalClaimAmount = claims.filter(c => c.status === 'approved').reduce((s, c) => s + c.claimAmount, 0);

    const statusConfig = {
        pending: { label: 'รอส่ง', color: '#f59e0b', bg: '#fffbeb', icon: Clock },
        submitted: { label: 'ส่งแล้ว', color: '#3b82f6', bg: '#eff6ff', icon: Send },
        approved: { label: 'อนุมัติ', color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle },
        rejected: { label: 'ปฏิเสธ', color: '#ef4444', bg: '#fef2f2', icon: XCircle },
    };

    const filteredICD = ICD10_CODES.filter(c =>
        c.code.toLowerCase().includes(searchICD.toLowerCase()) ||
        c.desc.includes(searchICD) ||
        c.descEN.toLowerCase().includes(searchICD.toLowerCase())
    );

    const toggleProcedure = (code) => {
        setNewClaim(prev => {
            const procedures = prev.procedures.includes(code)
                ? prev.procedures.filter(p => p !== code)
                : [...prev.procedures, code];
            const totalAmount = procedures.reduce((s, pc) => s + (PROCEDURE_CODES.find(p => p.code === pc)?.price || 0), 0);
            return { ...prev, procedures, totalAmount, claimAmount: Math.round(totalAmount * 0.8) };
        });
    };

    const submitClaim = () => {
        const year = new Date().getFullYear() + 543;
        const no = String(runningNo).padStart(4, '0');
        const claim = {
            ...newClaim,
            id: Date.now(),
            claimNo: `EC-${year}-${no}`,
            status: 'pending',
            submittedAt: new Date().toISOString().split('T')[0],
        };
        setClaims(prev => [claim, ...prev]);
        setRunningNo(v => v + 1);
        setNewClaim({ patientName: '', hn: '', right: '', icd10: '', icd10Desc: '', procedures: [], notes: '', totalAmount: 0, claimAmount: 0 });
        setActiveTab('history');
        alert('สร้างรายการเบิกจ่ายเรียบร้อย: ' + claim.claimNo);
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)' }}>
                            <Shield size={22} />
                        </div>
                        {language === 'TH' ? 'ระบบเบิกจ่าย E-Claim' : 'E-Claim System'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        {language === 'TH' ? 'เชื่อมต่อการเบิกจ่ายประกันและสวัสดิการ ลดขั้นตอนซ้ำซ้อน' : 'Connect insurance claims with automated ICD-10 validation'}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'รอดำเนินการ', value: pendingClaims, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'อนุมัติแล้ว', value: approvedClaims, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4' },
                    { label: 'ปฏิเสธ', value: rejectedClaims, icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
                    { label: 'ยอดเบิกรวม', value: `฿${totalClaimAmount.toLocaleString()}`, icon: DollarSign, color: '#3b82f6', bg: '#eff6ff' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--neutral-800)' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--neutral-50)', padding: '0.35rem', borderRadius: '14px', border: '1px solid var(--neutral-100)' }}>
                {[
                    { id: 'create', label: '➕ สร้างเคลม' },
                    { id: 'history', label: '📋 ประวัติเคลม' },
                    { id: 'reports', label: '📊 สรุปยอด' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: activeTab === tab.id ? 'white' : 'transparent',
                        color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--neutral-500)',
                        boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                    }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Create Claim */}
            {activeTab === 'create' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Patient & Diagnosis */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} color="var(--primary-600)" /> ข้อมูลผู้ป่วยและสิทธิ์
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ชื่อ-สกุล</label>
                                    <input type="text" value={newClaim.patientName} onChange={e => setNewClaim(p => ({ ...p, patientName: e.target.value }))}
                                        placeholder="ชื่อผู้ป่วย" style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>CN</label>
                                    <input type="text" value={newClaim.hn} onChange={e => setNewClaim(p => ({ ...p, hn: e.target.value }))}
                                        placeholder="CN-XXXX" style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.5rem', display: 'block' }}>สิทธิ์การรักษา</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    {CLAIM_RIGHTS.map(right => (
                                        <button key={right.id} onClick={() => setNewClaim(p => ({ ...p, right: right.id }))} style={{
                                            padding: '0.6rem', borderRadius: '10px', border: '1.5px solid',
                                            borderColor: newClaim.right === right.id ? right.color : 'var(--neutral-200)',
                                            background: newClaim.right === right.id ? `${right.color}10` : 'white',
                                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                            color: newClaim.right === right.id ? right.color : 'var(--neutral-600)'
                                        }}>{right.name}</button>
                                    ))}
                                </div>
                            </div>

                            {/* ICD-10 */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>รหัส ICD-10</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={searchICD} onChange={e => { setSearchICD(e.target.value); setShowICD10(true); }}
                                        onFocus={() => setShowICD10(true)}
                                        placeholder="ค้นหารหัส ICD-10..." style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }} />
                                    {showICD10 && searchICD && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--neutral-200)', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                                            {filteredICD.map(icd => (
                                                <button key={icd.code} onClick={() => { setNewClaim(p => ({ ...p, icd10: icd.code, icd10Desc: icd.desc })); setSearchICD(icd.code + ' - ' + icd.desc); setShowICD10(false); }}
                                                    style={{ width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid var(--neutral-50)' }}>
                                                    <strong style={{ color: 'var(--primary-600)' }}>{icd.code}</strong> — {icd.desc}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {newClaim.icd10 && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--primary-50)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                                        ✅ {newClaim.icd10} — {newClaim.icd10Desc}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Procedures */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clipboard size={18} color="var(--primary-600)" /> หัตถการ
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                            {PROCEDURE_CODES.map(proc => (
                                <button key={proc.code} onClick={() => toggleProcedure(proc.code)} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid',
                                    borderColor: newClaim.procedures.includes(proc.code) ? 'var(--primary-500)' : 'var(--neutral-200)',
                                    background: newClaim.procedures.includes(proc.code) ? 'var(--primary-50)' : 'white',
                                    cursor: 'pointer', width: '100%', textAlign: 'left'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-600)', marginRight: '0.5rem' }}>{proc.code}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{proc.desc}</span>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neutral-700)' }}>฿{proc.price.toLocaleString()}</span>
                                </button>
                            ))}
                        </div>

                        {/* Summary */}
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--neutral-50)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 600 }}>ค่ารักษาทั้งหมด</span>
                                <span style={{ fontWeight: 800 }}>฿{newClaim.totalAmount.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>ยอดเบิกจ่าย (80%)</span>
                                <span style={{ fontWeight: 900, color: 'var(--primary-600)' }}>฿{newClaim.claimAmount.toLocaleString()}</span>
                            </div>
                            <button onClick={submitClaim} disabled={!newClaim.patientName || !newClaim.icd10 || newClaim.procedures.length === 0} style={{
                                width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white',
                                fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                                opacity: (!newClaim.patientName || !newClaim.icd10 || newClaim.procedures.length === 0) ? 0.5 : 1
                            }}>
                                <Send size={18} /> ส่งเคลม E-Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Claim History */}
            {activeTab === 'history' && (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-100)' }}>
                                {['เลขที่เคลม', 'ผู้ป่วย', 'สิทธิ์', 'ICD-10', 'ยอดเบิก', 'วันที่ส่ง', 'สถานะ', 'จัดการ'].map(h => (
                                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--neutral-500)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map(claim => {
                                const sc = statusConfig[claim.status];
                                const rightInfo = CLAIM_RIGHTS.find(r => r.id === claim.right);
                                return (
                                    <tr key={claim.id} style={{ borderBottom: '1px solid var(--neutral-50)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-600)', fontFamily: 'monospace' }}>{claim.claimNo}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{claim.patientName}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)' }}>{claim.hn}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: `${rightInfo?.color}15`, color: rightInfo?.color }}>
                                                {rightInfo?.name?.split(' ')[0]}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>{claim.icd10}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.9rem' }}>฿{claim.claimAmount.toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{claim.submittedAt}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <sc.icon size={12} /> {sc.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <button style={{ padding: '0.4rem', border: 'none', background: 'var(--neutral-50)', borderRadius: '8px', cursor: 'pointer' }}>
                                                <Eye size={16} color="var(--neutral-500)" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Monthly Summary */}
            {activeTab === 'reports' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>📊 สรุปยอดเบิกจ่ายรายเดือน</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.'].map((m, i) => {
                                const amount = [45000, 52000, 38000, totalClaimAmount][i];
                                return (
                                    <div key={m}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                                            <span>{m}</span>
                                            <span>฿{amount.toLocaleString()}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--neutral-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: '4px', width: `${(amount / 55000) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #6366f1)', transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>🏥 แยกตามสิทธิ์</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {CLAIM_RIGHTS.slice(0, 4).map(right => {
                                const count = claims.filter(c => c.right === right.id).length;
                                const amount = claims.filter(c => c.right === right.id).reduce((s, c) => s + c.claimAmount, 0);
                                return (
                                    <div key={right.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 8, height: 32, borderRadius: '4px', background: right.color }} />
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{right.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)' }}>{count} รายการ</div>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 800, color: 'var(--neutral-800)' }}>฿{amount.toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EClaimSystem;
