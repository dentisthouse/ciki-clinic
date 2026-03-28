-- ==========================================
-- AUTHENTICATION USERS: สร้างผู้ใช้ระบบ 3 รายการ
-- 1. เจ้าของ (Owner)
-- 2. หมอ (Dentist) 
-- 3. เค้าเตอร์ (Receptionist)
-- ==========================================

-- สร้างผู้ใช้ใน Supabase Authentication
-- รันใน Supabase Dashboard → Authentication → Users → Add User

-- หรือใช้ SQL สร้างผู้ใช้ (ต้องมี service role key)
-- เราจะสร้างตาราง profiles เพื่อเก็บข้อมูลเพิ่มเติม

-- 1. PROFILES TABLE (เชื่อมกับ auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'dentist', 'receptionist')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. สร้าง Trigger ให้สร้าง profile อัตโนมัติเมื่อมี user ใหม่
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. สร้าง Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. สร้าง Policy ให้ดูข้อมูลได้
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==========================================
-- วิธีสร้างผู้ใช้ 3 รายการ:
-- ==========================================

-- วิธีที่ 1: ใน Supabase Dashboard
-- 1. Authentication → Users → Add User
-- 2. กรอกอีเมลและรหัสผ่าน
-- 3. ใส่ metadata:
--    - full_name: "ชื่อ-นามสกุล"
--    - role: "owner" / "dentist" / "receptionist"

-- วิธีที่ 2: ใช้ SQL (ต้องมี service role key)
/*
-- เจ้าของ
INSERT INTO auth.users (
  email,
  password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'owner@cikidental.com',
  'encrypted_password',
  NOW(),
  '{"full_name": "CIKI Owner", "role": "owner"}'
);

-- หมอ
INSERT INTO auth.users (
  email,
  password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'dentist@cikidental.com',
  'encrypted_password',
  NOW(),
  '{"full_name": "Dr. Smith", "role": "dentist"}'
);

-- เค้าเตอร์
INSERT INTO auth.users (
  email,
  password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'reception@cikidental.com',
  'encrypted_password',
  NOW(),
  '{"full_name": "Reception Staff", "role": "receptionist"}'
);
*/

-- ==========================================
-- ตรวจสอบผู้ใช้ที่สร้างแล้ว
-- ==========================================

-- ดูผู้ใช้ทั้งหมดใน auth.users
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at;

-- ดูข้อมูล profiles ที่เชื่อมกับ
SELECT p.id, p.email, p.full_name, p.role, p.created_at,
       u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at;

-- ==========================================
-- ข้อมูลผู้ใช้ที่แนะนำ:
-- ==========================================

/*
1. เจ้าของ (Owner)
   - Email: owner@cikidental.com
   - Password: owner123456
   - Role: owner
   - สิทธิ: เข้าถึงทุกฟีเจอร์

2. หมอ (Dentist)
   - Email: dentist@cikidental.com  
   - Password: dentist123456
   - Role: dentist
   - สิทธิ: ดูนัดหมาย, จัดการผู้ป่วย, บันทึกการรักษา

3. เค้าเตอร์ (Receptionist)
   - Email: reception@cikidental.com
   - Password: reception123456
   - Role: receptionist
   - สิทธิ: จองนัดหมาย, ดูปฏิทิน, ติดต่อลูกค้า
*/

-- ==========================================
-- สำหรับ Project ใหม่ (Asia Southeast)
-- รัน SQL นี้ใน project ใหม่ทั้งหมด
-- ==========================================
