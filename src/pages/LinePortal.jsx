import React, { useState, useEffect, useRef } from "react";
import liff from "@line/liff";
import {
    Calendar, CheckCircle2, Clock, Bell, User, LogOut,
    Stethoscope, Sparkles, Heart, Star, XCircle, Check,
    Loader2, Phone, ArrowLeft, ShieldCheck, Mail, MapPin,
    CreditCard, ChevronRight, History, Settings, MonitorSmartphone,
    Download, Home, Percent, Newspaper, MessageSquare, Menu, HelpCircle,
    Activity, FlaskConical, Droplets, Globe, Camera, LayoutGrid, FileText, Scan,
    ChevronDown, Plus, Trash2, Info, AlertCircle, Bookmark
} from "lucide-react";
import "./LinePortal.css";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { sendOTP, verifyOTP, formatPhoneNumber, isValidThaiPhone } from "../services/notificationService";
import { supabase } from "../supabase";
import { PORTAL_TRANS } from "../locales/portalTranslations";

// ข้อมูลบริการคลินิกทันตกรรม
const getDentalServices = (pt) => [
    { id: 'checkup', name: pt('srv_checkup'), price: 500, icon: Stethoscope, duration: `30 ${pt('min')}` },
    { id: 'cleaning', name: pt('srv_cleaning'), price: 1200, icon: Sparkles, duration: `45 ${pt('min')}` },
    { id: 'filling', name: pt('srv_filling'), price: 800, icon: Check, duration: `30-45 ${pt('min')}` },
    { id: 'rootcanal', name: pt('srv_rootcanal'), price: 4500, icon: Heart, duration: `60-90 ${pt('min')}` },
    { id: 'crown', name: pt('srv_crown'), price: 8500, icon: Star, duration: `2 ${pt('visits')}` },
    { id: 'implant', name: pt('srv_implant'), price: 35000, icon: CheckCircle2, duration: `3-6 ${pt('month')}` },
    { id: 'whitening', name: pt('srv_whitening'), price: 6500, icon: Sparkles, duration: `60 ${pt('min')}` },
    { id: 'extraction', name: pt('srv_extraction'), price: 1500, icon: XCircle, duration: `30 ${pt('min')}` },
];

const TIME_SLOTS = [
    '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];
const getBranches = (pt) => [pt('branch_prachinburi')];

const NEWS = [
    { id: 1, title: 'สุขภาพช่องปากที่ดีเป็นอย่างไร', img: 'https://images.unsplash.com/photo-1588776814546-1ffce47267a5?w=300&h=300&fit=crop' },
    { id: 2, title: 'ขูดหินปูนสำคัญอย่างไร?', img: 'https://images.unsplash.com/photo-1445527815219-ecbfec67492e?w=300&h=300&fit=crop' },
    { id: 3, title: 'การดูแลหลังถอนฟัน', img: 'https://images.unsplash.com/photo-1468493858157-0da44aaf1d13?w=300&h=300&fit=crop' },
];

const LinePortal = () => {
    const { language, setLanguage } = useLanguage();
    const pt = (key) => {
        const currentVal = PORTAL_TRANS[language]?.[key];
        if (currentVal !== undefined) return currentVal;
        const fallbackVal = PORTAL_TRANS["EN"]?.[key];
        if (fallbackVal !== undefined) return fallbackVal;
        return key;
    };
    const { patients, appointments, addAppointment, addPatient } = useData();
    const [dbPatients, setDbPatients] = useState([]);

    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkWidth = () => {
            setIsDesktop(window.innerWidth > 768);
        };
        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, []);

    const [page, setPage] = useState('login');
    const [phoneNum, setPhoneNum] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [lineUserId, setLineUserId] = useState(''); // Store LINE ID
    const [linePictureUrl, setLinePictureUrl] = useState(''); // Store Profile Picture
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const otpInputRef = useRef(null);

    // Booking state
    const [bookingService, setBookingService] = useState('');
    const [bookingBranch, setBookingBranch] = useState(getBranches(pt)[0]);
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('');
    const [isBooking, setIsBooking] = useState(false); // Add this to prevent double booking
    const [userAppointments, setUserAppointments] = useState([]);

    // Generate dates for horizontal picker
    const bookingDates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    // Initial LIFF and Session Check
    useEffect(() => {
        const initializeLiff = async () => {
            try {
                const liffId = import.meta.env.VITE_LIFF_ID;
                if (!liffId) {
                    console.warn("LIFF ID not found in .env. Initialization skipped.");
                    return;
                }

                await liff.init({ liffId });
                console.log("✅ LIFF Initialized");

                if (!liff.isLoggedIn()) {
                    console.log("⚠️ Logging in to LIFF...");
                    liff.login();
                } else {
                    const profile = await liff.getProfile();
                    console.log("📱 LINE User Profile:", profile);
                    setLineUserId(profile.userId);
                    setLinePictureUrl(profile.pictureUrl || '');
                    // alert(`📱 ดึงโปรไฟล์ ${profile.displayName} สำเร็จ!`);
                }
            } catch (err) {
                console.error("❌ LIFF Init Error:", err);
            }
        };

        initializeLiff();

        const storedUser = localStorage.getItem('ciki_portal_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            setPage('home');
            loadUserAppointments(user);
        }
        // Load patients from database
        fetchPatientsFromDB();
    }, []);

    // Sync LINE info OR Auto-login if we have lineUserId
    useEffect(() => {
        const checkAutoLogin = async () => {
            // Priority 1: If we have lineUserId and no currentUser, try to find user by LINE ID
            // Check if user manually logged out in this session
            const manuallyLoggedOut = sessionStorage.getItem('ciki_portal_manual_logout');

            if (lineUserId && !currentUser && dbPatients.length > 0 && !manuallyLoggedOut) {
                console.log('🔍 Checking for auto-login with LINE ID:', lineUserId);
                const userByLine = dbPatients.find(p => p.line_user_id === lineUserId);

                if (userByLine) {
                    console.log('✅ Auto-login success for:', userByLine.name);
                    localStorage.setItem('ciki_portal_user', JSON.stringify(userByLine));
                    setCurrentUser(userByLine);
                    setPage('home');
                    loadUserAppointments(userByLine);
                    return;
                }
            }

            // Priority 2: Sync LINE info if already logged in but missing LINE UID or picture
            if (currentUser && lineUserId) {
                if (currentUser.line_user_id !== lineUserId || currentUser.line_picture_url !== linePictureUrl) {
                    console.log('🔄 Syncing LINE info automatically...');

                    const { data, error } = await supabase
                        .from('patients')
                        .update({
                            line_user_id: lineUserId,
                            line_picture_url: linePictureUrl
                        })
                        .eq('id', currentUser.id)
                        .select()
                        .single();

                    if (!error && data) {
                        console.log('✅ LINE info synced successfully');
                        localStorage.setItem('ciki_portal_user', JSON.stringify(data));
                        setCurrentUser(data);
                    }
                }
            }
        };

        checkAutoLogin();
    }, [currentUser, lineUserId, linePictureUrl, dbPatients]);

    // Fetch patients from database
    const fetchPatientsFromDB = async () => {
        try {
            console.log('Fetching patients from Supabase...');
            console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

            const { data, error } = await supabase
                .from('patients')
                .select('*');

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            setDbPatients(data || []);
            console.log('✅ Loaded patients from DB:', data?.length || 0);
            console.log('Sample patient:', data?.[0]);
        } catch (error) {
            console.error('❌ Error fetching patients:', error);
            setDbPatients([]); // Set empty array on error
        }
    };

    const loadUserAppointments = (user) => {
        // ค้นหานัดหมายจากข้อมูลทั้งหมด (localStorage + database)
        const allAppointments = [...(appointments || [])];

        const userApts = allAppointments.filter((apt) => {
            // ค้นหาโดยใช้ phone, patientId, หรือ patientName
            const aptCleanedPhone = apt.phone ? formatPhoneNumber(apt.phone) : '';
            const userCleanedPhone = user.phone ? formatPhoneNumber(user.phone) : '';

            return (aptCleanedPhone && aptCleanedPhone === userCleanedPhone) ||
                apt.patientId === user.id ||
                apt.patientName === user.name;
        });

        setUserAppointments(userApts);
        console.log(`Found ${userApts.length} appointments for ${user.name}`);
    };

    const handleSendOTP = async () => {
        const formattedPhone = formatPhoneNumber(phoneNum);

        if (!isValidThaiPhone(formattedPhone)) {
            alert(pt('err_phone'));
            return;
        }

        setAuthLoading(true);
        setPhoneNum(formattedPhone);

        // ส่ง OTP
        const result = await sendOTP(formattedPhone);

        setAuthLoading(false);

        if (result.success) {
            setPage('otp');
            setOtpCode('');

            if (result.demo || result.results?.sms?.note?.includes('Demo')) {
                alert(`🧪 Demo Mode - รหัส OTP: ${result.otp}\n\nใช้รหัสนี้เพื่อทดสอบการเข้าสู่ระบบ`);
            } else {
                alert(pt('otp_sent'));
            }
        } else {
            alert(pt('err_otp_send'));
        }
    };

    const handleVerifyOTP = async (codeToVerify) => {
        const code = codeToVerify || otpCode;

        if (code.length < 6) {
            alert(pt('err_otp_len'));
            return;
        }

        setAuthLoading(true);
        await new Promise(r => setTimeout(r, 800));

        const result = verifyOTP(phoneNum, code);

        // DEMO BYPASS: Allow 123456 regardless of system status for easy testing
        const isDemoSuccess = code === '123456';

        if (!result.success && !isDemoSuccess) {
            setAuthLoading(false);
            alert(result.message || pt('err_otp_invalid'));
            return;
        }

        // Search for user
        setAuthLoading(true);

        let user = null;

        try {
            // DEMO BYPASS for User Lookup
            if (code === '123456') {
                console.log('🧪 Demo Mode OTP detected');
            }

            console.log('🔍 Starting user lookup for phone:', phoneNum);
            // 1. ลองค้นหาด้วยเบอร์โทร (ทำความสะอาดเบอร์ก่อน)
            const { data: phoneMatch, error: phoneError } = await supabase
                .from('patients')
                .select('*')
                .or(`phone.eq.${phoneNum},phone.eq.${phoneNum.replace(/^0/, '66')},phone.eq.${phoneNum.replace(/^0/, '+66')}`);

            if (phoneError) {
                console.error('Supabase Phone Search Error:', phoneError);
            }

            user = phoneMatch && phoneMatch.length > 0 ? phoneMatch[0] : null;
            if (user) console.log('✅ Found user by phone');

            // 2. ถ้าไม่เจอด้วยเบอร์ ลองค้นด้วย LINE ID
            if (!user && lineUserId) {
                console.log('Phone match failed, searching by LINE ID:', lineUserId);
                const { data: lineMatch } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('line_user_id', lineUserId)
                    .maybeSingle();
                user = lineMatch;
            }

            // 3. ถ้ายังไม่เจออีก ลองค้นหาแบบ Manual ในอาเรย์ที่โหลดมา (เผื่อกรณีเบอร์มีฟอร์แมตแปลกๆ ใน DB เช่น 091-xxx หรือ 091 7xx)
            if (!user && dbPatients.length > 0) {
                console.log('Final fallback: Searching in loaded patients array...');
                user = dbPatients.find(p => {
                    if (!p || !p.phone) return false;
                    const cleanP = p.phone.replace(/\D/g, '');
                    const cleanTarget = phoneNum.replace(/\D/g, '');
                    // เปรียบเทียบ 9 หลักสุดท้าย (เพื่อเลี่ยงปัญหา 0 vs 66)
                    return cleanP.endsWith(cleanTarget.slice(-9));
                });
            }
        } catch (err) {
            console.error('Lookup Error:', err);
        } finally {
            setAuthLoading(false);
        }

        if (user) {
            console.log('🎉 Login Success for:', user.name);
            localStorage.setItem('ciki_portal_user', JSON.stringify(user));
            setCurrentUser(user);
            loadUserAppointments(user);
            setPage('home');
            alert(`${pt('welcome')} ${user.name}`);
        } else if (code === '123456') {
            console.log('🧪 Demo User Fallback Active');
            const demoUser = {
                id: 'demo-999',
                name: 'คุณลูกค้า (Demo)',
                phone: phoneNum,
                hn: 'DEMO6704'
            };
            localStorage.setItem('ciki_portal_user', JSON.stringify(demoUser));
            setCurrentUser(demoUser);
            setPage('home');
            alert(`${pt('welcome')} ${demoUser.name}`);
        } else {
            console.log('❌ No user found, going to register');
            setPage('register');
        }
    };

    const handleRegister = async (e) => {
        if (e) e.preventDefault();

        if (!firstName.trim() || !lastName.trim()) {
            alert(pt('err_name'));
            return;
        }

        setRegisterLoading(true);

        const newUser = {
            name: `${firstName.trim()} ${lastName.trim()}`,
            phone: phoneNum,
            lineUserId: lineUserId,
            linePictureUrl: linePictureUrl,
            status: 'Active'
        };

        try {
            console.log('🆕 Registering new user via DataContext:', newUser);
            // Use addPatient from DataContext to ensure local sync and CN generation
            const addResult = await addPatient(newUser);

            // The addPatient method doesn't return the patient directly currently, 
            // but it updates the 'patients' state which we can find.
            // Wait a bit for state update or use logic to find the new one.
            const registeredUser = patients.find(p => p.phone === phoneNum) || newUser;

            console.log('✅ Created new patient:', registeredUser);

            localStorage.setItem('ciki_portal_user', JSON.stringify(registeredUser));
            setCurrentUser(registeredUser);
            setPage('home');
            alert(`${pt('welcome')} ${registeredUser.name} ${pt('reg_success')}`);
        } catch (error) {
            console.error('❌ Error creating patient:', error);
            alert('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleLogout = () => {
        // Mark as manual logout to prevent immediate auto-re-login by LINE ID
        sessionStorage.setItem('ciki_portal_manual_logout', 'true');
        localStorage.removeItem('ciki_portal_user');
        setCurrentUser(null);
        setPage('login');
        setPhoneNum('');
        setOtpCode('');
        alert(pt('logout_success'));
    };

    const handleBooking = async () => {
        if (isBooking) return; // Prevent double clicks

        if (!bookingService || !bookingTime) {
            alert(pt('err_sel_service'));
            return;
        }

        setIsBooking(true);
        try {
            const service = getDentalServices(pt).find(s => s.id === bookingService);

            const getDoctorForService = (serviceId) => {
                if (['braces', 'retainer'].includes(serviceId)) return 'หมออ้อม'; // Default Ortho to Dr. Aom
                if (['veneers', 'extraction'].includes(serviceId)) return 'หมอบิ๊ก'; // Default Extraction to Dr. Big
                return 'หมอต้อง'; // Default General to Dr. Tong
            };

            const newAppointment = {
                patientId: currentUser?.id,
                patientName: currentUser?.name || 'ลูกค้า LINE',
                phone: currentUser?.phone,
                date: bookingDate,
                time: bookingTime,
                treatment: service?.name,
                dentist: getDoctorForService(bookingService),
                branch: bookingBranch,
                type: 'LINE Booking',
                status: 'Pending'
            };

            const bookingResult = await addAppointment(newAppointment);

            if (bookingResult && !bookingResult.success) {
                // Already alerted in DataContext
                return;
            }

            alert(`${pt('book_success_alert')} ${service?.name} ${bookingDate} ${bookingTime}`);

            loadUserAppointments(currentUser);
            setPage('booking-confirm');
        } catch (error) {
            console.error("Booking failed:", error);
            alert("จองไม่สำเร็จกรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsBooking(false);
        }
    };

    const LineHeader = ({ title, onBack }) => (
        <div className="lp-header-main" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            padding: '1.25rem 1rem 1.25rem 1rem'
        }}>
            {onBack && (
                <button
                    onClick={onBack}
                    style={{
                        position: 'absolute', left: '1rem',
                        background: 'none', border: 'none', color: 'white',
                        padding: '0.4rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center'
                    }}
                >
                    <ArrowLeft size={22} />
                </button>
            )}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{title}</h2>
        </div>
    );

    // ===== LOGIN PAGE =====

    // ===== DESKTOP BLOCKER =====
    if (isDesktop) {
        return (
            <div className="desktop-blocker">
                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <MonitorSmartphone size={64} color="#10b981" style={{ margin: '0 auto 1.5rem', opacity: 0.9 }} />
                    <h1>Mobile Experience Only</h1>
                    <p>
                        {pt('ciki_dental')} is beautifully optimized specifically for your smartphone.
                        Please open this portal on your mobile device via the LINE application to continue.
                    </p>
                </div>
            </div>
        );
    }

    if (page === 'login') {
        return (
            <div className="lp-container" style={{ background: 'var(--lp-background)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
                {/* Background Decor */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--lp-primary) 0%, transparent 70%)', opacity: 0.08, zIndex: 0, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--lp-secondary) 0%, transparent 70%)', opacity: 0.05, zIndex: 0, borderRadius: '50%' }} />

                {/* Floating Language Switcher */}
                <div style={{ position: 'absolute', top: '2rem', right: '1.5rem', zIndex: 20 }}>
                    <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--glass-premium-bg, rgba(255,255,255,0.7))', padding: '0.5rem', borderRadius: '1.25rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: 'var(--shadow-sm)' }}>
                        {['TH', 'EN', 'CN'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                style={{
                                    background: language === lang ? 'white' : 'transparent',
                                    border: 'none',
                                    padding: '0.4rem',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: language === lang ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                <img
                                    src={lang === 'TH' ? 'https://flagcdn.com/w40/th.png' : lang === 'EN' ? 'https://flagcdn.com/w40/gb.png' : 'https://flagcdn.com/w40/cn.png'}
                                    style={{ width: '24px', height: '18px', borderRadius: '2px', opacity: language === lang ? 1 : 0.6 }}
                                    alt={lang}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center', zIndex: 1 }}>
                    <div className="animate-pop" style={{
                        width: '100px', height: '100px', background: 'white',
                        borderRadius: '2.5rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(13, 148, 136, 0.2)',
                        padding: '1rem'
                    }}>
                        <img src="/logo.png" style={{ maxWidth: '100%', maxHeight: '100%' }} alt={pt("ciki_dental")} />
                    </div>

                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--lp-text-main)', letterSpacing: '-0.03em', fontFamily: 'var(--font-serif, "Playfair Display", serif)' }}>
                        บ้านหมอฟัน
                    </h1>
                    <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.1em', uppercase: 'true', marginBottom: '3rem' }}>
                        DENTIST'S HOUSE CLINIC
                    </p>

                    <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.75rem', display: 'block', paddingLeft: '0.5rem' }}>
                            {pt('phone_label')}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-primary)' }}>
                                <Phone size={20} />
                            </div>
                            <input
                                className="lp-input-v2"
                                style={{ paddingLeft: '3.5rem', height: '4.25rem', fontSize: '1.2rem', fontWeight: 800, border: '1.5px solid #eef2f6', borderRadius: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                                type="tel"
                                placeholder="08x-xxx-xxxx"
                                value={phoneNum}
                                onChange={e => setPhoneNum(formatPhoneNumber(e.target.value))}
                                maxLength={12}
                            />
                        </div>
                    </div>

                    <button
                        className="lp-btn-accent"
                        onClick={handleSendOTP}
                        disabled={authLoading}
                        style={{ width: '100%', height: '4.25rem', borderRadius: '1.5rem', fontSize: '1.15rem', fontWeight: 900, boxShadow: '0 15px 30px rgba(13, 148, 136, 0.25)', background: 'var(--gradient-hero)', border: 'none' }}
                    >
                        {authLoading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : pt('get_otp')}
                    </button>

                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.6 }}>
                        <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>บ้านหมอฟัน</span>
                        <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }} />
                    </div>
                </div>
            </div>
        );
    }

    // ===== OTP PAGE =====
    if (page === 'otp') {
        return (
            <div className="lp-container" style={{ background: 'var(--lp-background)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '280px', height: '280px', background: 'radial-gradient(circle, var(--lp-secondary) 0%, transparent 70%)', opacity: 0.05, zIndex: 0, borderRadius: '50%' }} />

                <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center', zIndex: 1 }}>
                    <div style={{
                        width: '90px', height: '90px', background: 'white',
                        borderRadius: '2.5rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(13, 148, 136, 0.1)'
                    }}>
                        <ShieldCheck size={40} color="var(--lp-primary)" />
                    </div>

                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--lp-text-main)', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif, "Playfair Display", serif)' }}>
                        {pt('verify_title') || 'Verify Identity'}
                    </h1>
                    <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.95rem', marginBottom: '3.5rem', fontWeight: 500 }}>
                        {pt('otp_sent_to')} <span style={{ color: 'var(--lp-text-main)', fontWeight: 800 }}>{phoneNum}</span>
                    </p>

                    <div
                        style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '4rem' }}
                        onClick={() => otpInputRef.current?.focus()}
                    >
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                                width: '48px', height: '64px', borderRadius: '1.25rem', background: 'white', border: '2px solid',
                                borderColor: otpCode.length === i ? 'var(--lp-primary)' : '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.6rem', fontWeight: 900, color: 'var(--lp-text-main)',
                                boxShadow: otpCode.length === i ? '0 10px 20px rgba(13, 148, 136, 0.1)' : 'none',
                                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                                {otpCode[i] || ''}
                            </div>
                        ))}
                    </div>

                    <input
                        ref={otpInputRef}
                        type="tel"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setOtpCode(val);
                            if (val.length === 6) handleVerifyOTP(val);
                        }}
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        autoFocus
                    />

                    <button
                        className="lp-btn-accent"
                        onClick={() => handleVerifyOTP()}
                        disabled={otpCode.length < 6 || authLoading}
                        style={{
                            width: '100%', height: '4.25rem', borderRadius: '1.5rem',
                            fontSize: '1.15rem', fontWeight: 900, display: 'block',
                            boxShadow: '0 15px 30px rgba(13, 148, 136, 0.25)',
                            background: 'var(--gradient-hero)', border: 'none'
                        }}
                    >
                        {authLoading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : pt('verify_btn') || 'Verify & Continue'}
                    </button>

                    <button
                        onClick={() => setPage('login')}
                        style={{
                            width: '100%', background: 'none', border: 'none',
                            color: 'var(--lp-text-muted)', fontSize: '0.9rem',
                            fontWeight: 800, marginTop: '2.5rem', cursor: 'pointer',
                            opacity: 0.7, textDecoration: 'underline'
                        }}
                    >
                        {pt('change_phone_btn') || 'Change Phone Number'}
                    </button>

                    {/* Demo Hint Banner */}
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--primary-50)', borderRadius: '1rem', border: '1.5px dashed var(--lp-primary)', color: 'var(--lp-primary-dark)', fontSize: '0.8rem', fontWeight: 600 }}>
                        <Sparkles size={14} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                        DEMO MODE: Use code <span style={{ fontWeight: 900, color: 'var(--lp-primary)' }}>123456</span> to continue
                    </div>
                </div>
            </div>
        );
    }


    // ===== REGISTER PAGE =====
    if (page === 'register') {
        return (
            <div className="lp-container" style={{ padding: '2rem', justifyContent: 'center' }}>
                <div className="lp-glass" style={{ width: '100%', borderRadius: '2rem', padding: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h1>
                    <p style={{ color: 'var(--lp-text-muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        Welcome! Please fill in your details to join CIKI.
                    </p>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--lp-text-main)', marginBottom: '0.5rem', display: 'block' }}>
                            First Name
                        </label>
                        <input
                            className="lp-input"
                            style={{ paddingLeft: '1.25rem' }}
                            type="text"
                            placeholder="Enter First Name"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--lp-text-main)', marginBottom: '0.5rem', display: 'block' }}>
                            Last Name
                        </label>
                        <input
                            className="lp-input"
                            style={{ paddingLeft: '1.25rem' }}
                            type="text"
                            placeholder="Enter Last Name"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                        />
                    </div>

                    <button className="lp-btn-primary" onClick={handleRegister} disabled={registerLoading}>
                        {registerLoading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : pt('create_account')}
                    </button>

                    <button
                        onClick={() => setPage('login')}
                        style={{ background: 'none', border: 'none', color: 'var(--lp-text-muted)', fontSize: '0.85rem', cursor: 'pointer', width: '100%', marginTop: '1.25rem' }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // ===== HOME PAGE V2 =====
    if (page === 'home') {
        return (
            <div className="lp-container">
                {/* Balanced Premium Header */}
                <div className="lp-header-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.25rem 4rem 1.25rem' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white',
                            width: '42px', height: '42px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', backdropFilter: 'blur(10px)'
                        }}
                    >
                        <LogOut size={20} />
                    </button>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Language Toggle */}
                        <button
                            onClick={() => setLanguage(language === 'TH' ? 'EN' : 'TH')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white',
                                padding: '0.4rem 0.8rem', borderRadius: '10px',
                                fontSize: '0.75rem', fontWeight: 900,
                                cursor: 'pointer', backdropFilter: 'blur(10px)',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            <Globe size={14} />
                            {language === 'TH' ? 'EN' : 'TH'}
                        </button>

                        <button
                            onClick={() => setPage('appointments')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white',
                                width: '42px', height: '42px', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', backdropFilter: 'blur(10px)', position: 'relative'
                            }}
                        >
                            <Bell size={20} />
                            {userAppointments.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: -4, right: -4,
                                    background: '#ef4444', border: '2px solid white',
                                    borderRadius: '50%', width: 18, height: 18,
                                    fontSize: '0.65rem', fontWeight: 900,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {userAppointments.length}
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Unified Premium Profile Card V2 */}
                <div className="lp-profile-card-wrapper-v2 animate-pop">
                    <div className="lp-profile-card-v2 glass-panel-premium">
                        <div className="lp-profile-header-v2">
                            <div className="lp-profile-avatar-group">
                                <img
                                    src={linePictureUrl || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop"}
                                    className="lp-profile-img-v2"
                                    alt="Profile"
                                />

                            </div>

                            <div className="lp-profile-info-v2">
                                <h3 className="lp-user-name-v2">
                                    {pt('greeting_prefix')}{currentUser?.name || pt('guest_user')}
                                </h3>
                                <p className="lp-cn-label-v2">{pt('hn_label')} {currentUser?.hn || '6225-001'}</p>
                            </div>
                        </div>

                        <div className="lp-info-grid-v2">
                            <div className="lp-info-item-v2">
                                <Phone size={16} className="lp-info-icon-v2" />
                                <div className="lp-info-content-v2">
                                    <label>{pt('phone_short')}</label>
                                    <span>{currentUser?.phone || '09x-xxx-xxxx'}</span>
                                </div>
                            </div>
                            <div className="lp-info-item-v2">
                                <Activity size={16} className="lp-info-icon-v2" />
                                <div className="lp-info-content-v2">
                                    <label>{pt('treatment_rights')}</label>
                                    <span>
                                        {currentUser?.insuranceType === 'Self' ? pt('self_pay') :
                                            currentUser?.insuranceType === 'SSO' ? pt('sso') :
                                                currentUser?.insuranceType === 'Insurance' ? (currentUser?.insuranceProvider || pt('health_insurance')) :
                                                    (currentUser?.insuranceType || pt('not_specified'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Recommended (Carousel Refined) */}
                <div className="lp-section" style={{ marginTop: '0.5rem' }}>
                    <div className="lp-section-header">
                        <h3 className="lp-section-title">{pt('recommended_for_you')}</h3>
                        <button className="lp-btn-see-all" onClick={() => setPage('services')}>
                            <span>{pt('see_all')}</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="lp-promo-scroll-v2">
                        {getDentalServices(pt).slice(0, 4).map(service => (
                            <div key={service.id} className="lp-promo-card-v2" onClick={() => { setBookingService(service.id); setPage('booking'); }}>
                                <img src={`https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&h=300&fit=crop`} alt={service.name} />
                                <div className="lp-promo-overlay-v2">
                                    <div className="lp-promo-tag-v2">HOT</div>
                                    <div className="lp-promo-info-v2">
                                        <h4>{service.name}</h4>
                                        <p>{pt('starting_from')} ฿{service.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* News Section (Grid Refined) */}
                <div className="lp-section">
                    <div className="lp-section-header">
                        <h3 className="lp-section-title">{pt('latest_news')}</h3>
                    </div>
                    <div className="lp-news-grid-v2">
                        {NEWS.map(n => (
                            <div key={n.id} className="lp-news-card-v2 animate-pop">
                                <div className="lp-news-thumb-v2">
                                    <img
                                        src={n.img.includes('undefined') ? 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop' : n.img}
                                        alt={n.title}
                                    />
                                </div>
                                <div className="lp-news-body-v2">
                                    <span className="lp-news-date-v2">07 APR 2026</span>
                                    <h4>{n.title}</h4>
                                    <button className="lp-news-read-v2">
                                        {pt('read_more')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Simplified & Premium Navigation Bottom */}
                <div className="lp-bottom-nav-v2">
                    <button className={`lp-nav-item-v2 ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
                        <Home size={20} />
                        <span>{pt('dashboard')}</span>
                    </button>

                    <button className={`lp-nav-center-btn ${page === 'booking' ? 'active' : ''}`} onClick={() => setPage('booking')}>
                        <div className="lp-nav-center-inner">
                            <Calendar size={24} />
                            <span>{pt('booking')}</span>
                        </div>
                    </button>

                    <button className={`lp-nav-item-v2 ${page === 'services' ? 'active' : ''}`} onClick={() => setPage('services')}>
                        <Percent size={20} />
                        <span>{pt('services')}</span>
                    </button>
                </div>
            </div>
        );
    }

    // ===== SERVICES PAGE =====
    if (page === 'services') {
        return (
            <div className="lp-container">
                <LineHeader title={pt('premium_services')} onBack={() => setPage('home')} />

                <div className="lp-content animate-slide-up">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {getDentalServices(pt).map(service => (
                            <div key={service.id}
                                onClick={() => { setBookingService(service.id); setPage('booking'); }}
                                className="lp-service-card-v2"
                            >
                                <div className="lp-service-icon-box-v2">
                                    <service.icon size={24} />
                                </div>
                                <div className="lp-service-info-v2">
                                    <p className="lp-service-name-v2">{service.name}</p>
                                    <p className="lp-service-duration-v2">{service.duration}</p>
                                </div>
                                <div className="lp-service-price-box-v2">
                                    <span className="lp-service-price-prefix-v2">
                                        {pt('starting_from')}
                                    </span>
                                    <p className="lp-service-price-v2">
                                        ฿{service.price.toLocaleString()}
                                    </p>
                                    <span className="lp-service-book-v2">{pt('book_now_short')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ===== BOOKING PAGE =====
    if (page === 'booking') {
        const selectedServiceObj = getDentalServices(pt).find(s => s.id === bookingService);

        return (
            <div className="lp-container">
                <LineHeader title={pt('book_apt')} onBack={() => setPage('services')} />

                <div className="lp-content">
                    <div className="lp-booking-container-v2 animate-pop">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="lp-booking-label-v2">{pt('select_service_label')}</label>
                            <select value={bookingService} onChange={e => setBookingService(e.target.value)} className="lp-input-v3">
                                <option value="">{pt('choose_treatment')}</option>
                                {getDentalServices(pt).map(service => (
                                    <option key={service.id} value={service.id}>{service.name} ({pt('starting_from')} ฿{service.price.toLocaleString()})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.75rem' }}>
                            <label className="lp-booking-label-v2">{pt('sel_date')}</label>
                            <div className="lp-date-scroll-v3">
                                {bookingDates.map((date, idx) => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isSelected = bookingDate === dateStr;
                                    const dayName = date.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { weekday: 'short' });
                                    const dateDay = date.getDate();

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setBookingDate(dateStr)}
                                            className={`lp-date-chip-v3 ${isSelected ? 'active' : ''}`}
                                        >
                                            <span className="lp-day-name-v3">{dayName}</span>
                                            <span className="lp-date-num-v3">{dateDay}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.75rem' }}>
                            <label className="lp-booking-label-v2">{pt('sel_time')}</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                                {TIME_SLOTS.map(t => (
                                    <button key={t} onClick={() => setBookingTime(t)}
                                        style={{
                                            padding: '0.8rem 0.25rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 900,
                                            border: '1.5px solid #f1f5f9',
                                            background: bookingTime === t ? 'var(--lp-primary)' : '#f8fafc',
                                            color: bookingTime === t ? 'white' : 'var(--lp-text-main)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: bookingTime === t ? '0 8px 16px rgba(13, 148, 136, 0.25)' : 'none'
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="lp-btn-accent"
                            disabled={!bookingService || !bookingTime || isBooking}
                            onClick={handleBooking}
                            style={{
                                width: '100%', padding: '1.25rem', borderRadius: '1.25rem',
                                fontSize: '1.1rem', opacity: isBooking ? 0.7 : 1, transition: 'all 0.3s ease',
                                boxShadow: '0 15px 30px rgba(197, 160, 89, 0.25)',
                                background: 'linear-gradient(135deg, #c5a059 0%, #dfc18d 100%)',
                                color: 'white', border: 'none', fontWeight: 900
                            }}
                        >
                            {isBooking ? pt('processing') : pt('confirm_booking')}
                        </button>
                    </div>

                    {selectedServiceObj && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--lp-text-muted)', fontWeight: 700 }}>
                                {pt('est_price')}
                                <span style={{ color: 'var(--lp-primary)', marginLeft: '4px' }}>฿{selectedServiceObj.price.toLocaleString()}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ===== BOOKING CONFIRM PAGE =====
    if (page === 'booking-confirm') {
        const service = getDentalServices(pt).find(s => s.id === bookingService);

        return (
            <div className="lp-container" style={{ justifyContent: 'center', padding: '2rem' }}>
                <div className="lp-glass" style={{ width: '100%', borderRadius: '2.5rem', padding: '3rem 2rem', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#ecfdf5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.15)'
                    }}>
                        <CheckCircle2 size={40} color="#10b981" />
                    </div>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem' }}>{pt('booking_success')}</h2>
                    <p style={{ color: 'var(--lp-text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                        {pt('booking_success_desc')}
                    </p>

                    <div style={{
                        background: 'rgba(249, 250, 251, 0.8)',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        border: '1px dashed #e2e8f0',
                        marginBottom: '2.5rem'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>{pt('service')}</span>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{service?.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>{pt('datetime')}</span>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{bookingDate} @ {bookingTime}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>{pt('branch')}</span>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{bookingBranch}</span>
                            </div>
                        </div>
                    </div>

                    <button className="lp-btn-primary" onClick={() => setPage('home')}>
                        {pt('back_to_dashboard_btn')}
                    </button>
                </div>
            </div>
        );
    }

    // ===== APPOINTMENTS PAGE =====
    if (page === 'appointments') {
        return (
            <div className="lp-container">
                <LineHeader title={pt('my_apts')} onBack={() => setPage('home')} />

                <div className="lp-content">
                    {userAppointments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                opacity: 0.5
                            }}>
                                <Calendar size={32} />
                            </div>
                            <p style={{ color: 'var(--lp-text-muted)', fontWeight: 600 }}>{pt('no_apts')}</p>
                            <button
                                className="lp-btn-accent"
                                onClick={() => setPage('booking')}
                                style={{ marginTop: '1.5rem' }}
                            >
                                {pt('book_first')}
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {userAppointments.map((apt, idx) => (
                                <div key={idx} className="lp-card" style={{ padding: '1.25rem', border: '1px solid rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{
                                            width: '52px',
                                            height: '52px',
                                            background: 'rgba(59, 130, 246, 0.05)',
                                            borderRadius: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Stethoscope size={24} color="var(--lp-secondary)" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                                <p style={{ fontWeight: 800, fontSize: '1rem' }}>{apt.treatment}</p>
                                                <div className="lp-pill" style={{
                                                    background: apt.status === 'Confirmed' ? '#ecfdf5' :
                                                        apt.status === 'Pending' ? '#fffbeb' : '#f9fafb',
                                                    color: apt.status === 'Confirmed' ? '#059669' :
                                                        apt.status === 'Pending' ? '#d97706' : '#6b7280',
                                                    fontSize: '0.65rem'
                                                }}>
                                                    {apt.status === 'Confirmed' ? pt('status_confirmed') :
                                                        apt.status === 'Pending' ? pt('status_pending') : apt.status}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--lp-text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={12} />
                                                    <span>{apt.date}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Clock size={12} />
                                                    <span>{apt.time}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--lp-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                <MapPin size={12} />
                                                <span>{apt.branch || pt('main_clinic')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ===== ORTHO PROGRESS PAGE =====
    if (page === 'ortho') {
        const orthoStages = [
            { id: 1, name: 'เหวี่ยงฟัน', status: 'completed', icon: Activity },
            { id: 2, name: 'ปิดช่องว่าง', status: 'current', icon: LayoutGrid },
            { id: 3, name: 'เก็บรายละเอียด', status: 'pending', icon: Sparkles },
            { id: 4, name: 'รีเทนเนอร์', status: 'pending', icon: ShieldCheck },
        ];

        return (
            <div className="lp-container">
                <div className="lp-header-v2" style={{ background: 'linear-gradient(to right, #0d9488, #0f766e)', color: 'white', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setPage('home')} className="lp-back-btn-v2" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}><ArrowLeft size={20} /></button>
                        <h2 className="lp-page-title-v2" style={{ color: 'white' }}>{pt('ortho_progress')}</h2>
                    </div>
                </div>

                <div className="lp-content" style={{ paddingTop: '1.5rem' }}>
                    {/* Stage Timeline */}
                    <div className="lp-glass-premium" style={{ borderRadius: '2rem', padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)', color: 'white' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem' }} className="hide-scroll">
                            {orthoStages.map(stage => (
                                <div key={stage.id} style={{
                                    minWidth: '100px',
                                    background: stage.status === 'current' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    padding: '1rem 0.5rem',
                                    borderRadius: '1.25rem',
                                    border: stage.status === 'current' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                    opacity: stage.status === 'pending' ? 0.5 : 1
                                }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <stage.icon size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>{stage.name}</span>
                                    {stage.status === 'completed' && <CheckCircle2 size={14} color="#34d399" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Simplified Ortho Chart */}
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', paddingLeft: '0.5rem', color: 'var(--lp-text-main)' }}>Bracket Status</h3>
                    <div className="lp-card" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} style={{
                                    width: '32px', height: '36px', border: '2px solid #e2e8f0', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                                }}>
                                    <div style={{ width: '12px', height: '12px', background: '#0d9488', borderRadius: '2px' }} />
                                    <span style={{ position: 'absolute', bottom: '-15px', fontSize: '0.5rem', color: '#94a3b8' }}>{18 - i > 10 ? 18 - i : 20 + (i - 7)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem' }}>
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} style={{
                                    width: '32px', height: '36px', border: '2px solid #e2e8f0', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                                }}>
                                    <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }} />
                                    <span style={{ position: 'absolute', top: '-15px', fontSize: '0.5rem', color: '#94a3b8' }}>{48 - i > 40 ? 48 - i : 31 + (i - 8)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '3.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', width: '100%', padding: '0 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 700 }}><div style={{ width: '12px', height: '12px', background: '#0d9488', borderRadius: '3px' }} /> ติดเหล็ก</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 700 }}><div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px' }} /> ใส่แหวน</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 700 }}><div style={{ width: '12px', height: '12px', background: '#f87171', borderRadius: '3px' }} /> ถอนแล้ว</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 700 }}><div style={{ width: '12px', height: '12px', background: '#fbbf24', borderRadius: '3px' }} /> ฟันคุด</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar for Ortho */}
                <div style={{ position: 'fixed', bottom: '2rem', left: '1.5rem', right: '1.5rem', zIndex: 100 }}>
                    <button className="lp-btn-accent" style={{ width: '100%', height: '4.5rem', borderRadius: '1.5rem', boxShadow: '0 15px 30px rgba(197, 160, 89, 0.25)', border: 'none' }}>
                        <MessageSquare size={20} style={{ marginRight: '0.75rem' }} /> {pt('consult_ortho')}
                    </button>
                </div>
            </div>
        );
    }

    // ===== TREATMENT PLAN PAGE =====
    if (page === 'treatment') {
        const tabs = ['Plan', 'Photos', 'PACS'];
        const [activeTab, setActiveTab] = useState('Plan');
        const [selectedPlan, setSelectedPlan] = useState('Option A');

        return (
            <div className="lp-container">
                <div className="lp-header-v2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setPage('home')} className="lp-back-btn-v2"><ArrowLeft size={20} /></button>
                        <h2 className="lp-page-title-v2">{pt('treatment_plan')}</h2>
                    </div>
                </div>

                <div className="lp-content">
                    {/* Status Tabs */}
                    <div style={{ display: 'flex', background: '#f8fafc', padding: '0.4rem', borderRadius: '1.25rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9' }}>
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                flex: 1, padding: '0.75rem', borderRadius: '0.9rem', fontSize: '0.85rem', fontWeight: 800,
                                border: 'none', background: activeTab === tab ? 'white' : 'transparent',
                                color: activeTab === tab ? 'var(--lp-primary)' : 'var(--lp-text-muted)',
                                boxShadow: activeTab === tab ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="lp-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '1rem', border: '1.25px solid #f1f5f9', fontWeight: 800, fontSize: '0.9rem', color: 'var(--lp-text-main)', background: 'white' }}>
                                    <option>Option A</option>
                                    <option>Option B</option>
                                </select>
                                <span className="lp-pill" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.7rem' }}>Draft</span>
                            </div>
                            <Info size={18} color="var(--lp-text-muted)" />
                        </div>

                        {/* Tooth Chart Legend */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '0.25rem',
                            padding: '1.5rem 0.5rem', background: 'rgba(13, 148, 136, 0.02)', borderRadius: '1.5rem', marginBottom: '1.5rem'
                        }}>
                            {Array.from({ length: 32 }).map((_, i) => (
                                <div key={i} style={{
                                    height: '35px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    {i === 5 && <div style={{ position: 'absolute', inset: 0, background: '#f87171', opacity: 0.6 }} />}
                                    {i === 12 && <div style={{ position: 'absolute', inset: 0, background: '#fbbf24', opacity: 0.6 }} />}
                                    {i === 22 && <div style={{ position: 'absolute', inset: 0, background: '#c084fc', opacity: 0.6 }} />}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.7rem', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: '#f87171', borderRadius: '3px' }} /> Cavity</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: '#34d399', borderRadius: '3px' }} /> Filled</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: '#94a3b8', borderRadius: '3px' }} /> Missing</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: '#c084fc', borderRadius: '3px' }} /> Treated</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', paddingLeft: '0.5rem', color: 'var(--lp-text-main)' }}>1. ขั้นตอนเลือกซี่ฟัน</h3>
                        <div className="lp-card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={22} color="var(--lp-primary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>อุดฟันน้ำยาคอมโพสิต</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)', fontWeight: 600 }}>ซี่: 16, 17, 25</p>
                                </div>
                                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--lp-primary)' }}>฿2,400</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};



export default LinePortal;
