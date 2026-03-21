import React from 'react';

// --- FDI Tooth Numbering ---
// Upper Right Q1: 18,17,16,15,14,13,12,11  Upper Left Q2: 21,22,23,24,25,26,27,28
// Lower Left Q3: 31,32,33,34,35,36,37,38   Lower Right Q4: 48,47,46,45,44,43,42,41
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// --- Realistic Tooth SVG Paths ---
const TOOTH_PATHS = {
    upperIncisor: "M25,100 Q50,105 75,100 L75,50 Q80,20 50,0 Q20,20 25,50 Z",
    upperCanine: "M25,100 Q50,110 75,100 L70,50 Q80,10 50,-10 Q20,10 30,50 Z",
    upperPremolar: "M20,100 Q50,90 80,100 L80,55 Q90,20 50,0 Q10,20 20,55 Z",
    upperMolar: "M10,95 Q50,85 90,95 L90,55 Q100,10 70,0 L50,10 L30,0 Q0,10 10,55 Z",
    lowerIncisor: "M25,0 Q50,-5 75,0 L75,50 Q80,80 50,100 Q20,80 25,50 Z",
    lowerCanine: "M25,0 Q50,-10 75,0 L70,50 Q80,90 50,110 Q20,90 30,50 Z",
    lowerPremolar: "M20,0 Q50,10 80,0 L80,45 Q90,80 50,100 Q10,80 20,45 Z",
    lowerMolar: "M10,5 Q50,15 90,5 L90,45 Q100,90 70,100 L50,90 L30,100 Q0,90 10,45 Z"
};

// Surface color map
const STATUS_COLORS = {
    cavity: '#ef4444',
    filled: '#22c55e',
    missing: '#94a3b8',
    healthy: null
};

// Determine tooth type from FDI number
const getToothType = (id) => {
    const toothNum = id % 10; // last digit = tooth position (1-8)
    const quadrant = Math.floor(id / 10); // first digit = quadrant (1-4)
    const isUpper = quadrant <= 2;

    if (toothNum >= 6) return isUpper ? 'upperMolar' : 'lowerMolar';
    if (toothNum >= 4) return isUpper ? 'upperPremolar' : 'lowerPremolar';
    if (toothNum === 3) return isUpper ? 'upperCanine' : 'lowerCanine';
    return isUpper ? 'upperIncisor' : 'lowerIncisor'; // 1-2
};

const getToothWidth = (id) => {
    const toothNum = id % 10;
    if (toothNum >= 6) return 60;     // Molar
    if (toothNum >= 4) return 50;     // Premolar
    if (toothNum === 3) return 46;    // Canine
    if (toothNum === 2) return 44;    // Lateral incisor
    return 46;                        // Central incisor
};

const ToothIcon = ({ id, surfaces, toothStatus, onSurfaceClick, isSelected, onToothClick, isTreated }) => {
    const quadrant = Math.floor(id / 10);
    const isUpper = quadrant <= 2;
    const isMissing = toothStatus === 'missing';

    const toothType = getToothType(id);
    const pathData = TOOTH_PATHS[toothType];
    const width = getToothWidth(id);
    const height = 80;
    const viewBox = (toothType.includes('Canine')) ? (isUpper ? "0 -10 100 120" : "0 0 100 120") : "0 0 100 110";

    // Check if ANY surface has a status
    const hasCavity = Object.values(surfaces).some(s => s === 'cavity');
    const hasFilled = Object.values(surfaces).some(s => s === 'filled');

    const getToothFill = () => {
        if (isMissing) return '#e2e8f0';
        if (isSelected) return 'url(#toothGradientSelected)';
        if (hasCavity && hasFilled) return '#fef3c7';
        if (hasCavity) return '#fee2e2';
        if (hasFilled) return '#dcfce7';
        if (isTreated) return '#ede9fe';
        return 'url(#toothGradient)';
    };

    const getToothStroke = () => {
        if (isMissing) return '#cbd5e1';
        if (hasCavity && hasFilled) return '#f59e0b';
        if (hasCavity) return '#ef4444';
        if (hasFilled) return '#22c55e';
        if (isTreated) return '#8b5cf6';
        return '#94a3b8';
    };

    const getSurfaceColor = (surface) => {
        const status = surfaces[surface];
        return STATUS_COLORS[status] || '#ffffff';
    };

    const getSurfaceStroke = (surface) => {
        const status = surfaces[surface];
        return status && status !== 'healthy' ? 'rgba(0,0,0,0.25)' : '#cbd5e1';
    };

    return (
        <div
            title={`Tooth ${id}`}
            style={{
                display: 'flex',
                flexDirection: isUpper ? 'column' : 'column-reverse',
                alignItems: 'center',
                width: `${width}px`,
                position: 'relative',
                zIndex: isSelected ? 50 : 1,
                flexShrink: 0,
                opacity: isMissing ? 0.5 : 1,
                transition: 'opacity 0.3s'
            }}
        >
            {/* Tooth Number */}
            <span style={{
                fontSize: '11px', fontWeight: 'bold',
                color: isMissing ? '#94a3b8' : '#64748b',
                marginBottom: isUpper ? '2px' : 0,
                marginTop: isUpper ? 0 : '2px',
                opacity: isSelected ? 0.3 : 1,
                textDecoration: isMissing ? 'line-through' : 'none'
            }}>{id}</span>

            {/* Tooth Body */}
            <div
                onClick={(e) => { e.stopPropagation(); onToothClick(id); }}
                style={{
                    cursor: 'pointer',
                    marginLeft: '-2px', marginRight: '-2px',
                    filter: isSelected
                        ? 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))'
                        : isMissing
                            ? 'grayscale(1)'
                            : 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    zIndex: 2,
                    opacity: isSelected ? 0.8 : 1
                }}
            >
                <svg width={width} height={height} viewBox={viewBox} style={{ display: 'block', overflow: 'visible' }}>
                    <defs>
                        <linearGradient id="toothGradient" x1="20%" y1="0%" x2="80%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="20%" stopColor="#f8fafc" />
                            <stop offset="90%" stopColor="#e2e8f0" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                        </linearGradient>
                        <linearGradient id="toothGradientSelected" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#eff6ff" />
                            <stop offset="100%" stopColor="#bfdbfe" />
                        </linearGradient>
                    </defs>
                    <path d={pathData}
                        fill={getToothFill()}
                        stroke={getToothStroke()}
                        strokeWidth={hasCavity || hasFilled ? '2' : '1'}
                    />
                    {/* Missing "X" overlay */}
                    {isMissing && (
                        <>
                            <line x1="20" y1="15" x2="80" y2="90" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                            <line x1="80" y1="15" x2="20" y2="90" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                        </>
                    )}
                    {/* Status indicator badge */}
                    {!isMissing && (hasCavity || hasFilled) && (
                        <g>
                            {hasCavity && (
                                <g>
                                    <circle cx={hasFilled ? "30" : "50"} cy={isUpper ? "75" : "30"} r="8" fill="#ef4444" stroke="white" strokeWidth="2" />
                                    <text x={hasFilled ? "30" : "50"} y={isUpper ? "79" : "34"} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">C</text>
                                </g>
                            )}
                            {hasFilled && (
                                <g>
                                    <circle cx={hasCavity ? "70" : "50"} cy={isUpper ? "75" : "30"} r="8" fill="#22c55e" stroke="white" strokeWidth="2" />
                                    <text x={hasCavity ? "70" : "50"} y={isUpper ? "79" : "34"} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">F</text>
                                </g>
                            )}
                        </g>
                    )}
                </svg>
            </div>

            {/* Clinical Control Pad (Center Overlay) */}
            {!isMissing && (
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: `translate(-50%, -50%) ${isSelected ? 'scale(1)' : 'scale(0.5)'}`,
                    opacity: isSelected ? 1 : 0,
                    pointerEvents: isSelected ? 'auto' : 'none',
                    zIndex: 100,
                    background: '#ffffff',
                    borderRadius: '50%',
                    width: '64px', height: '64px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} className="surface-controls">
                    <svg width="64" height="64" viewBox="0 0 100 100" style={{ cursor: 'pointer', overflow: 'visible' }}>
                        {/* Occlusal/Incisal (Center) */}
                        <circle cx="50" cy="50" r="14"
                            fill={getSurfaceColor('O')}
                            stroke={getSurfaceStroke('O')} strokeWidth="1.5"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, 'O'); }}
                            className="hover-surface-center"
                        >
                            <title>Occlusal / Incisal</title>
                        </circle>
                        {/* Top Segment */}
                        <path d="M 32,32 L 20,20 A 42,42 0 0 1 80,20 L 68,32 A 20,20 0 0 0 32,32 z"
                            fill={getSurfaceColor(isUpper ? 'B' : 'L')}
                            stroke={getSurfaceStroke(isUpper ? 'B' : 'L')} strokeWidth="1.5"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, isUpper ? 'B' : 'L'); }}
                            className="hover-surface"
                        >
                            <title>{isUpper ? 'Buccal (Cheek)' : 'Lingual (Tongue)'}</title>
                        </path>
                        {/* Bottom Segment */}
                        <path d="M 32,68 L 20,80 A 42,42 0 0 0 80,80 L 68,68 A 20,20 0 0 1 32,68 z"
                            fill={getSurfaceColor(isUpper ? 'L' : 'B')}
                            stroke={getSurfaceStroke(isUpper ? 'L' : 'B')} strokeWidth="1.5"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, isUpper ? 'L' : 'B'); }}
                            className="hover-surface"
                        >
                            <title>{isUpper ? 'Lingual (Tongue)' : 'Buccal (Cheek)'}</title>
                        </path>
                        {/* Left Segment (Mesial) */}
                        <path d="M 32,32 L 32,68 L 20,80 A 42,42 0 0 1 20,20 L 32,32 z"
                            fill={getSurfaceColor('M')}
                            stroke={getSurfaceStroke('M')} strokeWidth="1.5"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, 'M'); }}
                            className="hover-surface"
                        >
                            <title>Mesial (Front)</title>
                        </path>
                        {/* Right Segment (Distal) */}
                        <path d="M 68,32 L 68,68 L 80,80 A 42,42 0 0 0 80,20 L 68,32 z"
                            fill={getSurfaceColor('D')}
                            stroke={getSurfaceStroke('D')} strokeWidth="1.5"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, 'D'); }}
                            className="hover-surface"
                        >
                            <title>Distal (Back)</title>
                        </path>
                    </svg>
                </div>
            )}
            <style>{`
                .hover-surface:hover { fill: #eff6ff; stroke: #2563eb; stroke-width: 2px; }
                .hover-surface-center:hover { fill: #eff6ff; stroke: #2563eb; stroke-width: 2px; }
            `}</style>
        </div>
    );
};

const DigitalToothChart = ({ onToothSelect, selectedTeeth = [], toothChart = {}, treatedTeeth = [] }) => {

    const handleSurfaceClick = (id, surface) => {
        if (onToothSelect) onToothSelect({ id, surface });
    };

    const handleToothClick = (id) => {
        if (onToothSelect) onToothSelect(id);
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem',
            background: 'white', borderRadius: '24px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            border: '1px solid #f1f5f9',
            alignItems: 'center',
            maxWidth: '100%',
            overflowX: 'auto',
            minHeight: '340px'
        }}>
            <div style={{ minWidth: 'fit-content', padding: '0 1rem' }}>
                {/* Upper Arch */}
                <div style={{
                    position: 'relative',
                    padding: '2rem 1rem 0.5rem 1rem',
                    borderBottom: '1px solid #e2e8f0',
                    zIndex: 2,
                    display: 'flex', justifyContent: 'center'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '70%', background: 'linear-gradient(180deg, #fce7f3 0%, rgba(255,255,255,0) 100%)', borderRadius: '100px 100px 0 0', zIndex: 0 }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2px' }}>
                        {UPPER_TEETH.map(id => (
                            <ToothIcon key={id} id={id}
                                surfaces={toothChart[id]?.surfaces || {}}
                                toothStatus={toothChart[id]?.status}
                                isSelected={selectedTeeth.includes(id)}
                                isTreated={treatedTeeth.includes(id)}
                                onSurfaceClick={handleSurfaceClick}
                                onToothClick={handleToothClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Lower Arch */}
                <div style={{
                    position: 'relative',
                    padding: '0.5rem 1rem 2rem 1rem',
                    zIndex: 2,
                    display: 'flex', justifyContent: 'center'
                }}>
                    <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '70%', background: 'linear-gradient(0deg, #fce7f3 0%, rgba(255,255,255,0) 100%)', borderRadius: '0 0 100px 100px', zIndex: 0 }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '2px' }}>
                        {LOWER_TEETH.map(id => (
                            <ToothIcon key={id} id={id}
                                surfaces={toothChart[id]?.surfaces || {}}
                                toothStatus={toothChart[id]?.status}
                                isSelected={selectedTeeth.includes(id)}
                                isTreated={treatedTeeth.includes(id)}
                                onSurfaceClick={handleSurfaceClick}
                                onToothClick={handleToothClick}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: '50%' }}></div> Cavity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: '50%' }}></div> Filled</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#94a3b8', borderRadius: '50%' }}></div> Missing</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#8b5cf6', borderRadius: '50%' }}></div> Treated</div>
            </div>
        </div>
    );
};

export default DigitalToothChart;
