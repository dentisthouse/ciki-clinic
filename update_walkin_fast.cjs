const fs = require('fs');
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

    // Add Input field into markup by targeting EXACT string
    if (!content.includes('value={dentist}')) {
        const targetString = "onChange={(e) => setProcedure(e.target.value)}\n                        />\n                    </div>";
        
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

        content = content.replace(targetString, match => match + '\n' + dropdownHtml);
    }

    fs.writeFileSync(pathW, content, 'utf8');
    console.log('Update WalkInModal.jsx ✅');
}
