import React, { useState } from 'react';
import {
    CreditCard, Wallet, QrCode, Smartphone, Building2, DollarSign,
    CheckCircle, Clock, XCircle, ArrowUpRight, TrendingUp, Shield,
    Search, Filter, Download, Eye, RefreshCw, Zap, Copy, ExternalLink,
    Users, Calendar, BarChart3, Hash, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OnlinePaymentSystem = () => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState('overview');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);

    // Mock transaction data
    const [transactions, setTransactions] = useState([
        { id: 1, txnId: 'TXN-2569-0001', patientName: 'นายสมชาย ใจดี', amount: 3500, method: 'qr_promptpay', status: 'completed', date: '2026-04-08 09:15', treatment: 'ขูดหินปูน + ตรวจ', ref: 'PP20260408091500001' },
        { id: 2, txnId: 'TXN-2569-0002', patientName: 'นางสาวมาลี สวยงาม', amount: 12000, method: 'credit_card', status: 'completed', date: '2026-04-08 10:30', treatment: 'ครอบฟัน', ref: 'CC20260408103000002' },
        { id: 3, txnId: 'TXN-2569-0003', patientName: 'เด็กชายธนกร เก่งมาก', amount: 1500, method: 'bank_transfer', status: 'pending', date: '2026-04-08 11:45', treatment: 'อุดฟัน', ref: 'BT20260408114500003' },
        { id: 4, txnId: 'TXN-2569-0004', patientName: 'นางสุดา รักดี', amount: 5000, method: 'installment', status: 'completed', date: '2026-04-07 14:20', treatment: 'รักษารากฟัน', ref: 'INS20260407142000004' },
        { id: 5, txnId: 'TXN-2569-0005', patientName: 'นายวิชัย มั่นคง', amount: 800, method: 'cash', status: 'completed', date: '2026-04-07 16:00', treatment: 'ถอนฟัน', ref: 'CASH20260407160000005' },
    ]);

    const [newPayment, setNewPayment] = useState({
        patientName: '', amount: '', treatment: '', method: '', installmentMonths: 3,
    });

    // Payment methods
    const paymentMethods = [
        { id: 'qr_promptpay', name: 'QR PromptPay', icon: '🔲', color: '#0d9488', desc: 'สแกน QR Code จ่ายผ่าน PromptPay' },
        { id: 'credit_card', name: 'บัตรเครดิต/เดบิต', icon: '💳', color: '#6366f1', desc: 'Visa, Mastercard, JCB' },
        { id: 'bank_transfer', name: 'โอนเงินธนาคาร', icon: '🏦', color: '#3b82f6', desc: 'โอนเงินออนไลน์ทุกธนาคาร' },
        { id: 'installment', name: 'ผ่อนชำระ', icon: '📅', color: '#f59e0b', desc: 'ผ่อน 0% สูงสุด 10 เดือน' },
        { id: 'e_wallet', name: 'E-Wallet', icon: '📱', color: '#ec4899', desc: 'TrueMoney, Rabbit LINE Pay' },
        { id: 'cash', name: 'เงินสด', icon: '💵', color: '#22c55e', desc: 'ชำระเงินสดที่คลินิก' },
    ];

    const statusConfig = {
        completed: { label: 'สำเร็จ', color: '#22c55e', bg: '#f0fdf4' },
        pending: { label: 'รอยืนยัน', color: '#f59e0b', bg: '#fffbeb' },
        failed: { label: 'ล้มเหลว', color: '#ef4444', bg: '#fef2f2' },
        refunded: { label: 'คืนเงิน', color: '#8b5cf6', bg: '#f5f3ff' },
    };

    // Stats
    const todayRevenue = transactions.filter(t => t.date.startsWith('2026-04-08') && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    const totalCompleted = transactions.filter(t => t.status === 'completed').length;
    const totalPending = transactions.filter(t => t.status === 'pending').length;
    const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0);

    const processPayment = () => {
        const txn = {
            id: Date.now(),
            txnId: `TXN-2569-${String(transactions.length + 1).padStart(4, '0')}`,
            patientName: newPayment.patientName,
            amount: Number(newPayment.amount),
            method: newPayment.method,
            status: newPayment.method === 'cash' ? 'completed' : 'pending',
            date: new Date().toLocaleString('sv-SE').replace(' ', ' '),
            treatment: newPayment.treatment,
            ref: `${newPayment.method.toUpperCase().replace('_', '')}${Date.now()}`,
        };
        setTransactions(prev => [txn, ...prev]);
        setShowPaymentModal(false);
        setNewPayment({ patientName: '', amount: '', treatment: '', method: '', installmentMonths: 3 });
        alert(`รับชำระเงินเรียบร้อย: ${txn.txnId}`);
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
                        {language === 'TH' ? 'ระบบรับชำระเงินออนไลน์' : 'Online Payment System'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        {language === 'TH' ? 'รองรับช่องทางชำระเงินออนไลน์ที่หลากหลาย PromptPay, บัตรเครดิต, E-Wallet' : 'Multi-channel online payments: PromptPay, Credit Card, E-Wallet'}
                    </p>
                </div>
                <button onClick={() => setShowPaymentModal(true)} style={{
                    padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white',
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 8px 16px rgba(34, 197, 94, 0.25)', fontSize: '0.9rem'
                }}>
                    <Zap size={18} /> รับชำระเงิน
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'รายได้วันนี้', value: `฿${todayRevenue.toLocaleString()}`, icon: DollarSign, color: '#22c55e', bg: '#f0fdf4' },
                    { label: 'รายการสำเร็จ', value: totalCompleted, icon: CheckCircle, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'รอยืนยัน', value: totalPending, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'ยอดรวมทั้งหมด', value: `฿${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#6366f1', bg: '#f5f3ff' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{stat.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Methods Overview */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>💳 ช่องทางชำระเงินที่รองรับ</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
                    {paymentMethods.map(method => {
                        const count = transactions.filter(t => t.method === method.id).length;
                        return (
                            <div key={method.id} className="card" style={{
                                padding: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{method.icon}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.15rem' }}>{method.name}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--neutral-500)' }}>{count} รายการ</div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: method.color }} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transaction History */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-100)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>📋 ประวัติการชำระเงิน</h3>
                    <button style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--neutral-200)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        <Download size={14} /> Export
                    </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--neutral-50)' }}>
                            {['รหัสรายการ', 'ผู้ป่วย', 'บริการ', 'ช่องทาง', 'จำนวน', 'วันที่', 'สถานะ'].map(h => (
                                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--neutral-500)' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(txn => {
                            const sc = statusConfig[txn.status];
                            const method = paymentMethods.find(m => m.id === txn.method);
                            return (
                                <tr key={txn.id} style={{ borderBottom: '1px solid var(--neutral-50)' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--primary-600)' }}>{txn.txnId}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}>{txn.patientName}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--neutral-600)' }}>{txn.treatment}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {method?.icon} {method?.name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 900, fontSize: '0.9rem' }}>฿{txn.amount.toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{txn.date}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
                                            {sc.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>💳 รับชำระเงิน</h2>
                            <button onClick={() => setShowPaymentModal(false)} style={{ border: 'none', background: 'var(--neutral-50)', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer' }}>
                                <XCircle size={20} color="var(--neutral-500)" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ชื่อผู้ป่วย</label>
                                    <input type="text" value={newPayment.patientName} onChange={e => setNewPayment(p => ({ ...p, patientName: e.target.value }))}
                                        placeholder="ชื่อ-สกุล"
                                        style={{ width: '100%', padding: '0.75rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>จำนวนเงิน (บาท)</label>
                                    <input type="number" value={newPayment.amount} onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '0.75rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 800 }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>บริการ/การรักษา</label>
                                <input type="text" value={newPayment.treatment} onChange={e => setNewPayment(p => ({ ...p, treatment: e.target.value }))}
                                    placeholder="เช่น ขูดหินปูน, อุดฟัน..."
                                    style={{ width: '100%', padding: '0.75rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.5rem', display: 'block' }}>ช่องทางชำระเงิน</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    {paymentMethods.map(method => (
                                        <button key={method.id} onClick={() => setNewPayment(p => ({ ...p, method: method.id }))} style={{
                                            padding: '0.75rem', borderRadius: '12px', border: '1.5px solid',
                                            borderColor: newPayment.method === method.id ? method.color : 'var(--neutral-200)',
                                            background: newPayment.method === method.id ? `${method.color}10` : 'white',
                                            cursor: 'pointer', textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{method.icon}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: newPayment.method === method.id ? method.color : 'var(--neutral-600)' }}>{method.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newPayment.method === 'installment' && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>จำนวนงวด (0%)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {[3, 6, 10].map(m => (
                                            <button key={m} onClick={() => setNewPayment(p => ({ ...p, installmentMonths: m }))} style={{
                                                flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1.5px solid',
                                                borderColor: newPayment.installmentMonths === m ? '#f59e0b' : 'var(--neutral-200)',
                                                background: newPayment.installmentMonths === m ? '#fffbeb' : 'white',
                                                fontWeight: 800, cursor: 'pointer',
                                                color: newPayment.installmentMonths === m ? '#d97706' : 'var(--neutral-600)'
                                            }}>{m} เดือน</button>
                                        ))}
                                    </div>
                                    {newPayment.amount && (
                                        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
                                            เดือนละ ฿{(Number(newPayment.amount) / newPayment.installmentMonths).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {newPayment.method === 'qr_promptpay' && newPayment.amount && (
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--neutral-50)', borderRadius: '12px' }}>
                                    <div style={{ width: 150, height: 150, background: 'white', margin: '0 auto', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--neutral-200)' }}>
                                        <QrCode size={100} color="var(--neutral-800)" />
                                    </div>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>สแกนจ่ายผ่าน PromptPay</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-600)', marginTop: '0.25rem' }}>฿{Number(newPayment.amount).toLocaleString()}</div>
                                </div>
                            )}

                            <button onClick={processPayment} disabled={!newPayment.patientName || !newPayment.amount || !newPayment.method} style={{
                                width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white',
                                fontWeight: 800, fontSize: '1rem',
                                boxShadow: '0 8px 16px rgba(34, 197, 94, 0.25)',
                                opacity: (!newPayment.patientName || !newPayment.amount || !newPayment.method) ? 0.5 : 1
                            }}>
                                ✅ ยืนยันรับชำระ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlinePaymentSystem;
