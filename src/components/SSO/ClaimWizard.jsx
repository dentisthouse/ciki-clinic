import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { FileText, Calculator, Check, PenTool } from 'lucide-react';

const ClaimWizard = ({ patient, onComplete, onCancel }) => {
    const { t } = useLanguage();
    const { addSSOClaim } = useData();
    const [step, setStep] = useState(1);
    const [procedure, setProcedure] = useState('');
    const [signature, setSignature] = useState(false); // Mock signature

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
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            {/* Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                {[1, 2, 3].map((s) => (
                    <div key={s} style={{
                        zIndex: 1,
                        background: step >= s ? 'var(--primary-600)' : 'var(--neutral-200)',
                        color: step >= s ? 'white' : 'var(--neutral-500)',
                        width: '40px', height: '40px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {s}
                    </div>
                ))}
                {/* Line */}
                <div style={{ position: 'absolute', top: '20px', left: '0', right: '0', height: '2px', background: 'var(--neutral-200)', zIndex: 0 }}>
                    <div style={{ width: `${((step - 1) / 2) * 100}%`, height: '100%', background: 'var(--primary-600)', transition: 'width 0.3s' }}></div>
                </div>
            </div>

            <div className="wizard-content">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h3 className="section-title">{t('sso_step_2')}</h3>
                        <div className="form-group">
                            <label>{t('sso_label_procedure')}</label>
                            <select
                                className="form-input"
                                value={procedure}
                                onChange={(e) => setProcedure(e.target.value)}
                                style={{ fontSize: '1.1rem', padding: '1rem' }}
                            >
                                <option value="">-- Select Procedure --</option>
                                {PROCEDURES.map(p => (
                                    <option key={p.id} value={p.id}>{p.label} (Fee: {p.fee})</option>
                                ))}
                            </select>
                        </div>

                        {selectedProc && (
                            <div style={{ background: 'var(--neutral-50)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{t('sso_label_code')}</span>
                                    <strong>{selectedProc.code}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{t('sso_label_fee')}</span>
                                    <strong>{fee.toLocaleString()} THB</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-600)' }}>
                                    <span>{t('sso_label_claimable')}</span>
                                    <strong>{claimable.toLocaleString()} THB</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', borderTop: '1px solid var(--neutral-200)', paddingTop: '0.5rem' }}>
                                    <span>{t('sso_label_excess')}</span>
                                    <strong>{excess.toLocaleString()} THB</strong>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <h3 className="section-title">{t('sso_step_3')}</h3>
                        <div style={{ border: '1px solid var(--neutral-300)', padding: '2rem', borderRadius: 'var(--radius-md)', background: 'white', marginBottom: '1rem' }}>
                            <p style={{ lineHeight: 1.6, marginBottom: '2rem' }}>{t('sso_consent_text')}</p>

                            <div style={{ border: '2px dashed var(--neutral-300)', height: '150px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: signature ? '#f0fdf4' : 'transparent' }} onClick={() => setSignature(true)}>
                                {signature ? (
                                    <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '1.5rem', fontFamily: 'Cursive' }}>{patient.name}</span>
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>
                                        <PenTool />
                                        <p>Click to Sign (Simulation)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
                        <Check size={64} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                        <h3>Ready to Submit</h3>
                        <p>Claim for {claimable} THB will be sent to SSO.</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn-secondary" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
                    {t('btn_cancel')}
                </button>
                <button
                    className="btn-primary"
                    disabled={step === 1 && !procedure || step === 2 && !signature}
                    onClick={() => {
                        if (step < 3) setStep(step + 1);
                        else handleSubmit();
                    }}
                >
                    {step === 3 ? t('sso_step_4') : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default ClaimWizard;
