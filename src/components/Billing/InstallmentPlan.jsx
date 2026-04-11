import React, { useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle, Calendar, Plus, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const InstallmentPlan = ({ patient, language, onUpdate, onRequestReceipt }) => {
    const { staff } = useAuth();
    const { addInvoice } = useData();
    
    // Use patient's actual orthoPlan if it exists
    const [plan, setPlan] = useState(patient.orthoPlan || {
        totalAmount: 0,
        downPayment: 0,
        monthlyAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        payments: []
    });

    const totalPaid = plan.payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = plan.totalAmount - totalPaid;
    const installmentsRemaining = Math.ceil(remainingBalance / plan.monthlyAmount);

    // Arrears Logic: If more than 2 overdue payments
    const overdueCount = plan.payments.filter(p => p.status === 'Overdue').length;
    const isArrears = overdueCount >= 2;

    const handleAddPayment = () => {
        const recorderName = staff?.full_name || staff?.name || 'Clinic Staff';
        const typeStr = `Installment ${plan.payments.length + 1}`;
        const newPayment = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            amount: plan.monthlyAmount,
            type: typeStr, 
            status: 'Paid',
            recorder: recorderName
        };

        if (onRequestReceipt) {
            onRequestReceipt(plan.monthlyAmount, `Installment Payment (${typeStr})`);
        } else {
            // Fallback to central invoice if no receipt requested
            addInvoice({
                patientName: patient.name,
                patientId: patient.id,
                amount: plan.monthlyAmount,
                status: 'Paid',
                paymentMethod: 'Cash (Installment)',
                date: new Date().toLocaleDateString(),
                timestamp: new Date().toISOString(),
                recorder: recorderName,
                items: [{ procedure: `Installment Payment (${typeStr})`, price: plan.monthlyAmount }]
            });
        }

        const updatedPlan = { ...plan, payments: [...plan.payments, newPayment] };
        setPlan(updatedPlan);
        if (onUpdate) onUpdate({ ...patient, orthoPlan: updatedPlan });
    };

    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className="animate-fade-in">
            {/* Summary Cards with Action */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-600)', background: 'white' }}>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{language === 'TH' ? 'ยอดรวมทั้งหมด' : 'Total Treatment Fee'}</p>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--neutral-900)', margin: 0 }}>฿{plan.totalAmount.toLocaleString()}</h3>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)', background: 'white' }}>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{language === 'TH' ? 'ชำระแล้ว' : 'Paid Amount'}</p>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--success)', margin: 0 }}>฿{totalPaid.toLocaleString()}</h3>
                </div>
                <div className="card shadow-soft" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)', background: 'var(--neutral-50)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{language === 'TH' ? 'ยอดที่ต้องชำระ (คงเหลือ)' : 'Remaining Balance'}</p>
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--danger)', margin: 0 }}>฿{remainingBalance.toLocaleString()}</h3>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleAddPayment}
                        style={{ width: '100%', marginTop: '1rem', borderRadius: '12px', padding: '0.6rem', fontSize: '0.9rem' }}
                    >
                        <Plus size={16} />
                        {language === 'TH' ? 'รับชำระค่างวด' : 'Receive Installment'}
                    </button>
                </div>
            </div>

            {/* View History Button - The only visible thing for history by default */}
            {!showHistory && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <button 
                        onClick={() => setShowHistory(true)}
                        className="btn-text"
                        style={{ 
                            color: 'var(--neutral-500)', fontSize: '0.875rem', fontWeight: 600, 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem',
                            border: '1px dashed var(--neutral-300)', borderRadius: '12px'
                        }}
                    >
                        {language === 'TH' ? 'แสดงประวัติการชำระเงิน' : 'Show Payment History'}
                        <ChevronDown size={16} />
                    </button>
                </div>
            )}

            {/* Payment History Card - Only shown when showHistory is true */}
            {showHistory && (
                <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden', border: '1.5px solid var(--primary-100)' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-50)' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--primary-800)', fontWeight: 800 }}>
                            {language === 'TH' ? 'ประวัติการชำระเงิน' : 'Payment History'}
                        </h3>
                        <button 
                            onClick={() => setShowHistory(false)}
                            className="btn-text" 
                            style={{ color: 'var(--primary-600)', fontSize: '0.85rem', fontWeight: 700 }}
                        >
                            {language === 'TH' ? 'ซ่อน' : 'Hide'}
                        </button>
                    </div>
                    
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>Description</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>Amount</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>Recorder</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plan.payments.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>{p.date}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}>{p.type}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700 }}>฿{p.amount.toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                                            {p.recorder || '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <span style={{ 
                                                fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700,
                                                background: p.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                                                color: p.status === 'Paid' ? '#166534' : '#991b1b'
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstallmentPlan;
