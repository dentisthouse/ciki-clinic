import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
    MessageSquare, 
    Send, 
    Smartphone, 
    CheckCircle, 
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Bell,
    Calendar,
    Clock,
    User,
    Stethoscope
} from 'lucide-react';

/**
 * AppointmentNotificationPanel - Panel สำหรับส่งข้อความแจ้งเตือนนัดหมาย
 * ใช้ใน Schedule page หรือ Appointment modal
 */
const AppointmentNotificationPanel = ({ 
    appointment, 
    patient,
    onNotificationSent,
    isOpen: defaultOpen = false 
}) => {
    const { 
        sendAppointmentConfirmation, 
        sendReminder,
        sendLineNotification,
        sendSMSOnly,
        isLoading,
        backendStatus 
    } = useNotification();
    const { language } = useLanguage();
    
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [selectedChannels, setSelectedChannels] = useState(['sms']);
    const [lineUserId, setLineUserId] = useState(patient?.lineId || '');
    const [customMessage, setCustomMessage] = useState('');
    const [sentStatus, setSentStatus] = useState(null);
    const [notificationType, setNotificationType] = useState('confirmation'); // confirmation, reminder, custom

    // Reset status when appointment changes
    useEffect(() => {
        setSentStatus(null);
        setLineUserId(patient?.lineId || '');
    }, [appointment, patient]);

    // Check backend status on mount
    useEffect(() => {
        checkBackendStatus();
    }, []);

    const checkBackendStatus = async () => {
        // จะแสดงสถานะจาก context
    };

    const handleSendNotification = async () => {
        setSentStatus(null);
        
        const params = {
            phone: patient?.phone,
            lineUserId: lineUserId || undefined,
            patientName: patient?.name,
            appointmentDate: appointment?.date,
            appointmentTime: appointment?.time,
            treatment: appointment?.treatment || appointment?.procedure,
            doctor: appointment?.dentist || appointment?.doctor,
            appointmentId: appointment?.id,
            channels: selectedChannels
        };

        let result;

        switch (notificationType) {
            case 'confirmation':
                result = await sendAppointmentConfirmation(params);
                break;
            case 'reminder':
                result = await sendReminder(params);
                break;
            case 'line':
                if (!lineUserId) {
                    setSentStatus({ type: 'error', message: 'กรุณาระบุ LINE User ID' });
                    return;
                }
                result = await sendLineNotification({
                    userId: lineUserId,
                    patientName: patient?.name,
                    appointmentDate: appointment?.date,
                    appointmentTime: appointment?.time,
                    treatment: appointment?.treatment || appointment?.procedure,
                    doctor: appointment?.dentist || appointment?.doctor,
                    appointmentId: appointment?.id
                });
                break;
            case 'custom':
                if (!customMessage.trim()) {
                    setSentStatus({ type: 'error', message: 'กรุณากรอกข้อความ' });
                    return;
                }
                result = await sendSMSOnly(patient?.phone, customMessage, 'CIKI');
                break;
            default:
                result = await sendAppointmentConfirmation(params);
        }

        if (result.success) {
            setSentStatus({ 
                type: 'success', 
                message: language === 'TH' ? 'ส่งข้อความสำเร็จ' : 'Message sent successfully'
            });
            if (onNotificationSent) {
                onNotificationSent(result);
            }
        } else {
            setSentStatus({ 
                type: 'error', 
                message: result.error || (language === 'TH' ? 'ส่งข้อความไม่สำเร็จ' : 'Failed to send message')
            });
        }

        // Clear status after 3 seconds
        setTimeout(() => setSentStatus(null), 3000);
    };

    const toggleChannel = (channel) => {
        setSelectedChannels(prev => 
            prev.includes(channel)
                ? prev.filter(c => c !== channel)
                : [...prev, channel]
        );
    };

    // Preview message based on type
    const getPreviewMessage = () => {
        switch (notificationType) {
            case 'confirmation':
                return `แจ้งเตือนนัดหมาย CIKI Clinic
คุณ ${patient?.name}
วันที่ ${appointment?.date} เวลา ${appointment?.time}
รักษา: ${appointment?.treatment || appointment?.procedure}
ทันตแพทย์: ${appointment?.dentist || appointment?.doctor}
กรุณายืนยันการนัดหมาย`;
            case 'reminder':
                return `แจ้งเตือนนัดพรุ่งนี้ - CIKI Clinic
คุณ ${patient?.name}
วันพรุ่งนี้ (${appointment?.date}) เวลา ${appointment?.time}
รักษา: ${appointment?.treatment || appointment?.procedure}
รบกวนมาก่อนเวลานัด 15 นาที`;
            case 'custom':
                return customMessage || '(กรุณากรอกข้อความ)';
            default:
                return '';
        }
    };

    if (!appointment || !patient) {
        return null;
    }

    return (
        <div className="notification-panel" style={{ 
            background: 'var(--neutral-50)', 
            borderRadius: '12px',
            border: '1px solid var(--neutral-200)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--neutral-700)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={18} style={{ color: 'var(--primary-600)' }} />
                    <span>
                        {language === 'TH' ? 'ส่งข้อความแจ้งเตือน' : 'Send Notification'}
                    </span>
                    {!backendStatus && (
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            background: '#fef3c7',
                            color: '#d97706',
                            borderRadius: '4px',
                            fontWeight: 500
                        }}>
                            {language === 'TH' ? 'โหมดทดสอบ' : 'Demo Mode'}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Content */}
            {isOpen && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    {/* Notification Type */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '0.875rem', 
                            fontWeight: 500, 
                            color: 'var(--neutral-600)',
                            marginBottom: '0.5rem'
                        }}>
                            {language === 'TH' ? 'ประเภทข้อความ' : 'Message Type'}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { id: 'confirmation', label: language === 'TH' ? 'ยืนยันนัด' : 'Confirmation', icon: CheckCircle },
                                { id: 'reminder', label: language === 'TH' ? 'แจ้งเตือนล่วงหน้า' : 'Reminder', icon: Bell },
                                { id: 'line', label: 'LINE', icon: MessageSquare },
                                { id: 'custom', label: language === 'TH' ? 'ข้อความเอง' : 'Custom', icon: Send }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setNotificationType(type.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: notificationType === type.id ? 'var(--primary-600)' : 'var(--neutral-200)',
                                        background: notificationType === type.id ? 'var(--primary-50)' : 'white',
                                        color: notificationType === type.id ? 'var(--primary-700)' : 'var(--neutral-600)',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        fontWeight: notificationType === type.id ? 600 : 400
                                    }}
                                >
                                    <type.icon size={16} />
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LINE User ID (for LINE notifications) */}
                    {notificationType === 'line' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ 
                                display: 'block', 
                                fontSize: '0.875rem', 
                                fontWeight: 500, 
                                color: 'var(--neutral-600)',
                                marginBottom: '0.5rem'
                            }}>
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
                                    border: '1px solid var(--neutral-200)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    )}

                    {/* Custom Message Input */}
                    {notificationType === 'custom' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ 
                                display: 'block', 
                                fontSize: '0.875rem', 
                                fontWeight: 500, 
                                color: 'var(--neutral-600)',
                                marginBottom: '0.5rem'
                            }}>
                                {language === 'TH' ? 'ข้อความ' : 'Message'}
                            </label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={3}
                                placeholder={language === 'TH' ? 'พิมพ์ข้อความที่ต้องการส่ง...' : 'Type your message...'}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--neutral-200)',
                                    fontSize: '0.875rem',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    )}

                    {/* Channel Selection (for SMS/Line) */}
                    {notificationType !== 'line' && notificationType !== 'custom' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ 
                                display: 'block', 
                                fontSize: '0.875rem', 
                                fontWeight: 500, 
                                color: 'var(--neutral-600)',
                                marginBottom: '0.5rem'
                            }}>
                                {language === 'TH' ? 'ช่องทางการส่ง' : 'Send Channels'}
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <label style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    background: selectedChannels.includes('sms') ? 'var(--primary-50)' : 'white',
                                    border: `1px solid ${selectedChannels.includes('sms') ? 'var(--primary-300)' : 'var(--neutral-200)'}`
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedChannels.includes('sms')}
                                        onChange={() => toggleChannel('sms')}
                                        style={{ accentColor: 'var(--primary-600)' }}
                                    />
                                    <Smartphone size={16} style={{ color: 'var(--neutral-600)' }} />
                                    <span style={{ fontSize: '0.875rem' }}>SMS</span>
                                </label>
                                
                                <label style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    background: selectedChannels.includes('line') ? 'var(--primary-50)' : 'white',
                                    border: `1px solid ${selectedChannels.includes('line') ? 'var(--primary-300)' : 'var(--neutral-200)'}`
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedChannels.includes('line')}
                                        onChange={() => toggleChannel('line')}
                                        style={{ accentColor: 'var(--primary-600)' }}
                                    />
                                    <MessageSquare size={16} style={{ color: '#06C755' }} />
                                    <span style={{ fontSize: '0.875rem' }}>LINE</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Message Preview */}
                    <div style={{ 
                        background: 'white', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        border: '1px solid var(--neutral-200)'
                    }}>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            color: 'var(--neutral-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                        }}>
                            {language === 'TH' ? 'ตัวอย่างข้อความ' : 'Message Preview'}
                        </label>
                        <pre style={{ 
                            margin: 0, 
                            fontSize: '0.875rem', 
                            color: 'var(--neutral-700)',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'inherit',
                            lineHeight: 1.5
                        }}>
                            {getPreviewMessage()}
                        </pre>
                    </div>

                    {/* Recipient Info */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        color: 'var(--neutral-600)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={14} />
                            <span>{patient?.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={14} />
                            <span>{appointment?.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={14} />
                            <span>{appointment?.time}</span>
                        </div>
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSendNotification}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: isLoading ? 'var(--neutral-300)' : 'var(--primary-600)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {language === 'TH' ? 'กำลังส่ง...' : 'Sending...'}
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                {language === 'TH' ? 'ส่งข้อความ' : 'Send Message'}
                            </>
                        )}
                    </button>

                    {/* Status Message */}
                    {sentStatus && (
                        <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            background: sentStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                            color: sentStatus.type === 'success' ? '#059669' : '#dc2626'
                        }}>
                            {sentStatus.type === 'success' ? (
                                <CheckCircle size={18} />
                            ) : (
                                <AlertCircle size={18} />
                            )}
                            {sentStatus.message}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppointmentNotificationPanel;
