import { useState, useEffect, useRef } from "react";
import {
    Calendar, CheckCircle2, Clock, Bell, User, LogOut,
    Stethoscope, Sparkles, Heart, Star, XCircle, Check,
    Loader2, Phone, ArrowLeft, MessageCircle
} from "lucide-react";
import { userService } from '../supabase';

// LIFF Integration
let liff = null;

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
    const [page, setPage] = useState('login');
    const [phoneNum, setPhoneNum] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [liffUserId, setLiffUserId] = useState('');
    const [liffProfile, setLiffProfile] = useState(null);
    const otpInputRef = useRef(null);

    // Booking state
    const [bookingService, setBookingService] = useState('');
    const [bookingBranch, setBookingBranch] = useState(BRANCHES[0]);
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('');
    const [userAppointments, setUserAppointments] = useState([]);
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    // Check existing session
    useEffect(() => {
        const storedUser = localStorage.getItem('ciki_portal_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            console.log('Found stored user:', user);
            
            // ใช้ข้อมูลใน cache ก่อนเลย เพื่อไม่ให้หายไป
            setCurrentUser(user);
            setPage('home');
            loadUserAppointments(user);
            
            // ค่อย sync ข้อมูลล่าสุดแบบ background
            const syncUserData = async () => {
                try {
                    let latestUser;
                    
                    // ลองค้นจาก LINE ID ก่อน
                    if (user.line_id) {
                        const { data: userByLine } = await userService.findUserByLineId(user.line_id);
                        if (userByLine) {
                            latestUser = userByLine;
                        }
                    }
                    
                    // ถ้าไม่เจอ ลองค้นจากเบอร์โทรศัพท์
                    if (!latestUser && user.phone) {
                        const { data: userByPhone } = await userService.findUserByPhone(user.phone);
                        if (userByPhone) {
                            latestUser = userByPhone;
                        }
                    }
                    
                    if (latestUser) {
                        console.log('Synced latest user data:', latestUser);
                        // อัปเดตข้อมูลใน state และ cache
                        setCurrentUser(latestUser);
                        localStorage.setItem('ciki_portal_user', JSON.stringify(latestUser));
                        await loadUserAppointments(latestUser);
                    } else {
                        // ถ้าไม่เจอข้อมูลในฐานข้อมูล คงข้อมูลใน cache และบันทึกลง Supabase
                        console.log('User not found in database, creating from cache');
                        try {
                            const { data: createdUser, error: createError } = await userService.createUser(user);
                            if (createError) {
                                console.error('Error creating user from cache:', createError);
                                // ถ้าสร้างไม่ได้ คงไว้ใน cache
                                console.log('Keeping cached data due to creation error');
                            } else {
                                console.log('Created user from cache:', createdUser);
                                // อัปเดตเป็นข้อมูลใหม่จาก Supabase
                                setCurrentUser(createdUser);
                                localStorage.setItem('ciki_portal_user', JSON.stringify(createdUser));
                                await loadUserAppointments(createdUser);
                            }
                        } catch (err) {
                            console.error('Error creating user from cache:', err);
                            console.log('Keeping cached data due to error');
                        }
                    }
                } catch (error) {
                    console.error('Error syncing user data:', error);
                    // ถ้าเกิดข้อผิดพลาด คงไว้ใน cache
                    console.log('Keeping cached data due to sync error');
                }
            };
            
            // รอ 2 วินาทีแล้วค่อย sync
            setTimeout(syncUserData, 2000);
        } else {
            // ไม่มีข้อมูลใน cache แสดงหน้า login
            setPage('login');
        }
        
        // Initialize LIFF
        initLiff();
    }, []);

    // LIFF Integration
    const initLiff = async () => {
        try {
            // Load LIFF SDK dynamically
            const script = document.createElement('script');
            script.src = 'https://static.line-scdn.net/liff/edge/2/LineLiff.min.js';
            script.onload = async () => {
                const liffModule = window.LineLiff;
                
                // Initialize LIFF with your LIFF ID
                await liffModule.init({ 
                    liffId: import.meta.env.VITE_LIFF_ID || "2009464079-vYchvQfG"
                }).catch(() => {
                    console.log("LIFF Init failed - likely local dev");
                });

                if (liffModule.isLoggedIn()) {
                    const profile = await liffModule.getProfile();
                    if (profile) {
                        setLiffProfile(profile);
                        setLiffUserId(profile.userId);
                        console.log("LIFF Profile Found:", profile.displayName);
                        
                        // Auto-sync with existing user or create new
                        await handleLiffLogin(profile);
                    }
                } else if (liffModule.isInClient()) {
                    // Auto-login if in LINE client
                    liffModule.login();
                }
            };
            document.head.appendChild(script);
        } catch (err) {
            console.error("LIFF Integration Error:", err);
        }
    };

    // Handle LIFF login
    const handleLiffLogin = async (profile) => {
        try {
            console.log('Processing LINE login for:', profile.displayName);
            
            // ค้นหาผู้ใช้จาก LINE ID ใน Supabase
            const { data: existingUser, error: findError } = await userService.findUserByLineId(profile.userId);
            
            if (findError) {
                console.error('Error finding user:', findError);
                alert('เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ใช้');
                return;
            }
            
            let user;
            
            if (existingUser) {
                // ผู้ใช้เดิม - อัปเดตข้อมูลล่าสุด
                const { data: updatedUser, error: updateError } = await userService.updateUser(existingUser.id, {
                    name: profile.displayName,
                    line_profile_pic: profile.pictureUrl,
                    last_login: new Date().toISOString()
                });
                
                if (updateError) {
                    console.error('Error updating user:', updateError);
                    alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
                    return;
                }
                
                user = updatedUser;
                console.log('Updated existing user:', user);
            } else {
                // ผู้ใช้ใหม่ - สร้างใหม่
                const { data: newUser, error: createError } = await userService.createUser({
                    name: profile.displayName,
                    line_id: profile.userId,
                    line_profile_pic: profile.pictureUrl,
                    points: 100,
                    tier: 'Gold'
                });
                
                if (createError) {
                    console.error('Error creating user:', createError);
                    alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้ใหม่');
                    return;
                }
                
                user = newUser;
                console.log('Created new user:', user);
            }
            
            localStorage.setItem('ciki_portal_user', JSON.stringify(user));
            setCurrentUser(user);
            setPage('home');
            await loadUserAppointments(user);
            
            alert(`ยินดีต้อนรับคุณ ${user.name}`);
            
            // ไม่ต้อง reload แล้ว เพราะจะ sync แบบ background
            
        } catch (error) {
            console.error('Error handling LIFF login:', error);
            alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        }
    };

    const loadUserAppointments = async (user) => {
        try {
            console.log('Loading appointments for user:', user.id);
            
            // ดึงข้อมูลนัดหมายจาก Supabase
            const { data: appointments, error } = await userService.getUserAppointments(user.id);
            
            if (error) {
                console.error('Error loading appointments:', error);
                // ถ้าเกิดข้อผิดพลาด ใช้ข้อมูลตัวอย่าง
                const mockAppointments = [
                    {
                        id: 'demo_1',
                        treatment: 'ตรวจสุขภาพช่องปาก',
                        date: '2024-03-29',
                        time: '10:00',
                        branch: 'สาขา สุขุมวิท',
                        status: 'Confirmed'
                    }
                ];
                setUserAppointments(mockAppointments);
                return;
            }
            
            console.log('Loaded appointments:', appointments);
            setUserAppointments(appointments || []);
            
        } catch (err) {
            console.error('Error in loadUserAppointments:', err);
            // ใช้ข้อมูลตัวอย่างถ้าเกิดข้อผิดพลาด
            const mockAppointments = [
                {
                    id: 'demo_1',
                    treatment: 'ตรวจสุขภาพช่องปาก',
                    date: '2024-03-29',
                    time: '10:00',
                    branch: 'สาขา สุขุมวิท',
                    status: 'Confirmed'
                }
            ];
            setUserAppointments(mockAppointments);
        }
    };

    const handleLogin = async () => {
        if (phoneNum.length < 10) {
            alert('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
            return;
        }

        setAuthLoading(true);
        
        // Demo OTP
        await new Promise(r => setTimeout(r, 1500));
        
        setAuthLoading(false);
        setPage('otp');
        setOtpCode('');
        
        alert(`🧪 Demo Mode - รหัส OTP: 123456\n\nใช้รหัสนี้เพื่อทดสอบการเข้าสู่ระบบ`);
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length < 6) {
            alert('กรุณากรอกรหัส OTP 6 หลัก');
            return;
        }

        setAuthLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        
        if (otpCode !== '123456') {
            alert('รหัส OTP ไม่ถูกต้อง');
            setAuthLoading(false);
            return;
        }

        setAuthLoading(false);

        try {
            console.log('Processing phone login for:', phoneNum);
            
            // ค้นหาผู้ใช้จากเบอร์โทรศัพท์ใน Supabase
            const { data: existingUser, error: findError } = await userService.findUserByPhone(phoneNum);
            
            if (findError) {
                console.error('Error finding user by phone:', findError);
                alert('เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ใช้');
                return;
            }
            
            let user;
            
            if (existingUser) {
                // ผู้ใช้เดิม - อัปเดตข้อมูลล่าสุด
                const { data: updatedUser, error: updateError } = await userService.updateUser(existingUser.id, {
                    last_login: new Date().toISOString()
                });
                
                if (updateError) {
                    console.error('Error updating user:', updateError);
                    alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
                    return;
                }
                
                user = updatedUser;
                console.log('Updated existing user by phone:', user);
            } else {
                // ผู้ใช้ใหม่ - สร้างใหม่
                const { data: newUser, error: createError } = await userService.createUser({
                    name: 'ลูกค้า CIKI',
                    phone: phoneNum,
                    points: 0,
                    tier: 'Standard'
                });
                
                if (createError) {
                    console.error('Error creating user:', createError);
                    alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้ใหม่');
                    return;
                }
                
                user = newUser;
                console.log('Created new user by phone:', user);
            }

            localStorage.setItem('ciki_portal_user', JSON.stringify(user));
            setCurrentUser(user);
            setPage('home');
            await loadUserAppointments(user);
            
            alert(`ยินดีต้อนรับคุณ ${user.name}`);
            
            // ไม่ต้อง reload แล้ว เพราะจะ sync แบบ background
            
        } catch (error) {
            console.error('Error in phone login:', error);
            alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('ciki_portal_user');
        setCurrentUser(null);
        setPage('login');
        setPhoneNum('');
        setOtpCode('');
        // ไม่ต้อง reload แล้ว
    };

    const handleBooking = async () => {
        if (!bookingService || !bookingTime) {
            alert('กรุณาเลือกบริการและเวลา');
            return;
        }

        try {
            const service = DENTAL_SERVICES.find(s => s.id === bookingService);
            
            console.log('Creating appointment:', {
                patient_id: currentUser.id,
                treatment: service.name,
                date: bookingDate,
                time: bookingTime,
                branch: bookingBranch
            });
            
            // บันทึกนัดหมายลง Supabase
            const { data: appointment, error } = await userService.createAppointment({
                patient_id: currentUser.id,
                patient_name: currentUser.name,
                phone: currentUser.phone,
                treatment: service.name,
                date: bookingDate,
                time: bookingTime,
                branch: bookingBranch
            });
            
            if (error) {
                console.error('Error creating appointment:', error);
                alert('เกิดข้อผิดพลาดในการจองนัดหมาย');
                return;
            }
            
            console.log('Appointment created:', appointment);
            
            // โหลดข้อมูลนัดหมายใหม่
            await loadUserAppointments(currentUser);
            
            alert(`จองนัดหมายสำเร็จ! ${service?.name} วันที่ ${bookingDate} เวลา ${bookingTime}`);
            setPage('booking-confirm');
            
        } catch (error) {
            console.error('Error in booking:', error);
            alert('เกิดข้อผิดพลาดในการจองนัดหมาย');
        }
    };

    // เพิ่มปุ่ม refresh ในหน้า home
const refreshUserData = async () => {
    try {
        console.log('Manually refreshing user data...');
        
        let latestUser;
        
        // ค้นหาจาก LINE ID ก่อน
        if (currentUser?.line_id) {
            const { data: userByLine } = await userService.findUserByLineId(currentUser.line_id);
            if (userByLine) {
                latestUser = userByLine;
            }
        }
        
        // ถ้าไม่เจอ ลองค้นจากเบอร์โทรศัพท์
        if (!latestUser && currentUser?.phone) {
            const { data: userByPhone } = await userService.findUserByPhone(currentUser.phone);
            if (userByPhone) {
                latestUser = userByPhone;
            }
        }
        
        if (latestUser) {
            console.log('Refreshed user data:', latestUser);
            setCurrentUser(latestUser);
            localStorage.setItem('ciki_portal_user', JSON.stringify(latestUser));
            await loadUserAppointments(latestUser);
            alert('อัปเดตข้อมูลเรียบร้อยแล้ว');
        } else {
            // ถ้าไม่เจอใน Supabase สร้างใหม่จากข้อมูลปัจจุบัน
            if (currentUser) {
                try {
                    const { data: createdUser, error: createError } = await userService.createUser(currentUser);
                    if (createError) {
                        console.error('Error creating user from current data:', createError);
                        alert('ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้');
                    } else {
                        console.log('Created user from current data:', createdUser);
                        setCurrentUser(createdUser);
                        localStorage.setItem('ciki_portal_user', JSON.stringify(createdUser));
                        await loadUserAppointments(createdUser);
                        alert('บันทึกข้อมูลลงฐานข้อมูลเรียบร้อยแล้ว');
                    }
                } catch (err) {
                    console.error('Error creating user:', err);
                    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
            }
        }
    } catch (error) {
        console.error('Error refreshing user data:', error);
        alert('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
    }
};

// ฟังก์ชันสำหรับบันทึกข้อมูลผู้ใช้ใหม่
const handleSaveProfile = async () => {
    try {
        console.log('Saving new user profile:', profileData);
        
        if (!profileData.name.trim()) {
            alert('กรุณากรอกชื่อ');
            return;
        }
        
        if (!profileData.phone.trim()) {
            alert('กรุณากรอกเบอร์โทรศัพท์');
            return;
        }
        
        // ตรวจว่าเบอร์ซ้ำกันหรือไม่
        const { data: existingUser } = await userService.findUserByPhone(profileData.phone);
        
        if (existingUser) {
            alert('เบอร์โทรศัพท์นี้มีในระบบแล้ว');
            return;
        }
        
        // สร้างผู้ใช้ใหม่
        const { data: newUser, error: createError } = await userService.createUser({
            name: profileData.name.trim(),
            phone: profileData.phone.trim(),
            email: profileData.email.trim(),
            points: 0,
            tier: 'Standard'
        });
        
        if (createError) {
            console.error('Error creating new user:', createError);
            alert('ไม่สามารถสร้างผู้ใช้ใหม่ได้');
            return;
        }
        
        console.log('Created new user:', newUser);
        
        // อัปเดต state และ cache
        setCurrentUser(newUser);
        localStorage.setItem('ciki_portal_user', JSON.stringify(newUser));
        await loadUserAppointments(newUser);
        
        // รีเซ็ตฟอร์ม
        setProfileData({ name: '', phone: '', email: '' });
        setShowProfileForm(false);
        
        alert(`สร้างผู้ใช้ใหม่สำเร็จ! ยินดีต้อนรับคุณ ${newUser.name}`);
        
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
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
            <div style={{ 
                width: '36px', 
                height: '36px', 
                background: '#00C300',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem'
            }}>
                CIKI
            </div>
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
                    onClick={() => setShowProfileForm(true)}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '50%'
                    }}
                >
                    <User size={20} />
                </button>
                <button 
                    onClick={refreshUserData}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '50%'
                    }}
                >
                    <Loader2 size={20} />
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
                    background: '#00C300',
                    borderRadius: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    boxShadow: '0 10px 25px rgba(0, 195, 0, 0.3)',
                    border: '2px solid #00A000'
                }}>
                    <span style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>CIKI</span>
                </div>
                
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>CIKI Dental Clinic</h1>
                <p style={{ color: '#6B7280', marginBottom: '3rem' }}>เข้าสู่ระบบ</p>

                <div style={{ width: '100%', maxWidth: '320px' }}>
                    {/* LINE Login Button */}
                    <button
                        style={{
                            width: '100%',
                            height: '3.5rem',
                            background: '#00C300',
                            color: 'white',
                            borderRadius: '1rem',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                        onClick={() => {
                            if (window.LineLiff && window.LineLiff.isLoggedIn()) {
                                handleLiffLogin(liffProfile);
                            } else if (window.LineLiff && window.LineLiff.isInClient()) {
                                window.LineLiff.login();
                            } else {
                                setPage('phone-login');
                            }
                        }}
                    >
                        <MessageCircle size={20} />
                        เข้าสู่ระบบด้วย LINE
                    </button>

                    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                        <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>หรือ</span>
                    </div>

                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.5rem', display: 'block' }}>
                        เบอร์โทรศัพท์
                    </label>
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Phone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={20} />
                        <input 
                            type="text"
                            placeholder="08x-xxx-xxxx" 
                            value={phoneNum} 
                            onChange={e => setPhoneNum(e.target.value.replace(/[^0-9]/g, ''))} 
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
                </div>
            </div>
        );
    }

    // ===== PHONE LOGIN PAGE =====
    if (page === 'phone-login') {
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
                <LineHeader title="เข้าสู่ระบบ" onBack={() => setPage('login')} />
                
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
                            onChange={e => setPhoneNum(e.target.value.replace(/[^0-9]/g, ''))} 
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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div 
                                key={i} 
                                style={{
                                    width: '40px',
                                    height: '56px',
                                    border: `2px solid ${otpCode.length === i - 1 ? '#1F2937' : '#E5E7EB'}`,
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 800
                                }}
                            >
                                {otpCode[i - 1] || ''}
                            </div>
                        ))}
                    </div>
                    
                    <input
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 6) setOtpCode(val);
                        }}
                        maxLength={6}
                        style={{ 
                            position: 'absolute', 
                            opacity: 0, 
                            pointerEvents: 'none'
                        }}
                        autoFocus
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
                        onClick={() => setPage('phone-login')}
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

    // ===== HOME PAGE =====
    if (page === 'home') {
        return (
            <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
                <LineHeader title="CIKI Dental" showProfile={true} />
                
                {/* Profile Form Modal */}
                {showProfileForm && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            width: '90%',
                            maxWidth: '400px',
                            boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                                    ลงทะเบียนผู้ใช้ใหม่
                                </h3>
                                <button 
                                    onClick={() => setShowProfileForm(false)}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        cursor: 'pointer',
                                        fontSize: '1.5rem',
                                        color: '#6B7280'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                                        ชื่อ-นามสกุล *
                                    </label>
                                    <input 
                                        type="text"
                                        value={profileData.name}
                                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                                        placeholder="กรอกชื่อ-นามสกุล"
                                        style={{
                                            width: '100%',
                                            height: '3rem',
                                            padding: '0 1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #E5E7EB',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                                        เบอร์โทรศัพท์ *
                                    </label>
                                    <input 
                                        type="text"
                                        value={profileData.phone}
                                        onChange={e => setProfileData({...profileData, phone: e.target.value.replace(/[^0-9]/g, '')})}
                                        placeholder="08x-xxx-xxxx"
                                        maxLength={10}
                                        style={{
                                            width: '100%',
                                            height: '3rem',
                                            padding: '0 1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #E5E7EB',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                                        อีเมล (ถ้ามี)
                                    </label>
                                    <input 
                                        type="email"
                                        value={profileData.email}
                                        onChange={e => setProfileData({...profileData, email: e.target.value})}
                                        placeholder="example@email.com"
                                        style={{
                                            width: '100%',
                                            height: '3rem',
                                            padding: '0 1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #E5E7EB',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button 
                                        onClick={() => setShowProfileForm(false)}
                                        style={{
                                            flex: 1,
                                            height: '3rem',
                                            background: '#F3F4F6',
                                            color: '#374151',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '0.5rem',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ยกเลิก
                                    </button>
                                    <button 
                                        onClick={handleSaveProfile}
                                        style={{
                                            flex: 1,
                                            height: '3rem',
                                            background: '#00C300',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        บันทึกข้อมูล
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div style={{ padding: '1rem' }}>
                    {/* Member Card with LINE Profile */}
                    <div style={{
                        background: liffProfile ? 'linear-gradient(135deg, #00C300, #00A000)' : 'linear-gradient(135deg, #2563EB, #1E40AF)',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        color: 'white',
                        marginBottom: '1.5rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {liffProfile?.pictureUrl && (
                                    <img 
                                        src={liffProfile.pictureUrl} 
                                        style={{ 
                                            width: '60px', 
                                            height: '60px', 
                                            borderRadius: '50%',
                                            border: '2px solid white'
                                        }} 
                                        alt="Profile"
                                    />
                                )}
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                                        {liffProfile?.displayName || currentUser?.name || 'สมาชิก CIKI'}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                                        {currentUser?.phone || phoneNum}
                                    </p>
                                    {liffProfile && (
                                        <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                                            🔗 ผ่าน LINE
                                        </p>
                                    )}
                                </div>
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
                                                    background: apt.status === 'Confirmed' ? '#D1FAE5' : '#FEF3C7',
                                                    color: apt.status === 'Confirmed' ? '#059669' : '#D97706'
                                                }}>
                                                    {apt.status === 'Confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
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
