import React from 'react';

// --- FDI Tooth Numbering ---
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// --- High-Fidelity Anatomical Tooth SVG Paths ---
// These paths are crafted to look more like real teeth in a professional dental chart.
const TOOTH_PATHS = {
    // Upper Arch
    upperMolar: "M10,95 Q5,85 8,45 Q12,10 30,5 L50,15 L70,5 Q88,10 92,45 Q95,85 90,95 Q50,105 10,95 Z",
    upperPremolar: "M15,95 Q10,80 15,40 Q20,5 50,5 Q80,5 85,40 Q90,80 85,95 Q50,105 15,95 Z",
    upperCanine: "M25,95 Q20,70 25,35 Q30,-5 50,-15 Q70,-5 75,35 Q80,70 75,95 Q50,110 25,95 Z",
    upperIncisor: "M15,95 Q10,75 12,35 Q15,0 50,0 Q85,0 88,35 Q90,75 85,95 Q50,105 15,95 Z",
    // Lower Arch
    lowerMolar: "M10,5 Q5,15 8,55 Q12,90 30,95 L50,85 L70,95 Q88,90 92,55 Q95,15 90,5 Q50,-5 10,5 Z",
    lowerPremolar: "M15,5 Q10,20 15,60 Q20,95 50,95 Q80,95 85,60 Q90,20 85,5 Q50,-5 15,5 Z",
    lowerCanine: "M25,5 Q20,30 25,65 Q30,105 50,115 Q70,105 75,65 Q80,30 75,5 Q50,-10 25,5 Z",
    lowerIncisor: "M20,5 Q15,25 18,65 Q22,100 50,100 Q78,100 82,65 Q85,25 80,5 Q50,-5 20,5 Z"
};

const STATUS_COLORS = {
    cavity: { main: '#ef4444', light: '#fee2e2', dark: '#991b1b' },          // Red
    filled: { main: '#3b82f6', light: '#eff6ff', dark: '#1e40af' },          // Blue
    extracted: { main: '#b91c1c', light: '#fef2f2', dark: '#7f1d1d' },       // Dark Red
    rootCanal: { main: '#f59e0b', light: '#fffbeb', dark: '#b45309' },       // Orange
    crown: { main: '#8b5cf6', light: '#f5f3ff', dark: '#5b21b6' },           // Purple
    denture: { main: '#0ea5e9', light: '#f0f9ff', dark: '#0369a1' },         // Teal
    implant: { main: '#22c55e', light: '#f0fdf4', dark: '#15803d' },         // Green
    sealant: { main: '#10b981', light: '#ecfdf5', dark: '#047857' },         // Light Green
    scaling: { main: '#78350f', light: '#fefce8', dark: '#451a03' },         // Brown
    abscess: { main: '#dc2626', light: '#fef2f2', dark: '#991b1b' },         // Red
    broken: { main: '#ea580c', light: '#fff7ed', dark: '#9a3412' },          // Orange
    bridge: { main: '#2563eb', light: '#eff6ff', dark: '#1d4ed8' },          // Light Blue (diff from filled)
    missing: { main: '#b91c1c', light: '#fef2f2', dark: '#7f1d1d' },         // Alias for extracted in legacy
    treated: { main: '#8b5cf6', light: '#ede9fe', dark: '#5b21b6' },         
    healthy: null
};

const getToothWidth = (id) => {
    const toothNum = id % 10;
    if (toothNum >= 6) return 58;    // Molar
    if (toothNum >= 4) return 48;    // Premolar
    if (toothNum === 3) return 44;   // Canine
    if (toothNum === 2) return 40;   // Lateral incisor
    return 44;                       // Central incisor
};

const getAnatomicalType = (id) => {
    const toothNum = id % 10;
    const quadrant = Math.floor(id / 10);
    const isUpper = quadrant <= 2;
    if (toothNum >= 6) return isUpper ? 'upperMolar' : 'lowerMolar';
    if (toothNum >= 4) return isUpper ? 'upperPremolar' : 'lowerPremolar';
    if (toothNum === 3) return isUpper ? 'upperCanine' : 'lowerCanine';
    return isUpper ? 'upperIncisor' : 'lowerIncisor';
};

const ToothIcon = ({ id, surfaces, toothStatus, onSurfaceClick, isSelected, onToothClick, isTreated }) => {
    const quadrant = Math.floor(id / 10);
    const isExtracted = toothStatus === 'extracted' || toothStatus === 'missing';
    const isDenture = toothStatus === 'denture';
    const isImplant = toothStatus === 'implant';
    const type = getAnatomicalType(id);
    const pathData = TOOTH_PATHS[type];
    const width = getToothWidth(id);
    
    // Status visual logic
    const hasCavity = Object.values(surfaces).some(s => s === 'cavity');
    const hasFilled = Object.values(surfaces).some(s => s === 'filled');

    const getSurfaceColor = (surface, isStroke = false) => {
        const status = surfaces[surface];
        if (!status || status === 'healthy') return isStroke ? '#cbd5e1' : 'transparent';
        if (!STATUS_COLORS[status]) return isStroke ? '#cbd5e1' : 'transparent';
        return isStroke ? STATUS_COLORS[status].dark : STATUS_COLORS[status].main;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: isUpper ? 'column' : 'column-reverse',
            alignItems: 'center',
            width: `${width}px`,
            position: 'relative',
            zIndex: isSelected ? 50 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            {/* FDI Number Badge */}
            <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                background: isSelected ? 'var(--primary-50)' : 'transparent',
                padding: '2px 6px',
                borderRadius: '10px',
                marginBottom: isUpper ? '8px' : 0,
                marginTop: isUpper ? 0 : '8px',
                transition: 'all 0.2s',
                opacity: 0.9
            }}>{id}</span>

            {/* Tooth Body Wrapper */}
            <div 
                onClick={(e) => { e.stopPropagation(); onToothClick(id); }}
                style={{
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isSelected ? 'scale(1.15) translateY(' + (isUpper ? '5px' : '-5px') + ')' : 'scale(1)',
                    filter: isExtracted ? 'opacity(0.3)' : isSelected ? 'drop-shadow(0 10px 15px rgba(13, 148, 136, 0.2))' : 'none'
                }}
            >
                <svg width={width} height="85" viewBox="0 -15 100 130" style={{ display: 'block', overflow: 'visible' }}>
                    <defs>
                        <radialGradient id={`gloss-${id}`} cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#e2e8f0" />
                        </radialGradient>
                    </defs>

                    {/* Main Enamel Body */}
                    <path d={pathData} 
                        fill={`url(#gloss-${id})`}
                        stroke={isSelected ? 'var(--primary-500)' : '#cbd5e1'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        style={{ transition: 'all 0.3s' }}
                    />

                    {/* Integrated Indicators */}
                    <g opacity="0.9">
                        {hasCavity && <circle cx="50" cy={isUpper ? "85" : "15"} r="8" fill={STATUS_COLORS.cavity.main} stroke="white" strokeWidth="2" />}
                        {hasFilled && <circle cx={hasCavity ? "30" : "50"} cy={isUpper ? "85" : "15"} r="8" fill={STATUS_COLORS.filled.main} stroke="white" strokeWidth="2" />}
                        {isTreated && <circle cx={hasCavity || hasFilled ? "70" : "50"} cy={isUpper ? "85" : "15"} r="8" fill={STATUS_COLORS.treated.main} stroke="white" strokeWidth="2" />}
                    </g>

                    {/* Missing/Extracted Indicator (Red X) */}
                    {isExtracted && (
                        <g stroke="#dc2626" strokeWidth="8" strokeLinecap="round" opacity="0.8">
                            <path d="M20,20 L80,110" />
                            <path d="M80,20 L20,110" />
                        </g>
                    )}
                    {/* Denture Indicator (P within a colored box) */}
                    {isDenture && (
                        <g opacity="0.9">
                            <rect x="25" y={isUpper ? "50" : "30"} width="50" height="50" fill="white" stroke={STATUS_COLORS.denture.main} strokeWidth="3" rx="8" />
                            <text x="50" y={isUpper ? "83" : "63"} fill={STATUS_COLORS.denture.main} fontSize="40" fontWeight="bold" textAnchor="middle">P</text>
                        </g>
                    )}
                    {/* Implant Indicator (I within green box) */}
                    {isImplant && (
                        <g opacity="0.9">
                            <rect x="25" y={isUpper ? "50" : "30"} width="50" height="50" fill="white" stroke={STATUS_COLORS.implant.main} strokeWidth="3" rx="8" />
                            <text x="50" y={isUpper ? "83" : "63"} fill={STATUS_COLORS.implant.main} fontSize="40" fontWeight="bold" textAnchor="middle">I</text>
                        </g>
                    )}
                </svg>
            </div>

            {/* Premium Surface Selection Hub */}
            {isSelected && !isExtracted && (
                <div style={{
                    position: 'absolute',
                    top: isUpper ? '100%' : 'auto',
                    bottom: isUpper ? 'auto' : '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    padding: '8px',
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #f1f5f9',
                    marginTop: isUpper ? '10px' : 0,
                    marginBottom: isUpper ? 0 : '10px',
                    animation: 'lp-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                    <svg width="84" height="84" viewBox="0 0 100 100" style={{ cursor: 'pointer', overflow: 'visible' }}>
                        {/* Surface Layout - Anatomical segments */}
                        {/* Center (Occlusal/Incisal) */}
                        <circle cx="50" cy="50" r="16"
                            fill={getSurfaceColor('O')} stroke={getSurfaceColor('O', true)} strokeWidth="2"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, 'O'); }}
                            className="surface-part"
                        />
                        {/* Buccal/Labial (Top) */}
                        <path d="M 30,30 L 15,15 A 45,45 0 0 1 85,15 L 70,30 A 25,25 0 0 0 30,30 z"
                            fill={getSurfaceColor(isUpper ? 'B' : 'L')} stroke={getSurfaceColor(isUpper ? 'B' : 'L', true)} strokeWidth="2"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, isUpper ? 'B' : 'L'); }}
                            className="surface-part"
                        />
                        {/* Lingual/Palatal (Bottom) */}
                        <path d="M 30,70 L 15,85 A 45,45 0 0 0 85,85 L 70,70 A 25,25 0 0 1 30,70 z"
                            fill={getSurfaceColor(isUpper ? 'L' : 'B')} stroke={getSurfaceColor(isUpper ? 'L' : 'B', true)} strokeWidth="2"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, isUpper ? 'L' : 'B'); }}
                            className="surface-part"
                        />
                        {/* Mesial (Left/Right depending on quadrant) */}
                        <path d="M 30,30 L 15,15 A 45,45 0 0 0 15,85 L 30,70 A 25,25 0 0 1 30,30 z"
                            fill={getSurfaceColor('M')} stroke={getSurfaceColor('M', true)} strokeWidth="2"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, 'M'); }}
                            className="surface-part"
                        />
                        {/* Distal */}
                        <path d="M 70,30 L 85,15 A 45,45 0 0 1 85,85 L 70,70 A 25,25 0 0 0 70,30 z"
                            fill={getSurfaceColor('D')} stroke={getSurfaceColor('D', true)} strokeWidth="2"
                            onClick={(e) => { e.stopPropagation(); onSurfaceClick(id, 'D'); }}
                            className="surface-part"
                        />
                    </svg>
                </div>
            )}
            <style>{`
                .surface-part { transition: all 0.2s; opacity: 0.85; }
                .surface-part:hover { opacity: 1; filter: brightness(1.1); transform: scale(1.05); }
                @keyframes lp-pop-in {
                    from { opacity: 0; transform: translateX(-50%) scale(0.8); }
                    to { opacity: 1; transform: translateX(-50%) scale(1); }
                }
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

    // --- Z-Index Management ---
    // Detect which row has the selected tooth to elevate it
    const selectedTooth = selectedTeeth[0];
    const isUpperSelected = selectedTooth && selectedTooth < 30;
    const isLowerSelected = selectedTooth && selectedTooth >= 30;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: '3rem', padding: '2.5rem 1rem 1rem 1rem',
            background: 'linear-gradient(to bottom, #ffffff 0%, #f4f7fb 100%)', // matching the light blue tint in image
            alignItems: 'center',
            maxWidth: '100%',
            overflowX: 'auto',
            minHeight: '420px',
        }}>
            <div style={{ minWidth: 'fit-content', padding: '0 1rem', position: 'relative' }}>
                {/* Horizontal Divider Line */}
                <div style={{ 
                    position: 'absolute', top: '50%', left: '-20px', right: '-20px', 
                    height: '1px', background: '#e2e8f0', zIndex: 0 
                }}></div>

                <div style={{
                    position: 'relative',
                    padding: '0 1rem 1.5rem 1rem',
                    display: 'flex', justifyContent: 'center',
                    gap: '8px',
                    // ELEVATE active row
                    zIndex: isUpperSelected ? 100 : 1
                }}>

                    
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
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

                <div style={{
                    position: 'relative',
                    padding: '1.5rem 1rem 0 1rem',
                    display: 'flex', justifyContent: 'center',
                    gap: '8px',
                    // ELEVATE active row
                    zIndex: isLowerSelected ? 100 : 1
                }}>


                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
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

            {/* Premium Clinical Legend */}
            <div style={{ 
                display: 'flex', gap: '1.5rem', justifyContent: 'flex-start', alignItems: 'center',
                width: '100%',
                fontSize: '0.85rem', fontWeight: 500, color: '#64748b', 
                padding: '1rem',
                borderTop: '1px solid #e2e8f0',
                marginTop: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, background: '#bfdbfe', borderRadius: '4px' }}></div> 
                    ข้อมูลจากครั้งก่อน
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '1.2rem', lineHeight: '14px' }}>×</div> 
                    ถอนฟันแล้ว
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, background: 'white', border: '1.5px solid #0ea5e9', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>P</div> 
                    ฟันปลอม (P)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, background: 'white', border: '1.5px solid #22c55e', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>I</div> 
                    รากฟันเทียม (I)
                </div>
            </div>
        </div>
    );
};

export default DigitalToothChart;
