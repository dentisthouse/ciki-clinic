import React, { useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle, Calendar, Plus } from 'lucide-react';

const InstallmentPlan = ({ patient, language, onUpdate }) => {
    // Mock Data
    const [plan, setPlan] = useState(patient.orthoPlan || {
        totalAmount: 45000,
        downPayment: 5000,
        monthlyAmount: 1500,
        startDate: new Date().toISOString().split('T')[0],
        payments: [
            { id: 1, date: '2024-01-15', amount: 5000, type: 'Down Payment', status: 'Paid' },
            { id: 2, date: '2024-02-15', amount: 1500, type: 'Installment 1', status: 'Paid' },
            { id: 3, date: '2024-03-15', amount: 1500, type: 'Installment 2', status: 'Paid' },
            { id: 4, date: '2024-04-15', amount: 1500, type: 'Installment 3', status: 'Overdue' }
        ]
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
        const newPayment = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            amount: plan.monthlyAmount,
            type: `Installment ${plan.payments.length}`, // Simple logic
            status: 'Paid'
        };
        setPlan({ ...plan, payments: [...plan.payments, newPayment] });
        if (onUpdate) onUpdate({ ...patient, orthoPlan: { ...plan, payments: [...plan.payments, newPayment] } });
        alert(language === 'TH' ? 'บันทึกการชำระเงินเรียบร้อย' : 'Payment recorded');
    };

    return (
        <div className="animate-fade-in">
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-600)' }}>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>{language === 'TH' ? 'ยอดรวมทั้งหมด' : 'Total Treatment Fee'}</p>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--neutral-900)' }}>฿{plan.totalAmount.toLocaleString()}</h3>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>{language === 'TH' ? 'ชำระแล้ว' : 'Paid Amount'}</p>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>฿{totalPaid.toLocaleString()}</h3>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>{language === 'TH' ? 'คงเหลือ' : 'Remaining Balance'}</p>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>฿{remainingBalance.toLocaleString()}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: '0.25rem' }}>
                        ~{installmentsRemaining} {language === 'TH' ? 'งวด' : 'installments left'}
                    </p>
                </div>
            </div>

            {/* Arrears Alert */}
            {isArrears && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
                    padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    marginBottom: '2rem', color: '#991b1b'
                }}>
                    <AlertCircle size={24} />
                    <div>
                        <h4 style={{ margin: 0 }}>{language === 'TH' ? 'แจ้งเตือนค้างชำระ' : 'Arrears Alert'}</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                            {language === 'TH'
                                ? `คนไข้ค้างชำระ ${overdueCount} งวด กรุณาแจ้งเตือน`
                                : `Patient is behind on ${overdueCount} payments. Please follow up.`}
                        </p>
                    </div>
                    <button className="btn" style={{ marginLeft: 'auto', background: '#fee2e2', color: '#991b1b', border: 'none' }}>
                        {language === 'TH' ? 'ส่งแจ้งเตือน Line' : 'Send Line Alert'}
                    </button>
                </div>
            )}

            {/* Payment History */}
            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{language === 'TH' ? 'ประวัติการชำระเงิน' : 'Payment History'}</h3>
                    <button className="btn btn-primary" onClick={handleAddPayment}>
                        <Plus size={16} style={{ marginRight: '8px' }} />
                        {language === 'TH' ? 'รับชำระค่างวด' : 'Receive Installment'}
                    </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>Description</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plan.payments.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                <td style={{ padding: '1rem', color: 'var(--neutral-700)' }}>{p.date}</td>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{p.type}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>฿{p.amount.toLocaleString()}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span className={`badge ${p.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                                        {p.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstallmentPlan;
