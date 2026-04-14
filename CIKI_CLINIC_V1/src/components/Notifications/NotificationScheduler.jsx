import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Settings, Send, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { sendAppointmentNotification, sendAppointmentReminder, checkBackendStatus } from '../../services/notificationService';

const NotificationScheduler = () => {
    const { language } = useLanguage();
    const { appointments, patients } = useData();
    
    const [scheduledNotifications, setScheduledNotifications] = useState([]);
    const [settings, setSettings] = useState({
        reminderHours: [24, 2], // 24 ชั่วโมง และ 2 ชั่วโมงก่อนนัด
        autoConfirm: true,
        channels: ['sms', 'line'],
        workingHours: { start: '09:00', end: '20:00' }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState(false);
    const [testMode, setTestMode] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    useEffect(() => {
        checkBackendConnection();
        loadScheduledNotifications();
    }, []);

    const checkBackendConnection = async () => {
        const status = await checkBackendStatus();
        setBackendStatus(status);
    };

    const loadScheduledNotifications = () => {
        // โหลดการแจ้งเตือนที่ตั้งเวลาไว้
        const scheduled = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
        setScheduledNotifications(scheduled);
    };

    const scheduleReminder = async (appointment, hoursBefore) => {
        const patient = patients.find(p => p.id === appointment.patientId);
        if (!patient) return;

        const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
        const reminderTime = new Date(appointmentDateTime.getTime() - hoursBefore * 60 * 60 * 1000);
        
        const notification = {
            id: `${appointment.id}-${hoursBefore}h`,
            appointmentId: appointment.id,
            patientId: patient.id,
            patientName: patient.name,
            phone: patient.phone,
            lineUserId: patient.lineUserId,
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            treatment: appointment.procedure || appointment.treatment,
            doctor: appointment.dentist,
            reminderTime: reminderTime.toISOString(),
            hoursBefore,
            type: 'reminder',
            status: reminderTime > new Date() ? 'pending' : 'expired',
            channels: settings.channels,
            createdAt: new Date().toISOString()
        };

        // บันทึกลง localStorage (ใน production ควรใช้ database)
        const updated = [...scheduledNotifications.filter(n => n.id !== notification.id), notification];
        setScheduledNotifications(updated);
        localStorage.setItem('scheduledNotifications', JSON.stringify(updated));

        // ถ้าเป็น demo mode ให้แสดงผลลัพธ์ทันที
        if (testMode) {
            await sendTestNotification(notification);
        }
    };

    const sendTestNotification = async (notification) => {
        setIsLoading(true);
        try {
            const result = await sendAppointmentReminder(notification.phone, {
                patientName: notification.patientName,
                appointmentDate: notification.appointmentDate,
                appointmentTime: notification.appointmentTime,
                treatment: notification.treatment
            });

            console.log('Test notification sent:', result);
        } catch (error) {
            console.error('Error sending test notification:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const scheduleAllReminders = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        const upcomingAppointments = appointments.filter(apt => {
            const aptDate = new Date(`${apt.date} ${apt.time}`);
            return aptDate > new Date() && aptDate <= tomorrow;
        });

        upcomingAppointments.forEach(appointment => {
            settings.reminderHours.forEach(hours => {
                scheduleReminder(appointment, hours);
            });
        });
    };

    const sendImmediateConfirmation = async (appointment) => {
        const patient = patients.find(p => p.id === appointment.patientId);
        if (!patient) return;

        setIsLoading(true);
        try {
            const result = await sendAppointmentNotification({
                phone: patient.phone,
                lineUserId: patient.lineUserId,
                patientName: patient.name,
                appointmentDate: appointment.date,
                appointmentTime: appointment.time,
                treatment: appointment.procedure || appointment.treatment,
                doctor: appointment.dentist,
                appointmentId: appointment.id,
                channels: settings.channels
            });

            if (result.success) {
                // อัพเดตสถานะ
                const updated = scheduledNotifications.map(n => 
                    n.appointmentId === appointment.id 
                        ? { ...n, status: 'sent', sentAt: new Date().toISOString() }
                        : n
                );
                setScheduledNotifications(updated);
                localStorage.setItem('scheduledNotifications', JSON.stringify(updated));
            }
        } catch (error) {
            console.error('Error sending confirmation:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteScheduledNotification = (notificationId) => {
        const updated = scheduledNotifications.filter(n => n.id !== notificationId);
        setScheduledNotifications(updated);
        localStorage.setItem('scheduledNotifications', JSON.stringify(updated));
    };

    const getUpcomingNotifications = () => {
        return scheduledNotifications
            .filter(n => n.status === 'pending' && new Date(n.reminderTime) > new Date())
            .sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime))
            .slice(0, 10);
    };

    return (
        <div className="notification-scheduler" style={{ padding: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Bell size={28} color="var(--primary-600)" />
                        {language === 'TH' ? 'ตั้งค่าการแจ้งเตือนอัตโนมัติ' : 'Automatic Notification Settings'}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: backendStatus ? '#10b981' : '#ef4444'
                            }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                {backendStatus ? 
                                    (language === 'TH' ? 'เชื่อมต่อแล้ว' : 'Connected') : 
                                    (language === 'TH' ? 'โหมดทดสอบ' : 'Demo Mode')
                                }
                            </span>
                        </div>
                        <button onClick={checkBackendConnection} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                {/* Settings */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {language === 'TH' ? 'แจ้งเตือนก่อนนัด (ชั่วโมง)' : 'Remind Before (hours)'}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[24, 2, 1].map(hours => (
                                <button
                                    key={hours}
                                    onClick={() => setSettings(prev => ({
                                        ...prev,
                                        reminderHours: prev.reminderHours.includes(hours)
                                            ? prev.reminderHours.filter(h => h !== hours)
                                            : [...prev.reminderHours, hours]
                                    }))}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: settings.reminderHours.includes(hours) ? 'var(--primary-600)' : 'var(--neutral-200)',
                                        background: settings.reminderHours.includes(hours) ? 'var(--primary-50)' : 'white',
                                        color: settings.reminderHours.includes(hours) ? 'var(--primary-700)' : 'var(--neutral-600)'
                                    }}
                                >
                                    {hours}h
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {language === 'TH' ? 'ช่องทางการส่ง' : 'Send Channels'}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['sms', 'line'].map(channel => (
                                <label key={channel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.channels.includes(channel)}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            channels: e.target.checked 
                                                ? [...prev.channels, channel]
                                                : prev.channels.filter(c => c !== channel)
                                        }))}
                                    />
                                    <span style={{ textTransform: 'uppercase' }}>{channel}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {language === 'TH' ? 'ทดสอบ' : 'Test Mode'}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={testMode}
                                onChange={(e) => setTestMode(e.target.checked)}
                            />
                            <span>{language === 'TH' ? 'ส่งข้อความทดสอบทันที' : 'Send test messages immediately'}</span>
                        </label>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={scheduleAllReminders}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Clock size={18} />
                        {language === 'TH' ? 'ตั้งเวลาแจ้งเตือนทั้งหมด' : 'Schedule All Reminders'}
                    </button>
                </div>
            </div>

            {/* Upcoming Notifications */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} />
                    {language === 'TH' ? 'การแจ้งเตือนที่จะเกิดขึ้น' : 'Upcoming Notifications'}
                </h3>

                {getUpcomingNotifications().length === 0 ? (
                    <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: '2rem' }}>
                        {language === 'TH' ? 'ไม่มีการแจ้งเตือนที่ตั้งเวลาไว้' : 'No scheduled notifications'}
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {getUpcomingNotifications().map(notification => (
                            <div key={notification.id} style={{
                                padding: '1rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                background: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {notification.patientName} - {notification.treatment}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                        {language === 'TH' ? 'แจ้งเตือน' : 'Remind'} {notification.hoursBefore}h 
                                        {language === 'TH' ? ' ก่อนนัด' : ' before appointment'} • 
                                        {new Date(notification.reminderTime).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => sendImmediateNotification(notification)}
                                        className="btn btn-primary"
                                        style={{ padding: '0.5rem' }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                    <button
                                        onClick={() => deleteScheduledNotification(notification.id)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationScheduler;
