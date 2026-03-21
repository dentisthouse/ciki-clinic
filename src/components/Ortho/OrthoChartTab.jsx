import React, { useState, useRef, useEffect } from 'react';
import { Save, RotateCcw, Zap, Clipboard, Circle, CheckCircle } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const STATUS_CONFIG = {
    normal: { color: '#cbd5e1', fill: '#f8fafc', label: 'Normal', labelTH: 'ปกติ', icon: '🦷', bg: '#f1f5f9' },
    bonded: { color: '#0d9488', fill: '#ccfbf1', label: 'Bonded', labelTH: 'ติดเหล็ก', icon: '🔲', bg: '#ccfbf1' },
    banded: { color: '#6366f1', fill: '#e0e7ff', label: 'Banded', labelTH: 'ใส่แหวน', icon: '💍', bg: '#e0e7ff' },
    extracted: { color: '#ef4444', fill: '#fee2e2', label: 'Extracted', labelTH: 'ถอนแล้ว', icon: '❌', bg: '#fee2e2' },
    impacted: { color: '#f59e0b', fill: '#fef3c7', label: 'Impacted', labelTH: 'ฟันคุด', icon: '⚠️', bg: '#fef3c7' },
};

const INITIAL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH].map(num => ({
    id: num, status: 'normal',
}));

// ── Single Tooth SVG ───────────────────────────────────────────────────
const ToothSVG = ({ tooth, isUpper, isSelected, onClick }) => {
    const cfg = STATUS_CONFIG[tooth.status];
    const isAnterior = [13, 12, 11, 21, 22, 23, 43, 42, 41, 31, 32, 33].includes(tooth.id);
    const isMolar = [18, 17, 16, 28, 27, 26, 48, 47, 46, 38, 37, 36].includes(tooth.id);
    const w = isMolar ? 36 : isAnterior ? 24 : 28;
    const h = isMolar ? 38 : isAnterior ? 44 : 36;

    return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
            {/* Glow effect */}
            {isSelected && (
                <rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} rx={12}
                    fill="none" stroke="#0d9488" strokeWidth={1} opacity={0.3}
                    style={{ filter: 'blur(3px)' }}
                />
            )}


            {/* Crown shape */}
            <rect
                x={-w / 2} y={-h / 2} width={w} height={h}
                rx={isMolar ? 5 : 7}
                fill={tooth.status !== 'normal' ? cfg.fill : 'white'}
                stroke={isSelected ? '#0d9488' : tooth.status !== 'normal' ? cfg.color : '#e2e8f0'}
                strokeWidth={isSelected ? 2 : 1.2}
            />

            {/* Root lines */}
            {isUpper && (
                <>
                    <line x1={-2} y1={h / 2} x2={-2} y2={h / 2 + 10} stroke="#e2e8f0" strokeWidth={1} strokeLinecap="round" />
                    {isMolar && <line x1={3} y1={h / 2} x2={3} y2={h / 2 + 8} stroke="#e2e8f0" strokeWidth={1} strokeLinecap="round" />}
                </>
            )}
            {!isUpper && (
                <>
                    <line x1={-2} y1={-h / 2} x2={-2} y2={-h / 2 - 10} stroke="#e2e8f0" strokeWidth={1} strokeLinecap="round" />
                    {isMolar && <line x1={3} y1={-h / 2} x2={3} y2={-h / 2 - 8} stroke="#e2e8f0" strokeWidth={1} strokeLinecap="round" />}
                </>
            )}

            {/* Bracket (bonded) */}
            {tooth.status === 'bonded' && (
                <g>
                    <rect x={-5} y={-3.5} width={10} height={7} rx={1.5}
                        fill="#0d9488" stroke="#0f766e" strokeWidth={0.5} />
                    <line x1={-w / 2 + 2} y1={0} x2={w / 2 - 2} y2={0}
                        stroke="#0f766e" strokeWidth={1.2} />
                </g>
            )}

            {/* Band ring (banded) */}
            {tooth.status === 'banded' && (
                <rect x={-w / 2 + 1.5} y={-4} width={w - 3} height={8} rx={2}
                    fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="3 2" />
            )}

            {/* X mark (extracted) */}
            {tooth.status === 'extracted' && (
                <g opacity={0.7}>
                    <line x1={-7} y1={-7} x2={7} y2={7} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={7} y1={-7} x2={-7} y2={7} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
                </g>
            )}

            {/* Triangle (impacted) */}
            {tooth.status === 'impacted' && (
                <polygon points="-5,4 5,4 0,-5" fill="#f59e0b" stroke="#d97706" strokeWidth={0.8} />
            )}

            {/* Tooth number */}
            <text y={isUpper ? -h / 2 - 6 : h / 2 + 12}
                textAnchor="middle" fontSize="9" fontWeight="600"
                fill={tooth.status !== 'normal' ? cfg.color : '#94a3b8'}
                fontFamily="var(--font-sans)"
            >
                {tooth.id}
            </text>
        </g>
    );
};

// ── Popover ────────────────────────────────────────────────────────────
const StatusPopover = ({ pos, toothId, onSelect, onClose, language }) => {
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    return (
        <div ref={ref} style={{
            position: 'fixed', top: pos.y, left: pos.x, zIndex: 9999,
            background: 'white', borderRadius: '14px', padding: '6px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
            minWidth: '190px', animation: 'popIn 0.18s ease-out',
        }}>
            <div style={{ padding: '8px 12px 6px', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {language === 'TH' ? `ซี่ #${toothId}` : `Tooth #${toothId}`}
            </div>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => onSelect(key)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '9px 12px', border: 'none', background: 'transparent',
                    borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem',
                    fontWeight: 500, color: '#334155', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = cfg.bg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <span style={{ width: '24px', textAlign: 'center', fontSize: '0.95rem' }}>{cfg.icon}</span>
                    <span>{language === 'TH' ? cfg.labelTH : cfg.label}</span>
                    <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: cfg.color }} />
                </button>
            ))}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────
const OrthoChartTab = ({ patient, language, onUpdate }) => {
    const [teeth, setTeeth] = useState(patient?.orthoTeeth || INITIAL_TEETH);
    const [selectedId, setSelectedId] = useState(null);
    const [popPos, setPopPos] = useState(null);
    const [phase, setPhase] = useState(patient?.orthoPhase || 'Leveling');
    const [upperWire, setUpperWire] = useState(patient?.orthoUpperWire || { type: '', size: '' });
    const [lowerWire, setLowerWire] = useState(patient?.orthoLowerWire || { type: '', size: '' });
    const [elastics, setElastics] = useState(patient?.orthoElastics || '');
    const [notes, setNotes] = useState(patient?.orthoNotes || '');

    const phases = [
        { id: 'Leveling', label: language === 'TH' ? 'เรียงฟัน' : 'Leveling', emoji: '📐' },
        { id: 'Space Closure', label: language === 'TH' ? 'ปิดช่องว่าง' : 'Space Closure', emoji: '🔗' },
        { id: 'Finishing', label: language === 'TH' ? 'เก็บรายละเอียด' : 'Finishing', emoji: '✨' },
        { id: 'Retention', label: language === 'TH' ? 'รีเทนเนอร์' : 'Retention', emoji: '🛡️' },
    ];
    const phaseIdx = phases.findIndex(p => p.id === phase);

    const handleToothClick = (id, e) => {
        const r = e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : e.target.getBoundingClientRect();
        setSelectedId(id);
        setPopPos({ x: Math.min(r.left + r.width / 2, window.innerWidth - 210), y: r.top + r.height + 8 });
    };

    const handleSelect = (status) => {
        setTeeth(prev => prev.map(t => t.id === selectedId ? { ...t, status } : t));
        setSelectedId(null); setPopPos(null);
    };

    const handleSave = () => {
        if (onUpdate) onUpdate(patient.id, {
            orthoTeeth: teeth, orthoPhase: phase,
            orthoUpperWire: upperWire, orthoLowerWire: lowerWire,
            orthoElastics: elastics, orthoNotes: notes,
            lastOrthoVisit: new Date().toISOString(),
        });
        alert(language === 'TH' ? 'บันทึกข้อมูลจัดฟันเรียบร้อย ✅' : 'Ortho data saved ✅');
    };

    const bondedC = teeth.filter(t => t.status === 'bonded').length;
    const bandedC = teeth.filter(t => t.status === 'banded').length;
    const extractC = teeth.filter(t => t.status === 'extracted').length;
    const impactC = teeth.filter(t => t.status === 'impacted').length;
    const spacing = 44;
    const svgW = 16 * spacing + 40;

    return (
        <div className="animate-slide-up">

            {/* ── Phase Progress ────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
                borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.5rem',
                color: 'white', position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', position: 'relative' }}>
                    <Zap size={18} />
                    <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
                        {language === 'TH' ? 'ระยะการรักษา' : 'Treatment Phase'}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
                    {phases.map((p, i) => (
                        <button key={p.id} onClick={() => setPhase(p.id)} style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            padding: '12px 8px', border: 'none', cursor: 'pointer',
                            borderRadius: '12px', transition: 'all 0.3s', fontFamily: 'var(--font-sans)',
                            background: i === phaseIdx ? 'rgba(255,255,255,0.25)' : i < phaseIdx ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                            color: 'white', backdropFilter: 'blur(4px)',
                        }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: i <= phaseIdx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                                fontSize: '0.95rem', transition: 'all 0.3s',
                                boxShadow: i === phaseIdx ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
                            }}>
                                {i < phaseIdx ? <CheckCircle size={16} /> : p.emoji}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: i === phaseIdx ? 700 : 400, opacity: i <= phaseIdx ? 1 : 0.5 }}>
                                {p.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Progress bar */}
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.7)',
                        width: `${((phaseIdx + 1) / phases.length) * 100}%`,
                        transition: 'width 0.5s ease',
                    }} />
                </div>
            </div>

            {/* ── Stats Pills ──────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { label: language === 'TH' ? 'ติดเหล็ก' : 'Bonded', n: bondedC, color: '#0d9488', bg: 'linear-gradient(135deg, #ccfbf1, #f0fdfa)' },
                    { label: language === 'TH' ? 'ใส่แหวน' : 'Banded', n: bandedC, color: '#6366f1', bg: 'linear-gradient(135deg, #e0e7ff, #eef2ff)' },
                    { label: language === 'TH' ? 'ถอนแล้ว' : 'Extracted', n: extractC, color: '#ef4444', bg: 'linear-gradient(135deg, #fee2e2, #fef2f2)' },
                    { label: language === 'TH' ? 'ฟันคุด' : 'Impacted', n: impactC, color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7, #fefce8)' },
                ].map(s => (
                    <div key={s.label} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '24px',
                        background: s.bg, border: `1px solid ${s.color}22`,
                        fontSize: '0.8rem', fontWeight: 600, color: s.color,
                        boxShadow: `0 2px 8px ${s.color}10`,
                    }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{s.n}</span>
                        {s.label}
                    </div>
                ))}
            </div>

            {/* ── SVG Tooth Chart ──────────────────────────────── */}
            <div style={{
                borderRadius: '20px', padding: '1.75rem 1rem 1rem',
                marginBottom: '1.5rem', overflow: 'auto',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 40%, #ffffff 60%, #f8fafc 100%)',
                border: '1px solid var(--neutral-100)',
                boxShadow: 'var(--shadow-sm)',
            }}>
                <svg viewBox={`0 0 ${svgW} 240`} width="100%" style={{ maxHeight: '300px' }}>
                    {/* Midline */}
                    <line x1={svgW / 2} y1={10} x2={svgW / 2} y2={230}
                        stroke="#e2e8f0" strokeWidth={1} strokeDasharray="6 4" />

                    {/* Arch labels with background */}
                    <rect x={svgW / 2 - 55} y={2} width={110} height={18} rx={9} fill="#f1f5f9" />
                    <text x={svgW / 2} y={14} textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8"
                        fontFamily="var(--font-display)" letterSpacing="0.1em">
                        {language === 'TH' ? '▲ ขากรรไกรบน' : '▲ UPPER ARCH'}
                    </text>

                    <rect x={svgW / 2 - 55} y={223} width={110} height={18} rx={9} fill="#f1f5f9" />
                    <text x={svgW / 2} y={235} textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8"
                        fontFamily="var(--font-display)" letterSpacing="0.1em">
                        {language === 'TH' ? '▼ ขากรรไกรล่าง' : '▼ LOWER ARCH'}
                    </text>

                    {/* Wire lines */}
                    {upperWire.type && (
                        <line x1={20} y1={55} x2={svgW - 20} y2={55}
                            stroke="#0d9488" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.35} />
                    )}
                    {lowerWire.type && (
                        <line x1={20} y1={175} x2={svgW - 20} y2={175}
                            stroke="#0d9488" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.35} />
                    )}

                    {/* Upper teeth */}
                    {UPPER_TEETH.map((num, i) => {
                        const td = teeth.find(t => t.id === num);
                        return td ? (
                            <g key={num} transform={`translate(${20 + i * spacing + spacing / 2}, 55)`}>
                                <ToothSVG tooth={td} isUpper={true} isSelected={selectedId === num}
                                    onClick={(e) => handleToothClick(num, e)} />
                            </g>
                        ) : null;
                    })}

                    {/* Lower teeth */}
                    {LOWER_TEETH.map((num, i) => {
                        const td = teeth.find(t => t.id === num);
                        return td ? (
                            <g key={num} transform={`translate(${20 + i * spacing + spacing / 2}, 175)`}>
                                <ToothSVG tooth={td} isUpper={false} isSelected={selectedId === num}
                                    onClick={(e) => handleToothClick(num, e)} />
                            </g>
                        ) : null;
                    })}
                </svg>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'normal').map(([key, cfg]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94a3b8' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: cfg.color }} />
                            {language === 'TH' ? cfg.labelTH : cfg.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Popover */}
            {selectedId !== null && popPos && (
                <StatusPopover pos={popPos} toothId={selectedId} language={language}
                    onSelect={handleSelect} onClose={() => { setSelectedId(null); setPopPos(null); }}
                />
            )}

            {/* ── Wire & Details Cards ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

                {/* Wire Card */}
                <div style={{
                    borderRadius: '16px', border: '1px solid var(--neutral-100)',
                    background: 'white', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
                        borderBottom: '1px solid #ccfbf1',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        <span style={{ fontSize: '1rem' }}>🔩</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f766e', fontFamily: 'var(--font-display)' }}>
                            {language === 'TH' ? 'ลวดจัดฟัน' : 'Arch Wires'}
                        </span>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { label: language === 'TH' ? 'ลวดบน' : 'Upper Wire', emoji: '⬆️', val: upperWire, set: setUpperWire },
                            { label: language === 'TH' ? 'ลวดล่าง' : 'Lower Wire', emoji: '⬇️', val: lowerWire, set: setLowerWire },
                        ].map(w => (
                            <div key={w.label}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '6px' }}>
                                    {w.emoji} {w.label}
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select value={w.val.type || ''} onChange={e => w.set({ ...w.val, type: e.target.value })}
                                        style={{ ...selectStyle }}>
                                        <option value="">{language === 'TH' ? 'ชนิดลวด' : 'Type'}</option>
                                        <option value="Niti">Niti</option>
                                        <option value="SS">Stainless Steel</option>
                                        <option value="TMA">TMA (Beta-Ti)</option>
                                        <option value="Braided">Braided</option>
                                    </select>
                                    <select value={w.val.size || ''} onChange={e => w.set({ ...w.val, size: e.target.value })}
                                        style={{ ...selectStyle }}>
                                        <option value="">{language === 'TH' ? 'เบอร์' : 'Size'}</option>
                                        <option>.012</option><option>.014</option>
                                        <option>.016</option><option>.018</option>
                                        <option>.016x.022</option><option>.017x.025</option><option>.019x.025</option>
                                    </select>
                                </div>
                                {w.val.type && w.val.size && (
                                    <div style={{
                                        marginTop: '6px', fontSize: '0.72rem', fontWeight: 700,
                                        color: '#0f766e', background: '#f0fdfa',
                                        borderRadius: '8px', padding: '4px 10px', display: 'inline-flex',
                                        alignItems: 'center', gap: '4px', border: '1px solid #ccfbf1',
                                    }}>
                                        ✓ {w.val.type} {w.val.size}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details Card */}
                <div style={{
                    borderRadius: '16px', border: '1px solid var(--neutral-100)',
                    background: 'white', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        <Clipboard size={16} color="#475569" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', fontFamily: 'var(--font-display)' }}>
                            {language === 'TH' ? 'รายละเอียดเพิ่มเติม' : 'Clinical Details'}
                        </span>
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={labelSm}>{language === 'TH' ? 'ยางดึง (Elastics)' : 'Elastics Configuration'}</label>
                            <input type="text" value={elastics} onChange={e => setElastics(e.target.value)}
                                placeholder={language === 'TH' ? 'เช่น Class II 3/16 Heavy' : 'e.g. Class II 3/16 Heavy'}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={labelSm}>{language === 'TH' ? 'บันทึกอาการ' : 'Clinical Notes'}</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder={language === 'TH' ? 'ระบุรายละเอียดเพิ่มเติม...' : 'Add clinical notes...'}
                                style={{ ...inputStyle, flex: 1, minHeight: '70px', resize: 'vertical' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action Bar ───────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderRadius: '14px',
                background: 'var(--neutral-50)', border: '1px solid var(--neutral-100)',
            }}>
                <button onClick={() => { if (window.confirm(language === 'TH' ? 'ล้างข้อมูลทั้งหมด?' : 'Reset all?')) setTeeth(INITIAL_TEETH); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 18px', border: '1px solid #fecaca',
                        borderRadius: '10px', cursor: 'pointer', background: '#fff5f5',
                        color: '#dc2626', fontSize: '0.85rem', fontWeight: 600,
                        fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <RotateCcw size={15} />
                    {language === 'TH' ? 'ล้างข้อมูล' : 'Reset'}
                </button>

                <button onClick={handleSave} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 28px', border: 'none', borderRadius: '12px',
                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                    color: 'white', transition: 'all 0.25s',
                    boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(13,148,136,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.3)'; }}
                >
                    <Save size={16} />
                    {language === 'TH' ? 'บันทึกข้อมูลจัดฟัน' : 'Save Ortho Chart'}
                </button>
            </div>

            <style>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.9) translateY(-4px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

// ── Shared Styles ──────────────────────────────────────────────────────
const selectStyle = {
    flex: 1, padding: '9px 12px', borderRadius: '10px',
    border: '1px solid #e2e8f0', outline: 'none',
    fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
    color: '#334155', background: '#f8fafc',
    cursor: 'pointer', transition: 'border-color 0.2s',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: '30px',
};

const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '10px',
    border: '1px solid #e2e8f0', outline: 'none',
    fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
    color: '#334155', background: '#f8fafc',
    transition: 'border-color 0.2s',
};

const labelSm = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: '#64748b', marginBottom: '6px',
};

export default OrthoChartTab;
