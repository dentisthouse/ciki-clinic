import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Clock, User, ArrowRight } from 'lucide-react';

const QueueDisplay = () => {
    const { t, language } = useLanguage();
    const { appointments } = useData();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [queueList, setQueueList] = useState([]);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter appointments for today and simulate queue data
    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        // Filter appointments for today
        const todaysApts = appointments
            .filter(apt => apt.date.startsWith(todayStr) && apt.status !== 'Cancelled')
            .map(apt => ({
                ...apt,
                // Ensure queueNumber exists (legacy support)
                queueNumber: apt.queueNumber || 'A-XX',
                queueStatus: apt.queueStatus || 'Waiting'
            }));

        setQueueList(todaysApts);
    }, [appointments]);

    // Current Queue: First one "In Progress"
    const currentQueue = queueList.find(q => q.queueStatus === 'In Progress');

    // Next Queues: "Waiting", sorted by queue number or time
    const nextQueues = queueList
        .filter(q => q.queueStatus === 'Waiting')
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 3);

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: '#f0fdf4',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            overflow: 'hidden',
            fontFamily: "'Prompt', sans-serif"
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                padding: '1.5rem 3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'white',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px'
                    }}>🦷</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>บ้านหมอฟัน</h1>
                        <p style={{ margin: 0, fontSize: '1.25rem', opacity: 0.9 }}>Queue Management System</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1 }}>
                        {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '1.25rem', opacity: 0.9 }}>
                        {currentTime.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '2rem 3rem', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '3rem', height: '100%' }}>

                {/* Current Queue (Calling) */}
                <div style={{
                    background: 'white',
                    borderRadius: '32px',
                    padding: '2rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid #10b981',
                    height: '100%'
                }}>
                    <div style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '0.75rem 2.5rem',
                        borderRadius: '50px',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        boxShadow: '0 4px 15px rgba(22, 101, 52, 0.1)'
                    }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#22c55e', display: 'block' }} className="animate-pulse"></span>
                        {language === 'TH' ? 'กำลังเรียก' : 'NOW CALLING'}
                    </div>

                    {currentQueue ? (
                        <>
                            <div style={{ fontSize: '12rem', fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>
                                {currentQueue.queueNumber}
                            </div>
                            <div style={{ fontSize: '3.5rem', color: '#4b5563', marginTop: '1rem', fontWeight: 600 }}>
                                {currentQueue.patientName}
                            </div>
                            <div style={{
                                marginTop: '4rem',
                                background: '#10b981',
                                color: 'white',
                                padding: '1.5rem 4rem',
                                borderRadius: '24px',
                                fontSize: '3rem',
                                fontWeight: 700,
                                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                            }}>
                                {language === 'TH' ? 'ห้องตรวจ 1' : 'Room 1'}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                            <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>☕</div>
                            <p style={{ fontSize: '2.5rem' }}>{language === 'TH' ? 'ไม่มีคิวรอ' : 'No Waiting Queue'}</p>
                        </div>
                    )}
                </div>

                {/* Waiting List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#374151', paddingLeft: '1rem', marginBottom: '0.5rem' }}>
                        {language === 'TH' ? 'คิวถัดไป' : 'Next Queue'}
                    </div>

                    {nextQueues.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                            {nextQueues.map((q, i) => (
                                <div key={i} style={{
                                    background: 'white',
                                    borderRadius: '24px',
                                    padding: '2rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                    borderLeft: '12px solid #f59e0b'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '4rem', fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>
                                            {q.queueNumber}
                                        </div>
                                        <div style={{ fontSize: '1.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                            {q.patientName}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#fef3c7',
                                        color: '#b45309',
                                        padding: '1rem 2rem',
                                        borderRadius: '20px',
                                        fontSize: '1.8rem',
                                        fontWeight: 700
                                    }}>
                                        {language === 'TH' ? 'รอเรียก' : 'Waiting'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.5)',
                            borderRadius: '32px',
                            color: '#9ca3af',
                            border: '2px dashed #cbd5e1'
                        }}>
                            <p style={{ fontSize: '2rem' }}>{language === 'TH' ? 'ว่าง' : 'Empty'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer marquee */}
            <div style={{
                background: '#064e3b',
                color: 'white',
                padding: '1.5rem',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
            }}>
                <div style={{
                    display: 'inline-block',
                    animation: 'marquee 20s linear infinite',
                    fontSize: '1.5rem',
                    fontWeight: 500
                }}>
                    กรุณาเตรียมบัตรประชาชนเพื่อยืนยันตัวตนก่อนเข้ารับบริการ • Please prepare your ID card for verification before service • บ้านหมอฟัน ยินดีให้บริการ
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
                .animate-pulse {
                    animation: pulse 2s infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
};

export default QueueDisplay;
