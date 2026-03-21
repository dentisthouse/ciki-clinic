export const generateDemoData = () => {
    const firstNames = ['Somchai', 'Somsak', 'Malee', 'Ratana', 'Prasert', 'Wichai', 'Suchada', 'Nipa', 'Sunisa', 'Thongchai', 'David', 'Sarah', 'Michael', 'Jennifer', 'Robert', 'Lisa', 'William', 'Elizabeth', 'James', 'Mary', 'Siri', 'Anan', 'Pensri', 'Sakda', 'Duangjai'];
    const lastNames = ['Jaidee', 'Rakchart', 'Meepolk', 'Sombat', 'Charoen', 'Saetang', 'Wong', 'Johnson', 'Smith', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson'];
    const procedures = [
        { name: 'Scaling', duration: 30, price: 1200 },
        { name: 'Filling', duration: 45, price: 2500 },
        { name: 'Root Canal', duration: 60, price: 8000 },
        { name: 'Extraction', duration: 30, price: 1500 },
        { name: 'Checkup', duration: 15, price: 500 },
        { name: 'Whitening', duration: 60, price: 5000 },
        { name: 'Crown', duration: 90, price: 12000 },
        { name: 'Bridge', duration: 90, price: 15000 },
        { name: 'Implant', duration: 120, price: 45000 },
        { name: 'Veneer', duration: 60, price: 3500 }
    ];

    const generatePhone = () => `08${Math.floor(Math.random() * 90000000 + 10000000)}`;

    // 1. Generate 50 Patients
    const patients = [];
    const historicalProcedures = [
        { name: 'Scaling', price: 1200 },
        { name: 'Filling', price: 2500, status: 'filled' },
        { name: 'Root Canal', price: 8000, status: 'filled' },
        { name: 'Extraction', price: 1500, status: 'missing' },
        { name: 'Crown', price: 12000, status: 'filled' },
        { name: 'Bridge', price: 15000, status: 'filled' }
    ];

    const surfaceKeys = ['M', 'D', 'O', 'B', 'L'];
    // FDI tooth numbers
    const ALL_FDI_TEETH = [
        18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
        48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
    ];

    for (let i = 0; i < 50; i++) {
        const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lname = lastNames[Math.floor(Math.random() * lastNames.length)];

        // Generate History
        const treatments = [];
        const toothChart = {};
        const numHistory = Math.floor(Math.random() * 5); // 0-4 past treatments

        for (let j = 0; j < numHistory; j++) {
            const proc = historicalProcedures[Math.floor(Math.random() * historicalProcedures.length)];
            const date = new Date();
            date.setFullYear(date.getFullYear() - Math.floor(Math.random() * 3) - 1);
            date.setMonth(Math.floor(Math.random() * 12));

            const tooth = ALL_FDI_TEETH[Math.floor(Math.random() * ALL_FDI_TEETH.length)];

            // Pick 1-2 random surfaces for this treatment
            const numSurfaces = Math.floor(Math.random() * 2) + 1;
            const selectedSurfaces = [];
            for (let s = 0; s < numSurfaces; s++) {
                const surf = surfaceKeys[Math.floor(Math.random() * surfaceKeys.length)];
                if (!selectedSurfaces.includes(surf)) selectedSurfaces.push(surf);
            }

            // Build surfaces object for the treatment
            const treatmentSurfaces = {};
            treatmentSurfaces[tooth] = selectedSurfaces;

            treatments.push({
                id: `HIST-${i}-${j}`,
                date: date.toISOString(),
                procedure: proc.name,
                teeth: [tooth],
                surfaces: treatmentSurfaces,
                price: proc.price,
                dentist: Math.random() > 0.5 ? 'Dr. Thana' : 'Dr. Suda',
                paymentStatus: 'paid',
                status: 'completed',
                note: 'Historical entry'
            });

            if (proc.status) {
                const existingTooth = toothChart[tooth] || { surfaces: {} };
                if (proc.status === 'missing') {
                    toothChart[tooth] = { ...existingTooth, status: 'missing' };
                } else {
                    // Apply the status to the selected surfaces
                    const updatedSurfaces = { ...existingTooth.surfaces };
                    selectedSurfaces.forEach(s => { updatedSurfaces[s] = proc.status; });
                    toothChart[tooth] = { ...existingTooth, surfaces: updatedSurfaces };
                }
            }
        }

        patients.push({
            id: `HN-${1000 + i}`,
            name: `${fname} ${lname}`,
            age: Math.floor(Math.random() * 60) + 5,
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            phone: generatePhone(),
            email: `${fname.toLowerCase()}.${lname.toLowerCase()}@example.com`,
            address: `Bangkok, Thailand`,
            history: Math.random() > 0.7 ? 'Diabetes' : 'None',
            appointments: [],
            treatments: treatments,
            toothChart: toothChart
        });
    }

    // 2. Generate Appointments (Full Schedule for Today)
    const appointments = [];
    const today = new Date();
    today.setHours(9, 0, 0, 0); // Start at 9:00

    let currentTime = new Date(today);
    const endTime = new Date(today);
    endTime.setHours(17, 0, 0, 0); // End at 17:00

    let pIndex = 0;

    while (currentTime < endTime && pIndex < patients.length) {
        const proc = procedures[Math.floor(Math.random() * procedures.length)];
        const patient = patients[pIndex % patients.length];

        // Randomly assign a doctor
        const dentist = Math.random() > 0.5 ? 'Dr. Thana' : 'Dr. Suda';

        const startTime = new Date(currentTime);
        const duration = proc.duration;
        const endTimeSlot = new Date(startTime.getTime() + duration * 60000);

        if (endTimeSlot > endTime) break;

        appointments.push({
            id: `APT-${Date.now()}-${pIndex}`,
            patientId: patient.id,
            patientName: patient.name,
            dentist: dentist,
            date: startTime.toISOString().split('T')[0],
            time: startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            duration: duration,
            treatment: proc.name,
            status: 'Confirmed',
            type: proc.name
        });

        // Add to patient history
        patient.treatments.push({
            id: `TRT-${Date.now()}-${pIndex}`,
            date: startTime.toISOString(),
            procedure: proc.name,
            teeth: [ALL_FDI_TEETH[Math.floor(Math.random() * ALL_FDI_TEETH.length)]],
            price: proc.price,
            dentist: dentist,
            paymentStatus: Math.random() > 0.3 ? 'paid' : 'unpaid'
        });

        // Next slot + buffer
        currentTime = new Date(endTimeSlot.getTime() + 0 * 60000); // No buffer to ensure full
        pIndex++;
    }

    // 3. Generate Invoices
    const invoices = patients.flatMap(p =>
        p.treatments.map(t => ({
            id: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
            patientId: p.id,
            patientName: p.name,
            date: t.date.split('T')[0],
            amount: t.price,
            status: t.paymentStatus === 'paid' ? 'Paid' : 'Pending',
            items: [{ description: t.procedure, amount: t.price }]
        }))
    );

    // 4. Generate Inventory
    const inventory = [
        { id: 1, name: 'Anesthetic', stock: 50, unit: 'vials', minStock: 10, category: 'Medical', price: 500, reorderPoint: 20 },
        { id: 2, name: 'Gloves (M)', stock: 5, unit: 'boxes', minStock: 20, category: 'General', price: 200, reorderPoint: 10 }, // Low stock demo
        { id: 3, name: 'Composite Kit', stock: 12, unit: 'kits', minStock: 5, category: 'Medical', price: 3000, reorderPoint: 5 },
        { id: 4, name: 'Masks', stock: 100, unit: 'boxes', minStock: 20, category: 'General', price: 100, reorderPoint: 20 },
        { id: 5, name: 'Needles', stock: 200, unit: 'pcs', minStock: 50, category: 'Medical', price: 10, reorderPoint: 50 },
        { id: 6, name: 'Impression Material', stock: 8, unit: 'packs', minStock: 5, category: 'Medical', price: 800, reorderPoint: 5 }
    ];

    // 5. Lab Orders
    const labOrders = [
        { id: 'LAB-001', patientName: patients[0].name, type: 'Crown', labName: 'Smile Lab', dateSent: new Date().toISOString().split('T')[0], dateReceived: '', status: 'Sent', cost: 3000 },
        { id: 'LAB-002', patientName: patients[1].name, type: 'Denture', labName: 'Dental Pro', dateSent: new Date().toISOString().split('T')[0], dateReceived: '2026-02-10', status: 'Received', cost: 5000 }
    ];
    // 6. Staff Members
    const staff = [
        { id: 'STF-001', name: 'ทพ.ธนา สมบูรณ์', role: 'dentist', phone: '0891234567', email: 'thana@clinic.com', licenseNumber: 'ท.12345', specialty: 'ทันตกรรมทั่วไป', status: 'active', startDate: '2020-01-15', salary: 80000, schedule: 'จ-ศ 09:00-17:00' },
        { id: 'STF-002', name: 'ทพญ.สุดา ใจดี', role: 'dentist', phone: '0897654321', email: 'suda@clinic.com', licenseNumber: 'ท.23456', specialty: 'ทันตกรรมจัดฟัน', status: 'active', startDate: '2021-03-01', salary: 75000, schedule: 'จ-ศ 09:00-17:00' },
        { id: 'STF-003', name: 'ทพ.วิชัย เก่งมาก', role: 'dentist', phone: '0812345678', email: 'wichai@clinic.com', licenseNumber: 'ท.34567', specialty: 'ศัลยกรรมช่องปาก', status: 'active', startDate: '2022-06-15', salary: 70000, schedule: 'จ,พ,ศ 09:00-17:00' },
        { id: 'STF-004', name: 'สมหญิง แก้วใส', role: 'assistant', phone: '0823456789', email: 'somying@clinic.com', status: 'active', startDate: '2021-05-01', salary: 18000, schedule: 'จ-ศ 08:30-17:30' },
        { id: 'STF-005', name: 'นิภา สุขสันต์', role: 'hygienist', phone: '0834567890', email: 'nipa@clinic.com', licenseNumber: 'ทภ.5678', status: 'active', startDate: '2022-01-10', salary: 22000, schedule: 'จ-ศ 09:00-17:00' },
        { id: 'STF-006', name: 'รัตนา มีทรัพย์', role: 'receptionist', phone: '0845678901', email: 'rattana@clinic.com', status: 'active', startDate: '2023-02-01', salary: 16000, schedule: 'จ-ส 08:00-18:00 (สลับ)' },
        { id: 'STF-007', name: 'ประเสริฐ จันทร์ดี', role: 'admin', phone: '0856789012', email: 'prasert@clinic.com', status: 'active', startDate: '2019-11-01', salary: 35000, schedule: 'จ-ศ 09:00-18:00' },
        { id: 'STF-008', name: 'สุชาดา วงศ์ไพศาล', role: 'assistant', phone: '0867890123', email: 'suchada@clinic.com', status: 'leave', startDate: '2023-08-15', salary: 17000, schedule: 'จ-ศ 08:30-17:30', note: 'ลาคลอด' },
    ];
    // 7. Attendance Records (past 2 months)
    const attendanceRecords = [];
    const activeStaff = staff.filter(s => s.status === 'active');
    const todayDate = new Date();
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
        const day = new Date(todayDate);
        day.setDate(day.getDate() - dayOffset);
        if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends

        activeStaff.forEach(s => {
            if (Math.random() < 0.1) return; // 10% absent

            // Check-in: mostly on time, sometimes late
            const isLate = Math.random() < 0.15;
            const inHour = isLate ? 9 + Math.floor(Math.random() * 2) : 8 + Math.floor(Math.random() * 2);
            const inMin = Math.floor(Math.random() * 60);
            const inTime = new Date(day);
            inTime.setHours(inHour, inMin, 0, 0);
            const lateMins = (inHour * 60 + inMin) - (9 * 60 + 15); // after 09:15 = late

            attendanceRecords.push({
                id: `ATT-${dayOffset}-${s.id}-IN`,
                staffId: s.id,
                name: s.name,
                type: 'IN',
                timestamp: inTime.toISOString(),
                location: { lat: 13.7563 + (Math.random() - 0.5) * 0.001, lng: 100.5018 + (Math.random() - 0.5) * 0.001 },
                distanceFromClinic: Math.floor(Math.random() * 100),
                lateStatus: lateMins > 0 ? 'late' : 'ontime',
                lateMinutes: lateMins > 0 ? lateMins : 0,
            });

            // Check-out
            const hasOT = Math.random() < 0.2;
            const outHour = hasOT ? 17 + Math.floor(Math.random() * 3) : 17;
            const outMin = Math.floor(Math.random() * 60);
            const outTime = new Date(day);
            outTime.setHours(outHour, outMin, 0, 0);
            const otMins = (outHour * 60 + outMin) - (17 * 60);

            attendanceRecords.push({
                id: `ATT-${dayOffset}-${s.id}-OUT`,
                staffId: s.id,
                name: s.name,
                type: 'OUT',
                timestamp: outTime.toISOString(),
                location: { lat: 13.7563 + (Math.random() - 0.5) * 0.001, lng: 100.5018 + (Math.random() - 0.5) * 0.001 },
                distanceFromClinic: Math.floor(Math.random() * 80),
                lateStatus: otMins > 0 ? 'ot' : 'normal',
                lateMinutes: otMins > 0 ? otMins : 0,
            });
        });
    }

    return { patients, appointments, invoices, inventory, labOrders, staff, attendanceRecords };
};
