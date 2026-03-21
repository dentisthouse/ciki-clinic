import React, { useState } from 'react';
import { X, Printer, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

const SSOReportModal = ({ isOpen, onClose }) => {
    const { patients } = useData();
    const { t, language } = useLanguage();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    if (!isOpen) return null;

    // Filter Logic
    const claims = [];
    patients.forEach(patient => {
        if (patient.treatments) {
            patient.treatments.forEach(trt => {
                if (trt.paymentStatus === 'paid' && trt.insuranceClaimAmount > 0) {
                    const payDate = trt.paidDate.slice(0, 7);
                    if (payDate === month) {
                        claims.push({
                            date: trt.paidDate,
                            patientName: patient.name,
                            hospital: patient.hospital || 'Unknown',
                            procedure: trt.procedure,
                            amount: trt.insuranceClaimAmount,
                            copay: (trt.price - trt.insuranceClaimAmount)
                        });
                    }
                }
            });
        }
    });

    // Sort by date
    claims.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalClaim = claims.reduce((sum, c) => sum + c.amount, 0);

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                <div className="printable-content">
                    <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>SSO Claims Report</h2>
                            <p style={{ color: '#666' }}>Period: {month}</p>
                        </div>
                        <div className="no-print">
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Patient</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Hospital</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Procedure</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Claim (THB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.length > 0 ? (
                                claims.map((c, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem' }}>{new Date(c.date).toLocaleDateString('th-TH')}</td>
                                        <td style={{ padding: '0.75rem' }}>{c.patientName}</td>
                                        <td style={{ padding: '0.75rem' }}>{c.hospital}</td>
                                        <td style={{ padding: '0.75rem' }}>{c.procedure}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{c.amount.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No claims found for this month</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid #000', background: '#f0fdf4' }}>
                                <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>Total Reimbursable:</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: '#166534' }}>฿{totalClaim.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <Printer size={18} style={{ marginRight: '8px' }} /> Print Report
                    </button>
                </div>
            </div>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-content, .printable-content * { visibility: visible; }
                    .printable-content { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                    .modal-content { box-shadow: none; border: none; }
                }
            `}</style>
        </div>
    );
};

export default SSOReportModal;
