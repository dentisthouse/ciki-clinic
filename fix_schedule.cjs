const fs = require('fs');

const path = './src/pages/Schedule.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add doctorFilter state
if (!content.includes('doctorFilter')) {
    content = content.replace(
        "const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'",
        "const [viewMode, setViewMode] = useState('list');\n    const [doctorFilter, setDoctorFilter] = useState('All');"
    );
}

// 2. Filter appointments in renderCalendar list
// Calendar view uses dayAppointments -> which filters from "appointments"
if (!content.includes('const filteredApts = appointments.filter')) {
    content = content.replace(
        "const dayAppointments = appointments.filter(apt => isSameDay(new Date(apt.date), day));",
        "const filteredApts = appointments.filter(apt => doctorFilter === 'All' || apt.dentist === doctorFilter);\n                            const dayAppointments = filteredApts.filter(apt => isSameDay(new Date(apt.date), day));"
    );
}

// 3. Filter appointments in List view
if (!content.includes('const listApts = appointments.filter')) {
    content = content.replace(
        "const sortedAppointments = [...appointments]",
        "const listApts = appointments.filter(apt => doctorFilter === 'All' || apt.dentist === doctorFilter);\n        const sortedAppointments = [...listApts]"
    );
}

// 4. Add the Dropdown to the Header
if (!content.includes('<select value={doctorFilter}')) {
    const headerReplacement = `
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select 
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            style={{ 
                                padding: '0.65rem 1rem', 
                                borderRadius: '12px', 
                                border: '1px solid var(--neutral-200)',
                                background: 'white',
                                fontWeight: 700,
                                color: 'var(--primary-700)',
                                outline: 'none'
                            }}
                        >
                            <option value="All">แพทย์ทั้งหมด (All Doctors)</option>
                            <option value="หมอทั่วไป">หมอทั่วไป (General)</option>
                            <option value="หมอเฉพาะทาง">หมอเฉพาะทาง (Specialist)</option>
                            <option value="หมอจัดฟัน">หมอจัดฟัน (Ortho)</option>
                        </select>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
    `;
    content = content.replace(
        /<button className="btn btn-primary" onClick=\{\(\) => setIsModalOpen\(true\)\}>/g,
        headerReplacement
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Schedule.jsx updated');
