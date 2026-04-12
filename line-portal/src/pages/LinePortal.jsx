import { useState, useEffect, useRef, useMemo } from "react";
import {
    Calendar, CheckCircle2, Clock, Bell, User, LogOut,
    Stethoscope, Sparkles, Heart, Star, XCircle, Check,
    Loader2, Phone, ArrowLeft, MessageCircle, MapPin, 
    Navigation, Activity, Scissors, CreditCard, Zap, History,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Premium Components
import { Header } from '../components/Header';
import { MemberCard } from '../components/MemberCard';
import { BranchCard } from '../components/BranchCard';
import { ServiceCard } from '../components/ServiceCard';
import { ActionCard } from '../components/ActionCard';
import { AppointmentCard } from '../components/AppointmentCard';
import { PortalLayout } from '../components/PortalLayout';

import { userService } from '../supabase';

// LIFF Integration
let liff = null;

// ข้อมูลบริการคลินิกทันตกรรม
const DENTAL_SERVICES = [
    { id: 'checkup', name: 'ตรวจสุขภาพช่องปาก', price: 500, icon: Stethoscope, duration: '30 นาที', isPopular: true },
    { id: 'cleaning', name: 'ขูดหินปูน / Airflow', price: 1200, icon: Sparkles, duration: '45 นาที', isPopular: true },
    { id: 'filling', name: 'อุดฟัน (Composite)', price: 800, icon: Check, duration: '30-45 นาที' },
    { id: 'rootcanal', name: 'รักษารากฟัน', price: 4500, icon: Heart, duration: '60-90 นาที' },
    { id: 'crown', name: 'ครอบฟัน (Crown)', price: 8500, icon: Star, duration: '2 นัด' },
    { id: 'implant', name: 'รากฟันเทียม (Implant)', price: 35000, icon: CheckCircle2, duration: '3-6 เดือน' },
    { id: 'whitening', name: 'ฟอกสีฟัน (Whitening)', price: 6500, icon: Sparkles, duration: '60 นาที', isPopular: true },
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
        name: '', phone: '', email: ''
    });

    // Reschedule mode
    const [rescheduleId, setRescheduleId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState(null);

    // Check existing session
    useEffect(() => {
        // 🔥 DUAL-CHANNEL DETECTOR: Check both search (?) AND hash (#)
        const getParams = () => {
            const search = new URLSearchParams(window.location.search);
            const hash = new URLSearchParams(window.location.hash.substring(1));
            return {
                action: search.get('action') || hash.get('action'),
                apt: search.get('apt') || hash.get('apt')
            };
        };

        const { action, apt: aptId } = getParams();
        const isRescheduling = action === 'reschedule' && aptId;
        
        if (isRescheduling) {
            console.log("🎯 DETECTED ON DUAL-CHANNEL:", action, aptId);
            setRescheduleId(aptId);
            setPage('booking'); // Force 'booking' immediately!
            fetchRescheduleData(aptId);
        }

        const storedUser = localStorage.getItem('ciki_portal_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            // ถ้าไม่ใช้โหมดเลื่อนนัด ให้ไปหน้า home ปกติ
            if (!isRescheduling) {
                setPage('home');
                loadUserAppointments(user);
            }
            
            const syncUserData = async () => {
                try {
                    let latestUser;
                    if (user.line_id) {
                        const { data: userByLine } = await userService.findUserByLineId(user.line_id);
                        if (userByLine) latestUser = userByLine;
                    }
                    if (!latestUser && user.phone) {
                        const { data: userByPhone } = await userService.findUserByPhone(user.phone);
                        if (userByPhone) latestUser = userByPhone;
                    }
                    if (latestUser) {
                        setCurrentUser(latestUser);
                        localStorage.setItem('ciki_portal_user', JSON.stringify(latestUser));
                        await loadUserAppointments(latestUser);
                    }
                } catch (error) {}
            };
            setTimeout(syncUserData, 2000);
        } else if (!isRescheduling) {
            // ONLY set to login if we are NOT in reschedule mode
            setPage('login');
        }
        initLiff();
    }, []);

    const fetchRescheduleData = async (id) => {
        try {
            const { data, error } = await userService.supabase
                .from('appointments')
                .select('*')
                .eq('id', id)
                .single();
            
            if (data) {
                console.log('Found reschedule data:', data);
                setRescheduleData(data);
                // Pre-fill fields
                const serviceMatch = DENTAL_SERVICES.find(s => s.name === data.treatment);
                if (serviceMatch) {
                    setBookingService(serviceMatch.id);
                }
                setBookingBranch(data.branch);
                setBookingDate(data.date);
                setPage('booking'); // Auto-navigate to booking page if rescheduling
            }
        } catch (e) {
            console.error("Reschedule fetch error:", e);
        }
    };

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
                    // Auto-login if in LINE client - KEEP PARAMS!
                    liffModule.login({ redirectUri: window.location.href });
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
            
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const isRescheduling = (urlParams.get('action') === 'reschedule' || hashParams.get('action') === 'reschedule');
            const aptId = urlParams.get('apt') || hashParams.get('apt');
            
            console.log("LOGIN SUCCESS: Rescheduling detected?", isRescheduling);
            
            if (!isRescheduling) {
                setPage('home');
            } else {
                console.log("FORCE BOOKING PAGE FOR RESCHEDULE");
                setPage('booking');
                if (aptId) {
                    setRescheduleId(aptId);
                    fetchRescheduleData(aptId);
                }
            }
            
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
            
            // 🔥 DOUBLE LOCK: Check URL directly
            const urlParams = new URLSearchParams(window.location.search);
            const isRescheduling = urlParams.get('action') === 'reschedule';

            if (!isRescheduling) {
                setPage('home');
            }
            
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
            
            if (rescheduleId) {
                // UPDATE MODE
                console.log('Updating existing appointment:', rescheduleId);
                const oldDate = rescheduleData?.date || 'ไม่ทราบวันเดิม';
                const { error } = await userService.supabase
                    .from('appointments')
                    .update({
                        date: bookingDate,
                        time: bookingTime,
                        branch: bookingBranch,
                        status: 'Confirmed', // Reset status to Confirmed
                        notes: `📱 [LINE] 📅 เลื่อนนัดมาจากวันที่ ${oldDate}` // บันทึกให้เห็นหน้า Schedule
                    })
                    .eq('id', rescheduleId);

                if (error) {
                    console.error('Update error:', error);
                    alert('ไม่สามารถเลื่อนนัดหมายได้');
                    return;
                }
                alert(`เลื่อนนัดหมายสำเร็จ! เป็นวันที่ ${bookingDate} เวลา ${bookingTime}`);
                setRescheduleId(null);
                setRescheduleData(null);
            } else {
                // INSERT MODE
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
                    console.error('Error creating:', error);
                    alert('เกิดข้อผิดพลาดในการจอง');
                    return;
                }
                alert(`จองนัดหมายสำเร็จ! ${service?.name} วันที่ ${bookingDate} เวลา ${bookingTime}`);
            }
            
            await loadUserAppointments(currentUser);
            setPage('home');
            
        } catch (error) {
            console.error('Error in booking:', error);
            alert('เกิดข้อผิดพลาด');
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

    const DebugBanner = () => {
        const p = getAppParams();
        if (p.action !== 'reschedule') return null;
        return (
            <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center shadow-lg pointer-events-none">
                 Reschedule Mode Active | Apt Ref: {p.apt?.slice(-8)}
            </div>
        );
    };

    // ===== LOGIN PAGE =====
    if (page === 'login') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-teal-500/5 rounded-full blur-[100px]"></div>
                
                <DebugBanner />
                
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-24 h-24 line-green rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-200 border-4 border-white relative z-10"
                >
                    <span className="text-white text-3xl font-black tracking-tighter">CIKI</span>
                </motion.div>
                
                <div className="text-center mb-12 relative z-10">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-3 transition-all">
                        CIKI <span className="text-premium">Dental</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Your Premium Dental Partner</p>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm space-y-6 relative z-10"
                >
                    <button
                        className="w-full h-16 bg-[#06C755] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 hover:brightness-110 active:scale-[0.98] transition-all"
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
                        <MessageCircle size={20} className="fill-current" />
                        Login with LINE
                    </button>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or phone number</span>
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                <Phone size={20} />
                            </div>
                            <input 
                                type="text"
                                placeholder="08x-xxx-xxxx" 
                                value={phoneNum} 
                                onChange={e => setPhoneNum(e.target.value.replace(/[^0-9]/g, ''))} 
                                maxLength={10}
                                className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 outline-none transition-all shadow-inner"
                            />
                        </div>
                        
                        <button 
                            onClick={handleLogin}
                            disabled={authLoading}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-emerald-600 disabled:bg-slate-300 active:scale-[0.98] transition-all"
                        >
                            {authLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Request OTP'}
                        </button>
                    </div>
                </motion.div>
                
                <footer className="mt-20 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    &copy; 2024 CIKI CLINIC
                </footer>
            </div>
        );
    }

    // ===== PHONE LOGIN PAGE =====
    if (page === 'phone-login') {
        return (
            <PortalLayout 
                activePage="phone-login"
                onBack={() => setPage('login')}
            >
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-sm mx-auto space-y-8 pt-10"
                >
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Login with phone number</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Phone size={20} />
                            </div>
                            <input 
                                type="text"
                                placeholder="08x-xxx-xxxx" 
                                value={phoneNum} 
                                onChange={e => setPhoneNum(e.target.value.replace(/[^0-9]/g, ''))} 
                                maxLength={10}
                                className="w-full h-16 pl-14 pr-6 glass bg-white border border-slate-100 rounded-2xl text-lg font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            />
                        </div>
                        
                        <button 
                            onClick={handleLogin}
                            disabled={authLoading}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-emerald-600 active:scale-[0.98] transition-all"
                        >
                            {authLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send Verification OTP'}
                        </button>
                    </div>
                </motion.div>
            </PortalLayout>
        );
    }

    // ===== OTP PAGE =====
    if (page === 'otp') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 z-20">
                    <div className="px-4 py-2 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-sm border border-amber-200">
                        <Zap size={12} className="fill-current" />
                        Demo Mode
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-sm glass bg-white/80 p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative z-10 text-center"
                >
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3">
                        <CheckCircle2 size={32} />
                    </div>
                    
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Verify Phone</h1>
                    <p className="text-sm font-semibold text-slate-400 mb-8 leading-relaxed">
                        We sent a 6-digit code to<br />
                        <span className="text-slate-800 font-black">{phoneNum}</span>
                    </p>
                    
                    <div className="flex justify-between gap-2.5 mb-10">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <div 
                                key={i} 
                                className={`w-full aspect-[3/4] rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                                    otpCode.length === i 
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                        : 'border-slate-100 bg-slate-50 text-slate-800'
                                }`}
                            >
                                {otpCode[i] || ''}
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
                            if (val.length <= 6) {
                                setOtpCode(val);
                                if (val.length === 6) setTimeout(handleVerifyOtp, 500);
                            }
                        }}
                        autoFocus
                        className="absolute inset-0 opacity-0 pointer-events-none"
                    />

                    <div className="space-y-4">
                        <button 
                            onClick={handleVerifyOtp}
                            disabled={authLoading || otpCode.length < 6}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-emerald-600 disabled:bg-slate-200 active:scale-[0.98] transition-all"
                        >
                            {authLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify & Continue'}
                        </button>
                        
                        <div className="pt-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none opacity-50">Demo Code</p>
                             <div className="text-emerald-600 font-black tracking-[0.2em] text-lg">123456</div>
                        </div>

                        <button 
                            onClick={() => setPage('login')}
                            className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors pt-4"
                        >
                            Change Number
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ===== HOME PAGE =====
    if (page === 'home') {
        return (
            <PortalLayout 
                activePage="home"
                user={currentUser}
                liffProfile={liffProfile}
                onNavigate={(pg) => {
                    if (pg === 'logout') handleLogout();
                    else if (pg === 'refresh') refreshUserData();
                    else if (pg === 'profile') setShowProfileForm(true);
                    else setPage(pg);
                }}
            >
                <DebugBanner />
                
                {/* Profile Form Modal */}
                {showProfileForm && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl overflow-hidden relative"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Profile</h3>
                                <button 
                                    onClick={() => setShowProfileForm(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <ProfileInput 
                                    label="Full Name" 
                                    value={profileData.name} 
                                    onChange={v => setProfileData({...profileData, name: v})} 
                                    placeholder="Enter your name"
                                />
                                <ProfileInput 
                                    label="Phone Number" 
                                    value={profileData.phone} 
                                    onChange={v => setProfileData({...profileData, phone: v.replace(/[^0-9]/g, '')})} 
                                    placeholder="08x-xxx-xxxx"
                                    maxLength={10}
                                />
                                <ProfileInput 
                                    label="Email Address" 
                                    value={profileData.email} 
                                    onChange={v => setProfileData({...profileData, email: v})} 
                                    placeholder="your@email.com"
                                />
                                
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={handleSaveProfile}
                                        className="flex-1 h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-95"
                                    >
                                        Update Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                
                <div className="space-y-8 pb-10">
                    <MemberCard user={currentUser} liffProfile={liffProfile} />

                    <section>
                        <div className="flex justify-between items-baseline mb-4">
                             <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Actions</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <ActionCard 
                                label="Booking" 
                                icon={Calendar} 
                                onClick={() => setPage('booking')} 
                                color="emerald"
                            />
                            <ActionCard 
                                label="Services" 
                                icon={Stethoscope} 
                                onClick={() => setPage('services')} 
                                color="blue"
                            />
                            <ActionCard 
                                label="History" 
                                icon={Clock} 
                                onClick={() => setPage('appointments')} 
                                color="amber"
                            />
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-baseline mb-5">
                             <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-400">Popular Services</h3>
                             <button onClick={() => setPage('services')} className="text-[11px] font-black uppercase tracking-widest text-emerald-600 hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {DENTAL_SERVICES.filter(s => s.isPopular).slice(0, 3).map(service => (
                                <ServiceCard 
                                    key={service.id} 
                                    service={service} 
                                    isPopular
                                    onClick={() => {
                                        setBookingService(service.id);
                                        setPage('booking');
                                    }}
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                         <div className="flex justify-between items-baseline mb-5">
                             <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-400">Our Branches</h3>
                        </div>
                        <div className="space-y-4">
                           {BRANCHES.map(branch => (
                               <BranchCard key={branch} name={branch} isCompact />
                           ))}
                        </div>
                    </section>
                </div>
            </PortalLayout>
        );
    }

    const ProfileInput = ({ label, value, onChange, placeholder, maxLength }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
            <input 
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className="w-full h-14 px-5 glass bg-slate-50 border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
            />
        </div>
    );

    // ===== SERVICES PAGE =====
    if (page === 'services') {
        return (
            <PortalLayout 
                activePage="services"
                title="Our Services"
                onBack={() => setPage('home')}
                showProfile={true}
                user={currentUser}
                liffProfile={liffProfile}
                onNavigate={(pg) => {
                    if (pg === 'logout') handleLogout();
                    else if (pg === 'refresh') refreshUserData();
                    else setPage(pg);
                }}
            >
                <div className="space-y-6">
                    <header className="mb-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight pt-4 px-2">Premium Dental Solutions</h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 px-2">Tailored care for your perfect smile</p>
                    </header>
                    
                    <div className="space-y-4">
                        {DENTAL_SERVICES.map(service => (
                            <ServiceCard 
                                key={service.id} 
                                service={service} 
                                onClick={() => {
                                    setBookingService(service.id);
                                    setPage('booking');
                                }} 
                            />
                        ))}
                    </div>
                </div>
            </PortalLayout>
        );
    }

    // ===== BOOKING PAGE =====
    if (page === 'booking') {
        const selectedService = DENTAL_SERVICES.find(s => s.id === bookingService);
        
        return (
            <PortalLayout 
                activePage="booking"
                title={rescheduleId ? "Reschedule" : "New Booking"}
                onBack={() => setPage('home')}
                showProfile={true}
                user={currentUser}
                liffProfile={liffProfile}
                onNavigate={(pg) => {
                    if (pg === 'logout') handleLogout();
                    else if (pg === 'refresh') refreshUserData();
                    else setPage(pg);
                }}
            >
                <div className="space-y-8 animate-in fade-in duration-700">
                    <header className="px-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight pt-4">Plan Your Visit</h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Select your preferred time & branch</p>
                    </header>

                    <div className="space-y-6">
                        {/* Service Summary (If pre-selected) */}
                        {selectedService && (
                            <div className="glass-dark p-6 rounded-[2.5rem] text-white flex items-center gap-5 shadow-2xl shadow-emerald-900/10">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <selectedService.icon size={32} className="text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black tracking-tight leading-tight">{selectedService.name}</h4>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">{selectedService.duration} • ฿{selectedService.price.toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <BookingSelect 
                                label="Treatment Service" 
                                value={bookingService} 
                                onChange={setBookingService}
                                disabled={!!rescheduleId}
                                options={DENTAL_SERVICES.map(s => ({ value: s.id, label: s.name }))}
                            />
                            
                            {/* Branch Selection with Maps */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Preferred Location</label>
                                <div className="grid grid-cols-1 gap-4">
                                    {BRANCHES.map(branch => (
                                        <div 
                                            key={branch} 
                                            className={`transition-all duration-300 ${bookingBranch === branch ? 'ring-4 ring-emerald-500/10' : ''}`}
                                            onClick={() => setBookingBranch(branch)}
                                        >
                                            <BranchCard name={branch} isCompact />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Select Date</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <Calendar size={18} />
                                        </div>
                                        <input 
                                            type="date"
                                            value={bookingDate}
                                            onChange={e => setBookingDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full h-16 pl-14 pr-6 glass bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Available Slots</label>
                                    <div className="grid grid-cols-4 gap-2.5">
                                        {TIME_SLOTS.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setBookingTime(time)}
                                                className={`h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                                                    bookingTime === time 
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 -translate-y-1' 
                                                        : 'bg-white border-slate-50 text-slate-400 hover:border-emerald-100 hover:text-slate-600'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleBooking}
                            disabled={!bookingService || !bookingTime}
                            className="w-full h-20 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-emerald-600 hover:-translate-y-1 active:scale-95 transition-all disabled:bg-slate-200 disabled:shadow-none disabled:translate-y-0"
                        >
                            {rescheduleId ? 'Update Appointment' : 'Confirm My Visit'}
                        </button>
                    </div>
                </div>
            </PortalLayout>
        );
    }

    const BookingSelect = ({ label, value, onChange, options, disabled }) => (
        <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">{label}</label>
            <div className="relative group">
                 <select 
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={`w-full h-16 px-6 glass bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <option value="">Choose Service</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <ChevronRight size={20} className="rotate-90" />
                </div>
            </div>
        </div>
    );

    // ===== BOOKING CONFIRM PAGE =====
    if (page === 'booking-confirm') {
        const service = DENTAL_SERVICES.find(s => s.id === bookingService);
        
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
                
                <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-sm glass bg-white/90 p-10 rounded-[3.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.1)] border border-white text-center flex flex-col items-center"
                >
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-200 animate-bounce-slow">
                        <CheckCircle2 size={48} strokeWidth={2.5} />
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2 italic">Success!</h2>
                    <p className="text-sm font-semibold text-slate-400 mb-10 leading-relaxed px-4">
                        Your smile is on the schedule. See you soon!
                    </p>

                    <div className="w-full space-y-4 py-8 px-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 relative mb-10">
                        {/* Decorative punch holes for receipt look */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full border border-slate-200 shadow-inner"></div>
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full border border-slate-200 shadow-inner"></div>
                        
                        <ReceiptRow label="Service" value={service?.name} bold />
                        <ReceiptRow label="Date" value={bookingDate} />
                        <ReceiptRow label="Time" value={bookingTime} />
                        <ReceiptRow label="Branch" value={bookingBranch} />
                        
                        <div className="pt-4 mt-4 border-t border-slate-200/50 flex justify-between items-center">
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Confirmation code</div>
                             <div className="text-xs font-black text-slate-800 tracking-[0.2em]">#{Math.random().toString(36).substring(7).toUpperCase()}</div>
                        </div>
                    </div>

                    <button
                        onClick={() => setPage('home')}
                        className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-emerald-600 active:scale-95 transition-all"
                    >
                        Back to Portal
                    </button>
                </motion.div>
                
                <p className="mt-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest max-w-[200px] text-center leading-relaxed">
                    A WhatsApp/LINE confirmation will be sent shortly.
                </p>
            </div>
        );
    }

    const ReceiptRow = ({ label, value, bold }) => (
        <div className="flex justify-between items-center text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <span className={`text-sm tracking-tight ${bold ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{value}</span>
        </div>
    );

    // ===== APPOINTMENTS PAGE =====
    if (page === 'appointments') {
        const sortedAppointments = [...userAppointments].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return (
            <PortalLayout 
                activePage="appointments"
                title="My History"
                onBack={() => setPage('home')}
                showProfile={true}
                user={currentUser}
                liffProfile={liffProfile}
                onNavigate={(pg) => {
                    if (pg === 'logout') handleLogout();
                    else if (pg === 'refresh') refreshUserData();
                    else setPage(pg);
                }}
            >
                <div className="space-y-6">
                    <header className="mb-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight pt-4 px-2">Your Smile Timeline</h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 px-2">Keep track of your journey with us</p>
                    </header>

                    <div className="space-y-4">
                        {sortedAppointments.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20 px-8 glass rounded-[3rem] bg-white border border-slate-100"
                            >
                                <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl mx-auto mb-6 text-slate-300">
                                    <History size={40} />
                                </div>
                                <h4 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">No Past Appointments</h4>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">Ready to start your dental care journey?</p>
                                <button 
                                    onClick={() => setPage('booking')}
                                    className="h-16 px-10 bg-slate-900 shadow-xl shadow-slate-200 text-white rounded-full font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all hover:bg-emerald-600"
                                >
                                    Book Your First Visit
                                </button>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {sortedAppointments.map((apt, idx) => (
                                    <AppointmentCard 
                                        key={apt.id || idx} 
                                        appointment={apt} 
                                        onClick={() => {
                                            // Handle detail view if needed
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PortalLayout>
        );
    }

    return null;
};

export default LinePortal;
