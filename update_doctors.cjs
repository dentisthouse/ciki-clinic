const fs = require('fs');

// ==== 1. AppointmentModal.jsx ====
const pathA = './src/components/Scheduling/AppointmentModal.jsx';
if (fs.existsSync(pathA)) {
    let content = fs.readFileSync(pathA, 'utf8');

    // Replace default state
    content = content.replace(/dentist: 'หมอทั่วไป',/g, "dentist: 'หมอต้อง',");

    // Replace select options
    const genericOptions = `<option value="หมอทั่วไป">หมอทั่วไป (General)</option>
                                    <option value="หมอเฉพาะทาง">หมอเฉพาะทาง (Specialist)</option>
                                    <option value="หมอจัดฟัน">หมอจัดฟัน (Ortho)</option>`;
    
    const specificOptions = `<option value="หมอบิ๊ก">หมอบิ๊ก (เฉพาะทางฟันคุด)</option>
                                    <option value="หมอต้อง">หมอต้อง (ทั่วไป)</option>
                                    <option value="หมออ้อม">หมออ้อม (จัดฟัน)</option>
                                    <option value="หมอจุ๊บ">หมอจุ๊บ (จัดฟัน)</option>`;
    
    content = content.replace(genericOptions, specificOptions);

    // Replace the default value condition
    content = content.replace(/value=\{formData\.dentist \|\| 'หมอทั่วไป'\}/g, "value={formData.dentist || 'หมอต้อง'}");

    // Replace submit payload fallback
    content = content.replace(/doctor: formData\.dentist \|\| 'หมอทั่วไป'/g, "doctor: formData.dentist || 'หมอต้อง'");

    fs.writeFileSync(pathA, content, 'utf8');
    console.log('Update AppointmentModal.jsx ✅');
}

// ==== 2. WalkInModal.jsx ====
const pathW = './src/components/Scheduling/WalkInModal.jsx';
if (fs.existsSync(pathW)) {
    let content = fs.readFileSync(pathW, 'utf8');

    // Add dentist state
    if (!content.includes('const [dentist, setDentist] = useState')) {
        content = content.replace(
            "const [procedure, setProcedure] = useState('');",
            "const [procedure, setProcedure] = useState('');\n    const [dentist, setDentist] = useState('หมอต้อง');"
        );
    }

    // Include dentist in baseAppointment
    if (!content.includes("dentist: dentist || 'หมอต้อง'")) {
        content = content.replace(
            "procedure: procedure || 'General Checkup',",
            "procedure: procedure || 'General Checkup',\n            dentist: dentist || 'หมอต้อง',"
        );
    }

    // Add Input field into markup
    if (!content.includes('value={dentist}')) {
        const procedureGroupMarker = /<div className="form-group" style=\{\{ marginBottom: '1\.5rem' \}\}>\s*<label className="form-label" style=\{\{ fontWeight: 800 \}\}>\s*\{t\('sch_col_procedure'\) \|\| 'Procedure \/ Treatment'\}\s*<\/label>\s*<input[^>]+>\s*<\/div>/m;
        
        const dropdownHtml = `
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 800 }}>
                            หมอ (Doctor)
                        </label>
                        <select
                            className="form-select"
                            value={dentist}
                            onChange={(e) => setDentist(e.target.value)}
                            style={{ fontSize: '1rem', fontWeight: 600 }}
                        >
                            <option value="หมอบิ๊ก">หมอบิ๊ก (เฉพาะทางฟันคุด)</option>
                            <option value="หมอต้อง">หมอต้อง (ทั่วไป)</option>
                            <option value="หมออ้อม">หมออ้อม (จัดฟัน)</option>
                            <option value="หมอจุ๊บ">หมอจุ๊บ (จัดฟัน)</option>
                        </select>
                    </div>`;

        content = content.replace(procedureGroupMarker, match => match + '\n' + dropdownHtml);
    }

    fs.writeFileSync(pathW, content, 'utf8');
    console.log('Update WalkInModal.jsx ✅');
}

// ==== 3. LinePortal.jsx ====
const pathL = './src/pages/LinePortal.jsx';
if (fs.existsSync(pathL)) {
    let content = fs.readFileSync(pathL, 'utf8');
    
    // Replace logic inside handleBooking
    const oldLogic = `const getDoctorForService = (serviceId) => {\n            if (['braces', 'retainer'].includes(serviceId)) return 'หมอจัดฟัน';\n            if (['veneers', 'extraction'].includes(serviceId)) return 'หมอเฉพาะทาง';\n            return 'หมอทั่วไป';\n        };`;
    
    const newLogic = `const getDoctorForService = (serviceId) => {\n            if (['braces', 'retainer'].includes(serviceId)) return 'หมออ้อม'; // Default Ortho to Dr. Aom\n            if (['veneers', 'extraction'].includes(serviceId)) return 'หมอบิ๊ก'; // Default Extraction to Dr. Big\n            return 'หมอต้อง'; // Default General to Dr. Tong\n        };`;
    
    content = content.replace(oldLogic, newLogic);
    
    fs.writeFileSync(pathL, content, 'utf8');
    console.log('Update LinePortal.jsx ✅');
}
