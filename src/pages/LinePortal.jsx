import React, { useState, useEffect, useRef } from "react";
import liff from "@line/liff";
import {
    Calendar, CheckCircle2, Clock, Bell, User, LogOut,
    Stethoscope, Sparkles, Heart, Star, XCircle, Check,
    Loader2, Phone, ArrowLeft, ShieldCheck, Mail, MapPin,
    CreditCard, ChevronRight, History, Settings, MonitorSmartphone
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

    const handleLogin = async () => {
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

    const handleVerifyOtp = async () => {
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
        if (!bookingService || !bookingTime) {
            alert(pt('err_sel_service'));
            return;
        }

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

        await addAppointment(newAppointment);
        
        alert(`${pt('book_success_alert')} ${service?.name} ${bookingDate} ${bookingTime}`);

        loadUserAppointments(currentUser);
        setPage('booking-confirm');
    };

    const LineHeader = ({ title, onBack, showProfile = true }) => (
        <div className="lp-header lp-glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {onBack && (
                    <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                        <ArrowLeft size={22} color="var(--lp-text-main)" />
                    </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src="/logo.png" className="lp-logo" alt={pt("ciki_dental")} />
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.015em' }}>{pt("ciki_dental")}</span>
                </div>
            </div>
            
            {showProfile && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                        onClick={() => {
                            if (language === 'TH') setLanguage('EN');
                            else if (language === 'EN') setLanguage('CN');
                            else setLanguage('TH');
                        }}
                        style={{ 
                            background: 'white', 
                            border: '1px solid #eee', 
                            cursor: 'pointer', 
                            padding: '0.4rem 0.6rem', 
                            borderRadius: '12px',
                            fontWeight: 800,
                            color: 'var(--lp-text-main)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '40px'
                        }}
                    >
                        {language === 'CN' ? '中文' : language === 'EN' ? 'EN' : 'TH'}
                    </button>
                    <button 
                        onClick={handleLogout}
                        style={{ background: 'white', border: '1px solid #eee', cursor: 'pointer', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}
                    >
                        <LogOut size={16} color="#ef4444" />
                    </button>
                </div>
            )}
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
            <div className="lp-container" style={{ justifyContent: 'center', padding: '2rem', position: 'relative' }}>
                {/* Floating Language Button for Login Page */}
                <button 
                    onClick={() => {
                        if (language === 'TH') setLanguage('EN');
                        else if (language === 'EN') setLanguage('CN');
                        else setLanguage('TH');
                    }}
                    style={{ 
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'rgba(255,255,255,0.8)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(0,0,0,0.05)', 
                        cursor: 'pointer', 
                        padding: '0.5rem 0.75rem', 
                        borderRadius: '2rem',
                        fontWeight: 800,
                        color: 'var(--lp-text-main)',
                        fontSize: '0.8rem',
                        boxShadow: 'var(--lp-shadow-sm)'
                    }}
                >
                    {language === 'CN' ? '🌐 中文' : language === 'EN' ? '🌐 EN' : '🌐 ภาษาไทย'}
                </button>

                <div className="lp-glass" style={{ width: '100%', borderRadius: '2.5rem', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        background: 'white',
                        borderRadius: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: 'var(--lp-shadow-md)'
                    }}>
                        <img src="/logo.png" style={{ width: '70%', height: '70%', objectFit: 'contain' }} alt={pt("ciki_dental")} />
                    </div>
                    
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--lp-text-main)' }}>{pt("ciki_dental")}</h1>
                    <p style={{ color: 'var(--lp-text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>{pt('exp_future')}</p>

                    <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--lp-text-main)', marginBottom: '0.75rem', display: 'block', marginLeft: '0.5rem' }}>
                            {pt('phone_label')}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-primary)' }}>
                                <Phone size={20} />
                            </div>
                            <input 
                                className="lp-input"
                                type="text"
                                placeholder={pt('phone_placeholder')} 
                                value={phoneNum} 
                                onChange={e => setPhoneNum(e.target.value)} 
                                maxLength={10}
                            />
                        </div>
                    </div>
                    
                    <button className="lp-btn-primary" onClick={handleLogin} disabled={authLoading}>
                        {authLoading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : pt('send_otp')}
                    </button>
                    
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', color: 'var(--lp-text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <ShieldCheck size={18} />
                            <span style={{ fontSize: '0.65rem' }}>{pt('secure')}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <Sparkles size={18} />
                            <span style={{ fontSize: '0.65rem' }}>{pt('premium')}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== OTP PAGE =====
    if (page === 'otp') {
        return (
            <div className="lp-container" style={{ justifyContent: 'center', padding: '2rem' }}>
                <div className="lp-glass" style={{ width: '100%', borderRadius: '2.5rem', padding: '2.5rem 1.5rem', textAlign: 'center', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        top: '-1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#10b981',
                        color: 'white',
                        padding: '0.4rem 1rem',
                        borderRadius: '1rem',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                    }}>
                        VERIFICATION
                    </div>

                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: '#f8fafc', 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '1rem auto 1.5rem',
                        border: '1px solid #e2e8f0'
                    }}>
                        <ShieldCheck size={32} color="var(--lp-primary)" />
                    </div>
                    
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Verify Identity</h1>
                    <p style={{ color: 'var(--lp-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        OTP sent to <span style={{ color: 'var(--lp-text-main)', fontWeight: 700 }}>{phoneNum}</span>
                    </p>
                    
                    <div 
                        onClick={() => otpInputRef.current?.focus()}
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '0.65rem', 
                            marginBottom: '2rem',
                            cursor: 'pointer'
                        }}
                    >
                        {[1, 2, 3, 4, 5, 6].map(i => {
                            const isActive = otpCode.length === i - 1;
                            const isFilled = otpCode.length >= i;
                            return (
                                <div 
                                    key={i} 
                                    style={{
                                        width: '42px',
                                        height: '56px',
                                        border: `2px solid ${isActive ? 'var(--lp-primary)' : '#e5e7eb'}`,
                                        background: isActive ? 'rgba(16, 185, 129, 0.05)' : 'white',
                                        borderRadius: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 800,
                                        transition: 'all 0.2s',
                                        boxShadow: isActive ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
                                        color: isFilled ? 'var(--lp-text-main)' : 'transparent'
                                    }}
                                >
                                    {otpCode[i - 1] || '•'}
                                </div>
                            );
                        })}
                    </div>
                    
                    <input
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        value={otpCode}
                        onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 6) setOtpCode(val);
                        }}
                        maxLength={6}
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />

                    <button className="lp-btn-primary" onClick={handleVerifyOtp} disabled={authLoading}>
                        {authLoading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Verify & Continue'}
                    </button>
                    
                    <button 
                        onClick={() => setPage('login')}
                        style={{ background: 'none', border: 'none', color: 'var(--lp-text-muted)', fontSize: '0.85rem', marginTop: '1.5rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Resend Code
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

    // ===== HOME PAGE =====
    if (page === 'home') {
        const nextAppointment = userAppointments.find(a => a.status !== 'Completed');

        return (
            <div className="lp-container">
                <LineHeader title={pt('dashboard')} showProfile={true} />
                
                <div className="lp-content">
                    {/* Premium Member Card */}
                    <div className="lp-member-card">
                        <div className="shiny-effect"></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '60px', 
                                    height: '60px', 
                                    borderRadius: '50%', 
                                    overflow: 'hidden',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    background: 'white' 
                                }}>
                                    {linePictureUrl ? (
                                        <img src={linePictureUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lp-primary)', color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>
                                            {currentUser?.name?.charAt(0) || 'C'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.1rem', letterSpacing: '-0.02em' }}>
                                        {currentUser?.name || pt('guest_user')}
                                    </h3>
                                    <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.9, fontSize: '0.75rem' }}>
                                        <ShieldCheck size={12} color="#10b981" />
                                        <span style={{ color: 'white' }}>{pt('verified_patient')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="lp-pill" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                {pt('tier_' + (currentUser?.tier?.toLowerCase() || 'standard'))}
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                            <div>
                                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.25rem' }}>{pt('reward_points')}</p>
                                <p style={{ fontSize: '2.25rem', fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                                    {(currentUser?.points || 0).toLocaleString()} 
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>{pt('pts')}</span>
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <CreditCard size={24} style={{ opacity: 0.5 }} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="lp-grid-actions">
                        {[
                            { label: pt('booking'), icon: Calendar, pg: 'booking' },
                            { label: pt('services'), icon: Stethoscope, pg: 'services' },
                            { label: pt('timeline'), icon: History, pg: 'appointments' },
                        ].map(item => (
                            <button key={item.label} onClick={() => setPage(item.pg)} className="lp-action-btn" style={{ border: 'none' }}>
                                <div className="lp-icon-circle">
                                    <item.icon size={24} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lp-text-main)' }}>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Next Appointment Section */}
                    {nextAppointment && (
                        <div className="lp-card lp-glass" style={{ border: 'none', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Bell size={16} color="var(--lp-primary)" />
                                    Next Appointment
                                </h4>
                                <div className="lp-pill" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.65rem' }}>
                                    Confirmed
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--lp-background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={20} color="var(--lp-secondary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontSize: '1rem' }}>{nextAppointment.treatment}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{nextAppointment.date} at {nextAppointment.time}</p>
                                </div>
                                <ChevronRight size={18} style={{ color: '#ccc' }} />
                            </div>
                        </div>
                    )}

                    {/* Services Preview */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{pt('premium_services')}</h3>
                            <button onClick={() => setPage('services')} style={{ fontSize: '0.85rem', color: 'var(--lp-secondary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                                {pt('see_all')}
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {getDentalServices(pt).slice(0, 3).map(service => (
                                <div key={service.id} onClick={() => { setBookingService(service.id); setPage('booking'); }} className="lp-service-card" style={{ cursor: 'pointer' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--lp-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <service.icon size={22} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{service.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{service.duration}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--lp-primary)' }}>
                                            ฿{service.price.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== SERVICES PAGE =====
    if (page === 'services') {
        return (
            <div className="lp-container">
                <LineHeader title={pt('premium_services')} onBack={() => setPage('home')} />
                
                <div className="lp-content">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {getDentalServices(pt).map(service => (
                            <div key={service.id} onClick={() => { setBookingService(service.id); setPage('booking'); }} className="lp-service-card" style={{ padding: '1.25rem', cursor: 'pointer' }}>
                                <div style={{ 
                                    width: '56px', 
                                    height: '56px', 
                                    background: 'rgba(59, 130, 246, 0.1)', 
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--lp-secondary)'
                                }}>
                                    <service.icon size={28} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--lp-text-main)' }}>{service.name}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)', marginTop: '2px' }}>{service.duration}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--lp-primary)' }}>
                                        ฿{service.price.toLocaleString()}
                                    </p>
                                    <button className="lp-btn-accent" style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '10px' }}>
                                        Book Now
                                    </button>
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
                
                <div className="lp-content">
                    <div className="lp-glass" style={{ borderRadius: '2rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Select Service */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Stethoscope size={16} color="var(--lp-primary)" />
                                {pt('select_service_label')}
                            </label>
                            <select 
                                value={bookingService}
                                onChange={e => setBookingService(e.target.value)}
                                className="lp-input"
                                style={{ paddingLeft: '1.25rem' }}
                            >
                                <option value="">{pt('choose_treatment')}</option>
                                {getDentalServices(pt).map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} (฿{service.price.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Select Branch */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} color="var(--lp-secondary)" />
                                {pt('select_branch_label')}
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0.25rem 1.5rem 0.25rem' }}>
                                {getBranches(pt).map(branch => (
                                    <button
                                        key={branch}
                                        onClick={() => setBookingBranch(branch)}
                                        className={`lp-time-slot ${bookingBranch === branch ? 'selected' : ''}`}
                                        style={{ width: 'auto', padding: '0.75rem 1.5rem', flex: '0 0 auto', aspectRatio: 'auto' }}
                                    >
                                        {branch}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Select Date */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} color="var(--lp-primary)" />
                                {pt('choose_date')}
                            </label>
                            <input 
                                type="date"
                                className="lp-input"
                                style={{ paddingLeft: '1.25rem' }}
                                value={bookingDate}
                                onChange={e => setBookingDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* Select Time */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lp-text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={16} color="var(--lp-secondary)" />
                                {pt('avail_slots')}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                                {TIME_SLOTS.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => setBookingTime(time)}
                                        className={`lp-time-slot ${bookingTime === time ? 'selected' : ''}`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="lp-btn-primary"
                            onClick={handleBooking}
                            disabled={!bookingService || !bookingTime}
                            style={{ marginTop: '1rem', height: '4rem' }}
                        >
                            {pt('confirm_booking')}
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
