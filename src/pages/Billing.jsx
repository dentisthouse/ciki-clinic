import React, { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle, TrendingUp } from 'lucide-react';
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

    const financialSummary = [
        { label: t('dash_revenue'), value: `฿${totalRevenue.toLocaleString()}`, color: 'var(--primary-600)' },
        { label: t('bill_unpaid'), value: `฿${pendingAmount.toLocaleString()}`, color: 'var(--danger)' },
        { label: t('bill_collected'), value: `฿${totalRevenue.toLocaleString()}`, color: 'var(--success)' },
    ];

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
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    {language === 'EN' ? 'New Invoice' : 'เพิ่มใบแจ้งหนี้'}
                </button>
            </div>

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
