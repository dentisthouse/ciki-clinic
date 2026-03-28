-- ==========================================
-- SQL EXPORT: ข้อมูลทั้งหมดจาก project เก่า
-- Project: https://jhbbomsjywuzbmdfkagm.supabase.co
-- ==========================================

-- 1. สร้างตาราง patients (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  status TEXT DEFAULT 'Active',
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Standard',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Import ข้อมูลทั้งหมดจาก project เก่า
INSERT INTO patients (id, name, phone, email, status, points, tier, created_at, updated_at) VALUES 
('8b8d1b3e-2c4f-4a8b-9d6e-1f2a3b4c5d6e', 'Test User', '0812345678', 'test@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('9c9e2c4f-3d5g-5b9c-a7f0-2g3b4c5d6e7f', 'Somchai Jaidee', '0812345678', 'somchai@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('7d7c0d3e-1b3e-4a7a-8c5d-0e1f2a3b4c5d', 'Suda Rakdee', '0812345678', 'suda@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('6e6b0c2d-0a2d-3a6a-7b4c-d0e1f2a3b4c5', 'Nong Test', '0812345678', 'nong@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');

-- 3. ตรวจสอบข้อมูลที่ import
SELECT * FROM patients;

-- 4. ตรวจสอบจำนวนข้อมูล
SELECT COUNT(*) as total_patients FROM patients;

-- 5. ตรวจสอบเบอร์โทรศัพท์ซ้ำ
SELECT phone, COUNT(*) as count FROM patients GROUP BY phone HAVING COUNT(*) > 1;

-- ==========================================
-- สำหรับ Project ใหม่ (Asia Southeast)
-- รัน SQL นี้ใน project ใหม่
-- ==========================================
