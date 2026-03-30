import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, Printer, CreditCard, DollarSign, Smartphone, FileText, Calendar, Plus, X } from 'lucide-react';
import ReceiptModal from '../Billing/ReceiptModal';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

const BillingTab = ({ patient }) => {
    const { t, language } = useLanguage();
    const { updatePatient, deductStockForTreatment } = useData();
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showReceipt, setShowReceipt] = useState(false);
    const [showCert, setShowCert] = useState(false);
    const [showInstallment, setShowInstallment] = useState(false);

    // PromptPay Data
    const [promptPayId, setPromptPayId] = useState(() => localStorage.getItem('ciki_promptpay_id') || '');

    useEffect(() => {
        localStorage.setItem('ciki_promptpay_id', promptPayId);
    }, [promptPayId]);

    // Receipt & Cert Data
    const [lastPaymentData, setLastPaymentData] = useState(null);
    const [certData, setCertData] = useState({ diagnosis: '', days: '1', from: new Date().toISOString().split('T')[0] });

    // Installment Data
    const [installmentForm, setInstallmentForm] = useState({ total: 0, down: 0, months: 6 });

    // Insurance Claim Data
    const [claimAmount, setClaimAmount] = useState(0);
    const [copayMethod, setCopayMethod] = useState('cash');

    const unpaidTreatments = (patient.treatments || []).filter(t => t.paymentStatus !== 'paid');
    const totalAmount = unpaidTreatments.reduce((sum, item) => sum + (item.price || 0), 0);
    const hasInstallmentPlan = patient.installmentPlan;

    // Insurance Limit Logic
    const currentYear = new Date().getFullYear();
    const usedInsuranceAmount = (patient.treatments || [])
        .filter(t => t.paymentStatus === 'paid' && t.insuranceClaimAmount > 0 && new Date(t.paidDate).getFullYear() === currentYear)
        .reduce((sum, t) => sum + (t.insuranceClaimAmount || 0), 0);

    const ssoLimit = 900;
    const insuranceLimit = patient.insuranceType === 'SSO' ? ssoLimit : (Number(patient.insuranceLimit) || 0);
    const remainingLimit = Math.max(0, insuranceLimit - usedInsuranceAmount);

    // --- Smart Billing Auto-Detection ---
    useEffect(() => {
        if (patient.insuranceType === 'SSO' && remainingLimit > 0 && unpaidTreatments.length > 0 && paymentMethod !== 'claim') {
            setPaymentMethod('claim');
            setClaimAmount(Math.min(totalAmount, remainingLimit));
        }
    }, [patient.insuranceType, remainingLimit, totalAmount, unpaidTreatments.length]);

    // --- Actions ---
    const handleCheckout = () => {
        if (unpaidTreatments.length === 0) return;
        if (!confirm('Confirm Payment?')) return;

        const paidDate = new Date().toISOString();

        // Prepare method string
        let methodStr = paymentMethod;
        let finalClaim = 0;
        let finalCopay = 0;

        if (paymentMethod === 'claim') {
            finalClaim = claimAmount > 0 ? claimAmount : Math.min(totalAmount, remainingLimit);
            finalCopay = totalAmount - finalClaim;
            methodStr = `Claim (฿${finalClaim.toLocaleString()})` + (finalCopay > 0 ? ` + ${copayMethod} (฿${finalCopay.toLocaleString()})` : '');
        } else {
            // Cash/Transfer also track copay as total
            finalCopay = totalAmount;
        }

        const updatedTreatments = patient.treatments.map(t =>
            t.paymentStatus !== 'paid' ? {
                ...t,
                paymentStatus: 'paid',
                paidDate,
                paymentMethod: methodStr,
                insuranceClaimAmount: paymentMethod === 'claim' ? (t.price / totalAmount) * finalClaim : 0 // Distribute claim proportionally
            } : t
        );
        updatePatient(patient.id, { treatments: updatedTreatments });

        unpaidTreatments.forEach(t => deductStockForTreatment(t.procedure));

        setLastPaymentData({
            items: unpaidTreatments,
            total: totalAmount,
            date: paidDate,
            method: methodStr,
            patientName: patient.name,
            patientId: patient.id,
            claimAmount: finalClaim,
            copayAmount: finalCopay
        });
        setShowReceipt(true);
    };

    const handlePrintBill = () => {
        if (unpaidTreatments.length === 0) return;

        let finalClaim = 0;
        let finalCopay = totalAmount;

        if (paymentMethod === 'claim') {
            finalClaim = claimAmount > 0 ? claimAmount : Math.min(totalAmount, remainingLimit);
            finalCopay = totalAmount - finalClaim;
        }

        setLastPaymentData({
            items: unpaidTreatments,
            total: totalAmount,
            date: new Date().toISOString(),
            method: 'Pending',
            patientName: patient.name,
            patientId: patient.id,
            claimAmount: finalClaim,
            copayAmount: finalCopay
        });

        setShowReceipt(true);
    };

    const handleCreateInstallment = () => {
        const plan = {
            total: Number(installmentForm.total),
            paid: Number(installmentForm.down),
            months: Number(installmentForm.months),
            monthly: Math.ceil((Number(installmentForm.total) - Number(installmentForm.down)) / Number(installmentForm.months)),
            startDate: new Date().toISOString(),
            status: 'Active',
            history: [{ date: new Date().toISOString(), amount: Number(installmentForm.down), note: 'Down Payment' }]
        };
        updatePatient(patient.id, { installmentPlan: plan });
        setShowInstallment(false);
    };

    const handlePayInstallment = () => {
        if (!hasInstallmentPlan) return;
        const amount = prompt("Enter payment amount:", hasInstallmentPlan.monthly);
        if (amount) {
            const newPaid = hasInstallmentPlan.paid + Number(amount);
            const newHistory = [...hasInstallmentPlan.history, { date: new Date().toISOString(), amount: Number(amount), note: 'Monthly Installment' }];
            const status = newPaid >= hasInstallmentPlan.total ? 'Completed' : 'Active';

            updatePatient(patient.id, {
                installmentPlan: { ...hasInstallmentPlan, paid: newPaid, history: newHistory, status }
            });
        }
    };

    // --- Main Render ---
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Pending Items */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{t('bill_pending_items')}</h3>
                    {unpaidTreatments.length === 0 ? (
                        <div style={{ color: 'var(--neutral-400)', textAlign: 'center' }}>{language === 'TH' ? 'ไม่มีรายการค้างชำระ' : 'No pending items'}</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {unpaidTreatments.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}>{item.procedure}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>฿{item.price?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Installment Plan Section */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 800 }}>{t('bill_installment_plan')}</h3>
                        {!hasInstallmentPlan && (
                            <button className="btn btn-secondary" onClick={() => setShowInstallment(true)} style={{ borderRadius: '12px' }}>
                                <Plus size={16} /> {t('bill_new_plan')}
                            </button>
                        )}
                    </div>
                    {hasInstallmentPlan ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Progress</span>
                                <span style={{ fontWeight: 600 }}>{Math.round((hasInstallmentPlan.paid / hasInstallmentPlan.total) * 100)}%</span>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{ height: '100%', background: '#3b82f6', width: `${(hasInstallmentPlan.paid / hasInstallmentPlan.total) * 100}%` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>Paid: ฿{hasInstallmentPlan.paid.toLocaleString()}</span>
                                <span>Total: ฿{hasInstallmentPlan.total.toLocaleString()}</span>
                            </div>
                            <button className="btn btn-primary" onClick={handlePayInstallment} style={{ marginTop: '1rem', width: '100%', borderRadius: '12px', fontWeight: 700 }}>{language === 'TH' ? 'ชำระงวดถัดไป' : 'Pay Next Installment'}</button>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--neutral-400)' }}>{language === 'TH' ? 'ยังไม่มีแผนการผ่อนชำระ' : 'No active installment plan.'}</p>
                    )}
                </div>
            </div>

            {/* Payment Summary Panel */}
            <div className="card" style={{ padding: '2rem', height: 'fit-content', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '24px' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>{t('bill_summary')}</h3>
                <div style={{ margin: '1rem 0', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-700)', letterSpacing: '-0.025em' }}>฿{totalAmount.toLocaleString()}</div>

                <label style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>
                    {t('bill_payment_method')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {['cash', 'transfer', 'card', 'claim'].map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)}
                            style={{ 
                                padding: '0.75rem 0.5rem', 
                                borderRadius: '12px', 
                                fontSize: '0.9rem',
                                fontWeight: paymentMethod === m ? 800 : 500,
                                border: paymentMethod === m ? '2px solid var(--primary-600)' : '1.5px solid #ddd', 
                                background: paymentMethod === m ? 'var(--primary-50)' : 'white',
                                color: paymentMethod === m ? 'var(--primary-700)' : 'var(--neutral-600)',
                                transition: 'all 0.2s ease'
                            }}>
                            {m === 'cash' && t('bill_cash')}
                            {m === 'transfer' && t('bill_transfer')}
                            {m === 'card' && t('bill_card')}
                            {m === 'claim' && t('bill_insurance')}
                        </button>
                    ))}
                </div>

                {paymentMethod === 'transfer' && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>PromptPay ID (Mobile/Tax ID)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={promptPayId}
                            onChange={(e) => setPromptPayId(e.target.value)}
                            placeholder="08xxxxxxxx or 13-digit ID"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        {promptPayId && totalAmount > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <img
                                    src={`https://promptpay.io/${promptPayId}/${totalAmount}.png`}
                                    alt="PromptPay QR Code"
                                    style={{ width: '200px', height: '200px', mixBlendMode: 'multiply' }}
                                />
                                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                    App- generated QR (Amount Locked: ฿{totalAmount.toLocaleString()})
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {paymentMethod === 'claim' && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #dcfce7', borderRadius: '8px', background: '#f0fdf4' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                <span style={{ color: '#166534', fontWeight: 600 }}>
                                    {patient.insuranceType === 'SSO' ? 'SSO Dental Limit' : 'Insurance Limit'}
                                </span>
                                <span style={{ color: '#166534' }}>
                                    ฿{usedInsuranceAmount.toLocaleString()} / ฿{insuranceLimit.toLocaleString()}
                                </span>
                            </div>
                            <div style={{ height: '8px', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    background: remainingLimit === 0 ? '#ef4444' : '#166534',
                                    width: `${Math.min(100, (usedInsuranceAmount / insuranceLimit) * 100)}%`,
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '0.25rem', color: remainingLimit === 0 ? '#b91c1c' : '#166534' }}>
                                Remaining: ฿{remainingLimit.toLocaleString()}
                            </div>
                        </div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#166534', fontWeight: 600 }}>
                            {language === 'TH' ? 'ยอดที่เคลมได้ (บาท)' : 'Claim Amount (THB)'}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
                                className="input-field"
                                value={claimAmount}
                                onChange={(e) => setClaimAmount(Number(e.target.value))}
                                placeholder="Amount covered by insurance"
                                style={{ flex: 1, marginBottom: '1rem', borderColor: remainingLimit < claimAmount ? '#ef4444' : '#86efac' }}
                            />
                            <button
                                style={{
                                    height: '42px',
                                    padding: '0 1rem',
                                    background: '#dcfce7',
                                    color: '#166534',
                                    border: '1px solid #86efac',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                                onClick={() => setClaimAmount(Math.min(totalAmount, remainingLimit))}
                            >
                                Max
                            </button>
                        </div>
                        {claimAmount > remainingLimit && (
                            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                                Warning: Exceeds remaining limit of ฿{remainingLimit.toLocaleString()}
                            </p>
                        )}

                        {totalAmount - claimAmount > 0 && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #bbf7d0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#b91c1c', fontWeight: 700 }}>
                                    <span>{language === 'TH' ? 'ยอดส่วนเกิน (Co-pay)' : 'Patient Co-pay'}</span>
                                    <span>฿{(totalAmount - claimAmount).toLocaleString()}</span>
                                </div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    {language === 'TH' ? 'วิธีชำระส่วนเกิน' : 'Co-pay Method'}
                                </label>
                                <select
                                    className="input-field"
                                    value={copayMethod}
                                    onChange={(e) => setCopayMethod(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="cash">{t('bill_cash')}</option>
                                    <option value="transfer">{t('bill_transfer')}</option>
                                    <option value="card">{t('bill_card')}</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                <button 
                    className="btn btn-primary" 
                    onClick={handleCheckout} 
                    style={{ width: '100%', marginBottom: '1rem', padding: '1.25rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}
                >
                    {t('bill_confirm_payment')}
                </button>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={handlePrintBill} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px', padding: '0.75rem' }}>
                        <Printer size={16} /> {t('bill_print_bill')}
                    </button>
                </div>

                <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                    {/* ออกใบรับรองแพทย์ - recreated */}
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowCert(true)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginTop: '0.5rem',
                            borderRadius: '12px'
                        }}
                    >
                        <FileText size={16} />
                        {language === 'TH' ? 'ออกใบรับรองแพทย์' : 'Medical Certificate'}
                    </button>

                    {patient.treatments?.some(t => t.paymentStatus === 'paid') && (
                        <button className="btn btn-secondary" onClick={() => {
                            const last = patient.treatments.filter(t => t.paymentStatus === 'paid').pop();
                            if (last) {
                                setLastPaymentData({ items: [last], total: last.price, date: last.paidDate, patientName: patient.name });
                                setShowReceipt(true);
                            }
                        }} style={{ width: '100%', marginTop: '0.5rem', borderRadius: '12px' }}>{language === 'TH' ? 'พิมพ์ใบเสร็จล่าสุดอีกครั้ง' : 'Reprint Last Receipt'}</button>
                    )}
                </div>

                {showReceipt && lastPaymentData && (
                    <ReceiptModal 
                        isOpen={showReceipt} 
                        onClose={() => setShowReceipt(false)} 
                        data={lastPaymentData} 
                    />
                )}

                {/* --- Modals Rendered at the end of BillingTab --- */}
                {showCert && ReactDOM.createPortal(
                    <CertModal 
                        certData={certData} 
                        setCertData={setCertData} 
                        patient={patient} 
                        language={language} 
                        setShowCert={setShowCert} 
                    />,
                    document.body
                )}
                {showInstallment && ReactDOM.createPortal(
                    <InstallmentModal 
                        installmentForm={installmentForm}
                        setInstallmentForm={setInstallmentForm}
                        handleCreateInstallment={handleCreateInstallment}
                        setShowInstallment={setShowInstallment}
                    />,
                    document.body
                )}
            </div>
        </div>
    );
};

// --- Extracted Modals (Moved Outside to fix typing focus issue and improved styling) ---

const CertModal = ({ certData, setCertData, patient, language, setShowCert }) => {
    const todayTH = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const startDateTH = new Date(certData.from).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const endDateTH = new Date(new Date(certData.from).getTime() + (Number(certData.days) * 24 * 60 * 60 * 1000)).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="cert-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCert(false)}>
            <div className="cert-modal-container">
                {/* Header */}
                <div className="cert-modal-header">
                    <div className="cert-modal-title-group">
                        <div className="cert-modal-icon">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h2 className="cert-modal-title">{language === 'TH' ? 'ออกใบรับรองแพทย์' : 'Medical Certificate'}</h2>
                            <p className="cert-modal-subtitle">HN: {patient.id} | {patient.name}</p>
                        </div>
                    </div>
                    <button className="cert-modal-close" onClick={() => setShowCert(false)}>
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="cert-modal-content">
                    {/* Form Section */}
                    <div className="cert-form-section">
                        <div className="cert-form-group">
                            <label className="cert-label">{language === 'TH' ? 'การวินิจฉัยโรค' : 'Diagnosis'}</label>
                            <textarea
                                className="cert-textarea"
                                value={certData.diagnosis}
                                onChange={e => setCertData({ ...certData, diagnosis: e.target.value })}
                                placeholder={language === 'TH' ? 'เช่น ปวดฟันเนื้อตาย, ถอนฟันคุด, อุดฟัน' : 'e.g. Root canal treatment, Wisdom tooth removal'}
                                rows={4}
                                autoFocus
                            />
                        </div>

                        <div className="cert-form-row">
                            <div className="cert-form-group cert-form-half">
                                <label className="cert-label">{language === 'TH' ? 'จำนวนวันหยุด' : 'Rest Days'}</label>
                                <div className="cert-input-wrapper">
                                    <input
                                        className="cert-input"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={certData.days}
                                        onChange={e => setCertData({ ...certData, days: e.target.value })}
                                    />
                                    <span className="cert-input-suffix">{language === 'TH' ? 'วัน' : 'days'}</span>
                                </div>
                            </div>
                            <div className="cert-form-group cert-form-half">
                                <label className="cert-label">{language === 'TH' ? 'เริ่มตั้งแต่วันที่' : 'From Date'}</label>
                                <input
                                    className="cert-input"
                                    type="date"
                                    value={certData.from}
                                    onChange={e => setCertData({ ...certData, from: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="cert-summary-box">
                            <div className="cert-summary-item">
                                <span className="cert-summary-label">{language === 'TH' ? 'ถึงวันที่' : 'To Date'}</span>
                                <span className="cert-summary-value">{endDateTH}</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="cert-preview-section">
                        <div className="cert-preview-label">{language === 'TH' ? 'ตัวอย่างเอกสาร' : 'Document Preview'}</div>
                        <div className="cert-preview-page">
                            <div className="cert-preview-header">
                                <div className="cert-preview-logo">CIKI DENTAL</div>
                                <div className="cert-preview-doc-title">ใบรับรองแพทย์</div>
                            </div>
                            <div className="cert-preview-body">
                                <p className="cert-preview-patient"><strong>{patient.name}</strong></p>
                                <p className="cert-preview-date">{todayTH}</p>
                                <div className="cert-preview-diagnosis">
                                    {certData.diagnosis || (language === 'TH' ? 'ไม่ระบุการวินิจฉัย' : 'No diagnosis specified')}
                                </div>
                                <div className="cert-preview-rest">
                                    {language === 'TH' ? 'พักรักษาตัว' : 'Rest for'} <strong>{certData.days}</strong> {language === 'TH' ? 'วัน' : 'days'}
                                </div>
                            </div>
                            <div className="cert-preview-footer">
                                <div className="cert-preview-signature">ทันตแพทย์ผู้ตรวจ</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="cert-modal-actions">
                    <button className="cert-btn cert-btn-secondary" onClick={() => setShowCert(false)}>
                        {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button className="cert-btn cert-btn-primary" onClick={handlePrint}>
                        <Printer size={18} />
                        {language === 'TH' ? 'พิมพ์ใบรับรองแพทย์' : 'Print Certificate'}
                    </button>
                </div>

                {/* Print Layout (Hidden) */}
                <div className="cert-printable">
                    <div className="cert-a4-page">
                        {/* Official Border Frame */}
                        <div className="cert-official-frame">
                            <div className="cert-frame-corner cert-tl"></div>
                            <div className="cert-frame-corner cert-tr"></div>
                            <div className="cert-frame-corner cert-bl"></div>
                            <div className="cert-frame-corner cert-br"></div>
                        </div>

                        {/* Watermark */}
                        <div className="cert-watermark">
                            <div className="cert-watermark-logo">บ้านหมอฟัน</div>
                            <div className="cert-watermark-text">DENTAL HOME CLINIC</div>
                        </div>
                        
                        {/* Main Content */}
                        <div className="cert-main-content">
                            {/* Official Header */}
                            <div className="cert-official-header">
                                <div className="cert-header-left">
                                    <div className="cert-logo-official">
                                        <img src="/logo.png" alt="บ้านหมอฟัน" />
                                    </div>
                                    <div className="cert-clinic-info-official">
                                        <h1 className="cert-clinic-name">บ้านหมอฟัน</h1>
                                        <p className="cert-clinic-name-en">DENTAL HOME CLINIC</p>
                                        <div className="cert-clinic-address">
                                            <p>123 Clinic Road, Dental District, Bangkok 10110</p>
                                            <p>โทร: 02-123-4567 | www.dentalhomeclinic.com</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="cert-doc-info">
                                    <div className="cert-doc-type">
                                        <h2>ใบรับรองแพทย์</h2>
                                        <p className="cert-doc-type-en">MEDICAL CERTIFICATE</p>
                                    </div>
                                    <div className="cert-doc-meta">
                                        <div className="cert-meta-row">
                                            <span className="cert-meta-label">เลขที่เอกสาร</span>
                                            <span className="cert-meta-value cert-doc-no">MC-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(new Date().getDate()).padStart(2, '0')}-{patient.id}</span>
                                        </div>
                                        <div className="cert-meta-row">
                                            <span className="cert-meta-label">วันที่ออกเอกสาร</span>
                                            <span className="cert-meta-value">{todayTH}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="cert-official-divider">
                                <div className="cert-divider-line"></div>
                                <div className="cert-divider-star">✦</div>
                                <div className="cert-divider-line"></div>
                            </div>

                            {/* Patient Information Section */}
                            <div className="cert-section">
                                <div className="cert-section-title">
                                    <span className="cert-title-text">ข้อมูลผู้ป่วย</span>
                                    <span className="cert-title-en">PATIENT INFORMATION</span>
                                </div>
                                <div className="cert-patient-info-grid">
                                    <div className="cert-info-row">
                                        <div className="cert-info-label">ชื่อ-นามสกุล / Name</div>
                                        <div className="cert-info-value cert-info-name">{patient.name}</div>
                                    </div>
                                    <div className="cert-info-row">
                                        <div className="cert-info-label">เลขประจำตัวผู้ป่วย (HN) / Patient ID</div>
                                        <div className="cert-info-value">{patient.id}</div>
                                    </div>
                                    <div className="cert-info-row">
                                        <div className="cert-info-label">วันที่เข้ารับการตรวจ / Examination Date</div>
                                        <div className="cert-info-value">{todayTH}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Diagnosis Section */}
                            <div className="cert-section">
                                <div className="cert-section-title">
                                    <span className="cert-title-text">การวินิจฉัย</span>
                                    <span className="cert-title-en">DIAGNOSIS</span>
                                </div>
                                <div className="cert-diagnosis-box">
                                    {certData.diagnosis ? (
                                        <p className="cert-diagnosis-text">{certData.diagnosis}</p>
                                    ) : (
                                        <p className="cert-diagnosis-placeholder">ไม่ระบุการวินิจฉัย</p>
                                    )}
                                </div>
                            </div>

                            {/* Medical Opinion Section */}
                            <div className="cert-section">
                                <div className="cert-section-title">
                                    <span className="cert-title-text">ความเห็นแพทย์</span>
                                    <span className="cert-title-en">MEDICAL OPINION</span>
                                </div>
                                <div className="cert-opinion-content">
                                    <p className="cert-opinion-main">
                                        ข้าพเจ้าได้ตรวจร่างกายและรักษาผู้ป่วยแล้ว พบว่าสมควรให้หยุดพักรักษาตัว <strong className="cert-highlight-days">{certData.days} วัน</strong>
                                    </p>
                                    <div className="cert-date-range-official">
                                        <div className="cert-date-from">
                                            <span className="cert-date-label-official">ตั้งแต่วันที่ / From</span>
                                            <span className="cert-date-value-official">{startDateTH}</span>
                                        </div>
                                        <div className="cert-date-to">
                                            <span className="cert-date-label-official">ถึงวันที่ / To</span>
                                            <span className="cert-date-value-official">{endDateTH}</span>
                                        </div>
                                    </div>
                                    <p className="cert-purpose-text">
                                        จึงขอออกใบรับรองแพทย์ฉบับนี้ไว้เพื่อแสดงต่อหน่วยงาน/สถานศึกษา ตามที่เห็นสมควร
                                    </p>
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className="cert-signature-official">
                                <div className="cert-signature-area">
                                    <div className="cert-signature-block">
                                        <div className="cert-signature-line-official"></div>
                                        <div className="cert-signature-info">
                                            <p className="cert-doctor-signature-label">ลายเซ็นทันตแพทย์</p>
                                            <p className="cert-doctor-signature-en">(Medical Practitioner's Signature)</p>
                                            <p className="cert-doctor-name">_____________________________</p>
                                            <p className="cert-doctor-title-official">ทันตแพทย์ผู้ตรวจ / Dental Practitioner</p>
                                            <p className="cert-doctor-license-official">เลขที่ใบประกอบโรคศิลปะ: _______________</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="cert-official-footer">
                                <p className="cert-footer-note">
                                    เอกสารนี้ออกโดยระบบอิเล็กทรอนิกส์ มีผลทางกฎหมายตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544
                                </p>
                                <p className="cert-footer-clinic">
                                    บ้านหมอฟัน DENTAL HOME CLINIC
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Styles */}
                <style>{`
                    /* Modal Overlay */
                    .cert-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.8) 100%);
                        backdrop-filter: blur(20px);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 2rem;
                    }

                    /* Modal Container */
                    .cert-modal-container {
                        width: 100%;
                        max-width: 1000px;
                        max-height: 90vh;
                        background: white;
                        border-radius: 24px;
                        box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.4);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    /* Header */
                    .cert-modal-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 1.5rem 2rem;
                        border-bottom: 1px solid #e2e8f0;
                        background: linear-gradient(to right, #f8fafc, #ffffff);
                    }

                    .cert-modal-title-group {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    }

                    .cert-modal-icon {
                        width: 52px;
                        height: 52px;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        border-radius: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .cert-modal-title {
                        margin: 0;
                        font-size: 1.4rem;
                        font-weight: 800;
                        color: #0f172a;
                    }

                    .cert-modal-subtitle {
                        margin: 0.25rem 0 0 0;
                        font-size: 0.875rem;
                        color: #64748b;
                        font-weight: 500;
                    }

                    .cert-modal-close {
                        width: 40px;
                        height: 40px;
                        border-radius: 12px;
                        background: #f1f5f9;
                        border: none;
                        color: #64748b;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }

                    .cert-modal-close:hover {
                        background: #e2e8f0;
                        color: #0f172a;
                    }

                    /* Content */
                    .cert-modal-content {
                        display: grid;
                        grid-template-columns: 1fr 380px;
                        gap: 2rem;
                        padding: 2rem;
                        overflow-y: auto;
                        flex: 1;
                    }

                    /* Form Section */
                    .cert-form-section {
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                    }

                    .cert-form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .cert-form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }

                    .cert-label {
                        font-size: 0.875rem;
                        font-weight: 700;
                        color: #334155;
                        text-transform: uppercase;
                        letter-spacing: 0.025em;
                    }

                    .cert-input, .cert-textarea {
                        width: 100%;
                        padding: 0.875rem 1rem;
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        font-size: 1rem;
                        background: #f8fafc;
                        transition: all 0.2s;
                        color: #0f172a;
                    }

                    .cert-input:focus, .cert-textarea:focus {
                        outline: none;
                        border-color: #10b981;
                        background: white;
                        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
                    }

                    .cert-textarea {
                        resize: vertical;
                        min-height: 100px;
                    }

                    .cert-input-wrapper {
                        position: relative;
                    }

                    .cert-input-suffix {
                        position: absolute;
                        right: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #64748b;
                        font-weight: 500;
                    }

                    .cert-summary-box {
                        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                        padding: 1rem 1.25rem;
                        border-radius: 12px;
                        border: 1px solid #6ee7b7;
                    }

                    .cert-summary-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .cert-summary-label {
                        font-size: 0.875rem;
                        color: #059669;
                        font-weight: 600;
                    }

                    .cert-summary-value {
                        font-weight: 700;
                        color: #047857;
                    }

                    /* Preview Section */
                    .cert-preview-section {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .cert-preview-label {
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .cert-preview-page {
                        background: white;
                        aspect-ratio: 210/297;
                        border-radius: 8px;
                        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.15);
                        padding: 1.5rem;
                        display: flex;
                        flex-direction: column;
                        border: 1px solid #e2e8f0;
                    }

                    .cert-preview-header {
                        text-align: center;
                        border-bottom: 2px solid #10b981;
                        padding-bottom: 0.75rem;
                        margin-bottom: 1rem;
                    }

                    .cert-preview-logo {
                        font-size: 0.9rem;
                        font-weight: 800;
                        color: #10b981;
                        letter-spacing: 0.1em;
                    }

                    .cert-preview-doc-title {
                        font-size: 0.8rem;
                        color: #334155;
                        margin-top: 0.25rem;
                    }

                    .cert-preview-body {
                        flex: 1;
                        font-size: 0.7rem;
                    }

                    .cert-preview-patient {
                        font-size: 0.85rem;
                        margin: 0.5rem 0;
                    }

                    .cert-preview-date {
                        color: #64748b;
                        margin: 0.25rem 0;
                    }

                    .cert-preview-diagnosis {
                        background: #f1f5f9;
                        padding: 0.5rem;
                        border-radius: 4px;
                        margin: 0.5rem 0;
                        min-height: 40px;
                    }

                    .cert-preview-rest {
                        text-align: center;
                        margin-top: 1rem;
                        padding: 0.5rem;
                        background: #ecfdf5;
                        border-radius: 4px;
                        color: #059669;
                    }

                    .cert-preview-footer {
                        margin-top: auto;
                        text-align: center;
                        font-size: 0.65rem;
                        color: #94a3b8;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 0.5rem;
                    }

                    /* Actions */
                    .cert-modal-actions {
                        display: flex;
                        gap: 1rem;
                        padding: 1.5rem 2rem;
                        border-top: 1px solid #e2e8f0;
                        background: #f8fafc;
                    }

                    .cert-btn {
                        padding: 0.875rem 1.5rem;
                        border-radius: 12px;
                        font-weight: 700;
                        font-size: 0.95rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.2s;
                        border: none;
                    }

                    .cert-btn-primary {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        flex: 1;
                        justify-content: center;
                    }

                    .cert-btn-primary:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
                    }

                    .cert-btn-secondary {
                        background: white;
                        color: #64748b;
                        border: 2px solid #e2e8f0;
                    }

                    .cert-btn-secondary:hover {
                        background: #f1f5f9;
                        border-color: #cbd5e1;
                    }

                    /* Print Styles */
                    .cert-printable {
                        display: none;
                    }

                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 0;
                        }
                        
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            overflow: hidden !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Hide everything in body except our modal overlay */
                        body > *:not(.cert-modal-overlay) {
                            display: none !important;
                        }
                        
                        .cert-modal-overlay {
                            position: fixed !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            background: white !important;
                            backdrop-filter: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            display: block !important;
                            overflow: hidden !important;
                            z-index: 99999 !important;
                        }
                        
                        .cert-modal-container {
                            width: 210mm !important;
                            height: 297mm !important;
                            max-width: 210mm !important;
                            max-height: 297mm !important;
                            box-shadow: none !important;
                            border-radius: 0 !important;
                            background: white !important;
                            overflow: hidden !important;
                        }
                        
                        .cert-modal-header,
                        .cert-modal-content,
                        .cert-modal-actions {
                            display: none !important;
                        }
                        
                        .cert-printable {
                            display: block !important;
                            width: 210mm !important;
                            height: 297mm !important;
                        }
                    }

                    /* A4 Print Page - Premium Professional Design */
                    .cert-a4-page {
                        width: 210mm;
                        height: 297mm;
                        padding: 18mm 22mm;
                        background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
                        font-family: 'Sarabun', 'TH Sarabun New', 'Inter', sans-serif;
                        color: #1a1a2e;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        overflow: hidden;
                    }

                    /* Elegant Border Frame */
                    .cert-official-frame {
                        position: absolute;
                        top: 10mm;
                        left: 10mm;
                        right: 10mm;
                        bottom: 10mm;
                        border: 3px solid #22c55e;
                        pointer-events: none;
                        border-radius: 4px;
                    }

                    .cert-official-frame::before {
                        content: '';
                        position: absolute;
                        top: 4px;
                        left: 4px;
                        right: 4px;
                        bottom: 4px;
                        border: 1px solid #22c55e;
                        opacity: 0.5;
                    }

                    .cert-frame-corner {
                        position: absolute;
                        width: 24px;
                        height: 24px;
                        border: none;
                    }

                    .cert-frame-corner::before,
                    .cert-frame-corner::after {
                        content: '';
                        position: absolute;
                        background: #22c55e;
                    }

                    .cert-frame-corner.cert-tl {
                        top: -3px;
                        left: -3px;
                    }

                    .cert-frame-corner.cert-tl::before {
                        width: 24px;
                        height: 3px;
                        top: 0;
                        left: 0;
                    }

                    .cert-frame-corner.cert-tl::after {
                        width: 3px;
                        height: 24px;
                        top: 0;
                        left: 0;
                    }

                    .cert-frame-corner.cert-tr {
                        top: -3px;
                        right: -3px;
                    }

                    .cert-frame-corner.cert-tr::before {
                        width: 24px;
                        height: 3px;
                        top: 0;
                        right: 0;
                    }

                    .cert-frame-corner.cert-tr::after {
                        width: 3px;
                        height: 24px;
                        top: 0;
                        right: 0;
                    }

                    .cert-frame-corner.cert-bl {
                        bottom: -3px;
                        left: -3px;
                    }

                    .cert-frame-corner.cert-bl::before {
                        width: 24px;
                        height: 3px;
                        bottom: 0;
                        left: 0;
                    }

                    .cert-frame-corner.cert-bl::after {
                        width: 3px;
                        height: 24px;
                        bottom: 0;
                        left: 0;
                    }

                    .cert-frame-corner.cert-br {
                        bottom: -3px;
                        right: -3px;
                    }

                    .cert-frame-corner.cert-br::before {
                        width: 24px;
                        height: 3px;
                        bottom: 0;
                        right: 0;
                    }

                    .cert-frame-corner.cert-br::after {
                        width: 3px;
                        height: 24px;
                        bottom: 0;
                        right: 0;
                    }

                    /* Watermark */
                    .cert-watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-30deg);
                        opacity: 0.04;
                        pointer-events: none;
                        text-align: center;
                        z-index: 0;
                    }

                    .cert-watermark-logo {
                        font-size: 80px;
                        font-weight: 900;
                        color: #22c55e;
                        letter-spacing: 0.15em;
                        margin-bottom: 10px;
                    }

                    .cert-watermark-text {
                        font-size: 28px;
                        font-weight: 600;
                        color: #22c55e;
                        letter-spacing: 0.2em;
                    }

                    /* Main Content */
                    .cert-main-content {
                        position: relative;
                        z-index: 1;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }

                    /* Premium Header */
                    .cert-official-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                        padding-bottom: 18px;
                        border-bottom: 3px solid #22c55e;
                        position: relative;
                    }

                    .cert-official-header::after {
                        content: '';
                        position: absolute;
                        bottom: -3px;
                        left: 0;
                        width: 100px;
                        height: 3px;
                        background: #7c3aed;
                    }

                    .cert-header-left {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        flex: 1;
                    }

                    .cert-logo-official {
                        width: 100px;
                        height: 100px;
                        flex-shrink: 0;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.25);
                        padding: 6px;
                        border: 3px solid #22c55e;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .cert-logo-official img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        border-radius: 10px;
                    }

                    .cert-clinic-info-official {
                        display: flex;
                        flex-direction: column;
                    }

                    .cert-clinic-name {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 800;
                        color: #1a1a2e;
                        letter-spacing: 0.02em;
                        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }

                    .cert-clinic-name-en {
                        margin: 4px 0 0 0;
                        font-size: 13px;
                        font-weight: 600;
                        color: #64748b;
                        letter-spacing: 0.15em;
                    }

                    .cert-clinic-address {
                        margin-top: 10px;
                    }

                    .cert-clinic-address p {
                        margin: 2px 0;
                        font-size: 11px;
                        color: #64748b;
                    }

                    .cert-doc-info {
                        text-align: right;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                    }

                    .cert-doc-type {
                        margin-bottom: 12px;
                    }

                    .cert-doc-type h2 {
                        margin: 0;
                        font-size: 26px;
                        font-weight: 800;
                        color: #1a1a2e;
                        letter-spacing: 0.05em;
                    }

                    .cert-doc-type-en {
                        margin: 6px 0 0 0;
                        font-size: 12px;
                        font-weight: 600;
                        color: #64748b;
                        letter-spacing: 0.2em;
                    }

                    .cert-doc-meta {
                        border: 2px solid #22c55e;
                        padding: 10px 16px;
                        background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
                        border-radius: 8px;
                    }

                    .cert-meta-row {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        margin: 3px 0;
                    }

                    .cert-meta-label {
                        font-size: 11px;
                        color: #64748b;
                    }

                    .cert-meta-value {
                        font-size: 11px;
                        font-weight: 700;
                        color: #1a1a2e;
                    }

                    .cert-doc-no {
                        font-family: 'Consolas', monospace;
                        letter-spacing: 0.05em;
                        color: #7c3aed;
                    }

                    /* Elegant Divider */
                    .cert-official-divider {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin: 12px 0 20px 0;
                    }

                    .cert-divider-line {
                        flex: 1;
                        height: 2px;
                        background: linear-gradient(90deg, #22c55e 0%, #7c3aed 50%, #22c55e 100%);
                    }

                    .cert-divider-star {
                        font-size: 16px;
                        color: #22c55e;
                    }

                    /* Sections */
                    .cert-section {
                        margin-bottom: 20px;
                    }

                    .cert-section-title {
                        display: flex;
                        align-items: baseline;
                        gap: 10px;
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #e2e8f0;
                        position: relative;
                    }

                    .cert-section-title::after {
                        content: '';
                        position: absolute;
                        bottom: -2px;
                        left: 0;
                        width: 60px;
                        height: 2px;
                        background: #22c55e;
                    }

                    .cert-title-text {
                        font-size: 17px;
                        font-weight: 800;
                        color: #1a1a2e;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .cert-title-text::before {
                        content: '';
                        width: 8px;
                        height: 8px;
                        background: #22c55e;
                        border-radius: 50%;
                    }

                    .cert-title-en {
                        font-size: 11px;
                        font-weight: 600;
                        color: #94a3b8;
                        letter-spacing: 0.1em;
                    }

                    /* Patient Info Grid */
                    .cert-patient-info-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                        padding: 16px;
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        border-radius: 12px;
                        border-left: 4px solid #22c55e;
                    }

                    .cert-info-row {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                    }

                    .cert-info-label {
                        min-width: 200px;
                        font-size: 13px;
                        color: #64748b;
                        font-weight: 600;
                    }

                    .cert-info-value {
                        flex: 1;
                        font-size: 15px;
                        font-weight: 700;
                        color: #1a1a2e;
                        border-bottom: 1px solid #cbd5e1;
                        padding-bottom: 4px;
                    }

                    .cert-info-name {
                        font-size: 19px;
                        font-weight: 800;
                        color: #1a1a2e;
                    }

                    /* Diagnosis Box */
                    .cert-diagnosis-box {
                        border: 2px solid #e2e8f0;
                        min-height: 60px;
                        padding: 16px 20px;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    }

                    .cert-diagnosis-text {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #1a1a2e;
                        line-height: 1.6;
                    }

                    .cert-diagnosis-placeholder {
                        margin: 0;
                        font-size: 14px;
                        color: #94a3b8;
                        font-style: italic;
                    }

                    /* Opinion Content */
                    .cert-opinion-content {
                        padding: 10px 0;
                    }

                    .cert-opinion-main {
                        margin: 0 0 18px 0;
                        font-size: 15px;
                        line-height: 1.7;
                        text-indent: 40px;
                        color: #334155;
                    }

                    .cert-highlight-days {
                        font-weight: 800;
                        color: #22c55e;
                        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                        padding: 2px 10px;
                        border-radius: 6px;
                        border: 1px solid #a7f3d0;
                    }

                    .cert-date-range-official {
                        display: flex;
                        justify-content: center;
                        gap: 60px;
                        margin: 20px 0;
                        padding: 18px 30px;
                        background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
                        border: 2px solid #22c55e;
                        border-radius: 12px;
                        position: relative;
                    }

                    .cert-date-range-official::before {
                        content: '→';
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 24px;
                        color: #22c55e;
                        font-weight: 700;
                    }

                    .cert-date-from, .cert-date-to {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 6px;
                    }

                    .cert-date-label-official {
                        font-size: 11px;
                        color: #64748b;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .cert-date-value-official {
                        font-size: 15px;
                        font-weight: 700;
                        color: #1a1a2e;
                    }

                    .cert-purpose-text {
                        margin: 20px 0 0 0;
                        font-size: 15px;
                        text-indent: 40px;
                        line-height: 1.7;
                        color: #334155;
                        font-style: italic;
                    }

                    /* Signature Section */
                    .cert-signature-official {
                        margin-top: auto;
                        padding-top: 40px;
                        display: flex;
                        justify-content: flex-end;
                    }

                    .cert-signature-area {
                        flex: 1;
                        display: flex;
                        justify-content: center;
                    }

                    .cert-signature-block {
                        max-width: 320px;
                        text-align: center;
                    }

                    .cert-signature-line-official {
                        position: relative;
                        height: 60px;
                        border-bottom: 2px solid #1a1a2e;
                        margin-bottom: 12px;
                    }

                    .cert-signature-info {
                        text-align: center;
                    }

                    .cert-doctor-signature-label {
                        margin: 0;
                        font-size: 15px;
                        font-weight: 800;
                        color: #1a1a2e;
                    }

                    .cert-doctor-signature-en {
                        margin: 4px 0 0 0;
                        font-size: 11px;
                        color: #64748b;
                    }

                    .cert-doctor-name {
                        margin: 16px 0 0 0;
                        font-size: 14px;
                        color: #1a1a2e;
                        letter-spacing: 0.15em;
                        font-weight: 700;
                    }

                    .cert-doctor-title-official {
                        margin: 10px 0 0 0;
                        font-size: 13px;
                        font-weight: 600;
                        color: #475569;
                    }

                    .cert-doctor-license-official {
                        margin: 8px 0 0 0;
                        font-size: 11px;
                        color: #64748b;
                    }

                    /* Premium Footer */
                    .cert-official-footer {
                        margin-top: 30px;
                        padding: 20px;
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        text-align: center;
                    }

                    .cert-footer-note {
                        margin: 0 0 12px 0;
                        font-size: 11px;
                        color: #64748b;
                        font-style: italic;
                    }

                    .cert-footer-clinic {
                        margin: 0;
                        font-size: 13px;
                        font-weight: 800;
                        color: #22c55e;
                        letter-spacing: 0.15em;
                    }

                    /* Responsive */
                    @media (max-width: 900px) {
                        .cert-modal-content {
                            grid-template-columns: 1fr;
                        }
                        .cert-preview-section {
                            display: none;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

const InstallmentModal = ({ installmentForm, setInstallmentForm, handleCreateInstallment, setShowInstallment }) => (
    <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
    }}
    onClick={(e) => e.target === e.currentTarget && setShowInstallment(false)}
    >
        <div className="animate-slide-up" style={{ width: '500px', maxWidth: '95vw', padding: '2.5rem', background: 'white', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--neutral-100)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={20} />
                </div>
                Create Installment Plan
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label className="label-premium">Total Amount</label>
                    <input type="number" className="input-field-premium" value={installmentForm.total} onChange={e => setInstallmentForm({ ...installmentForm, total: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label-premium">Down Payment</label>
                        <input type="number" className="input-field-premium" value={installmentForm.down} onChange={e => setInstallmentForm({ ...installmentForm, down: e.target.value })} />
                    </div>
                    <div>
                        <label className="label-premium">Months</label>
                        <input type="number" className="input-field-premium" value={installmentForm.months} onChange={e => setInstallmentForm({ ...installmentForm, months: e.target.value })} />
                    </div>
                </div>
                
                <div style={{ padding: '1.5rem', background: 'var(--primary-50)', borderRadius: '20px', border: '1.5px dashed var(--primary-200)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary-600)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Monthly</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-700)' }}>฿{Math.ceil((Number(installmentForm.total) - Number(installmentForm.down)) / Number(installmentForm.months)).toLocaleString()}</p>
                </div>

                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={handleCreateInstallment} style={{ height: '56px', borderRadius: '16px', fontSize: '1rem' }}>Create Plan</button>
                    <button className="btn btn-secondary" onClick={() => setShowInstallment(false)} style={{ height: '48px', borderRadius: '14px' }}>Cancel</button>
                </div>
            </div>
        </div>
    </div>
);

export default BillingTab;
