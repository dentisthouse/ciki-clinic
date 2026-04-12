import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Volume2, User, Clock, Calendar, ChevronRight, Sparkles, Star } from 'lucide-react';

const QueueDisplay = () => {
    const { t, language } = useLanguage();
    const { appointments } = useData();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [queueList, setQueueList] = useState([]);
    const [lastAnnouncement, setLastAnnouncement] = useState(null);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter appointments for today
    useEffect(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const localTodayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

        const todaysApts = (appointments || [])
            .filter(apt => {
                if (!apt || !apt.date) return false;
                const aptDate = String(apt.date).replace(/\//g, '-'); // Normalize YYYY/MM/DD to YYYY-MM-DD
                return (aptDate.startsWith(todayStr) || aptDate.startsWith(localTodayStr)) && apt.status !== 'Cancelled';
            })
            .map(apt => ({
                ...apt,
                id: apt.id || Math.random().toString(36).substr(2, 9),
                queueNumber: apt.queueNumber || 'W-01',
                queueStatus: apt.queueStatus || 'Waiting',
                patientName: apt.patientName || apt.patient || (language === 'TH' ? 'คนไข้ทั่วไป' : 'General Patient')
            }));

        setQueueList(todaysApts);
    }, [appointments, language]);

    // Announcement Logic
    useEffect(() => {
        const handleStorageChange = (e) => {
            // Check both manual check and event
            const raw = e?.newValue || localStorage.getItem('clinic_announcement');
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    const announcementTime = new Date(data.timestamp);
                    const now = new Date();
                    const diffSeconds = (now - announcementTime) / 1000;

                    // only process if fresh (within 5 seconds)
                    if (diffSeconds < 5 && (!lastAnnouncement || lastAnnouncement.id !== data.id)) {
                        setLastAnnouncement(data);
                        playVoiceAnnouncement(data);
                    }
                } catch (e) {
                    console.error("Announcement parse error:", e);
                }
            }
        };

        const interval = setInterval(handleStorageChange, 1000);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [lastAnnouncement, language]);

    const playVoiceAnnouncement = (data) => {
        if (!('speechSynthesis' in window)) return;

        const roomMapping = {
            'Room 1': { TH: 'ห้องตรวจหนึ่ง', EN: 'Room One' },
            'Room 2': { TH: 'ห้องตรวจสอง', EN: 'Room Two' },
            'Room 3': { TH: 'ห้องตรวจสาม', EN: 'Room Three' },
            'Room 4': { TH: 'ห้องตรวจสี่', EN: 'Room Four' },
            'Room 5': { TH: 'ห้องตรวจห้า', EN: 'Room Five' },
            'X-Ray': { TH: 'ห้องเอ็กซเรย์', EN: 'X-Ray Room' },
            'Lab': { TH: 'ห้องแล็บ', EN: 'Laboratory' }
        };

        const rValue = data.payload?.room || data.room || '';
        const roomInfo = roomMapping[rValue] || { TH: rValue, EN: rValue };
        let text = '';

        if (data.type === 'assistant') {
            text = `ขอผู้ช่วย ที่ ${roomInfo.TH} ค่ะ. Assistant requested at ${roomInfo.EN}.`;
        } else if (data.type === 'payment') {
            text = `เชิญคุณ ${data.payload?.patientName || data.patientName} ชำระเงินที่เคาน์เตอร์ค่ะ. Thank you ${data.payload?.patientName || data.patientName}, please proceed to the payment counter.`;
        } else {
            // Default: Queue call
            const pName = data.payload?.patientName || data.patientName;
            const rRoom = data.payload?.room || data.room || '';
            const numMatch = rRoom.match(/\d+/);
            const num = numMatch ? numMatch[0] : '1';
            
            // New pattern: "ขอเชิญคุณ... ที่ห้องตรวจ หมายเลข... ค่ะ"
            text = `ขอเชิญคุณ ${pName} ที่ห้องตรวจ หมายเลข ${num} ค่ะ.`;
        }

        // Robust speech call with fallbacks
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            // Wait a tiny bit for the system to clear
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                const voices = window.speechSynthesis.getVoices();
                
                const femalePreference = [
                    'Google ภาษาไทย',
                    'Online (Natural)',
                    'Kanya',
                    'Hemmala',
                    'Premwadee',
                    'Narisa',
                    'Female'
                ];
                
                const maleBlocklist = ['Pattara', 'Male', 'Pattara Online'];
                
                let selectedVoice = null;
                
                if (voices.length > 0) {
                    // 1. Try to find by name from our female preference list
                    for (const name of femalePreference) {
                        selectedVoice = voices.find(v => v.lang.startsWith('th') && v.name.includes(name));
                        if (selectedVoice) break;
                    }
                    
                    // 2. If STILL no voice, list all Thai voices and pick the SECOND one (if available)
                    // because the 1st one is almost always the default male 'Pattara'
                    if (!selectedVoice) {
                        const thaiVoices = voices.filter(v => v.lang.startsWith('th') && !maleBlocklist.some(m => v.name.includes(m)));
                        if (thaiVoices.length > 1) {
                            selectedVoice = thaiVoices[1]; // Pick second one
                        } else if (thaiVoices.length > 0) {
                            selectedVoice = thaiVoices[0];
                        }
                    }
                }
                
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
                
                utterance.lang = 'th-TH';
                utterance.rate = 0.88;
                utterance.pitch = 1.35; // Extra high pitch
                
                window.speechSynthesis.speak(utterance);
            }, 100);
        }
    };

    const currentQueue = queueList.find(q => q.queueStatus === 'In Progress');
    const nextQueues = queueList
        .filter(q => q.queueStatus === 'Waiting')
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 5);

    const formatTime = (date) => date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formatDate = (date) => date.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="qd-luxury-container">
            {/* Ambient Background Elements */}
            <div className="qd-ambient-glow qd-glow-1"></div>
            <div className="qd-ambient-glow qd-glow-2"></div>

            {/* Header Section */}
            <header className="qd-header animate-fade-in">
                <div className="qd-brand">
                    <div className="qd-logo-wrapper">
                        <img src="/logo.png" alt="Logo" className="qd-logo" />
                    </div>
                    <div className="qd-brand-info">
                        <h1 className="qd-clinic-title">บ้านหมอฟัน คลินิก</h1>
                        <p className="qd-clinic-tagline">DENTIST'S HOUSE CLINIC</p>
                    </div>
                </div>

                <div className="qd-datetime">
                    <div className="qd-time-card">
                        <Clock className="qd-icon-gold" size={32} />
                        <span className="qd-time-text">{formatTime(currentTime)}</span>
                    </div>
                    <div className="qd-date-text">
                        {formatDate(currentTime)}
                    </div>
                </div>
            </header>

            <main className="qd-main-grid">
                {/* Current Active Queue (Left Side) */}
                <section className="qd-current-section animate-slide-up">
                    <div className="qd-status-pill qd-pulse">
                        <Volume2 size={24} className="qd-calling-icon" />
                        <span>{language === 'TH' ? 'กำลังเรียกเข้ารับบริการ' : 'NOW CALLING'}</span>
                        <div className="qd-pulse-ring"></div>
                    </div>

                    <div className="qd-main-card glass-panel-premium">
                        {currentQueue ? (
                            <div className="qd-caller-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                                <div className="qd-number-badge animate-pop-in" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', color: '#64748b', fontWeight: 700 }}>
                                    {language === 'TH' ? 'ห้องตรวจ' : 'ROOM'}
                                </div>
                                <div style={{ 
                                    fontSize: '14rem', 
                                    fontWeight: 1000, 
                                    color: 'var(--qd-teal)', 
                                    lineHeight: 1.1, 
                                    margin: '0',
                                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 15px 30px rgba(13, 148, 136, 0.2))',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '100%'
                                }}>
                                    {(() => {
                                        const r = lastAnnouncement?.payload?.room || lastAnnouncement?.room || '';
                                        const numMatch = r.match(/\d+/);
                                        if (numMatch) return numMatch[0];
                                        if (r.includes('ห้องตรวจ') || r.includes('Room')) return '1';
                                        return r.charAt(0).toUpperCase() || '1';
                                    })()}
                                </div>
                                <h1 className="qd-patient-display" style={{ fontSize: '4.5rem', fontWeight: 900, margin: '1rem 0 2rem 0', color: '#1e293b' }}>
                                    {currentQueue.patientName}
                                </h1>
                                <div className="qd-room-indicator" style={{ 
                                    background: 'rgba(13, 148, 136, 0.08)', 
                                    padding: '0.8rem 3rem', 
                                    borderRadius: '50px', 
                                    border: '1px solid rgba(13, 148, 136, 0.2)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--qd-teal)' }}>
                                        {lastAnnouncement?.payload?.room || lastAnnouncement?.room || (language === 'TH' ? 'ห้องตรวจหลัก' : 'Main Room')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="qd-empty-display">
                                <div className="qd-waiting-art">
                                    <Star size={80} className="qd-gold-star" />
                                </div>
                                <h3>{language === 'TH' ? 'รอเรียกนัดหมายถัดไป' : 'Ready for Next Patient'}</h3>
                                <p>{language === 'TH' ? 'คลินิกยินดีให้บริการคุณลูกค้าทุกท่าน' : 'Our team is honored to serve you.'}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Waiting List (Right Side) */}
                <section className="qd-waiting-section animate-slide-up delay-200">
                    <div className="qd-waiting-header">
                        <div className="qd-section-label">
                            <User size={28} className="qd-icon-teal" />
                            <span>{language === 'TH' ? 'คิวที่รอเรียก' : 'UPCOMING QUEUES'}</span>
                        </div>
                        <div className="qd-queue-stats">
                            {nextQueues.length} {language === 'TH' ? 'ท่าน' : 'Remaining'}
                        </div>
                    </div>

                    <div className="qd-waiting-list">
                        {nextQueues.length > 0 ? (
                            nextQueues.map((q, idx) => (
                                <div key={idx} className="qd-waiting-card animate-slide-right" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="qd-waiting-num" style={{ width: '40px' }}><User size={24} /></div>
                                    <div className="qd-waiting-info">
                                        <div className="qd-waiting-name">{q.patientName}</div>
                                        <div className="qd-waiting-type">{q.treatment || q.procedure || '-'}</div>
                                    </div>
                                    <div className="qd-waiting-status">
                                        <div className="qd-status-dot"></div>
                                        {language === 'TH' ? 'รอเรียก' : 'Waiting'}
                                    </div>
                                    <ChevronRight size={20} className="qd-card-arrow" />
                                </div>
                            ))
                        ) : (
                            <div className="qd-waiting-empty card">
                                <p>{language === 'TH' ? 'ยังไม่มีคิวที่รอดำเนินการ' : 'No pending appointments'}</p>
                            </div>
                        )}
                    </div>

                    {/* Clinic Branding / Ad Space */}
                    <div className="qd-ads-panel glass-panel-premium">
                        <Star size={24} className="qd-icon-gold" />
                        <div className="qd-ads-content">
                            <h4>{language === 'TH' ? 'รอยยิ้มของคุณ คือความภูมิใจของเรา' : 'Quality Care for Your Perfect Smile'}</h4>
                            <p>{language === 'TH' ? 'สอบถามข้อมูลเพิ่มเติมได้ที่เคาน์เตอร์บริการ' : 'Visit our front desk for any inquiries'}</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Premium Ticker Footer */}
            <footer className="qd-footer">
                <div className="qd-footer-inner">
                    <div className="qd-ticker">
                        <span>• {language === 'TH' ? 'ขูดหินปูนเป็นประจำทุก 6 เดือน' : 'Dental checkup every 6 months'}</span>
                        <span>• {language === 'TH' ? 'โปรดแจ้งประวัติการแพ้ยาและโรคประจำตัว' : 'Please inform us of your medical history'}</span>
                        <span>• {language === 'TH' ? 'แปรงฟันอย่างถูกวิธีช่วยรักษาสุขภาพช่องปาก' : 'Maintain good oral hygiene daily'}</span>
                        <span>• {language === 'TH' ? 'คลินิกเปิดให้บริการทุกวัน 09:30 - 20:00 น.' : 'Clinic Hours: 09:30 AM - 08:00 PM'}</span>
                    </div>
                </div>
            </footer>

            <style>{`
                :root {
                  --qd-teal: #0d9488;
                  --qd-teal-light: #14b8a6;
                  --qd-gold: #c5a059;
                  --qd-gold-light: #dfc18d;
                  --qd-bg: #f8fafc;
                  --qd-glass: rgba(255, 255, 255, 0.9);
                }

                .qd-luxury-container {
                    min-height: 100vh;
                    width: 100vw;
                    background-color: var(--qd-bg);
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.05) 0px, transparent 50%),
                        radial-gradient(at 100% 0%, rgba(197, 160, 89, 0.05) 0px, transparent 50%);
                    display: flex;
                    flex-direction: column;
                    font-family: 'Outfit', 'Prompt', sans-serif;
                    position: relative;
                    overflow: hidden;
                    color: #1e293b;
                }

                .qd-ambient-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(120px);
                    z-index: 0;
                    opacity: 0.15;
                    pointer-events: none;
                }
                .qd-glow-1 { top: -10%; left: -10%; background: var(--qd-teal); }
                .qd-glow-2 { bottom: -10%; right: -10%; background: var(--qd-gold); }

                /* Header */
                .qd-header {
                    padding: 2rem 4rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 10;
                    background: rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(8px);
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }

                .qd-brand {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .qd-logo-wrapper {
                    width: 90px;
                    height: 90px;
                    background: white;
                    border-radius: 28px;
                    padding: 12px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .qd-logo { width: 100%; height: 100%; object-fit: contain; }

                .qd-clinic-title {
                    font-size: 2.25rem;
                    font-weight: 900;
                    color: var(--qd-teal);
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .qd-clinic-tagline {
                    margin: 0.25rem 0 0 0;
                    font-size: 1rem;
                    color: var(--qd-gold);
                    font-weight: 800;
                    letter-spacing: 0.2em;
                }

                .qd-datetime {
                    text-align: right;
                }

                .qd-time-card {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .qd-time-text {
                    font-size: 3.5rem;
                    font-weight: 900;
                    color: #1e293b;
                    font-family: 'Outfit';
                    letter-spacing: -0.05em;
                }

                .qd-date-text {
                    font-size: 1.25rem;
                    color: #64748b;
                    font-weight: 600;
                }

                /* Grid Layout */
                .qd-main-grid {
                    flex: 1;
                    padding: 3rem 4rem;
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 4rem;
                    z-index: 10;
                    max-width: 1800px;
                    width: 100%;
                    margin: 0 auto;
                }

                /* Caller Section */
                .qd-current-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .qd-status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 2.5rem;
                    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
                    color: white;
                    border-radius: 100px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 3rem;
                    position: relative;
                    box-shadow: 0 15px 30px rgba(13, 148, 136, 0.3);
                }

                .qd-pulse-ring {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    border: 4px solid var(--qd-teal);
                    border-radius: 100px;
                    animation: qd-pulse-anim 2s infinite;
                }

                @keyframes qd-pulse-anim {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.2, 1.4); opacity: 0; }
                }

                .qd-main-card {
                    width: 100%;
                    min-height: 550px;
                    background: var(--qd-glass);
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    box-shadow: 
                        0 40px 100px rgba(0,0,0,0.08),
                        inset 0 0 0 1px rgba(255,255,255,1);
                    position: relative;
                }

                .qd-number-badge {
                    font-size: 14rem;
                    font-weight: 1000;
                    color: #1e293b;
                    line-height: 0.85;
                    margin-bottom: 2rem;
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
                }

                .qd-patient-display {
                    font-size: 4rem;
                    font-weight: 900;
                    color: #475569;
                    margin: 0 0 3rem 0;
                    letter-spacing: -0.02em;
                }

                .qd-room-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                    color: var(--qd-gold);
                    font-size: 3rem;
                    font-weight: 800;
                }

                .qd-decorator { opacity: 0.3; }

                .qd-empty-display { text-align: center; }
                .qd-gold-star { color: var(--qd-gold); margin-bottom: 2rem; opacity: 0.4; }

                /* Waiting Section */
                .qd-waiting-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .qd-waiting-header {
                    display: flex;
                    align-items: center; 
                    justify-content: space-between;
                    padding: 0 1rem;
                }

                .qd-section-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #475569;
                }

                .qd-queue-stats {
                    background: var(--qd-teal);
                    color: white;
                    padding: 0.5rem 1.25rem;
                    border-radius: 12px;
                    font-weight: 800;
                }

                .qd-waiting-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .qd-waiting-card {
                    background: white;
                    padding: 1.75rem 2.5rem;
                    border-radius: 28px;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.03);
                    transition: all 0.3s ease;
                    position: relative;
                }

                .qd-waiting-card:hover {
                    transform: translateX(10px);
                    box-shadow: 0 20px 40px rgba(13, 148, 136, 0.08);
                    border-color: var(--qd-teal);
                }

                .qd-waiting-num {
                    font-size: 3rem;
                    font-weight: 900;
                    color: var(--qd-teal);
                    width: 120px;
                }

                .qd-waiting-info { flex: 1; }
                .qd-waiting-name { font-size: 1.75rem; font-weight: 800; color: #1e293b; }
                .qd-waiting-type { color: #94a3b8; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

                .qd-waiting-status {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 700;
                    color: var(--qd-gold);
                }

                .qd-status-dot { width: 10px; height: 10px; background: var(--qd-gold); border-radius: 50%; }
                .qd-card-arrow { color: #e2e8f0; }

                .qd-ads-panel {
                    margin-top: auto;
                    padding: 2rem;
                    border-radius: 32px;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    background: linear-gradient(135deg, white 0%, #fefcf8 100%);
                    border: 1px solid var(--qd-gold);
                }

                .qd-ads-content h4 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; }
                .qd-ads-content p { margin: 0.25rem 0 0 0; color: #64748b; font-weight: 600; }

                /* Footer Ticker */
                .qd-footer {
                    background: #1e293b;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }

                .qd-ticker {
                    display: flex;
                    gap: 5rem;
                    white-space: nowrap;
                    animation: qd-ticker-anim 35s linear infinite;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 1.5rem;
                    font-weight: 600;
                }

                @keyframes qd-ticker-anim {
                    0% { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                }

                .animate-pop-in { animation: qd-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes qd-pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

                .animate-slide-up { animation: qd-up 0.8s ease-out both; }
                .delay-200 { animation-delay: 0.2s; }
                @keyframes qd-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

                .animate-slide-right { animation: qd-right 0.6s ease-out backwards; }
                @keyframes qd-right { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

                .qd-icon-gold { color: var(--qd-gold); }
                .qd-icon-teal { color: var(--qd-teal); }

                @media (max-width: 1400px) {
                    .qd-main-grid { gap: 2rem; padding: 2rem; }
                    .qd-number-badge { font-size: 10rem; }
                    .qd-patient-display { font-size: 3rem; }
                }
            `}</style>
        </div>
    );
};

export default QueueDisplay;
