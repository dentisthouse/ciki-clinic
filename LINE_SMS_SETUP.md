# LINE OA และ SMS Integration Setup Guide

คู่มือการตั้งค่าระบบส่ง SMS และ LINE Messaging API สำหรับ CIKI Dental Clinic

## 📋 สารบัญ

1. [ความต้องการเบื้องต้น](#ความต้องการเบื้องต้น)
2. [การตั้งค่า LINE Messaging API](#การตั้งค่า-line-messaging-api)
3. [การตั้งค่า ThaiBulkSMS](#การตั้งค่า-thaibulksms)
4. [การรัน Backend Server](#การรัน-backend-server)
5. [การใช้งาน](#การใช้งาน)
6. [LINE Webhook Setup](#line-webhook-setup)

---

## ความต้องการเบื้องต้น

- Node.js (v16+)
- LINE Developer Account (ฟรี)
- ThaiBulkSMS Account (สำหรับส่ง SMS จริง, หรือใช้ Demo Mode)

---

## การตั้งค่า LINE Messaging API

### 1. สร้าง LINE Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider ใหม่ (หรือใช้ Provider ที่มีอยู่)
3. สร้าง **Messaging API** channel
4. ในแท็บ **Messaging API**:
   - คัดลอก **Channel Access Token** (กด Issue แบบ long-lived)
   - คัดลอก **Your User ID** (อยู่ด้านล่างของหน้า)

### 2. ตั้งค่า Webhook (สำหรับรับการยืนยันนัด)

1. ใน Messaging API settings:
   - **Webhook URL**: `https://your-domain.com/api/line/webhook`
   - เปิด **Use webhook**
   - เปิด **Auto-reply**
   - ปิด **Greeting messages** (ถ้าต้องการ)

2. เพิ่ม **Reply Setting**:
   - ตรวจสอบว่า "Allow bot to join group chats" เปิดไว้ (ถ้าต้องการ)

### 3. ตั้งค่า LIFF (LINE Front-end Framework) - สำหรับ LINE Portal

1. ไปที่ LINE Developers Console > Your Channel > LIFF
2. สร้าง LIFF app ใหม่:
   - **LIFF app name**: CIKI Portal
   - **Size**: Full
   - **Endpoint URL**: `https://your-domain.com/line-portal`
   - เปิด **Scan QR**
   - เปิด **Get ID Token**

---

## การตั้งค่า ThaiBulkSMS

### 1. สมัครบัญชี

1. ไปที่ [ThaiBulkSMS](https://www.thaibulksms.com/)
2. สมัครบัญชีและเติมเครดิต
3. ไปที่หน้า **Settings** > **API Settings**
4. คัดลอก **API Username** และ **API Password**

### 2. ตั้งค่า Sender Name

- Sender Name จะต้องเป็นภาษาอังกฤษ ไม่เกิน 11 ตัวอักษร
- ตัวอย่าง: `CIKI`, `CIKICLINIC`
- ต้องขออนุมัติก่อนใช้งาน (ใช้เวลา 1-3 วัน)

---

## การรัน Backend Server

### 1. ติดตั้ง Dependencies

```bash
cd server
npm install
```

### 2. สร้างไฟล์ .env

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` ด้วยค่าที่ได้จากขั้นตอนก่อนหน้า:

```env
VITE_LINE_CHANNEL_ACCESS_TOKEN=xxxxx
VITE_LINE_USER_ID=Uxxxxxxxx
SMS_API_USER=your_username
SMS_API_PASS=your_password
SMS_API_SENDER=CIKI
PORT=3001
```

### 3. รัน Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server จะรันที่ `http://localhost:3001`

### 4. ตรวจสอบสถานะ

เปิด browser ไปที่ `http://localhost:3001` ควรเห็นหน้า status page

---

## การใช้งาน

### ส่งข้อความแจ้งเตือนจากระบบนัดหมาย

1. ไปที่หน้า **Schedule** (ตารางนัด)
2. คลิกที่นัดหมายที่ต้องการส่งข้อความ
3. ใน modal จะเห็น panel "ส่งข้อความแจ้งเตือน"
4. เลือกประเภทข้อความ:
   - **ยืนยันนัด** - ส่ง SMS พร้อมรายละเอียดนัด
   - **แจ้งเตือนล่วงหน้า** - ส่ง SMS แจ้งเตือนวันก่อนนัด
   - **LINE** - ส่ง Flex Message ผ่าน LINE พร้อมปุ่มยืนยัน/เลื่อน/ยกเลิก
   - **ข้อความเอง** - พิมพ์ข้อความเอง

### การยืนยันนัดผ่าน LINE

เมื่อส่งข้อความแบบ LINE ไปยังลูกค้า:

1. ลูกค้าจะได้รับข้อความพร้อมรายละเอียดนัด
2. มี 3 ปุ่มให้เลือก:
   - ✅ **ยืนยันนัด** - ระบบจะส่งข้อความตอบกลับและบันทึกสถานะ
   - 📅 **ขอเลื่อน** - เจ้าหน้าที่จะได้รับแจ้งเตือนให้ติดต่อกลับ
   - ❌ **ยกเลิก** - บันทึกสถานะการยกเลิก

### Demo Mode (ไม่มี API Key)

หากไม่ได้ตั้งค่า API Key ระบบจะทำงานใน **Demo Mode**:

- SMS จะไม่ถูกส่งจริง แต่จะบันทึก log ไว้
- LINE จะไม่ถูกส่งจริง
- แสดง OTP บนหน้าจอสำหรับการทดสอบ

---

## LINE Webhook Setup

### สำหรับ Local Development (ใช้ ngrok)

1. ติดตั้ง ngrok:
   ```bash
   npm install -g ngrok
   ```

2. รัน ngrok:
   ```bash
   ngrok http 3001
   ```

3. คัดลอก HTTPS URL (เช่น `https://xxxx.ngrok.io`)

4. ไปที่ LINE Developers Console > Messaging API > Webhook URL
   - ใส่: `https://xxxx.ngrok.io/api/line/webhook`
   - กด **Verify**

### สำหรับ Production

1. Deploy backend server ไปยัง Vercel, Railway, หรือ VPS
2. ใช้ URL จริงใน Webhook settings

---

## API Endpoints

### SMS APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sms/send` | POST | ส่ง SMS ทั่วไป |
| `/api/sms/otp` | POST | ส่ง OTP ผ่าน SMS |

### LINE APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/line/push` | POST | ส่งข้อความ LINE |
| `/api/line/otp` | POST | ส่ง OTP ผ่าน LINE |
| `/api/line/appointment` | POST | ส่งแจ้งเตือนนัดพร้อมปุ่ม |
| `/api/line/webhook` | POST | รับ webhook จาก LINE |

### Unified Notification

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notification/appointment` | POST | ส่ง SMS + LINE พร้อมกัน |

---

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

**1. "LINE API not configured"**
- ตรวจสอบว่า `.env` มี `VITE_LINE_CHANNEL_ACCESS_TOKEN`
- ตรวจสอบว่า token ไม่หมดอายุ

**2. "Failed to send SMS via ThaiBulkSMS"**
- ตรวจสอบ username/password ถูกต้อง
- ตรวจสอบว่ามีเครดิตเพียงพอ
- ตรวจสอบว่า Sender Name ได้รับอนุมัติแล้ว

**3. Webhook ไม่ทำงาน**
- ตรวจสอบว่า URL ถูกต้องและเข้าถึงได้จาก public
- ตรวจสอบว่า Use webhook เปิดไว้ใน LINE Console
- ดู log ที่ backend server

**4. CORS Error**
- ตรวจสอบว่า backend server เปิด CORS ไว้ (default: เปิด)
- ตรวจสอบว่า frontend เรียกถูก port

---

## ติดต่อสอบถาม

หากมีปัญหาในการตั้งค่า ติดต่อ:
- LINE Developers: https://developers.line.biz/
- ThaiBulkSMS: https://www.thaibulksms.com/contact

---

## หมายเหตุด้านความปลอดภัย

⚠️ **สำคัญ**:
- อย่า push `.env` ไปยัง git repository
- ใช้ `.env.example` เป็น template เท่านั้น
- ใน production ควรใช้ HTTPS เท่านั้น
- เก็บ Channel Access Token เป็นความลับ
- ใช้ long-lived token ที่มีอายุนานที่สุด
