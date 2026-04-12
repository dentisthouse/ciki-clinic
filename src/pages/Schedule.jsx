import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronRight, Plus, List, ChevronLeft, User, Volume2, RefreshCw, Clock, CheckCircle, Edit3, Clipboard, Stethoscope, PhoneOff, LogIn, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import AppointmentModal from '../components/Scheduling/AppointmentModal';
import WalkInModal from '../components/Scheduling/WalkInModal';
import InitialVitalsModal from '../components/Scheduling/InitialVitalsModal';
import '../styles/schedule.css';

const Schedule = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, staff, permissions } = useAuth();
    const { patients, appointments, addAppointment, updateAppointment, updateQueueStatus, syncData, broadcastAnnouncement } = useData();
    
    // Mapping for hardcoded doctors to filter match names
    const DOCTOR_MAP = {
        'owner@dental.com': 'หมออ้อม',
        'big@dental.com': 'หมอบิ๊ก',
        'tong@dental.com': 'หมอต้อง',
        'joob@dental.com': 'หมอจุ๊บ'
    };
    
    const handleSendLineConfirmation = async (apt) => {
        const patient = patients.find(p => p.id === apt.patientId);
        const lineUserId = patient?.lineUserId || patient?.line_user_id;

        if (!lineUserId) {
            alert(language === 'TH' ? 'คนไข้รายนี้ยังไม่มีการยืนยันตัวตนผ่าน LINE (ไม่พบ User ID)' : 'This patient has no linked LINE account (User ID not found)');
            return;
        }

        try {
            // เรียกใช้ Backend API (ปกติจะรันที่ port 3001 ตาม server/index.js)
            const serverUrl = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
            
            const response = await fetch(`${serverUrl}/api/line/appointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: lineUserId,
                    patientName: apt.patientName || apt.patient,
                    appointmentDate: apt.date,
                    appointmentTime: apt.time,
                    treatment: apt.procedure || apt.treatment,
                    doctor: apt.dentist || 'ทันตแพทย์ประจำ',
                    appointmentId: apt.id
                })
            });

            const result = await response.json();

            if (result.success) {
                // อัพเดทสถานะว่าส่งข้อยืนยันแล้ว
                updateAppointment(apt.id, { status: 'Sent' });
                // alert(language === 'TH' ? `ส่ง Flex Message ยืนยันนัดไปยัง LINE คุณ ${apt.patientName || apt.patient} เรียบร้อยแล้ว!` : `Sent Flex Message confirmation to ${apt.patientName || apt.patient} on LINE!`);
            } else {
                throw new Error(result.error || 'Failed to send');
            }
        } catch (error) {
            console.error("Error sending LINE notification:", error);
            alert(language === 'TH' ? 'ไม่สามารถส่ง LINE ได้ กรุณาตรวจสอบว่า Backend Server กำลังทำงานอยู่' : 'Could not send LINE message. Please check if the Backend Server is running.');
        }
    };
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [doctorFilter, setDoctorFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [selectedAptForVitals, setSelectedAptForVitals] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState('Room 1'); // For queue calling
    const [activeQueueTab, setActiveQueueTab] = useState('today'); // today, inprogress, completed
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusUpdatingApt, setStatusUpdatingApt] = useState(null);
    const [isRoomSelectionModalOpen, setIsRoomSelectionModalOpen] = useState(false);
    const [callingApt, setCallingApt] = useState(null);

    // Filter appointments for dentists on load
    useEffect(() => {
        const role = staff?.role?.toLowerCase();
        if (role === 'dentist' || role === 'doctor') {
            const drName = DOCTOR_MAP[user?.email?.toLowerCase()] || staff?.name;
            if (drName) setDoctorFilter(drName);
        }
    }, [staff, user]);

    // --- AUTO-SYNC POLLING ---
    useEffect(() => {
        const intervalId = setInterval(() => {
            syncData();
        }, 7000); 
        return () => clearInterval(intervalId);
    }, [syncData]);

    // Check for query params (e.g., from Dashboard "New Appointment")
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'new') {
            setIsModalOpen(true);
            navigate('/schedule', { replace: true });
        }
    }, [location, navigate]);

    const handleSaveAppointment = (newApt) => {
        addAppointment(newApt);
        setIsModalOpen(false);
    };

    // Handle calling queue with voice announcement
    const handleCallQueue = useCallback((apt, room = selectedRoom) => {
        // Update queue status to In Progress with room
        updateQueueStatus(apt.id, 'In Progress', room);
        
        // Global broadcast for QueueDisplay and voice
        broadcastAnnouncement('queue', {
            patientName: apt.patientName || apt.patient,
            queueNumber: apt.queueNumber,
            room: room
        });

        // Auto-navigate to Patient Profile -> Treatment Plan tab
        if (apt.patientId) {
            navigate(`/patients/${apt.patientId}?tab=plans`);
        } else {
            // Fallback to simple navigation
            navigate('/patients');
        }
    }, [selectedRoom, updateQueueStatus, broadcastAnnouncement, navigate]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const APPOINTMENT_STATUSES = [
        { id: 'Cancelled', label: 'ยกเลิกนัดไปแล้ว', color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fee2e2' },
        { id: 'Confirmed', label: 'ยืนยันการนัดหมาย', color: '#10b981', bgColor: '#f0fdf4', borderColor: '#dcfce7' },
        { id: 'Postponed_NewDate', label: 'เลื่อนนัด มีวันนัดใหม่แล้ว', color: '#9a3412', bgColor: '#fff7ed', borderColor: '#ffedd5' },
        { id: 'Postponed_NoDate', label: 'เลื่อนนัด ยังไม่ระบุวันนัด', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fef3c7' },
        { id: 'CannotContact', label: 'โทรไม่ติด/ติดต่อไม่ได้', color: '#1e293b', bgColor: '#f8fafc', borderColor: '#e2e8f0' },
        { id: 'NoAnswer', label: 'ไม่รับสาย', color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ede9fe' },
        { id: 'Pending', label: 'ไม่ระบุสถานะ', color: '#94a3b8', bgColor: '#f8fafc', borderColor: '#e2e8f0' },
    ];

    const getStatusInfo = (status) => {
        return APPOINTMENT_STATUSES.find(s => s.id === status) || APPOINTMENT_STATUSES[APPOINTMENT_STATUSES.length - 1];
    };

    // Simplified inline-render instead of sub-component to prevent unmount/remount flickering
    const renderStatusModal = () => {
        if (!isStatusModalOpen || !statusUpdatingApt) return null;

        return (
            <div className="modal-overlay" style={{ zIndex: 2000 }}>
                <div className="modal-container-mini">
                    <div className="modal-header">
                        <div className="header-info">
                            <h3>{language === 'TH' ? 'เปลี่ยนสถานะข้อมูลนัดหมาย' : 'Change Appointment Status'}</h3>
                            <p className="header-desc">{statusUpdatingApt.patientName || statusUpdatingApt.patient}</p>
                        </div>
                        <button onClick={() => setIsStatusModalOpen(false)} className="modal-close">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal-body-p0">
                        <div className="status-grid-modal" style={{ padding: '1.5rem' }}>
                            {APPOINTMENT_STATUSES.map((status) => (
                                <button
                                    key={status.id}
                                    onClick={() => {
                                        updateAppointment(statusUpdatingApt.id, { status: status.id });
                                        setIsStatusModalOpen(false);
                                    }}
                                    className={`status-check-pill ${statusUpdatingApt.status === status.id ? 'selected' : ''}`}
                                    style={{
                                        borderColor: statusUpdatingApt.status === status.id ? 'transparent' : (status.borderColor || '#e2e8f0'),
                                        color: statusUpdatingApt.status === status.id ? 'white' : status.color
                                    }}
                                >
                                    <div className="status-dot-active" />
                                    <span className="status-label-modal">{status.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderRoomSelectionModal = () => {
        if (!isRoomSelectionModalOpen || !callingApt) return null;

        const rooms = [
            { id: 'Room 1', label: language === 'TH' ? 'ห้องตรวจ 1' : 'Exam Room 1', icon: '1️⃣' },
            { id: 'Room 2', label: language === 'TH' ? 'ห้องตรวจ 2' : 'Exam Room 2', icon: '2️⃣' },
            { id: 'Room 3', label: language === 'TH' ? 'ห้องตรวจ 3' : 'Exam Room 3', icon: '3️⃣' },
        ];

        return (
            <div className="modal-overlay" style={{ zIndex: 2000 }}>
                <div className="modal-container-mini animate-scale-in" style={{ maxWidth: '400px' }}>
                    <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
                        <div className="header-info">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{language === 'TH' ? 'เลือกห้องเข้าตรวจ' : 'Select Exam Room'}</h3>
                            <p className="header-desc" style={{ fontSize: '1rem', color: 'var(--primary-600)', fontWeight: 700 }}>{callingApt.patientName || callingApt.patient}</p>
                        </div>
                        <button onClick={() => setIsRoomSelectionModalOpen(false)} className="modal-close">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal-body" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {rooms.map((room) => (
                                <button
                                    key={room.id}
                                    onClick={() => {
                                        handleCallQueue(callingApt, room.id);
                                        setIsRoomSelectionModalOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.25rem',
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, white, #f8fafc)',
                                        border: '2px solid var(--neutral-100)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--primary-300)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--neutral-100)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <span style={{ fontSize: '1.75rem' }}>{room.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--neutral-800)' }}>{room.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{language === 'TH' ? 'พร้อมใช้งาน' : 'Available'}</div>
                                    </div>
                                    <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--neutral-300)' }} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekDaysTH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

        return (
            <div className="animate-fade-in">
                <div className="calendar-view-card">
                    {/* Calendar Controls */}
                    <div className="calendar-header">
                        <h2>
                            {format(currentDate, 'MMMM yyyy', { locale: language === 'TH' ? th : enUS })}
                        </h2>
                        <div className="header-actions">
                            <button className="btn btn-secondary" onClick={prevMonth}><ChevronLeft size={20} /></button>
                            <button className="btn btn-secondary" onClick={nextMonth}><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    {/* Week Header */}
                    <div className="week-header-grid">
                        {(language === 'TH' ? weekDaysTH : weekDays).map(day => (
                            <div key={day} className="week-day-label">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="days-grid">
                        {calendarDays.map((day, idx) => {
                            const isToday = isSameDay(day, new Date());
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            
                            // Strict role-based filtering for render logic
                            const userIsClinical = staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor';
                            const effectiveFilter = userIsClinical ? (DOCTOR_MAP[user?.email?.toLowerCase()] || staff?.name) : doctorFilter;
                            
                            const filteredApts = appointments.filter(apt => effectiveFilter === 'All' || apt.dentist === effectiveFilter);
                            const dayAppointments = filteredApts.filter(apt => isSameDay(new Date(apt.date), day));

                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        setCurrentDate(day);
                                        setViewMode('list');
                                    }}
                                    className={`day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
                                >
                                    <div className="day-number-wrapper">
                                        <span className="day-number-pill">
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="day-apts-container">
                                        {dayAppointments.slice(0, 3).map((apt, i) => (
                                            <div key={i} className="apt-event-pill">
                                                {apt.time} {(apt.patientName || apt.patient || '').split(' ')[0]}
                                            </div>
                                        ))}
                                        {dayAppointments.length > 3 && (
                                            <div className="apt-more-count">
                                                +{dayAppointments.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-slide-up">
            {renderStatusModal()}
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAppointment}
            />

            <InitialVitalsModal
                isOpen={isVitalsModalOpen}
                onClose={() => setIsVitalsModalOpen(false)}
                patientName={selectedAptForVitals?.patientName || selectedAptForVitals?.patient}
                patientCN={patients.find(p => p.id === selectedAptForVitals?.patientId)?.hn || ''}
                onSave={(vitals) => {
                    updateAppointment(selectedAptForVitals.id, { vitals });
                    alert(language === 'TH' ? 'บันทึกข้อมูลเบื้องต้นเรียบร้อย' : 'Pre-service vitals saved');
                }}
            />

            <WalkInModal
                isOpen={isWalkInModalOpen}
                onClose={() => setIsWalkInModalOpen(false)}
                onSave={(newApt) => {
                    addAppointment(newApt);
                    // navigate(`/patients/${newApt.patientId}`); // Option to go to profile immediately
                }}
            />

            {/* Page Header */}
            <div className="schedule-header-premium animate-fade-in">
                <div className="header-top-row">
                    <div className="title-section">
                        <div className="title-icon-box">
                            <CalendarIcon size={32} />
                        </div>
                        <div>
                            <h1>{t('sch_title')}</h1>
                            <p className="subtitle-premium">{t('sch_subtitle')}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary shadow-sm" onClick={() => syncData()} title="Sync">
                            <RefreshCw size={20} color="var(--primary-600)" />
                        </button>
                        <button className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'} shadow-sm`}
                                onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}>
                            {viewMode === 'list' ? <CalendarIcon size={20} /> : <List size={20} />}
                            {viewMode === 'list' ? t('sch_view_calendar') : t('sch_view_list')}
                        </button>
                    </div>
                </div>

                <div className="header-bottom-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="filter-section">
                        <select 
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            disabled={staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor'}
                            className="status-select-premium"
                        >
                            {(() => {
                                const role = staff?.role?.toLowerCase();
                                const isClinical = role === 'dentist' || role === 'doctor';
                                const myBoundName = DOCTOR_MAP[user?.email?.toLowerCase()] || staff?.name;

                                if (!isClinical) {
                                    return (
                                        <>
                                            <option value="All">👨‍⚕️ แพทย์ทั้งหมด (All Doctors)</option>
                                            <option value="หมอบิ๊ก">👨‍⚕️ หมอบิ๊ก (เฉพาะทางฟันคุด)</option>
                                            <option value="หมอต้อง">👨‍⚕️ หมอต้อง (ทั่วไป)</option>
                                            <option value="หมออ้อม">👩‍⚕️ หมออ้อม (จัดฟัน)</option>
                                            <option value="หมอจุ๊บ">👩‍⚕️ หมอจุ๊บ (จัดฟัน)</option>
                                        </>
                                    );
                                }
                                return <option value={myBoundName}>👩‍⚕️ {myBoundName}</option>;
                            })()}
                        </select>
                    </div>

                    <div className="action-buttons-group" style={{ display: 'flex', gap: '0.75rem' }}>
                        {(staff?.role?.toLowerCase() !== 'dentist' && staff?.role?.toLowerCase() !== 'doctor') && (
                            <button className="btn btn-accent-light" onClick={() => setIsWalkInModalOpen(true)}>
                                <User size={20} />
                                {t('sch_walk_in')}
                            </button>
                        )}
                        {(staff?.role?.toLowerCase() !== 'dentist' && staff?.role?.toLowerCase() !== 'doctor') && (
                            <button className="btn btn-primary btn-with-shadow" onClick={() => setIsModalOpen(true)}>
                                <Plus size={22} />
                                {t('sch_new_apt')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {viewMode === 'calendar' ? renderCalendar() : (
                <>
                    {/* Stats Grid */}
                    <div className="schedule-stats-grid">
                        <div className="stat-card-premium animate-slide-up delay-100">
                            <div className="floating-icon primary">
                                <CalendarIcon size={28} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">{t('dash_appointments')}</div>
                                <div className="stat-value">
                                    {(() => {
                                        const userIsClinical = staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor';
                                        const effectiveFilter = userIsClinical ? (DOCTOR_MAP[user?.email?.toLowerCase()] || staff?.name) : doctorFilter;
                                        return appointments.filter(apt => (effectiveFilter === 'All' || apt.dentist === effectiveFilter) && isSameDay(new Date(apt.date), currentDate)).length;
                                    })()} <span>{t('sch_today_count_label')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Queue Section */}
                    <div className="schedule-table-card">
                        <div className="queue-tabs-container">
                            {(() => {
                                const userIsClinical = staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor';
                                const effectiveFilter = userIsClinical ? (DOCTOR_MAP[user?.email?.toLowerCase()] || staff?.name) : doctorFilter;
                                
                                const todaysAll = appointments.filter(apt => (effectiveFilter === 'All' || apt.dentist === effectiveFilter) && isSameDay(new Date(apt.date), currentDate));
                                
                                const countToday = todaysAll.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.queueStatus !== 'In Progress').length;
                                const countInProgress = todaysAll.filter(a => a.queueStatus === 'In Progress' && a.status !== 'Completed').length;
                                const countCompleted = todaysAll.filter(a => a.status === 'Completed').length;

                                return (
                                    <>
                                        <button 
                                            onClick={() => setActiveQueueTab('today')}
                                            className={`queue-tab-btn today ${activeQueueTab === 'today' ? 'active' : ''}`}
                                        >
                                            <CalendarIcon size={18} /> 
                                            {language === 'TH' ? 'นัดหมายวันนี้' : 'Today'}
                                            <span className="tab-badge">{countToday}</span>
                                        </button>
                                        <button 
                                            onClick={() => setActiveQueueTab('inprogress')}
                                            className={`queue-tab-btn inprogress ${activeQueueTab === 'inprogress' ? 'active' : ''}`}
                                        >
                                            <Stethoscope size={18} /> 
                                            {language === 'TH' ? 'กำลังรับบริการ' : 'In Progress'}
                                            <span className="tab-badge">{countInProgress}</span>
                                        </button>
                                        <button 
                                            onClick={() => setActiveQueueTab('completed')}
                                            className={`queue-tab-btn completed ${activeQueueTab === 'completed' ? 'active' : ''}`}
                                        >
                                            <CheckCircle size={18} /> 
                                            {language === 'TH' ? 'เสร็จแล้ว' : 'Completed'}
                                            <span className="tab-badge">{countCompleted}</span>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="table-subheader">
                            <h3>
                                {t('sch_today_agenda')} - {format(currentDate, 'dd MMMM yyyy', { locale: language === 'TH' ? th : enUS })}
                            </h3>
                            <div className="source-badges">
                                <div className="source-pill-line">
                                    <div className="status-dot-active" />
                                    {language === 'TH' ? 'จองผ่าน LINE' : 'LINE Booking'}
                                </div>
                                <div className="source-pill-staff">
                                    <User size={14} />
                                    {language === 'TH' ? 'ลงนัดโดยพนักงาน' : 'Staff Booking'}
                                </div>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>{t('sch_col_time')}</th>
                                    <th>{language === 'TH' ? 'ช่องทาง' : 'Source'}</th>
                                    <th>{language === 'TH' ? 'คิว' : 'Queue'}</th>
                                    <th>{t('sch_col_patient')}</th>
                                    <th>{t('sch_col_procedure')}</th>
                                    <th>{language === 'TH' ? 'มาถึง' : 'Arrived'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'จัดการ' : 'Manage'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const userIsClinical = staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor';
                                    const effectiveFilter = userIsClinical ? (DOCTOR_MAP[user?.email?.toLowerCase()] || staff?.name) : doctorFilter;
                                    
                                    return appointments
                                        .filter(apt => (effectiveFilter === 'All' || apt.dentist === effectiveFilter) && isSameDay(new Date(apt.date), currentDate))
                                        .filter(apt => {
                                            if (activeQueueTab === 'today') {
                                                return apt.status !== 'Completed' && apt.status !== 'Cancelled' && apt.queueStatus !== 'In Progress';
                                            } else if (activeQueueTab === 'inprogress') {
                                                return apt.queueStatus === 'In Progress' && apt.status !== 'Completed';
                                            } else if (activeQueueTab === 'completed') {
                                                return apt.status === 'Completed';
                                            }
                                            return true;
                                        })
                                        .sort((a, b) => {
                                            // 1. Prioritize people who have arrived (checked-in)
                                            if (a.checkInTime && !b.checkInTime) return -1;
                                            if (!a.checkInTime && b.checkInTime) return 1;
                                            
                                            // 2. Both arrived: sort by check-in time (who came first)
                                            if (a.checkInTime && b.checkInTime) {
                                                return new Date(a.checkInTime) - new Date(b.checkInTime);
                                            }
                                            
                                            // 3. Neither arrived: sort by appointment time
                                            return a.time.localeCompare(b.time);
                                        });
                                })().map((apt, index) => {
                                    // Clean up notes for display (remove technical tags)
                                    const displayNotes = (apt.notes || '')
                                        .replace(/📱 \[LINE\]\s?/g, '')
                                        .replace(/\[Walk-in\]\s?/g, '')
                                        .trim();

                                    return (
                                        <tr key={index} className="hover:bg-neutral-50 transition-colors">
                                            <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{apt.time}</td>
                                            <td>
                                                <div className="source-cell">
                                                    {apt.type === 'LINE Booking' ? (
                                                        <div className="source-pill-line mini">
                                                            <span>📱</span>
                                                            {language === 'TH' ? 'จองผ่าน LINE' : 'LINE'}
                                                        </div>
                                                    ) : (
                                                        <div className="source-pill-staff mini">
                                                            <User size={12} />
                                                            {language === 'TH' ? 'Staff' : 'Staff'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                                                        {apt.queueNumber || '-'}
                                                    </span>
                                                    {apt.queueStatus && apt.queueStatus !== 'Waiting' && (
                                                        <span style={{ fontSize: '0.7rem', color: apt.queueStatus === 'In Progress' ? '#16a34a' : '#94a3b8' }}>
                                                            {apt.queueStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{apt.patientName || apt.patient}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <span style={{ fontWeight: 500 }}>{apt.treatment || apt.procedure}</span>
                                                    {displayNotes && (
                                                        <div style={{ 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.25rem', 
                                                            padding: '0.15rem 0.5rem', 
                                                            background: displayNotes.includes('เลื่อนนัด') ? '#FFF7ED' : '#F1F5F9', 
                                                            color: displayNotes.includes('เลื่อนนัด') ? '#C2410C' : '#475569', 
                                                            border: displayNotes.includes('เลื่อนนัด') ? '1px solid #FFEDD5' : '1px solid #E2E8F0',
                                                            borderRadius: '4px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            width: 'fit-content'
                                                        }}>
                                                            {displayNotes.includes('เลื่อนนัด') && <span>🔄</span>}
                                                            {displayNotes}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="status-action-cell">
                                                    {apt.checkInTime ? (
                                                        <div className="arrived-status">
                                                            <div className="arrival-badge">
                                                                <CheckCircle size={14} /> {new Date(apt.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <span className="on-time-label">{language === 'TH' ? 'มาตามเวลานัด' : 'On Time'}</span>
                                                            <button className="confirm-apt-btn">
                                                                {language === 'TH' ? 'ยืนยันการนัดหมาย' : 'Confirm Appt'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="un-arrived-status">
                                                            <button 
                                                                className="record-arrival-btn"
                                                                onClick={() => {
                                                                    updateAppointment(apt.id, {
                                                                        status: 'Waiting',
                                                                        queueStatus: 'Waiting',
                                                                        checkInTime: new Date().toISOString()
                                                                    });
                                                                }}
                                                            >
                                                                <Clock size={14} /> {language === 'TH' ? 'บันทึกมาถึง' : 'Record Arrival'}
                                                            </button>
                                                            <button 
                                                                className="status-pill-trigger"
                                                                onClick={() => {
                                                                    setStatusUpdatingApt(apt);
                                                                    setIsStatusModalOpen(true);
                                                                }}
                                                                style={{ 
                                                                    background: getStatusInfo(apt.status).bgColor, 
                                                                    color: getStatusInfo(apt.status).color,
                                                                    border: `1px solid ${getStatusInfo(apt.status).borderColor}`
                                                                }}
                                                            >
                                                                {language === 'TH' 
                                                                    ? (apt.status === 'Pending' || !apt.status ? 'รอระบุ' : getStatusInfo(apt.status).label) 
                                                                    : (apt.status || 'Pending')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                                                    {/* Control Buttons Group */}
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button 
                                                            className="btn-icon"
                                                            onClick={() => {
                                                                setSelectedAptForVitals(apt);
                                                                setIsVitalsModalOpen(true);
                                                            }}
                                                            style={{ 
                                                                background: 'white', color: '#00ccff', border: '1px solid #00ccff', 
                                                                borderRadius: '10px', width: '40px', height: '40px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                            title={language === 'TH' ? 'บันทึกข้อมูลก่อนรับบริการ' : 'Vitals'}
                                                        >
                                                            <Clipboard size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Enter exam room button */}
                                                    {activeQueueTab !== 'inprogress' && activeQueueTab !== 'completed' && (
                                                        <button
                                                            onClick={() => {
                                                                setCallingApt(apt);
                                                                setIsRoomSelectionModalOpen(true);
                                                            }}
                                                            style={{
                                                                background: 'var(--gradient-primary)',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '0.6rem 1.25rem',
                                                                borderRadius: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                fontWeight: 800,
                                                                fontSize: '0.95rem',
                                                                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
                                                                cursor: 'pointer',
                                                                minWidth: '140px'
                                                            }}
                                                        >
                                                            <div style={{ padding: '0.2rem', background: 'rgba(255,255,255,0.2)', borderRadius: '6px' }}>
                                                                <LogIn size={16} />
                                                            </div>
                                                            {language === 'TH' ? 'เข้าห้องตรวจ' : 'Enter Exam'}
                                                        </button>
                                                    )}
                                                    {activeQueueTab === 'inprogress' && (
                                                        <button
                                                            onClick={() => {
                                                                setCallingApt(apt);
                                                                setIsRoomSelectionModalOpen(true);
                                                            }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '0.6rem 1.25rem',
                                                                borderRadius: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                fontWeight: 800,
                                                                fontSize: '0.95rem',
                                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                                                cursor: 'pointer',
                                                                minWidth: '140px'
                                                            }}
                                                        >
                                                            <div style={{ padding: '0.2rem', background: 'rgba(255,255,255,0.2)', borderRadius: '6px' }}>
                                                                <Stethoscope size={16} />
                                                            </div>
                                                            {language === 'TH' ? 'ห้องตรวจ' : 'Treatment'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {renderStatusModal()}
            {renderRoomSelectionModal()}
        </div>
    );
};

export default Schedule;
