import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, fetchPaginated } from '../supabase';
import { softDelete, restoreSoftDelete, getActiveRecords, insertWithAudit, updateWithAudit } from '../utils/softDelete';
import { parseSupabaseError } from '../utils/errorHandler';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    // Get user from AuthContext to trigger refetch on login
    const { user } = useAuth();

    // --- Initial State Loaders (with localStorage as fallback) ---
    const loadState = (key, fallback) => {
        try {
            const stored = localStorage.getItem(key);
            if (!stored || stored === '[]' || stored === '{}') return fallback;
            const parsed = JSON.parse(stored);
            return parsed !== null ? parsed : fallback;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage`, error);
            return fallback;
        }
    };

    // --- State Definitions ---
    const [patients, setPatients] = useState(() => loadState('ciki_patients', []));
    const [appointments, setAppointments] = useState(() => loadState('ciki_appointments', []));
    const [inventory, setInventory] = useState(() => loadState('ciki_inventory', []));
    const [invoices, setInvoices] = useState(() => loadState('ciki_invoices', []));
    const [labOrders, setLabOrders] = useState(() => loadState('ciki_labOrders', []));
    const [ssoClaims, setSsoClaims] = useState(() => loadState('ciki_ssoClaims', []));
    const [patientImages, setPatientImages] = useState(() => loadState('ciki_patientImages', []));
    const [patientDocuments, setPatientDocuments] = useState(() => loadState('ciki_patientDocuments', []));
    const [attendanceRecords, setAttendanceRecords] = useState(() => loadState('ciki_attendance', []));
    const [staff, setStaff] = useState(() => loadState('ciki_staff', []));
    const [expenses, setExpenses] = useState(() => loadState('ciki_expenses', []));
    const [alerts, setAlerts] = useState(() => loadState('ciki_alerts', []));
    const [isLoading, setIsLoading] = useState(true);

    // --- Supabase Data Sync (Initial Fetch) ---
    useEffect(() => {
        const fetchAllFromSupabase = async () => {
            try {
                setIsLoading(true);
                const tables = [
                    { name: 'patients', stateSet: setPatients },
                    { name: 'appointments', stateSet: setAppointments },
                    { name: 'inventory', stateSet: setInventory },
                    { name: 'invoices', stateSet: setInvoices },
                    { name: 'lab_orders', stateSet: setLabOrders },
                    { name: 'sso_claims', stateSet: setSsoClaims },
                    { name: 'staff', stateSet: setStaff },
                    { name: 'attendance_records', stateSet: setAttendanceRecords },
                    { name: 'expenses', stateSet: setExpenses }
                ];

                // Fetch all in parallel to avoid blocking
                const res = await Promise.allSettled(
                    tables.map(t => supabase.from(t.name).select('*'))
                );

                res.forEach((result, idx) => {
                    const table = tables[idx];
                    if (result.status === 'fulfilled' && !result.value.error && result.value.data) {
                        const data = result.value.data;
                        if (table.name === 'patients') {
                            table.stateSet(data.map(p => ({ 
                                ...p, 
                                toothChart: p.tooth_chart || {}, 
                                medicalHistory: p.medical_history || [], 
                                vitals: p.vitals || {},
                                lastVisit: p.last_visit 
                            })));
                        } else if (table.name === 'lab_orders') {
                            table.stateSet(data.map(l => ({ 
                                ...l, 
                                patientId: l.patient_id, 
                                patientName: l.patient_name, 
                                labName: l.lab_name, 
                                dateSent: l.date_sent, 
                                dateReceived: l.date_received 
                            })));
                        } else {
                            table.stateSet(data);
                        }
                    } else if (result.status === 'rejected' || result.value.error) {
                        console.warn(`Table ${table.name} failed to load, using cache.`);
                    }
                });
            } catch (err) {
                console.error("Supabase sync failed:", err);
            } finally {
                // Critical: always ensure loading stops
                setIsLoading(false);
            }
        };

        fetchAllFromSupabase();

        // --- REAL-TIME SUBSCRIPTIONS ---
        const aptSubscription = supabase
            .channel('appointments-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
                fetchAllFromSupabase(); // Refetch all for simplicity or handle specific payload
            })
            .subscribe();

        const patientSubscription = supabase
            .channel('patients-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
                console.log("Real-time patient update received:", payload);
                fetchAllFromSupabase();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(aptSubscription);
            supabase.removeChannel(patientSubscription);
        };
    }, [user]); // Refetch when user changes (login/logout)

    // --- Persist State to LocalStorage ---
    useEffect(() => localStorage.setItem('ciki_patients', JSON.stringify(patients)), [patients]);
    useEffect(() => localStorage.setItem('ciki_appointments', JSON.stringify(appointments)), [appointments]);
    useEffect(() => localStorage.setItem('ciki_inventory', JSON.stringify(inventory)), [inventory]);
    useEffect(() => localStorage.setItem('ciki_invoices', JSON.stringify(invoices)), [invoices]);
    useEffect(() => localStorage.setItem('ciki_labOrders', JSON.stringify(labOrders)), [labOrders]);
    useEffect(() => localStorage.setItem('ciki_ssoClaims', JSON.stringify(ssoClaims)), [ssoClaims]);
    useEffect(() => localStorage.setItem('ciki_patientImages', JSON.stringify(patientImages)), [patientImages]);
    useEffect(() => localStorage.setItem('ciki_patientDocuments', JSON.stringify(patientDocuments)), [patientDocuments]);
    useEffect(() => localStorage.setItem('ciki_attendance', JSON.stringify(attendanceRecords)), [attendanceRecords]);
    useEffect(() => localStorage.setItem('ciki_staff', JSON.stringify(staff)), [staff]);
    useEffect(() => localStorage.setItem('ciki_expenses', JSON.stringify(expenses)), [expenses]);
    useEffect(() => localStorage.setItem('ciki_alerts', JSON.stringify(alerts)), [alerts]);

    // --- Actions ---

    // Generic ID Generator
    const generateId = (prefix) => `${prefix}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Patients
    const addPatient = async (patient) => {
        // Use crypto.randomUUID() for a standard UUID that Supabase expects
        const newPatientId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : generateId('P');

        const newPatient = {
            ...patient,
            id: newPatientId,
            status: 'Active',
            medicalHistory: patient.medicalHistory || [],
            toothChart: patient.toothChart || {},
            vitals: patient.vitals || {},
            treatments: [],
            lastVisit: null
        };
        
        // Optimistic update
        setPatients([newPatient, ...patients]);

        // Supabase Sync
        const { error } = await supabase.from('patients').insert([{
            id: newPatient.id,
            name: newPatient.name,
            age: parseInt(newPatient.age) || null, // Convert to integer
            gender: newPatient.gender,
            phone: newPatient.phone,
            email: newPatient.email,
            address: newPatient.address,
            medical_history: newPatient.medicalHistory,
            tooth_chart: newPatient.toothChart,
            vitals: newPatient.vitals,
            status: newPatient.status
        }]);

        if (error) {
            console.error("❌ Error adding patient to Supabase:", error);
            // Optionally rollback or alert user
            alert("ไม่สามารถบันทึกข้อมูลคนไข้ลงในระบบได้ กรุณาลองใหม่อีกครั้ง");
            // Rollback optimistic update
            setPatients(prev => prev.filter(p => p.id !== newPatient.id));
            return null;
        }

        console.log("✅ Patient added successfully to Supabase!");
        return newPatient;
    };

    const updatePatient = async (id, updates) => {
        // Optimistic update
        setPatients(patients.map(p => p.id === id ? { ...p, ...updates } : p));

        // Prepare object for Supabase (mapping camelCase to snake_case)
        const supabaseUpdates = {};
        if (updates.name !== undefined) supabaseUpdates.full_name = updates.name;
        if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
        if (updates.email !== undefined) supabaseUpdates.email = updates.email;
        if (updates.address !== undefined) supabaseUpdates.address = updates.address;
        if (updates.age !== undefined) supabaseUpdates.age = updates.age;
        if (updates.gender !== undefined) supabaseUpdates.gender = updates.gender;
        if (updates.idCard !== undefined) supabaseUpdates.id_card = updates.idCard;
        if (updates.medicalHistory !== undefined) supabaseUpdates.medical_history = updates.medicalHistory;
        if (updates.treatments !== undefined) supabaseUpdates.treatments = updates.treatments;
        if (updates.toothChart !== undefined) supabaseUpdates.tooth_chart = updates.toothChart;
        if (updates.insurance !== undefined) supabaseUpdates.insurance = updates.insurance;
        if (updates.insuranceType !== undefined) supabaseUpdates.insurance_type = updates.insuranceType;
        if (updates.lastVisit !== undefined) supabaseUpdates.last_visit = updates.lastVisit;
        
        // Only include complex fields if specifically provided
        if (updates.treatmentPlans !== undefined) supabaseUpdates.treatment_plans = updates.treatmentPlans;
        if (updates.orthoPlans !== undefined) supabaseUpdates.ortho_plans = updates.orthoPlans;
        if (updates.photos !== undefined) supabaseUpdates.photos = updates.photos;
        if (updates.vitals !== undefined) supabaseUpdates.vitals = updates.vitals;

        const { error } = await supabase.from('patients').update(supabaseUpdates).eq('id', id);
        if (error) {
            console.error("❌ Error updating patient in Supabase:", error);
            alert(`ไม่สามารถอัปเดตข้อมูลไฟล์คนไข้ได้\nรหัส Error: ${error.code}\nรายละเอียด: ${error.message}\n(ตรวจสอบว่าคอลัมน์ใน DB ครบถ้วนหรือไม่)`);
        }
    };

    const deletePatient = async (id, userId = null) => {
        if (!window.confirm("ต้องการลบข้อมูลคนไข้รายนี้หรือไม่? (ข้อมูลจะถูกย้ายไปถังขยะและสามารถกู้คืนได้ภายใน 30 วัน)")) return;
        
        try {
            // Use soft delete instead of hard delete
            await softDelete('patients', id, userId);
            
            // Optimistic update - remove from current list
            setPatients(patients.filter(p => p.id !== id));
            
            return true;
        } catch (error) {
            console.error("❌ Error soft-deleting patient:", error);
            const parsedError = parseSupabaseError(error);
            alert(parsedError?.message || "ไม่สามารถลบข้อมูลคนไข้ได้ กรุณาลองใหม่อีกครั้ง");
            return false;
        }
    };

    // Restore soft-deleted patient
    const restorePatient = async (id, userId = null) => {
        try {
            await restoreSoftDelete('patients', id, userId);
            
            // Refetch to restore to list
            const { data } = await supabase.from('patients').select('*').eq('id', id).single();
            if (data) {
                setPatients(prev => [...prev, {
                    ...data,
                    toothChart: data.tooth_chart || {},
                    medicalHistory: data.medical_history || [],
                    vitals: data.vitals || {},
                    lastVisit: data.last_visit
                }]);
            }
            
            return true;
        } catch (error) {
            console.error("❌ Error restoring patient:", error);
            alert("ไม่สามารถกู้คืนข้อมูลคนไข้ได้");
            return false;
        }
    };

    // Tooth Chart
    const updateToothChart = (patientId, toothId, status) => {
        setPatients(patients.map(p => {
            if (p.id === patientId) {
                const newToothChart = { ...p.toothChart };
                if (status === 'healthy' || !status) {
                    delete newToothChart[toothId]; // Remove entry if healthy
                } else {
                    newToothChart[toothId] = status;
                }
                return { ...p, toothChart: newToothChart };
            }
            return p;
        }));
    };

    // Add Treatment to Patient
    const addTreatment = async (patientId, treatment) => {
        const treatmentWithId = {
            ...treatment,
            id: generateId('TRT'),
            date: new Date().toISOString(),
        };
        
        // Update local state (keep array for now)
        setPatients(patients.map(p => {
            if (p.id === patientId) {
                return {
                    ...p,
                    treatments: [...(p.treatments || []), treatmentWithId],
                    lastVisit: new Date().toISOString().split('T')[0]
                };
            }
            return p;
        }));

        // Supabase Sync to separate table
        const { error } = await supabase.from('treatments').insert([{
            id: treatmentWithId.id,
            patient_id: patientId,
            date: treatmentWithId.date,
            procedure: treatmentWithId.procedure,
            teeth: treatmentWithId.teeth,
            surfaces: treatmentWithId.surfaces,
            price: treatmentWithId.price,
            dentist: treatmentWithId.dentist,
            payment_status: treatmentWithId.paymentStatus || 'unpaid',
            status: treatmentWithId.status || 'completed',
            note: treatmentWithId.note
        }]);

        if (error) {
            console.error("Error adding treatment to Supabase:", error);
        } else {
            // Success -> Deduct Stock
            deductStockForTreatment(treatmentWithId.procedure);
        }
        return treatmentWithId;
    };

    // Appointments
    const addAppointment = async (appointment) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const count = appointments.filter(a => a.date.startsWith(todayStr)).length + 1;
        const qNum = `${appointment.type === 'Walk-in' ? 'W' : 'A'}-${String(count).padStart(2, '0')}`;

        // Create standard UUID for Supabase compatibility
        const newAptId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : generateId('APT');

        const newApt = {
            ...appointment,
            id: newAptId,
            status: 'Pending',
            queueStatus: 'Waiting',
            queueNumber: qNum,
            type: appointment.type || 'Staff Appointment' // Default to Staff if from admin
        };
        setAppointments([...appointments, newApt]);

        // Supabase Sync - Map to exact schema provided (no duration, type, queue_number, or queue_status)
        const { error } = await supabase.from('appointments').insert([{
            id: newApt.id,
            patient_id: newApt.patientId,
            patient_name: newApt.patientName,
            phone: newApt.phone,
            dentist: newApt.dentist,
            date: newApt.date,
            time: newApt.time,
            treatment: newApt.treatment,
            branch: newApt.branch,
            status: newApt.status || 'Pending',
            notes: newApt.notes || ''
        }]);

        if (error) {
            console.error("❌ Error adding appointment to Supabase:", error);
            // Optionally tell the user so we can debug RLS/Schema issues
            alert(`🔥 Supabase Error: ${error.message} (Code: ${error.code})`);
            return { success: false, error };
        }

        console.log("✅ Appointment saved to Supabase!");
        return { success: true, data: newApt };
    };

    const updateAppointment = async (id, updates) => {
        setAppointments(appointments.map(a => a.id === id ? { ...a, ...updates } : a));

        const supabaseUpdates = {};
        if (updates.patientId) supabaseUpdates.patient_id = updates.patientId;
        if (updates.patientName) supabaseUpdates.patient_name = updates.patientName;
        if (updates.phone) supabaseUpdates.phone = updates.phone;
        if (updates.dentist) supabaseUpdates.dentist = updates.dentist;
        if (updates.date) supabaseUpdates.date = updates.date;
        if (updates.time) supabaseUpdates.time = updates.time;
        if (updates.treatment) supabaseUpdates.treatment = updates.treatment;
        if (updates.status) supabaseUpdates.status = updates.status;
        if (updates.branch) supabaseUpdates.branch = updates.branch;
        if (updates.notes) supabaseUpdates.notes = updates.notes;

        const { error } = await supabase.from('appointments').update(supabaseUpdates).eq('id', id);
        if (error) console.error("Error updating appointment in Supabase:", error);
    };

    const updateQueueStatus = async (id, status) => {
        setAppointments(appointments.map(a => {
            if (a.id === id) {
                return { ...a, queueStatus: status, status: (status === 'In Progress' || status === 'Completed') ? status : 'Pending' };
            }
            return a;
        }));

        const updateData = { 
            status: (status === 'In Progress' || status === 'Completed') ? status : 'Pending'
        };

        const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
        if (error) console.error("Error updating queue status in Supabase:", error);
    };

    const updateLocation = async (id, room) => {
        setAppointments(appointments.map(a => a.id === id ? { ...a, room } : a));
        const { error } = await supabase.from('appointments').update({ room }).eq('id', id);
        if (error) console.error("Error updating room location:", error);
    };

    const addAlert = (alert) => {
        const newAlert = { ...alert, id: Date.now(), time: new Date().toLocaleTimeString('th-TH'), status: 'active' };
        setAlerts([newAlert, ...alerts]);
        // Play notification sound logic can go here
    };

    const clearAlert = (id) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    const deleteAppointment = async (id) => {
        setAppointments(appointments.filter(a => a.id !== id));
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) console.error("Error deleting appointment from Supabase:", error);
    };

    // Inventory
    const addInventoryItem = async (item) => {
        const newItem = { ...item, id: generateId('INV'), stock: parseInt(item.stock), reorderPoint: parseInt(item.reorderPoint) };
        setInventory([...inventory, newItem]);

        const { error } = await supabase.from('inventory').insert([{
            id: newItem.id,
            name: newItem.name,
            stock: newItem.stock,
            unit: newItem.unit,
            min_stock: parseInt(newItem.minStock) || 5,
            category: newItem.category,
            price: newItem.price,
            reorder_point: newItem.reorderPoint
        }]);
        if (error) console.error("Error adding inventory to Supabase:", error);
    };

    const updateInventoryStock = async (id, quantityChange) => {
        let newStockVal = 0;
        setInventory(inventory.map(item => {
            if (item.id === id) {
                newStockVal = Math.max(0, item.stock + quantityChange);
                return { ...item, stock: newStockVal, lastRestocked: quantityChange > 0 ? new Date().toISOString().split('T')[0] : item.lastRestocked };
            }
            return item;
        }));

        const { error } = await supabase.from('inventory').update({ 
            stock: newStockVal,
            last_restocked: quantityChange > 0 ? new Date().toISOString().split('T')[0] : undefined
        }).eq('id', id);
        if (error) console.error("Error updating inventory stock in Supabase:", error);
    };

    const updateInventory = async (id, updates) => {
        setInventory(inventory.map(i => i.id === id ? { ...i, ...updates } : i));
        
        const supabaseUpdates = { ...updates };
        if (updates.minStock) { supabaseUpdates.min_stock = updates.minStock; delete supabaseUpdates.minStock; }
        if (updates.reorderPoint) { supabaseUpdates.reorder_point = updates.reorderPoint; delete supabaseUpdates.reorderPoint; }
        
        const { error } = await supabase.from('inventory').update(supabaseUpdates).eq('id', id);
        if (error) console.error("Error updating inventory in Supabase:", error);
    };

    const deleteInventoryItem = async (id) => {
        setInventory(inventory.filter(i => i.id !== id));
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) console.error("Error deleting inventory from Supabase:", error);
    };

    const deductStockForTreatment = async (treatmentName) => {
        const MAPPING = {
            'Composite Filling': 'INV004',
            'Root Canal': 'INV003',
            'Extraction': 'INV001',
            'Checkup': 'INV002',
            'Cleaning': 'INV002',
            'Scaling': 'INV002'
        };

        const invId = MAPPING[treatmentName] || Object.values(MAPPING).find(id => treatmentName.toLowerCase().includes('filling') && id === 'INV004');

        if (invId) {
            // Try to find the item in local state to get current stock
            const item = inventory.find(i => i.id === invId);
            if (item && item.stock > 0) {
                await updateInventoryStock(invId, -1);
            }
        }
    };

    // Invoices
    const addInvoice = async (invoice) => {
        const newInv = { ...invoice, id: generateId('INV-'), date: new Date().toISOString().split('T')[0], status: 'Pending' };
        setInvoices([...invoices, newInv]);

        const { error } = await supabase.from('invoices').insert([{
            id: newInv.id,
            patient_id: newInv.patientId,
            patient_name: newInv.patientName,
            date: newInv.date,
            amount: newInv.amount,
            status: newInv.status,
            items: newInv.items
        }]);
        if (error) console.error("Error adding invoice to Supabase:", error);
    };

    const updateInvoice = async (id, updates) => {
        setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
        const { error } = await supabase.from('invoices').update(updates).eq('id', id);
        if (error) console.error("Error updating invoice in Supabase:", error);
    };

    // Lab Orders
    const addLabOrder = async (order) => {
        const newOrder = { ...order, id: generateId('LAB') };
        setLabOrders([...labOrders, newOrder]);

        const { error } = await supabase.from('lab_orders').insert([{
            id: newOrder.id,
            patient_id: newOrder.patientId,
            patient_name: newOrder.patientName,
            type: newOrder.type,
            lab_name: newOrder.labName,
            date_sent: newOrder.dateSent,
            status: newOrder.status || 'Sent',
            cost: newOrder.cost
        }]);
        if (error) console.error("Error adding lab order to Supabase:", error);
    };

    const updateLabOrder = async (id, updates) => {
        setLabOrders(labOrders.map(o => o.id === id ? { ...o, ...updates } : o));
        
        const supabaseUpdates = { ...updates };
        if (updates.labName) { supabaseUpdates.lab_name = updates.labName; delete supabaseUpdates.labName; }
        if (updates.dateSent) { supabaseUpdates.date_sent = updates.dateSent; delete supabaseUpdates.dateSent; }
        if (updates.dateReceived) { supabaseUpdates.date_received = updates.dateReceived; delete supabaseUpdates.dateReceived; }

        const { error } = await supabase.from('lab_orders').update(supabaseUpdates).eq('id', id);
        if (error) console.error("Error updating lab order in Supabase:", error);
    };

    // SSO Claims
    const addSSOClaim = async (claim) => {
        const newClaim = {
            ...claim,
            id: generateId('SSO-'),
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };
        setSsoClaims([newClaim, ...ssoClaims]);

        const { error } = await supabase.from('sso_claims').insert([{
            id: newClaim.id,
            patient_id: newClaim.patientId,
            patient_name: newClaim.patientName,
            date: newClaim.date,
            amount: newClaim.amount,
            status: newClaim.status
        }]);
        if (error) console.error("Error adding SSO claim to Supabase:", error);
        return newClaim;
    };

    const updateSSOClaim = async (id, updates) => {
        setSsoClaims(ssoClaims.map(c => c.id === id ? { ...c, ...updates } : c));
        const { error } = await supabase.from('sso_claims').update(updates).eq('id', id);
        if (error) console.error("Error updating SSO claim in Supabase:", error);
    };

    // Patient Images (PACS)
    const addPatientImage = (image) => {
        const newImage = {
            ...image,
            id: generateId('IMG-'),
            date: new Date().toISOString().split('T')[0]
        };
        setPatientImages([newImage, ...patientImages]);
    };

    const addPatientDocument = (doc) => {
        const newDoc = {
            ...doc,
            id: generateId('DOC-'),
            date: new Date().toISOString().split('T')[0]
        };
        setPatientDocuments([newDoc, ...patientDocuments]);
    };

    const deletePatientDocument = (id) => {
        setPatientDocuments(prev => prev.filter(doc => doc.id !== id));
    };

    // Attendance
    const addAttendanceRecord = async (record) => {
        const newRecord = {
            ...record,
            id: generateId('ATT-'),
            timestamp: new Date().toISOString()
        };
        setAttendanceRecords([newRecord, ...attendanceRecords]);

        const { error } = await supabase.from('attendance_records').insert([{
            id: newRecord.id,
            staff_id: newRecord.staffId,
            name: newRecord.name,
            type: newRecord.type,
            timestamp: newRecord.timestamp,
            location: newRecord.location,
            distance_from_clinic: newRecord.distanceFromClinic,
            late_status: newRecord.lateStatus,
            late_minutes: newRecord.lateMinutes
        }]);
        if (error) console.error("Error adding attendance to Supabase:", error);
    };

    // Staff
    const addStaff = async (member) => {
        const newStaff = { ...member, id: member.id || generateId('STF-') };
        setStaff(prev => [...prev, newStaff]);

        const { error } = await supabase.from('staff').insert([{
            id: newStaff.id,
            name: newStaff.name,
            role: newStaff.role,
            phone: newStaff.phone,
            email: newStaff.email,
            license_number: newStaff.licenseNumber,
            specialty: newStaff.specialty,
            status: newStaff.status,
            start_date: newStaff.startDate,
            salary: newStaff.salary,
            schedule: newStaff.schedule,
            note: newStaff.note
        }]);
        if (error) console.error("Error adding staff to Supabase:", error);
    };

    const updateStaff = async (id, updates) => {
        setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

        const supabaseUpdates = { ...updates };
        if (updates.licenseNumber) { supabaseUpdates.license_number = updates.licenseNumber; delete supabaseUpdates.licenseNumber; }
        if (updates.startDate) { supabaseUpdates.start_date = updates.startDate; delete supabaseUpdates.startDate; }

        const { error } = await supabase.from('staff').update(supabaseUpdates).eq('id', id);
        if (error) console.error("Error updating staff in Supabase:", error);
    };

    const deleteStaff = async (id) => {
        setStaff(prev => prev.filter(s => s.id !== id));
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) console.error("Error deleting staff from Supabase:", error);
    };

    // Expenses
    const addExpense = async (expense) => {
        const newExp = { ...expense, id: expense.id || generateId('EXP-'), createdAt: new Date().toISOString() };
        setExpenses(prev => [...prev, newExp]);

        const { error } = await supabase.from('expenses').insert([{
            id: newExp.id,
            category: newExp.category,
            amount: newExp.amount,
            description: newExp.description,
            date: newExp.date,
            status: newExp.status || 'Approved'
        }]);
        if (error) console.error("Error adding expense to Supabase:", error);
    };

    const updateExpense = async (id, updates) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        const { error } = await supabase.from('expenses').update(updates).eq('id', id);
        if (error) console.error("Error updating expense in Supabase:", error);
    };

    const deleteExpense = async (id) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) console.error("Error deleting expense from Supabase:", error);
    };

    const clearAllData = async () => {
        if (!window.confirm("ARE YOU SURE? This will delete ALL patients, appointments, and records permanently!")) return;

        try {
            setIsLoading(true);
            const tables = [
                'patients', 'appointments', 'inventory', 'invoices', 
                'lab_orders', 'sso_claims', 'staff', 'attendance_records', 'expenses', 'treatments'
            ];

            for (const table of tables) {
                // Delete all rows where id is not null (effectively all rows)
                const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) console.warn(`Could not clear table ${table}:`, error.message);
            }

            // Clear LocalState
            setPatients([]);
            setAppointments([]);
            setInventory([]);
            setInvoices([]);
            setLabOrders([]);
            setSsoClaims([]);
            setStaff([]);
            setAttendanceRecords([]);
            setExpenses([]);
            
            // Clear LocalStorage
            localStorage.clear();
            
            alert("Data cleared successfully. The app is ready for fresh use.");
            window.location.reload();
        } catch (err) {
            console.error("Failed to clear data:", err);
            alert("Failed to clear some tables. Check console or RLS settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const getDailySummary = () => {
        const today = new Date().toISOString().split('T')[0];
        const todaysApts = appointments.filter(a => a.date === today);
        const todaysInvoices = invoices.filter(inv => inv.date === today);
        const totalRevenue = todaysInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const paidCount = todaysInvoices.filter(inv => inv.status === 'Paid').length;
        
        return {
            date: today,
            appointmentCount: todaysApts.length,
            completedApts: todaysApts.filter(a => a.status === 'Completed').length,
            totalRevenue,
            paidInvoices: paidCount,
            pendingInvoices: todaysInvoices.length - paidCount
        };
    };

    const value = {
        patients, addPatient, updatePatient, deletePatient, restorePatient, updateToothChart, addTreatment,
        appointments, addAppointment, updateAppointment, deleteAppointment, updateQueueStatus,
        inventory, addInventoryItem, updateInventory, deductStockForTreatment,
        invoices, addInvoice, updateInvoice,
        labOrders, addLabOrder, updateLabOrder,
        ssoClaims, addSSOClaim, updateSSOClaim,
        patientImages, addPatientImage,
        patientDocuments, addPatientDocument, deletePatientDocument,
        attendanceRecords, addAttendanceRecord,
        staff, addStaff, updateStaff, deleteStaff,
        expenses, addExpense, updateExpense, deleteExpense,
        alerts, addAlert, clearAlert, updateLocation,
        getDailySummary, clearAllData, isLoading // Expose for use in UI
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
