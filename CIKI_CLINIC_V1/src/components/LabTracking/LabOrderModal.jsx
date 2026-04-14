import React, { useState, useEffect } from 'react';
import { X, Save, TestTube } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const LabOrderModal = ({ isOpen, onClose, onSave, order }) => {
    const { t, language } = useLanguage();
    const { patients } = useData();
    const [formData, setFormData] = useState({
        patientId: '',
        labName: '',
        workType: 'Crown',
        sentDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'Sent',
        notes: ''
    });

    useEffect(() => {
        if (order) {
            setFormData(order);
        } else {
            setFormData({
                patientId: '',
                labName: '',
                workType: 'Crown',
                sentDate: new Date().toISOString().split('T')[0],
                dueDate: '',
                status: 'Sent',
                notes: ''
            });
        }
    }, [order, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const patientName = patients.find(p => p.id === formData.patientId)?.name || 'Unknown';
        onSave({ ...formData, patientName, id: order?.id });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '600px' }}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-box" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', width: '40px', height: '40px' }}>
                            <TestTube size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--neutral-900)' }}>
                            {order ? t('lab_modal_edit') : t('lab_modal_new')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content - SCROLLABLE BODY */}
                <div className="modal-body" style={{ padding: '2rem' }}>
                    <form id="lab-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">{t('pat_col_patient')}</label>
                            <select
                                className="form-select"
                                required
                                value={formData.patientId}
                                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                            >
                                <option value="">{t('apt_select_patient')}</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('lab_col_lab')}</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.labName}
                                onChange={e => setFormData({ ...formData, labName: e.target.value })}
                                placeholder="Dental Lab Name..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">{t('lab_form_work')}</label>
                                <select
                                    className="form-select"
                                    value={formData.workType}
                                    onChange={e => setFormData({ ...formData, workType: e.target.value })}
                                >
                                    <option value="Crown">Crown</option>
                                    <option value="Bridge">Bridge</option>
                                    <option value="Denture">Denture</option>
                                    <option value="Implant">Implant</option>
                                    <option value="Orthodontic Appliance">Orthodontic Appliance</option>
                                    <option value="Veneer">Veneer</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('lab_col_status')}</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Sent">Sent</option>
                                    <option value="Received">Received</option>
                                    <option value="DeliveredToPatient">Delivered to Patient</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">{t('lab_form_sent')}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    required
                                    value={formData.sentDate}
                                    onChange={e => setFormData({ ...formData, sentDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('lab_form_due')}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    required
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{t('apt_notes')}</label>
                            <textarea
                                className="form-textarea"
                                rows="3"
                                style={{ resize: 'none' }}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Special instructions for the lab..."
                            />
                        </div>
                    </form>
                </div>

                {/* Modal Footer - FIXED AT BOTTOM */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', borderRadius: '16px', fontWeight: 600 }} onClick={onClose}>
                        {t('btn_cancel')}
                    </button>
                    <button type="submit" form="lab-form" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', borderRadius: '16px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}>
                        <Save size={18} style={{ marginRight: '8px' }} />
                        {t('lab_form_save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabOrderModal;
