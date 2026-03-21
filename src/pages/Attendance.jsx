import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import {
    Clock, MapPin, CheckCircle, AlertTriangle, User,
    Shield, Timer, Settings, ChevronDown,
    ChevronLeft, ChevronRight, BarChart3, QrCode, Monitor,
    Smartphone, Fingerprint, Trash2, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// ==========================================
// DEVICE ID HELPER
// ==========================================
const getDeviceId = () => {
    let id = localStorage.getItem('ciki_device_id');
    if (!id) {
        id = 'DEV-' + crypto.randomUUID();
        localStorage.setItem('ciki_device_id', id);
    }
    return id;
};

const getDeviceLabel = () => {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    return 'Unknown';
};

// Staff-Device bindings stored in localStorage
const getDeviceBindings = () => {
    try { return JSON.parse(localStorage.getItem('ciki_device_bindings') || '{}'); } catch { return {}; }
};
const saveDeviceBindings = (bindings) => localStorage.setItem('ciki_device_bindings', JSON.stringify(bindings));

// ==========================================
// CONFIG
// ==========================================
const CLINIC_CONFIG = {
    lat: 13.7563,
    lng: 100.5018,
    radiusMeters: 200,
    name: 'บ้านหมอฟัน Clinic',
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

const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const formatMinutes = (mins) => {
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    if (h > 0 && m > 0) return `${h} ชม. ${m} นาที`;
    if (h > 0) return `${h} ชม.`;
    return `${m} นาที`;
};

// ==========================================
// MONTHLY SUMMARY
// ==========================================
const MonthlySummary = ({ attendanceRecords, staff, language }) => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

    const monthRecords = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return attendanceRecords.filter(r => {
            const d = new Date(r.timestamp);
            return d.getFullYear() === y && d.getMonth() + 1 === m;
        });
    }, [attendanceRecords, selectedMonth]);

    const workingDays = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        let count = 0;
        const daysInMonth = new Date(y, m, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(y, m - 1, i).getDay();
            if (day !== 0 && day !== 6) count++;
        }
        return count;
    }, [selectedMonth]);

    const staffSummary = useMemo(() => {
        const map = {};
        (staff || []).forEach(s => {
            if (s.status !== 'active') return;
            map[s.id] = { name: s.name, role: s.role, daysPresent: 0, lateDays: 0, totalLateMinutes: 0, otDays: 0, totalOTMinutes: 0, totalWorkMinutes: 0, dailyDetails: {} };
        });
        monthRecords.forEach(r => {
            if (!map[r.staffId]) return;
            const dateKey = new Date(r.timestamp).toISOString().split('T')[0];
            if (!map[r.staffId].dailyDetails[dateKey]) map[r.staffId].dailyDetails[dateKey] = {};
            if (r.type === 'IN') {
                map[r.staffId].dailyDetails[dateKey].checkIn = r.timestamp;
                map[r.staffId].dailyDetails[dateKey].lateStatus = r.lateStatus;
                map[r.staffId].dailyDetails[dateKey].lateMinutes = r.lateMinutes || 0;
                if (!map[r.staffId].dailyDetails[dateKey].counted) { map[r.staffId].daysPresent++; map[r.staffId].dailyDetails[dateKey].counted = true; }
                if (r.lateStatus === 'late') { map[r.staffId].lateDays++; map[r.staffId].totalLateMinutes += r.lateMinutes || 0; }
            }
            if (r.type === 'OUT') {
                map[r.staffId].dailyDetails[dateKey].checkOut = r.timestamp;
                map[r.staffId].dailyDetails[dateKey].otStatus = r.lateStatus;
                map[r.staffId].dailyDetails[dateKey].otMinutes = r.lateMinutes || 0;
                if (r.lateStatus === 'ot') { map[r.staffId].otDays++; map[r.staffId].totalOTMinutes += r.lateMinutes || 0; }
                const inTime = map[r.staffId].dailyDetails[dateKey].checkIn;
                if (inTime) { const dur = (new Date(r.timestamp) - new Date(inTime)) / 60000; map[r.staffId].totalWorkMinutes += dur; map[r.staffId].dailyDetails[dateKey].workMinutes = dur; }
            }
        });
        return Object.entries(map).map(([id, data]) => ({ id, ...data }));
    }, [monthRecords, staff]);

    const totalPresent = staffSummary.reduce((s, x) => s + x.daysPresent, 0);
    const totalLate = staffSummary.reduce((s, x) => s + x.lateDays, 0);
    const totalOT = staffSummary.reduce((s, x) => s + x.totalOTMinutes, 0);
    const avgAttendance = staffSummary.length > 0 ? (totalPresent / staffSummary.length).toFixed(1) : 0;
    const ROLE_LABELS = { dentist: language === 'TH' ? 'ทันตแพทย์' : 'Dentist', assistant: language === 'TH' ? 'ผู้ช่วย' : 'Asst.', hygienist: language === 'TH' ? 'ทันตาภิบาล' : 'Hygienist', receptionist: language === 'TH' ? 'ต้อนรับ' : 'Reception', admin: language === 'TH' ? 'แอดมิน' : 'Admin' };
    const [expandedStaff, setExpandedStaff] = useState(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => goMonth(-1)} className="btn btn-secondary" style={{ padding: '0.4rem' }}><ChevronLeft size={20} /></button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, minWidth: '200px', textAlign: 'center' }}>📅 {monthLabel}</h2>
                <button onClick={() => goMonth(1)} className="btn btn-secondary" style={{ padding: '0.4rem' }}><ChevronRight size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {[
                    { label: language === 'TH' ? 'วันทำงาน' : 'Work Days', value: workingDays, icon: '📆', color: '#3b82f6' },
                    { label: language === 'TH' ? 'เข้างาน (เฉลี่ย)' : 'Avg Attendance', value: `${avgAttendance} ${language === 'TH' ? 'วัน' : 'd'}`, icon: '✅', color: '#22c55e' },
                    { label: language === 'TH' ? 'รวมสาย' : 'Total Late', value: `${totalLate} ${language === 'TH' ? 'ครั้ง' : 'times'}`, icon: '⚠️', color: '#f59e0b' },
                    { label: language === 'TH' ? 'รวม OT' : 'Total OT', value: formatMinutes(totalOT), icon: '🕐', color: '#8b5cf6' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>
            {staffSummary.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                    <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>{language === 'TH' ? 'ไม่มีข้อมูลเดือนนี้' : 'No data for this month'}</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)', borderBottom: '2px solid var(--neutral-200)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--neutral-600)' }}>{language === 'TH' ? 'พนักงาน' : 'Staff'}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--neutral-600)' }}>{language === 'TH' ? 'เข้างาน' : 'Present'}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--neutral-600)' }}>{language === 'TH' ? 'ขาด' : 'Absent'}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--neutral-600)' }}>{language === 'TH' ? 'สาย' : 'Late'}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--neutral-600)' }}>OT</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--neutral-600)' }}>{language === 'TH' ? 'ชม.ทำงาน' : 'Work Hrs'}</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--neutral-600)' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffSummary.map(s => {
                                    const absentDays = workingDays - s.daysPresent;
                                    const attendPct = workingDays > 0 ? ((s.daysPresent / workingDays) * 100).toFixed(0) : 0;
                                    const avgWorkHrs = s.daysPresent > 0 ? (s.totalWorkMinutes / s.daysPresent / 60).toFixed(1) : 0;
                                    const isExpanded = expandedStaff === s.id;
                                    return (
                                        <React.Fragment key={s.id}>
                                            <tr onClick={() => setExpandedStaff(isExpanded ? null : s.id)}
                                                style={{ borderBottom: '1px solid var(--neutral-100)', cursor: 'pointer', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-50)'}
                                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-600)', flexShrink: 0 }}>{s.name?.charAt(0)}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{ROLE_LABELS[s.role] || s.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 700, color: '#22c55e' }}>{s.daysPresent}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600, color: absentDays > 0 ? '#ef4444' : 'var(--neutral-300)' }}>{absentDays}</td>
                                                <td style={{ textAlign: 'center' }}>{s.lateDays > 0 ? <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{s.lateDays}</span> : <span style={{ color: 'var(--neutral-300)' }}>0</span>}</td>
                                                <td style={{ textAlign: 'center' }}>{s.totalOTMinutes > 0 ? <span style={{ padding: '2px 8px', background: '#ede9fe', color: '#5b21b6', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{formatMinutes(s.totalOTMinutes)}</span> : <span style={{ color: 'var(--neutral-300)' }}>-</span>}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--neutral-600)' }}>{avgWorkHrs}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: attendPct >= 90 ? '#f0fdf4' : attendPct >= 70 ? '#fffbeb' : '#fef2f2', color: attendPct >= 90 ? '#16a34a' : attendPct >= 70 ? '#d97706' : '#dc2626' }}>{attendPct}%</div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr><td colSpan={7} style={{ padding: 0 }}>
                                                    <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'var(--neutral-50)' }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--neutral-500)' }}>📋 {language === 'TH' ? 'รายวัน' : 'Daily Detail'}</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                                            {Object.entries(s.dailyDetails).sort(([a], [b]) => b.localeCompare(a)).map(([date, d]) => (
                                                                <div key={date} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'white', border: '1px solid var(--neutral-100)', fontSize: '0.8rem' }}>
                                                                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{new Date(date).toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                                                    <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--neutral-500)' }}>
                                                                        {d.checkIn && <span>🟢 {new Date(d.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                                        {d.checkOut && <span>🔴 {new Date(d.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                                        {d.workMinutes && <span>⏱ {(d.workMinutes / 60).toFixed(1)}h</span>}
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '2px' }}>
                                                                        {d.lateStatus === 'late' && <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#fef3c7', color: '#92400e', borderRadius: '6px' }}>{language === 'TH' ? 'สาย' : 'Late'} {d.lateMinutes}m</span>}
                                                                        {d.otStatus === 'ot' && <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#ede9fe', color: '#5b21b6', borderRadius: '6px' }}>OT {d.otMinutes}m</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td></tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// MAIN ATTENDANCE COMPONENT
// ==========================================
const Attendance = () => {
    const { t, language } = useLanguage();
    const { addAttendanceRecord, attendanceRecords, staff } = useData();

    const [activeTab, setActiveTab] = useState('checkin');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, success
    const [checkType, setCheckType] = useState('IN');
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [lastCheckedStaff, setLastCheckedStaff] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showQRDisplay, setShowQRDisplay] = useState(false);
    const [deviceBindings, setDeviceBindings] = useState(getDeviceBindings);
    const [deviceCheckEnabled, setDeviceCheckEnabled] = useState(() => localStorage.getItem('ciki_device_check') === 'true');
    const thisDeviceId = useMemo(() => getDeviceId(), []);
    const thisDeviceLabel = useMemo(() => getDeviceLabel(), []);
    const [clinicConfig, setClinicConfig] = useState(() => {
        const saved = localStorage.getItem('ciki_clinicGeo');
        return saved ? JSON.parse(saved) : CLINIC_CONFIG;
    });

    // The single QR code URL — points to this attendance page
    const qrUrl = useMemo(() => {
        return `${window.location.origin}/attendance`;
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        localStorage.setItem('ciki_clinicGeo', JSON.stringify(clinicConfig));
    }, [clinicConfig]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setLocationError(language === 'TH' ? 'ไม่สามารถระบุตำแหน่ง กรุณาเปิด GPS' : 'Unable to get location. Enable GPS.'),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLocationError(language === 'TH' ? 'เบราว์เซอร์ไม่รองรับ GPS' : 'GPS not supported');
        }
    }, []);

    const distanceFromClinic = useMemo(() => {
        if (!location) return null;
        return getDistanceMeters(location.lat, location.lng, clinicConfig.lat, clinicConfig.lng);
    }, [location, clinicConfig]);

    const isWithinGeofence = distanceFromClinic !== null && distanceFromClinic <= clinicConfig.radiusMeters;

    const getLateOTInfo = (type, time) => {
        const mins = time.getHours() * 60 + time.getMinutes();
        const startMins = timeToMinutes(WORK_SCHEDULE.startTime);
        const endMins = timeToMinutes(WORK_SCHEDULE.endTime);
        if (type === 'IN') {
            const diff = mins - startMins;
            if (diff > WORK_SCHEDULE.lateGraceMinutes) return { status: 'late', minutes: diff };
            return { status: 'ontime', minutes: 0 };
        } else {
            const diff = mins - endMins;
            if (diff > 0) return { status: 'ot', minutes: diff };
            return { status: 'normal', minutes: 0 };
        }
    };

    const currentLateOT = getLateOTInfo(checkType, currentTime);

    // Device binding helpers
    const bindDevice = (staffId) => {
        const updated = { ...deviceBindings, [staffId]: { deviceId: thisDeviceId, label: thisDeviceLabel, boundAt: new Date().toISOString() } };
        setDeviceBindings(updated);
        saveDeviceBindings(updated);
    };
    const unbindDevice = (staffId) => {
        const updated = { ...deviceBindings };
        delete updated[staffId];
        setDeviceBindings(updated);
        saveDeviceBindings(updated);
    };
    const toggleDeviceCheck = () => {
        const next = !deviceCheckEnabled;
        setDeviceCheckEnabled(next);
        localStorage.setItem('ciki_device_check', next.toString());
    };
    const isDeviceAllowed = (staffId) => {
        if (!deviceCheckEnabled) return true;
        const binding = deviceBindings[staffId];
        if (!binding) return true; // not bound yet = allow (admin should bind first)
        return binding.deviceId === thisDeviceId;
    };

    // Quick check-in: select name → instant record
    const handleQuickCheckIn = (staffId) => {
        const member = (staff || []).find(s => s.id === staffId);
        if (!member) return;

        if (!isDeviceAllowed(staffId)) {
            alert(language === 'TH' ? '❌ อุปกรณ์นี้ไม่ตรงกับที่ลงทะเบียนไว้\nกรุณาใช้มือถือของคุณเอง' : '❌ Device mismatch\nPlease use your registered device');
            return;
        }

        const lateOT = getLateOTInfo(checkType, new Date());

        addAttendanceRecord({
            staffId: member.id,
            name: member.name,
            type: checkType,
            location,
            device: navigator.userAgent,
            deviceId: thisDeviceId,
            distanceFromClinic: distanceFromClinic ? Math.round(distanceFromClinic) : 0,
            lateStatus: lateOT.status,
            lateMinutes: lateOT.minutes,
            method: 'qr-web',
        });

        setLastCheckedStaff({ ...member, lateOT, checkType });
        setStatus('success');
        setSelectedStaffId('');

        setTimeout(() => { setStatus('idle'); setLastCheckedStaff(null); }, 3000);
    };

    const todayRecords = attendanceRecords.filter(r =>
        new Date(r.timestamp).toDateString() === new Date().toDateString()
    ).reverse();

    const todaySummary = useMemo(() => {
        const summary = {};
        todayRecords.forEach(r => {
            if (!summary[r.staffId]) summary[r.staffId] = { name: r.name, checkIn: null, checkOut: null, lateMinutes: 0, otMinutes: 0 };
            if (r.type === 'IN' && !summary[r.staffId].checkIn) {
                summary[r.staffId].checkIn = r.timestamp;
                summary[r.staffId].lateMinutes = r.lateMinutes || 0;
                summary[r.staffId].lateStatus = r.lateStatus;
            }
            if (r.type === 'OUT') {
                summary[r.staffId].checkOut = r.timestamp;
                summary[r.staffId].otMinutes = r.lateMinutes || 0;
                summary[r.staffId].otStatus = r.lateStatus;
            }
        });
        return summary;
    }, [todayRecords]);

    const setCurrentAsClinic = () => {
        if (location) {
            setClinicConfig(prev => ({ ...prev, lat: location.lat, lng: location.lng }));
            alert(language === 'TH' ? '✅ บันทึกพิกัดคลินิกแล้ว' : '✅ Clinic location saved');
        }
    };

    const activeStaff = (staff || []).filter(s => s.status === 'active');

    // ==========================================
    // QR DISPLAY MODE (fullscreen for kiosk/print)
    // ==========================================
    if (showQRDisplay) {
        return (
            <div style={{
                position: 'fixed', inset: 0, background: 'white', zIndex: 9999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '2rem'
            }}>
                <button onClick={() => setShowQRDisplay(false)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--neutral-200)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neutral-800)', marginBottom: '0.5rem' }}>
                    📱 {language === 'TH' ? 'สแกนเพื่อลงเวลา' : 'Scan to Check In'}
                </h1>
                <p style={{ color: 'var(--neutral-500)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    {language === 'TH' ? 'ใช้กล้องมือถือสแกน QR Code นี้' : 'Use your phone camera to scan'}
                </p>
                <div style={{ padding: '1.5rem', background: 'white', border: '3px solid var(--neutral-200)', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                    <QRCodeSVG value={qrUrl} size={300} level="H" bgColor="#ffffff" fgColor="#1e293b" />
                </div>
                <p style={{ marginTop: '1.5rem', color: 'var(--neutral-400)', fontSize: '0.9rem', textAlign: 'center' }}>
                    {qrUrl}
                </p>
                <p style={{ marginTop: '0.5rem', color: 'var(--neutral-400)', fontSize: '0.85rem' }}>
                    {language === 'TH' ? 'QR Code จะพาไปหน้าลงเวลา เลือกชื่อแล้วกดลงเวลาได้ทันที' : 'QR leads to check-in page, select name and check in instantly'}
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Tab Header */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--neutral-100)', padding: '4px', borderRadius: '12px' }}>
                {[
                    { key: 'checkin', icon: <Clock size={16} />, label: language === 'TH' ? 'ลงเวลา' : 'Check-in' },
                    { key: 'devices', icon: <Smartphone size={16} />, label: language === 'TH' ? 'อุปกรณ์' : 'Devices' },
                    { key: 'summary', icon: <BarChart3 size={16} />, label: language === 'TH' ? 'สรุป' : 'Summary' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{ flex: 1, padding: '0.65rem 0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: activeTab === tab.key ? 'white' : 'transparent', color: activeTab === tab.key ? 'var(--primary-600)' : 'var(--neutral-500)', boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                    >{tab.icon} {tab.label}</button>
                ))}
            </div>

            {activeTab === 'summary' && <MonthlySummary attendanceRecords={attendanceRecords} staff={staff} language={language} />}

            {/* DEVICE MANAGEMENT TAB */}
            {activeTab === 'devices' && (
                <div style={{ maxWidth: '550px', margin: '0 auto' }}>
                    {/* Toggle */}
                    <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {deviceCheckEnabled ? <ShieldCheck size={18} color="#16a34a" /> : <ShieldAlert size={18} color="#d97706" />}
                                {language === 'TH' ? 'ล็อกอุปกรณ์' : 'Device Lock'}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', margin: '0.25rem 0 0' }}>
                                {language === 'TH' ? 'เปิดใช้ = ลงเวลาได้จากมือถือที่ลงทะเบียนเท่านั้น' : 'Enabled = check-in only from registered device'}
                            </p>
                        </div>
                        <button onClick={toggleDeviceCheck} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: deviceCheckEnabled ? '#16a34a' : 'var(--neutral-300)', position: 'relative', transition: 'background 0.2s' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: deviceCheckEnabled ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </button>
                    </div>

                    {/* This device info */}
                    <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600, marginBottom: '0.25rem' }}>📱 {language === 'TH' ? 'อุปกรณ์นี้' : 'This Device'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#1e3a5f' }}>{thisDeviceLabel}</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace', marginTop: '0.15rem' }}>{thisDeviceId.slice(0, 20)}...</div>
                    </div>

                    {/* Staff device list */}
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {language === 'TH' ? '🔗 ผูกอุปกรณ์พนักงาน' : '🔗 Staff Device Bindings'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {activeStaff.map(s => {
                            const binding = deviceBindings[s.id];
                            const isBound = !!binding;
                            const isThisDevice = binding?.deviceId === thisDeviceId;
                            return (
                                <div key={s.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: isBound ? '#dcfce7' : 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: isBound ? '#166534' : 'var(--neutral-400)', fontSize: '0.85rem' }}>
                                        {isBound ? '🔒' : s.name?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                                        {isBound ? (
                                            <div style={{ fontSize: '0.75rem', color: isThisDevice ? '#16a34a' : '#6b7280' }}>
                                                {binding.label} {isThisDevice ? '(เครื่องนี้)' : ''}
                                                <span style={{ color: 'var(--neutral-400)', marginLeft: '0.5rem' }}>
                                                    {new Date(binding.boundAt).toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US')}
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{language === 'TH' ? 'ยังไม่ผูกอุปกรณ์' : 'Not bound'}</div>
                                        )}
                                    </div>
                                    {isBound ? (
                                        <button onClick={() => { if (confirm(language === 'TH' ? `ยกเลิกผูกอุปกรณ์ของ ${s.name}?` : `Unbind ${s.name}?`)) unbindDevice(s.id); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.6rem', border: '1px solid #fecaca', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                            <Trash2 size={12} /> {language === 'TH' ? 'ยกเลิก' : 'Remove'}
                                        </button>
                                    ) : (
                                        <button onClick={() => bindDevice(s.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.6rem', border: '1px solid #bbf7d0', borderRadius: '6px', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                            <Smartphone size={12} /> {language === 'TH' ? 'ผูกเครื่องนี้' : 'Bind This'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {activeStaff.length === 0 && (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                            {language === 'TH' ? 'ไม่มีพนักงาน' : 'No staff'}
                        </div>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', marginTop: '1rem', textAlign: 'center', lineHeight: 1.5 }}>
                        💡 {language === 'TH' ? 'วิธีใช้: เปิดหน้านี้บนมือถือของพนักงานแต่ละคน แล้วกด "ผูกเครื่องนี้" จากนั้นเปิด "ล็อกอุปกรณ์" พนักงานจะลงเวลาได้จากมือถือตัวเองเท่านั้น' : 'Open this page on each staff\'s phone, tap "Bind This", then enable "Device Lock".'}
                    </p>
                </div>
            )}

            {activeTab === 'checkin' && (
                <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
                    {/* Clock */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 300, color: 'var(--primary-700)', fontFamily: 'monospace', margin: 0 }}>
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </h1>
                        <p style={{ fontSize: '0.95rem', color: 'var(--neutral-500)', margin: '0.25rem 0' }}>
                            {currentTime.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--neutral-400)' }}>🕘 {WORK_SCHEDULE.startTime}</span>
                            <span style={{ color: 'var(--neutral-400)' }}>🕔 {WORK_SCHEDULE.endTime}</span>
                        </div>
                    </div>

                    {/* SUCCESS FLASH */}
                    {status === 'success' && lastCheckedStaff && (
                        <div className="card animate-fade-in" style={{
                            padding: '2rem', marginBottom: '1.5rem', textAlign: 'center',
                            background: lastCheckedStaff.checkType === 'IN' ? '#f0fdf4' : '#fef2f2',
                            border: `2px solid ${lastCheckedStaff.checkType === 'IN' ? '#86efac' : '#fca5a5'}`
                        }}>
                            <div style={{ width: '64px', height: '64px', background: lastCheckedStaff.checkType === 'IN' ? '#dcfce7' : '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <CheckCircle size={36} color={lastCheckedStaff.checkType === 'IN' ? '#166534' : '#dc2626'} />
                            </div>
                            <h2 style={{ color: lastCheckedStaff.checkType === 'IN' ? '#166534' : '#991b1b', marginBottom: '0.25rem', fontSize: '1.2rem' }}>
                                {lastCheckedStaff.checkType === 'IN' ? (language === 'TH' ? '✅ เข้างานสำเร็จ!' : '✅ Checked In!') : (language === 'TH' ? '✅ ออกงานสำเร็จ!' : '✅ Checked Out!')}
                            </h2>
                            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--neutral-800)' }}>{lastCheckedStaff.name}</p>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>{new Date().toLocaleTimeString()}</p>
                            {lastCheckedStaff.lateOT?.status === 'late' && (
                                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fef3c7', borderRadius: '8px', color: '#92400e', fontWeight: 600, fontSize: '0.9rem' }}>
                                    ⚠️ {language === 'TH' ? 'สาย' : 'Late'} {formatMinutes(lastCheckedStaff.lateOT.minutes)}
                                </div>
                            )}
                            {lastCheckedStaff.lateOT?.status === 'ot' && (
                                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#ede9fe', borderRadius: '8px', color: '#5b21b6', fontWeight: 600, fontSize: '0.9rem' }}>
                                    🕐 OT {formatMinutes(lastCheckedStaff.lateOT.minutes)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CHECK-IN CARD */}
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                        {/* Toggle IN/OUT */}
                        <div style={{ display: 'flex', background: 'var(--neutral-100)', padding: '4px', borderRadius: '12px', marginBottom: '1.25rem' }}>
                            {['IN', 'OUT'].map(type => (
                                <button key={type} onClick={() => setCheckType(type)}
                                    style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', background: checkType === type ? (type === 'IN' ? '#16a34a' : '#dc2626') : 'transparent', color: checkType === type ? 'white' : 'var(--neutral-500)' }}>
                                    {type === 'IN' ? (language === 'TH' ? '🟢 เข้างาน' : '🟢 CHECK IN') : (language === 'TH' ? '🔴 ออกงาน' : '🔴 CHECK OUT')}
                                </button>
                            ))}
                        </div>

                        {/* Late/OT indicator */}
                        {checkType === 'IN' && currentLateOT.status === 'late' && (
                            <div style={{ padding: '0.65rem', background: '#fef3c7', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#92400e', fontWeight: 600, fontSize: '0.9rem' }}>
                                <AlertTriangle size={18} /> {language === 'TH' ? `สายแล้ว ${formatMinutes(currentLateOT.minutes)}` : `Late by ${formatMinutes(currentLateOT.minutes)}`}
                            </div>
                        )}
                        {checkType === 'IN' && currentLateOT.status === 'ontime' && (
                            <div style={{ padding: '0.65rem', background: '#f0fdf4', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600, fontSize: '0.9rem' }}>
                                <CheckCircle size={18} /> {language === 'TH' ? 'ตรงเวลา' : 'On Time'}
                            </div>
                        )}
                        {checkType === 'OUT' && currentLateOT.status === 'ot' && (
                            <div style={{ padding: '0.65rem', background: '#ede9fe', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#5b21b6', fontWeight: 600, fontSize: '0.9rem' }}>
                                <Timer size={18} /> OT {formatMinutes(currentLateOT.minutes)}
                            </div>
                        )}

                        {/* Geofence status */}
                        <div style={{ padding: '0.65rem', borderRadius: '8px', marginBottom: '1.25rem', background: !location ? '#fff7ed' : isWithinGeofence ? '#f0fdf4' : '#fef2f2', border: `1px solid ${!location ? '#fed7aa' : isWithinGeofence ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: !location ? '#9a3412' : isWithinGeofence ? '#166534' : '#991b1b' }}>
                            <Shield size={16} />
                            {!location ? (locationError || (language === 'TH' ? 'กำลังค้นหาตำแหน่ง...' : 'Getting location...'))
                                : isWithinGeofence ? (language === 'TH' ? `✅ อยู่ในพื้นที่คลินิก (${Math.round(distanceFromClinic)} ม.)` : `✅ Within clinic (${Math.round(distanceFromClinic)}m)`)
                                    : (language === 'TH' ? `❌ นอกพื้นที่! ห่าง ${Math.round(distanceFromClinic)} ม.` : `❌ Outside! ${Math.round(distanceFromClinic)}m away`)}
                        </div>

                        {/* Staff selection — grid of buttons for quick tap */}
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-600)' }}>
                            <User size={14} style={{ verticalAlign: '-2px', marginRight: '0.25rem' }} />
                            {language === 'TH' ? 'แตะชื่อเพื่อลงเวลา' : 'Tap your name to check in'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                            {activeStaff.map(s => {
                                const alreadyIn = todaySummary[s.id]?.checkIn && !todaySummary[s.id]?.checkOut;
                                const alreadyOut = todaySummary[s.id]?.checkOut;
                                const isDone = (checkType === 'IN' && alreadyIn) || (checkType === 'OUT' && alreadyOut);
                                return (
                                    <button key={s.id}
                                        onClick={() => { if (!isDone) handleQuickCheckIn(s.id); }}
                                        disabled={isDone || (!isWithinGeofence && location)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                            padding: '0.75rem 0.5rem', border: '2px solid',
                                            borderColor: isDone ? 'var(--neutral-200)' : checkType === 'IN' ? '#bbf7d0' : '#fecaca',
                                            borderRadius: '12px', cursor: isDone ? 'default' : (!isWithinGeofence && location) ? 'not-allowed' : 'pointer',
                                            background: isDone ? 'var(--neutral-50)' : 'white',
                                            opacity: isDone ? 0.5 : (!isWithinGeofence && location) ? 0.5 : 1,
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { if (!isDone) e.currentTarget.style.background = checkType === 'IN' ? '#f0fdf4' : '#fef2f2'; }}
                                        onMouseLeave={e => { if (!isDone) e.currentTarget.style.background = 'white'; }}
                                    >
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: isDone ? 'var(--neutral-200)' : 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: isDone ? 'var(--neutral-400)' : 'var(--primary-600)' }}>
                                            {isDone ? '✓' : s.name?.charAt(0)}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDone ? 'var(--neutral-400)' : 'var(--neutral-700)', textAlign: 'center', lineHeight: 1.2 }}>
                                            {s.name}
                                        </span>
                                        {isDone && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--neutral-400)' }}>
                                                {language === 'TH' ? 'ลงแล้ว' : 'Done'}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {activeStaff.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.9rem' }}>
                                {language === 'TH' ? 'ไม่มีพนักงาน — กด Demo Mode เพื่อโหลดข้อมูลตัวอย่าง' : 'No staff — load demo data first'}
                            </div>
                        )}
                    </div>

                    {/* Show QR Code button */}
                    <button onClick={() => setShowQRDisplay(true)} className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        <QrCode size={18} />
                        {language === 'TH' ? 'แสดง QR Code สำหรับติดหน้าคลินิก' : 'Show QR Code for Clinic'}
                    </button>

                    {/* Today's summary */}
                    {Object.keys(todaySummary).length > 0 && (
                        <div style={{ textAlign: 'left' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📊 {language === 'TH' ? 'สรุปวันนี้' : 'Today'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.entries(todaySummary).map(([staffId, data]) => (
                                    <div key={staffId} className="card" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-600)', fontSize: '0.85rem' }}>{data.name?.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{data.name}</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                                                {data.checkIn && <span>🟢 {new Date(data.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                {data.checkOut && <span>🔴 {new Date(data.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </div>
                                        </div>
                                        {data.lateStatus === 'late' && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontWeight: 600 }}>{language === 'TH' ? 'สาย' : 'Late'}</span>}
                                        {data.otStatus === 'ot' && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#ede9fe', color: '#5b21b6', borderRadius: '12px', fontWeight: 600 }}>OT</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Geofence Settings */}
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
                            <Settings size={16} /> {language === 'TH' ? 'ตั้งค่า Geofencing' : 'Geofencing Settings'}
                            <ChevronDown size={14} style={{ transform: showSettings ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        {showSettings && (
                            <div className="card animate-fade-in" style={{ marginTop: '1rem', padding: '1.25rem', textAlign: 'left' }}>
                                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>📍 {language === 'TH' ? 'ตั้งค่าพิกัดคลินิก' : 'Clinic Geofence'}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>Latitude</label>
                                        <input type="number" step="0.0001" value={clinicConfig.lat} onChange={e => setClinicConfig(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--neutral-200)', fontSize: '0.85rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>Longitude</label>
                                        <input type="number" step="0.0001" value={clinicConfig.lng} onChange={e => setClinicConfig(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--neutral-200)', fontSize: '0.85rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{language === 'TH' ? 'รัศมี (ม.)' : 'Radius (m)'}</label>
                                        <input type="number" value={clinicConfig.radiusMeters} onChange={e => setClinicConfig(p => ({ ...p, radiusMeters: parseInt(e.target.value) || 100 }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--neutral-200)', fontSize: '0.85rem' }} />
                                    </div>
                                </div>
                                <button className="btn btn-secondary" onClick={setCurrentAsClinic} disabled={!location} style={{ width: '100%', fontSize: '0.85rem' }}>
                                    <MapPin size={14} style={{ marginRight: '0.5rem' }} /> {language === 'TH' ? 'ใช้ตำแหน่งปัจจุบันเป็นพิกัดคลินิก' : 'Use Current Location as Clinic'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
