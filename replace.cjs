const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/LinePortal.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Add import
if (!content.includes('PORTAL_TRANS')) {
    content = content.replace('export default LinePortal;', '');
    content = content.replace(
        'import { supabase } from "../supabase";',
        'import { supabase } from "../supabase";\nimport { PORTAL_TRANS } from "../locales/portalTranslations";'
    );
}

// Add translator function
if (!content.includes('const pt =')) {
    content = content.replace(
        'const { language, setLanguage } = useLanguage();',
        'const { language, setLanguage } = useLanguage();\n    const pt = (key) => PORTAL_TRANS[language]?.[key] || PORTAL_TRANS["EN"]?.[key] || key;'
    );
}

const replacements = {
    // Services mapping inside component
    "'ตรวจสุขภาพช่องปาก'": "pt('srv_checkup')",
    "'ขูดหินปูน / Airflow'": "pt('srv_cleaning')",
    "'อุดฟัน (Composite)'": "pt('srv_filling')",
    "'รักษารากฟัน'": "pt('srv_rootcanal')",
    "'ครอบฟัน (Crown)'": "pt('srv_crown')",
    "'รากฟันเทียม (Implant)'": "pt('srv_implant')",
    "'ฟอกสีฟัน (Whitening)'": "pt('srv_whitening')",
    "'ถอนฟัน'": "pt('srv_extraction')",
    "'30 นาที'": "`30 ${pt('min')}`",
    "'45 นาที'": "`45 ${pt('min')}`",
    "'30-45 นาที'": "`30-45 ${pt('min')}`",
    "'60-90 นาที'": "`60-90 ${pt('min')}`",
    "'60 นาที'": "`60 ${pt('min')}`",
    "'2 นัด'": "`2 ${pt('visits')}`",
    "'3-6 เดือน'": "`3-6 ${pt('month')}`",
    
    // Alerts
    "'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)'": "pt('err_phone')",
    "'ส่งรหัส OTP ไปยังเบอร์มือถือของคุณแล้ว'": "pt('otp_sent')",
    "'เกิดข้อผิดพลาดในการส่ง OTP'": "pt('err_otp_send')",
    "'กรุณากรอกรหัส OTP 6 หลัก'": "pt('err_otp_len')",
    "'✅ เชื่อมต่อข้อมูล LINE สำเร็จแล้ว!'": "pt('sync_success')",
    "\`ยินดีต้อนรับคุณ ${user.name}\`": "`${pt('welcome')} ${user.name}`",
    "'กรุณากรอกชื่อและนามสกุล'": "pt('err_name')",
    "\`ยินดีต้อนรับคุณ ${user.name} สมัครสมาชิกสำเร็จ!\`": "`${pt('welcome')} ${user.name} ${pt('reg_success')}`",
    "'ออกจากระบบเรียบร้อยแล้ว'": "pt('logout_success')",
    "'กรุณาเลือกบริการและเวลา'": "pt('err_sel_service')",
    "\`จองนัดหมายสำเร็จ! ${service?.name} วันที่ ${bookingDate} เวลา ${bookingTime}\`": "`${pt('book_success_alert')} ${service?.name} ${bookingDate} ${bookingTime}`",

    // UI
    "Experience the future of dentistry": "{pt('exp_future')}",
    "Your Phone Number": "{pt('phone_label')}",
    "placeholder=\"08x-xxx-xxxx\"": "placeholder={pt('phone_placeholder')}",
    "\"Send OTP\"": "pt('send_otp')",
    "'Send OTP'": "pt('send_otp')",
    ">Secure<": ">{pt('secure')}<",
    ">Premium<": ">{pt('premium')}<",
    
    // OTP
    ">Verify OTP<": ">{pt('verify_otp')}<",
    ">Enter the 6-digit code sent to<": ">{pt('enter_code')}<",
    "'Verify & Login'": "pt('verify_login')",
    ">Resend in<": ">{pt('resend_in')}<",
    ">Resend OTP<": ">{pt('resend_now')}<",

    // Profile
    ">Complete Profile<": ">{pt('complete_profile')}<",
    ">First Name<": ">{pt('first_name')}<",
    ">Last Name<": ">{pt('last_name')}<",
    "'Create Account'": "pt('create_account')",
    ">Back to Login<": ">{pt('back_login')}<",

    // Home
    "title=\"Dashboard\"": "title={pt('dashboard')}",
    "'Guest User'": "pt('guest_user')",
    ">Verified Patient<": ">{pt('verified_patient')}<",
    ">Reward Points<": ">{pt('reward_points')}<",
    ">PTS<": ">{pt('pts')}<",
    "label: 'Booking'": "label: pt('booking')",
    "label: 'Services'": "label: pt('services')",
    "label: 'Timeline'": "label: pt('timeline')",
    ">Next Appointment<": ">{pt('next_apt')}<",
    ">Book an Appointment<": ">{pt('book_apt_prompt')}<",
    ">Schedule your next visit easily.<": ">Schedule your next visit easily.<", // not added to dict

    // Services
    "title=\"Services\"": "title={pt('services')}",
    ">Our Services<": ">{pt('our_services')}<",
    ">Premium Dental Services<": ">{pt('premium_services')}<",
    ">Book Now<": ">{pt('book_now')}<",

    // Booking
    "title=\"Book Appointment\"": "title={pt('book_apt')}",
    ">1. Select Service<": ">{pt('step_service')}<",
    ">2. Select Branch<": ">{pt('step_branch')}<",
    ">3. Select Date & Time<": ">{pt('step_datetime')}<",
    "'Confirm Booking'": "pt('confirm_booking')",

    // Confirm UI
    ">Booking Success!<": ">{pt('booking_success')}<",
    ">Your appointment has been scheduled. Our team will contact you shortly.<": ">{pt('booking_success_desc')}<",
    ">Service<": ">{pt('service')}<",
    ">Date & Time<": ">{pt('datetime')}<",
    ">Branch<": ">{pt('branch')}<",
    ">Back to Dashboard<": ">{pt('back_dashboard')}<",

    // Appointments UI
    "title=\"My Appointments\"": "title={pt('my_apts')}",
    ">No upcoming appointments found.<": ">{pt('no_apts')}<",
    ">Book Your First Slot<": ">{pt('book_first')}<",
    "'Main Clinic'": "pt('main_clinic')",
    
    // Status badges
    "apt.status === 'Confirmed' ? 'Confirmed' :": "apt.status === 'Confirmed' ? pt('status_confirmed') :",
    "apt.status === 'Pending' ? 'Pending' :": "apt.status === 'Pending' ? pt('status_pending') :",
    ">Confirmed<": ">{pt('status_confirmed')}<",
    ">Pending<": ">{pt('status_pending')}<",
};

for (const [key, val] of Object.entries(replacements)) {
    content = content.split(key).join(val);
}

// Special handling for DENTAL_SERVICES constant
if (!content.includes('const getDentalServices')) {
    content = content.replace(
        /const DENTAL_SERVICES = \[([\s\S]*?)\];/, 
        `const getDentalServices = (pt) => [
    { id: 'checkup', name: pt('srv_checkup'), price: 500, icon: Stethoscope, duration: \`30 \${pt('min')}\` },
    { id: 'cleaning', name: pt('srv_cleaning'), price: 1200, icon: Sparkles, duration: \`45 \${pt('min')}\` },
    { id: 'filling', name: pt('srv_filling'), price: 800, icon: Check, duration: \`30-45 \${pt('min')}\` },
    { id: 'rootcanal', name: pt('srv_rootcanal'), price: 4500, icon: Heart, duration: \`60-90 \${pt('min')}\` },
    { id: 'crown', name: pt('srv_crown'), price: 8500, icon: Star, duration: \`2 \${pt('visits')}\` },
    { id: 'implant', name: pt('srv_implant'), price: 35000, icon: CheckCircle2, duration: \`3-6 \${pt('month')}\` },
    { id: 'whitening', name: pt('srv_whitening'), price: 6500, icon: Sparkles, duration: \`60 \${pt('min')}\` },
    { id: 'extraction', name: pt('srv_extraction'), price: 1500, icon: XCircle, duration: \`30 \${pt('min')}\` },
];`
    );
    // Replace all usage of DENTAL_SERVICES
    content = content.split('DENTAL_SERVICES.map').join('getDentalServices(pt).map');
    content = content.split('DENTAL_SERVICES.find').join('getDentalServices(pt).find');
}

if (!content.includes('const getBranches =')) {
    content = content.replace(
        "const BRANCHES = ['Sukhumvit Branch', 'Siam Square', 'Ladprao'];",
        "const getBranches = (pt) => [pt('branch_sukhumvit'), pt('branch_siam'), pt('branch_ladprao')];"
    );
    // Replace state initializer for Branch
    content = content.replace("BRANCHES[0]", "getBranches(pt)[0]");
    content = content.split('BRANCHES.map').join('getBranches(pt).map');
}

if (!content.includes('export default LinePortal;')) {
    content += '\nexport default LinePortal;\n';
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Replacement completed.');
