const fs = require('fs');

const pathA = './src/components/Scheduling/AppointmentModal.jsx';
const pathW = './src/components/Scheduling/WalkInModal.jsx';

// ---- Fix AppointmentModal ----
if (fs.existsSync(pathA)) {
    let content = fs.readFileSync(pathA, 'utf8');

    // Add dentist to initial state
    if (!content.includes("dentist: 'หมอทั่วไป'")) {
        content = content.replace(
            "type: 'General Checkup',",
            "type: 'General Checkup',\n        dentist: 'หมอทั่วไป',"
        );
    }

    // Add Doctor Select Input
    if (!content.includes('value={formData.dentist}')) {
        const doctorSelect = `
                            {/* Doctor */}
                            <div className="form-group">
                                <label className="form-label">
                                    <User size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    หมอ (Doctor)
                                </label>
                                <select
                                    className="form-select"
                                    value={formData.dentist || 'หมอทั่วไป'}
                                    onChange={(e) => setFormData({ ...formData, dentist: e.target.value })}
                                >
                                    <option value="หมอทั่วไป">หมอทั่วไป (General)</option>
                                    <option value="หมอเฉพาะทาง">หมอเฉพาะทาง (Specialist)</option>
                                    <option value="หมอจัดฟัน">หมอจัดฟัน (Ortho)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Duration */}
        `;
        content = content.replace(
            /\{\/\* Duration \*\/\}/,
            doctorSelect
        );
    }
    
    // Replace 'ทันตแพทย์ประจำ' with formData.dentist in LINE/SMS notifications
    content = content.replace(/doctor: 'ทันตแพทย์ประจำ'/g, "doctor: formData.dentist || 'หมอทั่วไป'");

    fs.writeFileSync(pathA, content, 'utf8');
    console.log('AppointmentModal.jsx updated');
}

// ---- Fix WalkInModal ----
if (fs.existsSync(pathW)) {
    let content = fs.readFileSync(pathW, 'utf8');

    // Add dentist to initial state
    if (!content.includes("dentist: 'หมอทั่วไป'")) {
        content = content.replace(
            "treatment: 'Walk-in Consultation',",
            "treatment: 'Walk-in Consultation',\n        dentist: 'หมอทั่วไป',"
        );
    }

    // Add Doctor Select Input
    if (!content.includes('value={formData.dentist}')) {
        const doctorSelectW = `
                        {/* Doctor */}
                        <div className="form-group">
                            <label className="form-label">หมอ (Doctor)</label>
                            <select
                                className="form-select"
                                value={formData.dentist || 'หมอทั่วไป'}
                                onChange={(e) => setFormData({ ...formData, dentist: e.target.value })}
                            >
                                <option value="หมอทั่วไป">หมอทั่วไป (General)</option>
                                <option value="หมอเฉพาะทาง">หมอเฉพาะทาง (Specialist)</option>
                                <option value="หมอจัดฟัน">หมอจัดฟัน (Ortho)</option>
                            </select>
                        </div>
        `;
        // Insert right after the treatment select or duration select
        content = content.replace(
            /\{\/\* Notes \*\/\}/,
            doctorSelectW + '\n                        {/* Notes */}'
        );
    }

    fs.writeFileSync(pathW, content, 'utf8');
    console.log('WalkInModal.jsx updated');
}
