const fs = require('fs');

const path = './src/pages/Schedule.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add doctorFilter state
if (!content.includes('doctorFilter')) {
    content = content.replace(
        "const [viewMode, setViewMode] = useState('list');",
        "const [viewMode, setViewMode] = useState('list');\n    const [doctorFilter, setDoctorFilter] = useState('All');"
    );
}

// 2. Filter rendering list for Calendar View
content = content.replace(
    /const dayAppointments = appointments\.filter\(apt => isSameDay\(new Date\(apt\.date\), day\)\);/g,
    "const dayAppointments = appointments.filter(apt => (doctorFilter === 'All' || apt.dentist === doctorFilter) && isSameDay(new Date(apt.date), day));"
);

// 3. Filter rendering for List View and Stats
content = content.replace(
    /appointments\.filter\(apt => isSameDay\(new Date\(apt\.date\), new Date\(\)\)\)/g,
    "appointments.filter(apt => (doctorFilter === 'All' || apt.dentist === doctorFilter) && isSameDay(new Date(apt.date), new Date()))"
);

// 4. Inject Dropdown exactly into the header 
// Using precise substring matching to avoid replacing Walk-in buttons or other empty state buttons
if (!content.includes('แพทย์ทั้งหมด (All Doctors)')) {
    const targetButton = '<button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>\n                        <Plus size={18} style={{ marginRight: \\'8px\\' }} />\n                        {t(\\'sch_new_apt\\')}\n                    </button>';
    const dropdownHtml = `
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
                    </div>\n                    `;
    
    // We expect this button to be preceded by the viewMode toggle button
    content = content.replace(
        /<button className="btn btn-primary" onClick=\{\(\) => setIsModalOpen\(true\)\}>\s*<Plus size=\{18\} style=\{\{ marginRight: '8px' \}\} \/>\s*\{t\('sch_new_apt'\)\}\s*<\/button>/g,
        match => dropdownHtml + match
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Schedule.jsx properly updated');
