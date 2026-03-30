# วิธีแก้ไขปัญหา Dr. big แสดงเป็น Receptionist

## ปัญหา
Dr. big แสดง role เป็น "Receptionist" แทน "Dentist"

## สาเหตุ
ผู้ใช้ big@dental.com ไม่ได้ถูกกำหนด role ไว้ในระบบ ทำให้ fallback เป็น 'receptionist'

## วิธีแก้ไข

### 1. แก้ไขไฟล์ .env
เพิ่มบรรทัดนี้ในไฟล์ .env (อยู่ใน .gitignore ต้องแก้ด้วย text editor):

```
# Staff mapping - รายชื่อพนักงาน format: email:role:ชื่อ
VITE_STAFF_MAPPING=big@dental.com:dentist:หมอบิ๊ก
```

ถ้ามีพนักงานคนอื่นอยู่แล้ว ให้เพิ่มเข้าไปข้างหน้า คั่นด้วย comma:
```
VITE_STAFF_MAPPING=big@dental.com:dentist:หมอบิ๊ก,other@dental.com:receptionist:ชื่ออื่น
```

### 2. หรือแก้ไขใน Supabase Database
เข้าไปที่ Supabase Dashboard → Table Editor → staff table
เพิ่มหรืออัพเดต record:
- email: big@dental.com
- role: dentist  
- full_name: หมอบิ๊ก
- user_id: (ถ้ารู้)

### 3. Restart Application
หลังแก้ไข .env ให้ restart development server

## ตรวจสอบ
หลังแก้ไขแล้ว ให้ login ใหม่ด้วยบัญชี big@dental.com 
role ควรแสดงเป็น "Dentist" แทน "Receptionist"
