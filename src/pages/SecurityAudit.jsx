import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    Eye, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    Users, 
    Search, 
    Filter, 
    Download, 
    RefreshCw,
    Lock,
    Unlock,
    Key,
    Database,
    Activity,
    FileText,
    Settings,
    Calendar,
    MapPin,
    Monitor,
    Smartphone,
    Mail,
    AlertCircle,
    Info,
    Ban,
    UserCheck,
    UserX,
    LogIn,
    LogOut
} from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const SecurityAudit = () => {
    const { language } = useLanguage();
    const { isAdmin } = useAuth();
    
    const [activeTab, setActiveTab] = useState('activity'); // activity, access, security, settings
    const [auditLogs, setAuditLogs] = useState([]);
    const [securityEvents, setSecurityEvents] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);
    const [selectedTimeRange, setSelectedTimeRange] = useState('24h'); // 1h, 24h, 7d, 30d, custom
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // จำลองข้อมูล Activity Logs
    const [mockActivityLogs] = useState([
        {
            id: 1,
            timestamp: new Date(),
            user: 'หมออ้อม',
            email: 'aom@dental.com',
            action: 'login',
            module: 'authentication',
            details: 'เข้าสู่ระบบจาก IP 192.168.1.100',
            ip: '192.168.1.100',
            device: 'Chrome on Windows',
            status: 'success',
            severity: 'low'
        },
        {
            id: 2,
            timestamp: subDays(new Date(), 1),
            user: 'สมศรี ใจดี',
            email: 'somsri@ciki.com',
            action: 'view_patient',
            module: 'patients',
            details: 'ดูข้อมูลผู้ป่วย ID: P00123',
            patientId: 'P00123',
            status: 'success',
            severity: 'low'
        },
        {
            id: 3,
            timestamp: subDays(new Date(), 2),
            user: 'หมอบิ๊ก',
            email: 'big@dental.com',
            action: 'delete_patient',
            module: 'patients',
            details: 'ลบข้อมูลผู้ป่วย ID: P00456',
            patientId: 'P00456',
            status: 'success',
            severity: 'medium'
        },
        {
            id: 4,
            timestamp: subDays(new Date(), 3),
            user: 'มานี รักงาน',
            email: 'manee@ciki.com',
            action: 'failed_login',
            module: 'authentication',
            details: 'พยายามผิด 3 ครั้ง',
            ip: '192.168.1.105',
            device: 'Mobile App on iOS',
            status: 'failed',
            severity: 'high'
        },
        {
            id: 5,
            timestamp: subDays(new Date(), 5),
            user: 'ระบบอัตโนมัติ',
            email: 'system@ciki.com',
            action: 'backup_completed',
            module: 'system',
            details: 'สำรองข้อมูลอัตโนมัติสำเร็จ',
            status: 'success',
            severity: 'low'
        }
    ]);

    // จำลองข้อมูล Security Events
    const [mockSecurityEvents] = useState([
        {
            id: 1,
            timestamp: subHours(new Date(), 2),
            type: 'suspicious_login',
            severity: 'high',
            title: 'การเข้าสู่ระบบนอกเวลาทำการ',
            description: 'พยายาพยายามพยายามพยายามเข้าสู่ระบบเวลา 02:30 น.',
            user: 'ไม่ทราบ',
            ip: '203.150.10.45',
            location: 'ประเทศออสเตรเลีย',
            status: 'blocked',
            actions: ['block_ip', 'notify_admin']
        },
        {
            id: 2,
            timestamp: subDays(new Date(), 1),
            type: 'multiple_failed_attempts',
            severity: 'medium',
            title: 'พยายามผิดหลายครั้ง',
            description: 'พยายามผิด 5 ครั้งจาก IP เดียวก',
            user: 'ไม่ทราบ',
            ip: '192.168.1.200',
            location: 'Network Internal',
            status: 'blocked',
            actions: ['temporary_block', 'notify_admin']
        },
        {
            id: 3,
            timestamp: subDays(new Date(), 3),
            type: 'privilege_escalation',
            severity: 'high',
            title: 'พยายามพยายามพยายามพยายามสิทธิ์พิเศษเกินกำหนด',
            description: 'ผู้ใช้พยายามพยายามพยายามพยายามพยายามเข้าถึงการตั้งค่าที่ไม่ได้รับอนุญาต',
            user: 'สมศรี ใจดี',
            ip: '192.168.1.105',
            location: 'Network Internal',
            status: 'alert',
            actions: ['notify_admin', 'log_violation']
        },
        {
            id: 4,
            timestamp: subDays(new Date(), 7),
            type: 'data_export',
            severity: 'medium',
            title: 'การส่งออกข้อมูลจำนวนมาก',
            description: 'ผู้ใช้ส่งออกข้อมูลผู้ป่วย 500 รายการใน 1 นาที',
            user: 'หมอต้อง',
            ip: '192.168.1.101',
            location: 'Network Internal',
            status: 'alert',
            actions: ['notify_admin', 'require_approval']
        }
    ]);

    // จำลองข้อมูล Access Logs
    const [mockAccessLogs] = useState([
        {
            id: 1,
            timestamp: new Date(),
            user: 'หมออ้อม',
            resource: '/patients',
            action: 'read',
            result: 'success',
            duration: 1200,
            ip: '192.168.1.100'
        },
        {
            id: 2,
            timestamp: subHours(new Date(), 1),
            user: 'สมศรี ใจดี',
            resource: '/billing',
            action: 'create',
            result: 'success',
            duration: 2500,
            ip: '192.168.1.105'
        },
        {
            id: 3,
            timestamp: subHours(new Date(), 3),
            user: 'หมอบิ๊ก',
            resource: '/reports',
            action: 'read',
            result: 'denied',
            duration: 0,
            ip: '192.168.1.101',
            reason: 'insufficient_permissions'
        }
    ]);

    useEffect(() => {
        loadAuditData();
    }, [selectedTimeRange, searchTerm]);

    const loadAuditData = () => {
        setIsLoading(true);
        
        // จำลองการโหลดข้อมูล
        setTimeout(() => {
            let filteredLogs = mockActivityLogs;
            let filteredSecurity = mockSecurityEvents;
            let filteredAccess = mockAccessLogs;
            
            // กรองตามช่วงเวลา
            const now = new Date();
            let startTime;
            
            switch (selectedTimeRange) {
                case '1h':
                    startTime = subHours(now, 1);
                    break;
                case '24h':
                    startTime = subDays(now, 1);
                    break;
                case '7d':
                    startTime = subDays(now, 7);
                    break;
                case '30d':
                    startTime = subDays(now, 30);
                    break;
                default:
                    startTime = subDays(now, 1);
            }
            
            filteredLogs = filteredLogs.filter(log => log.timestamp >= startTime);
            filteredSecurity = filteredSecurity.filter(event => event.timestamp >= startTime);
            filteredAccess = filteredAccess.filter(log => log.timestamp >= startTime);
            
            // กรองตามคำค้นหา
            if (searchTerm) {
                filteredLogs = filteredLogs.filter(log => 
                    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.details.toLowerCase().includes(searchTerm.toLowerCase())
                );
                filteredSecurity = filteredSecurity.filter(event => 
                    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.description.toLowerCase().includes(searchTerm.toLowerCase())
                );
                filteredAccess = filteredAccess.filter(log => 
                    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            setAuditLogs(filteredLogs);
            setSecurityEvents(filteredSecurity);
            setAccessLogs(filteredAccess);
            setIsLoading(false);
        }, 500);
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <CheckCircle size={16} color="#10b981" />;
            case 'failed': return <AlertCircle size={16} color="#ef4444" />;
            case 'blocked': return <Ban size={16} color="#ef4444" />;
            case 'alert': return <AlertTriangle size={16} color="#f59e0b" />;
            case 'denied': return <UserX size={16} color="#ef4444" />;
            default: return <Info size={16} color="#6b7280" />;
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'login': return <LogIn size={16} />;
            case 'logout': return <LogOut size={16} />;
            case 'view_patient': return <Users size={16} />;
            case 'delete_patient': return <Ban size={16} />;
            case 'failed_login': return <Lock size={16} />;
            case 'backup_completed': return <Database size={16} />;
            case 'create': return <Plus size={16} />;
            case 'read': return <Eye size={16} />;
            default: return <Activity size={16} />;
        }
    };

    const exportLogs = (format) => {
        // จำลองการส่งออก logs
        const data = {
            activityLogs: auditLogs,
            securityEvents: securityEvents,
            accessLogs: accessLogs,
            exportedAt: new Date().toISOString(),
            exportedBy: 'Current User',
            timeRange: selectedTimeRange
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-audit-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const blockIP = (ip) => {
        if (confirm(`${language === 'TH' ? 'บล็อก IP' : 'Block IP'} ${ip}?`)) {
            console.log(`Blocking IP: ${ip}`);
            // ใน production จะเรียก API
        }
    };

    const EventDetailModal = ({ event, onClose }) => {
        if (!event) return null;
        
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={20} color={getSeverityColor(event.severity)} />
                            {event.title}
                        </h3>
                        <button 
                            onClick={onClose}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                fontSize: '1.5rem', 
                                cursor: 'pointer',
                                color: 'var(--neutral-500)'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {language === 'TH' ? 'เวลาเกิดเหตุการณ์' : 'Timestamp'}
                            </label>
                            <div>{format(event.timestamp, 'dd/MM/yyyy HH:mm:ss')}</div>
                        </div>
                        
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {language === 'TH' ? 'ประเภท' : 'Type'}
                            </label>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                background: `${getSeverityColor(event.severity)}20`,
                                color: getSeverityColor(event.severity)
                            }}>
                                {event.type}
                            </span>
                        </div>
                        
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {language === 'TH' ? 'รายละเอียด' : 'Description'}
                            </label>
                            <p>{event.description}</p>
                        </div>
                        
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {language === 'TH' ? 'ผู้ใช้' : 'User'}
                            </label>
                            <div>{event.user}</div>
                        </div>
                        
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {language === 'TH' ? 'ที่อยู่ IP' : 'IP Address'}
                            </label>
                            <div>{event.ip}</div>
                        </div>
                        
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {language === 'TH' ? 'สถานที่' : 'Location'}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} color="var(--neutral-500)" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                        
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {language === 'TH' ? 'สถานะ' : 'Status'}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {getStatusIcon(event.status)}
                                <span>{event.status}</span>
                            </div>
                        </div>
                        
                        <div>
                            <label style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                {language === 'TH' ? 'การกระทำ' : 'Actions Taken'}
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {event.actions?.map((action, index) => (
                                    <span key={index} style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        background: '#f3f4f6',
                                        color: '#6b7280'
                                    }}>
                                        {action}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!isAdmin) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Shield size={48} color="var(--neutral-400)" />
                <h2 style={{ marginTop: '1rem' }}>
                    {language === 'TH' ? 'เข้าถึงไม่ได้' : 'Access Denied'}
                </h2>
                <p style={{ color: 'var(--neutral-600)' }}>
                    {language === 'TH' ? 'หน้านี้สำหรับ Owner/Admin เท่านั้น' : 'This page is for Owner/Admin only'}
                </p>
            </div>
        );
    }

    return (
        <div className="security-audit" style={{ padding: '2rem' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={32} color="var(--primary-600)" />
                        {language === 'TH' ? 'ตรวจสอบความปลอดภัย' : 'Security Audit'}
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                            style={{ 
                                padding: '0.75rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--neutral-200)',
                                background: 'white'
                            }}
                        >
                            <option value="1h">{language === 'TH' ? '1 ชั่วโมง' : 'Last Hour'}</option>
                            <option value="24h">{language === 'TH' ? '24 ชั่วโมง' : 'Last 24 Hours'}</option>
                            <option value="7d">{language === 'TH' ? '7 วัน' : 'Last 7 Days'}</option>
                            <option value="30d">{language === 'TH' ? '30 วัน' : 'Last 30 Days'}</option>
                        </select>
                        
                        <div className="search-wrapper" style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                            <input
                                type="text"
                                placeholder={language === 'TH' ? 'ค้นหากิจกรรม...' : 'Search activities...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '250px',
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    border: '1px solid var(--neutral-200)',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                        
                        <button 
                            onClick={loadAuditData}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCw size={18} />
                            {language === 'TH' ? 'รีเฟรช' : 'Refresh'}
                        </button>
                        
                        <button 
                            onClick={() => exportLogs('json')}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={18} />
                            {language === 'TH' ? 'ส่งออก' : 'Export'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
                    {[
                        { id: 'activity', label: { TH: 'กิจกรรม', EN: 'Activity Log' } },
                        { id: 'security', label: { TH: 'เหตุการณ์ความปลอดภัย', EN: 'Security Events' } },
                        { id: 'access', label: { TH: 'การเข้าถึง', EN: 'Access Control' } },
                        { id: 'settings', label: { TH: 'ตั้งค่าความปลอดภัย', EN: 'Security Settings' } }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--neutral-600)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {tab.label[language]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Log Tab */}
            {activeTab === 'activity' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'บันทึกกิจกรรม' : 'Activity Log'}
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#f3f4f6',
                            color: '#6b7280'
                        }}>
                            {auditLogs.length}
                        </span>
                    </h3>
                    
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="spinner" />
                            <p style={{ marginTop: '1rem' }}>
                                {language === 'TH' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--neutral-50)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'เวลา' : 'Time'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'ผู้ใช้' : 'User'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'การกระทำ' : 'Action'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'รายละเอียด' : 'Details'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'IP' : 'IP Address'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                            {language === 'TH' ? 'สถานะ' : 'Status'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {format(log.timestamp, 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{log.user}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                                                        {log.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {getActionIcon(log.action)}
                                                    <span>{log.action.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {log.details}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {log.ip}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {getStatusIcon(log.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Security Events Tab */}
            {activeTab === 'security' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'เหตุการณ์ความปลอดภัย' : 'Security Events'}
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#fef2f2',
                            color: '#ef4444'
                        }}>
                            {securityEvents.filter(e => e.severity === 'high').length}
                        </span>
                    </h3>
                    
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="spinner" />
                            <p style={{ marginTop: '1rem' }}>
                                {language === 'TH' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {securityEvents.map(event => (
                                <div key={event.id} style={{
                                    padding: '1.5rem',
                                    border: `1px solid ${getSeverityColor(event.severity)}20`,
                                    borderRadius: '12px',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setSelectedEvent(event)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = getSeverityColor(event.severity);
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = `${getSeverityColor(event.severity)}20`;
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <AlertTriangle size={16} color={getSeverityColor(event.severity)} />
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{event.title}</h4>
                                            </div>
                                            <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                                {event.description}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: `${getSeverityColor(event.severity)}10`,
                                                color: getSeverityColor(event.severity)
                                            }}>
                                                {event.severity}
                                            </span>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: event.status === 'blocked' ? '#fee2e2' : '#dcfce7',
                                                color: event.status === 'blocked' ? '#dc2626' : '#16a34a'
                                            }}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <Clock size={14} />
                                            <span>{format(event.timestamp, 'dd/MM/yyyy HH:mm')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <Users size={14} />
                                            <span>{event.user}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Monitor size={14} />
                                            <span>{event.ip}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {selectedEvent && (
                        <EventDetailModal 
                            event={selectedEvent} 
                            onClose={() => setSelectedEvent(null)} 
                        />
                    )}
                </div>
            )}

            {/* Access Control Tab */}
            {activeTab === 'access' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Key size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'การควบคุมการเข้าถึง' : 'Access Control'}
                    </h3>
                    
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="spinner" />
                            <p style={{ marginTop: '1rem' }}>
                                {language === 'TH' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--neutral-50)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'เวลา' : 'Time'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'ผู้ใช้' : 'User'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'ทรัพพัย์' : 'Resource'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'การกระทำ' : 'Action'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'ผลลัพธ์' : 'Result'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                            {language === 'TH' ? 'ระยะเวลา' : 'Duration'}
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                            {language === 'TH' ? 'IP' : 'IP Address'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accessLogs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {format(log.timestamp, 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>
                                                {log.user}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {log.resource}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {getActionIcon(log.action)}
                                                    <span>{log.action}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {getStatusIcon(log.result)}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {log.duration}ms
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {log.ip}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Security Settings Tab */}
            {activeTab === 'settings' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ตั้งค่าความปลอดภัย' : 'Security Settings'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                {language === 'TH' ? 'นโยบายการเข้าสู่ระบบ' : 'Login Policies'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'บังคับ Two-Factor Authentication' : 'Enable 2FA'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'บังคับการล็อกอัตโนมัติหลัง 3 ครั้งผิด' : 'Lock after 3 failed attempts'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'บังคับการตรวจสอบ IP' : 'Enable IP verification'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'บังคับ Session Timeout (30 นาที)' : 'Session timeout (30 min)'}</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                <Database size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                {language === 'TH' ? 'การบันทึกและตรวจสอบ' : 'Logging & Monitoring'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'บันทึก Activity Log ทั้งหมด' : 'Log all activities'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'แจ้งเตือนเหตุการณ์ความปลอดภัยทันที' : 'Real-time security alerts'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'สำรองข้อมูลอัตโนมัติทุกวัน' : 'Daily automatic backup'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'เก็บ logs ไว้ 90 วัน' : 'Retain logs for 90 days'}</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                <Smartphone size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                {language === 'TH' ? 'การเข้าถึงจากอุปกรณ์' : 'Mobile Access'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'อนุญาติการใช้งานบนมือถือ' : 'Require device authorization'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'จำกัดอุปกรณ์ต่อผู้ใช้ (3 เครื่อง)' : 'Limit devices per user (3 devices)'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'รีเซ็ตการเข้าสู่ระบบจากระยะทาง' : 'Remote wipe capability'}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityAudit;
