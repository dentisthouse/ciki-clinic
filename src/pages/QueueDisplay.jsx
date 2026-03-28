import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Volume2, User, Clock, Calendar } from 'lucide-react';

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

    const formatTime = (date) => {
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="queue-container">
            {/* Modern Header */}
            <header className="queue-header">
                <div className="header-brand">
                    <div className="logo-box">
                        <img src="/logo.png" alt="บ้านหมอฟัน" />
                    </div>
                    <div className="brand-text">
                        <h1>บ้านหมอฟัน</h1>
                        <p>Dental Home Clinic</p>
                    </div>
                </div>
                <div className="header-time">
                    <div className="time-display">
                        <Clock size={28} />
                        <span className="time-text">{formatTime(currentTime)}</span>
                    </div>
                    <div className="date-display">
                        <Calendar size={18} />
                        <span>{formatDate(currentTime)}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="queue-main">
                {/* Current Queue Card */}
                <div className="current-queue-section">
                    <div className="section-badge calling">
                        <span className="pulse-dot"></span>
                        <Volume2 size={24} />
                        <span>{language === 'TH' ? 'กำลังเรียก' : 'NOW CALLING'}</span>
                    </div>

                    {currentQueue ? (
                        <div className="current-queue-content">
                            <div className="queue-number-large">{currentQueue.queueNumber}</div>
                            <div className="patient-name">{currentQueue.patientName}</div>
                            <div className="room-badge">
                                {language === 'TH' ? 'ห้องตรวจ 1' : 'Room 1'}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="coffee-icon">☕</div>
                            <p className="empty-title">{language === 'TH' ? 'ไม่มีคิว' : 'No Queue'}</p>
                            <p className="empty-subtitle">{language === 'TH' ? 'รอรับบริการ' : 'Waiting for service'}</p>
                        </div>
                    )}
                </div>

                {/* Next Queue List */}
                <div className="next-queue-section">
                    <h2 className="next-queue-title">
                        <span>{language === 'TH' ? 'คิวถัดไป' : 'Next Queue'}</span>
                        <span className="queue-count">{nextQueues.length}</span>
                    </h2>

                    {nextQueues.length > 0 ? (
                        <div className="queue-list">
                            {nextQueues.map((q, i) => (
                                <div key={i} className="queue-card">
                                    <div className="queue-info">
                                        <div className="queue-number">{q.queueNumber}</div>
                                        <div className="queue-patient">{q.patientName}</div>
                                    </div>
                                    <div className="queue-status">
                                        <span className="status-badge">
                                            {language === 'TH' ? 'รอเรียก' : 'Waiting'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="next-empty">
                            <p>{language === 'TH' ? 'ว่าง' : 'Empty'}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modern Footer */}
            <footer className="queue-footer">
                <div className="footer-content">
                    <span className="footer-icon">📄</span>
                    <span>ต้องการใบรับรองแพทย์แจ้งเจ้าหน้าที่ก่อนเข้ารับบริการ</span>
                    <span className="footer-separator">|</span>
                    <span>If you need a medical certificate, please inform the staff</span>
                    <span className="footer-separator">|</span>
                    <span>บ้านหมอฟัน ยินดีให้บริการ</span>
                </div>
            </footer>

            <style>{`
                .queue-container {
                    min-height: 100vh;
                    width: 100vw;
                    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                /* Modern Header */
                .queue-header {
                    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #22c55e 100%);
                    padding: 1.5rem 3rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                    box-shadow: 0 8px 32px rgba(5, 150, 105, 0.3);
                }

                .header-brand {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }

                .logo-box {
                    width: 72px;
                    height: 72px;
                    background: white;
                    border-radius: 20px;
                    padding: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .brand-text h1 {
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .brand-text p {
                    margin: 0.25rem 0 0 0;
                    font-size: 1rem;
                    opacity: 0.9;
                    font-weight: 500;
                    letter-spacing: 0.1em;
                }

                .header-time {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.5rem;
                }

                .time-display {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 2.75rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .date-display {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.1rem;
                    opacity: 0.95;
                    font-weight: 500;
                }

                /* Main Content */
                .queue-main {
                    flex: 1;
                    padding: 2rem 3rem;
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    gap: 2.5rem;
                    max-width: 1600px;
                    margin: 0 auto;
                    width: 100%;
                }

                /* Current Queue Section */
                .current-queue-section {
                    background: white;
                    border-radius: 40px;
                    padding: 2.5rem;
                    box-shadow: 
                        0 20px 60px rgba(0, 0, 0, 0.08),
                        0 0 0 1px rgba(0, 0, 0, 0.03);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .current-queue-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #22c55e, #10b981, #059669);
                }

                .section-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 2rem;
                    border-radius: 50px;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 2.5rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }

                .section-badge.calling {
                    background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
                    color: #166534;
                    border: 2px solid #22c55e;
                }

                .pulse-dot {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #22c55e;
                    animation: pulse-dot 2s infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { 
                        transform: scale(1); 
                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                    }
                    50% { 
                        transform: scale(1.1); 
                        box-shadow: 0 0 0 12px rgba(34, 197, 94, 0);
                    }
                }

                .current-queue-content {
                    text-align: center;
                    width: 100%;
                }

                .queue-number-large {
                    font-size: 10rem;
                    font-weight: 900;
                    color: #1f2937;
                    line-height: 1;
                    letter-spacing: -0.05em;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .patient-name {
                    font-size: 2.5rem;
                    color: #4b5563;
                    font-weight: 600;
                    margin-bottom: 2rem;
                }

                .room-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 1.25rem 3rem;
                    border-radius: 20px;
                    font-size: 2rem;
                    font-weight: 700;
                    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                }

                .coffee-icon {
                    font-size: 6rem;
                    margin-bottom: 1.5rem;
                    filter: grayscale(0.3);
                    opacity: 0.8;
                }

                .empty-title {
                    font-size: 2.5rem;
                    color: #9ca3af;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                }

                .empty-subtitle {
                    font-size: 1.5rem;
                    color: #d1d5db;
                    margin: 0;
                }

                /* Next Queue Section */
                .next-queue-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .next-queue-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #374151;
                    margin: 0;
                    padding: 0 0.5rem;
                }

                .queue-count {
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    font-weight: 700;
                }

                .queue-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .queue-card {
                    background: white;
                    border-radius: 24px;
                    padding: 1.75rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                    border-left: 5px solid #f59e0b;
                    transition: all 0.3s ease;
                }

                .queue-card:hover {
                    transform: translateX(4px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                }

                .queue-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .queue-number {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #1f2937;
                    line-height: 1;
                }

                .queue-patient {
                    font-size: 1.25rem;
                    color: #6b7280;
                    font-weight: 500;
                }

                .status-badge {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    color: #92400e;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    border: 2px solid #fbbf24;
                }

                .next-empty {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.6);
                    border-radius: 24px;
                    border: 3px dashed #d1d5db;
                    min-height: 200px;
                }

                .next-empty p {
                    font-size: 1.75rem;
                    color: #9ca3af;
                    font-weight: 600;
                }

                /* Modern Footer */
                .queue-footer {
                    background: linear-gradient(90deg, #064e3b 0%, #065f46 50%, #047857 100%);
                    color: white;
                    padding: 1.25rem 3rem;
                    text-align: center;
                }

                .footer-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: 1.1rem;
                    font-weight: 500;
                    flex-wrap: wrap;
                }

                .footer-icon {
                    font-size: 1.25rem;
                }

                .footer-separator {
                    opacity: 0.5;
                    font-weight: 300;
                }

                /* Responsive */
                @media (max-width: 1200px) {
                    .queue-main {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }

                    .queue-number-large {
                        font-size: 7rem;
                    }

                    .patient-name {
                        font-size: 1.75rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default QueueDisplay;
