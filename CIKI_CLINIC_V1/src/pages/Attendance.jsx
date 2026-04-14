import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import {
    Clock, MapPin, CheckCircle, AlertTriangle, User,
    Shield, Timer, Settings, ChevronDown,
    ChevronLeft, ChevronRight, BarChart3, QrCode, Monitor,
    Smartphone, Fingerprint, Trash2, ShieldCheck, ShieldAlert,
    DollarSign, List
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../styles/attendance.css';

// ==========================================
// CONFIG & HELPERS
// ==========================================
const CLINIC_CONFIG = {
    lat: 13.7563,
    lng: 100.5018,
    radiusMeters: 200,
};

const WORK_SCHEDULE = {
    startTime: '09:00',
    endTime: '17:00',
    lateGraceMinutes: 15,
};

const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatMinutes = (mins) => {
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    if (h > 0 && m > 0) return `${h} ชม. ${m} นาที`;
    if (h > 0) return `${h} ชม.`;
    return `${m} นาที`;
};

// ==========================================
// MONTHLY SUMMARY COMPONENT
// ==========================================
const MonthlySummary = ({ attendanceRecords, staff, language }) => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [payrollMode, setPayrollMode] = useState(false);
    const [rates, setRates] = useState({
        otHourly: 150,
        lateFine: 50,
        dailyRate: 500
    });

    const goMonth = (delta) => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const monthLabel = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' });
    }, [selectedMonth, language]);

    const staffSummary = useMemo(() => {
        const map = {};
        const [y, m] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        const today = new Date();
        today.setHours(0,0,0,0);

        const currentRecords = (attendanceRecords || []).filter(r => {
            const rd = new Date(r.timestamp);
            return rd.getFullYear() === y && rd.getMonth() + 1 === m;
        });

        (staff || []).forEach(s => {
            if (s.status !== 'active') return;
            
            let expectedUpToDate = 0;
            const staffOffDays = s.offDays || [0, 6]; 

            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(y, m - 1, i);
                date.setHours(0,0,0,0);
                if (!staffOffDays.includes(date.getDay())) { 
                    if (date <= today || (y < today.getFullYear() || (y === today.getFullYear() && m <= today.getMonth()))) {
                        expectedUpToDate++;
                    }
                }
            }

            map[s.id] = { 
                name: s.name, 
                role: s.role, 
                salary: s.salary || 0,
                expectedUpToDate,
                daysPresent: 0, 
                lateDays: 0, 
                otMinutes: 0,
                dailyDetails: {} 
            };
        });

        currentRecords.forEach(r => {
            if (!map[r.staffId]) return;
            const dateKey = new Date(r.timestamp).toISOString().split('T')[0];
            if (!map[r.staffId].dailyDetails[dateKey]) map[r.staffId].dailyDetails[dateKey] = { counted: false };
            
            if (r.type === 'check-in' || r.type === 'IN') {
                if (!map[r.staffId].dailyDetails[dateKey].counted) {
                    map[r.staffId].daysPresent++;
                    map[r.staffId].dailyDetails[dateKey].counted = true;
                }
                if (r.isLate || r.lateStatus === 'late') map[r.staffId].lateDays++;
            }
            if (r.otHours) map[r.staffId].otMinutes += r.otHours * 60;
        });

        return Object.values(map);
    }, [attendanceRecords, staff, selectedMonth]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => goMonth(-1)} className="btn btn-secondary" style={{ padding: '0.4rem' }}><ChevronLeft size={20} /></button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, minWidth: '180px', textAlign: 'center' }}>{monthLabel}</h2>
                    <button onClick={() => goMonth(1)} className="btn btn-secondary" style={{ padding: '0.4rem' }}><ChevronRight size={20} /></button>
                </div>
                <button 
                    onClick={() => setPayrollMode(!payrollMode)}
                    className={`btn ${payrollMode ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem' }}
                >
                    <DollarSign size={16} /> {language === 'TH' ? 'โหมดคำนวณเงินเดือน' : 'Payroll Mode'}
                </button>
            </div>

            {payrollMode && (
                <div className="card" style={{ padding: '1rem', background: 'var(--primary-50)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>{language === 'TH' ? 'ค่าล่วงเวลา/ชม.' : 'OT/hr'}</label>
                        <input type="number" value={rates.otHourly} onChange={e => setRates({...rates, otHourly: Number(e.target.value)})} style={{ width: '100%', padding: '4px' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>{language === 'TH' ? 'หักมาสาย' : 'Late Fine'}</label>
                        <input type="number" value={rates.lateFine} onChange={e => setRates({...rates, lateFine: Number(e.target.value)})} style={{ width: '100%', padding: '4px' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>{language === 'TH' ? 'ค่าแรงวันละ' : 'Daily Rate'}</label>
                        <input type="number" value={rates.dailyRate} onChange={e => setRates({...rates, dailyRate: Number(e.target.value)})} style={{ width: '100%', padding: '4px' }} />
                    </div>
                </div>
            )}

            <div className="attendance-history-table">
                <table>
                    <thead>
                        <tr>
                            <th>{language === 'TH' ? 'พนักงาน' : 'Staff'}</th>
                            <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'มา' : 'Pres'}</th>
                            <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'ขาด' : 'Abs'}</th>
                            <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'สาย' : 'Late'}</th>
                            {payrollMode && <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'รวมรับ' : 'Total'}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {staffSummary.map(s => {
                            const absentDays = Math.max(0, s.expectedUpToDate - s.daysPresent);
                            const netPay = (s.salary || (s.daysPresent * rates.dailyRate)) + (s.otMinutes/60 * rates.otHourly) - (s.lateDays * rates.lateFine);
                            return (
                                <tr key={s.name}>
                                    <td>
                                        <div style={{ fontWeight: 900, color: 'var(--neutral-900)' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 600 }}>{s.role}</div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 950, color: 'var(--primary-600)' }}>{s.daysPresent}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 800, color: absentDays > 0 ? '#ef4444' : 'var(--neutral-500)' }}>{absentDays}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 800, color: s.lateDays > 0 ? '#d97706' : 'var(--neutral-500)' }}>{s.lateDays}</td>
                                    {payrollMode && <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--neutral-900)' }}>฿{netPay.toLocaleString()}</td>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ==========================================
// MAIN ATTENDANCE COMPONENT
// ==========================================
const Attendance = () => {
    const { language } = useLanguage();
    const { staff, attendanceRecords, addAttendanceRecord, settings } = useData();
    const { isAdmin } = useAuth();

    const [activeTab, setActiveTab] = useState('checkin');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const clinicLocation = settings?.clinicLocation || CLINIC_CONFIG;
    const radius = settings?.geofenceRadius || 200;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLocation({ lat, lng });
                    const dist = getDistanceMeters(lat, lng, clinicLocation.lat, clinicLocation.lng);
                    setIsWithinGeofence(dist <= radius);
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [clinicLocation, radius]);

    const handleAction = (staffId, type) => {
        if (!isWithinGeofence) {
            alert(language === 'TH' ? '❌ นอกพื้นที่คลินิก' : '❌ Outside Clinic Area');
            return;
        }

        const member = staff.find(s => s.id === staffId);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        // Late check
        const h = now.getHours();
        const m = now.getMinutes();
        const isLate = type === 'check-in' && (h > 9 || (h === 9 && m > 15));

        addAttendanceRecord({
            staffId,
            staffName: member.name,
            date: now.toISOString().split('T')[0],
            time: timeStr,
            timestamp: now.toISOString(),
            type,
            isLate
        });

        setStatusText(`${member.name} ${type === 'check-in' ? (language === 'TH' ? 'เข้างานแล้ว' : 'Checked In') : (language === 'TH' ? 'ออกงานแล้ว' : 'Checked Out')}`);
        setIsSuccess(true);
        setTimeout(() => { setIsSuccess(false); setStatusText(''); }, 3000);
    };

    const activeStaff = useMemo(() => (staff || []).filter(s => s.status === 'active'), [staff]);
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLog = (attendanceRecords || []).filter(r => r.timestamp?.startsWith(todayStr));

    return (
        <div className="attendance-container animate-fade-in">
            {/* Header */}
            <div className="attendance-header">
                <div className="attendance-title-group">
                    <h1>
                        <div className="attendance-icon-box">
                            <Clock size={24} />
                        </div>
                        {language === 'TH' ? 'ลงเวลางานพนักงาน' : 'Staff Attendance'}
                    </h1>
                </div>

                {/* Geofence Status */}
                <div className={`geofence-status ${isWithinGeofence ? 'locked' : 'unlocked'}`}>
                    <div className="pulse-dot" />
                    {isWithinGeofence 
                        ? (language === 'TH' ? 'ในพื้นที่คลินิก (พร้อมลงเวลา)' : 'LOCKED: WITHIN CLINIC') 
                        : (language === 'TH' ? 'อยู่นอกพื้นที่คลินิก' : 'OUTSIDE CLINIC AREA')}
                </div>
            </div>

            {/* Tabs */}
            <div className="attendance-tabs">
                {[
                    { key: 'checkin', label: language === 'TH' ? 'ลงชื่อเข้า/ออก' : 'Time Station', icon: <User size={18} /> },
                    { key: 'daily', label: language === 'TH' ? 'ประวัติวันนี้' : 'Today\'s Log', icon: <List size={18} /> },
                    { key: 'reports', label: language === 'TH' ? 'รายงานรายเดือน' : 'Reports', icon: <BarChart3 size={18} /> },
                ].map(t => (
                    <button 
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`attendance-tab ${activeTab === t.key ? 'active' : ''}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'checkin' && (
                <div className="clock-station-container animate-slide-up">
                    <div className="clock-station">
                        <h1 className="clock-display">{currentTime.toLocaleTimeString()}</h1>
                        <p className="date-display">{currentTime.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {isSuccess && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ padding: '1.25rem', background: '#f0fdf4', border: '1.5px solid #22c55e', color: '#166534', fontWeight: 900, marginBottom: '2.5rem', borderRadius: '24px' }}>
                            {statusText}
                        </motion.div>
                    )}

                    <div className="staff-clock-grid">
                        {activeStaff.map(s => {
                            const hasCheckedIn = todaysLog.some(r => r.staffId === s.id && (r.type === 'check-in' || r.type === 'IN'));
                            const hasCheckedOut = todaysLog.some(r => r.staffId === s.id && (r.type === 'check-out' || r.type === 'OUT'));

                            return (
                                <div key={s.id} className="staff-check-card" style={{ opacity: isWithinGeofence ? 1 : 0.5 }}>
                                    <div className="staff-info-header">
                                        <div className="staff-avatar-circle">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div className="staff-name-role">
                                            <h4>{s.name}</h4>
                                            <p>{s.role}</p>
                                        </div>
                                    </div>
                                    <div className="check-actions-row">
                                        <button 
                                            disabled={!isWithinGeofence || hasCheckedIn}
                                            onClick={() => handleAction(s.id, 'check-in')}
                                            className="btn-check btn-check-in"
                                        >
                                            <CheckCircle size={18} />
                                            {hasCheckedIn ? (language === 'TH' ? 'ลงชื่อเข้าแล้ว' : 'IN ✓') : (language === 'TH' ? 'ลงชื่อเข้า' : 'CHECK IN')}
                                        </button>
                                        <button 
                                            disabled={!isWithinGeofence || !hasCheckedIn || hasCheckedOut}
                                            onClick={() => handleAction(s.id, 'check-out')}
                                            className="btn-check btn-check-out"
                                        >
                                            <Clock size={18} />
                                            {hasCheckedOut ? (language === 'TH' ? 'ลงชื่อออกแล้ว' : 'OUT ✓') : (language === 'TH' ? 'ลงชื่อออก' : 'CHECK OUT')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'daily' && (
                <div className="attendance-history-table animate-slide-up">
                    <table>
                        <thead>
                            <tr>
                                <th>{language === 'TH' ? 'เวลา' : 'Time'}</th>
                                <th>{language === 'TH' ? 'พนักงาน' : 'Staff'}</th>
                                <th>{language === 'TH' ? 'ประเภท' : 'Type'}</th>
                                <th>{language === 'TH' ? 'สถานะ' : 'Status'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaysLog.slice().reverse().map(r => (
                                <tr key={r.id || r.timestamp}>
                                    <td style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>
                                        <div style={{ fontWeight: 900 }}>{r.staffName || r.name}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge-premium ${r.type?.toLowerCase().includes('in') ? 'status-badge-ok' : 'status-badge-late'}`} style={{ textTransform: 'uppercase' }}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td>
                                        {r.isLate && <span className="status-badge-premium status-badge-late">LATE</span>}
                                        {!r.isLate && <span className="status-badge-premium status-badge-ok">OK</span>}
                                    </td>
                                </tr>
                            ))}
                            {todaysLog.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--neutral-300)', fontWeight: 700 }}>
                                        {language === 'TH' ? 'ยังไม่มีรายชื่อลงเวลาสำหรับวันนี้' : 'No attendance entries today.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'reports' && <MonthlySummary attendanceRecords={attendanceRecords} staff={staff} language={language} />}
        </div>
    );
};

export default Attendance;
