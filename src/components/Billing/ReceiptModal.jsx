import React from 'react';
import ReactDOM from 'react-dom';
import { CreditCard, Printer, X } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const { patientName, patientId, date, items, total, claimAmount, copayAmount, method } = data;

    return ReactDOM.createPortal(
        <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.6)', 
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="animate-slide-up" style={{ 
                width: '600px', 
                maxWidth: '96vw', 
                maxHeight: '90vh',
                padding: '3rem', 
                borderRadius: '32px', 
                position: 'relative',
                background: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflowY: 'auto'
            }}>
                <div className="printable-content" style={{ padding: '0', color: '#1e293b' }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '3px double #e2e8f0', paddingBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', background: 'var(--primary-600)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <CreditCard size={26} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: 'var(--neutral-900)' }}>CIKI DENTAL CLINIC</h2>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', margin: '0 0 0.25rem 0' }}>123 Sukhumvit Road, Watthana, Bangkok 10110</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', margin: '0 0 1.5rem 0' }}>Tel: 02-123-4567 | Tax ID: 0-1234-56789-00-1</p>
                        
                        <div style={{ display: 'inline-block', background: 'var(--neutral-900)', color: 'white', padding: '0.65rem 1.75rem', borderRadius: '30px', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            {method?.toLowerCase()?.includes('claim') ? 'Insurance / SSO Bill' : 'Official Receipt'}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.9rem', padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 800, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Patient Name</label>
                                <span style={{ fontWeight: 800, fontSize: '1rem' }}>{patientName}</span>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 800, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Patient HN</label>
                                <span style={{ fontWeight: 600 }}>{patientId}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'right' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 800, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Receipt No</label>
                                <span style={{ fontWeight: 600 }}>R-{Date.now().toString().slice(-6)}</span>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 800, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Date & Time</label>
                                <span style={{ fontWeight: 600 }}>{new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', marginBottom: '2.5rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2.5px solid var(--neutral-900)' }}>
                                <th style={{ textAlign: 'left', padding: '1.25rem 0.5rem', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-600)', letterSpacing: '0.05em' }}>Description</th>
                                <th style={{ textAlign: 'right', padding: '1.25rem 0.5rem', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-600)', letterSpacing: '0.05em' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(items || []).map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                    <td style={{ padding: '1.25rem 0.5rem', fontWeight: 600, color: 'var(--neutral-800)' }}>{item.procedure || item.description || 'Treatment'}</td>
                                    <td style={{ padding: '1.25rem 0.5rem', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>{Number(item.price || item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div style={{ marginLeft: 'auto', width: '320px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                            <span style={{ color: 'var(--neutral-500)', fontWeight: 700 }}>Sub-Total</span>
                            <span style={{ fontWeight: 700 }}>฿{Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        {claimAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: '1rem' }}>
                                <span style={{ fontWeight: 700 }}>SSO / Insurance</span>
                                <span style={{ fontWeight: 800 }}>-฿{Number(claimAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '1.75rem', 
                            fontWeight: 900, 
                            padding: '1.25rem 0', 
                            borderTop: '2.5px solid var(--neutral-900)',
                            color: 'var(--neutral-900)',
                            letterSpacing: '-0.03em'
                        }}>
                            <span>PAID</span>
                            <span>฿{Number(copayAmount || total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        <div style={{ textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--neutral-400)', fontWeight: 800 }}>
                            Method: {method || 'Cash'}
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', fontSize: '0.9rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {/* Space for stamp/signature */}
                            </div>
                            <div style={{ borderTop: '1.5px solid var(--neutral-400)', paddingTop: '0.75rem', color: 'var(--neutral-600)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authorized Signature</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '70px' }}></div>
                            <div style={{ borderTop: '1.5px solid var(--neutral-400)', paddingTop: '0.75rem', color: 'var(--neutral-600)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Received By</div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '4rem', fontSize: '0.8rem', color: 'var(--neutral-400)', fontStyle: 'italic', maxWidth: '80%', margin: '4rem auto 0 auto' }}>
                        "Your smile is our priority. Thank you for choosing CIKI Dental Clinic."
                    </div>
                </div>

                <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '3rem', borderTop: '1px solid var(--neutral-100)', paddingTop: '2.5rem' }}>
                    <button className="btn btn-primary" onClick={() => window.print()} style={{ height: '56px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '16px' }}>
                        <Printer size={22} style={{ marginRight: '8px' }} />
                        Print Receipt
                    </button>
                    <button className="btn btn-secondary" onClick={onClose} style={{ height: '52px', fontSize: '1.05rem', fontWeight: 800, borderRadius: '16px' }}>
                        Close
                    </button>
                </div>
            </div>
                   <style>{`
                @media print { 
                    /* Hide EVERYTHING non-essential */
                    #root, .no-print, .btn, button, .sidebar, .header-container { 
                        display: none !important; 
                    }

                    /* Ensure background is white and clean */
                    body, html {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                    }

                    /* CRITICAL: Disable flexbox centering on the Portal container during print */
                    div[style*="position: fixed"] {
                        display: block !important; /* Break flexbox */
                        background: none !important;
                        backdrop-filter: none !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .printable-content { 
                        display: block !important;
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 210mm !important; 
                        height: 297mm !important;
                        padding: 15mm 20mm !important; 
                        background: white !important;
                        margin: 0 !important;
                        z-index: 9999999 !important;
                        color: black !important;
                        box-sizing: border-box !important;
                    }

                    @page { 
                        margin: 0; 
                        size: A4 portrait; 
                    }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default ReceiptModal;
