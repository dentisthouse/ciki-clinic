import React, { useState, useMemo } from 'react';
import {
    CreditCard, Wallet, QrCode, Smartphone, Building2, DollarSign,
    CheckCircle, Clock, XCircle, ArrowUpRight, TrendingUp, Shield,
    Search, Filter, Download, Eye, RefreshCw, Zap, Copy, ExternalLink,
    Users, Calendar, BarChart3, Hash, AlertTriangle, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

const OnlinePaymentSystem = () => {
    const { language } = useLanguage();
    const { invoices, addInvoice, patients, staff } = useData();
    const [activeTab, setActiveTab] = useState('overview');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // Sort invoices by date
    const transactions = useMemo(() => {
        return [...invoices].sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
    }, [invoices]);

    const [newPayment, setNewPayment] = useState({
        patientId: '', patientName: '', amount: '', treatment: '', method: 'qr_promptpay', installmentMonths: 3,
    });

    // Payment methods
    const paymentMethods = [
        { id: 'qr_promptpay', name: language === 'TH' ? 'QR พร้อมเพย์' : 'QR PromptPay', icon: '🔲', color: '#0d9488', desc: 'Scan QR Code via PromptPay' },
        { id: 'credit_card', name: language === 'TH' ? 'บัตรเครดิต/เดบิต' : 'Credit/Debit Card', icon: '💳', color: '#6366f1', desc: 'Visa, Mastercard, JCB' },
        { id: 'bank_transfer', name: language === 'TH' ? 'โอนเงินธนาคาร' : 'Bank Transfer', icon: '🏦', color: '#3b82f6', desc: 'Direct bank transfer' },
        { id: 'installment', name: language === 'TH' ? 'ผ่อนชำระ' : 'Installment', icon: '📅', color: '#f59e0b', desc: '0% Interest up to 10 months' },
        { id: 'e_wallet', name: 'E-Wallet', icon: '📱', color: '#ec4899', desc: 'TrueMoney, Rabbit LINE Pay' },
        { id: 'cash', name: language === 'TH' ? 'เงินสด' : 'Cash', icon: '💵', color: '#22c55e', desc: 'Pay with cash at clinic' },
    ];

    const statusConfig = {
        Paid: { label: language === 'TH' ? 'สำเร็จ' : 'Success', color: '#22c55e', bg: '#f0fdf4' },
        Pending: { label: language === 'TH' ? 'รอยืนยัน' : 'Pending', color: '#f59e0b', bg: '#fffbeb' },
        Failed: { label: language === 'TH' ? 'ล้มเหลว' : 'Failed', color: '#ef4444', bg: '#fef2f2' },
        Refunded: { label: language === 'TH' ? 'คืนเงิน' : 'Refunded', color: '#8b5cf6', bg: '#f5f3ff' },
    };

    // Stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRevenue = transactions.filter(t => t.date === todayStr && t.status === 'Paid').reduce((s, t) => s + (t.total || t.amount), 0);
    const totalRevenue = transactions.filter(t => t.status === 'Paid').reduce((s, t) => s + (t.total || t.amount), 0);
    const totalPending = transactions.filter(t => t.status === 'Pending').length;

    const processPayment = () => {
        if (!newPayment.patientName || !newPayment.amount) {
            alert(language === 'TH' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
            return;
        }

        const invoiceData = {
            patientId: newPayment.patientId || `WALKIN-${Date.now()}`,
            patientName: newPayment.patientName,
            amount: Number(newPayment.amount),
            total: Number(newPayment.amount),
            status: newPayment.method === 'cash' ? 'Paid' : 'Pending',
            paymentMethod: newPayment.method,
            date: todayStr,
            timestamp: new Date().toISOString(),
            items: [{ procedure: newPayment.treatment || (language === 'TH' ? 'ชำระเงินทั่วไป' : 'General Payment'), price: Number(newPayment.amount) }],
            recorder: 'System Admin'
        };

        addInvoice(invoiceData);
        setShowPaymentModal(false);
        setNewPayment({ patientId: '', patientName: '', amount: '', treatment: '', method: 'qr_promptpay', installmentMonths: 3 });
        alert(language === 'TH' ? 'บันทึกการรับชำระเงินเรียบร้อย' : 'Payment recorded successfully');
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #22c55e, #10b981)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(34, 197, 94, 0.2)' }}>
                            <CreditCard size={22} />
                        </div>
                        {language === 'TH' ? 'ศูนย์จัดการธุรกรรมการเงิน' : 'Financial Transaction Hub'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        {language === 'TH' ? 'ภาพรวมรายรับและประวัติการชำระเงินทั้งหมดของคลินิก' : 'Overview of all clinic revenue and payment history'}
                    </p>
                </div>
                <button onClick={() => setShowPaymentModal(true)} style={{
                    padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white',
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 8px 16px rgba(34, 197, 94, 0.25)', fontSize: '0.9rem'
                }}>
                    <Zap size={18} /> {language === 'TH' ? 'รับชำระเงินด่วน' : 'Quick Payment'}
                </button>
            </div>

            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{language === 'TH' ? 'รายได้วันนี้' : 'Today Revenue'}</span>
                        <div style={{ padding: '6px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}><TrendingUp size={16} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>฿{todayRevenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>Active Transactions</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{language === 'TH' ? 'รายได้รวม' : 'Total Revenue'}</span>
                        <div style={{ padding: '6px', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px' }}><BarChart3 size={16} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>฿{totalRevenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '4px', fontWeight: 600 }}>Accumulated Total</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{language === 'TH' ? 'รายการรอยืนยัน' : 'Pending'}</span>
                        <div style={{ padding: '6px', background: '#fffbeb', color: '#f59e0b', borderRadius: '8px' }}><Clock size={16} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{totalPending}</div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 600 }}>Waiting for clearance</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{language === 'TH' ? 'ธุรกรรมทั้งหมด' : 'Total Txn'}</span>
                        <div style={{ padding: '6px', background: '#f5f3ff', color: '#8b5cf6', borderRadius: '8px' }}><Hash size={16} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{transactions.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '4px', fontWeight: 600 }}>Historical records</div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 900 }}>{language === 'TH' ? 'รายการธุรกรรมล่าสุด' : 'Recent Transactions'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                            <input type="text" placeholder={language === 'TH' ? 'ค้นหาธุรกรรม...' : 'Search...'} style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '10px', border: '1px solid var(--neutral-200)', fontSize: '0.85rem' }} />
                        </div>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <Filter size={16} /> {language === 'TH' ? 'กรอง' : 'Filter'}
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 700 }}>TXN ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 700 }}>PATIENT</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 700 }}>AMOUNT</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 700 }}>METHOD</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 700 }}>STATUS</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 700 }}>DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t, idx) => {
                                const status = statusConfig[t.status] || statusConfig.Pending;
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--neutral-50)' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>#{t.id ? t.id.slice(-8) : 'N/A'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.patientName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{t.items?.[0]?.procedure || t.treatment || '-'}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, fontSize: '1rem' }}>฿{(t.total || t.amount || 0).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neutral-500)', background: 'var(--neutral-100)', padding: '4px 10px', borderRadius: '8px' }}>
                                                {t.paymentMethod}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', background: status.bg, color: status.color }}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{t.date}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {transactions.length === 0 && (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--neutral-300)' }}>
                            <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <p>{language === 'TH' ? 'ไม่พบประวัติการทำรายการ' : 'No transactions found'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{language === 'TH' ? 'รับชำระเงินด่วน' : 'Quick Payment'}</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="modal-close"><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>{language === 'TH' ? 'ชื่อคนไข้ (Walk-in)' : 'Patient Name (Walk-in)'}</label>
                                    <input type="text" className="form-input" value={newPayment.patientName} onChange={e => setNewPayment({...newPayment, patientName: e.target.value})} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>{language === 'TH' ? 'จำนวนเงิน (฿)' : 'Amount (฿)'}</label>
                                    <input type="number" className="form-input" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>{language === 'TH' ? 'ช่องทางชำระเงิน' : 'Method'}</label>
                                    <select className="form-input" value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} style={{ width: '100%' }}>
                                        {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={processPayment} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '16px', fontWeight: 900 }}>
                                    {language === 'TH' ? 'ยืนยันรับชำระเงิน' : 'Confirm Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlinePaymentSystem;
