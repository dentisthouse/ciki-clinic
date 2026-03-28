-- ==========================================
-- แก้ไขปัญหา Trigger และ Profile Creation
-- ==========================================

-- 1. ลบ Trigger เก่า (ถ้ามี)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. สร้าง Function ใหม่ที่ถูกต้อง
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. สร้าง Trigger ใหม่
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. สำหรับผู้ใช้ที่สร้างไปแล้ว - อัปเดต role ด้วยตนเอง
-- รันคำสั่งนี้สำหรับแต่ละผู้ใช้ที่มีอยู่แล้ว

-- อัปเดตสำหรับเจ้าของ
UPDATE profiles 
SET role = 'owner', full_name = 'CIKI Owner'
WHERE email = 'owner@cikidental.com';

-- อัปเดตสำหรับหมอ
UPDATE profiles 
SET role = 'dentist', full_name = 'Dr. Smith'
WHERE email = 'dentist@cikidental.com';

-- อัปเดตสำหรับเค้าเตอร์
UPDATE profiles 
SET role = 'receptionist', full_name = 'Reception Staff'
WHERE email = 'reception@cikidental.com';

-- 5. ถ้ายังไม่มี profile ให้สร้างใหม่
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email = 'owner@cikidental.com' THEN 'CIKI Owner'
    WHEN u.email = 'dentist@cikidental.com' THEN 'Dr. Smith'
    WHEN u.email = 'reception@cikidental.com' THEN 'Reception Staff'
    ELSE split_part(u.email, '@', 1)
  END,
  CASE 
    WHEN u.email = 'owner@cikidental.com' THEN 'owner'
    WHEN u.email = 'dentist@cikidental.com' THEN 'dentist'
    WHEN u.email = 'reception@cikidental.com' THEN 'receptionist'
    ELSE 'receptionist'
  END
FROM auth.users u
WHERE u.email IN ('owner@cikidental.com', 'dentist@cikidental.com', 'reception@cikidental.com')
AND NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- 6. ตรวจสอบผลลัพธ์
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('owner@cikidental.com', 'dentist@cikidental.com', 'reception@cikidental.com')
ORDER BY p.created_at;

-- 7. ตรวจสอบว่า Trigger ทำงานไหม
-- ลองสร้าง user ทดสอบ (ใช้ email อื่น)
-- แล้วดูว่า profile ถูกสร้างโดยอัตโนมัติหรือไม่
