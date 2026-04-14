import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PenTool, Eraser, RotateCcw, Check, X, Type, Trash2, Loader, Wand2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

/**
 * HandwritingPad — Canvas-based drawing pad with OCR (Tesseract.js)
 *
 * Features:
 *  1. Touch/Stylus/Mouse drawing on HTML5 Canvas
 *  2. Pressure sensitivity (Apple Pencil / stylus)
 *  3. Tesseract.js OCR for Thai + English handwriting recognition
 *  4. Undo support (stroke-level)
 *  5. Eraser mode
 */

const HandwritingPad = ({ value, onTextChange, language = 'EN', onClose }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState([]);
    const [currentStroke, setCurrentStroke] = useState([]);
    const [mode, setMode] = useState('pen');
    const [penSize, setPenSize] = useState(2.5);
    const [recognizedText, setRecognizedText] = useState('');
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [canvasSize, setCanvasSize] = useState({ w: 600, h: 280 });

    // Resize canvas to fit container
    useEffect(() => {
        const resize = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                setCanvasSize({ w, h: 280 });
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Redraw canvas whenever strokes change
    useEffect(() => {
        redrawCanvas();
    }, [strokes, canvasSize]);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // White background (important for OCR)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ruled lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        for (let y = 35; y < canvas.height; y += 35) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw strokes
        strokes.forEach(stroke => drawStroke(ctx, stroke));
    }, [strokes, canvasSize]);

    const drawStroke = (ctx, stroke) => {
        if (stroke.length < 2) return;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < stroke.length; i++) {
            const p0 = stroke[i - 1];
            const p1 = stroke[i];
            ctx.beginPath();
            if (p1.eraser) {
                // Eraser: draw white
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 20;
            } else {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = (p1.pressure || 0.5) * penSize * 3;
            }
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        }
    };

    const getPointerPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY, pressure;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            pressure = e.touches[0].force || 0.5;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
            pressure = e.pressure || 0.5;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
            pressure,
            eraser: mode === 'eraser',
        };
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        const pos = getPointerPos(e);
        setIsDrawing(true);
        setCurrentStroke([pos]);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, (pos.pressure || 0.5) * penSize * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = pos.eraser ? '#ffffff' : '#000000';
        ctx.fill();
    };

    const handlePointerMove = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPointerPos(e);
        setCurrentStroke(prev => {
            const newStroke = [...prev, pos];
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const p0 = prev[prev.length - 1];
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = pos.eraser ? '#ffffff' : '#000000';
            ctx.lineWidth = pos.eraser ? 20 : (pos.pressure || 0.5) * penSize * 3;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            return newStroke;
        });
    };

    const handlePointerUp = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        setIsDrawing(false);
        if (currentStroke.length > 1) {
            setStrokes(prev => [...prev, currentStroke]);
        }
        setCurrentStroke([]);
    };

    const undo = () => setStrokes(prev => prev.slice(0, -1));

    const clearAll = () => {
        setStrokes([]);
        setRecognizedText('');
    };

    // OCR using Tesseract.js
    const recognizeText = async () => {
        const canvas = canvasRef.current;
        if (!canvas || strokes.length === 0) return;

        setIsRecognizing(true);
        setOcrProgress(0);
        setRecognizedText('');

        try {
            // Convert canvas to data URL for Tesseract
            const imageData = canvas.toDataURL('image/png');

            // Determine language(s) for OCR
            const lang = language === 'TH' ? 'tha+eng' : 'eng';

            const result = await Tesseract.recognize(imageData, lang, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const text = result.data.text.trim();
            setRecognizedText(text || (language === 'TH' ? '(ไม่สามารถอ่านได้ ลองเขียนตัวใหญ่ขึ้น)' : '(Could not read. Try writing larger)'));
        } catch (err) {
            console.error('OCR Error:', err);
            setRecognizedText(language === 'TH' ? '(เกิดข้อผิดพลาด)' : '(Error occurred)');
        }

        setIsRecognizing(false);
    };

    // Append recognized text to notes
    const appendText = () => {
        if (recognizedText && !recognizedText.startsWith('(')) {
            const newValue = value ? `${value}\n${recognizedText}` : recognizedText;
            onTextChange(newValue);
            clearAll();
        }
    };

    return (
        <div style={{ border: '2px solid var(--primary-200)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem',
                background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)',
                flexWrap: 'wrap'
            }}>
                {/* Pen */}
                <button onClick={() => setMode('pen')} title="Pen"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', background: mode === 'pen' ? 'var(--primary-100)' : 'transparent', color: mode === 'pen' ? 'var(--primary-600)' : 'var(--neutral-500)' }}
                ><PenTool size={18} /></button>

                {/* Eraser */}
                <button onClick={() => setMode('eraser')} title="Eraser"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', background: mode === 'eraser' ? '#fef3c7' : 'transparent', color: mode === 'eraser' ? '#d97706' : 'var(--neutral-500)' }}
                ><Eraser size={18} /></button>

                <div style={{ width: '1px', height: '24px', background: 'var(--neutral-200)', margin: '0 0.25rem' }} />

                {/* Pen sizes */}
                {[1.5, 2.5, 4].map((size, i) => (
                    <button key={size} onClick={() => setPenSize(size)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', borderRadius: '8px', cursor: 'pointer', background: penSize === size ? 'var(--neutral-200)' : 'transparent' }}
                    >
                        <div style={{ width: 4 + i * 3, height: 4 + i * 3, borderRadius: '50%', background: '#1e293b' }} />
                    </button>
                ))}

                <div style={{ flex: 1 }} />

                {/* Recognize button */}
                <button onClick={recognizeText} disabled={strokes.length === 0 || isRecognizing} title={language === 'TH' ? 'แปลงเป็นข้อความ' : 'Convert to text'}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.35rem 0.7rem', border: 'none', borderRadius: '8px',
                        cursor: strokes.length > 0 && !isRecognizing ? 'pointer' : 'not-allowed',
                        background: strokes.length > 0 ? '#16a34a' : 'var(--neutral-200)',
                        color: strokes.length > 0 ? 'white' : 'var(--neutral-400)',
                        fontWeight: 600, fontSize: '0.8rem',
                    }}
                >
                    <Wand2 size={14} />
                    {language === 'TH' ? 'แปลง' : 'Convert'}
                </button>

                <div style={{ width: '1px', height: '24px', background: 'var(--neutral-200)', margin: '0 0.25rem' }} />

                {/* Undo */}
                <button onClick={undo} disabled={strokes.length === 0} title="Undo"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: strokes.length > 0 ? 'var(--neutral-600)' : 'var(--neutral-300)' }}
                ><RotateCcw size={18} /></button>

                {/* Clear */}
                <button onClick={clearAll} disabled={strokes.length === 0} title="Clear"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: strokes.length > 0 ? '#ef4444' : 'var(--neutral-300)' }}
                ><Trash2 size={18} /></button>

                {/* Close */}
                <button onClick={onClose} title="Close"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: 'var(--neutral-500)' }}
                ><X size={18} /></button>
            </div>

            {/* Canvas */}
            <div ref={containerRef} style={{ position: 'relative', cursor: mode === 'eraser' ? 'cell' : 'crosshair' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasSize.w}
                    height={canvasSize.h}
                    style={{ width: '100%', height: `${canvasSize.h}px`, display: 'block', touchAction: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onTouchStart={(e) => { e.preventDefault(); handlePointerDown(e); }}
                    onTouchMove={(e) => { e.preventDefault(); handlePointerMove(e); }}
                    onTouchEnd={(e) => { e.preventDefault(); handlePointerUp(e); }}
                />

                {strokes.length === 0 && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--neutral-300)', fontSize: '0.95rem', pointerEvents: 'none', textAlign: 'center' }}>
                        <PenTool size={28} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
                        {language === 'TH' ? 'เขียนที่นี่ แล้วกดปุ่ม "แปลง"' : 'Write here, then press "Convert"'}
                    </div>
                )}
            </div>

            {/* Progress bar during recognition */}
            {isRecognizing && (
                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--neutral-200)', background: '#eff6ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} color="#3b82f6" />
                        <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                            {language === 'TH' ? `กำลังแปลงลายมือ... ${ocrProgress}%` : `Recognizing... ${ocrProgress}%`}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: '#dbeafe', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${ocrProgress}%`, height: '100%', background: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                </div>
            )}

            {/* Recognition Result */}
            {!isRecognizing && recognizedText && (
                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--neutral-200)', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginBottom: '2px' }}>
                            <Type size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                            {language === 'TH' ? 'ผลลัพธ์:' : 'Result:'}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.5 }}>
                            {recognizedText}
                        </div>
                    </div>
                    {!recognizedText.startsWith('(') && (
                        <button onClick={appendText}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                            <Check size={16} />
                            {language === 'TH' ? 'เพิ่มโน้ต' : 'Add to Notes'}
                        </button>
                    )}
                </div>
            )}

            {/* Helper text */}
            {!isRecognizing && !recognizedText && strokes.length > 0 && (
                <div style={{ padding: '0.6rem 0.75rem', borderTop: '1px solid var(--neutral-200)', background: 'var(--neutral-50)', fontSize: '0.8rem', color: 'var(--neutral-400)', textAlign: 'center' }}>
                    {language === 'TH' ? '💡 เขียนเสร็จแล้วกดปุ่ม "แปลง" สีเขียว เพื่อแปลงเป็นข้อความ' : '💡 Done writing? Press the green "Convert" button to recognize text'}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default HandwritingPad;
