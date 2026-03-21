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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>{order ? t('lab_modal_edit') : t('lab_modal_new')}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
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

                    <div>
                        <label className="form-label">{t('lab_col_lab')}</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={formData.labName}
                            onChange={e => setFormData({ ...formData, labName: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
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
                        <div>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">{t('lab_form_sent')}</label>
                            <input
                                type="date"
                                className="form-input"
                                required
                                value={formData.sentDate}
                                onChange={e => setFormData({ ...formData, sentDate: e.target.value })}
                            />
                        </div>
                        <div>
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

                    <div>
                        <label className="form-label">{t('apt_notes')}</label>
                        <textarea
                            className="form-input"
                            rows="2"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('btn_cancel')}</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {t('lab_form_save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabOrderModal;
