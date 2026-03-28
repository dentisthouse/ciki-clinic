const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';
const CHANNEL_ACCESS_TOKEN = process.env.VITE_LINE_CHANNEL_ACCESS_TOKEN;
const USER_ID = process.env.VITE_LINE_USER_ID;

// ============ ROOT ENDPOINT ============
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 20px; color: #1E3B34; background: #E6F4F1; border-radius: 12px; border: 2px solid #8CC1BA;">
            <h1 style="color: #06C755;">🦷 CIKI Dental Clinic Backend Proxy</h1>
            <p>สถานะเซิร์ฟเวอร์: <strong>ออนไลน์ (Running)</strong></p>
            <hr style="border: 0; border-top: 1px solid #8CC1BA; margin: 20px 0;">
            <p><strong>Endpoints ที่พร้อมใช้งาน:</strong></p>
            <ul>
                <li>POST /api/line/push - ส่งข้อความ LINE</li>
                <li>POST /api/line/otp - ส่งรหัส OTP ผ่าน LINE</li>
                <li>POST /api/line/appointment - ส่งแจ้งเตือนนัดหมายพร้อมปุ่มยืนยัน</li>
                <li>POST /api/line/webhook - รับข้อมูลจาก LINE (ยืนยัน/เลื่อน/ยกเลิก)</li>
                <li>POST /api/sms/send - ส่ง SMS (ThaiBulkSMS)</li>
                <li>POST /api/sms/otp - ส่งรหัส OTP ผ่าน SMS</li>
                <li>POST /api/notification/appointment - ส่งแจ้งเตือนนัด (SMS + LINE)</li>
            </ul>
        </div>
    `);
});

// ============ LINE MESSAGING API ============

// ส่งข้อความ LINE ทั่วไป
app.post('/api/line/push', async (req, res) => {
    const { message, flex, userId } = req.body;
    const targetUserId = userId || USER_ID;

    if (!CHANNEL_ACCESS_TOKEN || !targetUserId) {
        console.error('Missing LINE configuration in .env');
        return res.status(500).json({ error: 'LINE API not configured on server' });
    }

    const lineMessages = flex 
        ? [{ type: 'flex', altText: 'แจ้งเตือนจาก CIKI Clinic', contents: flex }]
        : [{ type: 'text', text: message }];

    try {
        const response = await axios.post(
            LINE_API_URL,
            {
                to: targetUserId,
                messages: lineMessages
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        console.log(`LINE ${flex ? 'Flex' : 'Text'} Message Sent to ${targetUserId}`);
        res.json({ success: true, response: response.data });
    } catch (error) {
        console.error('LINE API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to send LINE message', details: error.response?.data });
    }
});

// ส่ง OTP ผ่าน LINE (Flex Message)
app.post('/api/line/otp', async (req, res) => {
    const { userId, otp, phone } = req.body;

    if (!CHANNEL_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'LINE API not configured on server' });
    }

    if (!userId || !otp) {
        return res.status(400).json({ error: 'UserId and OTP are required' });
    }

    console.log(`--- LINE OTP SYSTEM --- [${userId}] : ${otp} (for ${phone || 'unknown'})`);

    const flexMessage = {
        type: "bubble",
        header: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: "CIKI DENTAL CLINIC",
                    weight: "bold",
                    color: "#06C755",
                    size: "sm"
                }
            ]
        },
        body: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: "รหัสยืนยันของคุณคือ",
                    size: "md",
                    color: "#888888"
                },
                {
                    type: "text",
                    text: otp,
                    size: "3xl",
                    weight: "bold",
                    color: "#111111",
                    margin: "md"
                },
                {
                    type: "text",
                    text: "กรุณากรอกรหัสนี้ภายใน 5 นาทีเพื่อความปลอดภัย",
                    size: "xs",
                    color: "#aaaaaa",
                    margin: "md",
                    wrap: true
                }
            ]
        },
        footer: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: "หากคุณไม่ได้ขอรหัสนี้ โปรดแจ้งเจ้าหน้าที่",
                    size: "xxs",
                    color: "#cccccc",
                    align: "center"
                }
            ]
        },
        styles: {
            header: {
                separator: true
            }
        }
    };

    try {
        await axios.post(
            LINE_API_URL,
            {
                to: userId,
                messages: [{
                    type: "flex",
                    altText: `รหัส OTP ของคุณคือ ${otp}`,
                    contents: flexMessage
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        console.log(`LINE OTP Sent to ${userId}`);
        res.json({ success: true, method: 'LINE' });
    } catch (error) {
        const errorData = error.response ? error.response.data : { message: error.message };
        console.error('LINE OTP Detailed Error:', JSON.stringify(errorData));
        res.status(500).json({ error: 'Failed', details: errorData });
    }
});

// ส่งแจ้งเตือนนัดหมายพร้อมปุ่มยืนยัน (Flex Message)
app.post('/api/line/appointment', async (req, res) => {
    const { 
        userId, 
        patientName, 
        appointmentDate, 
        appointmentTime, 
        treatment, 
        doctor,
        appointmentId 
    } = req.body;

    if (!CHANNEL_ACCESS_TOKEN || !userId) {
        return res.status(500).json({ error: 'LINE API not configured' });
    }

    const flexMessage = {
        type: "bubble",
        hero: {
            type: "image",
            url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&h=400&fit=crop",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover"
        },
        body: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: "แจ้งเตือนนัดหมาย",
                    weight: "bold",
                    size: "xl",
                    color: "#1a1a1a"
                },
                {
                    type: "text",
                    text: `คุณ ${patientName}`,
                    size: "md",
                    color: "#666666",
                    margin: "md"
                },
                {
                    type: "box",
                    layout: "vertical",
                    margin: "lg",
                    spacing: "sm",
                    contents: [
                        {
                            type: "box",
                            layout: "horizontal",
                            contents: [
                                { type: "text", text: "วันที่:", size: "sm", color: "#aaaaaa", flex: 1 },
                                { type: "text", text: appointmentDate, size: "sm", color: "#1a1a1a", flex: 3 }
                            ]
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            contents: [
                                { type: "text", text: "เวลา:", size: "sm", color: "#aaaaaa", flex: 1 },
                                { type: "text", text: appointmentTime, size: "sm", color: "#1a1a1a", flex: 3 }
                            ]
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            contents: [
                                { type: "text", text: "รักษา:", size: "sm", color: "#aaaaaa", flex: 1 },
                                { type: "text", text: treatment, size: "sm", color: "#1a1a1a", flex: 3 }
                            ]
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            contents: [
                                { type: "text", text: "ทันตแพทย์:", size: "sm", color: "#aaaaaa", flex: 1 },
                                { type: "text", text: doctor, size: "sm", color: "#1a1a1a", flex: 3 }
                            ]
                        }
                    ]
                }
            ]
        },
        footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
                {
                    type: "button",
                    style: "primary",
                    action: {
                        type: "postback",
                        label: "✅ ยืนยันนัด",
                        data: `action=confirm&apt=${appointmentId}&patient=${patientName}`
                    },
                    color: "#06C755"
                },
                {
                    type: "button",
                    style: "secondary",
                    action: {
                        type: "postback",
                        label: "📅 ขอเลื่อน",
                        data: `action=reschedule&apt=${appointmentId}&patient=${patientName}`
                    }
                },
                {
                    type: "button",
                    style: "link",
                    action: {
                        type: "postback",
                        label: "❌ ยกเลิก",
                        data: `action=cancel&apt=${appointmentId}&patient=${patientName}`
                    },
                    color: "#ff4444"
                }
            ]
        }
    };

    try {
        const response = await axios.post(
            LINE_API_URL,
            {
                to: userId,
                messages: [{
                    type: "flex",
                    altText: `แจ้งเตือนนัดหมาย ${appointmentDate} ${appointmentTime}`,
                    contents: flexMessage
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        console.log(`Appointment notification sent to ${userId}`);
        res.json({ success: true, response: response.data });
    } catch (error) {
        console.error('LINE Appointment Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to send appointment notification' });
    }
});

// LINE Webhook Handler - รับการยืนยัน/เลื่อน/ยกเลิกนัด
app.post('/api/line/webhook', async (req, res) => {
    const events = req.body.events;

    for (const event of events) {
        // จัดการ Postback (กดปุ่ม)
        if (event.type === 'postback') {
            const data = event.postback.data;
            const params = new URLSearchParams(data);
            const action = params.get('action');
            const appointmentId = params.get('apt');
            const patientName = params.get('patient');

            console.log('--- LINE POSTBACK RECEIVED ---');
            console.log('Action:', action, 'Appointment:', appointmentId, 'Patient:', patientName);

            let replyText = "รับทราบคำขอของคุณแล้วครับ";
            let replyFlex = null;

            switch (action) {
                case 'confirm':
                    replyText = `✅ ขอบคุณคุณ ${patientName} ที่ยืนยันนัดหมาย! เจ้าหน้าที่ได้รับข้อมูลเรียบร้อยแล้วครับ`;
                    break;
                case 'reschedule':
                    replyText = `📅 รับทราบครับคุณ ${patientName}! เจ้าหน้าที่จะรีบติดต่อกลับเพื่อเลื่อนนัดหมายให้นะครับ`;
                    break;
                case 'cancel':
                    replyText = `❌ รับทราบการขอยกเลิกนัดหมายครับคุณ ${patientName} หากต้องการจองใหม่ติดต่อได้เสมอครับ`;
                    break;
            }

            // ส่งตอบกลับผู้ใช้
            try {
                await axios.post(
                    'https://api.line.me/v2/bot/message/reply',
                    {
                        replyToken: event.replyToken,
                        messages: [{
                            type: "flex",
                            altText: replyText,
                            contents: {
                                type: "bubble",
                                body: {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                        {
                                            type: "text",
                                            text: action === 'confirm' ? '✅ ยืนยันนัดสำเร็จ' : 
                                                  action === 'reschedule' ? '📅 ขอเลื่อนนัด' : '❌ ยกเลิกนัด',
                                            weight: "bold",
                                            size: "lg",
                                            color: action === 'confirm' ? '#06C755' : 
                                                   action === 'reschedule' ? '#f59e0b' : '#ef4444'
                                        },
                                        {
                                            type: "text",
                                            text: replyText,
                                            size: "sm",
                                            margin: "md",
                                            wrap: true
                                        }
                                    ]
                                }
                            }
                        }]
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                        }
                    }
                );
                console.log('Reply sent to user:', replyText);
            } catch (err) {
                console.error('Failed to send webhook reply:', err.message);
            }

            // TODO: อัพเดทสถานะนัดหมายในฐานข้อมูล (ผ่าน Supabase หรือ API)
            // ส่งข้อมูลไปยัง frontend ผ่าน WebSocket หรือ Real-time subscription
        }

        // จัดการข้อความทั่วไป
        if (event.type === 'message' && event.message.type === 'text') {
            const userMessage = event.message.text;
            console.log('Message from user:', userMessage);

            // ตอบกลับอัตโนมัติ
            if (userMessage.includes('นัด') || userMessage.includes('appointment')) {
                try {
                    await axios.post(
                        'https://api.line.me/v2/bot/message/reply',
                        {
                            replyToken: event.replyToken,
                            messages: [{
                                type: 'text',
                                text: 'คุณสามารถดูนัดหมายและจองคิวใหม่ได้ที่ https://ciki-clinic.com/appointments'
                            }]
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                            }
                        }
                    );
                } catch (err) {
                    console.error('Failed to send auto-reply:', err.message);
                }
            }
        }
    }

    res.sendStatus(200);
});

// ============ SMS API (ThaiBulkSMS) ============

// ส่ง SMS ทั่วไป
app.post('/api/sms/send', async (req, res) => {
    const { phone, message, sender } = req.body;
    
    const SMS_API_USER = process.env.SMS_API_USER;
    const SMS_API_PASS = process.env.SMS_API_PASS;
    const SMS_SENDER = sender || process.env.SMS_API_SENDER || 'CIKI';
    
    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
    }

    console.log(`--- SMS SYSTEM --- [${phone}] : ${message}`);

    // ถ้ามี credentials ใช้ ThaiBulkSMS จริง
    if (SMS_API_USER && SMS_API_PASS) {
        try {
            const params = new URLSearchParams();
            params.append('username', SMS_API_USER);
            params.append('password', SMS_API_PASS);
            params.append('msisdn', phone);
            params.append('message', message);
            params.append('sender', SMS_SENDER);
            params.append('force', 'standard');

            const response = await axios.post('https://api.thaibulksms.com/sms', params);
            
            console.log('ThaiBulkSMS response:', response.data);
            return res.json({ 
                success: true, 
                provider: 'ThaiBulkSMS',
                details: response.data 
            });
        } catch (error) {
            console.error('ThaiBulkSMS Error:', error.message);
            return res.status(500).json({ error: 'Failed to send real SMS via ThaiBulkSMS' });
        }
    }

    // ถ้าไม่มี credentials ใช้ simulation mode
    console.log(`[SIMULATED] SMS successfully processed for: ${phone}`);
    res.json({ 
        success: true, 
        provider: 'MockSMS (Simulation Mode)',
        messageId: `sim_${Math.random().toString(36).substr(2, 9)}`,
        note: 'Please provide SMS_API_USER and SMS_API_PASS in .env to enable real SMS.'
    });
});

// ส่ง OTP ผ่าน SMS
app.post('/api/sms/otp', async (req, res) => {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const message = `รหัส OTP ของคุณคือ ${otp} (ใช้ได้ 5 นาที) - CIKI Dental Clinic`;
    
    // Forward ไปยัง SMS send endpoint
    req.body.message = message;
    req.body.sender = 'CIKI';
    
    // ส่งผ่าน handler เดียวกัน
    const originalUrl = req.url;
    req.url = '/api/sms/send';
    
    // เรียกใช้ handler (simplified - in production, refactor to shared function)
    const SMS_API_USER = process.env.SMS_API_USER;
    const SMS_API_PASS = process.env.SMS_API_PASS;
    const SMS_SENDER = 'CIKI';
    
    console.log(`--- SMS OTP SYSTEM --- [${phone}] : ${otp}`);

    if (SMS_API_USER && SMS_API_PASS) {
        try {
            const params = new URLSearchParams();
            params.append('username', SMS_API_USER);
            params.append('password', SMS_API_PASS);
            params.append('msisdn', phone);
            params.append('message', message);
            params.append('sender', SMS_SENDER);
            params.append('force', 'standard');

            const response = await axios.post('https://api.thaibulksms.com/sms', params);
            
            console.log('ThaiBulkSMS OTP response:', response.data);
            return res.json({ 
                success: true, 
                method: 'SMS',
                provider: 'ThaiBulkSMS',
                details: response.data 
            });
        } catch (error) {
            console.error('ThaiBulkSMS OTP Error:', error.message);
            return res.status(500).json({ error: 'Failed to send OTP via SMS' });
        }
    }

    // Simulation mode
    console.log(`[SIMULATED] SMS OTP sent to: ${phone}`);
    res.json({ 
        success: true, 
        method: 'SMS (Simulation)',
        provider: 'MockSMS',
        messageId: `sim_otp_${Math.random().toString(36).substr(2, 9)}`,
        code: otp,
        note: 'Demo mode - In production, provide SMS_API_USER and SMS_API_PASS'
    });
});

// ============ UNIFIED NOTIFICATION API ============

// ส่งแจ้งเตือนนัดหมาย (SMS + LINE)
app.post('/api/notification/appointment', async (req, res) => {
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
    } = req.body;

    const results = {};

    // ส่ง SMS
    if (channels.includes('sms') && phone) {
        const smsMessage = `แจ้งเตือนนัดหมาย CIKI Clinic\nคุณ ${patientName}\nวันที่ ${appointmentDate} เวลา ${appointmentTime}\nรักษา: ${treatment}\nทันตแพทย์: ${doctor}\nกรุณายืนยันการนัดหมาย`;
        
        try {
            const smsResult = await axios.post('http://localhost:' + PORT + '/api/sms/send', {
                phone,
                message: smsMessage,
                sender: 'CIKI'
            });
            results.sms = smsResult.data;
        } catch (error) {
            results.sms = { error: error.message };
        }
    }

    // ส่ง LINE
    if (channels.includes('line') && lineUserId && CHANNEL_ACCESS_TOKEN) {
        try {
            const lineResult = await axios.post('http://localhost:' + PORT + '/api/line/appointment', {
                userId: lineUserId,
                patientName,
                appointmentDate,
                appointmentTime,
                treatment,
                doctor,
                appointmentId
            });
            results.line = lineResult.data;
        } catch (error) {
            results.line = { error: error.message };
        }
    }

    res.json({
        success: true,
        results,
        channels: Object.keys(results)
    });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🦷 CIKI Dental Clinic Backend Proxy`);
    console.log(`========================================`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(``);
    console.log(`📱 LINE Integration: ${CHANNEL_ACCESS_TOKEN ? 'READY ✅' : 'NOT CONFIGURED ❌'}`);
    console.log(`💬 SMS Integration: ${process.env.SMS_API_USER ? 'REAL MODE (ThaiBulkSMS) 🚀' : 'SIMULATION MODE 🛠️'}`);
    console.log(``);
    console.log(`Available endpoints:`);
    console.log(`  • POST /api/line/push`);
    console.log(`  • POST /api/line/otp`);
    console.log(`  • POST /api/line/appointment`);
    console.log(`  • POST /api/line/webhook`);
    console.log(`  • POST /api/sms/send`);
    console.log(`  • POST /api/sms/otp`);
    console.log(`  • POST /api/notification/appointment`);
    console.log(`========================================`);
});
