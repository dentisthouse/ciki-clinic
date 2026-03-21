import React, { useState } from 'react';
import { X, Calendar, Clock, User, FileText } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

const AppointmentModal = ({ isOpen, onClose, onSave }) => {
    const { t } = useLanguage();
    const { patients } = useData();
    const [formData, setFormData] = useState({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: 30,
        type: 'General Checkup',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            patientName: patients.find(p => p.id === formData.patientId)?.name || 'Unknown'
        });
        onClose();
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out'
    };

    const modalStyle = {
        backgroundColor: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '500px',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out',
        border: '1px solid var(--neutral-200)'
    };

    const headerStyle = {
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--neutral-100)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--neutral-50)'
    };

    const inputGroupStyle = {
        marginBottom: '1rem'
    };

    const labelStyle = {
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--neutral-700)',
        marginBottom: '0.5rem',
        gap: '0.5rem'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--neutral-200)',
        outline: 'none',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s'
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{t('apt_title')}</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    {/* Patient Select */}
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>
                            <User size={16} />
                            {t('apt_patient')}
                        </label>
                        <select
                            required
                            style={inputStyle}
                            value={formData.patientId}
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                        >
                            <option value="">{t('apt_select_patient')}</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Date */}
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <Calendar size={16} />
                                {t('apt_date')}
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="date"
                                    required
                                    style={inputStyle}
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0 0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + 28); // +4 Weeks
                                        setFormData({ ...formData, date: date.toISOString().split('T')[0] });
                                    }}
                                    title="+4 Weeks (Ortho Recall)"
                                >
                                    +4W
                                </button>
                            </div>
                        </div>
                        {/* Time */}
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <Clock size={16} />
                                {t('apt_time')}
                            </label>
                            <input
                                type="time"
                                required
                                style={inputStyle}
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Duration */}
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>{t('apt_duration')}</label>
                            <select
                                style={inputStyle}
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
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>{t('apt_type')}</label>
                            <select
                                style={inputStyle}
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
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>
                            <FileText size={16} />
                            {t('apt_notes')}
                        </label>
                        <textarea
                            style={{ ...inputStyle, resize: 'none' }}
                            rows="3"
                            placeholder={t('apt_notes_placeholder')}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        ></textarea>
                    </div>

                    <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            {t('apt_cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {t('apt_create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;
