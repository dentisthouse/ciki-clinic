// Form validation schemas using Zod
// Note: Install zod with: npm install zod

import { z } from 'zod';

// Patient validation schema
export const patientSchema = z.object({
    hn: z.string().min(1, 'กรุณาระบุ CN'),
    firstName: z.string().min(1, 'กรุณาระบุชื่อ').max(100, 'ชื่อยาวเกินไป'),
    lastName: z.string().min(1, 'กรุณาระบุนามสกุล').max(100, 'นามสกุลยาวเกินไป'),
    phone: z.string().regex(/^0\d{8,9}$/, 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)'),
    email: z.string().email('อีเมลไม่ถูกต้อง').optional().or(z.literal('')),
    idCard: z.string().regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก').optional().or(z.literal('')),
    birthDate: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.string().max(500, 'ที่อยู่ยาวเกินไป').optional(),
    allergies: z.string().max(1000, 'ข้อมูลยาวเกินไป').optional(),
    medicalHistory: z.string().max(2000, 'ข้อมูลยาวเกินไป').optional(),
    emergencyContact: z.object({
        name: z.string().optional(),
        phone: z.string().regex(/^0\d{8,9}$/, 'เบอร์โทรไม่ถูกต้อง').optional().or(z.literal('')),
        relationship: z.string().optional()
    }).optional()
});

// Appointment validation schema
export const appointmentSchema = z.object({
    patientId: z.string().min(1, 'กรุณาเลือกคนไข้'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่ไม่ถูกต้อง'),
    time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'เวลาไม่ถูกต้อง (เช่น 09:00)'),
    dentist: z.string().min(1, 'กรุณาเลือกทันตแพทย์'),
    procedure: z.string().min(1, 'กรุณาระบุการรักษา').max(200, 'รายละเอียดยาวเกินไป'),
    notes: z.string().max(1000, 'หมายเหตุยาวเกินไป').optional(),
    duration: z.number().min(15).max(240).default(30),
    status: z.enum(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']).default('Pending')
});

// Billing validation schema
export const billingSchema = z.object({
    patientId: z.string().min(1, 'กรุณาเลือกคนไข้'),
    items: z.array(z.object({
        description: z.string().min(1, 'กรุณาระบุรายการ'),
        quantity: z.number().min(1, 'จำนวนต้องมากกว่า 0'),
        unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
        discount: z.number().min(0).max(100, 'ส่วนลดต้องไม่เกิน 100%').default(0)
    })).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
    paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'qr_code', 'insurance']),
    totalAmount: z.number().min(0),
    discountAmount: z.number().min(0).default(0),
    taxAmount: z.number().min(0).default(0),
    finalAmount: z.number().min(0),
    notes: z.string().max(500).optional()
});

// Staff validation schema
export const staffSchema = z.object({
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    fullName: z.string().min(1, 'กรุณาระบุชื่อ').max(100),
    role: z.enum(['owner', 'admin', 'dentist', 'assistant', 'receptionist']),
    phone: z.string().regex(/^0\d{8,9}$/, 'เบอร์โทรไม่ถูกต้อง').optional().or(z.literal('')),
    licenseNumber: z.string().optional(),
    startDate: z.string().optional(),
    isActive: z.boolean().default(true)
});

// Inventory validation schema
export const inventorySchema = z.object({
    name: z.string().min(1, 'กรุณาระบุชื่อสินค้า').max(200),
    code: z.string().min(1, 'กรุณาระบุรหัสสินค้า').max(50),
    category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
    quantity: z.number().min(0, 'จำนวนต้องไม่ติดลบ'),
    minStock: z.number().min(0).default(10),
    unitPrice: z.number().min(0),
    supplier: z.string().optional(),
    expiryDate: z.string().optional(),
    notes: z.string().max(500).optional()
});

// Treatment record validation
export const treatmentSchema = z.object({
    patientId: z.string().min(1, 'กรุณาเลือกคนไข้'),
    appointmentId: z.string().optional(),
    teeth: z.array(z.string()).min(1, 'กรุณาเลือกซี่ฟัน'),
    diagnosis: z.string().min(1, 'กรุณาระบุการวินิจฉัย').max(500),
    treatment: z.string().min(1, 'กรุณาระบุการรักษา').max(1000),
    materials: z.array(z.object({
        itemId: z.string(),
        name: z.string(),
        quantity: z.number().min(0.1)
    })).optional(),
    cost: z.number().min(0),
    notes: z.string().max(2000).optional(),
    followUpRequired: z.boolean().default(false),
    followUpDate: z.string().optional(),
    images: z.array(z.string().url()).optional()
});

// Helper to format validation errors
export const formatZodErrors = (error) => {
    if (!error || !error.errors) return {};
    
    const formatted = {};
    error.errors.forEach((err) => {
        const path = err.path.join('.');
        formatted[path] = err.message;
    });
    return formatted;
};

// Helper to validate partial data (for updates)
export const validatePartial = (schema, data) => {
    const partialSchema = schema.partial();
    return partialSchema.safeParse(data);
};

export default {
    patientSchema,
    appointmentSchema,
    billingSchema,
    staffSchema,
    inventorySchema,
    treatmentSchema,
    formatZodErrors,
    validatePartial
};
