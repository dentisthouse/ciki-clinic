import React, { useState, useEffect } from 'react';
import { CheckCircle, Printer, CreditCard, DollarSign, Smartphone, FileText, Calendar, Plus } from 'lucide-react';
import ReceiptModal from '../Billing/ReceiptModal';
import { useData } from '../../context/DataContext';

const BillingTab = ({ patient, language }) => {
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

        // Use timeout to allow state update before print, but practically reuse modal logic or separate Bill component
        // For simplicity, we reuse ReceiptModal but user knows it's a Bill because we triggered it manually 
        // OR we can add a title prop to ReceiptModal. Let's assume ReceiptModal is generic for now.
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

    // --- Modals ---


    const CertModal = () => (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '500px' }}>
                <div className="printable-content">
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>ใบรับรองแพทย์</h2>
                    <p>หนังสือฉบับนี้ขอรับรองว่า <strong>{patient.name}</strong> ได้มารับการตรวจรักษาจริงเมื่อวันที่ <strong>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
                    <div style={{ margin: '2rem 0' }}>
                        <p><strong>การวินิจฉัยโรค:</strong> {certData.diagnosis}</p>
                        <p><strong>ความเห็นแพทย์:</strong> สมควรหยุดพักรักษาตัวเป็นเวลา {certData.days} วัน ตั้งแต่วันที่ {new Date(certData.from).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div style={{ marginTop: '4rem', textAlign: 'right' }}>
                        <div style={{ borderTop: '1px solid black', display: 'inline-block', width: '200px', textAlign: 'center', paddingTop: '0.5rem' }}>ทันตแพทย์ผู้ตรวจ</div>
                    </div>
                </div>
                {!window.matchMedia('print').matches && (
                    <div className="no-print" style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <label>การวินิจฉัยโรค (Diagnosis)</label>
                        <input className="input-field" value={certData.diagnosis} onChange={e => setCertData({ ...certData, diagnosis: e.target.value })} placeholder="เช่น ฟันคุดอักเสบ" />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label>จำนวนวันหยุด (Days)</label>
                                <input className="input-field" type="number" value={certData.days} onChange={e => setCertData({ ...certData, days: e.target.value })} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>เริ่มตั้งแต่วันที่ (Start Date)</label>
                                <input className="input-field" type="date" value={certData.from} onChange={e => setCertData({ ...certData, from: e.target.value })} />
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={() => window.print()} style={{ marginTop: '1rem', width: '100%' }}>พิมพ์ใบรับรองแพทย์</button>
                        <button className="btn btn-secondary" onClick={() => setShowCert(false)} style={{ marginTop: '0.5rem', width: '100%' }}>ปิด</button>
                    </div>
                )}
            </div>
            <style>{`@media print { body * { visibility: hidden; } .printable-content, .printable-content * { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none; } }`}</style>
        </div>
    );

    const InstallmentModal = () => (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create Installment Plan</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div><label>Total Amount</label><input type="number" className="input-field" value={installmentForm.total} onChange={e => setInstallmentForm({ ...installmentForm, total: e.target.value })} /></div>
                    <div><label>Down Payment</label><input type="number" className="input-field" value={installmentForm.down} onChange={e => setInstallmentForm({ ...installmentForm, down: e.target.value })} /></div>
                    <div><label>Months</label><input type="number" className="input-field" value={installmentForm.months} onChange={e => setInstallmentForm({ ...installmentForm, months: e.target.value })} /></div>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                        Monthly: <strong>฿{Math.ceil((Number(installmentForm.total) - Number(installmentForm.down)) / Number(installmentForm.months)).toLocaleString()}</strong>
                    </div>
                    <button className="btn btn-primary" onClick={handleCreateInstallment}>Create Plan</button>
                    <button className="btn btn-secondary" onClick={() => setShowInstallment(false)}>Cancel</button>
                </div>
            </div>
        </div>
    );

    // --- Main Render ---
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Pending Items */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Pending Items</h3>
                    {unpaidTreatments.length === 0 ? (
                        <div style={{ color: 'var(--neutral-400)', textAlign: 'center' }}>No pending items</div>
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
                        <h3>Installment Plan</h3>
                        {!hasInstallmentPlan && (
                            <button className="btn btn-secondary" onClick={() => setShowInstallment(true)}><Plus size={16} /> New Plan</button>
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
                            <button className="btn btn-primary" onClick={handlePayInstallment} style={{ marginTop: '1rem', width: '100%' }}>Pay Installment</button>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--neutral-400)' }}>No active installment plan.</p>
                    )}
                </div>
            </div>

            {/* Payment Summary Panel */}
            <div className="card" style={{ padding: '2rem', height: 'fit-content', background: '#f8fafc' }}>
                <h3>Summary</h3>
                <div style={{ margin: '1rem 0', fontSize: '1.5rem', fontWeight: 800 }}>฿{totalAmount.toLocaleString()}</div>

                <label>Payment Method</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {['cash', 'transfer', 'card', 'claim'].map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: paymentMethod === m ? '2px solid blue' : '1px solid #ccc', background: 'white', textTransform: 'capitalize' }}>
                            {m === 'claim' ? (language === 'TH' ? 'เคลมประกัน' : 'Insurance') : m}
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
                                    <option value="cash">Cash</option>
                                    <option value="transfer">PromptPay / Transfer</option>
                                    <option value="card">Credit Card</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                <button className="btn btn-primary" onClick={handleCheckout} style={{ width: '100%', marginBottom: '1rem', padding: '1rem', fontSize: '1.1rem' }}>Confirm Payment</button>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" onClick={handlePrintBill} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Printer size={16} /> Print Bill
                    </button>
                </div>

                <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setShowCert(true)} style={{ width: '100%' }}>
                        <FileText size={16} style={{ marginRight: '8px' }} /> Medical Certificate
                    </button>
                    {patient.treatments?.some(t => t.paymentStatus === 'paid') && (
                        <button className="btn btn-secondary" onClick={() => {
                            const last = patient.treatments.filter(t => t.paymentStatus === 'paid').pop();
                            if (last) {
                                setLastPaymentData({ items: [last], total: last.price, date: last.paidDate, patientName: patient.name });
                                setShowReceipt(true);
                            }
                        }} style={{ width: '100%', marginTop: '0.5rem' }}>Reprint Last Receipt</button>
                    )}
                </div>
            </div>

            {showReceipt && <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} data={lastPaymentData} />}
            {showCert && <CertModal />}
            {showInstallment && <InstallmentModal />}
        </div>
    );
};

export default BillingTab;
