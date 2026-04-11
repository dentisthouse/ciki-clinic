import React, { useState, useRef, useEffect } from 'react';
import { Save, RotateCcw, Zap, Clipboard, CheckCircle } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const STATUS_CONFIG = {
    normal:    { color: '#94a3b8', fill: '#ffffff', accent: '#e2e8f0', label: 'Normal',    labelTH: 'ปกติ',       icon: '🦷', gradient: 'linear-gradient(145deg, #f8fafc, #e2e8f0)' },
    bonded:    { color: '#0d9488', fill: '#ccfbf1', accent: '#5eead4', label: 'Bonded',    labelTH: 'ติดเหล็ก',   icon: '🔲', gradient: 'linear-gradient(145deg, #f0fdfa, #ccfbf1)' },
    banded:    { color: '#7c3aed', fill: '#ede9fe', accent: '#a78bfa', label: 'Banded',    labelTH: 'ใส่แหวน',    icon: '💍', gradient: 'linear-gradient(145deg, #f5f3ff, #ede9fe)' },
    extracted: { color: '#ef4444', fill: '#fee2e2', accent: '#fca5a5', label: 'Extracted', labelTH: 'ถอนแล้ว',   icon: '❌', gradient: 'linear-gradient(145deg, #fef2f2, #fee2e2)' },
    impacted:  { color: '#f59e0b', fill: '#fef3c7', accent: '#fcd34d', label: 'Impacted',  labelTH: 'ฟันคุด',     icon: '⚠️', gradient: 'linear-gradient(145deg, #fffbeb, #fef3c7)' },
};

const INITIAL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH].map(num => ({
    id: num, status: 'normal',
}));

// ── Anatomical Tooth SVG Shapes ────────────────────────────────────────
const getToothShape = (id, isUpper) => {
    const num = id % 10;
    // Molars
    if (num >= 6) return isUpper
        ? "M8,42 Q4,36 6,16 Q9,2 22,0 L32,6 L42,0 Q55,2 58,16 Q60,36 56,42 Q32,48 8,42Z"
        : "M8,6 Q4,12 6,32 Q9,46 22,48 L32,42 L42,48 Q55,46 58,32 Q60,12 56,6 Q32,0 8,6Z";
    // Premolars
    if (num >= 4) return isUpper
        ? "M12,40 Q8,32 10,14 Q14,0 32,0 Q50,0 54,14 Q56,32 52,40 Q32,46 12,40Z"
        : "M12,6 Q8,14 10,32 Q14,46 32,46 Q50,46 54,32 Q56,14 52,6 Q32,0 12,6Z";
    // Canines
    if (num === 3) return isUpper
        ? "M16,40 Q12,28 18,12 Q22,-2 32,-6 Q42,-2 46,12 Q52,28 48,40 Q32,46 16,40Z"
        : "M16,6 Q12,18 18,34 Q22,48 32,52 Q42,48 46,34 Q52,18 48,6 Q32,0 16,6Z";
    // Incisors
    return isUpper
        ? "M10,38 Q8,28 10,12 Q14,-2 32,-2 Q50,-2 54,12 Q56,28 54,38 Q32,44 10,38Z"
        : "M10,8 Q8,18 10,34 Q14,48 32,48 Q50,48 54,34 Q56,18 54,8 Q32,2 10,8Z";
};

const getToothWidth = (id) => {
    const num = id % 10;
    if (num >= 6) return 52;
    if (num >= 4) return 42;
    if (num === 3) return 38;
    return 38;
};

// ── Single Tooth Component ─────────────────────────────────────────────
const OrthoTooth = ({ tooth, isUpper, isSelected, onClick }) => {
    const cfg = STATUS_CONFIG[tooth.status];
    const w = getToothWidth(tooth.id);
    const isExtracted = tooth.status === 'extracted';
    const [hover, setHover] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: `${w}px`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'scale(1.12)' : hover ? 'scale(1.05)' : 'scale(1)',
                zIndex: isSelected ? 50 : hover ? 10 : 1,
                position: 'relative',
            }}
        >
            {/* Tooth number - top for upper */}
            {isUpper && (
                <span style={{
                    fontSize: '10px', fontWeight: 800,
                    color: isSelected ? '#0d9488' : tooth.status !== 'normal' ? cfg.color : '#94a3b8',
                    background: isSelected ? '#f0fdfa' : 'transparent',
                    padding: '2px 6px', borderRadius: '8px',
                    marginBottom: '3px', transition: 'all 0.2s',
                    fontFamily: 'var(--font-display)',
                }}>{tooth.id}</span>
            )}

            {/* Crown SVG */}
            <div style={{
                position: 'relative',
                padding: isSelected ? '3px' : '2px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(13,148,136,0.08)' : 'transparent',
                transition: 'all 0.3s',
                filter: isSelected ? 'drop-shadow(0 4px 12px rgba(13,148,136,0.25))' : hover ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' : 'none',
            }}>
                <svg width={w - 4} height="46" viewBox="0 -6 64 56" style={{ display: 'block', overflow: 'visible' }}>
                    <defs>
                        <linearGradient id={`ortho-grad-${tooth.id}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={tooth.status !== 'normal' ? cfg.fill : '#ffffff'} />
                            <stop offset="100%" stopColor={tooth.status !== 'normal' ? cfg.accent : '#f1f5f9'} />
                        </linearGradient>
                        <filter id={`ortho-glow-${tooth.id}`}>
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Crown shape */}
                    <path
                        d={getToothShape(tooth.id, isUpper)}
                        fill={`url(#ortho-grad-${tooth.id})`}
                        stroke={isSelected ? '#0d9488' : tooth.status !== 'normal' ? cfg.color : '#d1d5db'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        style={{ transition: 'all 0.3s' }}
                    />

                    {/* Bracket (bonded) */}
                    {tooth.status === 'bonded' && (
                        <g>
                            {/* Bracket base */}
                            <rect x="22" y="16" width="20" height="14" rx="3"
                                fill="#0f766e" stroke="#0a5e58" strokeWidth="0.8" />
                            {/* Bracket slot */}
                            <rect x="24" y="21" width="16" height="3" rx="1"
                                fill="#115e59" />
                            {/* Bracket wings */}
                            <rect x="19" y="19" width="4" height="8" rx="1.5"
                                fill="#14b8a6" />
                            <rect x="41" y="19" width="4" height="8" rx="1.5"
                                fill="#14b8a6" />
                            {/* Wire through bracket */}
                            <line x1="6" y1="22.5" x2="58" y2="22.5"
                                stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                        </g>
                    )}

                    {/* Band ring (banded) */}
                    {tooth.status === 'banded' && (
                        <g>
                            <rect x="10" y="14" width={w - 20} height="18" rx="4"
                                fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="4 2" />
                            <rect x="24" y="18" width="16" height="10" rx="2"
                                fill="#7c3aed" opacity="0.2" />
                        </g>
                    )}

                    {/* X mark (extracted) */}
                    {isExtracted && (
                        <g opacity={0.8}>
                            <line x1="14" y1="8" x2="50" y2="38" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                            <line x1="50" y1="8" x2="14" y2="38" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                        </g>
                    )}

                    {/* Impacted triangle */}
                    {tooth.status === 'impacted' && (
                        <g>
                            <polygon points="24,30 40,30 32,14" fill="#f59e0b" stroke="#d97706" strokeWidth="1" opacity="0.8" />
                            <text x="32" y="28" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">!</text>
                        </g>
                    )}
                </svg>
            </div>

            {/* Tooth number - bottom for lower */}
            {!isUpper && (
                <span style={{
                    fontSize: '10px', fontWeight: 800,
                    color: isSelected ? '#0d9488' : tooth.status !== 'normal' ? cfg.color : '#94a3b8',
                    background: isSelected ? '#f0fdfa' : 'transparent',
                    padding: '2px 6px', borderRadius: '8px',
                    marginTop: '3px', transition: 'all 0.2s',
                    fontFamily: 'var(--font-display)',
                }}>{tooth.id}</span>
            )}

            {/* Selection ring animation */}
            {isSelected && (
                <div style={{
                    position: 'absolute',
                    inset: '-4px',
                    border: '2px solid rgba(13,148,136,0.3)',
                    borderRadius: '14px',
                    animation: 'ortho-pulse 2s ease-in-out infinite',
                    pointerEvents: 'none',
                }} />
            )}
        </div>
    );
};

// ── Status Popover ────────────────────────────────────────────────────
const StatusPopover = ({ pos, toothId, onSelect, onClose, language }) => {
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    return (
        <div ref={ref} style={{
            position: 'absolute', top: pos.y, left: pos.x, zIndex: 9999,
            background: 'rgba(255,255,255,0.97)', borderRadius: '18px', padding: '8px',
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(20px)',
            minWidth: '220px', animation: 'ortho-pop-in 0.2s ease-out',
        }}>
            {/* Header */}
            <div style={{
                padding: '10px 14px 8px', fontSize: '0.7rem', fontWeight: 800,
                color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'var(--font-display)',
            }}>
                <span style={{
                    width: '28px', height: '28px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', color: 'white', fontWeight: 900,
                }}>{toothId}</span>
                {language === 'TH' ? `สถานะซี่ที่ ${toothId}` : `Tooth #${toothId} Status`}
            </div>

            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)', margin: '2px 12px 6px' }} />

            {/* Status options */}
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => onSelect(key)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                    padding: '10px 14px', border: 'none', background: 'transparent',
                    borderRadius: '12px', cursor: 'pointer', fontSize: '0.87rem',
                    fontWeight: 600, color: '#334155', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = cfg.gradient; e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                    <span style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', background: cfg.fill,
                        border: `1.5px solid ${cfg.color}30`,
                    }}>{cfg.icon}</span>
                    <span style={{ flex: 1 }}>{language === 'TH' ? cfg.labelTH : cfg.label}</span>
                    <span style={{
                        width: '10px', height: '10px', borderRadius: '50%', background: cfg.color,
                        boxShadow: `0 0 8px ${cfg.color}40`,
                    }} />
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
        { id: 'Leveling', label: language === 'TH' ? 'เรียงฟัน' : 'Leveling', emoji: '📐', desc: language === 'TH' ? 'จัดเรียงฟันให้ตรง' : 'Aligning teeth' },
        { id: 'Space Closure', label: language === 'TH' ? 'ปิดช่องว่าง' : 'Space Closure', emoji: '🔗', desc: language === 'TH' ? 'ปิดช่องว่างระหว่างฟัน' : 'Closing gaps' },
        { id: 'Finishing', label: language === 'TH' ? 'เก็บรายละเอียด' : 'Finishing', emoji: '✨', desc: language === 'TH' ? 'ปรับตำแหน่งสุดท้าย' : 'Final adjustments' },
        { id: 'Retention', label: language === 'TH' ? 'รีเทนเนอร์' : 'Retention', emoji: '🛡️', desc: language === 'TH' ? 'คงสภาพหลังจัดฟัน' : 'Maintaining position' },
    ];
    const phaseIdx = phases.findIndex(p => p.id === phase);

    const containerRef = useRef(null);

    const handleToothClick = (id, e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate relative position within the container
        let x = r.left - containerRect.left + r.width / 2 - 110;
        let y = r.bottom - containerRect.top + 10;
        
        // Clamping to stay within viewport
        const minX = -containerRect.left + 10;
        const maxX = window.innerWidth - containerRect.left - 230;
        x = Math.max(minX, Math.min(x, maxX));

        setSelectedId(id);
        setPopPos({ x, y });
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
    const totalActive = bondedC + bandedC;

    return (
        <div className="animate-slide-up" ref={containerRef} style={{ position: 'relative' }}>

            {/* ── Phase Progress ─────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #14b8a6 70%, #2dd4bf 100%)',
                borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '1.75rem',
                color: 'white', position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative elements */}
                <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', top: '30%', left: '-20px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', position: 'relative' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={18} />
                    </div>
                    <div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                            {language === 'TH' ? 'ระยะการรักษา' : 'Treatment Phase'}
                        </span>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                            {phases[phaseIdx]?.desc}
                        </div>
                    </div>
                </div>

                {/* Phase Steps */}
                <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
                    {/* Connector line behind buttons */}
                    <div style={{
                        position: 'absolute', top: '24px', left: '10%', right: '10%',
                        height: '2px', background: 'rgba(255,255,255,0.15)',
                    }} />
                    <div style={{
                        position: 'absolute', top: '24px', left: '10%',
                        height: '2px', background: 'rgba(255,255,255,0.6)',
                        width: `${(phaseIdx / (phases.length - 1)) * 80}%`,
                        transition: 'width 0.6s ease',
                    }} />

                    {phases.map((p, i) => (
                        <button key={p.id} onClick={() => setPhase(p.id)} style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            padding: '12px 6px 10px', border: 'none', cursor: 'pointer',
                            borderRadius: '14px', transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontFamily: 'var(--font-sans)',
                            background: i === phaseIdx ? 'rgba(255,255,255,0.22)' : i < phaseIdx ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: 'white', backdropFilter: i === phaseIdx ? 'blur(8px)' : 'none',
                            transform: i === phaseIdx ? 'scale(1.04)' : 'scale(1)',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: i <= phaseIdx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                                fontSize: '1rem', transition: 'all 0.35s',
                                boxShadow: i === phaseIdx ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
                                border: i <= phaseIdx ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent',
                            }}>
                                {i < phaseIdx ? <CheckCircle size={18} /> : p.emoji}
                            </div>
                            <span style={{
                                fontSize: '0.72rem', fontWeight: i === phaseIdx ? 800 : 500,
                                opacity: i <= phaseIdx ? 1 : 0.45,
                                letterSpacing: i === phaseIdx ? '0.01em' : '0',
                            }}>
                                {p.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Progress bar */}
                <div style={{
                    height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '4px',
                    marginTop: '1.25rem', overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%', borderRadius: '4px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.9))',
                        width: `${((phaseIdx + 1) / phases.length) * 100}%`,
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 0 12px rgba(255,255,255,0.3)',
                    }} />
                </div>
            </div>

            {/* ── Stats Cards ────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.75rem' }}>
                {[
                    { label: language === 'TH' ? 'ติดเหล็ก' : 'Bonded', n: bondedC, color: '#0d9488', bg: '#f0fdfa', border: '#ccfbf1', icon: '🔲' },
                    { label: language === 'TH' ? 'ใส่แหวน' : 'Banded', n: bandedC, color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe', icon: '💍' },
                    { label: language === 'TH' ? 'ถอนแล้ว' : 'Extracted', n: extractC, color: '#ef4444', bg: '#fef2f2', border: '#fee2e2', icon: '❌' },
                    { label: language === 'TH' ? 'ฟันคุด' : 'Impacted', n: impactC, color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7', icon: '⚠️' },
                ].map(s => (
                    <div key={s.label} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px', borderRadius: '16px',
                        background: s.bg, border: `1.5px solid ${s.border}`,
                        transition: 'all 0.2s',
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{s.n}</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color, opacity: 0.8, marginTop: '2px' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tooth Chart ────────────────────────────────── */}
            <div style={{
                borderRadius: '20px', padding: '2rem 1.5rem 1.5rem',
                marginBottom: '1.75rem', overflow: 'visible', position: 'relative',
                background: 'linear-gradient(180deg, #fafcff 0%, #ffffff 30%, #ffffff 70%, #f8fafc 100%)',
                border: '1.5px solid #e8ecf2',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)',
            }}>
                {/* Midline */}
                <div style={{
                    position: 'absolute', top: '12px', bottom: '12px', left: '50%',
                    width: '1.5px', background: 'linear-gradient(180deg, #e2e8f0, #cbd5e1, #e2e8f0)',
                    transform: 'translateX(-50%)',
                }} />

                {/* Upper arch label */}
                <div style={{
                    textAlign: 'center', marginBottom: '1rem', position: 'relative',
                }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 16px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, #f0fdfa, #e8faf5)',
                        border: '1px solid #ccfbf1',
                        fontSize: '0.68rem', fontWeight: 800, color: '#0f766e',
                        letterSpacing: '0.12em', fontFamily: 'var(--font-display)',
                    }}>
                        ▲ {language === 'TH' ? 'ขากรรไกรบน' : 'UPPER ARCH'}
                    </span>
                </div>

                {/* Upper teeth row */}
                <div style={{
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    gap: '2px', marginBottom: '1.5rem', paddingBottom: '1rem',
                    borderBottom: '2px solid #f1f5f9',
                    position: 'relative',
                }}>
                    {/* Wire visualization */}
                    {upperWire.type && (
                        <div style={{
                            position: 'absolute', bottom: '28px', left: '8%', right: '8%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, #5eead4 10%, #5eead4 90%, transparent 100%)',
                            borderRadius: '2px',
                            boxShadow: '0 0 6px rgba(94,234,212,0.3)',
                        }} />
                    )}
                    {UPPER_TEETH.map(num => {
                        const td = teeth.find(t => t.id === num);
                        return td ? (
                            <OrthoTooth
                                key={num}
                                tooth={td}
                                isUpper={true}
                                isSelected={selectedId === num}
                                onClick={(e) => handleToothClick(num, e)}
                            />
                        ) : null;
                    })}
                </div>

                {/* Lower teeth row */}
                <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    gap: '2px', marginTop: '0.5rem',
                    position: 'relative',
                }}>
                    {/* Wire visualization */}
                    {lowerWire.type && (
                        <div style={{
                            position: 'absolute', top: '28px', left: '8%', right: '8%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, #5eead4 10%, #5eead4 90%, transparent 100%)',
                            borderRadius: '2px',
                            boxShadow: '0 0 6px rgba(94,234,212,0.3)',
                        }} />
                    )}
                    {LOWER_TEETH.map(num => {
                        const td = teeth.find(t => t.id === num);
                        return td ? (
                            <OrthoTooth
                                key={num}
                                tooth={td}
                                isUpper={false}
                                isSelected={selectedId === num}
                                onClick={(e) => handleToothClick(num, e)}
                            />
                        ) : null;
                    })}
                </div>

                {/* Lower arch label */}
                <div style={{
                    textAlign: 'center', marginTop: '1rem', position: 'relative',
                }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 16px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, #f1f5f9, #e8ecf4)',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.68rem', fontWeight: 800, color: '#64748b',
                        letterSpacing: '0.12em', fontFamily: 'var(--font-display)',
                    }}>
                        ▼ {language === 'TH' ? 'ขากรรไกรล่าง' : 'LOWER ARCH'}
                    </span>
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '1.5rem',
                    marginTop: '1.25rem', paddingTop: '1rem',
                    borderTop: '1px solid #f1f5f9', flexWrap: 'wrap',
                }}>
                    {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'normal').map(([key, cfg]) => (
                        <div key={key} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.72rem', color: '#64748b', fontWeight: 500,
                        }}>
                            <div style={{
                                width: '10px', height: '10px', borderRadius: '4px',
                                background: cfg.color,
                                boxShadow: `0 1px 4px ${cfg.color}30`,
                            }} />
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

            {/* ── Wire & Details Cards ─────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>

                {/* Wire Card */}
                <div style={{
                    borderRadius: '18px', border: '1.5px solid #e8ecf2',
                    background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '14px 20px',
                        background: 'linear-gradient(135deg, #f0fdfa, #e6faf4)',
                        borderBottom: '1px solid #d1fae5',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <span style={{
                            width: '30px', height: '30px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem',
                        }}>🔩</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f766e', fontFamily: 'var(--font-display)' }}>
                            {language === 'TH' ? 'ลวดจัดฟัน' : 'Arch Wires'}
                        </span>
                    </div>
                    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {[
                            { label: language === 'TH' ? 'ลวดบน' : 'Upper Wire', emoji: '⬆️', val: upperWire, set: setUpperWire },
                            { label: language === 'TH' ? 'ลวดล่าง' : 'Lower Wire', emoji: '⬇️', val: lowerWire, set: setLowerWire },
                        ].map(w => (
                            <div key={w.label}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
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
                                        marginTop: '8px', fontSize: '0.72rem', fontWeight: 700,
                                        color: '#0f766e', background: 'linear-gradient(135deg, #f0fdfa, #e6faf4)',
                                        borderRadius: '10px', padding: '6px 12px', display: 'inline-flex',
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
                    borderRadius: '18px', border: '1.5px solid #e8ecf2',
                    background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{
                        padding: '14px 20px',
                        background: 'linear-gradient(135deg, #f8fafc, #eef2f7)',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <span style={{
                            width: '30px', height: '30px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #475569, #64748b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Clipboard size={14} color="white" />
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', fontFamily: 'var(--font-display)' }}>
                            {language === 'TH' ? 'รายละเอียดเพิ่มเติม' : 'Clinical Details'}
                        </span>
                    </div>
                    <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                                style={{ ...inputStyle, flex: 1, minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action Bar ──────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 24px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                border: '1.5px solid #e8ecf2',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                    {totalActive > 0 && (
                        <span style={{
                            fontSize: '0.78rem', fontWeight: 700, color: '#0f766e',
                            background: '#f0fdfa', padding: '6px 14px', borderRadius: '20px',
                            border: '1px solid #ccfbf1',
                        }}>
                            {language === 'TH' ? `ซี่ที่ Active: ${totalActive}/32` : `Active: ${totalActive}/32`}
                        </span>
                    )}
                    <button onClick={handleSave} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 30px', border: 'none', borderRadius: '14px',
                        cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800,
                        fontFamily: 'var(--font-sans)',
                        background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                        color: 'white', transition: 'all 0.25s',
                        boxShadow: '0 4px 16px rgba(13,148,136,0.3)',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,148,136,0.3)'; }}
                    >
                        <Save size={16} />
                        {language === 'TH' ? 'บันทึกข้อมูลจัดฟัน' : 'Save Ortho Chart'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes ortho-pop-in {
                    from { opacity: 0; transform: scale(0.92) translateY(-6px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes ortho-pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50%      { opacity: 0.6; transform: scale(1.02); }
                }
            `}</style>
        </div>
    );
};

// ── Shared Styles ──────────────────────────────────────────────────────
const selectStyle = {
    flex: 1, padding: '10px 14px', borderRadius: '12px',
    border: '1.5px solid #e2e8f0', outline: 'none',
    fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
    color: '#334155', background: '#fafbfd',
    cursor: 'pointer', transition: 'all 0.2s',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
};

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '12px',
    border: '1.5px solid #e2e8f0', outline: 'none',
    fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
    color: '#334155', background: '#fafbfd',
    transition: 'border-color 0.2s',
};

const labelSm = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: '#64748b', marginBottom: '8px',
};

export default OrthoChartTab;
