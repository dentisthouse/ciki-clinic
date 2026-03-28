-- ==========================================
-- TABLE STRUCTURES ONLY: โครงสร้างตารางทั้งหมด (ไม่มีข้อมูล)
-- Project: https://jhbbomsjywuzbmdfkagm.supabase.co
-- Region: US East (จะย้ายไป Asia Southeast)
-- ==========================================

-- 1. PATIENTS TABLE
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

-- 2. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  phone TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  treatment TEXT,
  dentist TEXT,
  branch TEXT,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'Unpaid',
  payment_method TEXT,
  items JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  unit TEXT,
  current_stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  supplier TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. STAFF TABLE
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE,
  salary DECIMAL(10,2),
  status TEXT DEFAULT 'Active',
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  receipt_number TEXT,
  vendor TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. LAB ORDERS TABLE
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  doctor TEXT,
  lab_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'Pending',
  order_date DATE,
  due_date DATE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. SSO CLAIMS TABLE
CREATE TABLE IF NOT EXISTS sso_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  claim_number TEXT UNIQUE NOT NULL,
  insurance_company TEXT,
  policy_number TEXT,
  claim_date DATE,
  service_date DATE,
  treatment TEXT,
  amount_billed DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. PATIENT IMAGES TABLE
CREATE TABLE IF NOT EXISTS patient_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  image_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT,
  description TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. PATIENT DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  document_name TEXT NOT NULL,
  document_type TEXT,
  document_url TEXT NOT NULL,
  description TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id),
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  break_duration INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2),
  status TEXT DEFAULT 'Present',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- VERIFICATION QUERIES (ตรวจสอบว่าตารางถูกสร้างแล้ว)
-- ==========================================

-- ตรวจสอบว่าตารางทั้งหมดถูกสร้างแล้ว
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ตรวจสอบจำนวนตาราง
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- ==========================================
-- สำหรับ Project ใหม่ (Asia Southeast)
-- รัน SQL นี้ใน project ใหม่ทั้งหมด
-- ==========================================
