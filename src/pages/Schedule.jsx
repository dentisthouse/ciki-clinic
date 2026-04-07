import { Calendar as CalendarIcon, ChevronRight, Plus, List, ChevronLeft, User, Volume2, RefreshCw, Clock, CheckCircle, Edit3, Clipboard, Stethoscope, PhoneOff, LogIn } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import AppointmentModal from '../components/Scheduling/AppointmentModal';
import WalkInModal from '../components/Scheduling/WalkInModal';
import InitialVitalsModal from '../components/Scheduling/InitialVitalsModal';

const Schedule = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, staff, permissions } = useAuth();
    const { patients, appointments, addAppointment, updateAppointment, updateQueueStatus, syncData } = useData();
    
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
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
            
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
            alert(language === 'TH' ? 'ไม่สารมารถส่ง LINE ได้ กรุณาตรวจสอบว่า Backend Server กำลังทำงานอยู่' : 'Could not send LINE message. Please check if the Backend Server is running.');
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
    const handleCallQueue = (apt) => {
        // Update queue status to In Progress with room
        updateQueueStatus(apt.id, 'In Progress', selectedRoom);
        
        // Create voice announcement text
        const roomText = selectedRoom === 'Room 1' ? 'ห้องตรวจหนึ่ง' : 
                        selectedRoom === 'Room 2' ? 'ห้องตรวจสอง' : 
                        selectedRoom === 'Room 3' ? 'ห้องตรวจสาม' : selectedRoom;
        
        const announcement = `ขอเชิญคุณ ${apt.patientName || apt.patient} หมายเลขคิว ${apt.queueNumber} กรุณาเข้ารับบริการที่ ${roomText}`;
        
        // Use Text-to-Speech API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(announcement);
            utterance.lang = 'th-TH';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
        
        // Store announcement in localStorage for Queue Display page
        const announcementData = {
            patientName: apt.patientName || apt.patient,
            queueNumber: apt.queueNumber,
            room: selectedRoom,
            timestamp: new Date().toISOString(),
            announcement: announcement
        };
        localStorage.setItem('lastQueueCall', JSON.stringify(announcementData));
        
        // Show confirmation
        alert(language === 'TH' ? 
            `เรียกคิว ${apt.queueNumber} - ${apt.patientName || apt.patient} ไปที่ ${selectedRoom}` : 
            `Called queue ${apt.queueNumber} - ${apt.patientName || apt.patient} to ${selectedRoom}`);
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

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
                <div className="card shadow-sm" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Calendar Controls */}
                    <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-100)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            {format(currentDate, 'MMMM yyyy', { locale: language === 'TH' ? th : enUS })}
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={prevMonth}><ChevronLeft size={20} /></button>
                            <button className="btn btn-secondary" onClick={nextMonth}><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    {/* Week Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-100)' }}>
                        {(language === 'TH' ? weekDaysTH : weekDays).map(day => (
                            <div key={day} style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--neutral-500)', fontSize: '0.875rem' }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
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
                                    className="calendar-day-hover"
                                    style={{
                                        minHeight: '120px',
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--neutral-100)',
                                        borderRight: '1px solid var(--neutral-100)',
                                        backgroundColor: isCurrentMonth ? 'white' : 'var(--neutral-50)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        textAlign: 'right',
                                        marginBottom: '0.5rem',
                                        fontWeight: isToday ? 700 : 400,
                                        color: isToday ? 'var(--primary-600)' : isCurrentMonth ? 'var(--neutral-900)' : 'var(--neutral-400)'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '28px',
                                            height: '28px',
                                            lineHeight: '28px',
                                            textAlign: 'center',
                                            backgroundColor: isToday ? 'var(--primary-100)' : 'transparent',
                                            borderRadius: '50%'
                                        }}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {dayAppointments.map((apt, i) => (
                                            <div key={i} style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                                backgroundColor: 'var(--primary-50)',
                                                color: 'var(--primary-700)',
                                                borderLeft: '2px solid var(--primary-500)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {apt.time} {(apt.patientName || apt.patient || '').split(' ')[0]}
                                            </div>
                                        ))}
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
            <div className="glass-panel-premium animate-fade-in" style={{ 
                padding: '2.5rem', marginBottom: '2.5rem', 
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--neutral-100)',
                background: 'linear-gradient(135deg, white 0%, var(--primary-50) 100%)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--neutral-900)', letterSpacing: '-0.04em' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--primary-600)', borderRadius: '16px', color: 'white', boxShadow: 'var(--shadow-md)' }}>
                                <CalendarIcon size={32} />
                            </div>
                            {t('sch_title')}
                        </h1>
                        <p style={{ color: 'var(--neutral-500)', fontWeight: 600, marginTop: '0.5rem', fontSize: '1.1rem', marginLeft: '4.5rem' }}>
                            {t('sch_subtitle')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-secondary" style={{ 
                            padding: '0.75rem', borderRadius: '12px', background: 'white', border: '1.5px solid var(--neutral-200)' 
                        }} onClick={() => syncData()} title="Sync">
                            <RefreshCw size={20} color="var(--primary-600)" />
                        </button>
                        <button className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`} style={{
                            padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '0.65rem'
                        }} onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}>
                            {viewMode === 'list' ? <CalendarIcon size={20} /> : <List size={20} />}
                            {viewMode === 'list' ? t('sch_view_calendar') : t('sch_view_list')}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <select 
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            disabled={staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor'}
                            style={{ 
                                padding: '0.8rem 1.5rem', 
                                borderRadius: '14px', 
                                border: '1.5px solid var(--neutral-200)',
                                background: (staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor') ? 'var(--neutral-50)' : 'white',
                                fontWeight: 800,
                                color: 'var(--neutral-800)',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                boxShadow: 'var(--shadow-sm)'
                            }}
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

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {(staff?.role?.toLowerCase() !== 'dentist' && staff?.role?.toLowerCase() !== 'doctor') && (
                            <button className="btn btn-accent" style={{ 
                                padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 800,
                                display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-100)', color: 'var(--accent-700)', border: 'none'
                            }} onClick={() => setIsWalkInModalOpen(true)}>
                                <User size={20} />
                                {t('sch_walk_in')}
                            </button>
                        )}
                        {(staff?.role?.toLowerCase() !== 'dentist' && staff?.role?.toLowerCase() !== 'doctor') && (
                            <button className="btn btn-primary" style={{ 
                                padding: '0.8rem 1.75rem', borderRadius: '14px', fontWeight: 900,
                                display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none',
                                background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-md)'
                            }} onClick={() => setIsModalOpen(true)}>
                                <Plus size={22} />
                                {t('sch_new_apt')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {viewMode === 'calendar' ? renderCalendar() : (
                <>
                    {/* Stats Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div className="card glass-panel-premium animate-slide-up delay-100" style={{ 
                            display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem',
                            background: 'var(--glass-premium-bg)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius-xl)'
                        }}>
                            <div className="floating-icon" style={{ 
                                padding: '1rem', background: 'var(--primary-50)', color: 'var(--primary-600)', 
                                borderRadius: '18px', boxShadow: 'var(--shadow-sm)' 
                            }}>
                                <CalendarIcon size={28} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 700, marginBottom: '0.25rem' }}>{t('dash_appointments')}</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>
                                    {(() => {
                                        const userIsClinical = staff?.role?.toLowerCase() === 'dentist' || staff?.role?.toLowerCase() === 'doctor';
                                        const effectiveFilter = userIsClinical ? (DOCTOR_MAP[user?.email?.toLowerCase()] || staff?.name) : doctorFilter;
                                        return appointments.filter(apt => (effectiveFilter === 'All' || apt.dentist === effectiveFilter) && isSameDay(new Date(apt.date), currentDate)).length;
                                    })()} <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neutral-400)' }}>{t('sch_today_count_label')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="table-container shadow-sm">
                        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.125rem' }}>
                                {t('sch_today_agenda')} - {format(currentDate, 'dd MMMM yyyy', { locale: language === 'TH' ? th : enUS })}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'flex', gap: '1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></div>
                                    {language === 'TH' ? 'จองผ่าน LINE' : 'LINE Booking'}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                    {language === 'TH' ? 'ลงนัดโดยพนักงาน' : 'Staff Booking'}
                                </span>
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
                                        .sort((a, b) => a.time.localeCompare(b.time));
                                })().map((apt, index) => (
                                        <tr key={index} className="hover:bg-neutral-50 transition-colors">
                                            <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{apt.time}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {apt.type === 'LINE Booking' ? (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.35rem', 
                                                            padding: '0.25rem 0.75rem', 
                                                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                                                            color: 'white',
                                                            borderRadius: '20px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                                            border: '1px solid rgba(255,255,255,0.1)'
                                                        }}>
                                                            <div style={{ fontSize: '0.9rem' }}>📱</div>
                                                            {language === 'TH' ? 'จองผ่าน LINE' : 'LINE Booking'}
                                                        </div>
                                                    ) : (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.35rem', 
                                                            padding: '0.25rem 0.75rem', 
                                                            background: '#f8fafc', 
                                                            color: '#64748b',
                                                            borderRadius: '20px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            border: '1px solid #e2e8f0'
                                                        }}>
                                                            <User size={12} />
                                                            {language === 'TH' ? 'ลงนัด (Staff)' : 'Staff'}
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
                                                    {apt.notes && apt.notes.includes('เลื่อนนัดมาจาก') && (
                                                        <div style={{ 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.25rem', 
                                                            padding: '0.15rem 0.5rem', 
                                                            background: '#FFF7ED', 
                                                            color: '#C2410C', 
                                                            border: '1px solid #FFEDD5',
                                                            borderRadius: '4px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            width: 'fit-content'
                                                        }}>
                                                            <span>🔄</span>
                                                            {apt.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                                    {apt.checkInTime ? (
                                                        <>
                                                            <div style={{ 
                                                                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                                                                background: '#f0fdf4', color: '#166534', 
                                                                padding: '0.3rem 0.75rem', borderRadius: '14px',
                                                                fontSize: '0.85rem', fontWeight: 700, border: '1px solid #dcfce7'
                                                            }}>
                                                                <CheckCircle size={14} /> {new Date(apt.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: 'none',
                                                                borderRadius: '6px', background: '#dcfce7', color: '#166534',
                                                                fontWeight: 700
                                                            }}>
                                                                {language === 'TH' ? 'มาตามเวลานัด' : 'On Time'}
                                                            </div>
                                                            <button style={{
                                                                padding: '0.4rem 1rem', background: 'transparent', border: '1.5px solid #22c55e',
                                                                color: '#22c55e', borderRadius: '24px', fontSize: '0.8rem', fontWeight: 800,
                                                                cursor: 'pointer'
                                                            }}>
                                                                {language === 'TH' ? 'ยืนยันการนัดหมาย' : 'Confirm Appt'}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => {
                                                                    updateAppointment(apt.id, {
                                                                        status: 'Waiting',
                                                                        queueStatus: 'Waiting',
                                                                        checkInTime: new Date().toISOString()
                                                                    });
                                                                }}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                                    padding: '0.4rem 0.75rem', background: 'white', border: '1.5px dashed #94a3b8',
                                                                    borderRadius: '24px', color: '#64748b', fontSize: '0.8rem', fontWeight: 600,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Clock size={14} /> {language === 'TH' ? 'บันทึกมาถึง' : 'Record Arrival'}
                                                            </button>
                                                            {apt.status === 'Cancelled' ? (
                                                                <div style={{ 
                                                                    fontSize: '0.75rem', padding: '0.15rem 0.6rem',
                                                                    borderRadius: '12px', background: '#fef2f2', color: '#ef4444',
                                                                    border: '1px solid #fee2e2', fontWeight: 700
                                                                }}>
                                                                    {language === 'TH' ? 'ยกเลิก' : 'Cancelled'}
                                                                </div>
                                                            ) : (
                                                                <div style={{ 
                                                                    fontSize: '0.75rem', padding: '0.15rem 0.6rem',
                                                                    borderRadius: '12px', background: '#f5f3ff', color: '#8b5cf6',
                                                                    border: '1px solid #ede9fe', fontWeight: 700
                                                                }}>
                                                                    {language === 'TH' ? 'รอระบุ' : 'Pending'}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                                                    {/* Control Buttons Group */}
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button 
                                                            className="btn-icon" 
                                                            style={{ 
                                                                background: '#fff7ed', color: '#f59e0b', border: '1px solid #ffedd5', 
                                                                borderRadius: '10px', width: '40px', height: '40px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                            title={language === 'TH' ? 'แก้ไข' : 'Edit'}
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
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
                                                    <button
                                                        onClick={() => handleCallQueue(apt)}
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
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Schedule;
