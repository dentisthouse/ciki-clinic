import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { PenTool, Zap, Search } from 'lucide-react';
import HandwritingPad from './HandwritingPad';

const SURFACE_NAMES = {
    EN: { M: 'Mesial', D: 'Distal', B: 'Buccal', L: 'Lingual', O: 'Occlusal' },
    TH: { M: 'ด้านใกล้กลาง', D: 'ด้านไกลกลาง', B: 'ด้านแก้ม', L: 'ด้านลิ้น', O: 'ด้านบดเคี้ยว' }
};

/** หัตถการที่ไม่บังคับเลือกซี่ฟัน (ตรวจ/เอกซเรย์/ขูดหินทั้งปาก ฯลฯ) */
const NO_TEETH_REQUIRED_IDS = new Set([
    'checkup', 'exam', 'xray', 'xray-film', 'xray-pano', 'fluoride', 'cleaning', 'scaling'
]);

const mapSettingsCategoryToGroup = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'restorative') return 'Restorative';
    if (c === 'endodontics') return 'Endodontics';
    if (c === 'surgery') return 'Surgery';
    if (c === 'cosmetic' || c === 'orthodontics') return 'Prosthetics';
    if (c === 'preventive' || c === 'general') return 'General';
    return 'General';
};

const buildCatalogFromSettings = (services) => {
    if (!Array.isArray(services) || services.length === 0) return null;
    const list = services
        .filter((s) => s && s.active !== false)
        .map((s) => {
            const id = s.id || `svc-${s.name?.TH}`;
            const cat = mapSettingsCategoryToGroup(s.category);
            const needsTeeth = !NO_TEETH_REQUIRED_IDS.has(String(id).toLowerCase());
            return {
                id,
                name: s.name?.EN || id,
                nameTh: s.name?.TH || s.name?.EN || id,
                price: Number(s.price) || 0,
                category: cat,
                needsTeeth,
                source: 'settings'
            };
        });
    return list.length ? list : null;
};

const FALLBACK_CATALOG = [
    { id: 'exam', name: 'Oral Examination', nameTh: 'ตรวจสุขภาพช่องปาก', price: 500, category: 'General', needsTeeth: false, source: 'fallback' },
    { id: 'xray', name: 'X-Ray (Periapical)', nameTh: 'เอกซเรย์ฟิล์มเล็ก', price: 300, category: 'General', needsTeeth: false, source: 'fallback' },
    { id: 'cleaning', name: 'Scaling & Polishing', nameTh: 'ขูดหินปูนและขัดฟัน', price: 1200, category: 'General', needsTeeth: false, source: 'fallback' },
    { id: 'fill_composite_1', name: 'Composite Filling (1 Surface)', nameTh: 'อุดฟันสีเหมือนฟัน (1 ด้าน)', price: 1500, category: 'Restorative', needsTeeth: true, source: 'fallback' },
    { id: 'fill_composite_2', name: 'Composite Filling (2 Surfaces)', nameTh: 'อุดฟันสีเหมือนฟัน (2 ด้าน)', price: 2000, category: 'Restorative', needsTeeth: true, source: 'fallback' },
    { id: 'rct_anterior', name: 'Root Canal (Anterior)', nameTh: 'รักษารากฟันหน้า', price: 6000, category: 'Endodontics', needsTeeth: true, source: 'fallback' },
    { id: 'rct_molar', name: 'Root Canal (Molar)', nameTh: 'รักษารากฟันกราม', price: 9000, category: 'Endodontics', needsTeeth: true, source: 'fallback' },
    { id: 'extraction_simple', name: 'Simple Extraction', nameTh: 'ถอนฟันธรรมดา', price: 1000, category: 'Surgery', needsTeeth: true, source: 'fallback' },
    { id: 'extraction_surgical', name: 'Surgical Extraction', nameTh: 'ถอนฟันยาก/ผ่าฟันคุด', price: 3500, category: 'Surgery', needsTeeth: true, source: 'fallback' },
    { id: 'crown_pfm', name: 'Crown (PFM)', nameTh: 'ครอบฟัน PFM', price: 12000, category: 'Prosthetics', needsTeeth: true, source: 'fallback' }
];

const toolToProcedureHint = {
    filled: 'fill_composite_1',
    extracted: 'extraction_simple',
    rootCanal: 'rct_anterior',
    crown: 'crown_pfm',
    scaling: 'cleaning'
};

const TreatmentEntry = ({ selectedTeeth, selectedSurfaces = {}, onAddTreatment, activeTool }) => {
    const { t, language } = useLanguage();
    const { settings } = useData();
    const [procedureId, setProcedureId] = useState('');
    const [price, setPrice] = useState(0);
    const [notes, setNotes] = useState('');
    const [showHandwriting, setShowHandwriting] = useState(false);
    const [search, setSearch] = useState('');
    const [autoNote, setAutoNote] = useState(true);
    const [priceUnlocked, setPriceUnlocked] = useState(false);

    const catalog = useMemo(() => {
        const fromSettings = buildCatalogFromSettings(settings?.services);
        return fromSettings || FALLBACK_CATALOG;
    }, [settings?.services]);

    const byId = useMemo(() => {
        const m = {};
        catalog.forEach((p) => {
            m[p.id] = p;
        });
        return m;
    }, [catalog]);

    const selectedProc = procedureId ? byId[procedureId] : null;
    const needsTeeth = selectedProc ? selectedProc.needsTeeth : true;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return catalog;
        return catalog.filter(
            (p) =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.nameTh && p.nameTh.includes(search.trim())) ||
                String(p.id).toLowerCase().includes(q)
        );
    }, [catalog, search]);

    const quickPicks = useMemo(() => {
        const prefer = ['cleaning', 'checkup', 'fill_composite_1', 'extraction_simple', 'rct_anterior', 'crown_pfm', 'xray-film', 'xray'];
        const out = [];
        for (const id of prefer) {
            if (byId[id]) out.push(byId[id]);
        }
        catalog.forEach((p) => {
            if (out.length >= 10) return;
            if (!out.find((x) => x.id === p.id)) out.push(p);
        });
        return out.slice(0, 10);
    }, [catalog, byId]);

    useEffect(() => {
        if (!activeTool || activeTool === 'planning' || activeTool === 'clear') return;
        const hintId = toolToProcedureHint[activeTool];
        const byHint = hintId ? catalog.find((p) => p.id === hintId) : null;
        const match =
            byHint ||
            (activeTool === 'filled' && catalog.find((p) => p.category === 'Restorative')) ||
            (activeTool === 'extracted' && catalog.find((p) => p.category === 'Surgery')) ||
            (activeTool === 'rootCanal' && catalog.find((p) => p.category === 'Endodontics')) ||
            (activeTool === 'crown' && catalog.find((p) => p.category === 'Prosthetics')) ||
            (activeTool === 'scaling' &&
                catalog.find(
                    (p) =>
                        /clean|scaling/i.test(String(p.id)) ||
                        (p.nameTh && /ขูดหิน|scaling/i.test(p.nameTh))
                )) ||
            catalog[0];
        if (match) {
            setProcedureId(match.id);
            setPrice(match.price);
            setPriceUnlocked(false);
        }
    }, [activeTool, catalog]);

    const buildSelectionText = useCallback(() => {
        if (selectedTeeth.length === 0) return t('trt_none') || 'None';
        return selectedTeeth
            .map((toothId) => {
                const surfaces = selectedSurfaces[toothId];
                if (surfaces && surfaces.length > 0) {
                    const surfaceNames = surfaces.map((s) => SURFACE_NAMES[language]?.[s] || s).join(', ');
                    return `#${toothId} (${surfaceNames})`;
                }
                return `#${toothId}`;
            })
            .join('  •  ');
    }, [selectedTeeth, selectedSurfaces, language, t]);

    const applyProcedure = (p) => {
        setProcedureId(p.id);
        setPrice(p.price);
        setPriceUnlocked(false);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        const proc = byId[procedureId];
        if (!proc) return;
        if (needsTeeth && selectedTeeth.length === 0) return;

        let finalNotes = notes.trim();
        if (autoNote && !finalNotes) {
            const toothLine = buildSelectionText();
            if (toothLine && toothLine !== (t('trt_none') || 'None')) {
                finalNotes = language === 'TH' ? `ซี่ฟัน / ผิว: ${toothLine}` : `Teeth / surfaces: ${toothLine}`;
            }
        }

        onAddTreatment({
            procedureId: proc.id,
            procedure: language === 'TH' ? proc.nameTh : proc.name,
            teeth: selectedTeeth,
            surfaces: selectedSurfaces,
            price: parseFloat(price) || 0,
            notes: finalNotes,
            category: proc.category
        });

        setNotes('');
        setSearch('');
    };

    const canSubmit = procedureId && (!needsTeeth || selectedTeeth.length > 0);

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid var(--neutral-300)',
        marginBottom: '0.75rem',
        fontSize: '0.9rem'
    };

    return (
        <form onSubmit={handleSubmit}>


            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('trt_procedure')}</label>
                <select
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={procedureId}
                    onChange={(e) => {
                        const id = e.target.value;
                        setProcedureId(id);
                        const p = byId[id];
                        if (p) {
                            setPrice(p.price);
                            setPriceUnlocked(false);
                        }
                    }}
                    required
                >
                    <option value="">{t('trt_select_proc')}</option>
                    {filtered.map((p) => (
                        <option key={p.id} value={p.id}>
                            {language === 'TH' ? p.nameTh : p.name} — ฿{p.price?.toLocaleString?.() ?? p.price}
                        </option>
                    ))}
                </select>
            </div>

            {selectedProc && (
                <div
                    style={{
                        marginBottom: '1rem',
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        color: '#475569',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}
                >
                    <span>
                        {needsTeeth
                            ? language === 'TH'
                                ? 'ต้องเลือกซี่ฟันบนแผนภูมิ'
                                : 'Select tooth/teeth on chart'
                            : language === 'TH'
                              ? 'ไม่บังคับเลือกซี่ฟัน'
                              : 'Tooth selection optional'}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--primary-700)' }}>
                        {language === 'TH' ? 'หมวด' : 'Cat.'}: {selectedProc.category}
                    </span>
                </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontWeight: 600 }}>{t('trt_price')}</label>
                    <button
                        type="button"
                        onClick={() => setPriceUnlocked((v) => !v)}
                        style={{
                            fontSize: '0.75rem',
                            border: 'none',
                            background: 'none',
                            color: 'var(--primary-600)',
                            cursor: 'pointer',
                            fontWeight: 700
                        }}
                    >
                        {priceUnlocked ? (language === 'TH' ? 'ล็อกราคา' : 'Lock') : language === 'TH' ? 'แก้ไขราคา' : 'Edit price'}
                    </button>
                </div>
                <input
                    type="number"
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={price}
                    readOnly={!priceUnlocked}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoNote} onChange={(e) => setAutoNote(e.target.checked)} />
                {language === 'TH' ? 'เติมหมายเหตุอัตโนมัติจากซี่ฟัน (ถ้าไม่พิมพ์)' : 'Auto-fill notes from teeth if empty'}
            </label>

            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 600 }}>{t('trt_notes')}</label>
                    <button
                        type="button"
                        onClick={() => setShowHandwriting(!showHandwriting)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.3rem 0.6rem',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
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
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: 0 }}
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                        language === 'TH'
                            ? 'เว้นว่างได้ — ระบบจะใส่ซี่ฟันให้เมื่อติ๊กอัตโนมัติ'
                            : 'Optional — auto tooth list when enabled'
                    }
                />
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

            <div
                style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: selectedTeeth.length > 0 ? '#dbeafe' : '#f1f5f9',
                    borderRadius: '12px',
                    color: selectedTeeth.length > 0 ? '#1e40af' : '#94a3b8',
                    fontSize: '0.9rem',
                    border: selectedTeeth.length > 0 ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                }}
            >
                <div
                    style={{
                        fontWeight: 700,
                        marginBottom: '4px',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                >
                    {t('trt_selected_teeth')}
                </div>
                <div style={{ fontWeight: 500, lineHeight: 1.6 }}>{buildSelectionText()}</div>
            </div>

            <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 700, marginBottom: '8px' }}
                disabled={!canSubmit}
            >
                <Zap size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                {language === 'TH' ? 'เพิ่มลงแผน (ข้อมูลอัตโนมัติ)' : 'Add to plan (auto-filled)'}
            </button>
            {procedureId && needsTeeth && selectedTeeth.length === 0 && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#b45309', textAlign: 'center' }}>
                    {language === 'TH' ? 'เลือกซี่ฟันบนแผนภูมิก่อน หรือเปลี่ยนเป็นหัตถการที่ไม่ต้องระบุซี่' : 'Select teeth on chart, or pick a procedure that does not require teeth.'}
                </p>
            )}
        </form>
    );
};

export default TreatmentEntry;
