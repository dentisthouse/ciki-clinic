import React, { useState, useEffect, useRef } from "react";
import {
    Calendar, CheckCircle2, Clock, Bell, User, LogOut,
    Stethoscope, Sparkles, Heart, Star, XCircle, Check,
    Loader2, Phone, ArrowLeft
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { sendOTP, verifyOTP, formatPhoneNumber, isValidThaiPhone } from "../services/notificationService";
import { supabase } from "../supabase";

// ข้อมูลบริการคลินิกทันตกรรม
const DENTAL_SERVICES = [
    { id: 'checkup', name: 'ตรวจสุขภาพช่องปาก', price: 500, icon: Stethoscope, duration: '30 นาที' },
    { id: 'cleaning', name: 'ขูดหินปูน / Airflow', price: 1200, icon: Sparkles, duration: '45 นาที' },
    { id: 'filling', name: 'อุดฟัน (Composite)', price: 800, icon: Check, duration: '30-45 นาที' },
    { id: 'rootcanal', name: 'รักษารากฟัน', price: 4500, icon: Heart, duration: '60-90 นาที' },
    { id: 'crown', name: 'ครอบฟัน (Crown)', price: 8500, icon: Star, duration: '2 นัด' },
    { id: 'implant', name: 'รากฟันเทียม (Implant)', price: 35000, icon: CheckCircle2, duration: '3-6 เดือน' },
    { id: 'whitening', name: 'ฟอกสีฟัน (Whitening)', price: 6500, icon: Sparkles, duration: '60 นาที' },
    { id: 'extraction', name: 'ถอนฟัน', price: 1500, icon: XCircle, duration: '30 นาที' },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const BRANCHES = ['สาขา สุขุมวิท', 'สาขา สยามสแควร์', 'สาขา ลาดพร้าว'];

const LinePortal = () => {
    const { language } = useLanguage();
    const { patients, appointments, addAppointment } = useData();
    const [dbPatients, setDbPatients] = useState([]);
    
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
    const [bookingBranch, setBookingBranch] = useState(BRANCHES[0]);
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

                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile();
                    console.log("📱 LINE User Profile:", profile);
                    setLineUserId(profile.userId);
                    setLinePictureUrl(profile.pictureUrl || '');
                } else {
                    console.log("⚠️ User not logged in to LIFF");
                    // Optionally: liff.login();
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

    // Sync LINE info if missing (for already logged-in users)
    useEffect(() => {
        const syncLineInfo = async () => {
            if (currentUser && lineUserId) {
                // Check if current user data matches LINE data
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
                        // Update local state and storage
                        localStorage.setItem('ciki_portal_user', JSON.stringify(data));
                        setCurrentUser(data);
                    } else if (error) {
                        console.error('❌ Error syncing LINE info:', error);
                    }
                }
            }
        };

        syncLineInfo();
    }, [currentUser, lineUserId, linePictureUrl]);

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
            return apt.phone === user.phone || 
                   apt.patientId === user.id || 
                   apt.patientName === user.name;
        });
        
        setUserAppointments(userApts);
        console.log(`Found ${userApts.length} appointments for ${user.name}`);
    };

    const handleLogin = async () => {
        const formattedPhone = formatPhoneNumber(phoneNum);
        
        if (!isValidThaiPhone(formattedPhone)) {
            alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)');
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
                alert('ส่งรหัส OTP ไปยังเบอร์มือถือของคุณแล้ว');
            }
        } else {
            alert('เกิดข้อผิดพลาดในการส่ง OTP');
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length < 6) {
            alert('กรุณากรอกรหัส OTP 6 หลัก');
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

        // หาผู้ใช้จากฐานข้อมูล
        let user = dbPatients.find((p) => p.phone === phoneNum);
        
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
                await supabase
                    .from('patients')
                    .update(updates)
                    .eq('id', user.id);
            }

            // บันทึก session และเข้าสู่ระบบ
            localStorage.setItem('ciki_portal_user', JSON.stringify(user));
            setCurrentUser(user);
            loadUserAppointments(user);
            setPage('home');
            alert(`ยินดีต้อนรับคุณ ${user.name}`);
        } else {
            // ไปหน้าสมัครสมาชิก
            setPage('register');
        }
    };

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        
        if (!firstName.trim() || !lastName.trim()) {
            alert('กรุณากรอกชื่อและนามสกุล');
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
            alert(`ยินดีต้อนรับคุณ ${user.name} สมัครสมาชิกสำเร็จ!`);
        } catch (error) {
            console.error('❌ Error creating patient:', error);
            alert('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('ciki_portal_user');
        setCurrentUser(null);
        setPage('login');
        setPhoneNum('');
        setOtpCode('');
        alert('ออกจากระบบเรียบร้อยแล้ว');
    };

    const handleBooking = async () => {
        if (!bookingService || !bookingTime) {
            alert('กรุณาเลือกบริการและเวลา');
            return;
        }

        const service = DENTAL_SERVICES.find(s => s.id === bookingService);
        
        const newAppointment = {
            patientId: currentUser?.id,
            patientName: currentUser?.name || 'ลูกค้า LINE',
            phone: currentUser?.phone,
            date: bookingDate,
            time: bookingTime,
            treatment: service?.name,
            dentist: 'ทันตแพทย์ประจำ',
            branch: bookingBranch,
            type: 'LINE Booking',
            status: 'Pending'
        };

        await addAppointment(newAppointment);
        
        alert(`จองนัดหมายสำเร็จ! ${service?.name} วันที่ ${bookingDate} เวลา ${bookingTime}`);

        loadUserAppointments(currentUser);
        setPage('booking-confirm');
    };

    const LineHeader = ({ title, onBack, showProfile = true }) => (
        <div style={{ 
            background: 'rgba(255,255,255,0.95)', 
            backdropFilter: 'blur(10px)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderBottom: '1px solid #e5e7eb'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {onBack && (
                    <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft size={22} />
                    </button>
                )}
                <img src="/logo.png" style={{ height: '36px' }} alt="CIKI" />
            </div>
            
            {showProfile && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={() => setPage('appointments')}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '50%'
                        }}
                    >
                        <Calendar size={20} />
                    </button>
                    <button 
                        onClick={handleLogout}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '50%'
                        }}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            )}
        </div>
    );

    // ===== LOGIN PAGE =====
    if (page === 'login') {
        return (
            <div style={{ 
                minHeight: '100vh', 
                background: 'linear-gradient(to bottom, #F8F9FA, white)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{ 
                    width: '96px', 
                    height: '96px', 
                    background: 'white',
                    borderRadius: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    border: '2px solid #D1D5DB'
                }}>
                    <img src="/logo.png" style={{ width: '80%', height: '80%', objectFit: 'contain' }} alt="CIKI" />
                </div>
                
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>CIKI Dental Clinic</h1>
                <p style={{ color: '#6B7280', marginBottom: '3rem' }}>เข้าสู่ระบบด้วยเบอร์มือถือ</p>

                <div style={{ width: '100%', maxWidth: '320px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.5rem', display: 'block' }}>
                        เบอร์โทรศัพท์
                    </label>
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Phone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={20} />
                        <input 
                            type="text"
                            placeholder="08x-xxx-xxxx" 
                            value={phoneNum} 
                            onChange={e => setPhoneNum(e.target.value)} 
                            maxLength={10}
                            style={{
                                width: '100%',
                                height: '3.5rem',
                                paddingLeft: '3rem',
                                borderRadius: '1rem',
                                border: '2px solid #E5E7EB',
                                fontSize: '1.125rem',
                                fontWeight: 600
                            }}
                        />
                    </div>
                    
                    <button 
                        onClick={handleLogin}
                        disabled={authLoading}
                        style={{
                            width: '100%',
                            height: '3.5rem',
                            background: '#1F2937',
                            color: 'white',
                            borderRadius: '1rem',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: authLoading ? 'not-allowed' : 'pointer',
                            opacity: authLoading ? 0.7 : 1
                        }}
                    >
                        {authLoading ? 'กำลังส่ง...' : 'รับรหัส OTP'}
                    </button>
                    
                    <p style={{ fontSize: '0.625rem', color: '#9CA3AF', marginTop: '1rem', textAlign: 'center' }}>
                        การเข้าใช้ระบบถือว่าคุณยอมรับข้อเสนอและเงื่อนไขการให้บริการของคลินิก
                    </p>
                </div>
            </div>
        );
    }

    // ===== OTP PAGE =====
    if (page === 'otp') {
        return (
            <div style={{ 
                minHeight: '100vh', 
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                {/* Demo Mode Badge */}
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#FEF3C7',
                    color: '#D97706',
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🧪 Demo Mode
                </div>

                <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: '#F3F4F6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem'
                }}>
                    <span style={{ fontSize: '2rem' }}>🔒</span>
                </div>
                
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>ยืนยันตัวตน</h1>
                <p style={{ color: '#6B7280', marginBottom: '1rem', textAlign: 'center' }}>
                    ป้อนรหัส 6 หลักที่ส่งไปยังเบอร์ {phoneNum}
                </p>
                
                {/* Demo OTP Hint */}
                <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '2rem',
                    fontSize: '0.875rem',
                    color: '#166534',
                    textAlign: 'center',
                    fontWeight: 600
                }}>
                    💡 Demo Mode: ใช้รหัส <span style={{ 
                        background: '#22C55E', 
                        color: 'white', 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontFamily: 'monospace',
                        fontSize: '1rem'
                    }}>123456</span>
                </div>

                <div style={{ width: '100%', maxWidth: '320px' }}>
                    <div 
                        onClick={() => otpInputRef.current?.focus()}
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '0.5rem', 
                            marginBottom: '2rem',
                            cursor: 'pointer'
                        }}
                    >
                        {[1, 2, 3, 4, 5, 6].map(i => {
                            const isActive = otpCode.length === i - 1;
                            return (
                                <div 
                                    key={i} 
                                    style={{
                                        width: '40px',
                                        height: '56px',
                                        border: `2px solid ${isActive ? '#2563EB' : '#E5E7EB'}`,
                                        background: isActive ? '#EFF6FF' : 'white',
                                        borderRadius: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 800,
                                        transition: 'all 0.2s',
                                        boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none'
                                    }}
                                >
                                    {otpCode[i - 1] || ''}
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
                        style={{ 
                            position: 'absolute', 
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0, 
                            zIndex: -1,
                            pointerEvents: 'none'
                        }}
                    />

                    <button 
                        onClick={handleVerifyOtp}
                        disabled={authLoading}
                        style={{
                            width: '100%',
                            height: '3.5rem',
                            background: '#1F2937',
                            color: 'white',
                            borderRadius: '1rem',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: authLoading ? 'not-allowed' : 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        {authLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส OTP'}
                    </button>
                    
                    <button 
                        onClick={() => setPage('login')}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#1F2937',
                            fontWeight: 600,
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        ขอรหัสใหม่อีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    // ===== REGISTER PAGE =====
    if (page === 'register') {
        return (
            <div style={{ 
                minHeight: '100vh', 
                background: '#F8F9FA',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{ 
                    width: '320px', 
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    border: '1px solid #E5E7EB'
                }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>สมัครสมาชิก</h1>
                    <p style={{ color: '#6B7280', marginBottom: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        ยินดีต้อนรับ! กรุณากรอกข้อมูลเพื่อเริ่มใช้งาน
                    </p>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.5rem', display: 'block' }}>
                            ชื่อ
                        </label>
                        <input 
                            type="text"
                            placeholder="กรอกชื่อ" 
                            value={firstName} 
                            onChange={e => setFirstName(e.target.value)} 
                            style={{
                                width: '100%',
                                height: '3rem',
                                padding: '0 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #E5E7EB',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.5rem', display: 'block' }}>
                            นามสกุล
                        </label>
                        <input 
                            type="text"
                            placeholder="กรอกนามสกุล" 
                            value={lastName} 
                            onChange={e => setLastName(e.target.value)} 
                            style={{
                                width: '100%',
                                height: '3rem',
                                padding: '0 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #E5E7EB',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <button 
                        onClick={handleRegister}
                        disabled={registerLoading}
                        style={{
                            width: '100%',
                            height: '3.5rem',
                            background: '#2563EB',
                            color: 'white',
                            borderRadius: '1rem',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: registerLoading ? 'not-allowed' : 'pointer',
                            opacity: registerLoading ? 0.7 : 1
                        }}
                    >
                        {registerLoading ? 'กำลังบันทึก...' : 'สมัครสมาชิก'}
                    </button>
                    
                    <button 
                        onClick={() => setPage('login')}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#6B7280',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: '1rem'
                        }}
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        );
    }

    // ===== HOME PAGE =====
    if (page === 'home') {
        return (
            <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
                <LineHeader title="CIKI Dental" showProfile={true} />
                
                <div style={{ padding: '1rem' }}>
                    {/* Member Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, #2563EB, #1E40AF)',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        color: 'white',
                        marginBottom: '1.5rem',
                        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                                    {currentUser?.name || 'สมาชิก CIKI'}
                                </h3>
                                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>{currentUser?.phone || phoneNum}</p>
                            </div>
                            <div style={{ 
                                background: 'rgba(255,255,255,0.2)', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '2rem',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                {currentUser?.tier || 'Standard'}
                            </div>
                        </div>
                        
                        <div>
                            <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>คะแนนสะสม</p>
                            <p style={{ fontSize: '2rem', fontWeight: 800 }}>
                                {(currentUser?.points || 0).toLocaleString()} PTS
                            </p>
                        </div>
                    </div>

                    {/* Upcoming Appointment */}
                    {userAppointments.length > 0 && (
                        <div style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    background: '#DBEAFE', 
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Bell size={20} style={{ color: '#2563EB' }} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700 }}>นัดหมายถัดไป</p>
                                    <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                                        {userAppointments[0].treatment} • {userAppointments[0].date}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'จองคิว', icon: Calendar, pg: 'booking' },
                            { label: 'บริการ', icon: Stethoscope, pg: 'services' },
                            { label: 'นัดหมาย', icon: Clock, pg: 'appointments' },
                        ].map(item => (
                            <button 
                                key={item.label}
                                onClick={() => setPage(item.pg)}
                                style={{
                                    background: 'white',
                                    border: 'none',
                                    borderRadius: '1rem',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    background: '#F3F4F6', 
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <item.icon size={24} style={{ color: '#374151' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Services Preview */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 700 }}>บริการยอดนิยม</h3>
                            <button onClick={() => setPage('services')} style={{ fontSize: '0.875rem', color: '#2563EB', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                                ดูทั้งหมด
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {DENTAL_SERVICES.slice(0, 3).map(service => (
                                <div 
                                    key={service.id}
                                    onClick={() => {
                                        setBookingService(service.id);
                                        setPage('booking');
                                    }}
                                    style={{
                                        background: 'white',
                                        borderRadius: '1rem',
                                        padding: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        background: '#DBEAFE', 
                                        borderRadius: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <service.icon size={24} style={{ color: '#2563EB' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700 }}>{service.name}</p>
                                        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{service.duration}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 700, color: '#2563EB' }}>
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
            <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
                <LineHeader title="บริการทั้งหมด" onBack={() => setPage('home')} />
                
                <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {DENTAL_SERVICES.map(service => (
                            <div 
                                key={service.id}
                                onClick={() => {
                                    setBookingService(service.id);
                                    setPage('booking');
                                }}
                                style={{
                                    background: 'white',
                                    borderRadius: '1rem',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{ 
                                    width: '56px', 
                                    height: '56px', 
                                    background: '#DBEAFE', 
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <service.icon size={28} style={{ color: '#2563EB' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700 }}>{service.name}</p>
                                    <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{service.duration}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#2563EB' }}>
                                        ฿{service.price.toLocaleString()}
                                    </p>
                                    <button style={{ 
                                        background: '#2563EB', 
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        marginTop: '0.5rem'
                                    }}>
                                        จองเลย
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
            <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
                <LineHeader title="จองคิว" onBack={() => setPage('home')} />
                
                <div style={{ padding: '1rem' }}>
                    {/* Select Service */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                            เลือกบริการ
                        </label>
                        <select 
                            value={bookingService}
                            onChange={e => setBookingService(e.target.value)}
                            style={{
                                width: '100%',
                                height: '3.5rem',
                                padding: '0 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #E5E7EB',
                                fontSize: '1rem',
                                background: 'white'
                            }}
                        >
                            <option value="">เลือกบริการ</option>
                            {DENTAL_SERVICES.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} - ฿{service.price.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Select Branch */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                            เลือกสาขา
                        </label>
                        <select 
                            value={bookingBranch}
                            onChange={e => setBookingBranch(e.target.value)}
                            style={{
                                width: '100%',
                                height: '3.5rem',
                                padding: '0 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #E5E7EB',
                                fontSize: '1rem',
                                background: 'white'
                            }}
                        >
                            {BRANCHES.map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                    </div>

                    {/* Select Date */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                            เลือกวันที่
                        </label>
                        <input 
                            type="date"
                            value={bookingDate}
                            onChange={e => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{
                                width: '100%',
                                height: '3.5rem',
                                padding: '0 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #E5E7EB',
                                fontSize: '1rem',
                                background: 'white'
                            }}
                        />
                    </div>

                    {/* Select Time */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                            เลือกเวลา
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            {TIME_SLOTS.map(time => (
                                <button
                                    key={time}
                                    onClick={() => setBookingTime(time)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        border: 'none',
                                        fontSize: '0.875rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: bookingTime === time ? '#2563EB' : 'white',
                                        color: bookingTime === time ? 'white' : '#374151'
                                    }}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleBooking}
                        disabled={!bookingService || !bookingTime}
                        style={{
                            width: '100%',
                            height: '3.5rem',
                            background: !bookingService || !bookingTime ? '#9CA3AF' : '#2563EB',
                            color: 'white',
                            borderRadius: '0.75rem',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: !bookingService || !bookingTime ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ยืนยันการจอง
                    </button>
                </div>
            </div>
        );
    }

    // ===== BOOKING CONFIRM PAGE =====
    if (page === 'booking-confirm') {
        const service = DENTAL_SERVICES.find(s => s.id === bookingService);
        
        return (
            <div style={{ 
                minHeight: '100vh', 
                background: '#F3F4F6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{ 
                    width: '96px', 
                    height: '96px', 
                    background: '#D1FAE5',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <CheckCircle2 size={48} style={{ color: '#059669' }} />
                </div>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>จองสำเร็จ!</h2>
                <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '2rem' }}>
                    เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการนัดหมาย
                </p>

                <div style={{ 
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    width: '100%',
                    maxWidth: '320px',
                    marginBottom: '2rem'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>บริการ</span>
                            <span style={{ fontWeight: 700 }}>{service?.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>วันที่</span>
                            <span style={{ fontWeight: 700 }}>{bookingDate}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>เวลา</span>
                            <span style={{ fontWeight: 700 }}>{bookingTime}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>สาขา</span>
                            <span style={{ fontWeight: 700 }}>{bookingBranch}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setPage('home')}
                    style={{
                        width: '100%',
                        maxWidth: '320px',
                        height: '3.5rem',
                        background: '#2563EB',
                        color: 'white',
                        borderRadius: '0.75rem',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    กลับหน้าหลัก
                </button>
            </div>
        );
    }

    // ===== APPOINTMENTS PAGE =====
    if (page === 'appointments') {
        return (
            <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
                <LineHeader title="นัดหมายของฉัน" onBack={() => setPage('home')} />
                
                <div style={{ padding: '1rem' }}>
                    {userAppointments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <Calendar size={48} style={{ color: '#D1D5DB', margin: '0 auto 1rem' }} />
                            <p style={{ color: '#6B7280' }}>ยังไม่มีนัดหมาย</p>
                            <button 
                                onClick={() => setPage('booking')}
                                style={{ 
                                    background: 'none',
                                    border: '1px solid #2563EB',
                                    color: '#2563EB',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    marginTop: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                จองคิวเลย
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {userAppointments.map((apt, idx) => (
                                <div 
                                    key={idx}
                                    style={{
                                        background: 'white',
                                        borderRadius: '1rem',
                                        padding: '1rem',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ 
                                            width: '48px', 
                                            height: '48px', 
                                            background: '#DBEAFE', 
                                            borderRadius: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Stethoscope size={24} style={{ color: '#2563EB' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 700 }}>{apt.treatment}</p>
                                            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                                                {apt.date} • {apt.time}
                                            </p>
                                            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                                                {apt.branch || 'สาขาหลัก'}
                                            </p>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    background: apt.status === 'Confirmed' ? '#D1FAE5' : 
                                                               apt.status === 'Pending' ? '#FEF3C7' : '#F3F4F6',
                                                    color: apt.status === 'Confirmed' ? '#059669' : 
                                                          apt.status === 'Pending' ? '#D97706' : '#374151'
                                                }}>
                                                    {apt.status === 'Confirmed' ? 'ยืนยันแล้ว' :
                                                     apt.status === 'Pending' ? 'รอยืนยัน' : apt.status}
                                                </span>
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
