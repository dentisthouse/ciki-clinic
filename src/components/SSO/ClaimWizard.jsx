import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { FileText, Calculator, Check, PenTool } from 'lucide-react';

const ClaimWizard = ({ patient, onComplete, onCancel }) => {
    const { t } = useLanguage();
    const { addSSOClaim } = useData();
    const [step, setStep] = useState(1);
    const [procedure, setProcedure] = useState('');
    const [signature, setSignature] = useState(false); // Digital signature status

    // Procedure Mapping Logic
    // In real app, this would be a lookup table or database
    const PROCEDURES = [
        { id: 'p1', label: 'Scaling (Full Mouth)', code: '01', fee: 1200 },
        { id: 'p2', label: 'Simple Extraction', code: '02', fee: 900 },
        { id: 'p3', label: 'Impacted Tooth Removal', code: '04', fee: 3500 },
        { id: 'p4', label: 'Filling (1 Surface)', code: '05', fee: 800 },
    ];

    const selectedProc = PROCEDURES.find(p => p.id === procedure);

    // Calculation Logic
    const calculate = () => {
        if (!selectedProc) return { fee: 0, claimable: 0, excess: 0 };
        const fee = selectedProc.fee;
        // Limit claim to remaining balance or fee, whichever is lower
        // Also limit to 900 per procedure/visit as per general rule (implied)
        const maxPerVisit = 900;
        const available = Math.min(patient.balance, maxPerVisit);

        const claimable = Math.min(fee, available);
        const excess = fee - claimable;
        return { fee, claimable, excess };
    };

    const { fee, claimable, excess } = calculate();

    const handleSubmit = () => {
        const claimData = {
            patientId: patient.id,
            patientName: patient.name,
            procedure: selectedProc.label,
            code: selectedProc.code,
            amount: claimable,
            patientPay: excess,
            approvalCode: null // Pending
        };
        addSSOClaim(claimData);
        onComplete();
    };

    return (
        <div className="card glass-panel-premium animate-slide-up" style={{ maxWidth: '850px', margin: '0 auto', padding: '0', background: 'white', overflow: 'hidden' }}>
            {/* Header */}
            <div className="billing-header-compact" style={{ padding: '2rem 2.5rem', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neutral-900)' }}>{t('sso_btn_create_claim')}</h2>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.2rem' }}>{patient.name} • {patient.rights}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {[1, 2, 3].map((s) => (
                        <div key={s} style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: step === s ? 'var(--primary-600)' : step > s ? 'var(--primary-100)' : 'white',
                            color: step === s ? 'white' : step > s ? 'var(--primary-600)' : 'var(--neutral-400)',
                            border: `1px solid ${step >= s ? 'var(--primary-200)' : 'var(--neutral-200)'}`,
                            fontWeight: 800, fontSize: '0.85rem',
                            boxShadow: step === s ? '0 4px 10px rgba(20, 184, 166, 0.3)' : 'none',
                            transition: 'all 0.3s'
                        }}>
                            {step > s ? <Check size={16} /> : s}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '2.5rem' }}>
                <div className="wizard-content">
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--neutral-800)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ padding: '0.4rem', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '8px' }}>
                                    <Calculator size={18} />
                                </div>
                                {t('sso_step_2')}
                            </h3>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.5rem', display: 'block' }}>{t('sso_label_procedure')}</label>
                                <select
                                    className="form-input"
                                    value={procedure}
                                    onChange={(e) => setProcedure(e.target.value)}
                                    style={{ fontSize: '1.1rem', padding: '1rem', borderRadius: '14px', border: '1.5px solid var(--neutral-100)', background: 'var(--neutral-50)', width: '100%', outline: 'none' }}
                                >
                                    <option value="">-- {language === 'TH' ? 'เลือกหัตถการ' : 'Select Procedure'} --</option>
                                    {PROCEDURES.map(p => (
                                        <option key={p.id} value={p.id}>{p.label} (Fee: {p.fee})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedProc && (
                                <div className="glass-panel-premium animate-slide-up" style={{ padding: '1.75rem', borderRadius: '20px', marginTop: '2rem', display: 'grid', gap: '1.25rem', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--neutral-500)' }}>{t('sso_label_code')}</span>
                                        <strong style={{ background: 'var(--neutral-200)', padding: '0.2rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>{selectedProc.code}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--neutral-500)' }}>{t('sso_label_fee')}</span>
                                        <strong style={{ fontSize: '1.1rem' }}>฿{fee.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--primary-600)' }}>
                                        <span style={{ fontWeight: 800 }}>{t('sso_label_claimable')}</span>
                                        <strong style={{ fontSize: '1.25rem', fontWeight: 900 }}>฿{claimable.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--danger)', borderTop: '1px dashed var(--neutral-300)', paddingTop: '1rem' }}>
                                        <span style={{ fontWeight: 700 }}>{t('sso_label_excess')}</span>
                                        <strong style={{ fontSize: '1.1rem', fontWeight: 800 }}>฿{excess.toLocaleString()}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--neutral-800)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ padding: '0.4rem', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '8px' }}>
                                    <PenTool size={18} />
                                </div>
                                {t('sso_step_3')}
                            </h3>
                            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', background: 'white', border: '1px solid var(--neutral-100)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                <p style={{ lineHeight: 1.7, color: 'var(--neutral-600)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>{t('sso_consent_text')}</p>

                                <div 
                                    className="floating-icon"
                                    style={{ 
                                        border: `2px dashed ${signature ? 'var(--primary-300)' : 'var(--neutral-200)'}`, 
                                        height: '180px', 
                                        borderRadius: '24px', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer', 
                                        background: signature ? 'var(--primary-50)' : 'var(--neutral-50)',
                                        transition: 'all 0.3s'
                                    }} 
                                    onClick={() => setSignature(true)}
                                >
                                    {signature ? (
                                        <span style={{ color: 'var(--primary-700)', fontWeight: 'bold', fontSize: '2.5rem', fontFamily: '"Dancing Script", cursive' }}>{patient.name}</span>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>
                                            <PenTool size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Click to Sign Digitally</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="floating-icon" style={{ width: '80px', height: '80px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px rgba(20, 184, 166, 0.1)' }}>
                                <Check size={40} strokeWidth={3} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neutral-900)' }}>Ready to Submit</h3>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Claim for <strong style={{ color: 'var(--primary-600)' }}>฿{claimable.toLocaleString()}</strong> will be sent to SSO.</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid var(--neutral-100)', paddingTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={step === 1 ? onCancel : () => setStep(step - 1)}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, flex: 1, minWidth: '120px' }}
                    >
                        {step === 1 ? t('btn_cancel') : (language === 'TH' ? 'ย้อนกลับ' : 'Back')}
                    </button>
                    <button
                        className="btn btn-primary"
                        disabled={step === 1 && !procedure || step === 2 && !signature}
                        onClick={() => {
                            if (step < 3) setStep(step + 1);
                            else handleSubmit();
                        }}
                        style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 800, minWidth: '140px', flex: 1 }}
                    >
                        {step === 3 ? t('sso_step_4') : (language === 'TH' ? 'ถัดไป' : 'Next')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClaimWizard;
