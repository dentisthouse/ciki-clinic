import React, { useState, useRef, useEffect } from 'react';
import { 
    Maximize2, 
    RotateCw, 
    Download, 
    Upload, 
    Palette,
    Edit3,
    Eraser,
    Circle,
    Square,
    Type,
    Save,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AdvancedToothChart = ({ 
    patientId, 
    toothChart = {}, 
    onToothSelect, 
    onChartUpdate,
    readOnly = false 
}) => {
    const { language } = useLanguage();
    const canvasRef = useRef(null);
    const [selectedTooth, setSelectedTooth] = useState(null);
    const [selectedTool, setSelectedTool] = useState('select');
    const [selectedColor, setSelectedColor] = useState('#ff6b6b');
    const [annotations, setAnnotations] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [zoom, setZoom] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState([]);

    // ข้อมูลฟันแบบละเอียด
    const teethData = {
        upper: {
            right: [18, 17, 16, 15, 14, 13, 12, 11],
            left: [21, 22, 23, 24, 25, 26, 27, 28]
        },
        lower: {
            right: [48, 47, 46, 45, 44, 43, 42, 41],
            left: [31, 32, 33, 34, 35, 36, 37, 38]
        }
    };

    // สถานะฟันแบบละเอียด
    const toothConditions = {
        healthy: { color: '#ffffff', label: { TH: 'สมบูรณ์', EN: 'Healthy' } },
        decayed: { color: '#ff6b6b', label: { TH: 'ผุ', EN: 'Decayed' } },
        filled: { color: '#4ecdc4', label: { TH: 'อุด', EN: 'Filled' } },
        missing: { color: '#95a5a6', label: { TH: 'สูญ', EN: 'Missing' } },
        crown: { color: '#f39c12', label: { TH: 'ครอวน์', EN: 'Crown' } },
        root: { color: '#9b59b6', label: { TH: 'รากฟัน', EN: 'Root Canal' } },
        implant: { color: '#3498db', label: { TH: 'อิมแพลนต์', EN: 'Implant' } },
        bridge: { color: '#e74c3c', label: { TH: 'บริดจ์', EN: 'Bridge' } },
        denture: { color: '#f1c40f', label: { TH: 'เคลือบฟัน', EN: 'Denture' } },
        calculus: { color: '#d35400', label: { TH: 'หินปูน', EN: 'Calculus' } }
    };

    // เครื่องมือวาด
    const drawingTools = {
        select: { icon: Edit3, label: { TH: 'เลือก', EN: 'Select' } },
        brush: { icon: Edit3, label: { TH: 'แปรง', EN: 'Brush' } },
        eraser: { icon: Eraser, label: { TH: 'ลบ', EN: 'Eraser' } },
        circle: { icon: Circle, label: { TH: 'วงกลม', EN: 'Circle' } },
        rectangle: { icon: Square, label: { TH: 'สี่เหลี่ยม', EN: 'Rectangle' } },
        text: { icon: Type, label: { TH: 'ข้อความ', EN: 'Text' } }
    };

    // สีที่ใช้วาด
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12', '#9b59b6', '#2ecc71', '#e74c3c', '#95a5a6'];

    useEffect(() => {
        drawToothChart();
    }, [toothChart, selectedTooth, zoom, annotations]);

    const drawToothChart = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Apply zoom
        ctx.save();
        ctx.scale(zoom, zoom);
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width / zoom, height / zoom);
        
        // Draw teeth
        drawTeeth(ctx);
        
        // Draw annotations
        drawAnnotations(ctx);
        
        ctx.restore();
    };

    const drawTeeth = (ctx) => {
        const toothWidth = 40;
        const toothHeight = 50;
        const spacing = 5;
        
        // Upper jaw
        drawJaw(ctx, teethData.upper, toothWidth, toothHeight, spacing, 50, true);
        
        // Lower jaw
        drawJaw(ctx, teethData.lower, toothWidth, toothHeight, spacing, 300, false);
    };

    const drawJaw = (ctx, jawData, toothWidth, toothHeight, spacing, startY, isUpper) => {
        const centerX = 400;
        
        // Draw right side
        jawData.right.forEach((tooth, index) => {
            const x = centerX - (index + 1) * (toothWidth + spacing);
            drawSingleTooth(ctx, tooth, x, startY, toothWidth, toothHeight, isUpper);
        });
        
        // Draw left side
        jawData.left.forEach((tooth, index) => {
            const x = centerX + index * (toothWidth + spacing) + toothWidth;
            drawSingleTooth(ctx, tooth, x, startY, toothWidth, toothHeight, isUpper);
        });
    };

    const drawSingleTooth = (ctx, toothNumber, x, y, width, height, isUpper) => {
        const condition = toothChart[toothNumber]?.condition || 'healthy';
        const conditionData = toothConditions[condition];
        
        // Draw tooth shape
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        
        // Fill with condition color
        ctx.fillStyle = conditionData.color;
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = selectedTooth === toothNumber ? '#2563eb' : '#dee2e6';
        ctx.lineWidth = selectedTooth === toothNumber ? 3 : 1;
        ctx.stroke();
        
        // Draw tooth number
        ctx.fillStyle = condition === 'missing' ? '#ffffff' : '#2c3e50';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(toothNumber, x + width / 2, y + height / 2);
        
        // Draw surfaces (if not missing)
        if (condition !== 'missing') {
            drawToothSurfaces(ctx, x, y, width, height, toothNumber);
        }
    };

    const drawToothSurfaces = (ctx, x, y, width, height, toothNumber) => {
        const surfaces = toothChart[toothNumber]?.surfaces || {};
        const surfaceColors = {
            O: '#ff6b6b', // Occlusal
            B: '#4ecdc4', // Buccal
            L: '#45b7d1', // Lingual
            M: '#f39c12', // Mesial
            D: '#9b59b6', // Distal
            I: '#2ecc71'  // Incisal
        };
        
        // Draw surface indicators
        Object.entries(surfaces).forEach(([surface, hasSurface]) => {
            if (hasSurface) {
                ctx.fillStyle = surfaceColors[surface] || '#ff6b6b';
                ctx.globalAlpha = 0.6;
                
                // Simple surface visualization
                switch (surface) {
                    case 'O': // Occlusal
                        ctx.fillRect(x + width * 0.3, y + height * 0.1, width * 0.4, height * 0.3);
                        break;
                    case 'B': // Buccal
                        ctx.fillRect(x + width * 0.8, y + height * 0.2, width * 0.15, height * 0.6);
                        break;
                    case 'L': // Lingual
                        ctx.fillRect(x + width * 0.05, y + height * 0.2, width * 0.15, height * 0.6);
                        break;
                    case 'M': // Mesial
                        ctx.fillRect(x + width * 0.1, y + height * 0.3, width * 0.2, height * 0.4);
                        break;
                    case 'D': // Distal
                        ctx.fillRect(x + width * 0.7, y + height * 0.3, width * 0.2, height * 0.4);
                        break;
                }
                
                ctx.globalAlpha = 1;
            }
        });
    };

    const drawAnnotations = (ctx) => {
        annotations.forEach(annotation => {
            ctx.strokeStyle = annotation.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            if (annotation.type === 'path') {
                annotation.points.forEach((point, index) => {
                    if (index === 0) {
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                });
                ctx.stroke();
            } else if (annotation.type === 'text') {
                ctx.fillStyle = annotation.color;
                ctx.font = '14px Arial';
                ctx.fillText(annotation.text, annotation.x, annotation.y);
            }
        });
    };

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        // Check if click is on a tooth
        const clickedTooth = getToothAtPosition(x, y);
        
        if (clickedTooth) {
            setSelectedTooth(clickedTooth);
            if (onToothSelect) {
                onToothSelect(clickedTooth);
            }
        }
    };

    const getToothAtPosition = (x, y) => {
        const toothWidth = 40;
        const toothHeight = 50;
        const spacing = 5;
        
        // Check upper jaw
        for (const tooth of [...teethData.upper.right, ...teethData.upper.left]) {
            const toothX = getToothPosition(tooth, toothWidth, spacing, 50);
            const toothY = 50;
            
            if (x >= toothX && x <= toothX + toothWidth && y >= toothY && y <= toothY + toothHeight) {
                return tooth;
            }
        }
        
        // Check lower jaw
        for (const tooth of [...teethData.lower.right, ...teethData.lower.left]) {
            const toothX = getToothPosition(tooth, toothWidth, spacing, 300);
            const toothY = 300;
            
            if (x >= toothX && x <= toothX + toothWidth && y >= toothY && y <= toothY + toothHeight) {
                return tooth;
            }
        }
        
        return null;
    };

    const getToothPosition = (toothNumber, toothWidth, spacing, startY) => {
        const centerX = 400;
        
        if (toothNumber >= 11 && toothNumber <= 18) {
            // Upper right
            const index = 18 - toothNumber;
            return centerX - (index + 1) * (toothWidth + spacing);
        } else if (toothNumber >= 21 && toothNumber <= 28) {
            // Upper left
            const index = toothNumber - 21;
            return centerX + index * (toothWidth + spacing) + toothWidth;
        } else if (toothNumber >= 41 && toothNumber <= 48) {
            // Lower right
            const index = 48 - toothNumber;
            return centerX - (index + 1) * (toothWidth + spacing);
        } else if (toothNumber >= 31 && toothNumber <= 38) {
            // Lower left
            const index = toothNumber - 31;
            return centerX + index * (toothWidth + spacing) + toothWidth;
        }
        
        return 0;
    };

    const updateToothCondition = (toothNumber, condition) => {
        const updatedChart = {
            ...toothChart,
            [toothNumber]: {
                ...toothChart[toothNumber],
                condition,
                updatedAt: new Date().toISOString()
            }
        };
        
        if (onChartUpdate) {
            onChartUpdate(updatedChart);
        }
        
        // Add to history
        addToHistory(updatedChart);
    };

    const addToHistory = (chart) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(chart)));
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const previousChart = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            if (onChartUpdate) {
                onChartUpdate(previousChart);
            }
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextChart = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            if (onChartUpdate) {
                onChartUpdate(nextChart);
            }
        }
    };

    const exportChart = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `tooth-chart-${patientId}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="advanced-tooth-chart" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ 
                padding: '1rem', 
                background: 'var(--neutral-50)', 
                borderBottom: '1px solid var(--neutral-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                {/* Tools */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {Object.entries(drawingTools).map(([tool, data]) => (
                        <button
                            key={tool}
                            onClick={() => setSelectedTool(tool)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: selectedTool === tool ? 'var(--primary-600)' : 'var(--neutral-200)',
                                background: selectedTool === tool ? 'var(--primary-50)' : 'white',
                                cursor: 'pointer'
                            }}
                            title={data.label[language]}
                        >
                            <data.icon size={16} />
                        </button>
                    ))}
                </div>

                {/* Colors */}
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {colors.map(color => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: selectedColor === color ? '2px solid #2563eb' : '1px solid var(--neutral-200)',
                                background: color,
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={undo} disabled={historyIndex <= 0} style={{ padding: '0.5rem' }}>
                        <Undo size={16} />
                    </button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} style={{ padding: '0.5rem' }}>
                        <Redo size={16} />
                    </button>
                    <button onClick={() => setZoom(Math.min(zoom * 1.2, 3))} style={{ padding: '0.5rem' }}>
                        <ZoomIn size={16} />
                    </button>
                    <button onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))} style={{ padding: '0.5rem' }}>
                        <ZoomOut size={16} />
                    </button>
                    <button onClick={exportChart} style={{ padding: '0.5rem' }}>
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div style={{ position: 'relative', overflow: 'auto', maxHeight: '600px' }}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    onClick={handleCanvasClick}
                    style={{ cursor: selectedTool === 'select' ? 'pointer' : 'crosshair' }}
                />
            </div>

            {/* Tooth Details */}
            {selectedTooth && (
                <div style={{ 
                    padding: '1rem', 
                    background: 'var(--neutral-50)', 
                    borderTop: '1px solid var(--neutral-200)' 
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ margin: 0 }}>
                                {language === 'TH' ? 'ฟันหมายเลข' : 'Tooth'} {selectedTooth}
                            </h4>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                {language === 'TH' ? 'สถานะ:' : 'Status:'} {toothConditions[toothChart[selectedTooth]?.condition || 'healthy'].label[language]}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {Object.entries(toothConditions).map(([condition, data]) => (
                                <button
                                    key={condition}
                                    onClick={() => updateToothCondition(selectedTooth, condition)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        border: '1px solid',
                                        borderColor: toothChart[selectedTooth]?.condition === condition ? 'var(--primary-600)' : 'var(--neutral-200)',
                                        background: data.color,
                                        color: condition === 'missing' ? 'white' : 'var(--neutral-900)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
                                    }}
                                >
                                    {data.label[language]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedToothChart;
