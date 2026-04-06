// ==========================================
// Notification Service - SMS & LINE Integration
// สำหรับ CIKI Dental Clinic
// ==========================================

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const API_BASE_URL = `${SERVER_URL}/api`;

// สร้าง OTP แบบสุ่ม 6 หลัก
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// เก็บ OTP ที่ส่งไป (in-memory, ใน production ควรใช้ Redis หรือฐานข้อมูล)
const otpStore = new Map();

// ==========================================
// SMS FUNCTIONS
// ==========================================

/**
 * ส่ง SMS ทั่วไป
 * @param {string} phone - เบอร์โทรศัพท์ (เช่น 0812345678)
 * @param {string} message - ข้อความ
 * @param {string} sender - ชื่อผู้ส่ง (optional)
 */
export const sendSMS = async (phone, message, sender = 'DentistH') => {
    try {
        const response = await fetch(`${API_BASE_URL}/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message, sender })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send SMS');
        }
        
        console.log('SMS sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('SMS Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * ส่ง OTP ผ่าน SMS
 * @param {string} phone - เบอร์โทรศัพท์
 * @param {string} lineUserId - LINE User ID (optional, ถ้ามีจะส่งทั้ง SMS และ LINE)
 */
export const sendOTP = async (phone, lineUserId = null) => {
    // DEMO MODE: ใช้ OTP คงที่สำหรับทดสอบ
    const otp = '123456'; // generateOTP(); // เปลี่ยนเป็น OTP ทดสอบ
    
    // เก็บ OTP พร้อมเวลาหมดอายุ (5 นาที)
    otpStore.set(phone, {
        code: otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
    });
    
    console.log(`OTP generated for ${phone}: ${otp} [DEMO MODE]`);
    
    const results = {};
    
    // DEMO MODE: จำลองการส่ง SMS
    results.sms = { 
        success: true, 
        note: 'Demo Mode - SMS not actually sent',
        message: `Dentist's House: Your OTP is ${otp}. Valid for 5 minutes. [DEMO]`
    };
    
    // ถ้ามี LINE User ID ส่งผ่าน LINE ด้วย
    if (lineUserId) {
        // DEMO MODE: จำลองการส่ง LINE
        results.line = { 
            success: true, 
            note: 'Demo Mode - LINE message not actually sent'
        };
    }
    
    return {
        success: true,
        otp, // ใน production ไม่ควรส่งกลับไปยัง frontend แต่ demo mode ส่งได้
        method: lineUserId ? 'SMS+LINE' : 'SMS',
        results,
        demo: true // เพิ่ม flag บอกว่าเป็น demo mode
    };
};

/**
 * ตรวจสอบ OTP
 * @param {string} phone - เบอร์โทรศัพท์
 * @param {string} code - รหัส OTP ที่ผู้ใช้กรอก
 */
export const verifyOTP = (phone, code) => {
    const record = otpStore.get(phone);
    
    if (!record) {
        return { success: false, message: 'ไม่พบรหัส OTP กรุณาขอรหัสใหม่' };
    }
    
    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return { success: false, message: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' };
    }
    
    if (record.attempts >= 3) {
        otpStore.delete(phone);
        return { success: false, message: 'กรอกรหัสผิดเกิน 3 ครั้ง กรุณาขอรหัสใหม่' };
    }
    
    if (record.code !== code) {
        record.attempts++;
        return { success: false, message: `รหัส OTP ไม่ถูกต้อง (เหลือ ${3 - record.attempts} ครั้ง)` };
    }
    
    // ลบ OTP หลังจากใช้สำเร็จ
    otpStore.delete(phone);
    
    return { success: true, message: 'ยืนยันรหัสสำเร็จ' };
};

// ==========================================
// LINE MESSAGING API FUNCTIONS
// ==========================================

/**
 * ส่งข้อความ LINE ทั่วไป
 * @param {string} userId - LINE User ID
 * @param {string} message - ข้อความ
 */
export const sendLineMessage = async (userId, message) => {
    try {
        const response = await fetch(`${API_BASE_URL}/line/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send LINE message');
        }
        
        console.log('LINE message sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('LINE Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * ส่ง Flex Message (ข้อความรูปแบบสวยงาม)
 * @param {string} userId - LINE User ID
 * @param {object} flexContent - LINE Flex Message Object
 */
export const sendLineFlex = async (userId, flexContent) => {
    try {
        const response = await fetch(`${API_BASE_URL}/line/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, flex: flexContent })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send LINE Flex message');
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('LINE Flex Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * ส่งแจ้งเตือนนัดหมายผ่าน LINE พร้อมปุ่มยืนยัน
 * @param {object} params - ข้อมูลนัดหมาย
 */
export const sendLineAppointmentNotification = async (params) => {
    const {
        userId,
        patientName,
        appointmentDate,
        appointmentTime,
        treatment,
        doctor,
        appointmentId
    } = params;
    
    try {
        const response = await fetch(`${API_BASE_URL}/line/appointment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                patientName,
                appointmentDate,
                appointmentTime,
                treatment,
                doctor,
                appointmentId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send appointment notification');
        }
        
        console.log('LINE appointment notification sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('LINE Appointment Error:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// UNIFIED NOTIFICATION (SMS + LINE)
// ==========================================

/**
 * ส่งแจ้งเตือนนัดหมายแบบครบวงจร (SMS + LINE)
 * @param {object} params - ข้อมูลนัดหมายและช่องทางการส่ง
 */
export const sendAppointmentNotification = async (params) => {
    const {
        phone,
        lineUserId,
        patientName,
        appointmentDate,
        appointmentTime,
        treatment,
        doctor,
        appointmentId,
        channels = ['sms', 'line']  // 'sms', 'line', หรือ ['sms', 'line']
    } = params;
    
    try {
        const response = await fetch(`${API_BASE_URL}/notification/appointment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone,
                lineUserId,
                patientName,
                appointmentDate,
                appointmentTime,
                treatment,
                doctor,
                appointmentId,
                channels
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send notification');
        }
        
        console.log('Appointment notification sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Notification Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * ส่ง SMS แจ้งเตือนนัดหมายอย่างเดียว
 */
export const sendAppointmentSMS = async (phone, appointmentDetails) => {
    const { patientName, appointmentDate, appointmentTime, treatment, doctor } = appointmentDetails;
    
    const message = `แจ้งเตือนนัดหมาย CIKI Clinic
คุณ ${patientName}
วันที่ ${appointmentDate} เวลา ${appointmentTime}
รักษา: ${treatment}
ทันตแพทย์: ${doctor}
กรุณามาก่อนเวลานัด 15 นาที
โทรยกเลิก/เลื่อน: 02-XXX-XXXX`;
    
    return sendSMS(phone, message, 'DentistH');
};

/**
 * ส่ง SMS แจ้งเตือนล่วงหน้า (D-1)
 */
export const sendAppointmentReminder = async (phone, appointmentDetails) => {
    const { patientName, appointmentDate, appointmentTime, treatment } = appointmentDetails;
    
    const message = `แจ้งเตือนนัดพรุ่งนี้ - CIKI Clinic
คุณ ${patientName}
วันพรุ่งนี้ (${appointmentDate}) เวลา ${appointmentTime}
รักษา: ${treatment}
รบกวนมาก่อนเวลานัด 15 นาที
หากไม่สะดวกโทร 02-XXX-XXXX`;
    
    return sendSMS(phone, message, 'DentistH');
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * ตรวจสอบสถานะ backend server
 */
export const checkBackendStatus = async () => {
    try {
        const response = await fetch('http://localhost:3001/', {
            method: 'GET'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};

/**
 * ฟอร์แมตเบอร์โทรศัพท์ให้เป็นรูปแบบมาตรฐานไทย
 * @param {string} phone - เบอร์โทรศัพท์
 */
export const formatPhoneNumber = (phone) => {
    // ลบช่องว่างและเครื่องหมาย
    let cleaned = phone.replace(/\D/g, '');
    
    // ถ้าเริ่มด้วย 0 ให้คงไว้
    if (cleaned.startsWith('0')) {
        return cleaned;
    }
    
    // ถ้าเริ่มด้วย 66 (รหัสประเทศ) ให้แปลงเป็น 0
    if (cleaned.startsWith('66')) {
        return '0' + cleaned.slice(2);
    }
    
    // ถ้าไม่มี 0 นำหน้า ให้เติม 0
    if (!cleaned.startsWith('0')) {
        return '0' + cleaned;
    }
    
    return cleaned;
};

/**
 * ตรวจสอบความถูกต้องของเบอร์โทรศัพท์ไทย
 * @param {string} phone - เบอร์โทรศัพท์
 */
export const isValidThaiPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const thaiPhoneRegex = /^0[689]\d{8}$/;
    return thaiPhoneRegex.test(cleaned);
};

// ==========================================
// EXPORT ALL
// ==========================================

export default {
    // SMS
    sendSMS,
    sendOTP,
    verifyOTP,
    sendAppointmentSMS,
    sendAppointmentReminder,
    
    // LINE
    sendLineMessage,
    sendLineFlex,
    sendLineAppointmentNotification,
    
    // Unified
    sendAppointmentNotification,
    
    // Helpers
    checkBackendStatus,
    formatPhoneNumber,
    isValidThaiPhone,
    generateOTP
};
