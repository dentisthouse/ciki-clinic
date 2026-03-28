import React, { useState } from 'react';
import { X, Calendar, Clock, User, FileText, Save, Send, MessageCircle, CheckCircle, Smartphone } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { sendLineAppointmentNotification, sendAppointmentSMS } from '../../services/notificationService';

const AppointmentModal = ({ isOpen, onClose, onSave }) => {
    const { t, language } = useLanguage();
    const { patients } = useData();
    const [formData, setFormData] = useState({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: 30,
        type: 'General Checkup',
        notes: ''
    });
    
    // LINE Notification State
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [lineUserId, setLineUserId] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [notificationStatus, setNotificationStatus] = useState(null);
    const [sending, setSending] = useState(false);

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
                            <select
                                required
                                className="form-select"
                                value={formData.patientId}
                                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            >
                                <option value="">{t('apt_select_patient')}</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
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
                                            setFormData({ ...formData, date: date.toISOString().split('T')[0] });
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

                        {/* LINE Notification Toggle */}
                        <div style={{ 
                            background: '#F0FDF4', 
                            borderRadius: '12px', 
                            padding: '1rem',
                            border: '1px solid #BBF7D0',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        background: '#22C55E', 
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <MessageCircle size={20} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 700, color: '#166534', margin: 0 }}>
                                            {language === 'TH' ? 'ส่งแจ้งเตือน LINE' : 'Send LINE Notification'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: '#15803D', margin: 0 }}>
                                            {language === 'TH' ? 'Flex Message พร้อมปุ่มยืนยัน' : 'Flex Message with Confirm Buttons'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                                    style={{
                                        background: showNotificationPanel ? '#22C55E' : 'white',
                                        color: showNotificationPanel ? 'white' : '#22C55E',
                                        border: '2px solid #22C55E',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {showNotificationPanel ? (language === 'TH' ? 'ซ่อน' : 'Hide') : (language === 'TH' ? 'ตั้งค่า' : 'Setup')}
                                </button>
                            </div>

                            {/* Notification Panel */}
                            {showNotificationPanel && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #BBF7D0' }}>
                                    {/* LINE User ID */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            fontSize: '0.875rem', 
                                            fontWeight: 600, 
                                            color: '#374151',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <MessageCircle size={14} />
                                            LINE User ID
                                        </label>
                                        <input
                                            type="text"
                                            value={lineUserId}
                                            onChange={(e) => setLineUserId(e.target.value)}
                                            placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #D1D5DB',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                                            {language === 'TH' 
                                                ? 'รหัสผู้ใช้ LINE สำหรับส่ง Flex Message พร้อมปุ่มยืนยัน/เลื่อน/ยกเลิก' 
                                                : 'LINE User ID for sending Flex Message with Confirm/Reschedule/Cancel buttons'}
                                        </p>
                                    </div>

                                    {/* Phone for SMS */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            fontSize: '0.875rem', 
                                            fontWeight: 600, 
                                            color: '#374151',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <Smartphone size={14} />
                                            {language === 'TH' ? 'เบอร์โทรศัพท์ (สำหรับ SMS)' : 'Phone Number (for SMS)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={patientPhone}
                                            onChange={(e) => setPatientPhone(e.target.value)}
                                            placeholder="08xxxxxxxx"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #D1D5DB',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>

                                    {/* Send Buttons */}
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!lineUserId) {
                                                    setNotificationStatus({ type: 'error', message: language === 'TH' ? 'กรุณาระบุ LINE User ID' : 'Please enter LINE User ID' });
                                                    return;
                                                }
                                                setSending(true);
                                                const patient = patients.find(p => p.id === formData.patientId);
                                                const result = await sendLineAppointmentNotification({
                                                    userId: lineUserId,
                                                    patientName: patient?.name || 'คุณลูกค้า',
                                                    appointmentDate: formData.date,
                                                    appointmentTime: formData.time,
                                                    treatment: formData.type,
                                                    doctor: 'ทันตแพทย์ประจำ',
                                                    appointmentId: `APT-${Date.now()}`
                                                });
                                                setSending(false);
                                                if (result.success) {
                                                    setNotificationStatus({ type: 'success', message: language === 'TH' ? 'ส่ง LINE สำเร็จ!' : 'LINE sent successfully!' });
                                                } else {
                                                    setNotificationStatus({ type: 'error', message: result.error || (language === 'TH' ? 'ส่งไม่สำเร็จ' : 'Failed to send') });
                                                }
                                            }}
                                            disabled={sending}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: '#22C55E',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                cursor: sending ? 'not-allowed' : 'pointer',
                                                opacity: sending ? 0.7 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Send size={16} />
                                            {sending ? (language === 'TH' ? 'กำลังส่ง...' : 'Sending...') : (language === 'TH' ? 'ส่ง LINE' : 'Send LINE')}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!patientPhone) {
                                                    setNotificationStatus({ type: 'error', message: language === 'TH' ? 'กรุณาระบุเบอร์โทรศัพท์' : 'Please enter phone number' });
                                                    return;
                                                }
                                                setSending(true);
                                                const patient = patients.find(p => p.id === formData.patientId);
                                                const result = await sendAppointmentSMS(patientPhone, {
                                                    patientName: patient?.name || 'คุณลูกค้า',
                                                    appointmentDate: formData.date,
                                                    appointmentTime: formData.time,
                                                    treatment: formData.type,
                                                    doctor: 'ทันตแพทย์ประจำ'
                                                });
                                                setSending(false);
                                                if (result.success) {
                                                    setNotificationStatus({ type: 'success', message: language === 'TH' ? 'ส่ง SMS สำเร็จ!' : 'SMS sent successfully!' });
                                                } else {
                                                    setNotificationStatus({ type: 'error', message: result.error || (language === 'TH' ? 'ส่งไม่สำเร็จ' : 'Failed to send') });
                                                }
                                            }}
                                            disabled={sending}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: '#3B82F6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                cursor: sending ? 'not-allowed' : 'pointer',
                                                opacity: sending ? 0.7 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Smartphone size={16} />
                                            {language === 'TH' ? 'ส่ง SMS' : 'Send SMS'}
                                        </button>
                                    </div>

                                    {/* Status Message */}
                                    {notificationStatus && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            background: notificationStatus.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                                            color: notificationStatus.type === 'success' ? '#166534' : '#DC2626'
                                        }}>
                                            {notificationStatus.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
                                            {notificationStatus.message}
                                        </div>
                                    )}

                                    {/* Preview */}
                                    <div style={{ 
                                        marginTop: '1rem', 
                                        padding: '0.75rem', 
                                        background: 'white', 
                                        borderRadius: '8px',
                                        border: '1px solid #E5E7EB'
                                    }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.5rem' }}>
                                            {language === 'TH' ? 'ตัวอย่างข้อความ LINE:' : 'LINE Message Preview:'}
                                        </p>
                                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
                                            <p style={{ margin: 0, fontWeight: 600 }}>แจ้งเตือนนัดหมาย</p>
                                            <p style={{ margin: '0.25rem 0' }}>คุณ {patients.find(p => p.id === formData.patientId)?.name || 'คุณลูกค้า'}</p>
                                            <p style={{ margin: '0.25rem 0' }}>วันที่: {formData.date} เวลา: {formData.time}</p>
                                            <p style={{ margin: '0.25rem 0' }}>รักษา: {formData.type}</p>
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#22C55E' }}>
                                                [ปุ่ม: ✅ยืนยัน | 📅ขอเลื่อน | ❌ยกเลิก]
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
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
