import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool, X, Check, RotateCcw, Save } from 'lucide-react';

const HandwritingCanvas = ({ onClose, onSave }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Handle resizing
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initial white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const getCoordinates = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (event) => {
        event.preventDefault();
        const { x, y } = getCoordinates(event);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
        setIsDrawing(true);
    };

    const draw = (event) => {
        if (!isDrawing) return;
        event.preventDefault();
        const { x, y } = getCoordinates(event);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}
                style={{ width: '90%', height: '85vh', background: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>

                {/* Header / Toolbar */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setTool('pen')}
                                style={{ padding: '8px', borderRadius: '6px', background: tool === 'pen' ? 'white' : 'transparent', boxShadow: tool === 'pen' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer' }}>
                                <PenTool size={20} color={color} />
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                style={{ padding: '8px', borderRadius: '6px', background: tool === 'eraser' ? 'white' : 'transparent', boxShadow: tool === 'eraser' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer' }}>
                                <Eraser size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['#000000', '#2563eb', '#dc2626', '#16a34a'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setColor(c); setTool('pen'); }}
                                    style={{
                                        width: '24px', height: '24px', borderRadius: '50%', background: c,
                                        border: color === c && tool === 'pen' ? '2px solid white' : '2px solid transparent',
                                        boxShadow: color === c && tool === 'pen' ? `0 0 0 2px ${c}` : 'none',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>

                        <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
                            <button onClick={clearCanvas} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <RotateCcw size={16} /> Clear
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button onClick={handleSave} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <Save size={18} /> Save Note
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div style={{ flex: 1, position: 'relative', background: 'white', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                    />
                </div>
                <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                    Use Apple Pencil or finger to write
                </div>
            </div>
        </div>
    );
};

export default HandwritingCanvas;
