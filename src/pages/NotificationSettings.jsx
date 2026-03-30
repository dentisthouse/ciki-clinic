import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    Settings, 
    Smartphone, 
    MessageSquare, 
    Clock, 
    Calendar, 
    CheckCircle, 
    AlertCircle, 
    Save, 
    RefreshCw,
    Plus,
    Trash2,
    Edit3,
    Mail,
    Phone,
    Settings2,
    Zap,
    Info,
    Users,
    Play,
    X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import NotificationScheduler from '../components/Notifications/NotificationScheduler';

// Toggle Switch Component
const Toggle = ({ checked, onChange, label, description, icon: Icon }) => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '1rem',
        padding: '1.25rem',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid var(--neutral-100)',
        transition: 'all 0.2s'
    }}>
        <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: checked ? 'var(--primary-50)' : 'var(--neutral-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        }}>
            <Icon size={24} color={checked ? 'var(--primary-600)' : 'var(--neutral-400)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                {label}
            </div>
            {description && (
                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', lineHeight: 1.5 }}>
                    {description}
                </div>
            )}
        </div>
        <button
            onClick={() => onChange(!checked)}
            style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: checked ? 'var(--primary-600)' : 'var(--neutral-300)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0
            }}
        >
            <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: checked ? '27px' : '3px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
        </button>
    </div>
);

// Reminder Chip Component
const ReminderChip = ({ hour, selected, onClick }) => (
    <button
        onClick={onClick}
        style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            border: 'none',
            background: selected ? 'var(--primary-600)' : 'var(--neutral-100)',
            color: selected ? 'white' : 'var(--neutral-600)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }}
    >
        <Clock size={16} />
        {hour} ชม.
    </button>
);

const NotificationSettings = () => {
    const { language } = useLanguage();
    const { appointments, patients } = useData();
    
    const [settings, setSettings] = useState({
        // การแจ้งเตือนอัตโนมัติ
        autoReminders: true,
        reminderHours: [24, 2], // ชั่วโมงก่อนนัด
        confirmations: true,
        
        // ช่องทางการส่ง
        defaultChannels: ['sms'],
        enableLine: true,
        enableEmail: false,
        
        // เวลาทำการ
        workingHours: {
            start: '09:00',
            end: '20:00'
        },
        noWorkingHoursMessage: language === 'TH' ? 
            'ขออภัย อยู่นอกเวลาทำการ จะแจ้งเตือนในเวลาทำการ' : 
            'Sorry, we are outside working hours. We will notify during working hours.',
        
        // ข้อความแบบกำหนดเอง
        customMessages: {
            confirmation: {
                TH: 'แจ้งเตือนนัดหมาย CIKI Clinic\nคุณ {patientName}\nวันที่ {date} เวลา {time}\nรักษา: {treatment}\nทันตแพทย์: {doctor}\nกรุณายืนยันการนัดหมาย',
                EN: 'Appointment Reminder - CIKI Clinic\nDear {patientName}\nDate: {date} Time: {time}\nTreatment: {treatment}\nDentist: {doctor}\nPlease confirm your appointment'
            },
            reminder: {
                TH: 'แจ้งเตือนนัดพรุ่งนี้ - CIKI Clinic\nคุณ {patientName}\nวันพรุ่งนี้ ({date}) เวลา {time}\nรักษา: {treatment}\nรบกวนมาก่อนเวลานัด 15 นาที',
                EN: 'Tomorrow\'s Appointment - CIKI Clinic\nDear {patientName}\nTomorrow ({date}) at {time}\nTreatment: {treatment}\nPlease arrive 15 minutes early'
            },
            cancellation: {
                TH: 'ยกเลิกนัดหมาย - CIKI Clinic\nคุณ {patientName}\nนัดหมายวันที่ {date} เวลา {time}\nถูกยกเลิกเรียบร้อยแล้ว\nกรุณาติดต่อเพื่อนัดหมายใหม่',
                EN: 'Appointment Cancelled - CIKI Clinic\nDear {patientName}\nYour appointment on {date} at {time}\nhas been cancelled.\nPlease contact us to reschedule'
            }
        },
        
        // การจัดการคิว
        queueNotifications: true,
        queueUpdateInterval: 5, // นาที
        
        // การแจ้งเตือนด่วน
        emergencyNotifications: true,
        emergencyContacts: ['0812345678', 'admin@ciki.com']
    });
    
    const [testMode, setTestMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [backendStatus, setBackendStatus] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        loadSettings();
        checkBackendStatus();
    }, []);

    const loadSettings = () => {
        // โหลดการตั้งค่าจาก localStorage
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    };

    const checkBackendStatus = async () => {
        // จำลองการตรวจสอบสถานะ backend
        setBackendStatus(true); // ใน production จะตรวจสอบจริง
    };

    const saveSettings = async () => {
        setIsSaving(true);
        
        try {
            // บันทึกลง localStorage
            localStorage.setItem('notificationSettings', JSON.stringify(settings));
            
            // ใน production จะส่งไปยัง backend
            console.log('Settings saved:', settings);
            
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const updateNestedSetting = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    const addReminderHour = (hour) => {
        if (!settings.reminderHours.includes(hour)) {
            updateSetting('reminderHours', [...settings.reminderHours, hour]);
        }
    };

    const removeReminderHour = (hour) => {
        updateSetting('reminderHours', settings.reminderHours.filter(h => h !== hour));
    };

    const toggleChannel = (channel) => {
        const channels = settings.defaultChannels.includes(channel)
            ? settings.defaultChannels.filter(c => c !== channel)
            : [...settings.defaultChannels, channel];
        updateSetting('defaultChannels', channels);
    };

    const testNotification = async (type) => {
        if (!testMode) return;
        
        // จำลองการส่งข้อความทดสอบ
        console.log(`Testing ${type} notification...`);
        
        // ใน production จะส่งข้อความจริง
        alert(language === 'TH' ? 
            `ส่งข้อความทดสอบ ${type} เรียบร้อยแล้ว (โหมดทดสอบ)` : 
            `Test ${type} notification sent (Demo mode)`);
    };

    const availableHours = [72, 48, 24, 12, 6, 2, 1];

    const tabs = [
        { id: 'general', label: 'ตั้งค่าทั่วไป', icon: Settings2 },
        { id: 'channels', label: 'ช่องทางส่ง', icon: MessageSquare },
        { id: 'messages', label: 'ข้อความ', icon: Edit3 },
        { id: 'advanced', label: 'ขั้นสูง', icon: Zap }
    ];

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Bell size={24} color="white" />
                            </div>
                            ตั้งค่าการแจ้งเตือน
                        </h1>
                        <p style={{ color: 'var(--neutral-500)', fontSize: '1rem' }}>
                            จัดการการแจ้งเตือนและข้อความที่ส่งให้คนไข้
                        </p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        style={{
                            padding: '0.875rem 1.75rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--primary-600)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        {isSaving ? <RefreshCw size={20} className="spin" /> : <Save size={20} />}
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                    </button>
                </div>

                {saveStatus && (
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: saveStatus === 'success' ? '#dcfce7' : '#fee2e2',
                        color: saveStatus === 'success' ? '#166534' : '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: 500
                    }}>
                        {saveStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {saveStatus === 'success' ? 'บันทึกการตั้งค่าสำเร็จ' : 'เกิดข้อผิดพลาด กรุณาลองใหม่'}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '2rem',
                background: 'var(--neutral-100)',
                padding: '0.5rem',
                borderRadius: '14px',
                width: 'fit-content'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: activeTab === tab.id ? 'white' : 'transparent',
                            color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--neutral-500)',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Toggle
                        checked={settings.autoReminders}
                        onChange={(v) => updateSetting('autoReminders', v)}
                        label="แจ้งเตือนนัดหมายอัตโนมัติ"
                        description="ส่งข้อความแจ้งเตือนอัตโนมัติก่อนวันนัดตามเวลาที่กำหนด"
                        icon={Clock}
                    />
                    
                    <Toggle
                        checked={settings.confirmations}
                        onChange={(v) => updateSetting('confirmations', v)}
                        label="ส่งการยืนยันนัดหมาย"
                        description="ส่งข้อความยืนยันเมื่อมีการนัดหมายใหม่"
                        icon={CheckCircle}
                    />
                    
                    <Toggle
                        checked={settings.queueNotifications}
                        onChange={(v) => updateSetting('queueNotifications', v)}
                        label="แจ้งเตือนสถานะคิว"
                        description="แจ้งเตือนเมื่อใกล้ถึงคิวของคนไข้"
                        icon={Users}
                    />

                    {/* Reminder Hours */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid var(--neutral-100)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'var(--primary-50)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Clock size={20} color="var(--primary-600)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>เวลาแจ้งเตือน</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                                    เลือกช่วงเวลาก่อนนัดที่จะส่งการแจ้งเตือน
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {availableHours.map(hour => (
                                <ReminderChip
                                    key={hour}
                                    hour={hour}
                                    selected={settings.reminderHours.includes(hour)}
                                    onClick={() => {
                                        const hours = settings.reminderHours.includes(hour)
                                            ? settings.reminderHours.filter(h => h !== hour)
                                            : [...settings.reminderHours, hour];
                                        updateSetting('reminderHours', hours.sort((a, b) => b - a));
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Channels Tab */}
            {activeTab === 'channels' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div 
                        onClick={() => toggleChannel('sms')}
                        style={{
                            padding: '1.5rem',
                            borderRadius: '16px',
                            border: `2px solid ${settings.defaultChannels.includes('sms') ? '#3b82f6' : 'var(--neutral-200)'}`,
                            background: settings.defaultChannels.includes('sms') ? '#3b82f608' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: settings.defaultChannels.includes('sms') ? '#3b82f6' : 'var(--neutral-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Smartphone size={24} color={settings.defaultChannels.includes('sms') ? 'white' : 'var(--neutral-500)'} />
                            </div>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: `2px solid ${settings.defaultChannels.includes('sms') ? '#3b82f6' : 'var(--neutral-300)'}`,
                                background: settings.defaultChannels.includes('sms') ? '#3b82f6' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {settings.defaultChannels.includes('sms') && <CheckCircle size={16} color="white" />}
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>SMS</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', lineHeight: 1.5 }}>
                            ส่งข้อความ SMS ผ่าน ThaiBulkSMS
                        </div>
                        <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '3.5rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#dcfce7',
                            color: '#166534'
                        }}>แนะนำ</div>
                    </div>

                    <div 
                        onClick={() => toggleChannel('line')}
                        style={{
                            padding: '1.5rem',
                            borderRadius: '16px',
                            border: `2px solid ${settings.defaultChannels.includes('line') ? '#06C755' : 'var(--neutral-200)'}`,
                            background: settings.defaultChannels.includes('line') ? '#06C75508' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: settings.defaultChannels.includes('line') ? '#06C755' : 'var(--neutral-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <MessageSquare size={24} color={settings.defaultChannels.includes('line') ? 'white' : 'var(--neutral-500)'} />
                            </div>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: `2px solid ${settings.defaultChannels.includes('line') ? '#06C755' : 'var(--neutral-300)'}`,
                                background: settings.defaultChannels.includes('line') ? '#06C755' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {settings.defaultChannels.includes('line') && <CheckCircle size={16} color="white" />}
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>LINE</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', lineHeight: 1.5 }}>
                            ส่งข้อความผ่าน LINE Official Account
                        </div>
                        <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '3.5rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#dcfce7',
                            color: '#166534'
                        }}>ฟรี</div>
                    </div>

                    <div 
                        onClick={() => updateSetting('enableEmail', !settings.enableEmail)}
                        style={{
                            padding: '1.5rem',
                            borderRadius: '16px',
                            border: `2px solid ${settings.enableEmail ? '#8b5cf6' : 'var(--neutral-200)'}`,
                            background: settings.enableEmail ? '#8b5cf608' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: settings.enableEmail ? '#8b5cf6' : 'var(--neutral-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Mail size={24} color={settings.enableEmail ? 'white' : 'var(--neutral-500)'} />
                            </div>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: `2px solid ${settings.enableEmail ? '#8b5cf6' : 'var(--neutral-300)'}`,
                                background: settings.enableEmail ? '#8b5cf6' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {settings.enableEmail && <CheckCircle size={16} color="white" />}
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Email</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', lineHeight: 1.5 }}>
                            ส่งอีเมลแจ้งเตือน (ต้องตั้งค่า SMTP)
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(settings.customMessages).map(([type, messages]) => {
                        const config = {
                            confirmation: { title: 'ข้อความยืนยันนัดหมาย', color: '#10b981', icon: CheckCircle },
                            reminder: { title: 'ข้อความแจ้งเตือนก่อนนัด', color: '#3b82f6', icon: Clock },
                            cancellation: { title: 'ข้อความยกเลิกนัด', color: '#ef4444', icon: X }
                        }[type];
                        
                        return (
                            <div key={type} style={{
                                background: 'white',
                                borderRadius: '16px',
                                border: '1px solid var(--neutral-100)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '1.25rem 1.5rem',
                                    background: `${config.color}08`,
                                    borderBottom: '1px solid var(--neutral-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: config.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <config.icon size={20} color="white" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{config.title}</div>
                                    </div>
                                </div>
                                
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                ไทย (TH)
                                            </label>
                                            <textarea
                                                value={messages.TH}
                                                onChange={(e) => updateNestedSetting('customMessages', type, {
                                                    ...messages,
                                                    TH: e.target.value
                                                })}
                                                rows={4}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--neutral-200)',
                                                    fontSize: '0.875rem',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                English (EN)
                                            </label>
                                            <textarea
                                                value={messages.EN}
                                                onChange={(e) => updateNestedSetting('customMessages', type, {
                                                    ...messages,
                                                    EN: e.target.value
                                                })}
                                                rows={4}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--neutral-200)',
                                                    fontSize: '0.875rem',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['{patientName}', '{date}', '{time}', '{treatment}', '{doctor}'].map(variable => (
                                            <span key={variable} style={{
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '6px',
                                                background: 'var(--primary-50)',
                                                color: 'var(--primary-700)',
                                                fontSize: '0.8125rem',
                                                fontFamily: 'monospace',
                                                fontWeight: 600
                                            }}>
                                                {variable}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Toggle
                        checked={settings.emergencyNotifications}
                        onChange={(v) => updateSetting('emergencyNotifications', v)}
                        label="แจ้งเตือนกรณีฉุกเฉิน"
                        description="ส่งการแจ้งเตือนพิเศษสำหรับกรณีฉุกเฉิน เช่น แพทย์ลางานกะทันหัน"
                        icon={AlertCircle}
                    />
                    
                    <div style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid var(--neutral-100)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'var(--warning-50)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Clock size={20} color="var(--warning-600)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>เวลาทำการ</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                                    กำหนดช่วงเวลาที่จะส่งการแจ้งเตือน
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    เริ่ม
                                </label>
                                <input
                                    type="time"
                                    value={settings.workingHours.start}
                                    onChange={(e) => updateNestedSetting('workingHours', 'start', e.target.value)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--neutral-200)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <span style={{ marginTop: '1.5rem', color: 'var(--neutral-400)' }}>ถึง</span>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    สิ้นสุด
                                </label>
                                <input
                                    type="time"
                                    value={settings.workingHours.end}
                                    onChange={(e) => updateNestedSetting('workingHours', 'end', e.target.value)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--neutral-200)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: '1.5rem',
                        background: '#f0f9ff',
                        borderRadius: '16px',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                    }}>
                        <Info size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '0.25rem' }}>
                                หมายเหตุ
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#0c4a6e', lineHeight: 1.6 }}>
                                การตั้งค่าขั้นสูงเหล่านี้จะมีผลกับการแจ้งเตือนทั้งหมดในระบบ 
                                กรุณาตรวจสอบความถูกต้องก่อนบันทึก
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationSettings;
