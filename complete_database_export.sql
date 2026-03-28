-- ==========================================
-- COMPLETE SQL EXPORT: ข้อมูลทั้งหมดจาก project เก่า
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

INSERT INTO patients (id, name, phone, email, status, points, tier, created_at, updated_at) VALUES 
('8b8d1b3e-2c4f-4a8b-9d6e-1f2a3b4c5d6e', 'Test User', '0812345678', 'test@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('9c9e2c4f-3d5g-5b9c-a7f0-2g3b4c5d6e7f', 'Somchai Jaidee', '0812345678', 'somchai@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('7d7c0d3e-1b3e-4a7a-8c5d-0e1f2a3b4c5d', 'Suda Rakdee', '0812345678', 'suda@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('6e6b0c2d-0a2d-3a6a-7b4c-d0e1f2a3b4c5', 'Nong Test', '0812345678', 'nong@example.com', 'Active', 0, 'Standard', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');

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
-- SAMPLE DATA INSERTIONS (ถ้ามีข้อมูลจริง ให้แทนที่)
-- ==========================================

-- Sample Appointments
INSERT INTO appointments (patient_id, patient_name, phone, date, time, treatment, dentist, branch, status) VALUES
('8b8d1b3e-2c4f-4a8b-9d6e-1f2a3b4c5d6e', 'Test User', '0812345678', '2024-01-15', '09:00', 'General Checkup', 'Dr. Smith', 'Main Branch', 'Confirmed'),
('9c9e2c4f-3d5g-5b9c-a7f0-2g3b4c5d6e7f', 'Somchai Jaidee', '0812345678', '2024-01-16', '10:30', 'Cleaning', 'Dr. Johnson', 'Main Branch', 'Pending');

-- Sample Invoices
INSERT INTO invoices (patient_id, patient_name, invoice_number, date, amount, status, payment_method) VALUES
('8b8d1b3e-2c4f-4a8b-9d6e-1f2a3b4c5d6e', 'Test User', 'INV-2024-001', '2024-01-15', 500.00, 'Paid', 'Cash'),
('9c9e2c4f-3d5g-5b9c-a7f0-2g3b4c5d6e7f', 'Somchai Jaidee', 'INV-2024-002', '2024-01-16', 1200.00, 'Unpaid', NULL);

-- Sample Staff
INSERT INTO staff (employee_id, name, email, phone, position, department, hire_date, salary, status) VALUES
('EMP001', 'Dr. Smith', 'smith@clinic.com', '0811111111', 'Dentist', 'Clinical', '2023-01-01', 50000.00, 'Active'),
('EMP002', 'Dr. Johnson', 'johnson@clinic.com', '0822222222', 'Dentist', 'Clinical', '2023-02-01', 48000.00, 'Active');

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- ตรวจสอบจำนวนข้อมูลแต่ละตาราง
SELECT 'patients' as table_name, COUNT(*) as record_count FROM patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'lab_orders', COUNT(*) FROM lab_orders
UNION ALL
SELECT 'sso_claims', COUNT(*) FROM sso_claims
UNION ALL
SELECT 'patient_images', COUNT(*) FROM patient_images
UNION ALL
SELECT 'patient_documents', COUNT(*) FROM patient_documents
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records;

-- ==========================================
-- สำหรับ Project ใหม่ (Asia Southeast)
-- รัน SQL นี้ใน project ใหม่ทั้งหมด
-- ==========================================
