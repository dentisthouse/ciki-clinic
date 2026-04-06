import React, { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle, TrendingUp, Calculator, Wallet, Receipt, Clock } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import InvoiceModal from '../components/Billing/InvoiceModal';
import ReceiptModal from '../components/Billing/ReceiptModal';

const Billing = () => {
    const { t, language } = useLanguage();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { invoices, addInvoice, updateInvoice, patients } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [prePopulatedId, setPrePopulatedId] = useState('');
    const [prePopulatedItems, setPrePopulatedItems] = useState([]);

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [shiftData, setShiftData] = useState({ openingFloat: 1000, expenses: 0, expenseNote: '' });

    useEffect(() => {
        const patientId = searchParams.get('patientId');
        if (patientId) {
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                setPrePopulatedId(patientId);
                // Filter treatments that are unpaid
                const unpaid = (patient.treatments || []).filter(trt => trt.paymentStatus === 'unpaid');
                setPrePopulatedItems(unpaid);
                setIsModalOpen(true);
            }
        }
    }, [location, searchParams, patients]);

    const handleSaveInvoice = (invoiceData) => {
        addInvoice(invoiceData);
        setIsModalOpen(false);
        setPrePopulatedId('');
        setPrePopulatedItems([]);
    };

    const handleMarkAsPaid = (id) => {
        if (window.confirm('Mark this invoice as PAID?')) {
            updateInvoice(id, 'Paid');
        }
    };

    // Calculate Summary Stats
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + (i.amount || 0), 0);
    const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + (i.amount || 0), 0);
    
    // Today's specific totals
    const todayStr = new Date().toLocaleDateString();
    const todayInvoices = invoices.filter(i => i.date === todayStr && i.status === 'Paid');
    const todayCashRevenue = todayInvoices.reduce((acc, i) => acc + (i.amount || 0), 0); // Simplified assuming all cash for now, or filter by paymentMethod if exists

    const financialSummary = [
        { label: t('dash_revenue'), value: `฿${totalRevenue.toLocaleString()}`, color: 'var(--primary-600)' },
        { label: t('bill_unpaid'), value: `฿${pendingAmount.toLocaleString()}`, color: 'var(--danger)' },
        { label: t('bill_collected'), value: `฿${totalRevenue.toLocaleString()}`, color: 'var(--success)' },
    ];

    // Identify patients who have unpaid treatments (Doctor sent to Counter) - Real-time Handoff
    const pendingPatients = patients.filter(p => (p.treatments || []).some(t => t.paymentStatus === 'unpaid'));

    return (
        <div className="animate-slide-up">
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

            <ReceiptModal
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                data={selectedInvoice}
            />

            {/* Page Header */}
            <div className="page-header">
                <div className="page-title-group">
                    <h1>{t('bill_title')}</h1>
                    <p>{t('bill_subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', border: '1.5px solid var(--primary-100)' }} onClick={() => setShowShiftModal(true)}>
                        <Calculator size={18} style={{ marginRight: '8px' }} />
                        {language === 'EN' ? 'Daily Reconciliation' : 'สรุปยอดประจำวัน'}
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        {language === 'EN' ? 'New Invoice' : 'เพิ่มใบแจ้งหนี้'}
                    </button>
                </div>
            </div>

            {/* Pending Billing Queue - REAL-TIME HANDOFF */}
            {pendingPatients.length > 0 && (
                <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Clock size={18} color="var(--primary-600)" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                            {language === 'TH' ? 'รายการรอชำระเงิน (จากห้องตรวจ)' : 'Pending Payments (From Clinics)'}
                        </h3>
                        <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{pendingPatients.length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {pendingPatients.map(patient => (
                            <div 
                                key={patient.id} 
                                className="card glass-panel-premium" 
                                style={{ 
                                    padding: '1.25rem', 
                                    background: 'var(--primary-50)', 
                                    border: '1.4px solid var(--primary-200)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onClick={() => {
                                    setPrePopulatedId(patient.id);
                                    setPrePopulatedItems(patient.treatments.filter(t => t.paymentStatus === 'unpaid'));
                                    setIsModalOpen(true);
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--neutral-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.2rem' }}>ID: {patient.id}</div>
                                    </div>
                                    <div style={{ 
                                        background: 'white', 
                                        color: 'var(--primary-600)', 
                                        padding: '0.5rem', 
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-sm)',
                                        border: '1px solid var(--primary-100)' 
                                    }}>
                                        <Receipt size={18} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--primary-700)', background: 'var(--primary-100)', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>
                                        {patient.treatments.filter(t => t.paymentStatus === 'unpaid').length} {language === 'TH' ? 'รายการ' : 'Items'}
                                    </span>
                                    <span style={{ color: 'var(--neutral-300)' }}>•</span>
                                    <span style={{ fontWeight: 800, color: 'var(--neutral-900)', fontSize: '1rem' }}>
                                        ฿{patient.treatments.filter(t => t.paymentStatus === 'unpaid').reduce((sum, t) => sum + (t.price || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', marginTop: '0.25rem', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)' }}>
                                    {language === 'TH' ? 'ออกใบเรียกเก็บเงิน' : 'Process Payment'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shift Closing Modal */}
            {showShiftModal && (
                <div 
                    className="modal-overlay" 
                    style={{ 
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'flex-start', // Start from top with padding
                        padding: '4rem 1rem', overflowY: 'auto', zIndex: 1000 
                    }}
                >
                    <div 
                        className="modal-content animate-slide-up" 
                        style={{ 
                            width: '450px', maxWidth: '100%', 
                            background: 'white', borderRadius: '24px', padding: '2rem',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid var(--neutral-100)',
                            margin: 'auto' // Crucial for vertical centering in scrollable area
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '1.25rem' }}>
                            <div style={{ background: 'var(--primary-600)', color: 'white', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(20, 184, 166, 0.3)' }}>
                                <Calculator size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--neutral-900)' }}>{language === 'TH' ? 'สรุปยอดเงินสดประจำวัน' : 'Daily Cash Reconciliation'}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', margin: 0, fontWeight: 500 }}>{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--neutral-700)', marginBottom: '0.5rem' }}>
                                    <Wallet size={16} color="var(--primary-600)" /> {language === 'TH' ? 'เงินเงินทอน / ยอดตั้งต้น' : 'Opening Float'}
                                </label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={shiftData.openingFloat} 
                                    onChange={(e) => setShiftData({ ...shiftData, openingFloat: parseFloat(e.target.value) || 0 })}
                                    style={{ padding: '0.9rem', fontSize: '1rem', borderRadius: '12px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--success-700)', marginBottom: '0.5rem' }}>
                                    <TrendingUp size={16} /> {language === 'TH' ? 'รายรับเงินสดวันนี้ (ตามระบบ)' : 'Today\'s Cash Revenue (System)'}
                                </label>
                                <div style={{ padding: '1rem', background: '#f0fdf4', color: '#16a34a', borderRadius: '12px', fontWeight: 800, fontSize: '1.4rem', border: '1px solid #bbfc7', textAlign: 'center' }}>
                                    ฿{todayCashRevenue.toLocaleString()}
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--danger-700)', marginBottom: '0.5rem' }}>
                                    <Receipt size={16} /> {language === 'TH' ? 'รายจ่ายจิปาถะวันนี้' : 'Daily Expenses'}
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        placeholder="฿"
                                        value={shiftData.expenses} 
                                        onChange={(e) => setShiftData({ ...shiftData, expenses: parseFloat(e.target.value) || 0 })}
                                        style={{ borderColor: 'var(--danger-200)', flex: 1, padding: '0.9rem', fontSize: '1.1rem', borderRadius: '12px', fontWeight: 700 }}
                                    />
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder={language === 'TH' ? 'จ่ายค่าอะไร? (เช่น ค่าน้ำ, ค่าของ)' : 'Description (e.g. Water, Supplies)'}
                                        value={shiftData.expenseNote} 
                                        onChange={(e) => setShiftData({ ...shiftData, expenseNote: e.target.value })}
                                        style={{ flex: 2, padding: '0.9rem', fontSize: '1rem', borderRadius: '12px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '0.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderRadius: '20px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                                {shiftData.expenseNote && (
                                    <div style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: '0.5rem', opacity: 0.9 }}>
                                        — {shiftData.expenseNote} —
                                    </div>
                                )}
                                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem', fontWeight: 500 }}>{language === 'TH' ? 'เงินสดที่ต้องเหลือในลิ้นชัก' : 'Net Expected Cash'}</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>฿{(shiftData.openingFloat + todayCashRevenue - shiftData.expenses).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem' }} onClick={() => setShowShiftModal(false)}>{t('btn_close')}</button>
                            <button className="btn btn-primary" style={{ flex: 1.5, padding: '0.8rem', background: 'var(--primary-600)' }} onClick={() => {
                                alert(language === 'TH' ? 'พิมพ์ใบสรุปยอดสำเร็จ' : 'Summary Printed Successfully');
                                setShowShiftModal(false);
                            }}>
                                {language === 'TH' ? 'พิมพ์ใบสรุปยอด' : 'Print Summary'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card glass-panel-premium animate-slide-up delay-100" style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <div>
                        <div style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('dash_revenue')}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neutral-900)' }}>฿{totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="floating-icon" style={{ padding: '1rem', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(20, 184, 166, 0.2)' }}>
                        <TrendingUp size={28} />
                    </div>
                </div>
                <div className="card glass-panel-premium animate-slide-up delay-200" style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <div>
                        <div style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('bill_unpaid')}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>฿{pendingAmount.toLocaleString()}</div>
                    </div>
                    <div className="floating-icon" style={{ padding: '1rem', background: '#ffe4e6', color: '#e11d48', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(225, 29, 72, 0.2)' }}>
                        <FileText size={28} />
                    </div>
                </div>
                <div className="card glass-panel-premium animate-slide-up delay-300" style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <div>
                        <div style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('bill_collected')}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>฿{totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="floating-icon" style={{ padding: '1rem', background: '#f0fdf4', color: '#16a34a', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.2)' }}>
                        <CheckCircle size={28} />
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="table-container shadow-sm">
                <div className="table-header">
                    <h3 style={{ fontSize: '1.125rem' }}>{language === 'EN' ? 'Recent Invoices' : 'ใบแจ้งหนี้ล่าสุด'}</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>{t('bill_col_invoice')}</th>
                            <th>{t('pat_col_patient')}</th>
                            <th>{t('bill_col_date')}</th>
                            <th>{t('bill_col_amount')}</th>
                            <th>{t('pat_col_status')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{ cursor: 'pointer', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                <td style={{ fontWeight: 600 }}>{inv.id}</td>
                                <td>{inv.patientName}</td>
                                <td>{inv.date}</td>
                                <td style={{ fontWeight: 700 }}>฿{(inv.amount || 0).toLocaleString()}</td>
                                <td>
                                    <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                        {inv.status === 'Paid' ? t('bill_collected') : t('bill_unpaid')}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {inv.status !== 'Paid' && (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem', color: 'var(--success)' }}
                                            onClick={() => handleMarkAsPaid(inv.id)}
                                            title="Mark as Paid"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Billing;
