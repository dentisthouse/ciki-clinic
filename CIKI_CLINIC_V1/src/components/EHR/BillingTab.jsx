import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
    CheckCircle, Printer, CreditCard, DollarSign, Smartphone, 
    FileText, Calendar, Plus, X, Wallet, ShieldCheck, 
    Repeat, Hourglass, History, ChevronDown, AlertCircle, Settings2,
    Trash2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReceiptModal from '../Billing/ReceiptModal';
import InstallmentPlan from '../Billing/InstallmentPlan';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import DentalDocumentsModal from './DentalDocumentsModal';

const BillingTab = ({ patient }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { updatePatient, deductStockForTreatment, addInvoice } = useData();
    const { user } = useAuth(); 
    const lang = language;

    // --- State Variables ---
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showReceipt, setShowReceipt] = useState(false);
    const [showCert, setShowCert] = useState(false);
    const [showInstallment, setShowInstallment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    const [showAdjustments, setShowAdjustments] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const { inventory, settings, staff } = useData();
    
    // PromptPay Data
    const [promptPayId, setPromptPayId] = useState(() => localStorage.getItem('ciki_promptpay_id') || '');
    useEffect(() => {
        localStorage.setItem('ciki_promptpay_id', promptPayId);
    }, [promptPayId]);

    // Receipt & Cert Data
    const [lastPaymentData, setLastPaymentData] = useState(null);
    const [certNo, setCertNo] = useState(() => {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `CIT-${dateStr}-${random}`;
    });
    const [certData, setCertData] = useState({ 
        diagnosis: '', 
        days: '1', 
        from: new Date().toISOString().split('T')[0],
        doctorName: user?.full_name || 'ทพ. สมชาย รักฟันดี',
        licenseNo: 'ท. 9988'
    });

    const [referralNo, setReferralNo] = useState('');
    const [referralData, setReferralData] = useState({
        referTo: '',
        referDate: new Date().toISOString().split('T')[0],
        purpose: '',
        clinicalSummary: '',
        doctorName: user?.full_name || 'ทพ. สมชาย รักฟันดี',
        licenseNo: 'ท. 9988'
    });

    const openDentalDocuments = () => {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        setReferralNo(`REF-${dateStr}-${random}`);
        setReferralData((prev) => ({
            ...prev,
            doctorName: certData.doctorName,
            licenseNo: certData.licenseNo,
            referDate: new Date().toISOString().split('T')[0]
        }));
        setShowCert(true);
    };

    // Installment Data
    const [installmentForm, setInstallmentForm] = useState({ total: 0, down: 0, months: 6 });

    // Insurance Claim Data
    const [claimAmount, setClaimAmount] = useState(0);
    const [copayMethod, setCopayMethod] = useState('cash');

    // Split Payment Data
    const [splitAmounts, setSplitAmounts] = useState({
        cash: 0, transfer: 0, card: 0, claim: 0, debt: 0
    });

    // Extra Fees & Discounts
    const [serviceFee, setServiceFee] = useState(0);
    const [cardFeePercent, setCardFeePercent] = useState(0); 
    const [discount, setDiscount] = useState(0);

    // --- Redirection Effect ---
    useEffect(() => {
        if (paymentSuccess && location.state?.from === '/billing') {
            const timer = setTimeout(() => {
                navigate('/billing');
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [paymentSuccess, location.state, navigate]);

    // --- Derived Data ---
    const unpaidTreatments = (patient.treatments || []).filter(t => t.paymentStatus !== 'paid');
    const paidTreatments = (patient.treatments || []).filter(t => t.paymentStatus === 'paid');
    const baseTotal = unpaidTreatments.reduce((sum, item) => sum + (item.price || 0), 0);
    
    const cardFeeAmount = cardFeePercent > 0 ? (baseTotal * (cardFeePercent / 100)) : 0;
    const totalTreatmentsPrice = baseTotal + Number(serviceFee) + cardFeeAmount;
    const finalTotal = Math.max(0, totalTreatmentsPrice - Number(discount));
    
    const splitTotal = Object.values(splitAmounts).reduce((sum, val) => sum + Number(val), 0);
    const splitRemaining = finalTotal - splitTotal;

    const hasInstallmentPlan = patient.installmentPlan;

    // Insurance Limit Logic
    const currentYear = new Date().getFullYear();
    const usedInsuranceAmount = (patient.treatments || [])
        .filter(t => t.paymentStatus === 'paid' && t.insuranceClaimAmount > 0 && new Date(t.paidDate).getFullYear() === currentYear)
        .reduce((sum, t) => sum + (t.insuranceClaimAmount || 0), 0);

    const ssoLimit = 900;
    const insuranceLimit = patient.insuranceType === 'SSO' ? ssoLimit : (Number(patient.insuranceLimit) || 0);
    const remainingLimit = Math.max(0, insuranceLimit - usedInsuranceAmount);

    // Auto-Detection SSO
    useEffect(() => {
        if (patient.insuranceType === 'SSO' && remainingLimit > 0 && unpaidTreatments.length > 0 && paymentMethod !== 'claim') {
            setPaymentMethod('claim');
            setClaimAmount(Math.min(finalTotal, remainingLimit));
        }
    }, [patient.insuranceType, remainingLimit, finalTotal, unpaidTreatments.length]);

    // --- Action Handlers ---
    const handleAddProduct = (item) => {
        const newTreatment = {
            id: `PROD-${Date.now()}`,
            procedure: item.name,
            price: item.price || 0,
            date: new Date().toISOString(),
            paymentStatus: 'unpaid',
            recorder: user?.full_name || 'Staff',
            type: 'product'
        };

        const updatedTreatments = [...(patient.treatments || []), newTreatment];
        updatePatient(patient.id, { treatments: updatedTreatments });
        setShowProductModal(false);
    };

    const handleRemoveItem = (itemId) => {
        if (!confirm(language === 'TH' ? 'ยืนยันการลบรายการนี้?' : 'Are you sure you want to remove this item?')) return;
        const updatedTreatments = (patient.treatments || []).filter(t => t.id !== itemId);
        updatePatient(patient.id, { treatments: updatedTreatments });
    };

    const handleCheckout = () => {
        if (unpaidTreatments.length === 0) return;

        if (paymentMethod === 'split' && Math.abs(splitRemaining) > 1) {
            alert(language === 'TH' ? `ยอดรวมไม่ถูกต้อง ขาด/เกิน: ฿${splitRemaining.toLocaleString()}` : `Incorrect Split Total. Diff: ฿${splitRemaining.toLocaleString()}`);
            return;
        }

        if (!confirm('Confirm Payment?')) return;

        const paidDate = new Date().toISOString();
        let methodStr = paymentMethod;
        let finalClaim = 0;

        if (paymentMethod === 'claim') {
            finalClaim = claimAmount > 0 ? claimAmount : Math.min(finalTotal, remainingLimit);
            methodStr = `Claim (฿${finalClaim.toLocaleString()})` + (finalTotal - finalClaim > 0 ? ` + ${copayMethod}` : '');
        } else if (paymentMethod === 'split') {
            methodStr = 'Split Payment';
        }

        const updatedTreatments = patient.treatments.map(t =>
            t.paymentStatus !== 'paid' ? {
                ...t,
                paymentStatus: 'paid',
                paidDate,
                paymentMethod: methodStr,
                insuranceClaimAmount: paymentMethod === 'claim' ? (t.price / baseTotal) * finalClaim : (paymentMethod === 'split' ? (t.price / baseTotal) * Number(splitAmounts.claim) : 0)
            } : t
        );
        updatePatient(patient.id, { treatments: updatedTreatments });

        unpaidTreatments.forEach(t => deductStockForTreatment(t.procedure));

        const invoiceData = {
            patientName: patient.name,
            patientId: patient.id,
            amount: finalTotal,
            total: finalTotal,
            baseTotal: baseTotal,
            serviceFee: Number(serviceFee),
            cardFeeAmount: cardFeeAmount,
            discount: Number(discount),
            status: 'Paid',
            paymentMethod: methodStr,
            splitAmounts: paymentMethod === 'split' ? splitAmounts : null,
            date: new Date().toISOString().split('T')[0], 
            timestamp: paidDate,
            recorder: user?.full_name || 'Staff',
            items: unpaidTreatments.map(t => ({ procedure: t.procedure, price: t.price }))
        };
        addInvoice(invoiceData);

        setLastPaymentData({
            ...invoiceData,
            total: finalTotal,
            copayAmount: paymentMethod === 'claim' ? Math.max(0, finalTotal - finalClaim) : (paymentMethod === 'split' ? finalTotal - Number(splitAmounts.claim) : undefined)
        });
        setPaymentSuccess(true);
        setShowReceipt(true);
    };

    const handleInstallmentPayment = (amount, description) => {
        const paidDate = new Date().toISOString();
        const invoiceData = {
            patientName: patient.name,
            patientId: patient.id,
            amount: amount,
            total: amount,
            status: 'Paid',
            paymentMethod: 'Cash (Installment)',
            date: new Date().toISOString().split('T')[0],
            timestamp: paidDate,
            items: [{ procedure: description, price: amount }],
            recorder: user?.full_name || 'Staff'
        };

        addInvoice(invoiceData);
        setLastPaymentData({
            ...invoiceData,
            total: amount
        });
        setPaymentSuccess(true);
        setShowReceipt(true);
    };

    const handlePrintBill = () => {
        if (unpaidTreatments.length === 0) return;

        let finalClaim = 0;
        if (paymentMethod === 'claim') {
            finalClaim = claimAmount > 0 ? claimAmount : Math.min(finalTotal, remainingLimit);
        } else if (paymentMethod === 'split') {
            finalClaim = Number(splitAmounts.claim);
        }

        setLastPaymentData({
            items: unpaidTreatments,
            total: finalTotal,
            baseTotal,
            discount: Number(discount),
            serviceFee: Number(serviceFee),
            cardFeeAmount: cardFeeAmount,
            date: new Date().toISOString(),
            method: 'Pending',
            patientName: patient.name,
            patientId: patient.id,
            claimAmount: finalClaim,
            copayAmount: finalTotal - finalClaim,
            splitAmounts: paymentMethod === 'split' ? splitAmounts : null
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

    const paymentMethods = [
        { id: 'cash', label: language === 'TH' ? 'เงินสด' : 'Cash', icon: DollarSign, color: 'var(--primary-600)' },
        { id: 'transfer', label: language === 'TH' ? 'เงินโอน / พร้อมเพย์' : 'Transfer', icon: Smartphone, color: '#3b82f6' },
        { id: 'card', label: language === 'TH' ? 'บัตรเครดิต' : 'Credit Card', icon: CreditCard, color: '#8b5cf6' },
        { id: 'claim', label: language === 'TH' ? 'เบิก/ประกัน' : 'Claim', icon: ShieldCheck, color: '#10b981' },
        { id: 'split', label: (language === 'TH' ? 'ชำระหลายช่องทาง' : 'Split Payment'), icon: Wallet, color: '#f59e0b' }
    ];

    // --- Lifecycle Cleaners ---
    useEffect(() => {
        setDiscount(0);
        setServiceFee(0);
        setCardFeePercent(0);
        setPaymentSuccess(false);
        setSplitAmounts({ cash: 0, transfer: 0, card: 0, claim: 0, debt: 0 });
        setShowAdjustments(false);
    }, [patient.id]);

    return (
        <div className="animate-fade-in" style={{ padding: '2.5rem', background: '#fcfcfd', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                        width: '64px', height: '64px', 
                        background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-400) 100%)', 
                        color: 'white', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 12px 24px -6px rgba(13, 148, 136, 0.4)'
                    }}>
                        <CreditCard size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                            {language === 'TH' ? 'ระบบชำระเงิน' : t('bill_title')}
                        </h1>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>{patient?.full_name} • CN: {patient?.hn}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '2rem' }}>
                {/* --- LEFT COLUMN --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Pending Items */}
                    <div className="card shadow-sm" style={{ padding: '2.5rem', borderRadius: '32px', background: 'white', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                            <div style={{ width: '42px', height: '42px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                                {language === 'TH' ? 'รายการค้างชำระ' : t('bill_pending_items')}
                            </h3>
                            <button 
                                onClick={() => setShowProductModal(true)}
                                style={{
                                    marginLeft: 'auto',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 16px', background: 'var(--primary-600)',
                                    color: 'white', border: 'none', borderRadius: '12px',
                                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
                                }}
                            >
                                <Plus size={16} /> {language === 'TH' ? 'เพิ่มสินค้า' : 'Add Product'}
                            </button>
                        </div>

                        {unpaidTreatments.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 600 }}>{language === 'TH' ? 'ไม่มีรายการค้างชำระ' : 'No pending items'}</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {unpaidTreatments.map((item, i) => (
                                    <div key={i} style={{ 
                                        padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        border: '1px solid transparent', transition: 'all 0.2s ease',
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{item.procedure}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={12} /> {new Date(item.date || Date.now()).toLocaleDateString()}
                                                <span style={{ color: '#cbd5e1' }}>•</span>
                                                <span style={{ color: 'var(--primary-600)' }}>{item.recorder || 'Staff'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#0f172a' }}>฿{item.price?.toLocaleString()}</div>
                                            <button 
                                                onClick={() => handleRemoveItem(item.id)}
                                                style={{
                                                    border: 'none', color: '#ef4444',
                                                    padding: '8px', borderRadius: '10px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s', background: '#fef2f2'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Installment Plan Section */}
                    <div className="card shadow-sm" style={{ padding: '2.5rem', borderRadius: '32px', background: 'white', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', background: '#eff6ff', color: '#2563eb', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Repeat size={22} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                                    {language === 'TH' ? 'แผนการผ่อนชำระ' : t('bill_installment_plan')}
                                </h3>
                            </div>
                            {!hasInstallmentPlan && (
                                <button className="btn btn-secondary" onClick={() => setShowInstallment(true)} style={{ borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800 }}>
                                    <Plus size={16} /> {language === 'TH' ? 'สร้างแผนใหม่' : t('bill_new_plan')}
                                </button>
                            )}
                        </div>
                        
                        {hasInstallmentPlan ? (
                            <InstallmentPlan 
                                patient={patient} 
                                language={lang} 
                                onUpdate={(updatedData) => updatePatient(patient.id, updatedData)}
                                onRequestReceipt={handleInstallmentPayment}
                            />
                        ) : (
                            <div style={{ padding: '2.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                    {language === 'TH' ? 'ยังไม่มีแผนการผ่อนชำระ' : 'No active installment plan.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Collapsible History Section */}
                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                        <div 
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                        >
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#475569', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                    <History size={18} />
                                </div>
                                {lang === 'TH' ? 'ประวัติการชำระเงินเดิม' : 'Paid Treatment History'}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontSize: '0.9rem', fontWeight: 800 }}>
                                {showPaymentHistory ? (lang === 'TH' ? 'ซ่อน' : 'Hide') : (lang === 'TH' ? 'แสดง' : 'Show')}
                                <ChevronDown size={18} style={{ transform: showPaymentHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                            </div>
                        </div>

                        {showPaymentHistory && (
                            <div className="animate-fade-in" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATE</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PROCEDURE</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRICE</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STAFF</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paidTreatments.length === 0 ? (
                                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>{lang === 'TH' ? 'ยังไม่มีประวัติการชำระเงิน' : 'No payment history yet'}</td></tr>
                                        ) : (
                                            paidTreatments.map((t, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: '#64748b' }}>{new Date(t.paidDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{t.procedure}</td>
                                                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>฿{t.price?.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 800, background: 'var(--primary-50)', padding: '2px 8px', borderRadius: '6px' }}>
                                                            {t.recorder || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Summary Card */}
                    <div className="card shadow-lg" style={{ padding: '2.5rem', borderRadius: '32px', background: 'white', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', background: '#fef3c7', color: '#d97706', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Wallet size={22} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                                    {language === 'TH' ? 'สรุปยอดชำระ' : t('bill_summary')}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setShowAdjustments(!showAdjustments)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    padding: '8px 16px', background: showAdjustments ? 'var(--primary-50)' : '#f8fafc',
                                    color: showAdjustments ? 'var(--primary-600)' : '#64748b', 
                                    border: `1.5px solid ${showAdjustments ? 'var(--primary-200)' : '#e2e8f0'}`,
                                    borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Settings2 size={16} /> {language === 'TH' ? 'ตั้งค่าเพิ่มเติม' : 'Adjustments'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            
                            {showAdjustments && (
                                <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
                                                {language === 'TH' ? 'ค่าธรรมเนียมบัตร (%)' : 'Card Fee (%)'}
                                            </label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={cardFeePercent}
                                                onChange={(e) => setCardFeePercent(Number(e.target.value))}
                                                placeholder="0"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
                                                {language === 'TH' ? 'ค่าบริการอื่นๆ' : 'Other Fees'}
                                            </label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={serviceFee}
                                                onChange={(e) => setServiceFee(Number(e.target.value))}
                                                placeholder="0"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                            {language === 'TH' ? 'ส่วนลด' : 'Discount'}
                                        </label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={discount}
                                                onChange={(e) => setDiscount(Number(e.target.value))}
                                                placeholder="0"
                                                style={{ flex: 1 }}
                                            />
                                            <div style={{ 
                                                padding: '0 1rem', background: 'white', borderRadius: '12px', 
                                                display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0',
                                                fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-600)'
                                            }}>THB</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ 
                                marginTop: '1rem', padding: '2rem', 
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                                borderRadius: '24px', color: 'white',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                             }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {language === 'TH' ? 'ยอดที่ต้องชำระ' : 'Net Total'}
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 950, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>฿</span>
                                    {finalTotal.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Section */}
                        <div style={{ marginTop: '2.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                                {language === 'TH' ? 'ช่องทางชำระเงิน' : 'Payment Method'}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                {paymentMethods.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentMethod(m.id)}
                                        style={{
                                            padding: '1.25rem 1rem',
                                            background: paymentMethod === m.id ? m.color : 'white',
                                            color: paymentMethod === m.id ? 'white' : '#64748b',
                                            border: `1.5px solid ${paymentMethod === m.id ? m.color : '#e2e8f0'}`,
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative',
                                            boxShadow: paymentMethod === m.id ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none',
                                            transform: paymentMethod === m.id ? 'translateY(-2px)' : 'none'
                                        }}
                                    >
                                        <div style={{ padding: '0.5rem', background: paymentMethod === m.id ? 'rgba(255,255,255,0.2)' : '#f8fafc', borderRadius: '12px' }}>
                                            <m.icon size={22} />
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{m.label}</span>
                                        {paymentMethod === m.id && (
                                            <div style={{ position: 'absolute', top: '8px', right: '8px' }}><CheckCircle size={14} /></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* QR / Claim Detail */}
                        {paymentMethod === 'transfer' && (
                            <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1.5px solid #e2e8f0', borderRadius: '20px', background: '#f8fafc' }} className="animate-scale-in">
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 800 }}>PromptPay ID</label>
                                <input type="text" className="form-input" value={promptPayId} onChange={(e) => setPromptPayId(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} />
                                {promptPayId && finalTotal > 0 && (
                                    <img src={`https://promptpay.io/${promptPayId}/${finalTotal}.png`} alt="QR" style={{ width: '100%', maxWidth: '180px', margin: '0 auto', display: 'block' }} />
                                )}
                            </div>
                        )}

                        {paymentMethod === 'claim' && (
                            <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1.5px solid #dcfce7', borderRadius: '20px', background: '#f0fdf4' }} className="animate-scale-in">
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                                        <span>Insurance Limit</span>
                                        <span>฿{remainingLimit.toLocaleString()} Left</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#dcfce7', borderRadius: '3px', marginTop: '4px' }}>
                                        <div style={{ height: '100%', background: '#166534', width: `${(remainingLimit/insuranceLimit)*100}%` }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="number" className="form-input" value={claimAmount} onChange={(e) => setClaimAmount(Number(e.target.value))} style={{ flex: 1 }} />
                                    <button className="btn btn-secondary" onClick={() => setClaimAmount(Math.min(finalTotal, remainingLimit))} style={{ background: '#166534', color: 'white', border: 'none' }}>MAX</button>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'split' && (
                            <div style={{ marginTop: '1.5rem', padding: '2rem', border: '2px solid #f59e0b', borderRadius: '24px', background: '#fffef3' }} className="animate-scale-in">
                                <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 900, color: '#92400e', textTransform: 'uppercase' }}>Split Breakdown</h4>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {Object.keys(splitAmounts).map(key => (
                                        <div key={key} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', gap: '1rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309', textTransform: 'capitalize' }}>
                                                {key === 'transfer' ? 'โอน / Transfer' : 
                                                 key === 'cash' ? 'เงินสด / Cash' : 
                                                 key === 'card' ? 'บัตร / Card' : 
                                                 key === 'claim' ? 'ประกัน / Claim' : 
                                                 key === 'debt' ? 'ค้างชำระ / Debt' : key}
                                            </label>
                                            <input 
                                                type="number" 
                                                className="form-input" 
                                                value={splitAmounts[key]} 
                                                onChange={(e) => setSplitAmounts({...splitAmounts, [key]: e.target.value})} 
                                                style={{ width: '100%', borderColor: '#fcd34d' }} 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: splitRemaining === 0 ? '#166534' : '#991b1b', fontWeight: 800 }}>
                                        {splitRemaining === 0 ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                        <span style={{ fontSize: '0.9rem' }}>Remaining / คงเหลือ</span>
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 950, color: splitRemaining === 0 ? '#166534' : '#991b1b' }}>
                                        ฿{splitRemaining.toLocaleString()}
                                    </div>
                                </div>
                                {splitRemaining !== 0 && (
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={() => setSplitAmounts({...splitAmounts, cash: Number(splitAmounts.cash) + splitRemaining})}
                                        style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', background: '#fff' }}
                                    >
                                        Auto-Fill to Cash
                                    </button>
                                )}
                            </div>
                        )}

                        <button 
                            className="btn btn-primary" onClick={handleCheckout} 
                            style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}
                        >
                            {language === 'TH' ? 'ยืนยันการชำระเงิน' : t('bill_confirm_payment')}
                        </button>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={handlePrintBill} style={{ flex: 1, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '14px' }}>
                                <Printer size={18} /> {language === 'TH' ? 'พิมพ์ใบเสร็จ' : 'Print'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={openDentalDocuments} style={{ flex: 1, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '14px' }}>
                                <FileText size={18} /> {lang === 'TH' ? 'ใบรับรอง / ใบส่งตัว' : 'Dental forms'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Feedback */}
            {paymentSuccess && (
                <div style={{ 
                    position: 'fixed', bottom: '2.5rem', right: '2.5rem', zIndex: 10001,
                    background: 'white', padding: '1.5rem 2.5rem', borderRadius: '32px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '2px solid #10b981', display: 'flex', alignItems: 'center', gap: '1.25rem',
                    animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ width: '48px', height: '48px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#064e3b' }}>{lang === 'TH' ? 'บันทึกสำเร็จ!' : 'Payment Recorded!'}</div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                            {location.state?.from === '/billing' ? (lang === 'TH' ? 'กำลังกลับไปหน้าจัดการเงิน...' : 'Returning to Billing...') : (lang === 'TH' ? 'บันทึกในประวัติคนไข้แล้ว' : 'Saved to history')}
                        </p>
                    </div>
                </div>
            )}

            {showReceipt && lastPaymentData && (
                <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} data={lastPaymentData} />
            )}

            {showCert && ReactDOM.createPortal(
                <DentalDocumentsModal
                    certData={certData}
                    setCertData={setCertData}
                    referralData={referralData}
                    setReferralData={setReferralData}
                    patient={patient}
                    language={language}
                    onClose={() => setShowCert(false)}
                    certNo={certNo}
                    referralNo={referralNo}
                    settings={settings}
                    staff={staff || []}
                />,
                document.body
            )}

            {showInstallment && ReactDOM.createPortal(
                <InstallmentModal installmentForm={installmentForm} setInstallmentForm={setInstallmentForm} handleCreateInstallment={handleCreateInstallment} setShowInstallment={setShowInstallment} />,
                document.body
            )}

            {showProductModal && ReactDOM.createPortal(
                <ProductSelectionModal 
                    inventory={inventory} 
                    onSelect={handleAddProduct} 
                    onClose={() => setShowProductModal(false)}
                    language={lang}
                />,
                document.body
            )}
        </div>
    );
};

// --- Sub-Modals ---

const ProductSelectionModal = ({ inventory, onSelect, onClose, language }) => {
    const [search, setSearch] = useState('');
    const filtered = inventory.filter(i => 
        (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.item_code || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(10px)', zIndex: 99999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="card shadow-2xl animate-scale-in" style={{ 
                width: '100%', maxWidth: '600px', maxHeight: '80vh',
                display: 'flex', flexDirection: 'column', 
                borderRadius: '32px', background: 'white', overflow: 'hidden'
            }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950 }}>
                            {language === 'TH' ? 'เลือกสินค้าจากคลัง' : 'Select Product'}
                        </h2>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                            {language === 'TH' ? 'เลือกรายการเพื่อเพิ่มในบิล' : 'Available items in stock'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <input 
                        type="text" 
                        placeholder={language === 'TH' ? 'ค้นหาชื่อสินค้า / รหัส...' : 'Search product...'}
                        className="form-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '12px 20px', borderRadius: '16px' }}
                        autoFocus
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                {language === 'TH' ? 'ไม่พบสินค้าที่ค้นหา' : 'No products found'}
                            </div>
                        ) : (
                            filtered.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    disabled={item.stock <= 0}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0',
                                        borderRadius: '20px', cursor: 'pointer', textAlign: 'left',
                                        transition: 'all 0.2s ease', opacity: item.stock <= 0 ? 0.6 : 1
                                    }}
                                    onMouseEnter={e => { if (item.stock > 0) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                                    onMouseLeave={e => { if (item.stock > 0) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; } }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', gap: '8px' }}>
                                            <span>{item.category}</span>
                                            <span>•</span>
                                            <span style={{ color: item.stock < 5 ? '#ef4444' : '#10b981' }}>
                                                {language === 'TH' ? `คงเหลือ: ${item.stock} ${item.unit}` : `In Stock: ${item.stock} ${item.unit}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--primary-700)' }}>฿{item.price?.toLocaleString()}</div>
                                        {item.stock <= 0 && <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800 }}>OUT OF STOCK</div>}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InstallmentModal = ({ installmentForm, setInstallmentForm, handleCreateInstallment, setShowInstallment }) => {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card shadow-2xl animate-scale-in" style={{ width: '90%', maxWidth: '450px', padding: '2.5rem', borderRadius: '32px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950 }}>New Installment Plan</h2>
                    <button onClick={() => setShowInstallment(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>Total Package Amount</label>
                        <input type="number" className="form-input" value={installmentForm.total} onChange={(e) => setInstallmentForm({...installmentForm, total: e.target.value})} style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>Down Payment</label>
                        <input type="number" className="form-input" value={installmentForm.down} onChange={(e) => setInstallmentForm({...installmentForm, down: e.target.value})} style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>Months</label>
                        <select className="form-input" value={installmentForm.months} onChange={(e) => setInstallmentForm({...installmentForm, months: e.target.value})} style={{ width: '100%' }}>
                            {[3, 6, 12, 18, 24, 36].map(m => <option key={m} value={m}>{m} Months</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleCreateInstallment} style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', fontWeight: 900, marginTop: '1rem' }}>ACTIVATE PLAN</button>
                </div>
            </div>
        </div>
    );
};

export default BillingTab;
