import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { db } from '../db';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    
    // --- APP STATE ---
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
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
            attendance_records: setAttendanceRecords
        };
        const setter = updaters[tableName];
        if (setter) setter(data);
    }, []);

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
            
            return data;
        } catch (err) {
            console.error("Dexie Initial Load Error:", err);
            return null;
        }
    }, []);

    // --- SUPABASE SYNC (Optimized Egress) ---
    const syncWithSupabase = useCallback(async (tableNames) => {
        if (isSyncing) return;
        setIsSyncing(true);
        console.log("🔄 Background Syncing with Supabase...");

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
                    
                    // Normalize data structure if needed
                    let processedData = data;
                    if (tableName === 'patients') {
                        processedData = data.map(p => ({ 
                            ...p, 
                            toothChart: p.tooth_chart || {}, 
                            medicalHistory: p.medical_history || [], 
                            vitals: p.vitals || {}
                        }));
                    } else if (tableName === 'appointments') {
                        processedData = data.map(a => ({ 
                            ...a, 
                            patientId: a.patient_id, 
                            patientName: a.patient_name,
                            procedure: a.treatment,
                        }));
                    }

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
            setIsSyncing(false);
            setIsLoading(false);
        }
    }, [isSyncing, updateLocalState]);

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
                    updateLocalState(table, updatedArray);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(dataChannels);
            };
        }
    }, [user, initFromLocalDB, syncWithSupabase, updateLocalState]);

    // --- CRUD OPERATIONS (OPTIMISTIC & PERSISTENT) ---
    
    const persistAction = async (table, action, method, data, id) => {
        try {
            // Update Local First (Optimistic)
            if (method === 'insert') {
                await db.table(table).add(data);
            } else if (method === 'update') {
                await db.table(table).update(id, data);
            } else if (method === 'delete') {
                await db.table(table).delete(id);
            }
            
            // Reload into state
            const allLocal = await db.table(table).toArray();
            updateLocalState(table, allLocal);

            // Sync to Supabase in background
            const { error } = await action();
            if (error) throw error;
        } catch (err) {
            console.error(`Backend persistence failed for [${table}]`, err);
            // Optionally: queue for later retry if offline
        }
    };

    // Patients
    const addPatient = async (patient) => {
        const id = Date.now().toString();
        const newPatient = { 
            ...patient, 
            id, 
            active: true, 
            registrationDate: new Date().toISOString(),
            toothChart: {}, medicalHistory: [], vitals: {}
        };
        
        await persistAction('patients', 
            () => supabase.from('patients').insert([{
                ...newPatient,
                tooth_chart: {},
                medical_history: [],
                vitals: {}
            }]), 
            'insert', newPatient
        );
    };

    const updatePatient = async (id, updates) => {
        await persistAction('patients',
            () => supabase.from('patients').update(updates).eq('id', id),
            'update', updates, id
        );
    };

    const deletePatient = async (id) => {
        await persistAction('patients',
            () => supabase.from('patients').update({ active: false }).eq('id', id),
            'update', { active: false }, id
        );
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
            branch: newApt.branch,
            status: newApt.status || 'Pending',
            notes: newApt.notes || '',
            queue_number: qNum,
            type: newApt.type || 'Staff Booking'
        };

        await persistAction('appointments',
            () => supabase.from('appointments').insert([dbRecord]),
            'insert', newApt
        );
        return { success: true, data: newApt };
    };

    const updateAppointment = async (id, updates) => {
        const supabaseUpdates = {};
        if (updates.patientId) supabaseUpdates.patient_id = updates.patientId;
        if (updates.patientName) supabaseUpdates.patient_name = updates.patientName;
        if (updates.status) supabaseUpdates.status = updates.status;
        if (updates.notes) supabaseUpdates.notes = updates.notes;
        // ... map other fields
        
        await persistAction('appointments',
            () => supabase.from('appointments').update(supabaseUpdates).eq('id', id),
            'update', updates, id
        );
    };

    const deleteAppointment = async (id) => {
        await persistAction('appointments',
            () => supabase.from('appointments').delete().eq('id', id),
            'delete', null, id
        );
    };

    const updateQueueStatus = async (id, status) => {
        const updateData = { 
            status: (status === 'In Progress' || status === 'Completed') ? status : 'Pending'
        };
        await persistAction('appointments',
            () => supabase.from('appointments').update(updateData).eq('id', id),
            'update', { queueStatus: status, ...updateData }, id
        );
    };

    // Inventory, Expenses, Invoices (Generic Persist)
    const addInventoryItem = async (item) => {
        const newItem = { ...item, id: Date.now() };
        await persistAction('inventory', () => supabase.from('inventory').insert([newItem]), 'insert', newItem);
    };
    
    const updateInventory = async (id, updates) => {
        await persistAction('inventory', () => supabase.from('inventory').update(updates).eq('id', id), 'update', updates, id);
    };

    const addInvoice = async (invoice) => {
        const newInvoice = { ...invoice, id: `INV-${Date.now()}` };
        await persistAction('invoices', () => supabase.from('invoices').insert([newInvoice]), 'insert', newInvoice);
    };

    const addExpense = async (expense) => {
        const newExpense = { ...expense, id: Date.now() };
        await persistAction('expenses', () => supabase.from('expenses').insert([newExpense]), 'insert', newExpense);
    };

    const deleteExpense = async (id) => {
        await persistAction('expenses', () => supabase.from('expenses').delete().eq('id', id), 'delete', null, id);
    };

    // ... continue mapping other actions if needed
    const updateLocation = async (id, room) => {
        await persistAction('appointments', () => supabase.from('appointments').update({ room }).eq('id', id), 'update', { room }, id);
    };

    const clearAllData = async () => {
        await Promise.all([
            db.patients.clear(),
            db.appointments.clear(),
            db.inventory.clear(),
            db.sync_metadata.clear()
        ]);
        setPatients([]);
        setAppointments([]);
        setInventory([]);
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

    // Lab & SSO Claims (Missing in prev chunk)
    const addLabOrder = async (order) => {
        const newOrder = { ...order, id: `LAB-${Date.now()}` };
        await persistAction('lab_orders', () => supabase.from('lab_orders').insert([newOrder]), 'insert', newOrder);
    };

    const addSSOClaim = async (claim) => {
        const newClaim = { ...claim, id: `SSO-${Date.now()}` };
        await persistAction('sso_claims', () => supabase.from('sso_claims').insert([newClaim]), 'insert', newClaim);
    };

    const value = {
        patients, addPatient, updatePatient, deletePatient, restorePatient, updateToothChart, addTreatment,
        appointments, addAppointment, updateAppointment, deleteAppointment, updateQueueStatus,
        inventory, addInventoryItem, updateInventory,
        invoices, addInvoice,
        expenses, addExpense, deleteExpense,
        staff, attendanceRecords, ssoClaims, addSSOClaim, labOrders, addLabOrder,
        isLoading, isSyncing, lastSyncTime,
        alerts, addAlert: (a) => setAlerts([a, ...alerts]),
        clearAlert: (id) => setAlerts(alerts.filter(a => a.id !== id)),
        updateLocation, getDailySummary, clearAllData, syncData: syncWithSupabase
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
