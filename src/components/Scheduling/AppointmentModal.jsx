import React, { useState } from 'react';
import { X, Calendar, Clock, User, FileText, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import SearchablePatientSelect from '../Common/SearchablePatientSelect';

const AppointmentModal = ({ isOpen, onClose, onSave }) => {
    const { t } = useLanguage();
    const { patients } = useData();
    const [formData, setFormData] = useState({
        patientId: '',
        date: new Date().toLocaleDateString('sv-SE'),
        time: '09:00',
        duration: 30,
        type: 'General Checkup',
        dentist: 'หมอต้อง',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            treatment: formData.type, // Map the 'type' selection to 'treatment' for the DB
            patientName: patients.find(p => p.id === formData.patientId)?.name || 'Unknown'
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '550px' }}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-box" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', width: '40px', height: '40px' }}>
                            <Calendar size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{t('apt_title')}</h3>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content - SCROLLABLE BODY */}
                <div className="modal-body" style={{ padding: '2rem' }}>
                    <form id="apt-form" onSubmit={handleSubmit}>
                        {/* Patient Select */}
                        <div className="form-group">
                            <label className="form-label">
                                <User size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                {t('apt_patient')}
                            </label>
                            <SearchablePatientSelect
                                patients={patients}
                                value={formData.patientId}
                                onChange={(pId) => setFormData({ ...formData, patientId: pId })}
                                placeholder={t('apt_select_patient')}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Date */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Calendar size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    {t('apt_date')}
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input
                                        type="date"
                                        required
                                        className="form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ height: '48px', padding: '0 0.75rem', fontSize: '0.75rem', borderRadius: '12px' }}
                                        onClick={() => {
                                            const date = new Date();
                                            date.setDate(date.getDate() + 28); // +4 Weeks
                                            setFormData({ ...formData, date: date.toLocaleDateString('sv-SE') });
                                        }}
                                        title="+4 Weeks (Ortho Recall)"
                                    >
                                        +4W
                                    </button>
                                </div>
                            </div>
                            {/* Time */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Clock size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    {t('apt_time')}
                                </label>
                                <input
                                    type="time"
                                    required
                                    className="form-input"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Doctor */}
                            <div className="form-group">
                                <label className="form-label">
                                    <User size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    หมอ (Doctor)
                                </label>
                                <select
                                    className="form-select"
                                    value={formData.dentist || 'หมอต้อง'}
                                    onChange={(e) => setFormData({ ...formData, dentist: e.target.value })}
                                >
                                    <option value="หมอทั่วไป">หมอทั่วไป (General)</option>
                                    <option value="หมอเฉพาะทาง">หมอเฉพาะทาง (Specialist)</option>
                                    <option value="หมอจัดฟัน">หมอจัดฟัน (Ortho)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Duration */}
                            <div className="form-group">
                                <label className="form-label">{t('apt_duration')}</label>
                                <select
                                    className="form-select"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>1 hour</option>
                                </select>
                            </div>

                            {/* Type */}
                            <div className="form-group">
                                <label className="form-label">{t('apt_type')}</label>
                                <select
                                    className="form-select"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Orthodontics" style={{ color: '#ec4899', fontWeight: 600 }}>🩷 {t('apt_type_ortho')} (Orthodontics)</option>
                                    <option value="Ortho Emergency" style={{ color: '#be185d', fontWeight: 600 }}>💔 Ortho Emergency</option>
                                    <option value="Ortho Recall" style={{ color: '#db2777', fontWeight: 600 }}>📅 Ortho Recall</option>
                                    <option value="Cleaning" style={{ color: '#06b6d4', fontWeight: 600 }}>🩵 {t('apt_type_hygiene')} (Cleaning)</option>
                                    <option value="Checkup" style={{ color: '#10b981', fontWeight: 600 }}>🟢 {t('apt_type_general')} (Checkup)</option>
                                    <option value="Extraction" style={{ color: '#f97316', fontWeight: 600 }}>🟠 {t('apt_type_surgery')} (Extraction)</option>
                                    <option value="Root Canal" style={{ color: '#8b5cf6', fontWeight: 600 }}>🟣 {t('apt_type_rootcanal')} (Root Canal)</option>
                                    <option value="Emergency" style={{ color: '#ef4444', fontWeight: 600 }}>🔴 {t('apt_type_emergency')} (Emergency)</option>
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">
                                <FileText size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                {t('apt_notes')}
                            </label>
                            <textarea
                                className="form-textarea"
                                style={{ resize: 'none' }}
                                rows="3"
                                placeholder={t('apt_notes_placeholder')}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Modal Footer - FIXED AT BOTTOM */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.85rem 2rem', borderRadius: '16px', fontWeight: 600 }}>
                        {t('apt_cancel')}
                    </button>
                    <button type="submit" form="apt-form" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', borderRadius: '16px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}>
                        <Save size={18} style={{ marginRight: '8px' }} />
                        {t('apt_create')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentModal;
