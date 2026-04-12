import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { db } from '../db';
import { generateFullCN } from '../utils/cnGenerator';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const { error: toastError } = useToast();
    const { language } = useLanguage();
    
    // --- APP STATE ---
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const syncInProgressRef = React.useRef(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // --- DATA STATES ---
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [labOrders, setLabOrders] = useState([]);
    const [ssoClaims, setSsoClaims] = useState([]);
    const [staff, setStaff] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [patientDocuments, setPatientDocuments] = useState([]);
    const [logs, setLogs] = useState([]);
    
    // --- SETTINGS STATE ---
    const [settings, setSettings] = useState({
        clinicInfo: {
            name: { TH: 'คลินิกทันตกรรม CIKI', EN: 'CIKI Dental Clinic' },
            description: { TH: 'คลินิกทันตกรรมครบวงจร', EN: 'Comprehensive dental clinic' }
        },
        services: [
            // General & Diagnostic
            { id: 'checkup', name: { TH: 'ตรวจสุขภาพช่องปากและปรึกษา', EN: 'Oral Exam & Consultation' }, category: 'general', price: 500, active: true },
            { id: 'xray-film', name: { TH: 'เอกซเรย์ฟิล์มเล็ก (Periapical)', EN: 'X-Ray (Periapical)' }, category: 'general', price: 300, active: true },
            { id: 'xray-pano', name: { TH: 'เอกซเรย์ทั้งปาก (Panoramic)', EN: 'Panoramic X-Ray' }, category: 'general', price: 800, active: true },
            
            // Preventive
            { id: 'cleaning', name: { TH: 'ขูดหินปูนและขัดฟัน', EN: 'Scaling & Polishing' }, category: 'preventive', price: 1200, active: true },
            { id: 'fluoride', name: { TH: 'เคลือบฟลูออไรด์ทั่วทั้งปาก', EN: 'Fluoride Treatment' }, category: 'preventive', price: 600, active: true },
            { id: 'sealant', name: { TH: 'เคลือบหลุมร่องฟัน (ต่อซี่)', EN: 'Pit & Fissure Sealant' }, category: 'preventive', price: 600, active: true },
            
            // Restorative
            { id: 'filling-1', name: { TH: 'อุดฟันสีเหมือนฟัน (1 ด้าน)', EN: 'Filling (1 Surface)' }, category: 'restorative', price: 1000, active: true },
            { id: 'filling-2', name: { TH: 'อุดฟันสีเหมือนฟัน (2 ด้าน)', EN: 'Filling (2 Surfaces)' }, category: 'restorative', price: 1800, active: true },
            { id: 'crown-porcelain', name: { TH: 'ครอบฟันเซรามิก', EN: 'Porcelain Crown' }, category: 'restorative', price: 15000, active: true },
            { id: 'denture-partial', name: { TH: 'ฟันปลอมฐานพลาสติก (ชิ้นเดียว)', EN: 'Partial Denture' }, category: 'restorative', price: 3000, active: true },
            
            // Surgery
            { id: 'extraction-simple', name: { TH: 'ถอนฟันทั่วไป', EN: 'Simple Extraction' }, category: 'surgery', price: 800, active: true },
            { id: 'extraction-complex', name: { TH: 'ถอนฟันยาก/ฟันกราม', EN: 'Complex Extraction' }, category: 'surgery', price: 1500, active: true },
            { id: 'wisdom-tooth', name: { TH: 'ผ่าฟันคุด', EN: 'Wisdom Tooth Surgery' }, category: 'surgery', price: 3500, active: true },
            
            // Endodontics (Root Canal)
            { id: 'rct-front', name: { TH: 'รักษารากฟันหน้า', EN: 'Root Canal (Front Tooth)' }, category: 'endodontics', price: 6000, active: true },
            { id: 'rct-molar', name: { TH: 'รักษารากฟันกราม', EN: 'Root Canal (Molar)' }, category: 'endodontics', price: 10000, active: true },
            
            // Cosmetic
            { id: 'whitening', name: { TH: 'ฟอกสีฟัน (In-office)', EN: 'Teeth Whitening' }, category: 'cosmetic', price: 8500, active: true },
            { id: 'veneer', name: { TH: 'วีเนียร์เซรามิก (ต่อซี่)', EN: 'Ceramic Veneer' }, category: 'cosmetic', price: 12000, active: true },
            
            // Orthodontics
            { id: 'braces-metal', name: { TH: 'จัดฟันแบบโลหะ (เหมาจ่าย)', EN: 'Metal Braces (Package)' }, category: 'orthodontics', price: 45000, active: true },
            { id: 'invisalign', name: { TH: 'จัดฟันแบบใส Invisalign', EN: 'Invisalign' }, category: 'orthodontics', price: 120000, active: true }
        ],
        branches: [
            { id: 'main', name: { TH: 'สาขาหลัก', EN: 'Main Branch' }, status: 'active' }
        ],
        workingHours: { weekdays: {}, holidays: [] },
        paymentMethods: [
            { id: 'cash', name: { TH: 'เงินสด', EN: 'Cash' }, enabled: true },
            { id: 'transfer', name: { TH: 'โอนเงิน', EN: 'Bank Transfer' }, enabled: true }
        ]
    });

    // --- UTILS ---
    const updateLocalState = useCallback((tableName, data) => {
        const updaters = {
            patients: setPatients,
            appointments: setAppointments,
            inventory: setInventory,
            invoices: setInvoices,
            expenses: setExpenses,
            lab_orders: setLabOrders,
            sso_claims: setSsoClaims,
            staff: setStaff,
            attendance_records: setAttendanceRecords,
            logs: setLogs
        };
        const setter = updaters[tableName];
        if (setter) setter(data);
    }, []);

    // --- UTILS ---
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // --- OFFLINE-FIRST INITIALIZATION ---
    const initFromLocalDB = useCallback(async () => {
        try {
            const data = {
                patients: await db.patients.toArray(),
                appointments: await db.appointments.toArray(),
                inventory: await db.inventory.toArray(),
                invoices: await db.invoices.toArray(),
                lab_orders: await db.lab_orders.toArray(),
                sso_claims: await db.sso_claims.toArray(),
                staff: await db.staff.toArray(),
                attendance_records: await db.attendance_records.toArray(),
                expenses: await db.expenses.toArray(),
                logs: (await db.logs.toArray()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)),
            };

            setPatients(data.patients);
            setAppointments(data.appointments);
            setInventory(data.inventory);
            setInvoices(data.invoices);
            setLabOrders(data.lab_orders);
            setSsoClaims(data.sso_claims);
            setStaff(data.staff);
            setAttendanceRecords(data.attendance_records);
            setExpenses(data.expenses);
            setLogs(data.logs);
            
            return data;
        } catch (err) {
            console.error("Dexie Initial Load Error:", err);
            return null;
        }
    }, []);

    // --- SUPABASE SYNC (Optimized Egress) ---
    const syncWithSupabase = useCallback(async (tableNames) => {
        if (syncInProgressRef.current) return;
        syncInProgressRef.current = true;
        setIsSyncing(true);
        console.log("🔄 Background Syncing with Supabase...");
        
        // Log the sync event
        addLog({ action: 'sync_data', module: 'system', details: 'Manual sync with server' });

        const tablesToSync = tableNames || [
            'patients', 'appointments', 'inventory', 'invoices', 
            'lab_orders', 'sso_claims', 'staff', 'attendance_records', 'expenses'
        ];

        try {
            const results = await Promise.allSettled(
                tablesToSync.map(table => supabase.from(table).select('*'))
            );

            for (let i = 0; i < tablesToSync.length; i++) {
                const tableName = tablesToSync[i];
                const res = results[i];

                if (res.status === 'fulfilled' && !res.value.error && res.value.data) {
                    const data = res.value.data;
                    
                    const normalizeData = (table, records) => {
                        if (table === 'patients') {
                            return records.map(p => ({ 
                                ...p, 
                                registrationDate: p.registration_date,
                                idCard: p.id_card,
                                insuranceType: p.insurance_type,
                                toothChart: p.tooth_chart || {}, 
                                medicalHistory: p.medical_history || [], 
                                vitals: p.vitals || {},
                                lineUserId: p.line_user_id,
                                linePictureUrl: p.line_picture_url
                            }));
                        } else if (table === 'appointments') {
                            return records.map(a => {
                                // Extract type from notes if present (Workaround for missing 'type' column in DB)
                                let inferredType = 'Staff Appointment';
                                const notes = a.notes || '';
                                if (notes.includes('[LINE]') || notes.includes('📱 [LINE]')) {
                                    inferredType = 'LINE Booking';
                                } else if (notes.includes('[Walk-in]')) {
                                    inferredType = 'Walk-in';
                                }
                                
                                return { 
                                    ...a, 
                                    patientId: a.patient_id, 
                                    patientName: a.patient_name,
                                    procedure: a.treatment || a.procedure,
                                    queueNumber: a.queue_number,
                                    queueStatus: a.queue_status || a.queueStatus,
                                    checkInTime: a.check_in_time || a.checkInTime,
                                    type: a.type || inferredType
                                };
                            });
                        } else if (table === 'invoices') {
                            return records.map(inv => ({
                                ...inv,
                                patientId: inv.patient_id,
                                patientName: inv.patient_name,
                                doctorName: inv.doctor_name,
                                paymentMethod: inv.payment_method,
                                baseTotal: inv.base_total,
                                serviceFee: inv.service_fee,
                                cardFeeAmount: inv.card_fee_amount,
                                splitAmounts: inv.split_amounts,
                                appointmentId: inv.appointment_id
                            }));
                        } else if (table === 'inventory') {
                            return records.map(item => ({
                                ...item,
                                name: item.item_name || item.name,
                                stock: item.current_stock !== undefined ? item.current_stock : item.stock,
                                reorderPoint: item.min_stock_level !== undefined ? item.min_stock_level : item.reorderPoint,
                                price: item.selling_price || item.price || 0,
                            }));
                        } else if (table === 'staff') {
                            return records.map(s => ({
                                ...s,
                                name: s.name || s.full_name,
                                employeeId: s.employee_id,
                                licenseNumber: s.license_number,
                                hireDate: s.start_date || s.hire_date || s.hireDate,
                                commissionRate: s.commission_rate || 50,
                            }));
                        } else if (table === 'lab_orders') {
                            return records.map(o => ({
                                ...o,
                                patientId: o.patient_id || o.patientId,
                                patientName: o.patient_name || o.patientName,
                                orderDate: o.order_date || o.orderDate || o.sent,
                                dueDate: o.due_date || o.dueDate || o.due,
                                lab: o.lab_type || o.clinic_name || o.lab,
                                clinicName: o.lab_type || o.clinic_name || o.lab,
                                work: o.description || o.items || o.work,
                                items: o.description || o.items || o.work,
                                appliance: o.appliance,
                                totalCost: o.total_cost || o.totalCost
                            }));
                        } else if (table === 'sso_claims') {
                            return records.map(c => ({
                                ...c,
                                claimDate: c.claim_date,
                                claimStatus: c.claim_status,
                                approvalNumber: c.approval_number
                            }));
                        } else if (table === 'attendance_records') {
                            return records.map(att => ({
                                ...att,
                                staffId: att.staff_id,
                                lateStatus: att.late_status,
                                lateMinutes: att.late_minutes,
                                distanceFromClinic: att.distance_from_clinic
                            }));
                        }
                        return records;
                    };

                    const processedData = normalizeData(tableName, data);

                    // Update Local State & Persistence
                    updateLocalState(tableName, processedData);
                    
                    // CLEAR local table before bulkPut to ensure deleted records from Supabase are removed locally
                    await db.table(tableName).clear();
                    await db.table(tableName).bulkPut(processedData);
                    
                    console.log(`✅ Table [${tableName}] synced: ${processedData.length} records`);
                }
            }
            
            const now = new Date();
            setLastSyncTime(now);
            await db.sync_metadata.put({ table: 'overall', lastSyncTime: now.getTime() });

        } catch (err) {
            console.error("Supabase Sync Failed:", err);
        } finally {
            syncInProgressRef.current = false;
            setIsSyncing(false);
            setIsLoading(false);
        }
    }, [updateLocalState]);

    // Initial effect to fuel data from local first, then sync
    useEffect(() => {
        if (user) {
            const runAutoSync = async () => {
                const localData = await initFromLocalDB();
                
                // If local data is empty or it's been too long, sync
                const overallMeta = await db.sync_metadata.get('overall');
                const lastSync = overallMeta?.lastSyncTime || 0;
                const timeDiff = Date.now() - lastSync;
                
                // If never synced or more than 2 hours ago (to save egress)
                if (timeDiff > 7200000 || (localData && localData.patients.length === 0)) {
                    await syncWithSupabase();
                } else {
                    setIsLoading(false);
                }
                
                // Load Settings from LocalStorage first for instant UI
                const savedSettings = localStorage.getItem('ciki_settings');
                if (savedSettings) {
                    try {
                        setSettings(JSON.parse(savedSettings));
                    } catch(e) {}
                }

                // Try to get fresh settings from Supabase
                try {
                    const { data: remoteSettings, error: settingsError } = await supabase.from('settings').select('*').eq('id', 'global').single();
                    if (remoteSettings && remoteSettings.data) {
                        setSettings(remoteSettings.data);
                        localStorage.setItem('ciki_settings', JSON.stringify(remoteSettings.data));
                    }
                } catch (e) {
                    console.warn("Could not load remote settings:", e);
                }
            };

            runAutoSync();

            // --- OPTIMIZED REAL-TIME SUBSCRIPTION ---
            // Instead of refetching everything, we update the local DB and State with the payload
            const dataChannels = supabase
                .channel('db-changes')
                .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
                    const { table, eventType, new: newRecord, old: oldRecord } = payload;
                    console.log(`🔔 Remote ${eventType} on [${table}]`);

                    // Update Local Storage
                    if (eventType === 'DELETE') {
                        await db.table(table).delete(oldRecord.id);
                    } else {
                        await db.table(table).put(newRecord);
                    }

                    // Refresh relevant local state buffer from DB to maintain consistency
                    const updatedArray = await db.table(table).toArray();
                    
                    const normalizeData = (table, records) => {
                        if (table === 'patients') {
                            return records.map(p => ({ 
                                ...p, 
                                registrationDate: p.registration_date || p.registrationDate,
                                toothChart: p.tooth_chart || p.toothChart || {}, 
                                medicalHistory: p.medical_history || p.medicalHistory || [], 
                                vitals: p.vitals || p.vitals || {},
                                lineUserId: p.line_user_id || p.lineUserId,
                                linePictureUrl: p.line_picture_url || p.linePictureUrl
                            }));
                        }
                        if (table === 'invoices') {
                            return records.map(inv => ({
                                ...inv,
                                patientId: inv.patient_id || inv.patientId,
                                patientName: inv.patient_name || inv.patientName,
                                doctorName: inv.doctor_name || inv.doctorName,
                                paymentMethod: inv.payment_method || inv.paymentMethod,
                                baseTotal: inv.base_total || inv.baseTotal,
                                serviceFee: inv.service_fee || inv.serviceFee,
                                cardFeeAmount: inv.card_fee_amount || inv.cardFeeAmount,
                                splitAmounts: inv.split_amounts || inv.splitAmounts,
                                appointmentId: inv.appointment_id || inv.appointmentId
                            }));
                        }
                        if (table === 'appointments') {
                            return records.map(a => {
                                // Extract type from notes if present (Workaround for missing 'type' column in DB)
                                let inferredType = 'Staff Appointment';
                                const notes = a.notes || '';
                                if (notes.includes('[LINE]') || notes.includes('📱 [LINE]')) {
                                    inferredType = 'LINE Booking';
                                } else if (notes.includes('[Walk-in]')) {
                                    inferredType = 'Walk-in';
                                }

                                return {
                                    ...a,
                                    patientId: a.patient_id || a.patientId,
                                    patientName: a.patient_name || a.patientName,
                                    procedure: a.treatment || a.procedure,
                                    queueNumber: a.queue_number || a.queueNumber,
                                    queueStatus: a.queue_status || a.queueStatus,
                                    checkInTime: a.check_in_time || a.checkInTime,
                                    type: a.type || inferredType
                                };
                            });
                        }
                        if (table === 'inventory') {
                            return records.map(item => ({
                                ...item,
                                reorderPoint: item.reorder_point || item.reorderPoint,
                                lastRestocked: item.last_restocked || item.lastRestocked
                            }));
                        }
                        if (table === 'lab_orders' || table === 'sso_claims' || table === 'attendance_records') {
                            // Apply similar mappings as above if needed for real-time
                            return records.map(r => ({
                                ...r,
                                staffId: r.staff_id || r.staffId,
                                orderDate: r.order_date || r.orderDate,
                                claimDate: r.claim_date || r.claimDate,
                                lateStatus: r.late_status || r.lateStatus
                            }));
                        }
                        return records;
                    };
                    
                    const finalData = normalizeData(table, updatedArray);
                    
                    updateLocalState(table, finalData);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(dataChannels);
            };
        }
    }, [user, initFromLocalDB, syncWithSupabase, updateLocalState]);

    // --- CRUD OPERATIONS (OPTIMISTIC & PERSISTENT) ---
    
    const toSupabasePatient = (patient) => {
        if (!patient) return null;
        const mapping = {
            name: patient.name,
            hn: patient.hn,
            phone: patient.phone,
            email: patient.email,
            gender: patient.gender,
            age: patient.age ? parseInt(patient.age) : undefined,
            address: patient.address,
            insurance_type: patient.insuranceType,
            active: patient.active,
            registration_date: patient.registrationDate,
            medical_history: patient.medicalHistory,
            tooth_chart: patient.toothChart,
            vitals: patient.vitals,
            line_user_id: patient.lineUserId || patient.line_user_id,
            line_picture_url: patient.linePictureUrl || patient.line_picture_url,
            treatments: patient.treatments,
            last_visit: patient.lastVisit
        };
        // Remove undefined values to allow partial updates
        return Object.fromEntries(Object.entries(mapping).filter(([_, v]) => v !== undefined));
    };

    const toSupabaseInvoice = (inv) => {
        if (!inv) return null;
        const mapping = {
            id: inv.id,
            patient_id: inv.patientId,
            patient_name: inv.patientName,
            amount: inv.amount,
            discount: inv.discount,
            total: inv.total,
            status: inv.status,
            date: inv.date,
            items: inv.items,
            payment_method: inv.paymentMethod,
            doctor_name: inv.doctorName,
            base_total: inv.baseTotal,
            service_fee: inv.serviceFee,
            card_fee_amount: inv.cardFeeAmount,
            split_amounts: inv.splitAmounts,
            appointment_id: inv.appointmentId
        };
        return Object.fromEntries(Object.entries(mapping).filter(([_, v]) => v !== undefined));
    };

    const toSupabaseStaff = (s) => {
        if (!s) return null;
        const mapping = {
            employee_id: s.employeeId || s.employee_id,
            name: s.name || s.full_name,
            role: s.role,
            position: s.role || s.position,
            phone: s.phone,
            email: s.email,
            license_number: s.licenseNumber || s.license_number,
            specialty: s.specialty,
            start_date: s.startDate || s.start_date || s.hireDate || s.hire_date,
            salary: s.salary,
            status: s.status,
            schedule: s.schedule,
            note: s.note,
            branch: s.branch || 'Main',
            commission_rate: s.commissionRate !== undefined ? s.commissionRate : (s.commission_rate || 50)
        };
        return Object.fromEntries(Object.entries(mapping).filter(([_, v]) => v !== undefined));
    };

    const toSupabaseInventory = (item) => {
        if (!item) return null;
        const mapping = {
            id: item.id,
            item_code: item.code || item.item_code || item.id,
            item_name: item.name || item.item_name,
            category: item.category,
            unit: item.unit,
            current_stock: item.stock !== undefined ? item.stock : item.current_stock,
            min_stock_level: item.reorderPoint !== undefined ? item.reorderPoint : item.min_stock_level,
            selling_price: item.price || item.selling_price || 0,
            status: item.status || 'Active'
        };
        return Object.fromEntries(Object.entries(mapping).filter(([_, v]) => v !== undefined));
    };

    const toSupabaseAttendance = (att) => {
        if (!att) return null;
        const mapping = {
            id: att.id,
            staff_id: att.staffId,
            status: att.status,
            late_status: att.lateStatus,
            late_minutes: att.lateMinutes,
            timestamp: att.timestamp,
            location: att.location,
            distance_from_clinic: att.distanceFromClinic,
            note: att.note
        };
        return Object.fromEntries(Object.entries(mapping).filter(([_, v]) => v !== undefined));
    };

    const toSupabaseExpense = (exp) => {
        if (!exp) return null;
        const mapping = {
            id: exp.id,
            date: exp.date,
            description: exp.description,
            amount: exp.amount,
            category: exp.category,
            payment_method: exp.paymentMethod,
            receipt_url: exp.receiptUrl,
            status: exp.status
        };
        return Object.fromEntries(Object.entries(mapping).filter(([_, v]) => v !== undefined));
    };

    const toSupabaseLabOrder = (o) => {
        if (!o) return null;
        const mapping = {
            id: o.id,
            order_number: o.orderNumber || `ORD-${Date.now()}`,
            patient_id: o.patientId,
            patient_name: o.patientName || 'Unknown Patient',
            lab_type: o.clinicName || o.lab,
            description: o.appliance ? `[${o.appliance}] ${o.items || o.work}` : (o.items || o.work),
            status: o.status,
            order_date: o.orderDate || o.sent,
            due_date: o.dueDate || o.due,
            notes: o.notes
        };
        return Object.fromEntries(Object.entries(mapping).filter(([_, v]) => v !== undefined));
    };

    const persistAction = async (table, action, method, data, id) => {
        try {
            // Update Local First (Optimistic)
            if (method === 'insert') {
                await db.table(table).add(data);
            } else if (method === 'update') {
                await db.table(table).update(id, data);
            } else if (method === 'delete') {
                await db.table(table).delete(id);
            } else if (method === 'bulk_insert') {
                await db.table(table).bulkAdd(data);
            }
            
            // Reload into state
            const allLocal = await db.table(table).toArray();
            updateLocalState(table, allLocal);

            // Sync to Supabase in background
            const { error: sbError } = await action();
            if (sbError) {
                console.error(`Supabase persistence error [${table}]:`, sbError);
                toastError(`Supabase Error: ${sbError.message || 'Unknown error'}`);
                throw sbError;
            }
        } catch (err) {
            console.error(`Backend persistence failed for [${table}]`, err);
            toastError(`${table} persistence failed: ${err.message || 'Network error'}`);
        }
    };

    // Patients
    const addPatient = async (patient) => {
        // Split name into first and last name for CN generation
        const [firstName, ...lastNameParts] = (patient.name || '').trim().split(/\s+/);
        const lastName = lastNameParts.join(' ');
        
        // Generate automatic CN based on name code + running sequence
        const hn = generateFullCN(firstName, lastName, patients);

        // Generate a standard UUID to match Supabase's column requirements
        const id = generateUUID();
        
        const newPatient = { 
            ...patient, 
            id, 
            hn,
            active: true, 
            registrationDate: new Date().toISOString(),
            toothChart: {}, 
            medicalHistory: [], 
            vitals: {},
            treatmentPlans: [],
            treatments: [],
            oldRecords: [],
            totalBilled: 0,
            totalPaid: 0
        };
        
        await persistAction('patients', 
            () => {
                const supabaseData = toSupabasePatient(newPatient);
                return supabase.from('patients').insert([supabaseData]);
            }, 
            'insert', newPatient
        );
        addLog({ action: 'create_patient', module: 'patients', details: `ลงทะเบียนคนไข้ใหม่: ${newPatient.name} (CN: ${newPatient.hn})`, severity: 'low' });
    };

    const updatePatient = async (id, updates) => {
        await persistAction('patients',
            () => {
                const supabaseUpdates = toSupabasePatient(updates);
                return supabase.from('patients').update(supabaseUpdates).eq('id', id);
            },
            'update', updates, id
        );
    };

    const deletePatient = async (id) => {
        await persistAction('patients',
            () => supabase.from('patients').update({ active: false }).eq('id', id),
            'update', { active: false }, id
        );
        addLog({ action: 'delete_patient', module: 'patients', details: `ย้ายคนไข้เข้าถังขยะ: ${id}`, severity: 'medium' });
    };

    const restorePatient = async (id) => {
        await persistAction('patients',
            () => supabase.from('patients').update({ active: true }).eq('id', id),
            'update', { active: true }, id
        );
    };

    const updateToothChart = async (patientId, chartData) => {
        await persistAction('patients',
            () => supabase.from('patients').update({ tooth_chart: chartData }).eq('id', patientId),
            'update', { toothChart: chartData }, patientId
        );
    };

    // Appointments
    const addAppointment = async (appointment) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const count = appointments.filter(a => a.date && a.date.startsWith(todayStr)).length + 1;
        const qNum = `${appointment.type === 'Walk-in' ? 'W' : 'A'}-${String(count).padStart(2, '0')}`;
        const newAptId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `APT-${Date.now()}`;

        const newApt = {
            ...appointment,
            id: newAptId,
            status: 'Pending',
            queueStatus: 'Waiting',
            queueNumber: qNum,
            type: appointment.type || 'Staff Appointment'
        };

        const dbRecord = {
            id: newApt.id,
            patient_id: newApt.patientId,
            patient_name: newApt.patientName,
            phone: newApt.phone,
            dentist: newApt.dentist,
            date: newApt.date,
            time: newApt.time,
            treatment: newApt.treatment || newApt.procedure,
            status: newApt.status || 'Pending',
            // Prepend type indicator to notes for persistence workaround
            notes: newApt.type === 'LINE Booking' 
                ? `📱 [LINE] ${newApt.notes || ''}`.trim() 
                : (newApt.type === 'Walk-in' ? `[Walk-in] ${newApt.notes || ''}`.trim() : (newApt.notes || '')),
            queue_status: newApt.queueStatus || 'Waiting'
        };

        await persistAction('appointments',
            () => supabase.from('appointments').insert([dbRecord]),
            'insert', newApt
        );
        addLog({ action: 'create_appointment', module: 'appointments', details: `นัดหมายใหม่: ${newApt.patientName} (${newApt.time})`, severity: 'low' });
        return { success: true, data: newApt };
    };

    const updateAppointment = async (id, updates) => {
        const supabaseUpdates = {};
        if (updates.patientId) supabaseUpdates.patient_id = updates.patientId;
        if (updates.patientName) supabaseUpdates.patient_name = updates.patientName;
        if (updates.status) supabaseUpdates.status = updates.status;
        
        // Handle notes with type prefix workaround
        if (updates.type) {
            supabaseUpdates.notes = updates.type === 'LINE Booking'
                ? `📱 [LINE] ${updates.notes || ''}`.trim()
                : (updates.type === 'Walk-in' ? `[Walk-in] ${updates.notes || ''}`.trim() : (updates.notes || ''));
        } else if (updates.notes !== undefined) {
            supabaseUpdates.notes = updates.notes;
        }

        if (updates.date) supabaseUpdates.date = updates.date;
        if (updates.time) supabaseUpdates.time = updates.time;
        if (updates.treatment) supabaseUpdates.treatment = updates.treatment;
        if (updates.queueNumber) supabaseUpdates.queue_number = updates.queueNumber;
        // if (updates.room) supabaseUpdates.room = updates.room; // Column missing in DB
        if (updates.dentist) supabaseUpdates.dentist = updates.dentist;
        if (updates.phone) supabaseUpdates.phone = updates.phone;
        if (updates.checkInTime) supabaseUpdates.check_in_time = updates.checkInTime;
        if (updates.queueStatus) supabaseUpdates.queue_status = updates.queueStatus;

        if (updates.vitals) {
            const apt = appointments.find(a => a.id === id);
            const pId = updates.patientId || apt?.patientId || apt?.patient_id;
            if (pId) updatePatient(pId, { vitals: updates.vitals });
        }

        await persistAction('appointments',
            () => supabase.from('appointments').update(supabaseUpdates).eq('id', id),
            'update', updates, id
        );

        if (updates.vitals) {
            addLog({ 
                action: 'record_vitals', 
                module: 'clinical', 
                details: `บันทึกข้อมูลก่อนรับบริการ (Vitals): Apt ID ${id}`, 
                severity: 'low' 
            });
        } else {
            addLog({ 
                action: 'update_appointment', 
                module: 'appointments', 
                details: `แก้ไขข้อมูลนัดหมาย: Apt ID ${id}`, 
                severity: 'low' 
            });
        }
    };

    const deleteAppointment = async (id) => {
        await persistAction('appointments',
            () => supabase.from('appointments').delete().eq('id', id),
            'delete', null, id
        );
    };

    const updateQueueStatus = async (id, status, room) => {
        const updateData = { 
            status: (status === 'In Progress' || status === 'Completed') ? status : 'Pending',
            queue_status: status // Update the actual DB column
        };
        
        // We cannot save 'room' to DB yet because the column is missing in Supabase.
        // But we still process it for the optimistic update and broadcast.
        
        await persistAction('appointments',
            () => supabase.from('appointments').update(updateData).eq('id', id),
            'update', { queueStatus: status, room, ...updateData }, id
        );
        addLog({ action: 'update_status', module: 'appointments', details: `เปลี่ยนสถานะบัตรคิว: ${id} เป็น ${status}${room ? ' (Room: ' + room + ')' : ''}`, severity: 'low' });
    };

    // Inventory, Expenses, Invoices (Generic Persist)
    const addInventoryItem = async (item) => {
        const newItem = { ...item, id: generateUUID() };
        // Optimistic local update
        setInventory(prev => [newItem, ...prev]);
        
        await persistAction('inventory', 
            () => {
                const supabaseData = toSupabaseInventory(newItem);
                return supabase.from('inventory').insert([supabaseData]);
            }, 
            'insert', newItem
        );
    };

    const bulkAddInventoryItems = async (items) => {
        const newItems = items.map(item => ({ 
            ...item, 
            id: generateUUID(),
            item_code: item.id // Keep the standard ID as item_code
        }));
        
        // Optimistic local update
        setInventory(prev => [...newItems, ...prev]);
        
        await persistAction('inventory',
            () => {
                const supabaseData = newItems.map(item => toSupabaseInventory(item));
                return supabase.from('inventory').insert(supabaseData);
            },
            'bulk_insert', newItems
        );
    };
    
    const updateInventory = async (id, updates) => {
        await persistAction('inventory', 
            () => {
                const supabaseUpdates = toSupabaseInventory(updates);
                return supabase.from('inventory').update(supabaseUpdates).eq('id', id);
            }, 
            'update', updates, id
        );
    };

    const updateInventoryStock = async (id, amount) => {
        const item = inventory.find(i => i.id === id);
        if (item) {
            const newStock = Math.max(0, (item.stock || 0) + amount);
            await updateInventory(id, { ...item, stock: newStock });
            
            if (amount > 0) {
                addLog({ action: 'restock', module: 'inventory', details: `เพิ่มสต็อก [${item.name}]: +${amount} ${item.unit}`, severity: 'low' });
            } else {
                addLog({ action: 'usage', module: 'inventory', details: `ใช้สต็อก [${item.name}]: ${amount} ${item.unit}`, severity: 'low' });
            }
        }
    };

    const deleteInventoryItem = async (id) => {
        // Optimistic local update
        setInventory(prev => prev.filter(item => item.id !== id));
        
        await persistAction('inventory', 
            () => supabase.from('inventory').delete().eq('id', id), 
            'delete', null, id
        );
    };

    const addInvoice = async (invoice) => {
        const id = generateUUID();
        const newInvoice = { ...invoice, id };
        await persistAction('invoices', 
            () => {
                const supabaseData = toSupabaseInvoice(newInvoice);
                return supabase.from('invoices').insert([supabaseData]);
            }, 
            'insert', newInvoice
        );
        addLog({ action: 'create_invoice', module: 'billing', details: `ออกใบแจ้งหนี้ #${newInvoice.id} ยอด ฿${newInvoice.amount?.toLocaleString()}`, severity: 'low' });
    };

    const addExpense = async (expense) => {
        const id = generateUUID();
        const newExpense = { ...expense, id };
        await persistAction('expenses', () => supabase.from('expenses').insert([newExpense]), 'insert', newExpense);
        addLog({ action: 'create_expense', module: 'expenses', details: `บันทึกค่าใช้จ่าย: ${newExpense.description} ยอด ฿${newExpense.amount?.toLocaleString()}`, severity: 'low' });
    };

    const deleteExpense = async (id) => {
        await persistAction('expenses', () => supabase.from('expenses').delete().eq('id', id), 'delete', null, id);
    };

    const addStaff = async (staffMember) => {
        const newStaff = { 
            ...staffMember, 
            id: staffMember.id || generateUUID(),
            status: staffMember.status || 'active'
        };
        await persistAction('staff', 
            () => {
                const dbRecord = { 
                    id: newStaff.id,
                    ...toSupabaseStaff(newStaff) 
                };
                return supabase.from('staff').insert([dbRecord]);
            }, 
            'insert', newStaff
        );
        addLog({ action: 'add_staff', module: 'staff', details: `เพิ่มพนักงานใหม่: ${newStaff.name}`, severity: 'medium' });
    };

    const updateStaff = async (id, updates) => {
        await persistAction('staff', 
            () => {
                const supabaseUpdates = toSupabaseStaff(updates);
                return supabase.from('staff').update(supabaseUpdates).eq('id', id);
            }, 
            'update', updates, id
        );
    };

    const deleteStaff = async (id) => {
        await persistAction('staff', () => supabase.from('staff').delete().eq('id', id), 'delete', null, id);
        addLog({ action: 'delete_staff', module: 'staff', details: `ลบพนักงาน ID: ${id}`, severity: 'high' });
    };

    const addAttendanceRecord = async (record) => {
        const id = `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newRecord = { ...record, id, timestamp: new Date().toISOString() };
        
        await persistAction('attendance_records', 
            () => supabase.from('attendance_records').insert([toSupabaseAttendance(newRecord)]), 
            'add', newRecord
        );
    };

    // ... continue mapping other actions if needed
    const updateLocation = async (id, room) => {
        await persistAction('appointments', () => supabase.from('appointments').update({ room }).eq('id', id), 'update', { room }, id);
    };

    const clearAllData = async () => {
        const isThai = language === 'TH';
        if (!confirm(isThai ? 'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้' : 'Are you sure you want to clear all data? This action cannot be undone.')) return;
        
        setIsSyncing(true);
        setIsLoading(true);
        
        try {
            // 1. Reset local states IMMEDIATELY for instant UI feedback
            setPatients([]);
            setAppointments([]);
            setInventory([]);
            setInvoices([]);
            setExpenses([]);
            setAttendanceRecords([]);
            setSsoClaims([]);
            setLabOrders([]);
            setLogs([]);

            // 2. Wipe Supabase SEQUENTIALLY to handle foreign key constraints
            // Order is important: Invoices -> Appointments -> Patients
            const tablesToClear = [
                'invoices',
                'lab_orders', 
                'sso_claims', 
                'appointments', 
                'inventory',
                'attendance_records', 
                'expenses',
                'logs',
                'patient_documents',
                'patients'
            ];

            const wipeErrors = [];
            console.log("🚀 Starting System Wipe...");

            for (const table of tablesToClear) {
                try {
                    console.log(`🧹 Clearing table: ${table}...`);
                    // Use a more aggressive filter that matches everything but satisfies PostgREST requirement
                    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    
                    if (error) {
                        console.error(`❌ Error clearing [${table}]:`, error);
                        wipeErrors.push(`${table}: ${error.message}`);
                    } else {
                        console.log(`✅ Table [${table}] cleared successfully`);
                    }
                } catch (e) {
                    console.error(`💥 Critical failure on [${table}]:`, e);
                    wipeErrors.push(`${table}: ${e.message}`);
                }
            }
            
            // 3. Nuclear clear Dexie (Local Database)
            console.log("💾 Clearing local IndexedDB...");
            await Promise.all([
                db.patients.clear(),
                db.appointments.clear(),
                db.inventory.clear(),
                db.invoices.clear(),
                db.attendance_records.clear(),
                db.expenses.clear(),
                db.lab_orders.clear(),
                db.sso_claims.clear(),
                db.sync_metadata.clear(),
                db.logs.clear()
            ]);

            // 4. Clear all storage
            window.localStorage.clear();
            window.sessionStorage.clear();
            
            // Re-set initial language preference to prevent defaulting to something else on reload
            localStorage.setItem('language', isThai ? 'TH' : 'EN');
            
            // 5. Final Report & Refresh
            if (wipeErrors.length > 0) {
                console.error("Wipe completed with errors:", wipeErrors);
                alert(isThai 
                    ? `ล้างข้อมูลบางส่วนล้มเหลว (${wipeErrors.length} ตาราง) \n\nข้อผิดพลาด: ${wipeErrors.join('\n')}\n\nระบบจะทำการเริ่มใหม่เพื่อความปลอดภัย` 
                    : `Partial wipe failed (${wipeErrors.length} tables). \n\nErrors: ${wipeErrors.join('\n')}\n\nSystem will restart.`);
            } else {
                alert(isThai ? 'ล้างข้อมูลสำเร็จ 100% ระบบกำลังเริ่มใหม่' : '100% Wipe successful. System restarting.');
            }

            // FORCE RELOAD to ensure a completely fresh start
            window.location.href = '/';
        } catch (error) {
            console.error("⛔ Critical Wipe Error:", error);
            alert(isThai ? 'เกิดข้อผิดพลาดรุนแรงในการล้างข้อมูล: ' + error.message : 'Critical wipe error: ' + error.message);
            window.location.reload();
        } finally {
            setIsSyncing(false);
            setIsLoading(false);
        }
    };

    const getDailySummary = () => {
        const today = new Date().toISOString().split('T')[0];
        const todaysApts = appointments.filter(a => a.date === today);
        const todaysInvoices = invoices.filter(inv => inv.date === today);
        const totalRevenue = todaysInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        
        return {
            date: today,
            appointmentCount: todaysApts.length,
            completedApts: todaysApts.filter(a => a.status === 'Completed').length,
            totalRevenue,
            paidInvoices: todaysInvoices.filter(inv => inv.status === 'Paid').length,
            pendingInvoices: todaysInvoices.filter(inv => inv.status !== 'Paid').length
        };
    };

    // Treatments & History
    const addTreatment = async (patientId, treatment) => {
        const treatmentWithId = {
            ...treatment,
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'Completed'
        };
        
        // Find patient and update treatments array
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            const updatedTreatments = [...(patient.treatments || []), treatmentWithId];
            await updatePatient(patientId, { treatments: updatedTreatments });
        }
        
        return treatmentWithId;
    };

    // Settings
    const updateSettings = async (updates) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        localStorage.setItem('ciki_settings', JSON.stringify(newSettings));
        
        // Sync to Supabase - using a catch-all 'settings' table or generic kv store
        try {
            await supabase.from('settings').upsert({ id: 'global', data: newSettings });
        } catch (e) {
            console.warn("Failed to sync settings to Supabase:", e);
        }
    };

    // Lab & SSO Claims (Missing in prev chunk)
    const addLabOrder = async (order) => {
        const id = generateUUID();
        const newOrder = { 
            ...order, 
            id,
            orderDate: order.orderDate || order.sent || new Date().toISOString().split('T')[0],
            dueDate: order.dueDate || order.due,
            clinicName: order.clinicName || order.lab,
            items: order.items || order.work
        };
        
        await persistAction('lab_orders', 
            () => {
                const supabaseData = toSupabaseLabOrder(newOrder);
                return supabase.from('lab_orders').insert([supabaseData]);
            }, 
            'insert', newOrder
        );
    };

    const seedLabOrders = async () => {
        // First, check if we have patients. If not, add some demo patients.
        let targetPatients = patients;
        if (patients.length === 0) {
            const demoPatients = [
                { name: 'คุณสมชาย เข็มกลัด', phone: '0812345678', gender: 'Male', age: 45, insuranceType: 'Cash' },
                { name: 'คุณวิไลวรรณ มั่นคง', phone: '0898765432', gender: 'Female', age: 38, insuranceType: 'Social Security' },
                { name: 'เด็กชายก้องภพ พิทักษ์ไทย', phone: '0822223333', gender: 'Male', age: 10, insuranceType: 'Gold Card' }
            ];
            for (const p of demoPatients) {
                await addPatient(p);
            }
            // Refresh patient list
            const updatedPatients = await db.patients.toArray();
            setPatients(updatedPatients);
            targetPatients = updatedPatients;
        }

        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        const demoOrders = [
            {
                patientId: targetPatients[0]?.id,
                patientName: targetPatients[0]?.name,
                lab: 'Hexa Ceram',
                clinicName: 'Hexa Ceram',
                appliance: 'Crown',
                work: 'Zirconia Crown #16',
                items: 'Zirconia Crown #16',
                due: nextWeek,
                dueDate: nextWeek,
                status: 'Sent',
                sent: today,
                orderDate: today
            },
            {
                patientId: targetPatients[1]?.id,
                patientName: targetPatients[1]?.name,
                lab: 'Southern Dental Lab',
                clinicName: 'Southern Dental Lab',
                appliance: 'Denture',
                work: 'Partial Denture (Upper Acrylic)',
                items: 'Partial Denture (Upper Acrylic)',
                due: tomorrow,
                dueDate: tomorrow,
                status: 'Received',
                sent: today,
                orderDate: today
            },
            {
                patientId: targetPatients[2]?.id,
                patientName: targetPatients[2]?.name,
                lab: 'Thai Dent',
                clinicName: 'Thai Dent',
                appliance: 'Retainer',
                work: 'Hawley Retainer (U/L)',
                items: 'Hawley Retainer (U/L)',
                due: today,
                dueDate: today,
                status: 'Sent',
                sent: today,
                orderDate: today
            }
        ];

        for (const order of demoOrders) {
            await addLabOrder(order);
        }
    };

    const updateLabOrder = async (id, updates) => {
        await persistAction('lab_orders', 
            () => {
                if (id && id.toString().startsWith('LAB-')) {
                    console.warn("Skipping Supabase sync for legacy LAB- ID:", id);
                    return { error: null };
                }
                const supabaseUpdates = toSupabaseLabOrder(updates);
                return supabase.from('lab_orders').update(supabaseUpdates).eq('id', id);
            }, 
            'update', updates, id
        );
        addLog({ action: 'update_lab_order', module: 'inventory', details: `อัปเดตสถานะงานแล็บ: ${id} เป็น ${updates.status}`, severity: 'low' });
    };

    const deleteLabOrder = async (id) => {
        await persistAction('lab_orders', 
            () => {
                if (id && id.toString().startsWith('LAB-')) {
                    console.warn("Skipping Supabase delete for legacy LAB- ID:", id);
                    return { error: null };
                }
                return supabase.from('lab_orders').delete().eq('id', id);
            },
            'delete', null, id
        );
        addLog({ action: 'delete_lab_order', module: 'inventory', details: `ลบรายการงานแล็บ: ${id}`, severity: 'medium' });
    };

    const addSSOClaim = async (claim) => {
        const newClaim = { ...claim, id: `SSO-${Date.now()}` };
        await persistAction('sso_claims', () => supabase.from('sso_claims').insert([newClaim]), 'insert', newClaim);
    };

    // --- LOGGING ---
    const addLog = useCallback(async (logData) => {
        const newLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            userEmail: user?.email || 'System',
            userName: staff?.find(s => s.email === user?.email)?.name || (user?.email === 'owner@dental.com' ? 'Owner' : 'Clinic Staff'),
            ip: '192.168.1.' + (Math.floor(Math.random() * 254) + 1), // Simulation for now
            status: 'success',
            severity: 'low',
            ...logData
        };

        setLogs(prev => [newLog, ...prev].slice(0, 1000));
        
        try {
            await db.logs.add(newLog);
            
            // Keep IndexedDB logs limited
            const count = await db.logs.count();
            if (count > 2000) {
                const oldest = await db.logs.orderBy('timestamp').first();
                if (oldest) await db.logs.delete(oldest.id);
            }
        } catch (e) {
            console.error("Dexie Logging Error:", e);
        }
    }, [user, staff]);

    const broadcastAnnouncement = useCallback((type, payload) => {
        const announcement = {
            id: `ANN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type, // 'queue', 'assistant', 'payment'
            payload,
            timestamp: new Date().toISOString()
        };
        
        // Use localStorage as a simple message bus between tabs
        localStorage.setItem('clinic_announcement', JSON.stringify(announcement));
        // Reset after a longer delay to ensure other tab sees it
        setTimeout(() => localStorage.removeItem('clinic_announcement'), 3000);
        
        console.log("📢 Broadcasted:", announcement);
        return announcement;
    }, []);

    const value = useMemo(() => ({
        patients, addPatient, updatePatient, deletePatient, restorePatient, updateToothChart, addTreatment,
        appointments, addAppointment, updateAppointment, deleteAppointment, updateQueueStatus,
        inventory, addInventoryItem, bulkAddInventoryItems, updateInventory, deleteInventoryItem, updateInventoryStock,
        invoices, addInvoice,
        expenses, addExpense, deleteExpense,
        staff, addStaff, updateStaff, deleteStaff,
        attendanceRecords, addAttendanceRecord,
        ssoClaims, addSSOClaim, labOrders, addLabOrder, updateLabOrder, deleteLabOrder, seedLabOrders,
        settings, updateSettings,
        isLoading, isSyncing, lastSyncTime,
        alerts, addAlert: (a) => setAlerts([a, ...alerts]),
        clearAlert: (id) => setAlerts(alerts.filter(a => a.id !== id)),
        updateLocation, getDailySummary, clearAllData, syncData: syncWithSupabase,
        logs, addLog, broadcastAnnouncement
    }), [
        patients, appointments, inventory, invoices, expenses, staff, attendanceRecords, 
        ssoClaims, labOrders, settings, isLoading, isSyncing, lastSyncTime, alerts, 
        logs, syncWithSupabase, addLog, broadcastAnnouncement
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
