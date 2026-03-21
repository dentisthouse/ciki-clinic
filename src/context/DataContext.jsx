import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { generateDemoData } from '../utils/demoGenerator';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    // --- Initial State Loaders (with localStorage) ---
    const loadState = (key, fallback) => {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return fallback;
            const parsed = JSON.parse(stored);
            return parsed !== null ? parsed : fallback;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage`, error);
            return fallback;
        }
    };

    // --- State Definitions ---
    const [patients, setPatients] = useState(() => loadState('ciki_patients', MOCK_PATIENTS));

    const [appointments, setAppointments] = useState(() => loadState('ciki_appointments', [
        { id: 'APT001', date: new Date().toISOString(), time: '09:00', patientId: 'P001', patientName: 'Somchai Jaidee', procedure: 'Checkup', status: 'Confirmed' },
        { id: 'APT002', date: new Date().toISOString(), time: '10:30', patientId: 'P003', patientName: 'Wichai Wittaya', procedure: 'Root Canal', status: 'In Progress' },
        { id: 'APT003', date: new Date().toISOString(), time: '13:30', patientId: 'P004', patientName: 'Araya Alberta', procedure: 'Cleaning', status: 'Confirmed' },
    ]));

    const [inventory, setInventory] = useState(() => loadState('ciki_inventory', [
        { id: 'INV001', name: 'Lidocaine (Anesthetic)', category: 'Medication', stock: 45, unit: 'Vials', reorderPoint: 50, lastRestocked: '2023-10-25' },
        { id: 'INV002', name: 'Exam Gloves (M)', category: 'Consumables', stock: 120, unit: 'Boxes', reorderPoint: 20, lastRestocked: '2023-11-01' },
        { id: 'INV003', name: 'Dental Needles (30G)', category: 'Consumables', stock: 8, unit: 'Boxes', reorderPoint: 10, lastRestocked: '2023-09-15' },
        { id: 'INV004', name: 'Composite Resin (A2)', category: 'Restorative', stock: 15, unit: 'Syringes', reorderPoint: 5, lastRestocked: '2023-10-10' },
        { id: 'INV005', name: 'Impression Material', category: 'Prosthodontics', stock: 12, unit: 'Kits', reorderPoint: 5, lastRestocked: '2023-10-20' },
    ]));

    const [invoices, setInvoices] = useState(() => loadState('ciki_invoices', [
        { id: 'INV-001', date: '2023-11-01', patientId: 'P001', patientName: 'Somchai Jaidee', amount: 1500, status: 'Paid', items: [] },
        { id: 'INV-002', date: '2023-11-02', patientId: 'P003', patientName: 'Wichai Wittaya', amount: 4500, status: 'Pending', items: [] },
    ]));

    const [labOrders, setLabOrders] = useState(() => loadState('ciki_labOrders', [
        { id: 'LAB-501', lab: 'Precise Dental', patientId: 'P001', patientName: 'Somchai J.', work: 'Zirconia Crown', sent: '2023-11-01', due: '2023-11-08', status: 'Sent' },
    ]));

    const [ssoClaims, setSsoClaims] = useState(() => loadState('ciki_ssoClaims', [
        { id: 'SSO-001', patientId: 'P001', patientName: 'Somchai Jaidee', procedure: 'Scaling (Full Mouth)', code: '01', amount: 900, patientPay: 0, status: 'Approved', date: '2023-11-01', approvalCode: 'SSO-APP-8829' },
        { id: 'SSO-002', patientId: 'P003', patientName: 'Wichai Wittaya', procedure: 'Tooth Extraction', code: '02', amount: 900, patientPay: 300, status: 'Pending', date: new Date().toISOString().split('T')[0] },
    ]));

    const [patientImages, setPatientImages] = useState(() => loadState('ciki_patientImages', [
        { id: 'IMG-001', patientId: 'P001', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1000&auto=format&fit=crop', type: 'Panoramic', date: '2023-10-15', notes: 'Routine checkup x-ray' },
        { id: 'IMG-002', patientId: 'P001', url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1000&auto=format&fit=crop', type: 'Periapical (PA)', date: '2023-11-01', notes: 'Root canal investigation #36' },
    ]));

    const [attendanceRecords, setAttendanceRecords] = useState(() => loadState('ciki_attendance', []));
    const [staff, setStaff] = useState(() => loadState('ciki_staff', []));
    const [expenses, setExpenses] = useState(() => loadState('ciki_expenses', []));

    // --- Demo Data Loader ---
    const loadDemoData = () => {
        if (window.confirm("⚠️ Load Demo Data? This will replace your current data with 50+ simulated records.")) {
            const demo = generateDemoData();
            setPatients(demo.patients);
            setAppointments(demo.appointments);
            setInvoices(demo.invoices);
            setInventory(demo.inventory);
            setLabOrders(demo.labOrders);
            if (demo.staff) setStaff(demo.staff);
            if (demo.attendanceRecords) setAttendanceRecords(demo.attendanceRecords);
            alert("✅ Demo data loaded! 50 Patients, Full Schedule, Staff, and Financials generated.");
        }
    };

    // --- Persist State to LocalStorage ---
    useEffect(() => localStorage.setItem('ciki_patients', JSON.stringify(patients)), [patients]);
    useEffect(() => localStorage.setItem('ciki_appointments', JSON.stringify(appointments)), [appointments]);
    useEffect(() => localStorage.setItem('ciki_inventory', JSON.stringify(inventory)), [inventory]);
    useEffect(() => localStorage.setItem('ciki_invoices', JSON.stringify(invoices)), [invoices]);
    useEffect(() => localStorage.setItem('ciki_labOrders', JSON.stringify(labOrders)), [labOrders]);
    useEffect(() => localStorage.setItem('ciki_ssoClaims', JSON.stringify(ssoClaims)), [ssoClaims]);
    useEffect(() => localStorage.setItem('ciki_patientImages', JSON.stringify(patientImages)), [patientImages]);
    useEffect(() => localStorage.setItem('ciki_attendance', JSON.stringify(attendanceRecords)), [attendanceRecords]);
    useEffect(() => localStorage.setItem('ciki_staff', JSON.stringify(staff)), [staff]);
    useEffect(() => localStorage.setItem('ciki_expenses', JSON.stringify(expenses)), [expenses]);

    // --- Actions ---

    // Generic ID Generator
    const generateId = (prefix) => `${prefix}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Patients
    const addPatient = (patient) => {
        const newPatient = {
            ...patient,
            id: generateId('P'),
            status: 'Active',
            medicalHistory: patient.medicalHistory || [],
            toothChart: {},
            treatments: []
        };
        setPatients([newPatient, ...patients]);
        return newPatient;
    };
    const updatePatient = (id, updates) => {
        setPatients(patients.map(p => p.id === id ? { ...p, ...updates } : p));
    };
    const deletePatient = (id) => {
        setPatients(patients.filter(p => p.id !== id));
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
    const addTreatment = (patientId, treatment) => {
        const treatmentWithId = {
            ...treatment,
            id: generateId('TRT'),
            date: new Date().toISOString(),
        };
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
        return treatmentWithId;
    };

    // Appointments
    const addAppointment = (appointment) => {
        // Generate Queue Number (Simple logic for demo: A-01, A-02...)
        const todayStr = new Date().toISOString().split('T')[0];
        const count = appointments.filter(a => a.date.startsWith(todayStr)).length + 1;
        const qNum = `${appointment.type === 'Walk-in' ? 'W' : 'A'}-${String(count).padStart(2, '0')}`;

        const newApt = {
            ...appointment,
            id: generateId('APT'),
            status: 'Pending',
            queueStatus: 'Waiting', // Waiting, In Progress, Completed, Skipped
            queueNumber: qNum
        };
        setAppointments([...appointments, newApt]);
        return newApt;
    };
    const updateAppointment = (id, updates) => {
        setAppointments(appointments.map(a => a.id === id ? { ...a, ...updates } : a));
    };
    const updateQueueStatus = (id, status) => {
        setAppointments(appointments.map(a => {
            if (a.id === id) {
                // If starting queue, update check-in time if not present
                const updates = { queueStatus: status };
                if (status === 'In Progress' && !a.checkInTime) {
                    updates.checkInTime = new Date().toISOString();
                    updates.status = 'In Progress'; // Sync main status
                }
                if (status === 'Completed') {
                    updates.status = 'Completed'; // Sync main status
                }
                return { ...a, ...updates };
            }
            return a;
        }));
    };

    const deleteAppointment = (id) => {
        setAppointments(appointments.filter(a => a.id !== id));
    };

    // Inventory
    const addInventoryItem = (item) => {
        const newItem = { ...item, id: generateId('INV'), stock: parseInt(item.stock), reorderPoint: parseInt(item.reorderPoint) };
        setInventory([...inventory, newItem]);
    };
    const updateInventoryStock = (id, quantityChange) => {
        setInventory(inventory.map(item => {
            if (item.id === id) {
                const newStock = Math.max(0, item.stock + quantityChange);
                return { ...item, stock: newStock, lastRestocked: quantityChange > 0 ? new Date().toISOString().split('T')[0] : item.lastRestocked };
            }
            return item;
        }));
    };
    const updateInventory = (id, updates) => {
        setInventory(inventory.map(i => i.id === id ? { ...i, ...updates } : i));
    };
    const deleteInventoryItem = (id) => {
        setInventory(inventory.filter(i => i.id !== id));
    };

    const deductStockForTreatment = (treatmentName) => {
        const MAPPING = {
            'Composite Filling': 'INV004',
            'Root Canal': 'INV003',
            'Extraction': 'INV001',
            'Checkup': 'INV002',
            'Cleaning': 'INV002'
        };

        const invId = MAPPING[treatmentName] || Object.values(MAPPING).find(id => treatmentName.includes('Filling') && id === 'INV004');

        if (invId) {
            setInventory(prevInv => prevInv.map(item => {
                if (item.id === invId && item.stock > 0) {
                    return { ...item, stock: item.stock - 1 };
                }
                return item;
            }));
        }
    };

    // Invoices
    const addInvoice = (invoice) => {
        const newInv = { ...invoice, id: generateId('INV-'), date: new Date().toISOString().split('T')[0], status: 'Pending' };
        setInvoices([...invoices, newInv]);
    };
    const updateInvoice = (id, updates) => {
        setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    };

    // Lab Orders
    const addLabOrder = (order) => {
        const newOrder = { ...order, id: generateId('LAB') };
        setLabOrders([...labOrders, newOrder]);
    };
    const updateLabOrder = (id, updates) => {
        setLabOrders(labOrders.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    // SSO Claims
    const addSSOClaim = (claim) => {
        const newClaim = {
            ...claim,
            id: generateId('SSO-'),
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };
        setSsoClaims([newClaim, ...ssoClaims]);
        return newClaim;
    };

    const updateSSOClaim = (id, updates) => {
        setSsoClaims(ssoClaims.map(c => c.id === id ? { ...c, ...updates } : c));
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

    // Attendance
    const addAttendanceRecord = (record) => {
        const newRecord = {
            ...record,
            id: generateId('ATT-'),
            timestamp: new Date().toISOString()
        };
        setAttendanceRecords([newRecord, ...attendanceRecords]);
    };

    // Staff
    const addStaff = (member) => {
        setStaff(prev => [...prev, { ...member, id: member.id || generateId('STF-') }]);
    };
    const updateStaff = (id, updates) => {
        setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };
    const deleteStaff = (id) => {
        setStaff(prev => prev.filter(s => s.id !== id));
    };

    // Expenses
    const addExpense = (expense) => {
        setExpenses(prev => [...prev, { ...expense, id: expense.id || generateId('EXP-'), createdAt: new Date().toISOString() }]);
    };
    const updateExpense = (id, updates) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };
    const deleteExpense = (id) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const value = {
        patients, addPatient, updatePatient, deletePatient, updateToothChart, addTreatment,
        appointments, addAppointment, updateAppointment, deleteAppointment, updateQueueStatus,
        inventory, addInventoryItem, updateInventory, deductStockForTreatment,
        invoices, addInvoice, updateInvoice,
        labOrders, addLabOrder, updateLabOrder,
        ssoClaims, addSSOClaim, updateSSOClaim,
        patientImages, addPatientImage,
        attendanceRecords, addAttendanceRecord,
        staff, addStaff, updateStaff, deleteStaff,
        expenses, addExpense, updateExpense, deleteExpense,
        loadDemoData // Expose for use in UI
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
