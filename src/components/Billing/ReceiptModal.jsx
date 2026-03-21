import React from 'react';

const ReceiptModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const { patientName, patientId, date, items, total, claimAmount, copayAmount, method } = data;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '500px' }}>
                <div className="printable-content" style={{ padding: '1rem' }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>คลินิกทันตกรรม CIKI DENTAL</h2>
                        <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>123 Sukhumvit Road, Watthana, Bangkok 10110</p>
                        <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Tel: 02-123-4567 | Tax ID: 0-1234-56789-00-1</p>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '1rem' }}>ใบเสร็จรับเงิน / RECEIPT</h3>
                    </div>

                    {/* Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <div>
                            <p><strong>HN:</strong> {patientId}</p>
                            <p><strong>Name:</strong> {patientName}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p><strong>No:</strong> R-{Date.now().toString().slice(-6)}</p>
                            <p><strong>Date:</strong> {new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                                <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Description</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(items || []).map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px dashed #eee' }}>
                                    <td style={{ padding: '0.5rem 0' }}>{item.procedure || item.description || 'Treatment'}</td>
                                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{Number(item.price || item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ marginTop: '1rem', borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '0.5rem' }}>
                            <span>ยอดรวม (Total):</span>
                            <span style={{ fontWeight: 600 }}>{Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        {claimAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', marginBottom: '0.5rem' }}>
                                <span>เบิกต้นสังกัด/ประกัน (Insurance/SSO):</span>
                                <span>-{Number(claimAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, borderTop: '1px dashed #ccc', paddingTop: '0.5rem' }}>
                            <span>ยอดชำระสุทธิ (Net Payable):</span>
                            <span>{Number(copayAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>
                            Payment Method: {method || 'Cash'}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', padding: '0 2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px dotted #000', width: '120px', marginBottom: '0.5rem' }}></div>
                            <p style={{ fontSize: '0.8rem' }}>ผู้รับเงิน (Cashier)</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px dotted #000', width: '120px', marginBottom: '0.5rem' }}></div>
                            <p style={{ fontSize: '0.8rem' }}>ผู้จ่ายเงิน (Payer)</p>
                        </div>
                    </div>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => window.print()} style={{ flex: 1 }}>
                        Print Receipt
                    </button>
                    <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                        Close
                    </button>
                </div>
            </div>
            <style>{`
                @media print { 
                    body * { visibility: hidden; } 
                    .modal-overlay { background: white; position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
                    .printable-content, .printable-content * { visibility: visible; }
                    .printable-content { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
                    .no-print { display: none; } 
                }
            `}</style>
        </div>
    );
};

export default ReceiptModal;
