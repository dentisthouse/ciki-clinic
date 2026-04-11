import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, FileText, CheckCircle, TrendingUp, Calculator, 
    Wallet, Receipt, Clock, User, Info, Printer, Edit3, 
    Eye, MoreVertical, CreditCard, Banknote, Search,
    ChevronRight, ArrowRight, AlertCircle, History,
    ExternalLink, Smartphone, ShieldCheck
} from 'lucide-react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import InvoiceModal from '../components/Billing/InvoiceModal';
import ReceiptModal from '../components/Billing/ReceiptModal';
import '../styles/billing.css';

const Billing = () => {
    const { t, language } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { invoices, addInvoice, updateInvoice, patients, appointments, staff } = useData();
    
    // UI State
    const [activeTab, setActiveTab] = useState('waiting'); // waiting | paid | pending | summary
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [prePopulatedId, setPrePopulatedId] = useState('');
    const [prePopulatedItems, setPrePopulatedItems] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];
    const isThai = language === 'TH';
    const langT = (th, en) => isThai ? th : en;
    const todayISO = new Date().toISOString().split('T')[0];
    const todayLocale = new Date().toLocaleDateString();
    const matchesToday = (d) => d === todayISO || d === todayLocale;

    useEffect(() => {
        const patientId = searchParams.get('patientId');
        if (patientId) {
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                setPrePopulatedId(patientId);
                const unpaid = (patient.treatments || []).filter(trt => trt.paymentStatus === 'unpaid');
                setPrePopulatedItems(unpaid);
                setIsModalOpen(true);
            }
        }
    }, [location, searchParams, patients]);

    // ── Data Filtering & Enhancement ───────────────────────────

    // 1. Waiting for Payment: Patients with unpaid treatments
    const waitingList = useMemo(() => {
        return patients
            .filter(p => (p.treatments || []).some(t => t.paymentStatus === 'unpaid'))
            .map(patient => {
                // Find all unpaid treatments
                const unpaid = (patient.treatments || []).filter(t => t.paymentStatus === 'unpaid');
                const totalBalance = unpaid.reduce((sum, t) => sum + (t.price || 0), 0);
                
                // Get the recorder from the most recent treatment, prioritizing those with a name
                const sorted = [...unpaid].sort((a,b) => {
                    if (a.recorder && !b.recorder) return -1;
                    if (!a.recorder && b.recorder) return 1;
                    return new Date(b.date) - new Date(a.date);
                });
                const latestTRT = sorted[0];

                const todayISO = new Date().toISOString().split('T')[0];
                const todayTRT = unpaid.find(t => t.date?.startsWith(todayISO) && t.recorder);

                // Find today's appointment if any to get doctor and time
                const todayApt = appointments.find(a => 
                    a.patientId === patient.id && 
                    (a.date === todayStr || a.date?.startsWith(new Date().toISOString().split('T')[0]))
                );

                return {
                    ...patient,
                    balance: totalBalance,
                    // Use recorder from treatment if found, otherwise appointment dentist, otherwise lastDoctor
                    doctor: todayTRT?.recorder || latestTRT?.recorder || todayApt?.dentist || todayApt?.doctor || patient.lastDoctor || langT('ไม่ระบุแพทย์', 'Unassigned'),
                    time: todayApt?.time || todayApt?.appointmentTime || (latestTRT?.date ? new Date(latestTRT.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'),
                    unpaidCount: unpaid.length
                };
            })
            .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.hn?.includes(searchQuery));
    }, [patients, appointments, todayStr, searchQuery]);

    const aptsMap = useMemo(() => {
        const map = {};
        appointments.forEach(a => { if (a.id) map[a.id] = a; });
        return map;
    }, [appointments]);

    // 2. Paid Today: Invoices marked as paid today
    const paidTodayList = useMemo(() => {
        return invoices.filter(inv => inv.status === 'Paid' && matchesToday(inv.date))
            .map(inv => ({
                ...inv,
                doctorName: inv.doctorName || inv.recorder || aptsMap[inv.appointmentId]?.dentist || langT('ไม่ระบุแพทย์', 'Unassigned')
            }))
            .filter(inv => {
                if (!searchQuery) return true;
                const pName = inv.patientName || '';
                const invId = inv.id || '';
                return pName.toLowerCase().includes(searchQuery.toLowerCase()) || invId.includes(searchQuery);
            });
    }, [invoices, appointments, todayStr, searchQuery]);

    // 3. Pending: Invoices created in the past that are still unpaid
    const pendingList = useMemo(() => {
        return invoices.filter(inv => inv.status === 'Pending' && !matchesToday(inv.date))
            .map(inv => ({
                ...inv,
                doctorName: inv.doctorName || aptsMap[inv.appointmentId]?.dentist || langT('ไม่ระบุแพทย์', 'No Doctor Assigned')
            }))
            .filter(inv => {
                if (!searchQuery) return true;
                const pName = inv.patientName || '';
                const invId = inv.id || '';
                return pName.toLowerCase().includes(searchQuery.toLowerCase()) || invId.includes(searchQuery);
            });
    }, [invoices, appointments, todayStr, searchQuery]);

    // ── Actions ──────────────────────────────────────────────────

    const handleSaveInvoice = (invoiceData) => {
        addInvoice(invoiceData);
        setIsModalOpen(false);
        setPrePopulatedId('');
        setPrePopulatedItems([]);
    };

    const handleProcessPayment = (patient) => {
        navigate(`/patients/${patient.id}?tab=billing`, { state: { from: '/billing' } });
    };

    const totalIncomeToday = paidTodayList.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const { expenses, addExpense, deleteExpense } = useData();

    const todayExpenses = useMemo(() => {
        return (expenses || []).filter(e => {
            const dateVal = e.date || e.timestamp;
            if (!dateVal) return false;
            return dateVal.startsWith(todayISO) || new Date(dateVal).toLocaleDateString() === todayLocale;
        });
    }, [expenses, todayISO, todayLocale]);

    const totalExpensesToday = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    // Doctor Commissions Calculation
    const doctorCommissions = useMemo(() => {
        const docMap = {};
        paidTodayList.forEach(inv => {
            const docName = inv.doctorName || langT('ไม่ระบุแพทย์', 'Unassigned');
            if (!docMap[docName]) {
                // Look up matching staff member to get their specific commission rate
                const staffMember = (staff || []).find(s => s.name === inv.doctorName);
                const rate = staffMember?.commissionRate !== undefined ? staffMember.commissionRate : 50;
                
                docMap[docName] = { 
                    totalRevenue: 0, 
                    commission: 0, 
                    count: 0,
                    rate: rate
                };
            }
            docMap[docName].totalRevenue += (inv.amount || 0);
            docMap[docName].count += 1;
            docMap[docName].commission += (inv.amount || 0) * (docMap[docName].rate / 100); 
        });
        return Object.entries(docMap).map(([name, stats]) => ({ name, ...stats }));
    }, [paidTodayList, staff, langT]);

    const totalDoctorFees = doctorCommissions.reduce((sum, d) => sum + d.commission, 0);
    const netBalanceToday = totalIncomeToday - totalExpensesToday - totalDoctorFees;

    // Detailed Revenue Breakdown for Closing Summary
    const revenueBreakdown = useMemo(() => {
        const breakdown = {
            cash: 0,
            transfer: 0,
            credit: 0,
            sso: 0,
            outstanding: 0 // Debt recorded in today's split payments
        };

        paidTodayList.forEach(inv => {
            if (inv.splitAmounts) {
                breakdown.cash += Number(inv.splitAmounts.cash || 0);
                breakdown.transfer += Number(inv.splitAmounts.transfer || 0);
                breakdown.credit += Number(inv.splitAmounts.card || 0);
                breakdown.sso += Number(inv.splitAmounts.claim || 0);
                breakdown.outstanding += Number(inv.splitAmounts.debt || 0);
            } else {
                const method = (inv.paymentMethod || '').toLowerCase();
                const amount = Number(inv.amount || 0);
                const claim = Number(inv.insuranceClaimAmount || 0);

                // If specialized claim amount exists, subtract it from the total to find the patient-paid portion
                const patientPay = amount - claim;

                if (method.includes('claim') || method.includes('sso') || method.includes('ประกัน')) {
                    breakdown.sso += amount; // Entire invoice was a claim
                } else if (method.includes('card') || method.includes('บัตร')) {
                    breakdown.credit += patientPay;
                    breakdown.sso += claim;
                } else if (method.includes('transfer') || method.includes('โอน') || method.includes('พร้อมเพย์')) {
                    breakdown.transfer += patientPay;
                    breakdown.sso += claim;
                } else {
                    // Default to cash if unknown or explicitly cash
                    breakdown.cash += patientPay;
                    breakdown.sso += claim;
                }
            }
        });

        // Also add general 'Unpaid' treatments from TODAY to outstanding
        const todayUnpaidOnly = patients.reduce((sum, p) => {
            const todayT = (p.treatments || []).filter(t => t.paymentStatus === 'unpaid' && t.date?.startsWith(todayISO));
            return sum + todayT.reduce((acc, t) => acc + (t.price || 0), 0);
        }, 0);

        breakdown.outstanding += todayUnpaidOnly;

        return breakdown;
    }, [paidTodayList, patients, todayISO]);

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', type: 'expense' });

    const handleAddExpense = () => {
        if (!expenseForm.description || !expenseForm.amount) return;
        addExpense({
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount),
            type: expenseForm.type,
            date: new Date().toISOString()
        });
        setExpenseForm({ description: '', amount: '', type: 'expense' });
        setIsExpenseModalOpen(false);
    };

    const handlePrintSummary = () => {
        window.print();
    };

    return (
        <div className="billing-container animate-slide-up">
            <InvoiceModal
                isOpen={isModalOpen}
                initialPatientId={prePopulatedId}
                initialItems={prePopulatedItems}
                onClose={() => {
                    setIsModalOpen(false);
                    setPrePopulatedId('');
                    setPrePopulatedItems([]);
                }}
                onSave={handleSaveInvoice}
            />

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="animate-scale-in" style={{
                        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px',
                        padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>
                                {langT('บันทึกค่าใช้จ่าย / เงินถอน', 'Add Expense / Withdrawal')}
                            </h3>
                            <button onClick={() => setIsExpenseModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                                    {langT('ประเภทรายการ', 'Transaction Type')}
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => setExpenseForm({...expenseForm, type: 'expense'})}
                                        style={{ 
                                            flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                                            borderColor: expenseForm.type === 'expense' ? 'var(--primary-500)' : '#f1f5f9',
                                            background: expenseForm.type === 'expense' ? 'var(--primary-50)' : 'white',
                                            fontWeight: 800, color: expenseForm.type === 'expense' ? 'var(--primary-700)' : '#64748b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {langT('ค่าใช้จ่าย', 'Expense')}
                                    </button>
                                    <button 
                                        onClick={() => setExpenseForm({...expenseForm, type: 'withdrawal'})}
                                        style={{ 
                                            flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                                            borderColor: expenseForm.type === 'withdrawal' ? '#ef4444' : '#f1f5f9',
                                            background: expenseForm.type === 'withdrawal' ? '#fef2f2' : 'white',
                                            fontWeight: 800, color: expenseForm.type === 'withdrawal' ? '#b91c1c' : '#64748b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {langT('เงินถอน', 'Withdrawal')}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                                    {langT('ประเภทย่อย', 'Sub-category')}
                                </label>
                                <select 
                                    value={expenseForm.category || ''}
                                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
                                        fontSize: '1rem', fontWeight: 500, outline: 'none'
                                    }}
                                >
                                    <option value="">{langT('เลือกหมวดหมู่', 'Select Category')}</option>
                                    <option value="utility">{langT('ค่าน้ำ/ค่าไฟ', 'Utilities')}</option>
                                    <option value="lab">{langT('ค่าแล็บ', 'Lab Fees')}</option>
                                    <option value="materials">{langT('ค่าอุปกรณ์/ยา', 'Materials/Supplies')}</option>
                                    <option value="marketing">{langT('ค่าโฆษณา', 'Marketing')}</option>
                                    <option value="salary">{langT('เงินเดือน/OT', 'Salary/OT')}</option>
                                    <option value="personal">{langT('ส่วนตัวเจ้าของ', 'Owner Draw')}</option>
                                    <option value="other">{langT('อื่นๆ', 'Other')}</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                                    {langT('รายละเอียด', 'Description')}
                                </label>
                                <input 
                                    type="text"
                                    placeholder={langT('ระบุรายการ...', 'What was this for?')}
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
                                        fontSize: '1rem', fontWeight: 500, outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                                    {langT('จำนวนเงิน (บาท)', 'Amount (THB)')}
                                </label>
                                <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
                                        fontSize: '1.5rem', fontWeight: 800, outline: 'none', color: 'var(--primary-700)'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                                <button 
                                    onClick={() => setIsExpenseModalOpen(false)}
                                    style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {langT('ยกเลิก', 'Cancel')}
                                </button>
                                <button 
                                    onClick={handleAddExpense}
                                    style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--primary-600)', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)' }}
                                >
                                    {langT('บันทึกรายการ', 'Save Record')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ReceiptModal
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                data={selectedInvoice}
            />

            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="billing-header">
                <div className="billing-title-section">
                    <h1>{t('bill_title')}</h1>
                    <p className="billing-subtitle">{t('bill_subtitle')}</p>
                </div>

                <div className="search-wrapper-billing">
                    <Search size={18} className="search-icon-billing" />
                    <input 
                        type="text" 
                        placeholder={langT('ค้นหาด้วยชื่อ หรือ HN...', 'Search name or HN...')}
                        className="search-input-billing"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Tab Navigation ──────────────────────────────────── */}
            <div className="billing-tabs">
                <TabButton 
                    active={activeTab === 'waiting'} 
                    onClick={() => setActiveTab('waiting')}
                    title={langT('รายชื่อผู้รอชำระเงิน', 'Waiting for Payment')}
                    count={waitingList.length}
                    icon={Clock}
                />
                <TabButton 
                    active={activeTab === 'paid'} 
                    onClick={() => setActiveTab('paid')}
                    title={langT('ชำระแล้ววันนี้', 'Paid Today')}
                    count={paidTodayList.length}
                    icon={CheckCircle}
                />
                <TabButton 
                    active={activeTab === 'pending'} 
                    onClick={() => setActiveTab('pending')}
                    title={langT('ค้างชำระ', 'Outstanding')}
                    count={pendingList.length}
                    icon={AlertCircle}
                />
                <TabButton 
                    active={activeTab === 'summary'} 
                    onClick={() => setActiveTab('summary')}
                    title={langT('สรุปปิดยอด', 'Closing Summary')}
                    icon={Calculator}
                />
            </div>

            {/* ── Content Area ────────────────────────────────────── */}
            <div className="animate-fade-in">
                
                {/* 1. WAITING FOR PAYMENT */}
                {activeTab === 'waiting' && (
                    <div className="billing-list">
                        {waitingList.length === 0 ? (
                            <EmptyState icon={User} text={langT('ไม่มีรายการรอชำระเงิน', 'No pending payments')} />
                        ) : (
                            waitingList.map((patient, i) => (
                                <div key={patient.id} className="billing-card-premium">
                                    <div className="patient-info-compact">
                                        <div className="index-badge-billing">
                                            {i + 1}
                                        </div>
                                        
                                        <div className="patient-meta">
                                            <div className="name-line">
                                                <h4>{patient.name}</h4>
                                                <span className="hn-pill">CN: {patient.hn || patient.id.slice(0, 8)}</span>
                                                <span className="treatment-date-pill">{todayStr}</span>
                                            </div>
                                            <div className="doctor-time-line">
                                                <div className="doctor-bullet" />
                                                <span>{patient.doctor}</span>
                                                <span>•</span>
                                                <span>{patient.time}</span>
                                                <span>•</span>
                                                <span>{patient.phone || langT('ไม่มีเบอร์โทร', 'No phone')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="financial-summary-side">
                                        <div className="amount-label">{langT('ยอดชำระ', 'Balance')}</div>
                                        <div className="amount-value">
                                            {patient.balance?.toLocaleString() || '0'} ฿
                                        </div>
                                        <button onClick={() => handleProcessPayment(patient)} className="btn-billing-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                                            {langT('รับชำระ', 'Process')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 2. PAID TODAY */}
                {activeTab === 'paid' && (
                    <div className="billing-table-card">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{langT('เลขที่ใบเสร็จ', 'Invoice No')}</th>
                                    <th>{langT('ผู้รับบริการ', 'Patient')}</th>
                                    <th>{langT('แพทย์', 'Doctor')}</th>
                                    <th>{langT('ก่อนหัก', 'Prev Rate')}</th>
                                    <th>{langT('ส่วนลด', 'Discount')}</th>
                                    <th>{langT('ยอดสุทธิ', 'Net Total')}</th>
                                    <th>{langT('วิธีชำระ', 'Method')}</th>
                                    <th>{langT('เวลา', 'Time')}</th>
                                    <th style={{ textAlign: 'center' }}>{langT('ใบเสร็จ', 'Reports')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paidTodayList.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" style={{ padding: '6rem 0' }}>
                                            <EmptyState icon={CheckCircle} text={langT('ยังไม่มีรายการชำระในวันนี้', 'No payments today')} />
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {paidTodayList.map((inv, idx) => (
                                            <tr key={inv.id}>
                                                <td>{idx + 1}</td>
                                                <td className="billing-id-cell">{inv.id}</td>
                                                <td>
                                                    <div style={{ fontWeight: 800, color: 'var(--neutral-800)' }}>{inv.patientName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 600 }}>CN: {inv.patientId?.slice(0, 8)}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                                        <div className="doctor-bullet" />
                                                        {inv.doctorName}
                                                    </div>
                                                </td>
                                                <td>{inv.baseTotal?.toLocaleString() || '0.00'}</td>
                                                <td style={{ color: 'var(--danger-600)', fontWeight: 700 }}>{inv.discount > 0 ? `-${inv.discount.toLocaleString()}` : '—'}</td>
                                                <td className="net-total-cell">{inv.amount?.toLocaleString() || '0.00'}</td>
                                                <td>
                                                    <span className="payment-method-pill">
                                                        {inv.paymentMethod || langT('เงินสด', 'Cash')}
                                                    </span>
                                                </td>
                                                <td>{new Date(inv.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td>
                                                    <div className="print-action-group">
                                                        <button 
                                                            onClick={() => setSelectedInvoice(inv)}
                                                            className="print-btn-mini">
                                                            <Printer size={12} /> TH
                                                        </button>
                                                        <button 
                                                            onClick={() => setSelectedInvoice(inv)}
                                                            className="print-btn-mini">
                                                            <Printer size={12} /> EN
                                                        </button>
                                                        <button className="icon-btn-ghost">
                                                            <Edit3 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{ background: 'var(--success-50)', fontWeight: 900 }}>
                                            <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', fontSize: '1rem', color: 'var(--success-800)' }}>
                                                {langT('รวมรายได้วันนี้', 'Total Income Today')}
                                            </td>
                                            <td style={{ padding: '1.5rem', color: 'var(--success-700)', fontSize: '1.25rem' }}>
                                                ฿{totalIncomeToday.toLocaleString()}
                                            </td>
                                            <td colSpan="3"></td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 3. PENDING / OUTSTANDING */}
                {activeTab === 'pending' && (
                    <div className="billing-list">
                        {/* Warning Header */}
                        <div className="status-pill-warning" style={{ 
                            background: '#fff7ed', border: '1px solid #ffedd5', 
                            padding: '12px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                            marginBottom: '1rem'
                        }}>
                            <Clock size={16} color="#f97316" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9a3412' }}>
                                {langT('นัดหมายที่ยังไม่ชำระ', 'Unpaid Appointments')}
                            </span>
                        </div>

                        {pendingList.length === 0 ? (
                            <EmptyState icon={AlertCircle} text={langT('ไม่มีรายการค้างชำระ', 'No outstanding payments')} />
                        ) : (
                            pendingList.map((inv, i) => (
                                <div key={inv.id} className="billing-card-premium">
                                    <div className="patient-info-compact">
                                        <div className="index-badge-billing" style={{ background: 'var(--danger-100)', color: 'var(--danger-700)' }}>
                                            {i + 1}
                                        </div>
                                        
                                        <div className="patient-meta">
                                            <div className="name-line">
                                                <h4>{inv.patientName}</h4>
                                                <span className="hn-pill">CN: {inv.patientId?.slice(0, 8)}</span>
                                                <span className="treatment-date-pill">{inv.date}</span>
                                                <span className="status-tag danger">{langT('ค้างชำระ', 'Overdue')}</span>
                                            </div>
                                            <div className="doctor-time-line">
                                                <div className="doctor-bullet" style={{ background: 'var(--danger-400)' }} />
                                                <span>{inv.doctorName}</span>
                                                <span>•</span>
                                                <span>{inv.patientPhone || langT('ไม่มีเบอร์โทร', 'No phone')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="financial-summary-side">
                                        <div className="amount-label">{langT('ยอดค้างชำระ', 'Outstanding')}</div>
                                        <div className="amount-value" style={{ color: 'var(--danger-700)' }}>
                                            {inv.amount?.toLocaleString()} ฿
                                        </div>
                                        <button onClick={() => setSelectedInvoice(inv)} className="btn-billing-primary" style={{ background: 'var(--danger-600)', marginTop: '0.5rem', width: '100%' }}>
                                            <Receipt size={16} /> {langT('รับชำระ', 'Pay Now')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 4. CLOSING SUMMARY */}
                {activeTab === 'summary' && (
                    <div className="billing-list">
                        {/* Summary Grid */}
                        <div className="summary-grid-billing">
                            <div className="summary-card-premium revenue">
                                <div className="summary-icon-box">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="summary-label">{langT('รายรับรวมวันนี้', 'Total Revenue')}</span>
                                <div className="summary-amount">
                                    ฿{totalIncomeToday.toLocaleString()}
                                </div>
                                <p className="summary-description">จากเคสชำระเงินวันนี้ทั้งหมด {paidTodayList.length} รายการ</p>
                            </div>

                            <div className="summary-card-premium expense">
                                <div className="summary-icon-box">
                                    <Wallet size={24} />
                                </div>
                                <span className="summary-label">{langT('ค่าใช้จ่าย / เงินถอน', 'Expenses / Withdrawals')}</span>
                                <div className="summary-amount">
                                    ฿{totalExpensesToday.toLocaleString()}
                                </div>
                                <p className="summary-description">รวมรายการเบิกจ่ายวันนี้ {todayExpenses.length} รายการ</p>
                            </div>

                             <div className="summary-card-premium net">
                                <div className="summary-icon-box" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                                    <Clock size={24} />
                                </div>
                                <span className="summary-label">{langT('ส่วนแบ่งแพทย์วันนี้', 'Total Doctor Fees')}</span>
                                <div className="summary-amount" style={{ color: 'var(--primary-700)' }}>
                                    ฿{totalDoctorFees.toLocaleString()}
                                </div>
                                <p className="summary-description">ค่าหัตถการแบ่งเปอร์เซ็นต์ {doctorCommissions.length} ท่าน</p>
                            </div>

                            <div className="summary-card-premium net" style={{ background: 'var(--success-600)', color: 'white' }}>
                                <div className="summary-icon-box" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                    <Calculator size={24} />
                                </div>
                                <span className="summary-label" style={{ color: 'rgba(255,255,255,0.8)' }}>{langT('กำไรสุทธิส่งเจ้าของ', 'Net Clinic Profit')}</span>
                                <div className="summary-amount" style={{ color: 'white' }}>
                                    ฿{netBalanceToday.toLocaleString()}
                                </div>
                                <p className="summary-description" style={{ color: 'rgba(255,255,255,0.7)' }}>หักค่าใช้จ่ายและค่าแพทย์ครบถ้วนแล้ว</p>
                            </div>
                        </div>

                        {/* Payment Method Breakdown - NEW */}
                        <div className="summary-section-header" style={{ marginTop: '3rem' }}>
                            <div>
                                <h3>{langT('สรุปช่องทางการชำระเงิน', 'Payment Method Breakdown')}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', margin: '4px 0 0 0', fontWeight: 500 }}>
                                    {langT('แยกรายละเอียดรายรับตามวิธีที่คนไข้ชำระ', 'Detailed breakdown of income by payment source')}
                                </p>
                            </div>
                        </div>

                        <div className="summary-grid-billing-detailed">
                            {[
                                { label: langT('เงินสด', 'Cash'), val: revenueBreakdown.cash, icon: Banknote, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
                                { label: langT('เงินโอน', 'Transfer'), val: revenueBreakdown.transfer, icon: Smartphone, color: '#3b82f6', bg: '#eff6ff' },
                                { label: langT('บัตรเครดิต', 'Credit Card'), val: revenueBreakdown.credit, icon: CreditCard, color: '#8b5cf6', bg: '#f5f3ff' },
                                { label: langT('ประกันสังคม', 'Social Security'), val: revenueBreakdown.sso, icon: ShieldCheck, color: '#10b981', bg: '#ecfdf5' },
                                { label: langT('ยอดค้างชำระ', 'Outstanding'), val: revenueBreakdown.outstanding, icon: AlertCircle, color: '#ef4444', bg: '#fef2f2' },
                            ].map((item, idx) => (
                                <div key={idx} className="detailed-summary-card animate-fade-in">
                                    <div className="detailed-icon-box" style={{ background: item.bg, color: item.color }}>
                                        <item.icon size={22} />
                                    </div>
                                    <span className="detailed-label">{item.label}</span>
                                    <div className="detailed-value">
                                        ฿{item.val.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Doctor Commission Table */}
                        <div className="summary-section-header" style={{ marginTop: '2rem' }}>
                            <div>
                                <h3>{langT('สรุปค่ามือแพทย์', 'Doctor Commission Summary')}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', margin: '4px 0 0 0', fontWeight: 500 }}>
                                    {langT('แยกยอดรายได้สุทธิที่ต้องจ่ายให้หมอเป็นรายบุคคล', 'Breakdown of daily earnings per doctor')}
                                </p>
                            </div>
                        </div>

                        <div className="billing-table-card">
                            <table className="billing-table">
                                <thead>
                                    <tr>
                                        <th>{langT('ชื่อแพทย์', 'Doctor Name')}</th>
                                        <th style={{ textAlign: 'center' }}>{langT('จำนวนเคส', 'Cases')}</th>
                                        <th style={{ textAlign: 'right' }}>{langT('ยอดหัตถการรวม', 'Treatm. Rev')}</th>
                                        <th style={{ textAlign: 'right', color: 'var(--primary-600)' }}>{langT('ยอดที่ต้องจ่ายหมอ', 'Amount to Payout')}</th>
                                        <th style={{ textAlign: 'right' }}>{langT('ส่วนเข้าคลินิก', 'Clinic Share')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctorCommissions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '3rem 0', textAlign: 'center', opacity: 0.5 }}>
                                                {langT('ไม่มีรายการหัตถการวันนี้', 'No treatments recorded today')}
                                            </td>
                                        </tr>
                                    ) : (
                                        doctorCommissions.map((doc, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 800 }}>{doc.name}</td>
                                                <td style={{ textAlign: 'center' }}>{doc.count} {langT('เคส', 'cases')}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>฿{doc.totalRevenue.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--primary-700)', fontSize: '1.05rem', background: 'var(--primary-50)' }}>
                                                    ฿{doc.commission.toLocaleString()} 
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-400)', marginLeft: '6px', fontWeight: 700 }}>({doc.rate}%)</span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>฿{(doc.totalRevenue - doc.commission).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                    {doctorCommissions.length > 0 && (
                                        <tr style={{ background: 'var(--primary-600)', color: 'white' }}>
                                            <td colSpan="3" style={{ padding: '1.25rem', fontWeight: 900, textAlign: 'right', fontSize: '1rem' }}>
                                                {langT('รวมยอดที่ต้องจ่ายหมอทั้งหมดวันนี้:', 'Total Payout to All Doctors Today:')}
                                            </td>
                                            <td style={{ padding: '1.25rem', fontWeight: 950, textAlign: 'right', fontSize: '1.35rem' }}>
                                                ฿{totalDoctorFees.toLocaleString()}
                                            </td>
                                            <td style={{ background: 'var(--primary-700)' }}></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Expense Management Header */}
                        <div className="summary-section-header">
                            <div>
                                <h3>{langT('รายการเบิกจ่ายรายวัน', 'Today\'s Expenses')}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', margin: '4px 0 0 0', fontWeight: 500 }}>
                                    {langT('สามารถเพิ่มค่าใช้จ่ายและเงินถอนเพื่อสรุปยอดตอนปิดคลินิก', 'Track manual expenses and withdrawals for EOD reporting')}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="btn-add-transaction"
                            >
                                <Plus size={18} /> {langT('เพิ่มค่าใช้จ่าย/เงินถอน', 'Add Transaction')}
                            </button>
                        </div>

                        {/* Expense Table */}
                        <div className="billing-table-card">
                            <table className="billing-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{langT('ประเภทรรายการ', 'Type')}</th>
                                        <th>{langT('รายละเอียด', 'Description')}</th>
                                        <th>{langT('หมวดหมู่', 'Category')}</th>
                                        <th style={{ textAlign: 'right' }}>{langT('จำนวนเงิน', 'Amount')}</th>
                                        <th style={{ textAlign: 'center' }}>{langT('จัดการ', 'Action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todayExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '6rem 0', textAlign: 'center' }}>
                                                <History size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: 'var(--neutral-400)' }} />
                                                <p style={{ fontWeight: 800, color: 'var(--neutral-400)' }}>{langT('ไม่มีรายการเบิกจ่ายในวันนี้', 'No expenses recorded today')}</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        todayExpenses.map((exp, idx) => (
                                            <tr key={exp.id}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <span style={{ 
                                                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                                                        background: exp.type === 'withdrawal' ? 'var(--danger-50)' : 'var(--neutral-50)',
                                                        color: exp.type === 'withdrawal' ? 'var(--danger-600)' : 'var(--neutral-600)'
                                                    }}>
                                                        {exp.type === 'withdrawal' ? langT('เงินถอน', 'Withdrawal') : langT('ค่าใช้จ่าย', 'Expense')}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 800, color: 'var(--neutral-800)' }}>{exp.description}</td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-400)' }}>{exp.category || '—'}</span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--danger-600)', fontSize: '1rem' }}>- ฿{Number(exp.amount).toLocaleString()}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button 
                                                        onClick={() => deleteExpense(exp.id)}
                                                        className="icon-btn-ghost"
                                                        style={{ padding: '8px', borderRadius: '50%', margin: '0 auto' }}
                                                    >
                                                        <Plus size={18} style={{ transform: 'rotate(45deg)', color: 'var(--neutral-300)' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

// ── Sub-components ───────────────────────────────────────────────────

const TabButton = ({ active, onClick, title, count, icon: Icon, color }) => (
    <button 
        onClick={onClick}
        style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '16px',
            background: active ? '#f8fafc' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
        }}
    >
        <Icon size={18} color={active ? 'var(--primary-600)' : '#94a3b8'} style={{ transition: 'all 0.3s' }} />
        <span style={{ 
            fontSize: '0.95rem', 
            fontWeight: 800, 
            color: active ? 'var(--primary-700)' : '#64748b',
        }}>
            {title}
        </span>
        {count > 0 && (
            <span style={{ 
                background: color, 
                color: 'white', 
                minWidth: '22px', 
                height: '22px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 900,
                boxShadow: `0 4px 10px ${color}40`,
                animation: active ? 'pulse 2s infinite' : 'none'
            }}>
                {count}
            </span>
        )}
        {active && (
            <div style={{ 
                position: 'absolute', bottom: '-4px', left: '20px', right: '20px', 
                height: '3px', background: 'var(--primary-600)', borderRadius: '3px 3px 0 0' 
            }} />
        )}
    </button>
);

const EmptyState = ({ icon: Icon, text }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0', opacity: 0.5 }}>
        <Icon size={48} style={{ marginBottom: '1rem', color: '#94a3b8' }} />
        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#94a3b8' }}>{text}</p>
    </div>
);

const cardStyle = {
    background: 'white',
    borderRadius: '24px',
    padding: '1.25rem 1.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1.5px solid #eef2f6',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    transition: 'all 0.25s',
};

const thStyle = {
    padding: '1.25rem 1.5rem',
    textAlign: 'left',
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
};

const tdStyle = {
    padding: '1.25rem 1.5rem',
    fontSize: '0.9rem',
    color: '#334155',
};

export default Billing;
