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
        if (otpCode.length < 6) {
            alert(pt('err_otp_len'));
            return;
        }

        setAuthLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        
        const result = verifyOTP(phoneNum, otpCode);
        setAuthLoading(false);

        if (!result.success) {
            alert(result.message);
            return;
        }

        // 🔍 หาผู้ใช้จากฐานข้อมูลโดยตรงเพื่อความแม่นยำสูงสุด
        console.log('Searching for user with phone:', phoneNum);
        setAuthLoading(true);

        try {
            // 1. ลองค้นหาด้วยเบอร์โทร (ทำความสะอาดเบอร์ก่อน)
            const { data: phoneMatch, error: phoneError } = await supabase
                .from('patients')
                .select('*')
                .or(`phone.eq.${phoneNum},phone.eq.${phoneNum.replace(/^0/, '66')},phone.eq.${phoneNum.replace(/^0/, '+66')}`);

            let user = phoneMatch && phoneMatch.length > 0 ? phoneMatch[0] : null;

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
            // อัปเดต LINE User ID และรูปโปรไฟล์ ถ้ามี
            const updates = {};
            if (lineUserId && user.line_user_id !== lineUserId) {
                updates.line_user_id = lineUserId;
                user.line_user_id = lineUserId;
            }
            if (linePictureUrl && user.line_picture_url !== linePictureUrl) {
                updates.line_picture_url = linePictureUrl;
                user.line_picture_url = linePictureUrl;
            }

            if (Object.keys(updates).length > 0) {
                console.log(`Updating LINE info for ${user.name}:`, updates);
                const { error: updateError } = await supabase
                    .from('patients')
                    .update(updates)
                    .eq('id', user.id);
                
                if (updateError) {
                    console.error('❌ Supabase Sync Error:', updateError);
                    alert(`❌ บันทึกข้อมูล LINE ไม่สำเร็จ: ${updateError.message}`);
                } else {
                    console.log('✅ LINE info updated successfully');
                    alert(pt('sync_success'));
                }
            }

            // บันทึก session และเข้าสู่ระบบ
            sessionStorage.removeItem('ciki_portal_manual_logout'); // Reset logout flag if any
            localStorage.setItem('ciki_portal_user', JSON.stringify(user));
            setCurrentUser(user);
            loadUserAppointments(user);
            setPage('home');
            alert(`${pt('welcome')} ${user.name}`);
        } else {
            // ไปหน้าสมัครสมาชิก
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
            <div className="lp-container" style={{ background: '#f8fafc', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {/* Abstract background accent */}
                <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: 'radial-gradient(circle, var(--lp-primary) 0%, transparent 70%)', opacity: 0.1, zIndex: 0 }} />
                
                {/* Floating Language Button */}
                <button 
                    onClick={() => {
                        if (language === 'TH') setLanguage('EN');
                        else if (language === 'EN') setLanguage('CN');
                        else setLanguage('TH');
                    }}
                    style={{ 
                        position: 'absolute', top: '2.5rem', right: '1.5rem', zIndex: 10,
                        background: 'white', padding: '0.6rem 1rem', borderRadius: '2rem',
                        fontSize: '0.9rem', fontWeight: 800, border: '1px solid #e2e8f0',
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        display: 'flex', alignItems: 'center', gap: '0.6rem'
                    }}
                >
                    {language === 'TH' ? (
                        <>
                            <img src="https://flagcdn.com/w40/th.png" style={{ width: '22px', borderRadius: '3px' }} alt="TH" />
                            <span>ไทย</span>
                        </>
                    ) : language === 'EN' ? (
                        <>
                            <img src="https://flagcdn.com/w40/gb.png" style={{ width: '22px', borderRadius: '3px' }} alt="EN" />
                            <span>EN</span>
                        </>
                    ) : (
                        <>
                            <img src="https://flagcdn.com/w40/cn.png" style={{ width: '22px', borderRadius: '3px' }} alt="CN" />
                            <span>CN</span>
                        </>
                    )}
                </button>

                <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center', zIndex: 1 }}>
                    <div style={{ 
                        width: '90px', height: '90px', background: 'white', 
                        borderRadius: '2rem', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', margin: '0 auto 2rem', 
                        boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)'
                    }}>
                        <img src="/logo.png" style={{ width: '85%', height: 'auto' }} alt={pt("ciki_dental")} />
                    </div>
                    
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--lp-text-main)', letterSpacing: '-0.02em' }}>
                        บ้านหมอฟัน
                    </h1>
                    <div style={{ height: '1.5rem', marginBottom: '3rem' }}></div>

                    <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.75rem', display: 'block', marginLeft: '0.5rem' }}>
                            {pt('phone_label')}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-primary)' }}>
                                <Phone size={20} />
                            </div>
                            <input 
                                className="lp-input-v2"
                                style={{ paddingLeft: '3.5rem', height: '4rem', fontSize: '1.1rem', fontWeight: 600, border: '2px solid #f1f5f9' }}
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
                        style={{ height: '4rem', borderRadius: '1.25rem', fontSize: '1.1rem', fontWeight: 900, boxShadow: '0 12px 24px rgba(16, 185, 129, 0.2)' }}
                    >
                        {authLoading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : pt('get_otp')}
                    </button>
                    
                    <div style={{ height: '2rem' }}></div>
                </div>
            </div>
        );
    }

    // ===== OTP PAGE =====
    if (page === 'otp') {
        return (
            <div className="lp-container" style={{ background: '#f8fafc', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: -50, left: -50, width: 220, height: 220, background: 'radial-gradient(circle, var(--lp-secondary) 0%, transparent 70%)', opacity: 0.1, zIndex: 0 }} />
                
                <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center', zIndex: 1 }}>
                    <div style={{ 
                        width: '85px', height: '85px', background: 'white', 
                        borderRadius: '2rem', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', margin: '0 auto 2.5rem', 
                        boxShadow: '0 20px 40px rgba(16, 185, 129, 0.1)'
                    }}>
                        <ShieldCheck size={40} color="var(--lp-primary)" />
                    </div>

                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--lp-text-main)', letterSpacing: '-0.02em' }}>
                        {pt('verify_title') || 'Verify Identity'}
                    </h1>
                    <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.95rem', marginBottom: '3.5rem', fontWeight: 500, opacity: 0.8 }}>
                        {pt('otp_sent_to')} <span style={{ color: 'var(--lp-text-main)', fontWeight: 800 }}>{phoneNum}</span>
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '3.5rem' }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                                width: '44px', height: '60px', borderRadius: '14px', background: 'white', border: '2px solid',
                                borderColor: otpCode.length === i ? 'var(--lp-primary)' : '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', fontWeight: 900, color: 'var(--lp-text-main)', 
                                boxShadow: otpCode.length === i ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none',
                                transition: 'all 0.2s ease'
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
                        style={{ height: '4rem', borderRadius: '1.25rem', fontSize: '1.1rem', fontWeight: 900, boxShadow: '0 12px 24px rgba(16, 185, 129, 0.2)' }}
                    >
                        {authLoading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : pt('verify_btn') || 'Verify & Continue'}
                    </button>

                    <button 
                        onClick={() => setPage('login')}
                        style={{ background: 'none', border: 'none', color: 'var(--lp-text-muted)', fontSize: '0.85rem', fontWeight: 800, marginTop: '2rem', cursor: 'pointer', opacity: 0.7 }}
                    >
                        {pt('change_phone_btn') || 'Change Phone Number'}
                    </button>
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

                {/* Split Profile Card */}
                <div className="lp-profile-card-wrapper animate-pop">
                    <div className="lp-profile-card">
                        <div className="lp-profile-top">
                            <img 
                                src={linePictureUrl || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop"} 
                                className="lp-profile-img" 
                                alt="Profile" 
                            />
                            <div className="lp-profile-info-main">
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px', color: 'white' }}>
                                    คุณ{currentUser?.name || pt('guest_user')}
                                </h3>
                                <div className="lp-profile-details-grid">
                                    <div className="lp-detail-item">
                                        <span>เลขคนไข้ (HN): {currentUser?.hn || '620200'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lp-profile-bottom">
                            <div className="lp-contact-item">
                                <Phone size={14} className="lp-contact-icon" />
                                <span>{currentUser?.phone || '09x-xxx-xxxx'}</span>
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

                {/* Navigation Bottom */}
                <div className="lp-bottom-nav">
                    <button className={`lp-nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
                        <Home size={22} />
                        <span>หน้าหลัก</span>
                    </button>
                    <button className={`lp-nav-item ${page === 'services' ? 'active' : ''}`} onClick={() => setPage('services')}>
                        <Percent size={22} />
                        <span>โปรโมชั่น</span>
                    </button>
                    
                    <button className="lp-nav-item lp-nav-fab" onClick={() => setPage('booking')}>
                        <div className="lp-nav-fab-inner">
                            <Calendar size={24} />
                        </div>
                    </button>

                    <button className="lp-nav-item" onClick={handleLogout} style={{ opacity: 0.5 }}>
                        <Menu size={22} />
                        <span>ตัวเลือก</span>
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
