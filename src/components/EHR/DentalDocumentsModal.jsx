import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Award, Calendar, ExternalLink, Hash, Printer, X, Activity,
    Send, Building2, FileText, Stethoscope, MapPin, Users
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const simpleHash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
    return Math.abs(h).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
};

const fmtLocaleDate = (iso, isThai) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(isThai ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const DentalDocumentsModal = ({
    certData,
    setCertData,
    referralData,
    setReferralData,
    patient,
    language,
    onClose,
    certNo,
    referralNo,
    settings,
    staff = []
}) => {
    const [docType, setDocType] = useState('certificate');
    const [selectedDentistId, setSelectedDentistId] = useState('');
    const isTh = language === 'TH';

    const dentists = useMemo(
        () =>
            (staff || []).filter(
                (s) =>
                    s.role === 'dentist' &&
                    (s.status == null || s.status === '' || s.status === 'active')
            ),
        [staff]
    );

    const applyDentistFromStaff = useCallback(
        (id) => {
            if (!id) return;
            const d = dentists.find((x) => x.id === id);
            if (!d) return;
            const name = (d.name || '').trim();
            const lic = (d.licenseNumber || d.license_number || '').trim();
            setCertData((prev) => ({ ...prev, doctorName: name, licenseNo: lic }));
            setReferralData((prev) => ({ ...prev, doctorName: name, licenseNo: lic }));
        },
        [dentists, setCertData, setReferralData]
    );

    useEffect(() => {
        const name = (certData.doctorName || '').trim();
        if (!name || dentists.length === 0) {
            setSelectedDentistId('');
            return;
        }
        const match = dentists.find((d) => (d.name || '').trim() === name);
        setSelectedDentistId(match?.id || '');
    }, [certData.doctorName, dentists]);

    const onDoctorNameInput = (e) => {
        const v = e.target.value;
        setCertData((prev) => ({ ...prev, doctorName: v }));
        setReferralData((prev) => ({ ...prev, doctorName: v }));
    };

    const onLicenseInput = (e) => {
        const v = e.target.value;
        setCertData((prev) => ({ ...prev, licenseNo: v }));
        setReferralData((prev) => ({ ...prev, licenseNo: v }));
    };

    const patientName = patient?.full_name || patient?.name || '—';
    const clinicNameTh = settings?.clinicInfo?.name?.TH || 'คลินิกทันตกรรม บ้านหมอฟัน';
    const clinicNameEn = settings?.clinicInfo?.name?.EN || 'Baan Mor Fun Dental Clinic';
    const clinicDesc = settings?.clinicInfo?.description?.TH || '';
    const clinicLogoUrl = settings?.clinicInfo?.logoUrl || '/clinic-logo-baan-mor-fun.png';

    const verifyHash = useMemo(
        () => simpleHash(`${certNo}|${referralNo}|${patient?.id || ''}`),
        [certNo, referralNo, patient?.id]
    );

    const handlePrint = useCallback(() => {
        setTimeout(() => window.print(), 120);
    }, []);

    const VerificationQR = ({ payload }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <QRCodeSVG value={payload} size={72} level="L" marginSize={0} />
            <span style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>VERIFY</span>
        </div>
    );

    const certQrPayload = `CIT-CERT|${certNo}|${patientName}|${certData.from}|${clinicNameTh}`;
    const refQrPayload = `CIT-REF|${referralNo}|${patientName}|${referralData.referDate}|${clinicNameTh}`;

    return (
        <>
        {/* Overlay only — must NOT wrap #dental-doc-print or print CSS hides everything */}
        <div
            className="no-print-dental-doc"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(14px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="card shadow-2xl"
                style={{
                    width: '100%',
                    maxWidth: '720px',
                    borderRadius: '28px',
                    background: 'white',
                    overflow: 'hidden',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div
                    style={{
                        padding: '1.75rem 2rem 1.25rem',
                        background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfeff 45%, #f8fafc 100%)',
                        borderBottom: '1px solid #e2e8f0',
                        flexShrink: 0
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    width: '52px',
                                    height: '52px',
                                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    boxShadow: '0 10px 24px rgba(13, 148, 136, 0.35)'
                                }}
                            >
                                <Stethoscope size={26} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                    {isTh ? 'เอกสารทางทันตกรรม' : 'Dental documents'}
                                </h2>
                                <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                                    {isTh ? 'ใบรับรองแพทย์และใบส่งตัว มาตรฐานทันตแพทย์ไทย' : 'Medical certificate & referral letter'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                color: '#64748b',
                                width: '42px',
                                height: '42px',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div
                        style={{
                            marginTop: '1.25rem',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            padding: '6px',
                            background: 'rgba(255,255,255,0.85)',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setDocType('certificate')}
                            style={{
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 850,
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: docType === 'certificate' ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'transparent',
                                color: docType === 'certificate' ? 'white' : '#475569',
                                boxShadow: docType === 'certificate' ? '0 8px 20px rgba(13,148,136,0.25)' : 'none'
                            }}
                        >
                            <Award size={18} />
                            {isTh ? 'ใบรับรองแพทย์' : 'Certificate'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDocType('referral')}
                            style={{
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 850,
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: docType === 'referral' ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'transparent',
                                color: docType === 'referral' ? 'white' : '#475569',
                                boxShadow: docType === 'referral' ? '0 8px 20px rgba(13,148,136,0.25)' : 'none'
                            }}
                        >
                            <Send size={18} />
                            {isTh ? 'ใบส่งตัว' : 'Referral'}
                        </button>
                    </div>
                </div>

                <div style={{ padding: '1.75rem 2rem 2rem', overflowY: 'auto', flex: 1 }}>
                    <div
                        style={{
                            marginBottom: '1.5rem',
                            padding: '1.25rem',
                            background: '#f1f5f9',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        <label style={{ ...labelStyle, marginBottom: '10px' }}>
                            <Users size={14} />{' '}
                            {isTh ? 'เลือกทันตแพทย์ (จากพนักงาน ตำแหน่ง dentist)' : 'Select dentist (staff · role: dentist)'}
                        </label>
                        <select
                            className="form-input"
                            value={selectedDentistId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setSelectedDentistId(id);
                                if (id) applyDentistFromStaff(id);
                            }}
                            style={{
                                width: '100%',
                                borderRadius: '14px',
                                marginBottom: '10px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">
                                {isTh ? '— เลือกจากรายชื่อ หรือพิมพ์ด้านล่าง —' : '— Pick from list or type below —'}
                            </option>
                            {dentists.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name || d.id}
                                    {(d.licenseNumber || d.license_number) ? ` · ${d.licenseNumber || d.license_number}` : ''}
                                </option>
                            ))}
                        </select>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', fontWeight: 600 }}>
                            {isTh ? (
                                <>
                                    จัดการรายชื่อและเลขใบอนุญาตได้ที่{' '}
                                    <a href="/management/staff" style={{ color: 'var(--primary-600)', fontWeight: 800 }}>
                                        จัดการพนักงาน
                                    </a>{' '}
                                    — บันทึกตำแหน่งเป็น <code style={{ fontSize: '0.7rem' }}>dentist</code> และเลขที่ใบอนุญาต
                                </>
                            ) : (
                                <>
                                    Manage names and licenses under{' '}
                                    <a href="/management/staff" style={{ color: 'var(--primary-600)', fontWeight: 800 }}>
                                        Staff management
                                    </a>
                                    .
                                </>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ ...labelStyle, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                    {isTh ? 'ชื่อทันตแพทย์' : 'Dentist name'}
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={certData.doctorName}
                                    onChange={onDoctorNameInput}
                                    style={{ width: '100%', background: 'white', borderRadius: '12px', fontSize: '0.88rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ ...labelStyle, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                    {isTh ? 'เลขที่ใบอนุญาต (ทันตกรรม)' : 'Dental license no.'}
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={certData.licenseNo}
                                    onChange={onLicenseInput}
                                    style={{ width: '100%', background: 'white', borderRadius: '12px', fontSize: '0.88rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    {docType === 'certificate' && (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f766e', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                                <Hash size={14} /> {certNo}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>
                                        <Activity size={14} /> {isTh ? 'ความเห็นทันตแพทย์ / การวินิจฉัย' : 'Clinical findings / diagnosis'}
                                    </label>
                                    <textarea
                                        className="form-input"
                                        value={certData.diagnosis}
                                        onChange={(e) => setCertData({ ...certData, diagnosis: e.target.value })}
                                        placeholder={isTh ? 'เช่น ถอนฟันกรามล่างขวา มีเลือดออกน้อย แนะนำพักฟื้น...' : 'e.g. post-extraction healing...'}
                                        style={{
                                            minHeight: '110px',
                                            width: '100%',
                                            borderRadius: '16px',
                                            padding: '1rem',
                                            fontSize: '0.92rem',
                                            fontWeight: 600,
                                            border: '2px solid #f1f5f9',
                                            background: '#f8fafc'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        <Calendar size={14} /> {isTh ? 'ให้พักฟื้น (วัน)' : 'Rest (days)'}
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min={0}
                                            value={certData.days}
                                            onChange={(e) => setCertData({ ...certData, days: e.target.value })}
                                            style={{ width: '88px', textAlign: 'center', borderRadius: '14px' }}
                                        />
                                        <span style={{ fontWeight: 800, color: '#475569' }}>{isTh ? 'วัน' : 'days'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        <ExternalLink size={14} /> {isTh ? 'ตั้งแต่วันที่' : 'From date'}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={certData.from}
                                        onChange={(e) => setCertData({ ...certData, from: e.target.value })}
                                        style={{ width: '100%', borderRadius: '14px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {docType === 'referral' && (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f766e', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                                <Hash size={14} /> {referralNo}
                            </div>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>
                                        <Building2 size={14} /> {isTh ? 'เรียน / ส่งไปยัง (หน่วยงาน/โรงพยาบาล/แพทย์)' : 'Refer to (institution / doctor)'}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={referralData.referTo}
                                        onChange={(e) => setReferralData({ ...referralData, referTo: e.target.value })}
                                        placeholder={isTh ? 'เช่น โรงพยาบาลศิริราช กลุ่มงานศัลยกรรมช่องปาก...' : 'Hospital / department / specialist'}
                                        style={{ width: '100%', borderRadius: '14px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>
                                            <Calendar size={14} /> {isTh ? 'วันที่ออกเอกสาร' : 'Document date'}
                                        </label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={referralData.referDate}
                                            onChange={(e) => setReferralData({ ...referralData, referDate: e.target.value })}
                                            style={{ width: '100%', borderRadius: '14px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>
                                            <FileText size={14} /> {isTh ? 'วัตถุประสงค์การส่งตัว' : 'Purpose'}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={referralData.purpose}
                                            onChange={(e) => setReferralData({ ...referralData, purpose: e.target.value })}
                                            placeholder={isTh ? 'เช่น ขอความเห็นเพิ่มเติม / ส่งต่อรักษา' : 'Purpose of referral'}
                                            style={{ width: '100%', borderRadius: '14px' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        <Activity size={14} /> {isTh ? 'สรุปทางคลินิก / ประวัติที่เกี่ยวข้อง' : 'Clinical summary'}
                                    </label>
                                    <textarea
                                        className="form-input"
                                        value={referralData.clinicalSummary}
                                        onChange={(e) => setReferralData({ ...referralData, clinicalSummary: e.target.value })}
                                        placeholder={isTh ? 'อาการสำคัญ การตรวจ รายการรักษาที่ทำแล้ว ยาที่ให้...' : 'History, exam, treatment given...'}
                                        style={{
                                            minHeight: '120px',
                                            width: '100%',
                                            borderRadius: '16px',
                                            padding: '1rem',
                                            fontSize: '0.92rem',
                                            fontWeight: 600,
                                            border: '2px solid #f1f5f9',
                                            background: '#f8fafc'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <p
                        style={{
                            margin: '1.25rem 0 0',
                            padding: '12px 14px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '14px',
                            color: '#92400e',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            lineHeight: 1.45
                        }}
                    >
                        {isTh ? (
                            <>
                                <strong>ก่อนบันทึก PDF:</strong> ในกล่องพิมพ์ของ Chrome ให้<strong>ปิด</strong>ตัวเลือก
                                «ส่วนหัวและส่วนท้ายกระดาษ» — จะไม่แสดงวันที่ ชื่อหน้าเว็บ URL และเลขหน้า
                                (เบราว์เซอร์ไม่ให้ซ่อนรายการนี้ด้วยโค้ดเว็บได้)
                            </>
                        ) : (
                            <>
                                <strong>Before saving PDF:</strong> In Chrome’s print dialog, <strong>uncheck</strong>{' '}
                                “Headers and footers” to hide date, page title, URL, and page numbers.
                            </>
                        )}
                    </p>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handlePrint}
                        style={{
                            width: '100%',
                            padding: '1.1rem',
                            borderRadius: '18px',
                            fontWeight: 900,
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 12px 28px rgba(13, 148, 136, 0.28)'
                        }}
                    >
                        <Printer size={20} />
                        {isTh ? 'พิมพ์เอกสาร' : 'Print document'}
                    </button>
                    <p style={{ margin: '12px 0 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
                        {isTh ? 'เลขอ้างอิง:' : 'Ref:'} {docType === 'certificate' ? certNo : referralNo} · {verifyHash}
                    </p>
                </div>
            </motion.div>
        </div>

        {/* Printable — sibling of overlay so .no-print-dental-doc does not hide it */}
            <div id="dental-doc-print" className="dental-doc-print-page">
                <style>
                    {`
                        @media screen {
                            #dental-doc-print {
                                position: fixed;
                                left: -200vw;
                                top: 0;
                                width: 210mm;
                                pointer-events: none;
                            }
                        }
                        @media print {
                            @page { size: A4 portrait; margin: 12mm; }
                            body * { visibility: hidden !important; }
                            .no-print-dental-doc { display: none !important; }
                            #dental-doc-print, #dental-doc-print * { visibility: visible !important; }
                            #dental-doc-print {
                                position: fixed !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                min-height: auto !important;
                                background: white !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                z-index: 2147483647 !important;
                            }
                        }
                    `}
                </style>

                {docType === 'certificate' && (
                    <div
                        style={{
                            fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
                            color: '#0f172a',
                            padding: '8mm 10mm',
                            paddingBottom: '14mm',
                            boxSizing: 'border-box',
                            position: 'relative',
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
                        }}
                    >
                        <div
                            style={{
                                height: '6px',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, #0d9488 0%, #2dd4bf 40%, #0f766e 100%)',
                                marginBottom: '14px'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', borderBottom: '2px solid #0d9488', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                <img
                                    src={clinicLogoUrl}
                                    alt=""
                                    style={{
                                        height: '56px',
                                        width: 'auto',
                                        maxWidth: '170px',
                                        objectFit: 'contain',
                                        display: 'block',
                                        WebkitPrintColorAdjust: 'exact',
                                        printColorAdjust: 'exact'
                                    }}
                                />
                                <div>
                                    <div style={{ fontSize: '15pt', fontWeight: 800, color: '#0f766e', letterSpacing: '-0.02em' }}>{clinicNameTh}</div>
                                    <div style={{ fontSize: '10pt', color: '#475569', fontWeight: 600 }}>{clinicNameEn}</div>
                                    {clinicDesc ? <div style={{ fontSize: '9pt', color: '#64748b', marginTop: '2px' }}>{clinicDesc}</div> : null}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13pt', fontWeight: 800 }}>
                                    {isTh ? 'ใบรับรองแพทย์ (ทันตกรรม)' : 'Dental Medical Certificate'}
                                </div>
                                <div style={{ fontSize: '9pt', color: '#475569', fontWeight: 600 }}>
                                    {isTh ? 'Dental Medical Certificate' : 'ใบรับรองแพทย์ (ทันตกรรม)'}
                                </div>
                                <div style={{ fontSize: '8.5pt', color: '#b91c1c', fontWeight: 700, marginTop: '4px' }}>
                                    {isTh ? 'เลขที่' : 'No.'} {certNo}
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '11pt', lineHeight: 1.85, marginBottom: '14px' }}>
                            {isTh ? (
                                <>
                                    <div>
                                        ข้าพเจ้า <span style={{ fontWeight: 700 }}>{certData.doctorName}</span> ทันตแพทย์
                                    </div>
                                    <div>
                                        เลขที่ใบอนุญาตประกอบวิชาชีพทันตกรรม <span style={{ fontWeight: 700 }}>{certData.licenseNo}</span>
                                    </div>
                                    <div style={{ marginTop: '8px' }}>
                                        ได้ทำการตรวจรักษาทางทันตกรรมแก่ <span style={{ fontWeight: 800, fontSize: '12pt' }}>คุณ{patientName}</span>
                                    </div>
                                    <div>
                                        อายุ <span style={{ fontWeight: 700 }}>{patient?.age != null && patient?.age !== '' ? `${patient.age} ปี` : '—'}</span>
                                        {' · HN '}
                                        <span style={{ fontWeight: 700 }}>{patient?.hn || '—'}</span>
                                    </div>
                                    <div>
                                        เมื่อวันที่ <span style={{ fontWeight: 700 }}>{fmtLocaleDate(certData.from, true)}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        I, <span style={{ fontWeight: 700 }}>{certData.doctorName}</span>, dentist,
                                    </div>
                                    <div>
                                        Dental Council license no. <span style={{ fontWeight: 700 }}>{certData.licenseNo}</span>
                                    </div>
                                    <div style={{ marginTop: '8px' }}>
                                        have examined and provided dental care for{' '}
                                        <span style={{ fontWeight: 800, fontSize: '12pt' }}>{patientName}</span>
                                    </div>
                                    <div>
                                        Age <span style={{ fontWeight: 700 }}>{patient?.age != null && patient?.age !== '' ? `${patient.age} y` : '—'}</span>
                                        {' · HN '}
                                        <span style={{ fontWeight: 700 }}>{patient?.hn || '—'}</span>
                                    </div>
                                    <div>
                                        Visit date: <span style={{ fontWeight: 700 }}>{fmtLocaleDate(certData.from, false)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '12px 14px',
                                marginBottom: '14px'
                            }}
                        >
                            <div style={{ fontSize: '9pt', fontWeight: 800, color: '#64748b', marginBottom: '6px', letterSpacing: '0.04em' }}>
                                {isTh ? 'ความเห็นของทันตแพทย์ / การวินิจฉัย' : 'Clinical findings / diagnosis'}
                            </div>
                            <div style={{ fontSize: '11.5pt', fontWeight: 600, whiteSpace: 'pre-wrap', minHeight: '56px' }}>{certData.diagnosis || '—'}</div>
                        </div>

                        <div style={{ fontSize: '11pt', lineHeight: 1.75, marginBottom: '22px' }}>
                            {isTh ? (
                                <>
                                    เห็นควรให้งดงานหรือพักฟื้นตามความเหมาะสม เป็นเวลา{' '}
                                    <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '13pt' }}>{certData.days || '—'}</span> วัน
                                    นับตั้งแต่วันที่ <span style={{ fontWeight: 700 }}>{fmtLocaleDate(certData.from, true)}</span>
                                    <span style={{ color: '#64748b', fontSize: '9.5pt', display: 'block', marginTop: '6px' }}>
                                        (ระยะเวลาพักฟื้นอาจปรับตามลักษณะการรักษาทางทันตกรรมและดุลยพินิจของผู้รับบริการ)
                                    </span>
                                </>
                            ) : (
                                <>
                                    Recommended rest from work or school for{' '}
                                    <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '13pt' }}>{certData.days || '—'}</span> day(s),
                                    starting <span style={{ fontWeight: 700 }}>{fmtLocaleDate(certData.from, false)}</span>
                                    <span style={{ color: '#64748b', fontSize: '9.5pt', display: 'block', marginTop: '6px' }}>
                                        (Duration may vary depending on the dental procedure and clinical course.)
                                    </span>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                            <div>
                                <VerificationQR payload={certQrPayload} />
                                <div style={{ fontSize: '7pt', color: '#94a3b8', marginTop: '6px', maxWidth: '140px', lineHeight: 1.35 }}>
                                    {isTh ? 'สแกนตรวจสอบความถูกต้องของเอกสาร' : 'Scan to verify this document'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div style={{ height: '36px' }} />
                                <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '6px' }} />
                                <div style={{ fontWeight: 800, fontSize: '11pt' }}>( {certData.doctorName} )</div>
                                <div style={{ fontSize: '9.5pt', color: '#475569' }}>{isTh ? 'ทันตแพทย์ผู้ตรวจรักษา' : 'Attending dentist'}</div>
                                <div style={{ fontSize: '8.5pt', color: '#94a3b8', marginTop: '4px' }}>License {certData.licenseNo}</div>
                            </div>
                        </div>

                        <div
                            style={{
                                position: 'absolute',
                                bottom: '8mm',
                                left: '10mm',
                                right: '10mm',
                                fontSize: '7pt',
                                color: '#cbd5e1',
                                borderTop: '0.5px dashed #e2e8f0',
                                paddingTop: '6px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span>{clinicNameTh} · {verifyHash}</span>
                            <span>{isTh ? 'พิมพ์เมื่อ' : 'Printed'} {new Date().toLocaleString(isTh ? 'th-TH' : 'en-US')}</span>
                        </div>
                    </div>
                )}

                {docType === 'referral' && (
                    <div
                        style={{
                            fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
                            color: '#0f172a',
                            padding: '8mm 10mm',
                            paddingBottom: '14mm',
                            boxSizing: 'border-box',
                            position: 'relative',
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
                        }}
                    >
                        <div
                            style={{
                                height: '6px',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, #0e7490 0%, #22d3ee 45%, #0f766e 100%)',
                                marginBottom: '14px'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', borderBottom: '2px solid #0e7490', paddingBottom: '12px', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                <img
                                    src={clinicLogoUrl}
                                    alt=""
                                    style={{
                                        height: '56px',
                                        width: 'auto',
                                        maxWidth: '170px',
                                        objectFit: 'contain',
                                        display: 'block',
                                        WebkitPrintColorAdjust: 'exact',
                                        printColorAdjust: 'exact'
                                    }}
                                />
                                <div>
                                    <div style={{ fontSize: '15pt', fontWeight: 800, color: '#0e7490', letterSpacing: '-0.02em' }}>{clinicNameTh}</div>
                                    <div style={{ fontSize: '10pt', color: '#475569', fontWeight: 600 }}>{clinicNameEn}</div>
                                    {clinicDesc ? <div style={{ fontSize: '9pt', color: '#64748b', marginTop: '2px' }}>{clinicDesc}</div> : null}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13pt', fontWeight: 800 }}>
                                    {isTh ? 'ใบส่งตัว (ทันตกรรม)' : 'Dental Referral Letter'}
                                </div>
                                <div style={{ fontSize: '9pt', color: '#475569', fontWeight: 600 }}>
                                    {isTh ? 'Dental Referral Letter' : 'ใบส่งตัว (ทันตกรรม)'}
                                </div>
                                <div style={{ fontSize: '8.5pt', color: '#b91c1c', fontWeight: 700, marginTop: '4px' }}>
                                    {isTh ? 'เลขที่' : 'No.'} {referralNo}
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '11pt', lineHeight: 1.9, marginBottom: '12px' }}>
                            <div style={{ fontWeight: 800 }}>
                                {isTh ? 'เรียน' : 'To'} {referralData.referTo || (isTh ? '……………………………………' : '________________________')}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                {isTh
                                    ? 'เรื่อง ส่งตัวผู้ป่วยเพื่อการรักษาทางทันตกรรม / สุขภาพช่องปาก'
                                    : 'Re: Referral for oral & dental care'}
                            </div>
                        </div>

                        <div style={{ fontSize: '11pt', lineHeight: 1.85, marginBottom: '14px' }}>
                            {isTh ? (
                                <>
                                    ด้วยทางคลินิกได้ทำการตรวจรักษาทางทันตกรรมแก่{' '}
                                    <span style={{ fontWeight: 800 }}>คุณ{patientName}</span> อายุ{' '}
                                    <span style={{ fontWeight: 700 }}>{patient?.age != null && patient?.age !== '' ? `${patient.age} ปี` : '—'}</span>
                                    {' · HN '}
                                    <span style={{ fontWeight: 700 }}>{patient?.hn || '—'}</span>
                                    {patient?.phone ? (
                                        <>
                                            {' · โทร '}
                                            <span style={{ fontWeight: 600 }}>{patient.phone}</span>
                                        </>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    The patient <span style={{ fontWeight: 800 }}>{patientName}</span>, age{' '}
                                    <span style={{ fontWeight: 700 }}>{patient?.age != null && patient?.age !== '' ? `${patient.age} y` : '—'}</span>
                                    {', HN '}
                                    <span style={{ fontWeight: 700 }}>{patient?.hn || '—'}</span>
                                    {patient?.phone ? (
                                        <>
                                            {', Tel. '}
                                            <span style={{ fontWeight: 600 }}>{patient.phone}</span>
                                        </>
                                    ) : null}
                                    , has been assessed at this clinic.
                                </>
                            )}
                        </div>

                        <div style={{ fontSize: '10.5pt', fontWeight: 700, color: '#0f766e', marginBottom: '6px' }}>
                            {isTh ? 'วัตถุประสงค์การส่งตัว' : 'Purpose of referral'}
                        </div>
                        <div style={{ fontSize: '11pt', marginBottom: '14px', lineHeight: 1.7 }}>{referralData.purpose || '—'}</div>

                        <div style={{ fontSize: '10.5pt', fontWeight: 700, color: '#0f766e', marginBottom: '6px' }}>
                            {isTh ? 'สรุปทางคลินิก / ประวัติที่เกี่ยวข้อง' : 'Clinical summary'}
                        </div>
                        <div
                            style={{
                                fontSize: '11pt',
                                lineHeight: 1.75,
                                whiteSpace: 'pre-wrap',
                                minHeight: '100px',
                                padding: '12px 14px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                marginBottom: '18px'
                            }}
                        >
                            {referralData.clinicalSummary || '—'}
                        </div>

                        <div style={{ fontSize: '11pt', lineHeight: 1.85, marginBottom: '22px' }}>
                            {isTh
                                ? 'จึงเรียนมาเพื่อทราบและโปรดพิจารณาดำเนินการรักษาต่อไปตามความเหมาะสม ทั้งนี้ทางคลินิกยินดีให้ความร่วมมือหากต้องการข้อมูลเพิ่มเติม'
                                : 'We respectfully request your continued management as appropriate. Please contact the clinic if further information is required.'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <VerificationQR payload={refQrPayload} />
                                <div style={{ fontSize: '7pt', color: '#94a3b8', marginTop: '6px' }}>
                                    {isTh ? 'ออก ณ วันที่' : 'Dated'} {fmtLocaleDate(referralData.referDate, isTh)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', width: '220px' }}>
                                <div style={{ height: '36px' }} />
                                <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '6px' }} />
                                <div style={{ fontWeight: 800, fontSize: '11pt' }}>( {referralData.doctorName} )</div>
                                <div style={{ fontSize: '9.5pt', color: '#475569' }}>{isTh ? 'ทันตแพทย์ผู้ส่งตัว' : 'Referring dentist'}</div>
                                <div style={{ fontSize: '8.5pt', color: '#94a3b8', marginTop: '4px' }}>License {referralData.licenseNo}</div>
                            </div>
                        </div>

                        <div
                            style={{
                                position: 'absolute',
                                bottom: '8mm',
                                left: '10mm',
                                right: '10mm',
                                fontSize: '7pt',
                                color: '#cbd5e1',
                                borderTop: '0.5px dashed #e2e8f0',
                                paddingTop: '6px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={10} /> {isTh ? clinicNameTh : clinicNameEn}
                            </span>
                            <span>{verifyHash}</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.78rem',
    fontWeight: 850,
    color: '#64748b',
    marginBottom: '8px',
    letterSpacing: '0.02em'
};

export default DentalDocumentsModal;
