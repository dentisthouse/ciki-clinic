import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Sun, Contrast, Monitor, RotateCcw } from 'lucide-react';

const DicomViewer = ({ image, onClose }) => {
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [invert, setInvert] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Reset filters
    const handleReset = () => {
        setBrightness(100);
        setContrast(100);
        setInvert(false);
        setZoom(1);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ width: '95vw', height: '90vh', display: 'flex', flexDirection: 'column', background: '#000', color: 'white', padding: 0, overflow: 'hidden' }}>

                {/* Toolbar */}
                <div style={{ padding: '1rem', background: '#1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#fff' }}>{image.type || 'X-Ray View'}</h3>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>{image.date}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Main Viewport */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                    <img
                        src={image.url}
                        alt="X-Ray"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            transform: `scale(${zoom})`,
                            filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 1 : 0})`,
                            transition: 'filter 0.1s, transform 0.1s'
                        }}
                    />

                    {/* On-screen Info */}
                    <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', color: '#0f0', fontFamily: 'monospace', fontSize: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem' }}>
                        <div>B: {brightness}%</div>
                        <div>C: {contrast}%</div>
                        <div>Z: {zoom.toFixed(1)}x</div>
                        <div>{invert ? 'INVERTED' : 'NORMAL'}</div>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ padding: '1rem', background: '#1a1a1a', display: 'flex', gap: '2rem', justifyContent: 'center', borderTop: '1px solid #333' }}>
                    {/* Zoom */}
                    <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ZoomOut size={20} style={{ cursor: 'pointer' }} onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} />
                        <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: '100px' }} />
                        <ZoomIn size={20} style={{ cursor: 'pointer' }} onClick={() => setZoom(z => Math.min(3, z + 0.1))} />
                    </div>

                    <div style={{ width: '1px', background: '#333' }}></div>

                    {/* Brightness */}
                    <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sun size={20} />
                        <input type="range" min="50" max="200" value={brightness} onChange={(e) => setBrightness(e.target.value)} style={{ width: '100px' }} />
                    </div>

                    {/* Contrast */}
                    <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Contrast size={20} />
                        <input type="range" min="50" max="200" value={contrast} onChange={(e) => setContrast(e.target.value)} style={{ width: '100px' }} />
                    </div>

                    <div style={{ width: '1px', background: '#333' }}></div>

                    {/* Invert */}
                    <button
                        onClick={() => setInvert(!invert)}
                        style={{
                            background: invert ? '#fff' : 'transparent',
                            color: invert ? '#000' : '#fff',
                            border: '1px solid #fff',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Monitor size={18} />
                        Invert
                    </button>

                    <button
                        onClick={handleReset}
                        style={{ background: 'var(--red-600)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RotateCcw size={18} />
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DicomViewer;
