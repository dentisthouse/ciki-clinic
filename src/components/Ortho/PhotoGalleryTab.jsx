import React, { useState, useRef } from 'react';
import { Upload, X, Grid, Columns, Image as ImageIcon, Trash2, ZoomIn, Tag } from 'lucide-react';

const CATEGORIES = [
    { id: 'extra-front', label: 'Extra-oral (Front)', emoji: '🧑' },
    { id: 'extra-side', label: 'Extra-oral (Side)', emoji: '👤' },
    { id: 'intra-front', label: 'Intra-oral (Front)', emoji: '😁' },
    { id: 'intra-upper', label: 'Intra-oral (Upper)', emoji: '⬆️' },
    { id: 'intra-lower', label: 'Intra-oral (Lower)', emoji: '⬇️' },
];

const PhotoGalleryTab = ({ patient, language, onUpdate }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [images, setImages] = useState(patient?.orthoImages || []);
    const [isDragging, setIsDragging] = useState(false);
    const [compareLeft, setCompareLeft] = useState(null);
    const [compareRight, setCompareRight] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [lightbox, setLightbox] = useState(null);
    const fileInputRef = useRef(null);

    const handleFiles = (files) => {
        const newImages = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => ({
            id: Date.now() + Math.random(),
            url: URL.createObjectURL(file),
            date: new Date().toISOString().split('T')[0],
            category: 'intra-front',
            name: file.name,
        }));
        const updatedImages = [...newImages, ...images];
        setImages(updatedImages);
        if (onUpdate) onUpdate(patient.id, { orthoImages: updatedImages });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDelete = (id) => {
        const updatedImages = images.filter(img => img.id !== id);
        setImages(updatedImages);
        if (onUpdate) onUpdate(patient.id, { orthoImages: updatedImages });
    };

    const handleCategoryChange = (imgId, cat) => {
        const updatedImages = images.map(img => img.id === imgId ? { ...img, category: cat } : img);
        setImages(updatedImages);
        if (onUpdate) onUpdate(patient.id, { orthoImages: updatedImages });
    };

    const filteredImages = selectedCategory === 'all' ? images : images.filter(img => img.category === selectedCategory);

    return (
        <div style={{ animation: 'slideUp 0.4s ease-out' }}>

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                {/* View Toggle */}
                <div style={{ display: 'flex', background: 'var(--neutral-100)', borderRadius: '10px', padding: '3px' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            ...toggleBtnStyle,
                            background: viewMode === 'grid' ? 'white' : 'transparent',
                            color: viewMode === 'grid' ? 'var(--primary-700)' : 'var(--neutral-400)',
                            boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        <Grid size={16} /> {language === 'TH' ? 'แกลเลอรี' : 'Gallery'}
                    </button>
                    <button
                        onClick={() => setViewMode('compare')}
                        style={{
                            ...toggleBtnStyle,
                            background: viewMode === 'compare' ? 'white' : 'transparent',
                            color: viewMode === 'compare' ? 'var(--primary-700)' : 'var(--neutral-400)',
                            boxShadow: viewMode === 'compare' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        <Columns size={16} /> {language === 'TH' ? 'เปรียบเทียบ' : 'Compare'}
                    </button>
                </div>

                {/* Category Filter */}
                {viewMode === 'grid' && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSelectedCategory('all')}
                            style={{ ...chipStyle, background: selectedCategory === 'all' ? 'var(--primary-600)' : 'var(--neutral-100)', color: selectedCategory === 'all' ? 'white' : 'var(--neutral-500)' }}
                        >
                            {language === 'TH' ? 'ทั้งหมด' : 'All'} ({images.length})
                        </button>
                        {CATEGORIES.map(cat => {
                            const count = images.filter(img => img.category === cat.id).length;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    style={{ ...chipStyle, background: selectedCategory === cat.id ? 'var(--primary-600)' : 'var(--neutral-100)', color: selectedCategory === cat.id ? 'white' : 'var(--neutral-500)' }}
                                >
                                    {cat.emoji} {count}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Upload Button */}
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} style={{ marginRight: '6px' }} />
                    {language === 'TH' ? 'อัปโหลด' : 'Upload'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <>
                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${isDragging ? 'var(--primary-400)' : 'var(--neutral-200)'}`,
                            borderRadius: '16px',
                            padding: images.length === 0 ? '4rem 2rem' : '1.5rem',
                            marginBottom: '1.5rem',
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            background: isDragging ? 'var(--primary-50)' : 'var(--neutral-50)',
                        }}
                    >
                        {images.length === 0 ? (
                            <div>
                                <ImageIcon size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--neutral-400)', fontSize: '1rem', fontWeight: 500 }}>
                                    {language === 'TH' ? 'ลากรูปภาพมาวางที่นี่ หรือคลิก "อัปโหลด"' : 'Drag photos here or click "Upload"'}
                                </p>
                                <p style={{ color: 'var(--neutral-300)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    JPG, PNG (max 10MB)
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '1rem',
                            }}>
                                {filteredImages.map(img => (
                                    <div key={img.id} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                                        <div
                                            onClick={() => setLightbox(img)}
                                            style={{ height: '160px', overflow: 'hidden' }}
                                        >
                                            <img
                                                src={img.url}
                                                alt={img.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        </div>
                                        <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-700)' }}>{img.date}</p>
                                                <select
                                                    value={img.category}
                                                    onChange={(e) => handleCategoryChange(img.id, e.target.value)}
                                                    style={{ fontSize: '0.7rem', border: 'none', background: 'transparent', color: 'var(--neutral-400)', cursor: 'pointer', outline: 'none' }}
                                                >
                                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                                                </select>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-300)', padding: '4px' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--neutral-300)'}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Compare View */}
            {viewMode === 'compare' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minHeight: '500px' }}>
                    {[
                        { selected: compareLeft, setter: setCompareLeft, label: language === 'TH' ? 'ก่อน (Before)' : 'Before' },
                        { selected: compareRight, setter: setCompareRight, label: language === 'TH' ? 'หลัง (After)' : 'After' },
                    ].map((panel, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neutral-600)' }}>{panel.label}</span>
                                <select
                                    className="input-field"
                                    style={{ flex: 1, fontSize: '0.85rem' }}
                                    onChange={(e) => panel.setter(images.find(img => img.id === Number(e.target.value)))}
                                >
                                    <option value="">{language === 'TH' ? 'เลือกรูปภาพ...' : 'Select image...'}</option>
                                    {images.map(img => (
                                        <option key={img.id} value={img.id}>
                                            {img.date} — {CATEGORIES.find(c => c.id === img.category)?.label || img.category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{
                                flex: 1, borderRadius: '16px', overflow: 'hidden',
                                border: '2px solid var(--neutral-200)',
                                background: 'var(--neutral-50)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px',
                            }}>
                                {panel.selected ? (
                                    <img src={panel.selected.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--neutral-300)' }}>
                                        <ImageIcon size={40} style={{ marginBottom: '0.5rem' }} />
                                        <p style={{ fontSize: '0.85rem' }}>{language === 'TH' ? 'เลือกรูปภาพจากรายการ' : 'Select from dropdown'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out', animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <img src={lightbox.url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                    <button
                        onClick={() => setLightbox(null)}
                        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// ── Shared Styles ──────────────────────────────────────────────────────
const toggleBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', border: 'none', cursor: 'pointer',
    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
    fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
};

const chipStyle = {
    padding: '5px 12px', borderRadius: '20px',
    border: 'none', cursor: 'pointer',
    fontSize: '0.75rem', fontWeight: 600,
    fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
};

export default PhotoGalleryTab;
