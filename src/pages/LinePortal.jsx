import React, { useState, useEffect, useRef } from "react";
import liff from "@line/liff";
import {
    Calendar, CheckCircle2, Clock, Bell, User, LogOut,
    Stethoscope, Sparkles, Heart, Star, XCircle, Check,
    Loader2, Phone, ArrowLeft, ShieldCheck, Mail, MapPin,
    CreditCard, ChevronRight, History, Settings, MonitorSmartphone,
    Download, Home, Percent, Newspaper, MessageSquare, Menu, HelpCircle,
    Activity, FlaskConical, Droplets
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
    const pt = (key) => PORTAL_TRANS[language]?.[key] || PORTAL_TRANS["EN"]?.[key] || key;
    const { patients, appointments, addAppointment } = useData();
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
            line_user_id: lineUserId,
            line_picture_url: linePictureUrl,
            status: 'Active',
            points: 0,
            tier: 'Standard',
            created_at: new Date().toISOString()
        };

        try {
            console.log('🆕 Registering new user:', newUser);
            const { data, error } = await supabase
                .from('patients')
                .insert([newUser])
                .select()
                .single();

            if (error) throw error;
            
            const user = data;
            console.log('✅ Created new patient in DB:', user);
            
            // บันทึก session
            localStorage.setItem('ciki_portal_user', JSON.stringify(user));
            setCurrentUser(user);
            
            // Refresh patients list
            await fetchPatientsFromDB();
            
            setPage('home');
            alert(`${pt('welcome')} ${user.name} ${pt('reg_success')}`);
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
                        DENTIST'S HOUSE LUXURY CLINIC
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
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>POWERED BY CIKI</span>
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
                {/* Header Teal */}
                <div className="lp-header-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    <h2>{language === 'TH' ? 'หน้าหลัก' : 'Dashboard'}</h2>
                    
                    {/* Top Right Notification */}
                    <button 
                        onClick={() => setPage('appointments')}
                        style={{ 
                            position: 'absolute', right: '1rem', top: '1.25rem',
                            background: 'none', border: 'none', color: 'white',
                            padding: '0.5rem', cursor: 'pointer'
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <Bell size={24} />
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
                        </div>
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        style={{ 
                            position: 'absolute', left: '1rem', top: '1.25rem',
                            background: 'none', border: 'none', color: 'white',
                            opacity: 0.8, cursor: 'pointer'
                        }}
                    >
                        <LogOut size={20} />
                    </button>
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
                                <div className="lp-member-badge">
                                    <Star size={10} fill="currentColor" />
                                    <span>GOLD MEMBER</span>
                                </div>
                            </div>
                            
                            <div className="lp-profile-info-v2">
                                <h3 className="lp-user-name-v2">
                                    คุณ{currentUser?.name || pt('guest_user')}
                                </h3>
                                <p className="lp-hn-label-v2">HN: {currentUser?.hn || '6225-001'}</p>
                            </div>
                        </div>

                        <div className="lp-info-grid-v2">
                            <div className="lp-info-item-v2">
                                <Phone size={16} className="lp-info-icon-v2" />
                                <div className="lp-info-content-v2">
                                    <label>เบอร์โทรศัพท์</label>
                                    <span>{currentUser?.phone || '09x-xxx-xxxx'}</span>
                                </div>
                            </div>
                            <div className="lp-info-item-v2">
                                <Activity size={16} className="lp-info-icon-v2" />
                                <div className="lp-info-content-v2">
                                    <label>สิทธิ์การรักษา</label>
                                    <span>ประกันสังคม (SSO)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Promotions Section */}
                <div className="lp-section">
                    <div className="lp-section-header">
                        <h3 className="lp-section-title">{language === 'TH' ? 'บริการแนะนำ' : 'Recommended'}</h3>
                        <button className="lp-btn-see-all" onClick={() => setPage('services')}>
                            <MessageSquare size={12} />
                            ดูทั้งหมด
                        </button>
                    </div>
                    <div className="lp-promo-scroll">
                        {getDentalServices(pt).slice(0, 4).map(service => (
                            <div key={service.id} className="lp-promo-card" onClick={() => { setBookingService(service.id); setPage('booking'); }}>
                                <img src={`https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&h=300&fit=crop`} alt={service.name} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '1rem', color: 'white' }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{service.name}</p>
                                    <p style={{ fontWeight: 900 }}>ราคา {service.price.toLocaleString()} บาท</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* News Section */}
                <div className="lp-section">
                    <div className="lp-section-header">
                        <h3 className="lp-section-title">{language === 'TH' ? 'ข่าวสาร' : 'News'}</h3>
                        <button className="lp-btn-see-all">
                            <MessageSquare size={12} />
                            อ่านทั้งหมด
                        </button>
                    </div>
                    <div className="lp-news-grid">
                        {NEWS.map(n => (
                            <div key={n.id} className="lp-news-card">
                                <div className="lp-news-thumb">
                                    <img src={n.img} alt={n.title} />
                                </div>
                                <div style={{ padding: '0.75rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1.2 }}>{n.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Simplified & Premium Navigation Bottom */}
                <div className="lp-bottom-nav-v2">
                    <button className={`lp-nav-item-v2 ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
                        <Home size={20} />
                        <span>หน้าหลัก</span>
                    </button>
                    
                    <button className={`lp-nav-center-btn ${page === 'booking' ? 'active' : ''}`} onClick={() => setPage('booking')}>
                        <div className="lp-nav-center-inner">
                            <Calendar size={24} />
                            <span>จองคิว</span>
                        </div>
                    </button>

                    <button className={`lp-nav-item-v2 ${page === 'services' ? 'active' : ''}`} onClick={() => setPage('services')}>
                        <Percent size={20} />
                        <span>โปรโมชั่น</span>
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
                
                <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {getDentalServices(pt).map(service => (
                            <div key={service.id} onClick={() => { setBookingService(service.id); setPage('booking'); }} 
                                className="lp-service-card" 
                                style={{ margin: 0, padding: '1rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9' }}
                            >
                                <div style={{ 
                                    width: '46px', height: '46px', 
                                    background: 'var(--lp-primary-light)', 
                                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lp-primary)'
                                }}>
                                    <service.icon size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--lp-text-main)' }}>{service.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)', marginTop: '2px' }}>{service.duration}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--lp-primary)' }}>
                                        ฿{service.price.toLocaleString()}
                                    </p>
                                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>จองเลย</span>
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
        return (
            <div className="lp-container">
                <LineHeader title={pt('book_apt')} onBack={() => setPage('home')} />
                
                <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
                    <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.5rem', display: 'block' }}>
                                {pt('select_service_label')}
                            </label>
                            <select value={bookingService} onChange={e => setBookingService(e.target.value)} className="lp-input-v2">
                                <option value="">{pt('choose_treatment')}</option>
                                {getDentalServices(pt).map(service => (
                                    <option key={service.id} value={service.id}>{service.name} (฿{service.price.toLocaleString()})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.5rem', display: 'block' }}>
                                {pt('select_branch_label')}
                            </label>
                            <select value={bookingBranch} onChange={e => setBookingBranch(e.target.value)} className="lp-input-v2">
                                {getBranches(pt).map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.5rem', display: 'block' }}>
                                {pt('sel_date')}
                            </label>
                            <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="lp-input-v2" min={new Date().toISOString().split('T')[0]} />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '1rem', display: 'block' }}>
                                {pt('sel_time')}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                {TIME_SLOTS.map(t => (
                                    <button key={t} onClick={() => setBookingTime(t)}
                                        style={{
                                            padding: '0.65rem 0.25rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800,
                                            border: '1.5px solid #f1f5f9',
                                            background: bookingTime === t ? 'var(--lp-primary)' : '#f8fafc',
                                            color: bookingTime === t ? 'white' : 'var(--lp-text-main)',
                                            transition: 'all 0.2s ease'
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
                                width: '100%', padding: '1.25rem', borderRadius: '1rem', 
                                fontSize: '1.1rem', opacity: isBooking ? 0.7 : 1, transition: 'all 0.2s ease',
                                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.15)'
                            }}
                        >
                            {isBooking ? 'Processing...' : pt('confirm_booking')}
                        </button>
                    </div>
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
                        Your appointment has been scheduled. Our team will contact you shortly.
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
                        Back to Dashboard
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
                                Book Your First Slot
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
                                                    {apt.status}
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

    return null;
};



export default LinePortal;
