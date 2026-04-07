import React, { useState, useRef } from 'react';
import {
    Pill, Printer, Search, Plus, Save, AlertTriangle, 
    Settings, FileText, ChevronDown, ChevronRight, Edit2,
    Trash2, Copy, Clock, Shield, Package, X, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

// --- Drug Label Templates ---
const LABEL_SIZES = {
    standard: { w: 90, h: 50, name: 'มาตรฐาน (90×50mm)' },
    small: { w: 70, h: 35, name: 'เล็ก (70×35mm)' },
    large: { w: 100, h: 60, name: 'ใหญ่ (100×60mm)' },
};

const SIG_PRESETS = [
    { id: 'bid', sig: 'วันละ 2 ครั้ง เช้า-เย็น', sigEN: 'Twice daily (BID)', icon: '🌅🌇' },
    { id: 'tid', sig: 'วันละ 3 ครั้ง เช้า-กลางวัน-เย็น', sigEN: 'Three times daily (TID)', icon: '🌅☀️🌇' },
    { id: 'qid', sig: 'วันละ 4 ครั้ง', sigEN: 'Four times daily (QID)', icon: '🌅☀️🌇🌙' },
    { id: 'od', sig: 'วันละ 1 ครั้ง', sigEN: 'Once daily (OD)', icon: '🌅' },
    { id: 'hs', sig: 'ก่อนนอน', sigEN: 'At bedtime (HS)', icon: '🌙' },
    { id: 'prn', sig: 'เมื่อมีอาการ', sigEN: 'As needed (PRN)', icon: '⚡' },
    { id: 'pc', sig: 'หลังอาหาร', sigEN: 'After meals (PC)', icon: '🍽️' },
    { id: 'ac', sig: 'ก่อนอาหาร', sigEN: 'Before meals (AC)', icon: '⏰' },
    { id: 'stat', sig: 'ทันที (STAT)', sigEN: 'Immediately (STAT)', icon: '🚨' },
];

const WARNING_PRESETS = [
    { id: 'drowsy', text: '⚠️ ยานี้อาจทำให้ง่วงนอน ห้ามขับรถหรือทำงานเกี่ยวกับเครื่องจักร', color: '#f59e0b' },
    { id: 'allergy', text: '🚫 แจ้งแพทย์ทันทีหากมีอาการแพ้ เช่น ผื่น บวม หายใจลำบาก', color: '#ef4444' },
    { id: 'food', text: '🍽️ ห้ามรับประทานร่วมกับนม หรือผลิตภัณฑ์จากนม', color: '#3b82f6' },
    { id: 'sun', text: '☀️ หลีกเลี่ยงแสงแดดจัดขณะใช้ยานี้', color: '#f97316' },
    { id: 'pregnant', text: '🤰 ห้ามใช้ในหญิงตั้งครรภ์หรือให้นมบุตร', color: '#ec4899' },
    { id: 'alcohol', text: '🍷 ห้ามดื่มแอลกอฮอล์ขณะใช้ยานี้', color: '#7c3aed' },
    { id: 'empty', text: '⏰ รับประทานขณะท้องว่าง ก่อนอาหาร 30 นาที', color: '#0ea5e9' },
];

const DEFAULT_CLINIC = {
    name: 'คลินิกทันตกรรม บ้านหมอฟัน',
    nameEN: "Dentist's House Dental Clinic",
    address: '123 ถ.ปราจีนอนุสรณ์ ต.หน้าเมือง อ.เมือง จ.ปราจีนบุรี 25000',
    phone: '037-XXX-XXX',
    license: 'เลขที่ใบอนุญาต สพ.XXX/2567',
};

const DrugLabelSystem = () => {
    const { language } = useLanguage();
    const { patients } = useData();
    const printRef = useRef(null);
    const [activeTab, setActiveTab] = useState('create');
    const [labelSize, setLabelSize] = useState('standard');
    const [searchDrug, setSearchDrug] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [savedLabels, setSavedLabels] = useState([]);

    const [labelData, setLabelData] = useState({
        patientName: '',
        hn: '',
        drugName: '',
        drugNameEN: '',
        strength: '',
        form: 'เม็ด',
        quantity: '',
        sig: '',
        sigCustom: '',
        route: 'รับประทาน',
        warnings: [],
        notes: '',
        prescriber: '',
        dispensedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
    });

    const drugForms = ['เม็ด', 'แคปซูล', 'น้ำ', 'ผง', 'ครีม', 'เจล', 'ยาหยอด', 'ยาพ่น', 'ยาฉีด', 'ยาอม'];
    const routeOptions = ['รับประทาน', 'ทาภายนอก', 'หยอดตา', 'หยอดหู', 'สูดดม', 'ฉีดเข้ากล้ามเนื้อ', 'เหน็บทวารหนัก'];

    const handleSigSelect = (preset) => {
        setLabelData(prev => ({
            ...prev,
            sig: preset.id,
            sigCustom: language === 'TH' ? preset.sig : preset.sigEN
        }));
    };

    const toggleWarning = (warningId) => {
        setLabelData(prev => ({
            ...prev,
            warnings: prev.warnings.includes(warningId)
                ? prev.warnings.filter(w => w !== warningId)
                : [...prev.warnings, warningId]
        }));
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Drug Label</title>
            <style>
                @page { size: ${LABEL_SIZES[labelSize].w}mm ${LABEL_SIZES[labelSize].h}mm; margin: 2mm; }
                body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; margin: 0; padding: 4mm; font-size: 9pt; }
                .label-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 2mm; margin-bottom: 2mm; }
                .clinic-name { font-weight: 900; font-size: 10pt; }
                .drug-name { font-weight: 900; font-size: 12pt; margin: 2mm 0; }
                .sig-line { font-size: 10pt; font-weight: 700; margin: 1mm 0; padding: 1mm; background: #f5f5f5; border-radius: 2mm; }
                .warning-box { font-size: 7pt; padding: 1mm 2mm; border-left: 2px solid #ef4444; margin: 1mm 0; background: #fff5f5; }
                .footer { font-size: 7pt; color: #666; margin-top: 2mm; border-top: 1px solid #ddd; padding-top: 1mm; }
            </style></head><body>
            ${printContent.innerHTML}
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const saveLabel = () => {
        const newLabel = {
            ...labelData,
            id: Date.now(),
            createdAt: new Date().toISOString(),
        };
        setSavedLabels(prev => [newLabel, ...prev]);
        alert('บันทึกฉลากยาเรียบร้อย');
    };

    const LabelPreview = () => {
        const selectedWarnings = WARNING_PRESETS.filter(w => labelData.warnings.includes(w.id));
        return (
            <div ref={printRef} style={{
                width: `${LABEL_SIZES[labelSize].w * 3.78}px`,
                minHeight: `${LABEL_SIZES[labelSize].h * 3.78}px`,
                background: 'white', border: '2px solid #1a1a1a', borderRadius: '8px',
                padding: '12px', fontFamily: "'Sarabun', sans-serif",
                fontSize: '10px', lineHeight: 1.4, margin: '0 auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #333', paddingBottom: '6px', marginBottom: '6px' }}>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '11px' }}>{DEFAULT_CLINIC.name}</div>
                        <div style={{ fontSize: '7px', color: '#666' }}>{DEFAULT_CLINIC.address}</div>
                        <div style={{ fontSize: '7px', color: '#666' }}>โทร. {DEFAULT_CLINIC.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '7px', color: '#555' }}>
                        <div>{DEFAULT_CLINIC.license}</div>
                        <div>วันที่: {labelData.dispensedDate}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '9px' }}>
                    <span><strong>ชื่อ:</strong> {labelData.patientName || '___________'}</span>
                    <span><strong>HN:</strong> {labelData.hn || '______'}</span>
                </div>

                <div style={{ fontWeight: 900, fontSize: '13px', marginBottom: '2px', color: '#1a1a1a' }}>
                    {labelData.drugName || 'ชื่อยา'} {labelData.strength && `(${labelData.strength})`}
                </div>
                {labelData.drugNameEN && (
                    <div style={{ fontSize: '8px', color: '#666', marginBottom: '4px', fontStyle: 'italic' }}>
                        {labelData.drugNameEN}
                    </div>
                )}

                <div style={{ background: '#f8f8f8', padding: '6px 8px', borderRadius: '4px', marginBottom: '4px', border: '1px solid #e5e5e5' }}>
                    <div style={{ fontWeight: 800, fontSize: '11px' }}>
                        📋 {labelData.sigCustom || 'วิธีใช้ยา'}
                    </div>
                    <div style={{ fontSize: '8px', color: '#555', marginTop: '2px' }}>
                        {labelData.route} | รูปแบบ: {labelData.form} | จำนวน: {labelData.quantity || '___'} {labelData.form}
                    </div>
                </div>

                {selectedWarnings.length > 0 && (
                    <div style={{ marginBottom: '4px' }}>
                        {selectedWarnings.map(w => (
                            <div key={w.id} style={{
                                fontSize: '7px', padding: '2px 4px', borderLeft: `2px solid ${w.color}`,
                                background: `${w.color}10`, marginBottom: '2px', borderRadius: '2px'
                            }}>
                                {w.text}
                            </div>
                        ))}
                    </div>
                )}

                {labelData.notes && (
                    <div style={{ fontSize: '7px', color: '#555', marginBottom: '4px', fontStyle: 'italic' }}>
                        หมายเหตุ: {labelData.notes}
                    </div>
                )}

                <div style={{ borderTop: '1px solid #ddd', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#888' }}>
                    <span>แพทย์: {labelData.prescriber || '___________'}</span>
                    {labelData.expiryDate && <span>หมดอายุ: {labelData.expiryDate}</span>}
                </div>
            </div>
        );
    };

    // ===== RENDER =====
    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(13, 148, 136, 0.2)' }}>
                            <Pill size={22} />
                        </div>
                        {language === 'TH' ? 'ระบบจัดการฉลากยา' : 'Drug Label System'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        {language === 'TH' ? 'พิมพ์ฉลากยา และวิธีใช้อย่างถูกต้อง ลดความผิดพลาดในการสื่อสารกับคนไข้' : 'Print professional drug labels with accurate instructions'}
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--neutral-50)', padding: '0.35rem', borderRadius: '14px', border: '1px solid var(--neutral-100)' }}>
                {[
                    { id: 'create', label: language === 'TH' ? '➕ สร้างฉลากยา' : '➕ Create Label', icon: Plus },
                    { id: 'templates', label: language === 'TH' ? '📋 เทมเพลต' : '📋 Templates', icon: FileText },
                    { id: 'history', label: language === 'TH' ? '📦 ประวัติ' : '📦 History', icon: Clock },
                    { id: 'settings', label: language === 'TH' ? '⚙️ ตั้งค่า' : '⚙️ Settings', icon: Settings },
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

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left: Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Patient Info */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} color="var(--primary-600)" /> ข้อมูลคนไข้
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>ชื่อ-สกุล</label>
                                <input type="text" value={labelData.patientName} onChange={e => setLabelData(p => ({ ...p, patientName: e.target.value }))}
                                    placeholder="เลือกจากรายชื่อคนไข้..."
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>HN</label>
                                <input type="text" value={labelData.hn} onChange={e => setLabelData(p => ({ ...p, hn: e.target.value }))}
                                    placeholder="HN-XXXX"
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Drug Info */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={18} color="var(--primary-600)" /> ข้อมูลยา
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>ชื่อยา (ไทย)</label>
                                <input type="text" value={labelData.drugName} onChange={e => setLabelData(p => ({ ...p, drugName: e.target.value }))}
                                    placeholder="เช่น อะม็อกซีซิลลิน"
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>ชื่อยา (EN)</label>
                                <input type="text" value={labelData.drugNameEN} onChange={e => setLabelData(p => ({ ...p, drugNameEN: e.target.value }))}
                                    placeholder="e.g. Amoxicillin"
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>ความแรง</label>
                                <input type="text" value={labelData.strength} onChange={e => setLabelData(p => ({ ...p, strength: e.target.value }))}
                                    placeholder="เช่น 500 mg"
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>จำนวน</label>
                                <input type="text" value={labelData.quantity} onChange={e => setLabelData(p => ({ ...p, quantity: e.target.value }))}
                                    placeholder="เช่น 30"
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>รูปแบบยา</label>
                                <select value={labelData.form} onChange={e => setLabelData(p => ({ ...p, form: e.target.value }))}
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem', background: 'white' }}>
                                    {drugForms.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>วิธีใช้</label>
                                <select value={labelData.route} onChange={e => setLabelData(p => ({ ...p, route: e.target.value }))}
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem', background: 'white' }}>
                                    {routeOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sig Selection */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} color="var(--primary-600)" /> วิธีใช้ยา (Sig)
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                            {SIG_PRESETS.map(preset => (
                                <button key={preset.id} onClick={() => handleSigSelect(preset)} style={{
                                    padding: '0.75rem', borderRadius: '10px', border: '1.5px solid',
                                    borderColor: labelData.sig === preset.id ? 'var(--primary-500)' : 'var(--neutral-200)',
                                    background: labelData.sig === preset.id ? 'var(--primary-50)' : 'white',
                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{preset.icon}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: labelData.sig === preset.id ? 'var(--primary-700)' : 'var(--neutral-700)' }}>
                                        {language === 'TH' ? preset.sig : preset.sigEN}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>หรือพิมพ์เอง</label>
                            <input type="text" value={labelData.sigCustom} onChange={e => setLabelData(p => ({ ...p, sigCustom: e.target.value, sig: 'custom' }))}
                                placeholder="พิมพ์วิธีใช้ยาด้วยตนเอง..."
                                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>

                    {/* Warnings */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={18} color="#f59e0b" /> คำเตือนและข้อควรระวัง
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {WARNING_PRESETS.map(warning => (
                                <button key={warning.id} onClick={() => toggleWarning(warning.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid',
                                    borderColor: labelData.warnings.includes(warning.id) ? warning.color : 'var(--neutral-200)',
                                    background: labelData.warnings.includes(warning.id) ? `${warning.color}10` : 'white',
                                    cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s'
                                }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '6px', border: '2px solid',
                                        borderColor: labelData.warnings.includes(warning.id) ? warning.color : 'var(--neutral-300)',
                                        background: labelData.warnings.includes(warning.id) ? warning.color : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {labelData.warnings.includes(warning.id) && <Check size={14} color="white" />}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-700)' }}>{warning.text}</span>
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>หมายเหตุเพิ่มเติม</label>
                            <textarea value={labelData.notes} onChange={e => setLabelData(p => ({ ...p, notes: e.target.value }))}
                                placeholder="หมายเหตุสำหรับคนไข้..."
                                rows={2}
                                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Prescriber & Dates */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>แพทย์ผู้สั่ง</label>
                                <input type="text" value={labelData.prescriber} onChange={e => setLabelData(p => ({ ...p, prescriber: e.target.value }))}
                                    placeholder="ชื่อแพทย์"
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>วันที่จ่ายยา</label>
                                <input type="date" value={labelData.dispensedDate} onChange={e => setLabelData(p => ({ ...p, dispensedDate: e.target.value }))}
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.4rem', display: 'block' }}>วันหมดอายุ</label>
                                <input type="date" value={labelData.expiryDate} onChange={e => setLabelData(p => ({ ...p, expiryDate: e.target.value }))}
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div style={{ position: 'sticky', top: '1rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>👁️ ตัวอย่างฉลากยา</h3>
                            <select value={labelSize} onChange={e => setLabelSize(e.target.value)}
                                style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--neutral-200)', borderRadius: '8px', fontSize: '0.8rem', background: 'white' }}>
                                {Object.entries(LABEL_SIZES).map(([k, v]) => (
                                    <option key={k} value={k}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ background: 'var(--neutral-50)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem' }}>
                            <LabelPreview />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <button onClick={handlePrint} style={{
                                padding: '0.9rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #0d9488, #14b8a6)', color: 'white',
                                fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: '0 8px 16px rgba(13, 148, 136, 0.2)'
                            }}>
                                <Printer size={18} /> พิมพ์ฉลาก
                            </button>
                            <button onClick={saveLabel} style={{
                                padding: '0.9rem', borderRadius: '12px', border: '1.5px solid var(--neutral-200)',
                                background: 'white', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                color: 'var(--neutral-700)'
                            }}>
                                <Save size={18} /> บันทึก
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-600)' }}>{savedLabels.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>ฉลากที่สร้าง</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{SIG_PRESETS.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>เทมเพลต Sig</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrugLabelSystem;
