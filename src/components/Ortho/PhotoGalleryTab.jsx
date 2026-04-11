import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, X, Image as ImageIcon, Trash2, ZoomIn, Calendar,
    Camera, ChevronLeft, ChevronRight, Plus, Eye,
    Columns, Clock, FolderPlus, Edit3, Check, Star
} from 'lucide-react';

// ── Standard Orthodontic Photo Angles ──────────────────────────────────
const PHOTO_ANGLES = [
    { id: 'extra-front',   label: 'Extra-oral Front',     labelTH: 'หน้าตรง',            emoji: '🧑', color: '#0d9488' },
    { id: 'extra-smile',   label: 'Smile',                labelTH: 'ยิ้ม',               emoji: '😊', color: '#ec4899' },
    { id: 'extra-side',    label: 'Profile (Side)',        labelTH: 'ด้านข้าง',           emoji: '👤', color: '#7c3aed' },
    { id: 'intra-front',   label: 'Intra-oral Front',     labelTH: 'ในปาก (หน้า)',       emoji: '😁', color: '#2563eb' },
    { id: 'intra-right',   label: 'Intra-oral Right',     labelTH: 'ในปาก (ขวา)',        emoji: '▶️', color: '#ca8a04' },
    { id: 'intra-left',    label: 'Intra-oral Left',      labelTH: 'ในปาก (ซ้าย)',       emoji: '◀️', color: '#0891b2' },
    { id: 'intra-upper',   label: 'Upper Occlusal',       labelTH: 'ฟันบน',              emoji: '⬆️', color: '#16a34a' },
    { id: 'intra-lower',   label: 'Lower Occlusal',       labelTH: 'ฟันล่าง',            emoji: '⬇️', color: '#ea580c' },
];

// ── Helpers ────────────────────────────────────────────────────────────
const fmtDate = (iso, lang) => {
    if (!iso) return '';
    const d = new Date(iso);
    return lang === 'TH'
        ? d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const makeVisitId = () => `visit-${Date.now()}`;

// ── Main Component ─────────────────────────────────────────────────────
const PhotoGalleryTab = ({ patient, language, onUpdate }) => {
    const [visits, setVisits] = useState(patient?.orthoVisits || []);
    const [tab, setTab] = useState('visits');       // visits | compare | progress
    const [expandedVisit, setExpandedVisit] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [lbList, setLbList] = useState([]);
    const [lbIdx, setLbIdx] = useState(0);
    const [editingVisit, setEditingVisit] = useState(null);
    const [editLabel, setEditLabel] = useState('');
    const [compareA, setCompareA] = useState(null);
    const [compareB, setCompareB] = useState(null);
    const [compareAngle, setCompareAngle] = useState('intra-front');
    const [compareMode, setCompareMode] = useState('side'); // side | slider
    const [sliderPos, setSliderPos] = useState(50);
    const fileRefs = useRef({});
    const t = (th, en) => language === 'TH' ? th : en;

    // ── Persist ────────────────────────────────────────────────────
    const persist = useCallback((updated) => {
        setVisits(updated);
        if (onUpdate) onUpdate(patient.id, { orthoVisits: updated });
    }, [onUpdate, patient?.id]);

    // ── Create New Visit ───────────────────────────────────────────
    const createVisit = () => {
        const newVisit = {
            id: makeVisitId(),
            date: new Date().toISOString(),
            label: t(`ครั้งที่ ${visits.length + 1}`, `Visit ${visits.length + 1}`),
            photos: {},   // keyed by angle id
            note: '',
        };
        const updated = [newVisit, ...visits];
        persist(updated);
        setExpandedVisit(newVisit.id);
    };

    // ── Upload Photo for specific angle in a visit ─────────────────
    const handleUpload = (visitId, angleId, files) => {
        const file = files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        const updated = visits.map(v => {
            if (v.id !== visitId) return v;
            return { ...v, photos: { ...v.photos, [angleId]: { url, name: file.name, uploadedAt: new Date().toISOString() } } };
        });
        persist(updated);
    };

    // ── Delete Photo ───────────────────────────────────────────────
    const deletePhoto = (visitId, angleId) => {
        const updated = visits.map(v => {
            if (v.id !== visitId) return v;
            const photos = { ...v.photos };
            delete photos[angleId];
            return { ...v, photos };
        });
        persist(updated);
    };

    // ── Delete Visit ───────────────────────────────────────────────
    const deleteVisit = (visitId) => {
        if (!window.confirm(t('ลบ Visit นี้ทั้งหมด?', 'Delete this entire visit?'))) return;
        persist(visits.filter(v => v.id !== visitId));
    };

    // ── Update Visit Label ─────────────────────────────────────────
    const saveVisitLabel = (visitId) => {
        persist(visits.map(v => v.id === visitId ? { ...v, label: editLabel } : v));
        setEditingVisit(null);
    };

    // ── Update Visit Note ──────────────────────────────────────────
    const updateVisitNote = (visitId, note) => {
        persist(visits.map(v => v.id === visitId ? { ...v, note } : v));
    };

    // ── Lightbox ───────────────────────────────────────────────────
    const openLightbox = (photoList, idx) => {
        setLbList(photoList);
        setLbIdx(idx);
        setLightbox(photoList[idx]);
    };
    const lbPrev = () => { const i = (lbIdx - 1 + lbList.length) % lbList.length; setLbIdx(i); setLightbox(lbList[i]); };
    const lbNext = () => { const i = (lbIdx + 1) % lbList.length; setLbIdx(i); setLightbox(lbList[i]); };

    // ── Stats ──────────────────────────────────────────────────────
    const totalPhotos = visits.reduce((sum, v) => sum + Object.keys(v.photos || {}).length, 0);

    return (
        <div style={{ animation: 'slideUp 0.4s ease-out' }}>

            {/* ── Header ────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #14b8a6 70%, #2dd4bf 100%)',
                borderRadius: '20px', padding: '1.75rem 2rem', marginBottom: '1.5rem',
                color: 'white', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Camera size={22} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                                {t('รูปถ่ายจัดฟัน', 'Orthodontic Photos')}
                            </h3>
                            <p style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: '3px' }}>
                                {t(`${visits.length} ครั้งที่มา · ${totalPhotos} รูป`, `${visits.length} visits · ${totalPhotos} photos`)}
                            </p>
                        </div>
                    </div>

                    <button onClick={createVisit} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '11px 22px', border: '2px solid rgba(255,255,255,0.3)',
                        borderRadius: '14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800,
                        fontFamily: 'var(--font-sans)', background: 'rgba(255,255,255,0.15)',
                        color: 'white', backdropFilter: 'blur(8px)', transition: 'all 0.25s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <Plus size={16} />
                        {t('เพิ่ม Visit ใหม่', 'New Visit')}
                    </button>
                </div>

                {/* Tab Switcher */}
                <div style={{
                    display: 'flex', gap: '4px', marginTop: '1.25rem',
                    background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '4px',
                }}>
                    {[
                        { id: 'visits', icon: Camera, label: t('รูปถ่าย', 'Photos') },
                        { id: 'compare', icon: Columns, label: t('Before / After', 'Before / After') },
                        { id: 'progress', icon: Clock, label: t('Progress', 'Progress') },
                    ].map(v => (
                        <button key={v.id} onClick={() => setTab(v.id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            padding: '10px', border: 'none', cursor: 'pointer',
                            borderRadius: '9px', fontSize: '0.8rem', fontWeight: 700,
                            fontFamily: 'var(--font-sans)', transition: 'all 0.25s',
                            background: tab === v.id ? 'rgba(255,255,255,0.22)' : 'transparent',
                            color: 'white', backdropFilter: tab === v.id ? 'blur(8px)' : 'none',
                        }}>
                            <v.icon size={15} />
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── TAB: Visits ───────────────────────────────── */}
            {tab === 'visits' && (
                <>
                    {visits.length === 0 ? (
                        /* Empty State */
                        <div onClick={createVisit} style={{
                            border: '2.5px dashed #d1d5db', borderRadius: '24px',
                            padding: '5rem 2rem', textAlign: 'center', cursor: 'pointer',
                            background: 'linear-gradient(180deg, #fafbfd, #f8f9fb)',
                            transition: 'all 0.3s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.background = 'linear-gradient(135deg, #f0fdfa, #e6faf4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'linear-gradient(180deg, #fafbfd, #f8f9fb)'; }}
                        >
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '24px',
                                background: 'linear-gradient(135deg, #e0f2fe, #f0fdfa)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                            }}>
                                <Camera size={34} color="#0d9488" />
                            </div>
                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
                                {t('เริ่มบันทึกรูปถ่ายจัดฟัน', 'Start Recording Ortho Photos')}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                                {t('คลิกเพื่อสร้าง Visit แรก — ถ่ายรูป 8 มุมมาตรฐาน', 'Click to create first visit — capture 8 standard angles')}
                            </p>
                        </div>
                    ) : (
                        /* Visit Cards */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {visits.map((visit, vi) => {
                                const isExpanded = expandedVisit === visit.id;
                                const photoCount = Object.keys(visit.photos || {}).length;
                                return (
                                    <div key={visit.id} style={{
                                        borderRadius: '18px', overflow: 'hidden',
                                        border: isExpanded ? '2px solid #0d9488' : '1.5px solid #e8ecf2',
                                        background: 'white',
                                        boxShadow: isExpanded ? '0 8px 28px rgba(13,148,136,0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                                        transition: 'all 0.3s',
                                    }}>
                                        {/* Visit Header */}
                                        <div onClick={() => setExpandedVisit(isExpanded ? null : visit.id)} style={{
                                            padding: '16px 20px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            background: isExpanded ? 'linear-gradient(135deg, #f0fdfa, #e6faf4)' : '#fafbfd',
                                            borderBottom: isExpanded ? '1px solid #d1fae5' : 'none',
                                            transition: 'all 0.25s',
                                        }}>
                                            {/* Visit Number */}
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '12px',
                                                background: vi === 0 ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 900, fontSize: '0.85rem',
                                                fontFamily: 'var(--font-display)', flexShrink: 0,
                                            }}>
                                                {visits.length - vi}
                                            </div>

                                            {/* Label & Date */}
                                            <div style={{ flex: 1 }}>
                                                {editingVisit === visit.id ? (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                                                            autoFocus onKeyDown={e => e.key === 'Enter' && saveVisitLabel(visit.id)}
                                                            style={{ flex: 1, padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #0d9488', outline: 'none', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-sans)' }}
                                                        />
                                                        <button onClick={() => saveVisitLabel(visit.id)} style={{ ...iconBtnS, background: '#0d9488', color: 'white' }}>
                                                            <Check size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', fontFamily: 'var(--font-display)' }}>
                                                                {visit.label}
                                                            </span>
                                                            <button onClick={e => { e.stopPropagation(); setEditingVisit(visit.id); setEditLabel(visit.label); }}
                                                                style={{ ...iconBtnS, opacity: 0.4 }}
                                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                                                            >
                                                                <Edit3 size={12} />
                                                            </button>
                                                        </div>
                                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={11} /> {fmtDate(visit.date, language)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            {/* Photo count badge */}
                                            <div style={{
                                                padding: '5px 12px', borderRadius: '20px',
                                                background: photoCount > 0 ? '#f0fdfa' : '#f8fafc',
                                                border: `1px solid ${photoCount > 0 ? '#ccfbf1' : '#e2e8f0'}`,
                                                fontSize: '0.73rem', fontWeight: 700,
                                                color: photoCount > 0 ? '#0f766e' : '#94a3b8',
                                            }}>
                                                📷 {photoCount}/8
                                            </div>

                                            {/* Delete */}
                                            <button onClick={e => { e.stopPropagation(); deleteVisit(visit.id); }}
                                                style={{ ...iconBtnS, color: '#cbd5e1' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                            >
                                                <Trash2 size={15} />
                                            </button>

                                            {/* Chevron */}
                                            <ChevronRight size={18} color="#94a3b8"
                                                style={{ transition: 'transform 0.3s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}
                                            />
                                        </div>

                                        {/* Expanded Photo Grid */}
                                        {isExpanded && (
                                            <div style={{ padding: '20px' }}>
                                                {/* Note area */}
                                                <div style={{ marginBottom: '18px' }}>
                                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                                                        📝 {t('บันทึก', 'Notes')}
                                                    </label>
                                                    <input type="text" value={visit.note || ''} placeholder={t('หมายเหตุเพิ่มเติม...', 'Additional notes...')}
                                                        onChange={e => updateVisitNote(visit.id, e.target.value)}
                                                        style={{
                                                            width: '100%', padding: '10px 14px', borderRadius: '12px',
                                                            border: '1.5px solid #e2e8f0', outline: 'none',
                                                            fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
                                                            color: '#334155', background: '#fafbfd',
                                                        }}
                                                    />
                                                </div>

                                                {/* Photo Angle Grid */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                                    gap: '12px',
                                                }}>
                                                    {PHOTO_ANGLES.map(angle => {
                                                        const photo = visit.photos?.[angle.id];
                                                        const refKey = `${visit.id}-${angle.id}`;
                                                        return (
                                                            <div key={angle.id} style={{
                                                                borderRadius: '14px', overflow: 'hidden',
                                                                border: `1.5px solid ${photo ? angle.color + '30' : '#e8ecf2'}`,
                                                                background: photo ? '#fafbfd' : '#fafbfd',
                                                                transition: 'all 0.25s',
                                                            }}>
                                                                {/* Photo or upload area */}
                                                                {photo ? (
                                                                    <div style={{ position: 'relative', height: '130px', overflow: 'hidden', cursor: 'pointer' }}
                                                                        onClick={() => {
                                                                            const allPhotos = PHOTO_ANGLES.filter(a => visit.photos?.[a.id]).map(a => ({
                                                                                ...visit.photos[a.id], angle: a,
                                                                            }));
                                                                            const idx = allPhotos.findIndex(p => p.angle.id === angle.id);
                                                                            openLightbox(allPhotos, idx);
                                                                        }}
                                                                    >
                                                                        <img src={photo.url} alt={angle.label}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                                                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                        />
                                                                        <div style={{
                                                                            position: 'absolute', inset: 0,
                                                                            background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4))',
                                                                        }} />
                                                                        {/* Delete button */}
                                                                        <button onClick={e => { e.stopPropagation(); deletePhoto(visit.id, angle.id); }}
                                                                            style={{
                                                                                position: 'absolute', top: '6px', right: '6px',
                                                                                width: '26px', height: '26px', borderRadius: '8px',
                                                                                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)',
                                                                                border: 'none', cursor: 'pointer', display: 'flex',
                                                                                alignItems: 'center', justifyContent: 'center',
                                                                                color: '#94a3b8', transition: 'all 0.15s',
                                                                            }}
                                                                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                        {/* Zoom overlay */}
                                                                        <div style={{
                                                                            position: 'absolute', bottom: '8px', right: '8px',
                                                                            width: '26px', height: '26px', borderRadius: '8px',
                                                                            background: 'rgba(255,255,255,0.7)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        }}>
                                                                            <ZoomIn size={12} color="#475569" />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div onClick={() => fileRefs.current[refKey]?.click()}
                                                                        style={{
                                                                            height: '130px', display: 'flex', flexDirection: 'column',
                                                                            alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                                            cursor: 'pointer', transition: 'all 0.2s',
                                                                            background: '#fafbfd',
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdfa'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = '#fafbfd'}
                                                                    >
                                                                        <div style={{
                                                                            width: '36px', height: '36px', borderRadius: '10px',
                                                                            background: `${angle.color}10`,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        }}>
                                                                            <Upload size={16} color={angle.color} />
                                                                        </div>
                                                                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                                                                            {t('อัปโหลด', 'Upload')}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Angle label */}
                                                                <div style={{
                                                                    padding: '8px 10px',
                                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                                    borderTop: '1px solid #f1f5f9',
                                                                }}>
                                                                    <span style={{ fontSize: '0.85rem' }}>{angle.emoji}</span>
                                                                    <span style={{
                                                                        fontSize: '0.7rem', fontWeight: 700,
                                                                        color: photo ? angle.color : '#94a3b8',
                                                                    }}>
                                                                        {t(angle.labelTH, angle.label)}
                                                                    </span>
                                                                </div>

                                                                {/* Hidden file input */}
                                                                <input
                                                                    ref={el => fileRefs.current[refKey] = el}
                                                                    type="file" accept="image/*" style={{ display: 'none' }}
                                                                    onChange={e => { handleUpload(visit.id, angle.id, e.target.files); e.target.value = ''; }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── TAB: Before / After Compare ──────────────── */}
            {tab === 'compare' && (
                <div>
                    {visits.length < 2 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                            <Columns size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#64748b' }}>
                                {t('ต้องมีอย่างน้อย 2 Visit เพื่อเปรียบเทียบ', 'Need at least 2 visits to compare')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* View Mode Toggle */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ 
                                    display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' 
                                }}>
                                    <button 
                                        onClick={() => setCompareMode('side')}
                                        style={{
                                            padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
                                            background: compareMode === 'side' ? 'white' : 'transparent',
                                            color: compareMode === 'side' ? '#0d9488' : '#64748b',
                                            boxShadow: compareMode === 'side' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        Side-by-Side
                                    </button>
                                    <button 
                                        onClick={() => setCompareMode('slider')}
                                        style={{
                                            padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
                                            background: compareMode === 'slider' ? 'white' : 'transparent',
                                            color: compareMode === 'slider' ? '#0d9488' : '#64748b',
                                            boxShadow: compareMode === 'slider' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        Magic Slider
                                    </button>
                                </div>
                            </div>

                            {compareMode === 'side' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', minHeight: '420px' }}>
                                    {[
                                        { selected: compareA, setter: setCompareA, label: 'Before', color: '#f59e0b', bg: '#fffbeb', badge: 'A' },
                                        { selected: compareB, setter: setCompareB, label: 'After', color: '#22c55e', bg: '#f0fdf4', badge: 'B' },
                                    ].map((panel, idx) => {
                                        const photo = panel.selected?.photos?.[compareAngle];
                                        return (
                                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {/* Panel header */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '10px 16px', borderRadius: '14px',
                                                    background: panel.bg, border: `1.5px solid ${panel.color}30`,
                                                }}>
                                                    <span style={{
                                                        width: '28px', height: '28px', borderRadius: '8px',
                                                        background: panel.color, color: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.75rem', fontWeight: 900,
                                                    }}>{panel.badge}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>{panel.label}</span>
                                                    <select style={{
                                                        flex: 1, padding: '8px 12px', borderRadius: '10px',
                                                        border: '1.5px solid #e2e8f0', background: 'white',
                                                        fontSize: '0.8rem', fontFamily: 'var(--font-sans)',
                                                        outline: 'none', cursor: 'pointer', color: '#475569',
                                                    }}
                                                        value={panel.selected?.id || ''}
                                                        onChange={e => panel.setter(visits.find(v => v.id === e.target.value))}
                                                    >
                                                        <option value="">{t('เลือก Visit...', 'Select Visit...')}</option>
                                                        {visits.map(v => (
                                                            <option key={v.id} value={v.id}>
                                                                {v.label} — {fmtDate(v.date, language)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Image */}
                                                <div style={{
                                                    flex: 1, borderRadius: '18px', overflow: 'hidden',
                                                    border: '2px solid #e8ecf2', background: '#fafbfd',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    minHeight: '360px',
                                                }}>
                                                    {photo ? (
                                                        <img src={photo.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                                                            onClick={() => openLightbox([{ ...photo, angle: PHOTO_ANGLES.find(a => a.id === compareAngle) }], 0)}
                                                        />
                                                    ) : panel.selected ? (
                                                        <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                                                            <ImageIcon size={40} style={{ marginBottom: '8px', opacity: 0.4 }} />
                                                            <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                                {t('ไม่มีรูปมุมนี้ใน Visit ที่เลือก', 'No photo for this angle in selected visit')}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                                                            <ImageIcon size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                                                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                                {t('เลือก Visit จากรายการด้านบน', 'Select visit from dropdown above')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Selectors row */}
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {[
                                            { selected: compareA, setter: setCompareA, label: 'Before (Left/Under)', color: '#f59e0b' },
                                            { selected: compareB, setter: setCompareB, label: 'After (Right/Over)', color: '#22c55e' }
                                        ].map((sel, idx) => (
                                            <div key={idx} style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>{sel.label}</label>
                                                <select style={{
                                                    width: '100%', padding: '10px 14px', borderRadius: '12px', 
                                                    border: '1.5px solid #e2e8f0', background: 'white',
                                                    fontSize: '0.85rem', fontFamily: 'var(--font-sans)', outline: 'none'
                                                }}
                                                    value={sel.selected?.id || ''}
                                                    onChange={e => sel.setter(visits.find(v => v.id === e.target.value))}
                                                >
                                                    <option value="">{t('เลือก Visit...', 'Select Visit...')}</option>
                                                    {visits.map(v => (
                                                        <option key={v.id} value={v.id}>{v.label} — {fmtDate(v.date, language)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Interactive Slider Area */}
                                    <div style={{ 
                                        position: 'relative', width: '100%', height: '500px', 
                                        borderRadius: '24px', overflow: 'hidden', border: '4px solid white',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', background: '#f8fafc'
                                    }}>
                                        {compareA?.photos?.[compareAngle] && compareB?.photos?.[compareAngle] ? (
                                            <div 
                                                style={{ position: 'relative', width: '100%', height: '100%', cursor: 'ew-resize' }}
                                                onMouseMove={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                    setSliderPos(x);
                                                }}
                                            >
                                                {/* Bottom Image (After) */}
                                                <img 
                                                    src={compareB.photos[compareAngle].url} 
                                                    alt="After" 
                                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                                {/* Top Image (Before) clipped */}
                                                <div style={{ 
                                                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                                                    clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                                                }}>
                                                    <img 
                                                        src={compareA.photos[compareAngle].url} 
                                                        alt="Before" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                </div>
                                                {/* Slider Handle */}
                                                <div style={{ 
                                                    position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`,
                                                    width: '2px', background: 'white', boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                                                    zIndex: 10
                                                }}>
                                                    <div style={{
                                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                                        width: '36px', height: '36px', borderRadius: '50%', background: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '2px solid #0d9488'
                                                    }}>
                                                        <Columns size={16} color="#0d9488" />
                                                    </div>
                                                </div>
                                                {/* Labels */}
                                                <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>BEFORE</div>
                                                <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>AFTER</div>
                                            </div>
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '1rem' }}>
                                                <Columns size={48} style={{ opacity: 0.2 }} />
                                                <p style={{ fontWeight: 700 }}>{t('กรุณาเลือก 2 Visit ที่มีรูปถ่ายมุมเดียวกัน', 'Please select 2 visits with matching photo angles')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── TAB: Progress Timeline ───────────────────── */}
            {tab === 'progress' && (
                <div>
                    {visits.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                            <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontWeight: 700, color: '#64748b' }}>{t('ยังไม่มี Visit', 'No visits yet')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Angle selector for progress */}
                            <div style={{
                                display: 'flex', gap: '6px', flexWrap: 'wrap',
                                marginBottom: '1.5rem', paddingBottom: '1rem',
                                borderBottom: '1px solid #f1f5f9',
                            }}>
                                {PHOTO_ANGLES.map(a => (
                                    <button key={a.id} onClick={() => setCompareAngle(a.id)} style={{
                                        padding: '7px 14px', borderRadius: '20px', border: 'none',
                                        cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700,
                                        fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                                        background: compareAngle === a.id ? a.color : '#f1f5f9',
                                        color: compareAngle === a.id ? 'white' : '#64748b',
                                    }}>
                                        {a.emoji} {t(a.labelTH, a.label)}
                                    </button>
                                ))}
                            </div>

                            {/* Progress Grid - sorted oldest first */}
                            <div style={{ position: 'relative', paddingLeft: '40px' }}>
                                {/* Timeline line */}
                                <div style={{
                                    position: 'absolute', left: '16px', top: 0, bottom: 0,
                                    width: '2.5px', borderRadius: '2px',
                                    background: 'linear-gradient(180deg, #0d9488, #5eead4, #e2e8f0)',
                                }} />

                                {[...visits].reverse().map((visit, vi) => {
                                    const photo = visit.photos?.[compareAngle];
                                    const isLast = vi === visits.length - 1;
                                    return (
                                        <div key={visit.id} style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                            {/* Dot */}
                                            <div style={{
                                                position: 'absolute', left: '-32px', top: '6px',
                                                width: isLast ? '16px' : '12px',
                                                height: isLast ? '16px' : '12px',
                                                borderRadius: '50%',
                                                background: isLast ? '#0d9488' : '#e2e8f0',
                                                border: '3px solid white',
                                                boxShadow: `0 0 0 2px ${isLast ? '#0d9488' : '#e2e8f0'}`,
                                                marginLeft: isLast ? '-2px' : '0',
                                                marginTop: isLast ? '-2px' : '0',
                                            }} />

                                            {/* Content */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '16px',
                                            }}>
                                                {/* Date / label */}
                                                <div style={{ minWidth: '120px' }}>
                                                    <p style={{
                                                        fontSize: '0.82rem', fontWeight: 800,
                                                        color: isLast ? '#0f766e' : '#64748b',
                                                        fontFamily: 'var(--font-display)',
                                                    }}>
                                                        {visit.label}
                                                    </p>
                                                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={10} /> {fmtDate(visit.date, language)}
                                                    </p>
                                                </div>

                                                {/* Photo */}
                                                {photo ? (
                                                    <div style={{
                                                        width: '180px', height: '130px', borderRadius: '14px',
                                                        overflow: 'hidden', cursor: 'pointer',
                                                        border: isLast ? '2px solid #0d9488' : '1.5px solid #e8ecf2',
                                                        transition: 'all 0.25s', flexShrink: 0,
                                                    }}
                                                        onClick={() => openLightbox([{ ...photo, angle: PHOTO_ANGLES.find(a => a.id === compareAngle) }], 0)}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        width: '180px', height: '130px', borderRadius: '14px',
                                                        background: '#f8fafc', border: '1.5px dashed #e2e8f0',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600,
                                                        flexShrink: 0,
                                                    }}>
                                                        {t('ไม่มีรูป', 'No photo')}
                                                    </div>
                                                )}

                                                {/* Arrow indicator */}
                                                {vi < visits.length - 1 && photo && (
                                                    <span style={{ fontSize: '1.2rem', color: '#cbd5e1' }}>→</span>
                                                )}

                                                {/* Note */}
                                                {visit.note && (
                                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                        "{visit.note}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Lightbox ──────────────────────────────────── */}
            {lightbox && (
                <div onClick={() => setLightbox(null)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'zoom-out', animation: 'fadeIn 0.2s ease-out',
                }}>
                    <button onClick={() => setLightbox(null)} style={lbBtn}>
                        <X size={20} />
                    </button>

                    {lbList.length > 1 && (
                        <>
                            <button onClick={e => { e.stopPropagation(); lbPrev(); }}
                                style={{ ...lbBtn, top: '50%', left: '1.5rem', right: 'auto', transform: 'translateY(-50%)' }}>
                                <ChevronLeft size={24} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); lbNext(); }}
                                style={{ ...lbBtn, top: '50%', right: '1.5rem', left: 'auto', transform: 'translateY(-50%)' }}>
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    <img src={lightbox.url} alt="" onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '88vw', maxHeight: '85vh', borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            cursor: 'default', objectFit: 'contain',
                        }}
                    />

                    {/* Info bar */}
                    <div onClick={e => e.stopPropagation()} style={{
                        position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)',
                        borderRadius: '16px', padding: '12px 24px',
                        display: 'flex', alignItems: 'center', gap: '14px',
                        color: 'white', fontSize: '0.82rem', fontWeight: 600,
                    }}>
                        {lightbox.angle && <span>{lightbox.angle.emoji} {t(lightbox.angle.labelTH, lightbox.angle.label)}</span>}
                        <span style={{ opacity: 0.5 }}>{lbIdx + 1}/{lbList.length}</span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

// ── Shared Styles ──────────────────────────────────────────────────────
const iconBtnS = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '5px', borderRadius: '8px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
};

const lbBtn = {
    position: 'absolute', top: '1.5rem', right: '1.5rem',
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
    border: 'none', borderRadius: '50%',
    width: '44px', height: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'white', transition: 'all 0.2s',
};

export default PhotoGalleryTab;
