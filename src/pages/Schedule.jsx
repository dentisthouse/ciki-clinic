import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronRight, Plus, List, ChevronLeft, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import AppointmentModal from '../components/Scheduling/AppointmentModal';
import WalkInModal from '../components/Scheduling/WalkInModal';

const Schedule = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { patients, appointments, addAppointment, updateAppointment, updateQueueStatus } = useData();
    
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
                alert(language === 'TH' ? `ส่ง Flex Message ยืนยันนัดไปยัง LINE คุณ ${apt.patientName || apt.patient} เรียบร้อยแล้ว!` : `Sent Flex Message confirmation to ${apt.patientName || apt.patient} on LINE!`);
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

    // Check for query params (e.g., from Dashboard "New Appointment")
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'new') {
            setIsModalOpen(true);
            // Clean up URL
            navigate('/schedule', { replace: true });
        }
    }, [location, navigate]);

    const handleSaveAppointment = (newApt) => {
        addAppointment(newApt);
        setIsModalOpen(false);
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
                            const dayAppointments = appointments.filter(apt => isSameDay(new Date(apt.date), day));

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        minHeight: '120px',
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--neutral-100)',
                                        borderRight: '1px solid var(--neutral-100)',
                                        backgroundColor: isCurrentMonth ? 'white' : 'var(--neutral-50)',
                                        position: 'relative'
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

            <WalkInModal
                isOpen={isWalkInModalOpen}
                onClose={() => setIsWalkInModalOpen(false)}
                onSave={(newApt) => {
                    addAppointment(newApt);
                    // navigate(`/patients/${newApt.patientId}`); // Option to go to profile immediately
                }}
            />

            {/* Page Header */}
            <div className="page-header">
                <div className="page-title-group">
                    <h1>{t('sch_title')}</h1>
                    <p>{t('sch_subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setIsWalkInModalOpen(true)}
                        style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                    >
                        <User size={18} style={{ marginRight: '8px' }} />
                        {t('sch_walk_in') || 'Walk-in'}
                    </button>
                    <button
                        className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                    >
                        {viewMode === 'list' ? <CalendarIcon size={16} /> : <List size={16} />}
                        {viewMode === 'list' ? t('sch_view_calendar') : t('sch_view_list')}
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        {t('sch_new_apt')}
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? renderCalendar() : (
                <>
                    {/* Stats Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div className="card glass-panel-premium animate-slide-up delay-100" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
                            <div className="floating-icon" style={{ padding: '0.85rem', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(20, 184, 166, 0.2)' }}>
                                <CalendarIcon size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{t('dash_appointments')}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{appointments.filter(apt => isSameDay(new Date(apt.date), new Date())).length} {t('sch_today_count_label')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="table-container shadow-sm">
                        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.125rem' }}>{t('sch_today_agenda')}</h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'flex', gap: '1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></div>
                                    {language === 'TH' ? 'จองผ่าน LINE' : 'LINE Booking'}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                    {language === 'TH' ? 'พนักงานลงนัด' : 'Staff Booking'}
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
                                    <th>{t('sch_col_status')}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments
                                    .filter(apt => isSameDay(new Date(apt.date), new Date()))
                                    .sort((a, b) => a.time.localeCompare(b.time))
                                    .map((apt, index) => (
                                        <tr key={index} className="hover:bg-neutral-50 transition-colors">
                                            <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{apt.time}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {apt.type === 'LINE Booking' ? (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.35rem', 
                                                            padding: '0.25rem 0.6rem', 
                                                            background: '#EFF6FF', 
                                                            color: '#2563EB',
                                                            borderRadius: '20px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600
                                                        }}>
                                                            <div style={{ fontSize: '1rem' }}>📱</div>
                                                            {language === 'TH' ? 'จองเอง' : 'Portal'}
                                                        </div>
                                                    ) : (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.35rem', 
                                                            padding: '0.25rem 0.6rem', 
                                                            background: '#F8FAFC', 
                                                            color: '#64748B',
                                                            borderRadius: '20px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600
                                                        }}>
                                                            <User size={12} />
                                                            {language === 'TH' ? 'ลงนัด' : 'Staff'}
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
                                            <td>{apt.procedure}</td>
                                            <td>
                                                <span style={{
                                                    background:
                                                        apt.status === 'Completed' ? '#dcfce7' :
                                                            apt.status === 'In Progress' ? '#dbeafe' :
                                                                '#f3f4f6',
                                                    color:
                                                        apt.status === 'Completed' ? '#166534' :
                                                            apt.status === 'In Progress' ? '#1e40af' :
                                                                '#4b5563',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    display: 'inline-block'
                                                }}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    {apt.status !== 'Completed' && (
                                                        <>
                                                            <button
                                                                className="btn"
                                                                style={{
                                                                    padding: '0.4rem 0.8rem',
                                                                    fontSize: '0.75rem',
                                                                    backgroundColor: '#E0F2FE',
                                                                    color: '#0369A1',
                                                                    border: 'none',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    fontWeight: 600
                                                                }}
                                                                onClick={() => handleSendLineConfirmation(apt)}
                                                            >
                                                                <span style={{ marginRight: '4px' }}>💬</span>
                                                                {language === 'TH' ? 'ส่งยืนยัน' : 'Send Conf.'}
                                                            </button>

                                                            {(!apt.queueStatus || apt.queueStatus === 'Waiting' || apt.queueStatus === 'Skipped') && (
                                                                <button
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        fontSize: '0.75rem',
                                                                        backgroundColor: apt.queueStatus === 'Skipped' ? '#94a3b8' : '#f59e0b',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: 'var(--radius-md)'
                                                                    }}
                                                                    onClick={() => {
                                                                        if (apt.queueStatus === 'Waiting' || !apt.queueStatus) {
                                                                            // Call
                                                                            updateQueueStatus(apt.id, 'In Progress');
                                                                        } else {
                                                                            // Re-queue
                                                                            updateQueueStatus(apt.id, 'Waiting');
                                                                        }
                                                                    }}
                                                                >
                                                                    {apt.queueStatus === 'Skipped' ? (language === 'TH' ? 'รอเรียกใหม่' : 'Re-queue') : (language === 'TH' ? 'เรียกคิว' : 'Call')}
                                                                </button>
                                                            )}

                                                            {apt.queueStatus === 'In Progress' && (
                                                                <button
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        fontSize: '0.75rem',
                                                                        backgroundColor: '#059669', // Green for Complete
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: 'var(--radius-md)'
                                                                    }}
                                                                    onClick={() => {
                                                                        navigate(`/patients/${apt.patientId || 'P001'}?tab=billing`);
                                                                        updateQueueStatus(apt.id, 'Completed');
                                                                    }}
                                                                >
                                                                    {language === 'TH' ? 'ส่งจ่ายเงิน' : 'To Billing'}
                                                                </button>
                                                            )}

                                                            {!apt.checkInTime && (
                                                                <button
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '0.4rem 0.8rem',
                                                                        fontSize: '0.75rem',
                                                                        backgroundColor: 'var(--primary-600)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: 'var(--radius-md)'
                                                                    }}
                                                                    onClick={() => {
                                                                        updateAppointment(apt.id, {
                                                                            status: 'Waiting',
                                                                            queueStatus: 'Waiting',
                                                                            checkInTime: new Date().toISOString()
                                                                        });
                                                                    }}
                                                                >
                                                                    {language === 'TH' ? 'เช็คอิน' : 'Check-in'}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem', borderRadius: '50%' }}
                                                        onClick={() => navigate(`/patients/${apt.patientId || 'mock-id'}`)}
                                                    >
                                                        <ChevronRight size={16} />
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
