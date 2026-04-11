import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// =============================================
// Load sensitive data from environment variables
// =============================================
const OWNER_EMAILS = import.meta.env.VITE_OWNER_EMAILS?.split(',') || [];

// Staff mapping loaded from env (format: email:role:name,email2:role2:name2)
const parseStaffEnv = () => {
    const staffEnv = import.meta.env.VITE_STAFF_MAPPING || '';
    if (!staffEnv) return {};
    
    const staff = {};
    staffEnv.split(',').forEach(entry => {
        const parts = entry.split(':');
        if (parts.length >= 2) {
            const [email, role, name] = parts;
            staff[email.toLowerCase()] = { 
                name: name || email.split('@')[0], 
                role, 
                full_name: name || email.split('@')[0] 
            };
        }
    });
    return staff;
};

const HARDCODED_STAFF = parseStaffEnv();

/**
 * นิยามโมดูลและฟีเจอร์ย่อยทั้งหมดในระบบ
 */
export const PERMISSION_MODULES = [
    { 
        id: 'patients', labelTH: 'ระบบคนไข้', labelEN: 'Patients',
        features: [
            { id: 'view', labelTH: 'ดูรายชื่อคนไข้', labelEN: 'View List' },
            { id: 'manage', labelTH: 'เพิ่ม/แก้ข้อมูลพื้นฐาน', labelEN: 'Add/Edit Info' },
            { id: 'history', labelTH: 'ดูประวัติการรักษา', labelEN: 'View Clinical History' },
            { id: 'clinical', labelTH: 'เขียนแผนการรักษา/บันทึกฟัน', labelEN: 'Clinical Notes' },
            { id: 'delete', labelTH: 'ลบข้อมูลคนไข้', labelEN: 'Delete Patient' }
        ]
    },
    { 
        id: 'schedule', labelTH: 'ระบบนัดหมาย', labelEN: 'Schedule',
        features: [
            { id: 'view', labelTH: 'ดูตารางนัดหมาย', labelEN: 'View Schedule' },
            { id: 'add', labelTH: 'ลงนัดหมายใหม่', labelEN: 'Book Appointment' },
            { id: 'edit', labelTH: 'เลื่อน/ยกเลิกนัดหมาย', labelEN: 'Edit/Cancel Appt' }
        ]
    },
    { 
        id: 'billing', labelTH: 'ระบบการเงิน', labelEN: 'Billing',
        features: [
            { id: 'view', labelTH: 'ดูประวัติการรับเงิน', labelEN: 'View Billing List' },
            { id: 'create', labelTH: 'ออกใบแจ้งหนี้/ค่ารักษา', labelEN: 'Create Invoice' },
            { id: 'payment', labelTH: 'รับชำระเงิน/ออกใบเสร็จ', labelEN: 'Process Payment' },
            { id: 'void', labelTH: 'ยกเลิกรายการ (Void)', labelEN: 'Void Transaction' },
            { id: 'discount', labelTH: 'ให้ส่วนลดพิเศษ', labelEN: 'Apply Discount' }
        ]
    },
    { 
        id: 'inventory', labelTH: 'ระบบคลังสินค้า/แล็บ', labelEN: 'Inventory',
        features: [
            { id: 'view', labelTH: 'ดูสต็อกสินค้า', labelEN: 'View Inventory' },
            { id: 'manage', labelTH: 'เพิ่ม/แก้ไขรายการสินค้า', labelEN: 'Manage Items' },
            { id: 'adjust', labelTH: 'เบิกจ่าย/ปรับสต็อก', labelEN: 'Stock Adjust' },
            { id: 'lab', labelTH: 'ส่งแล็บ/ติดตามงานแล็บ', labelEN: 'Lab Tracking' }
        ]
    },
    { 
        id: 'staff', labelTH: 'ระบบจัดการพนักงาน', labelEN: 'Staff',
        features: [
            { id: 'view', labelTH: 'ดูข้อมูลพนักงาน', labelEN: 'View Staff' },
            { id: 'manage', labelTH: 'เพิ่ม/แก้ไขพนักงาน', labelEN: 'Manage Staff' },
            { id: 'salary', labelTH: 'ดูเงินเดือน/ค่าจ้าง', labelEN: 'View Salaries' },
            { id: 'attendance', labelTH: 'ดูสถิติลงเวลาทำงาน', labelEN: 'View Attendance' },
            { id: 'roles', labelTH: 'ตั้งค่าสิทธิ์ Role', labelEN: 'Manage Permissions' }
        ]
    },
    { 
        id: 'analytics', labelTH: 'ระบบรายงาน/วิเคราะห์', labelEN: 'Analytics',
        features: [
            { id: 'basic', labelTH: 'รายงานรายวันทั่วไป', labelEN: 'Daily Reports' },
            { id: 'advance', labelTH: 'รายงานรายได้/วิเคราะห์เชิงลึก', labelEN: 'Financial Analytics' }
        ]
    },
    { 
        id: 'expenses', labelTH: 'ระบบรายจ่ายคิลนิก', labelEN: 'Expenses',
        features: [
            { id: 'view', labelTH: 'ดูรายการรายจ่าย', labelEN: 'View Expenses' },
            { id: 'manage', labelTH: 'บันทึก/แก้ไขรายจ่าย', labelEN: 'Manage Expenses' }
        ]
    },
    { 
        id: 'sso', labelTH: 'ระบบประกันสังคม', labelEN: 'SSO',
        features: [
            { id: 'view', labelTH: 'ดูรายการสิทธิประกันสังคม', labelEN: 'View SSO Claims' },
            { id: 'manage', labelTH: 'จัดการเคลมประกันสังคม', labelEN: 'Process SSO Claims' }
        ]
    }
];

export const AVAILABLE_ROLES = [
    { id: 'admin', labelTH: 'ผู้ดูแลระบบ', labelEN: 'Admin', color: '#64748b' },
    { id: 'dentist', labelTH: 'ทันตแพทย์', labelEN: 'Dentist', color: '#3b82f6' },
    { id: 'assistant', labelTH: 'ผู้ช่วยทันตแพทย์', labelEN: 'Assistant', color: '#8b5cf6' },
    { id: 'receptionist', labelTH: 'พนักงานต้อนรับ', labelEN: 'Receptionist', color: '#f59e0b' },
];

/**
 * ค่าเริ่มต้นสำหรับ Role ต่างๆ
 */
export const DEFAULT_ROLE_PERMISSIONS = {
    owner: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, Object.fromEntries(m.features.map(f => [f.id, true]))])),
    admin: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, Object.fromEntries(m.features.map(f => [f.id, true]))])),
    dentist: {
        patients: { view: true, manage: true, history: true, clinical: true, delete: false },
        schedule: { view: true, add: true, edit: true },
        billing: { view: true, create: true, payment: false, void: false, discount: false },
        inventory: { view: true, manage: false, adjust: false, lab: true },
        staff: { view: true, manage: false, salary: false, attendance: false, roles: false },
        analytics: { basic: true, advance: false },
        expenses: { view: false, manage: false },
        sso: { view: true, manage: true }
    },
    receptionist: {
        patients: { view: true, manage: true, history: true, clinical: false, delete: false },
        schedule: { view: true, add: true, edit: true },
        billing: { view: true, create: true, payment: true, void: true, discount: true },
        inventory: { view: true, manage: false, adjust: false, lab: true },
        staff: { view: true, manage: false, salary: false, attendance: true, roles: false },
        analytics: { basic: true, advance: false },
        expenses: { view: true, manage: true },
        sso: { view: true, manage: true }
    },
    assistant: {
        patients: { view: true, manage: false, history: true, clinical: false, delete: false },
        schedule: { view: true, add: false, edit: false },
        billing: { view: false, create: false, payment: false, void: false, discount: false },
        inventory: { view: true, manage: true, adjust: true, lab: true },
        staff: { view: false, manage: false, salary: false, attendance: true, roles: false },
        analytics: { basic: false, advance: false },
        expenses: { view: false, manage: false },
        sso: { view: false, manage: false }
    }
};

/**
 * Helper: Run a task with a timeout
 */
const withTimeout = (promise, ms = 3000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [staffRecord, setStaffRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);

    const fetchRolePermissions = async () => {
        try {
            // Use timeout for permissions fetch
            const { data, error } = await withTimeout(supabase.from('role_permissions').select('*'), 2500);
            if (!error && data && data.length > 0) {
                const permsMap = { ...DEFAULT_ROLE_PERMISSIONS };
                data.forEach(row => {
                    let p = row.permissions;
                    if (typeof p === 'string') p = JSON.parse(p);
                    permsMap[row.role] = p;
                });
                setRolePermissions(permsMap);
                return permsMap;
            }
        } catch (err) { 
            console.warn('Permissions fetch took too long or failed, using defaults'); 
        }
        return DEFAULT_ROLE_PERMISSIONS;
    };

    const fetchStaffData = async (uid, email) => {
        if (!email) return;
        const normalizedEmail = email.toLowerCase();
        const isOwnerByEmail = OWNER_EMAILS.some(e => e.toLowerCase() === normalizedEmail);
        
        try {
            // Priority 1: Check profiles table first (Supabase auth profiles)
            const { data, error } = await withTimeout(
                supabase.from('profiles')
                    .select('*')
                    .ilike('email', normalizedEmail)
                    .maybeSingle(), 
                5000
            );

            if (data) {
                setStaffRecord({ 
                    ...data, 
                    role: isOwnerByEmail ? 'owner' : data.role,
                    name: data.full_name || data.name || email.split('@')[0]
                });
                return;
            } else {
                // Critical Fallback: Check hardcoded list first
                const localMatch = HARDCODED_STAFF[normalizedEmail];
                if (localMatch) {
                    setStaffRecord({ 
                        ...localMatch, 
                        role: isOwnerByEmail ? 'owner' : localMatch.role,
                        email: normalizedEmail, 
                        user_id: uid 
                    });
                    return;
                }

                // Final Fallback for unknown users
                setStaffRecord({ 
                    name: email.split('@')[0], 
                    role: isOwnerByEmail ? 'owner' : 'receptionist',
                    email: normalizedEmail
                });
            }
        } catch (err) { 
            console.error('❌ Final Resilience Fetch Failed:', err);
        }
    };

    const initializeAuth = async () => {
        try {
            // Priority 1: Auth Session (Fast)
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user || null;
            setUser(currentUser);
            
            // Priority 2: Permissions (Fast)
            fetchRolePermissions(); 

            if (currentUser) {
                // Background fetch staff, don't let it block startup
                fetchStaffData(currentUser.id, currentUser.email);
            }
        } catch (err) {
            console.error('Core init error:', err);
        } finally {
            // Always show the app after core checks, even if background tasks are still running
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeAuth();
        
        // Final safety net: Force-stop loading after 5 seconds no matter what
        const backupTimer = setTimeout(() => setLoading(false), 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (currentUser) fetchStaffData(currentUser.id, currentUser.email);
            else {
                setStaffRecord(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(backupTimer);
        };
    }, []);

    const logout = async () => await supabase.auth.signOut();

    const currentEmail = user?.email || '';
    const isOwner = user && OWNER_EMAILS.some(e => e.toLowerCase() === currentEmail.toLowerCase());
    const role = isOwner ? 'owner' : (staffRecord?.role || 'receptionist');
    const isAdmin = role === 'owner' || role === 'admin';
    const permissions = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS.receptionist;

    const value = { 
        user, 
        staff: staffRecord || (isOwner ? { name: currentEmail.split('@')[0].toUpperCase(), full_name: currentEmail.split('@')[0].toUpperCase(), role: 'owner' } : null),
        isAdmin, 
        permissions, 
        rolePermissions, 
        saveRolePermissions: async (updatedPerms) => {
            setRolePermissions(updatedPerms);
            const rows = Object.entries(updatedPerms).map(([role, permissions]) => ({
                role, permissions, updated_at: new Date().toISOString()
            }));
            const { error } = await supabase.from('role_permissions').upsert(rows, { onConflict: 'role' });
            return !error;
        }, 
        fetchRolePermissions,
        loading, 
        login: (e, p) => supabase.auth.signInWithPassword({ email: e, password: p }), 
        logout 
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                    <div style={{ marginBottom: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}>
                        <img src="/logo.png" alt="Clinic Logo" style={{ width: '120px', height: 'auto' }} />
                    </div>
                    <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '15px', color: '#94a3b8', fontSize: '0.8rem' }}>กำลังเชื่อมต่อฐานข้อมูล...</p>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        @keyframes pulse { 0%, 100% { transform: scale(0.98); opacity: 0.8; } 50% { transform: scale(1); opacity: 1; } }
                    `}</style>
                </div>
            )}
        </AuthContext.Provider>
    );
};
