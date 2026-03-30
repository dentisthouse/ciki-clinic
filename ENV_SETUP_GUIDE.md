# ==========================================
# CIKI Dental Clinic - คู่มือการตั้งค่า .env
# ==========================================

## 🔴 ขั้นตอนที่ 1: สร้างไฟล์ .env

คัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env`
```bash
cp .env.example .env
```

จากนั้นแก้ไขค่าต่าง ๆ ตามคู่มือนี้

---

## 🔴 ขั้นตอนที่ 2: Supabase Configuration (จำเป็นต้องมี)

### VITE_SUPABASE_URL
**หาได้ที่ไหน:** https://app.supabase.com

1. เข้าไปที่ https://app.supabase.com
2. เลือก Project ของคุณ
3. คลิกที่ "Settings" (ฟันเฟือง) ด้านซ้ายล่าง
4. เลือก "API"
5. ค่า "Project URL" คือ VITE_SUPABASE_URL

**ตัวอย่าง:**
```
VITE_SUPABASE_URL=https://abcdefghijklmnopqrstuvwxyz.supabase.co
```

### VITE_SUPABASE_ANON_KEY
**หาได้ที่ไหน:** https://app.supabase.com (ที่เดียวกัน)

1. ในหน้า Settings > API เดียวกัน
2. ค่า "Project API keys" > "anon public" คือ VITE_SUPABASE_ANON_KEY
3. คลิก "Reveal" แล้วคัดลอก

**ตัวอย่าง:**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🟠 ขั้นตอนที่ 3: LINE Messaging API (สำหรับส่งข้อความ LINE)

### VITE_LINE_CHANNEL_ACCESS_TOKEN
**หาได้ที่ไหน:** https://developers.line.biz/console/

1. เข้าไปที่ https://developers.line.biz/console/
2. สร้าง Provider ใหม่ (หรือใช้ Provider เดิม)
3. สร้าง Channel ใหม่ > เลือก "Messaging API"
4. ใน Channel settings:
   - ค่า "Channel access token (long-lived)" คือสิ่งที่ต้องการ
   - ถ้ายังไม่มี ให้กด "Issue" ที่ "Channel access token (long-lived)"

**ตัวอย่าง:**
```
VITE_LINE_CHANNEL_ACCESS_TOKEN=K1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9
```

### VITE_LINE_USER_ID (สำหรับทดสอบ)
**หาได้ที่ไหน:**

**วิธีที่ 1:** ผ่าน LINE Developer Console
1. ใน Channel เดียวกัน
2. เลือกแท็บ "Messaging API"
3. ดูที่ "Your user ID"

**วิธีที่ 2:** ผ่าน Webhook
1. ตั้งค่า Webhook URL ใน Channel
2. ส่งข้อความถึง Official Account
3. ดู logs จะเห็น userId

**ตัวอย่าง:**
```
VITE_LINE_USER_ID=U1234567890abcdef1234567890abcdef
```

---

## 🟡 ขั้นตอนที่ 4: ThaiBulkSMS (สำหรับส่ง SMS)

**สมัครที่:** https://www.thaibulksms.com/

### SMS_API_USER
- Username ที่สมัครกับ ThaiBulkSMS

### SMS_API_PASS
- Password ของบัญชี ThaiBulkSMS

### SMS_API_SENDER
- ชื่อผู้ส่ง (อักษรภาษาอังกฤษ ไม่เกิน 11 ตัวอักษร)
- ต้องลงทะเบียนชื่อผู้ส่งก่อนใช้งาน

**ตัวอย่าง:**
```
SMS_API_USER=myclinic_user
SMS_API_PASS=my_secure_password
SMS_API_SENDER=CIKICLINIC
```

---

## 🟢 ขั้นตอนที่ 5: Security Settings (สำคัญมาก!)

### VITE_OWNER_EMAILS
**คืออะไร:** Email ของเจ้าของคลินิกที่มีสิทธิ์สูงสุด

**ตัวอย่าง:**
```
VITE_OWNER_EMAILS=owner@ciki-dental.com,admin@ciki-dental.com
```

**หมายเหตุ:** 
- แยกด้วย comma (ไม่มี space)
- มีสิทธิ์เหมือน admin ทุกอย่าง
- สามารถดูรายงานทางการเงินและตั้งค่าระบบได้

### VITE_STAFF_MAPPING
**รูปแบบ:** `email:role:name,email2:role2:name2`

**Roles ที่ใช้ได้:**
- `owner` - เจ้าของคลินิก
- `admin` - ผู้ดูแลระบบ
- `dentist` - ทันตแพทย์
- `assistant` - ผู้ช่วยทันตแพทย์
- `receptionist` - พนักงานต้อนรับ

**ตัวอย่าง:**
```
VITE_STAFF_MAPPING=big@ciki.com:dentist:หมอบิ๊ก,joob@ciki.com:dentist:หมอจุ๊บ,aom@ciki.com:owner:หมออ้อม,tong@ciki.com:owner:หมอต้อง,somsee@ciki.com:receptionist:สมศรี
```

---

## 🔵 ขั้นตอนที่ 6: Session Settings (แนะนำค่าเดิม)

```
VITE_SESSION_TIMEOUT=15              # 15 นาที ไม่ใช้งาน = auto logout
VITE_MAX_SESSION_DURATION=480        # 8 ชั่วโมง ต้อง login ใหม่
```

---

## 📋 สรุปไฟล์ .env ที่สมบูรณ์

```bash
# ==========================================
# CIKI Dental Clinic - Environment Configuration
# ==========================================

# LINE Messaging API
VITE_LINE_CHANNEL_ACCESS_TOKEN=your_actual_token_here
VITE_LINE_USER_ID=your_user_id_here

# ThaiBulkSMS
SMS_API_USER=your_thaibulksms_username
SMS_API_PASS=your_thaibulksms_password
SMS_API_SENDER=CIKICLINIC

# Backend
PORT=3001

# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# ==========================================
# Security Settings
# ==========================================

VITE_OWNER_EMAILS=owner@yourdomain.com,admin@yourdomain.com
VITE_STAFF_MAPPING=doctor1@yourdomain.com:dentist:หมอบิ๊ก,doctor2@yourdomain.com:dentist:หมอจุ๊บ,reception@yourdomain.com:receptionist:สมศรี

# Session timeout (minutes)
VITE_SESSION_TIMEOUT=15
VITE_MAX_SESSION_DURATION=480

# ==========================================
# Application Settings
# ==========================================

VITE_APP_NAME=Ciki Dental Clinic
VITE_APP_VERSION=1.0.0
VITE_API_TIMEOUT=30000

# ==========================================
# Feature Flags
# ==========================================

VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SMS=false
VITE_ENABLE_LINE=true

# ==========================================
# Backup Settings
# ==========================================

VITE_AUTO_BACKUP=true
VITE_BACKUP_INTERVAL=daily
VITE_BACKUP_RETENTION_DAYS=30

# ==========================================
# Performance Settings
# ==========================================

VITE_CACHE_DURATION=300000
VITE_PAGINATION_PAGE_SIZE=50
VITE_MAX_UPLOAD_SIZE=10485760
```

---

## ⚠️ ข้อควรระวัง

1. **อย่า push .env ขึ้น Git!** - ไฟล์นี้อยู่ใน .gitignore แล้ว
2. **เก็บ Anon Key ให้ปลอดภัย** - ใครมี key นี้สามารถเข้าถึง database ได้
3. **อย่าใช้ Production Key ใน Development** - สร้าง project แยกสำหรับ dev
4. **เปลี่ยน Owner Emails ให้ถูกต้อง** - ไม่งั้นจะไม่สามารถเข้าสู่ระบบได้

---

## 🆘 ถ้าเกิดปัญหา

**Error: Missing Supabase environment variables!**
→ แก้: ใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY

**Error: Cannot login as owner**
→ แก้: ตรวจสอบ VITE_OWNER_EMAILS ว่ามี email ของคุณหรือไม่

**Error: LINE notification not working**
→ แก้: ตรวจสอบ VITE_LINE_CHANNEL_ACCESS_TOKEN และว่า Channel อยู่สถานะ Active

---

## 📞 ติดต่อ Support

- Supabase: https://supabase.com/support
- LINE Developers: https://developers.line.biz/en/docs/
- ThaiBulkSMS: support@thaibulksms.com
