import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    // Patients
    const [patients, setPatients] = useState([]);
    const [patientImages, setPatientImages] = useState([]);
    const [patientDocuments, setPatientDocuments] = useState([]);

    // Appointments & Scheduling
    const [appointments, setAppointments] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // Medical Records & History
    const [labOrders, setLabOrders] = useState([]);

    // Inventory
    const [inventory, setInventory] = useState([]);

    // Finance
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [ssoClaims, setSsoClaims] = useState([]);

    // Human Resources
    const [staff, setStaff] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    // App State
    const [isLoading, setIsLoading] = useState(true);

    // --- REFRESH LOGIC ---
    const fetchAllFromSupabase = useCallback(async () => {
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
                    } else if (table.name === 'appointments') {
                        table.stateSet(data.map(a => ({ 
                            ...a, 
                            patientId: a.patient_id, 
                            patientName: a.patient_name,
                            procedure: a.treatment,
                            dentist: a.dentist,
                            dentistName: a.dentist
                        })));
                    } else {
                        table.stateSet(data);
                    }
                } else if (result.status === 'rejected' || (result.value && result.value.error)) {
                    console.warn(`Table ${table.name} failed to load.`);
                }
            });
        } catch (err) {
            console.error("Supabase sync failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchAllFromSupabase();

            // --- REAL-TIME SUBSCRIPTIONS ---
            const aptSubscription = supabase
                .channel('appointments-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
                    console.log("Real-time update:", payload);
                    fetchAllFromSupabase();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(aptSubscription);
            };
        }
    }, [user, fetchAllFromSupabase]);

    // Initial Load - Patients
    const addPatient = async (patient) => {
        const newPatient = { ...patient, id: Date.now().toString(), active: true, registrationDate: new Date().toISOString() };
        setPatients([...patients, newPatient]);
        const { error } = await supabase.from('patients').insert([newPatient]);
        if (error) console.error("Error adding patient:", error);
    };

    const updatePatient = async (id, updates) => {
        setPatients(patients.map(p => p.id === id ? { ...p, ...updates } : p));
        const { error } = await supabase.from('patients').update(updates).eq('id', id);
        if (error) console.error("Error updating patient:", error);
    };

    const deletePatient = async (id) => {
        setPatients(patients.map(p => p.id === id ? { ...p, active: false } : p));
        const { error } = await supabase.from('patients').update({ active: false }).eq('id', id);
        if (error) console.error("Error deleting patient:", error);
    };

    const restorePatient = async (id) => {
        setPatients(patients.map(p => p.id === id ? { ...p, active: true } : p));
        const { error } = await supabase.from('patients').update({ active: true }).eq('id', id);
        if (error) console.error("Error restoring patient:", error);
    };

    const updateToothChart = async (patientId, chartData) => {
        setPatients(patients.map(p => p.id === patientId ? { ...p, toothChart: chartData } : p));
        const { error } = await supabase.from('patients').update({ tooth_chart: chartData }).eq('id', patientId);
        if (error) console.error("Error updating tooth chart:", error);
    };

    const addTreatment = (patientId, treatment) => {
        const treatmentWithId = {
            ...treatment,
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'Completed'
        };
        
        setPatients(patients.map(p => {
            if (p.id === patientId) {
                const treatments = p.treatments || [];
                return { ...p, treatments: [...treatments, treatmentWithId] };
            }
            return p;
        }));
        
        return treatmentWithId;
    };

    // Appointments
    const addAppointment = async (appointment) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const count = appointments.filter(a => a.date.startsWith(todayStr)).length + 1;
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

        setAppointments([...appointments, newApt]);

        const { error } = await supabase.from('appointments').insert([{
            id: newApt.id,
            patient_id: newApt.patientId,
            patient_name: newApt.patientName,
            phone: newApt.phone,
            dentist: newApt.dentist,
            date: newApt.date,
            time: newApt.time,
            treatment: newApt.treatment || newApt.procedure,
            branch: newApt.branch,
            status: newApt.status || 'Pending',
            notes: newApt.notes || ''
        }]);

        if (error) {
            console.error("Supabase insert error:", error);
            alert(`⚠️ บันทึกลงฐานข้อมูลไม่สำเร็จ: ${error.message}`);
            return { success: false, error };
        }

        console.log("✅ Appointment saved to Supabase!", newApt.id);
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
        if (updates.treatment || updates.procedure) supabaseUpdates.treatment = updates.treatment || updates.procedure;
        if (updates.status) supabaseUpdates.status = updates.status;
        if (updates.branch) supabaseUpdates.branch = updates.branch;
        if (updates.notes) supabaseUpdates.notes = updates.notes;

        const { error } = await supabase.from('appointments').update(supabaseUpdates).eq('id', id);
        if (error) console.error("Error updating appointment in Supabase:", error);
    };

    const deleteAppointment = async (id) => {
        setAppointments(appointments.filter(a => a.id !== id));
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) console.error("Error deleting appointment:", error);
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

    // Inventory
    const addInventoryItem = async (item) => {
        const newItem = { ...item, id: Date.now() };
        setInventory([...inventory, newItem]);
        const { error } = await supabase.from('inventory').insert([newItem]);
        if (error) console.error("Error adding inventory:", error);
    };

    const updateInventory = async (id, updates) => {
        setInventory(inventory.map(item => item.id === id ? { ...item, ...updates } : item));
        const { error } = await supabase.from('inventory').update(updates).eq('id', id);
        if (error) console.error("Error updating inventory:", error);
    };

    const deductStockForTreatment = (items) => {
        setInventory(inventory.map(item => {
            const usage = items.find(i => i.id === item.id);
            if (usage) {
                return { ...item, stock: Math.max(0, item.stock - usage.quantity) };
            }
            return item;
        }));
    };

    // Finance
    const addInvoice = async (invoice) => {
        const newInvoice = { ...invoice, id: `INV-${Date.now()}` };
        setInvoices([...invoices, newInvoice]);
        const { error } = await supabase.from('invoices').insert([newInvoice]);
        if (error) console.error("Error adding invoice:", error);
    };

    const updateInvoice = async (id, updates) => {
        setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
        const { error } = await supabase.from('invoices').update(updates).eq('id', id);
        if (error) console.error("Error updating invoice:", error);
    };

    // SSO
    const addSSOClaim = async (claim) => {
        const newClaim = { ...claim, id: `SSO-${Date.now()}` };
        setSsoClaims([...ssoClaims, newClaim]);
        const { error } = await supabase.from('sso_claims').insert([newClaim]);
        if (error) console.error("Error adding SSO claim:", error);
    };

    const updateSSOClaim = async (id, updates) => {
        setSsoClaims(ssoClaims.map(c => c.id === id ? { ...c, ...updates } : c));
        const { error } = await supabase.from('sso_claims').update(updates).eq('id', id);
        if (error) console.error("Error updating SSO claim:", error);
    };

    // Lab
    const addLabOrder = async (order) => {
        const newOrder = { ...order, id: `LAB-${Date.now()}` };
        setLabOrders([...labOrders, newOrder]);
        const { error } = await supabase.from('lab_orders').insert([newOrder]);
        if (error) console.error("Error adding lab order:", error);
    };

    const updateLabOrder = async (id, updates) => {
        setLabOrders(labOrders.map(o => o.id === id ? { ...o, ...updates } : o));
        const { error } = await supabase.from('lab_orders').update(updates).eq('id', id);
        if (error) console.error("Error updating lab order:", error);
    };

    // Staff & Attendance
    const addStaff = async (member) => {
        const newMember = { ...member, id: Date.now() };
        setStaff([...staff, newMember]);
        const { error } = await supabase.from('staff').insert([newMember]);
        if (error) console.error("Error adding staff:", error);
    };

    const updateStaff = async (id, updates) => {
        setStaff(staff.map(s => s.id === id ? { ...s, ...updates } : s));
        const { error } = await supabase.from('staff').update(updates).eq('id', id);
        if (error) console.error("Error updating staff:", error);
    };

    const deleteStaff = async (id) => {
        setStaff(staff.filter(s => s.id !== id));
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) console.error("Error deleting staff:", error);
    };

    const addAttendanceRecord = async (record) => {
        const newRecord = { ...record, id: Date.now() };
        setAttendanceRecords([...attendanceRecords, newRecord]);
        const { error } = await supabase.from('attendance_records').insert([newRecord]);
        if (error) console.error("Error adding attendance:", error);
    };

    // Expenses
    const addExpense = async (expense) => {
        const newExpense = { ...expense, id: Date.now() };
        setExpenses([...expenses, newExpense]);
        const { error } = await supabase.from('expenses').insert([newExpense]);
        if (error) console.error("Error adding expense:", error);
    };

    const updateExpense = async (id, updates) => {
        setExpenses(expenses.map(e => e.id === id ? { ...e, ...updates } : e));
        const { error } = await supabase.from('expenses').update(updates).eq('id', id);
        if (error) console.error("Error updating expense:", error);
    };

    const deleteExpense = async (id) => {
        setExpenses(expenses.filter(e => e.id !== id));
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) console.error("Error deleting expense:", error);
    };

    // Alerts
    const addAlert = (alert) => {
        const newAlert = { ...alert, id: Date.now(), time: new Date().toLocaleTimeString('th-TH'), status: 'active' };
        setAlerts([newAlert, ...alerts]);
    };

    const clearAlert = (id) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    // Resources
    const [patientImagesList, setPatientImagesList] = useState([]);
    const addPatientImage = (image) => {
        const newImg = { ...image, id: Date.now() };
        setPatientImagesList([...patientImagesList, newImg]);
    };

    const addPatientDocument = (doc) => {
        const newDoc = { ...doc, id: Date.now() };
        setPatientDocuments([...patientDocuments, newDoc]);
    };

    const deletePatientDocument = (id) => {
        setPatientDocuments(patientDocuments.filter(d => d.id !== id));
    };

    const clearAllData = () => {
        setPatients([]);
        setAppointments([]);
        setInventory([]);
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
        getDailySummary, clearAllData, isLoading, syncData: fetchAllFromSupabase
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
