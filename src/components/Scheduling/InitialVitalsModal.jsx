import React, { useState } from 'react';
import { X, Save, Clipboard, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const InitialVitalsModal = ({ isOpen, onClose, onSave, patientName, patientCN }) => {
    const { language } = useLanguage();
    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        bp_low: '',
        bp_high: '',
        temperature: '',
        pulse: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                            width: '40px', height: '40px', background: '#e0f2fe', color: '#0ea5e9', 
                            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                            <Clipboard size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                            {language === 'TH' ? 'บันทึกข้อมูลก่อนรับบริการ' : 'Pre-service Vital Signs'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{language === 'TH' ? 'ผู้รับบริการ' : 'Patient'}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                            {patientName} {patientCN && `(CN: ${patientCN})`}
                        </div>
                    </div>

                    <form id="vitals-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'น้ำหนัก (กก.)' : 'Weight (kg)'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={language === 'TH' ? 'เช่น 60.5' : 'e.g. 60.5'}
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'ส่วนสูง (ซม.)' : 'Height (cm)'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={language === 'TH' ? 'เช่น 165' : 'e.g. 165'}
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'ความดัน (ค่าล่าง)' : 'BP (Lower)'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={language === 'TH' ? 'เช่น 80' : 'e.g. 80'}
                                    value={formData.bp_low}
                                    onChange={(e) => setFormData({ ...formData, bp_low: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'ความดัน (ค่าบน)' : 'BP (Upper)'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={language === 'TH' ? 'เช่น 120' : 'e.g. 120'}
                                    value={formData.bp_high}
                                    onChange={(e) => setFormData({ ...formData, bp_high: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'อุณหภูมิ (°C)' : 'Temp (°C)'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={language === 'TH' ? 'เช่น 36.5' : 'e.g. 36.5'}
                                    value={formData.temperature}
                                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'ชีพจร (ครั้ง/นาที)' : 'Pulse (bpm)'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={language === 'TH' ? 'เช่น 72' : 'e.g. 72'}
                                    value={formData.pulse}
                                    onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{language === 'TH' ? 'หมายเหตุ' : 'Notes'}</label>
                            <textarea
                                className="form-textarea"
                                rows="3"
                                placeholder={language === 'TH' ? 'อาการเบื้องต้น อื่น ๆ...' : 'Initial symptoms, others...'}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="modal-footer" style={{ borderTop: 'none', padding: '1rem 1.5rem 2rem' }}>
                    <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <X size={18} /> {language === 'TH' ? 'ปิด' : 'Close'}
                        </div>
                    </button>
                    <button type="submit" form="vitals-form" className="btn btn-primary" style={{ flex: 1, borderRadius: '12px', background: '#00ccff', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> {language === 'TH' ? 'บันทึก' : 'Save'}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InitialVitalsModal;
