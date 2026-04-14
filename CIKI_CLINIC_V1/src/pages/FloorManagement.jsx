import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Stethoscope, 
    Activity, 
    Scan, 
    CreditCard, 
    Clock, 
    Bell, 
    X, 
    AlertCircle, 
    ChevronRight,
    User,
    CheckCircle2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const FloorManagement = () => {
    const { language } = useLanguage();
    const { appointments, alerts, clearAlert, updateLocation, updateQueueStatus } = useData();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time for duration calculations
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s
        return () => clearInterval(timer);
    }, []);

    const ROOMS = [
        { id: 'Waiting Room', name: language === 'TH' ? 'ห้องรอตรวจ' : 'Waiting Lounge', icon: Users, color: '#6366f1' },
        { id: 'Room 1', name: language === 'TH' ? 'ห้องฟัน 1' : 'Operatory 1', icon: Stethoscope, color: '#0ea5e9' },
        { id: 'Room 2', name: language === 'TH' ? 'ห้องฟัน 2' : 'Operatory 2', icon: Stethoscope, color: '#06b6d4' },
        { id: 'X-Ray Room', name: language === 'TH' ? 'ห้องเอ็กซเรย์' : 'X-Ray Room', icon: Scan, color: '#f59e0b' },
        { id: 'Check Out', name: language === 'TH' ? 'รอชำระเงิน' : 'Payment/Check-out', icon: CreditCard, color: '#10b981' }
    ];

    const getPatientsInRoom = (roomId) => {
        const today = new Date().toISOString().split('T')[0];
        return appointments.filter(apt => {
            const isToday = apt.date.startsWith(today);
            const isCompleted = apt.status === 'Completed';
            
            if (roomId === 'Waiting Room') {
                return isToday && apt.queueStatus === 'Waiting' && !apt.room;
            }
            return isToday && apt.room === roomId && !isCompleted;
        });
    };

    const calculateDuration = (startTime) => {
        if (!startTime) return '0m';
        const start = new Date(startTime);
        const diff = Math.floor((currentTime - start) / 60000);
        return `${diff}m`;
    };

    return (
        <div className="floor-management animate-slide-up" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>
            
            {/* Urgent Alerts Section */}
            {alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alerts.map(alert => (
                        <div key={alert.id} 
                            style={{ 
                                background: alert.type === 'Urgent' ? '#fef2f2' : '#fffbeb', 
                                border: `1.5px solid ${alert.type === 'Urgent' ? '#fca5a5' : '#fcd34d'}`,
                                borderRadius: '16px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                animation: 'pulse-subtle 2s infinite'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: alert.type === 'Urgent' ? '#ef4444' : '#f59e0b', color: 'white', padding: '0.5rem', borderRadius: '10px' }}>
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>{alert.message}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{alert.time} • {alert.room}</div>
                                </div>
                            </div>
                            <button onClick={() => clearAlert(alert.id)} style={{ border: 'none', background: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', color: 'var(--neutral-400)' }}>
                                <CheckCircle2 size={20} color="var(--success)" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Room Board */}
            <div style={{ 
                flex: 1, display: 'grid', gridTemplateColumns: `repeat(${ROOMS.length}, 1fr)`, gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem' 
            }}>
                {ROOMS.map(room => {
                    const patients = getPatientsInRoom(room.id);
                    const RoomIcon = room.icon;
                    
                    return (
                        <div key={room.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '240px' }}>
                            <div style={{ 
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', 
                                background: 'white', borderRadius: '20px', borderBottom: `4px solid ${room.color}`,
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <div style={{ color: room.color, background: `${room.color}15`, padding: '0.5rem', borderRadius: '12px' }}>
                                    <RoomIcon size={20} />
                                </div>
                                <div style={{ fontWeight: 800, color: 'var(--neutral-900)', whiteSpace: 'nowrap' }}>{room.name}</div>
                                <div style={{ marginLeft: 'auto', background: 'var(--neutral-100)', color: 'var(--neutral-500)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    {patients.length}
                                </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {patients.map(patient => (
                                    <div key={patient.id} className="patient-card card" style={{ padding: '1.25rem', borderRadius: '24px', position: 'relative', border: '1px solid var(--neutral-100)', boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>{patient.patientName}</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--neutral-50)', color: 'var(--neutral-500)', padding: '2px 8px', borderRadius: '8px' }}>
                                                {patient.queueNumber}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '1rem' }}>
                                            {patient.treatment}
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6366f1', fontWeight: 700 }}>
                                                <Clock size={12} /> {calculateDuration(patient.checkInTime || patient.time)}
                                            </div>
                                            
                                            {/* Transfer Actions */}
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                {room.id === 'Waiting Room' && (
                                                    <button onClick={() => updateQueueStatus(patient.id, 'In Progress')} className="btn-icon-sm" style={{ background: 'var(--primary-600)', color: 'white', borderRadius: '8px', padding: '4px 8px', fontSize: '0.7rem' }}>
                                                        {language === 'TH' ? 'เรียกเข้าห้อง' : 'Call In'}
                                                    </button>
                                                )}
                                                {room.id !== 'Check Out' && room.id !== 'Waiting Room' && (
                                                    <button onClick={() => updateLocation(patient.id, 'Check Out')} className="btn-icon-sm" style={{ background: '#10b981', color: 'white', borderRadius: '8px', padding: '4px 8px', fontSize: '0.7rem' }}>
                                                        {language === 'TH' ? 'เสร็จสิ้น' : 'Finish'}
                                                    </button>
                                                )}
                                                {room.id === 'Check Out' && (
                                                    <button onClick={() => updateQueueStatus(patient.id, 'Completed')} className="btn-icon-sm" style={{ background: 'var(--neutral-900)', color: 'white', borderRadius: '8px', padding: '4px 8px', fontSize: '0.7rem' }}>
                                                        {language === 'TH' ? 'จบคิว' : 'Paid'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {patients.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed var(--neutral-100)', borderRadius: '24px', opacity: 0.5 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-400)' }}>
                                            {language === 'TH' ? 'ว่าง' : 'Empty'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.01); }
                }
                .patient-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 20px -8px rgba(0,0,0,0.15) !important;
                    background: #f8fafc;
                }
                .btn-icon-sm {
                    border: none;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon-sm:hover {
                    opacity: 0.9;
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};

export default FloorManagement;
