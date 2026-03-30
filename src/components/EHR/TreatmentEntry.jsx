import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { PenTool } from 'lucide-react';
import HandwritingPad from './HandwritingPad';

// Medical terminology for tooth surfaces
const SURFACE_NAMES = {
    EN: { M: 'Mesial', D: 'Distal', B: 'Buccal', L: 'Lingual', O: 'Occlusal' },
    TH: { M: 'ด้านใกล้กลาง', D: 'ด้านไกลกลาง', B: 'ด้านแก้ม', L: 'ด้านลิ้น', O: 'ด้านบดเคี้ยว' }
};

const TreatmentEntry = ({ selectedTeeth, selectedSurfaces = {}, onAddTreatment }) => {
    const { t, language } = useLanguage();
    const [category, setCategory] = useState('General');
    const [procedure, setProcedure] = useState('');
    const [price, setPrice] = useState(0);
    const [notes, setNotes] = useState('');
    const [showHandwriting, setShowHandwriting] = useState(false);

    // Mock procedure data - In real app, fetch from DB
    const procedures = {
        'General': [
            { id: 'exam', name: 'Oral Examination', nameTh: 'ตรวจสุขภาพช่องปาก', price: 500 },
            { id: 'xray', name: 'X-Ray (Periapical)', nameTh: 'เอกซเรย์ฟิล์มเล็ก', price: 300 },
            { id: 'cleaning', name: 'Scaling & Polishing', nameTh: 'ขูดหินปูนและขัดฟัน', price: 1200 },
        ],
        'Restorative': [
            { id: 'fill_composite_1', name: 'Composite Filling (1 Surface)', nameTh: 'อุดฟันสีเหมือนฟัน (1 ด้าน)', price: 1500 },
            { id: 'fill_composite_2', name: 'Composite Filling (2 Surfaces)', nameTh: 'อุดฟันสีเหมือนฟัน (2 ด้าน)', price: 2000 },
            { id: 'fill_amalgam', name: 'Amalgam Filling', nameTh: 'อุดฟันอมัลกัม', price: 1200 },
        ],
        'Endodontics': [
            { id: 'rct_anterior', name: 'Root Canal (Anterior)', nameTh: 'รักษารากฟันหน้า', price: 6000 },
            { id: 'rct_molar', name: 'Root Canal (Molar)', nameTh: 'รักษารากฟันกราม', price: 9000 },
        ],
        'Surgery': [
            { id: 'extraction_simple', name: 'Simple Extraction', nameTh: 'ถอนฟันธรรมดา', price: 1000 },
            { id: 'extraction_surgical', name: 'Surgical Extraction', nameTh: 'ถอนฟันยาก/ผ่าฟันคุด', price: 3500 },
        ],
        'Prosthetics': [
            { id: 'crown_pfm', name: 'Crown (PFM)', nameTh: 'ครอบฟัน PFM', price: 12000 },
            { id: 'crown_zirconia', name: 'Crown (Zirconia)', nameTh: 'ครอบฟัน Zirconia', price: 18000 },
        ]
    };

    useEffect(() => {
        // Reset procedure when category changes
        setProcedure('');
        setPrice(0);
    }, [category]);

    const handleProcedureChange = (e) => {
        const procId = e.target.value;
        setProcedure(procId);
        const selectedProc = procedures[category].find(p => p.id === procId);
        if (selectedProc) {
            setPrice(selectedProc.price);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const selectedProc = procedures[category].find(p => p.id === procedure);
        if (!selectedProc) return;

        onAddTreatment({
            procedureId: selectedProc.id,
            procedure: language === 'TH' ? selectedProc.nameTh : selectedProc.name,
            teeth: selectedTeeth,
            surfaces: selectedSurfaces,
            price: parseFloat(price),
            notes: notes,
            category: category
        });

        // Reset form but keep category
        setProcedure('');
        setPrice(0);
        setNotes('');
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid var(--neutral-300)',
        marginBottom: '1rem',
        fontSize: '0.9rem'
    };

    // Build descriptive selection text with medical terms
    const buildSelectionText = () => {
        if (selectedTeeth.length === 0) return t('trt_none') || 'None';

        return selectedTeeth.map(toothId => {
            const surfaces = selectedSurfaces[toothId];
            if (surfaces && surfaces.length > 0) {
                const surfaceNames = surfaces.map(s => SURFACE_NAMES[language][s] || s).join(', ');
                return `#${toothId} (${surfaceNames})`;
            }
            return `#${toothId}`;
        }).join('  •  ');
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('trt_category')}</label>
                <select
                    style={inputStyle}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="General">{t('trt_category_general')}</option>
                    <option value="Restorative">{t('trt_category_restorative')}</option>
                    <option value="Endodontics">{t('trt_category_endo')}</option>
                    <option value="Surgery">{t('trt_category_surgery')}</option>
                    <option value="Prosthetics">{t('trt_category_prostho')}</option>
                </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('trt_procedure')}</label>
                <select
                    style={inputStyle}
                    value={procedure}
                    onChange={handleProcedureChange}
                    required
                >
                    <option value="">{t('trt_select_proc')}</option>
                    {procedures[category]?.map(p => (
                        <option key={p.id} value={p.id}>
                            {language === 'TH' ? p.nameTh : p.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('trt_price')}</label>
                <input
                    type="number"
                    style={inputStyle}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    required
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 600 }}>{t('trt_notes')}</label>
                    <button
                        type="button"
                        onClick={() => setShowHandwriting(!showHandwriting)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.3rem 0.6rem', border: 'none', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                            background: showHandwriting ? 'var(--primary-100)' : 'var(--neutral-100)',
                            color: showHandwriting ? 'var(--primary-600)' : 'var(--neutral-500)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <PenTool size={14} />
                        {language === 'TH' ? 'เขียนด้วยมือ' : 'Handwriting'}
                    </button>
                </div>
                <textarea
                    style={{ ...inputStyle, resize: 'vertical' }}
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={language === 'TH' ? 'ด้านผิวฟัน, วัสดุ, บันทึกทางคลินิก...' : 'Surface, materials, clinical notes...'}
                ></textarea>
                {showHandwriting && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <HandwritingPad
                            value={notes}
                            onTextChange={setNotes}
                            language={language}
                            onClose={() => setShowHandwriting(false)}
                        />
                    </div>
                )}
            </div>

            {/* Selection Display with Medical Terms */}
            <div style={{
                marginBottom: '1rem', padding: '1rem',
                background: selectedTeeth.length > 0 ? '#dbeafe' : '#f1f5f9',
                borderRadius: '12px',
                color: selectedTeeth.length > 0 ? '#1e40af' : '#94a3b8',
                fontSize: '0.9rem',
                border: selectedTeeth.length > 0 ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('trt_selected_teeth')}
                </div>
                <div style={{ fontWeight: 500, lineHeight: 1.6 }}>
                    {buildSelectionText()}
                </div>
            </div>

            <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
                disabled={!procedure || selectedTeeth.length === 0}
            >
                {t('trt_btn_add')}
            </button>
        </form>
    );
};

export default TreatmentEntry;
