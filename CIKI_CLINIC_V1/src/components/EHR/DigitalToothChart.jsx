import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

// --- FDI Tooth Numbering ---
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const UPPER_PRIMARY_TEETH = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const LOWER_PRIMARY_TEETH = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// --- Crown SVG Paths (viewBox 0 0 100 100) ---
const CROWN_PATHS = {
    upperMolar:    "M10,95 Q5,85 8,45 Q12,10 30,5 L50,15 L70,5 Q88,10 92,45 Q95,85 90,95 Q50,105 10,95 Z",
    upperPremolar: "M15,95 Q10,80 15,40 Q20,5 50,5 Q80,5 85,40 Q90,80 85,95 Q50,105 15,95 Z",
    upperCanine:   "M25,95 Q20,70 25,35 Q30,-5 50,-15 Q70,-5 75,35 Q80,70 75,95 Q50,110 25,95 Z",
    upperIncisor:  "M15,95 Q10,75 12,35 Q15,0 50,0 Q85,0 88,35 Q90,75 85,95 Q50,105 15,95 Z",
    lowerMolar:    "M10,5 Q5,15 8,55 Q12,90 30,95 L50,85 L70,95 Q88,90 92,55 Q95,15 90,5 Q50,-5 10,5 Z",
    lowerPremolar: "M15,5 Q10,20 15,60 Q20,95 50,95 Q80,95 85,60 Q90,20 85,5 Q50,-5 15,5 Z",
    lowerCanine:   "M25,5 Q20,30 25,65 Q30,105 50,115 Q70,105 75,65 Q80,30 75,5 Q50,-10 25,5 Z",
    lowerIncisor:  "M20,5 Q15,25 18,65 Q22,100 50,100 Q78,100 82,65 Q85,25 80,5 Q50,-5 20,5 Z"
};

// --- Root SVG Paths (viewBox 0 0 100 80) ---
// Upper roots: roots go DOWN from crown (drawn top-to-bottom in their own SVG)
// Lower roots: roots go UP from crown (drawn bottom-to-top in their own SVG)
const ROOT_PATHS = {
    // Upper roots — drawn from top(0) down to bottom(80), roots taper downward
    upperMolar: [
        // 3 roots for molars: mesial-buccal, palatal, distal-buccal
        "M20,0 Q18,5 22,30 Q24,55 28,70 Q30,78 32,80 L26,80 Q22,70 18,50 Q14,30 16,0 Z",
        "M42,0 Q44,10 48,35 Q50,55 50,75 Q50,80 50,80 L46,80 Q44,60 42,35 Q40,15 38,0 Z",
        "M68,0 Q70,5 74,30 Q76,50 78,70 Q80,78 82,80 L76,80 Q74,65 72,45 Q70,25 66,0 Z",
    ],
    upperPremolar: [
        "M30,0 Q28,10 30,35 Q32,55 35,72 Q36,78 38,80 L32,80 Q28,60 26,35 Q24,15 26,0 Z",
        "M62,0 Q64,10 66,35 Q68,55 70,72 Q72,78 74,80 L68,80 Q66,60 64,35 Q62,15 60,0 Z",
    ],
    upperCanine: [
        "M38,0 Q36,10 38,35 Q40,55 44,72 Q48,85 50,90 Q52,85 56,72 Q60,55 62,35 Q64,10 62,0 Z",
    ],
    upperIncisor: [
        "M38,0 Q36,8 37,30 Q38,50 42,68 Q46,82 50,88 Q54,82 58,68 Q62,50 63,30 Q64,8 62,0 Z",
    ],
    // Lower roots — drawn bottom(80) up to top(0), roots taper upward
    lowerMolar: [
        "M22,80 Q20,75 18,55 Q16,30 20,10 Q22,2 26,0 L30,0 Q28,8 26,25 Q24,45 24,65 Q24,75 24,80 Z",
        "M42,80 Q42,70 44,50 Q46,30 48,12 Q50,0 50,0 Q50,0 52,12 Q54,30 56,50 Q58,70 58,80 Z",
        "M72,80 Q74,75 76,55 Q78,30 76,10 Q74,2 72,0 L68,0 Q70,8 72,25 Q74,45 74,65 Q74,75 74,80 Z",
    ],
    lowerPremolar: [
        "M30,80 Q28,70 30,45 Q32,25 35,10 Q36,2 38,0 L44,0 Q40,15 38,35 Q36,55 34,80 Z",
        "M62,80 Q64,70 66,45 Q68,25 70,10 Q72,2 74,0 L68,0 Q66,15 64,35 Q62,55 60,80 Z",
    ],
    lowerCanine: [
        "M38,80 Q36,70 38,45 Q40,25 44,10 Q48,-2 50,-8 Q52,-2 56,10 Q60,25 62,45 Q64,70 62,80 Z",
    ],
    lowerIncisor: [
        "M38,80 Q36,72 37,50 Q38,30 42,14 Q46,-2 50,-8 Q54,-2 58,14 Q62,30 63,50 Q64,72 62,80 Z",
    ],
};

const STATUS_COLORS = {
    cavity: { main: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
    filled: { main: '#3b82f6', light: '#eff6ff', dark: '#1e40af' },
    extracted: { main: '#eb5757', light: '#fef2f2', dark: '#7f1d1d' },
    rootCanal: { main: '#f59e0b', light: '#fffbeb', dark: '#b45309' },
    crown: { main: '#8b5cf6', light: '#f5f3ff', dark: '#5b21b6' },
    denture: { main: '#0ea5e9', light: '#f0f9ff', dark: '#0369a1' },
    implant: { main: '#22c55e', light: '#f0fdf4', dark: '#15803d' },
    sealant: { main: '#10b981', light: '#ecfdf5', dark: '#047857' },
    scaling: { main: '#78350f', light: '#fefce8', dark: '#451a03' },
    abscess: { main: '#dc2626', light: '#fef2f2', dark: '#991b1b' },
    broken: { main: '#ea580c', light: '#fff7ed', dark: '#9a3412' },
    bridge: { main: '#2563eb', light: '#eff6ff', dark: '#1d4ed8' },
    missing: { main: '#eb5757', light: '#fef2f2', dark: '#7f1d1d' },
    treated: { main: '#8b5cf6', light: '#ede9fe', dark: '#5b21b6' },
    healthy: null
};

const getToothWidth = (id) => {
    const toothNum = id % 10;
    if (toothNum >= 6) return 60;
    if (toothNum >= 4) return 50;
    if (toothNum === 3) return 46;
    if (toothNum === 2) return 42;
    return 46;
};

const getAnatomicalType = (id) => {
    const toothNum = id % 10;
    const quadrant = Math.floor(id / 10);
    const isUpper = [1, 2, 5, 6].includes(quadrant);
    const isPrimary = quadrant >= 5 && quadrant <= 8;
    if (toothNum >= 6) return isUpper ? 'upperMolar' : 'lowerMolar';
    if (toothNum >= 4) return isPrimary ? (isUpper ? 'upperMolar' : 'lowerMolar') : (isUpper ? 'upperPremolar' : 'lowerPremolar');
    if (toothNum === 3) return isUpper ? 'upperCanine' : 'lowerCanine';
    return isUpper ? 'upperIncisor' : 'lowerIncisor';
};

// ==================== ROOT COMPONENT ====================
const ToothRoot = ({ id, type, isUpper, rootStatus, initialRootStatus, isSelected, onRootClick }) => {
    const rootPaths = ROOT_PATHS[type] || [];
    const isRootCanal = rootStatus === 'rootCanal';
    const isAbscess = rootStatus === 'abscess';
    const isHistorical = rootStatus === initialRootStatus && rootStatus !== null;
    const isExtracted = rootStatus === 'extracted' || rootStatus === 'missing';

    const rootFill = isRootCanal
        ? STATUS_COLORS.rootCanal.light
        : '#f8f4ef';
    const rootStroke = isRootCanal
        ? STATUS_COLORS.rootCanal.main
        : isSelected ? 'var(--primary-400)' : '#d4c9b8';

    if (isExtracted) return null;

    return (
        <div
            onClick={(e) => { e.stopPropagation(); if (onRootClick) onRootClick(id); }}
            style={{
                cursor: 'pointer',
                width: '80%',
                margin: '0 auto',
                marginTop: isUpper ? '-2px' : '0',
                marginBottom: isUpper ? '0' : '-2px',
                position: 'relative',
                zIndex: 0,
                transition: 'all 0.2s ease',
                opacity: isSelected ? 1 : 0.85,
            }}
        >
            <svg
                width="100%"
                height="auto"
                viewBox={isUpper ? "0 0 100 90" : "0 0 100 90"}
                style={{ 
                    display: 'block', 
                    overflow: 'visible',
                    transform: isUpper ? 'none' : 'rotate(180deg)'
                }}
            >
                <defs>
                    <linearGradient id={`root-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f5efe6" />
                        <stop offset="50%" stopColor="#faf6f0" />
                        <stop offset="100%" stopColor="#ede5d8" />
                    </linearGradient>
                </defs>
                {rootPaths.map((d, i) => (
                    <path
                        key={i}
                        d={d}
                        fill={isRootCanal ? STATUS_COLORS.rootCanal.light : `url(#root-grad-${id})`}
                        stroke={rootStroke}
                        strokeWidth="1.5"
                        style={{ transition: 'all 0.3s' }}
                    />
                ))}
                {/* Root Canal fill indicator */}
                {isRootCanal && rootPaths.map((d, i) => (
                    <path
                        key={`rc-${i}`}
                        d={d}
                        fill={STATUS_COLORS.rootCanal.main}
                        opacity={isHistorical ? "0.2" : "0.35"}
                    />
                ))}
                {/* Abscess bubble at root tip (Apex) */}
                {isAbscess && (
                    <circle
                        cx="50"
                        cy={isUpper ? "12" : "12"} // Both apexes are near '0' in their respective SVG spaces (bottom arch is rotated)
                        r="10"
                        fill={STATUS_COLORS.abscess.main}
                        stroke="white"
                        strokeWidth="2"
                        opacity={isHistorical ? 0.35 : 0.9}
                    />
                )}
            </svg>
        </div>
    );
};

// ==================== CROWN COMPONENT ====================
const ToothIcon = ({ id, surfaces, initialSurfaces = {}, toothStatus, initialToothStatus, onSurfaceClick, isSelected, onToothClick, isTreated, onRootClick }) => {
    const quadrant = Math.floor(id / 10);
    const isUpper = [1, 2, 5, 6].includes(quadrant);
    const isExtracted = toothStatus === 'extracted' || toothStatus === 'missing';
    const isDenture = toothStatus === 'denture';
    const isImplant = toothStatus === 'implant';
    const isBridge = toothStatus === 'bridge';
    const isHistoricalStatus = toothStatus === initialToothStatus && toothStatus !== null;
    const type = getAnatomicalType(id);
    const pathData = CROWN_PATHS[type];
    const width = getToothWidth(id);

    const hasCavity = Object.values(surfaces).some(s => s === 'cavity');
    const hasFilled = Object.values(surfaces).some(s => s === 'filled');

    const getSurfaceColor = (surface, isStroke = false) => {
        const status = surfaces[surface];
        const initialStatus = initialSurfaces[surface];
        if (!status || status === 'healthy') return isStroke ? '#cbd5e1' : 'transparent';
        if (!STATUS_COLORS[status]) return isStroke ? '#cbd5e1' : 'transparent';
        
        const baseColor = isStroke ? STATUS_COLORS[status].dark : STATUS_COLORS[status].main;
        
        // If the status matches history, make it pale/faded but still clearly visible
        const isHistorical = status === initialStatus;
        if (isHistorical && !isStroke) {
            return baseColor + '99'; // ~60% opacity for historical data
        }
        
        return baseColor;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: `${width}px`,
            position: 'relative',
            zIndex: isSelected ? 50 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            gap: '2px'
        }}>
            {/* FDI Number Badge */}
            {/* FDI Number Badge (Top for Upper, Bottom for Lower) */}
            {isUpper && (
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isSelected ? 'var(--primary-600)' : '#64748b',
                    background: isSelected ? 'var(--primary-50)' : 'transparent',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    marginBottom: '1px',
                    transition: 'all 0.2s',
                    opacity: 0.9
                }}>{id}</span>
            )}

            {/* Root for UPPER teeth — renders ABOVE crown visually */}
            {isUpper && (
                <ToothRoot
                    id={id}
                    type={type}
                    isUpper={true}
                    rootStatus={toothStatus}
                    initialRootStatus={initialToothStatus}
                    isSelected={isSelected}
                    onRootClick={onRootClick}
                />
            )}

            {/* Tooth Crown Wrapper */}
            <div
                onClick={(e) => { e.stopPropagation(); onToothClick(id); }}
                style={{
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: (isDenture || isImplant || isBridge) ? `2.5px solid ${
                        isDenture ? STATUS_COLORS.denture.main :
                        isImplant ? STATUS_COLORS.implant.main :
                        STATUS_COLORS.bridge.main
                    }${isHistoricalStatus ? '66' : ''}` : '2px solid transparent',
                    background: isSelected ? 'var(--primary-50)' : isTreated ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    boxShadow: isTreated ? 'inset 0 0 12px rgba(59, 130, 246, 0.1)' : 'none',
                    opacity: isHistoricalStatus ? 0.7 : 1
                }}
            >
                {/* Badge Indicator (Top Right) */}
                {(isDenture || isImplant) && (
                    <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '18px',
                        height: '18px',
                        background: isDenture ? STATUS_COLORS.denture.main : STATUS_COLORS.implant.main,
                        opacity: isHistoricalStatus ? 0.6 : 1,
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 900,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        zIndex: 10
                    }}>
                        {isDenture ? 'P' : 'I'}
                    </div>
                )}

                <svg width="100%" height="auto" viewBox="0 -15 100 130" style={{ display: 'block', overflow: 'visible', minHeight: '55px' }}>
                    <defs>
                        <radialGradient id={`gloss-${id}`} cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stopColor={toothStatus === 'crown' ? STATUS_COLORS.crown.light : "#ffffff"} />
                            <stop offset="100%" stopColor={toothStatus === 'crown' ? STATUS_COLORS.crown.main : "#e2e8f0"} />
                        </radialGradient>
                    </defs>

                    {/* Main Enamel Body — Tints based on overall status */}
                    <path d={pathData}
                        fill={
                            toothStatus === 'crown' ? STATUS_COLORS.crown.main : 
                            hasCavity ? (isHistoricalStatus ? '#fee2e2' : '#fecaca') :
                            hasFilled ? (isHistoricalStatus ? '#eff6ff' : '#dbeafe') :
                            `url(#gloss-${id})`
                        }
                        stroke={isSelected ? 'var(--primary-500)' : '#cbd5e1'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        style={{ transition: 'all 0.3s' }}
                    />

                    {/* Surface Indicators */}
                    {/* Detailed Surface Indicators — rendered on the tooth itself */}
                    {!isExtracted && (
                        <g opacity="1" transform="translate(15, 20) scale(0.7)">
                            {/* Center (Occlusal/Incisal) */}
                            <circle cx="50" cy="50" r="16"
                                fill={getSurfaceColor('O')} stroke={getSurfaceColor('O', true)} strokeWidth="2.5"
                            />
                            {/* Buccal/Labial (Top) */}
                            <path d="M 30,30 L 15,15 A 45,45 0 0 1 85,15 L 70,30 A 25,25 0 0 0 30,30 z"
                                fill={getSurfaceColor(isUpper ? 'B' : 'L')} stroke={getSurfaceColor(isUpper ? 'B' : 'L', true)} strokeWidth="2"
                            />
                            {/* Lingual/Palatal (Bottom) */}
                            <path d="M 30,70 L 15,85 A 45,45 0 0 0 85,85 L 70,70 A 25,25 0 0 1 30,70 z"
                                fill={getSurfaceColor(isUpper ? 'L' : 'B')} stroke={getSurfaceColor(isUpper ? 'L' : 'B', true)} strokeWidth="2"
                            />
                            {/* Mesial */}
                            <path d="M 30,30 L 15,15 A 45,45 0 0 0 15,85 L 30,70 A 25,25 0 0 1 30,30 z"
                                fill={getSurfaceColor('M')} stroke={getSurfaceColor('M', true)} strokeWidth="2"
                            />
                            {/* Distal */}
                            <path d="M 70,30 L 85,15 A 45,45 0 0 1 85,85 L 70,70 A 25,25 0 0 0 70,30 z"
                                fill={getSurfaceColor('D')} stroke={getSurfaceColor('D', true)} strokeWidth="2"
                            />
                        </g>
                    )}

                    {/* Missing/Extracted Indicator (Red X) */}
                    {isExtracted && (
                        <g stroke={STATUS_COLORS.extracted.main} strokeWidth="12" strokeLinecap="round" opacity={isHistoricalStatus ? 0.45 : 0.95}>
                            <path d="M15,15 L85,115" />
                            <path d="M85,15 L15,115" />
                        </g>
                    )}
                </svg>
            </div>

            {/* Root for LOWER teeth — renders BELOW crown visually */}
            {!isUpper && (
                <ToothRoot
                    id={id}
                    type={type}
                    isUpper={false}
                    rootStatus={toothStatus}
                    initialRootStatus={initialToothStatus}
                    isSelected={isSelected}
                    onRootClick={onRootClick}
                />
            )}

            {/* FDI Number Badge (Bottom for Lower) */}
            {!isUpper && (
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isSelected ? 'var(--primary-600)' : '#64748b',
                    background: isSelected ? 'var(--primary-50)' : 'transparent',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    marginTop: '1px',
                    transition: 'all 0.2s',
                    opacity: 0.9
                }}>{id}</span>
            )}

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
                        {/* Mesial */}
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

// ==================== MAIN CHART ====================
const DigitalToothChart = ({ onToothSelect, selectedTeeth = [], toothChart = {}, initialChart = {}, treatedTeeth = [], mode = 'adult' }) => {
    const { language } = useLanguage();
    const handleSurfaceClick = (id, surface) => {
        if (onToothSelect) onToothSelect({ id, surface });
    };

    const handleToothClick = (id) => {
        if (onToothSelect) onToothSelect(id);
    };

    const handleRootClick = (id) => {
        if (onToothSelect) onToothSelect(id);
    };

    const selectedTooth = selectedTeeth[0];
    const isUpperSelected = selectedTooth && [1, 2, 5, 6].includes(Math.floor(selectedTooth / 10));
    const isLowerSelected = selectedTooth && [3, 4, 7, 8].includes(Math.floor(selectedTooth / 10));

    const upperList = mode === 'primary' ? UPPER_PRIMARY_TEETH : UPPER_TEETH;
    const lowerList = mode === 'primary' ? LOWER_PRIMARY_TEETH : LOWER_TEETH;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 0.5rem 1rem 0.5rem',
            background: 'linear-gradient(to bottom, #ffffff 0%, #f4f7fb 100%)',
            alignItems: 'center',
            maxWidth: '100%',
            overflowX: 'hidden',
            minHeight: '380px',
        }}>
            <div style={{ width: '100%', maxWidth: '960px', padding: '0 0.25rem', position: 'relative' }}>
                {/* Horizontal Divider Line */}
                <div style={{
                    position: 'absolute', top: '50%', left: '0', right: '0',
                    height: '2px', background: '#e2e8f0', zIndex: 0,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}></div>

                {/* Upper Row */}
                <div style={{
                    position: 'relative',
                    padding: '0 0.5rem 2rem 0.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    zIndex: isUpperSelected ? 100 : 1
                }}>
                    <div style={{ marginBottom: '0.75rem', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em' }}>
                        {language === 'TH' ? 'ฟันบน (UPPER)' : 'UPPER ARCH'}
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1px', width: '100%', maxWidth: mode === 'primary' ? '600px' : '960px' }}>
                        {upperList.map(id => (
                            <ToothIcon key={id} id={id}
                                surfaces={toothChart[id]?.surfaces || {}}
                                initialSurfaces={initialChart[id]?.surfaces || {}}
                                toothStatus={toothChart[id]?.status || null}
                                initialToothStatus={initialChart[id]?.status || null}
                                isSelected={selectedTeeth.includes(id)}
                                isTreated={treatedTeeth.includes(id)}
                                onSurfaceClick={handleSurfaceClick}
                                onToothClick={handleToothClick}
                                onRootClick={handleRootClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Lower Row */}
                <div style={{
                    position: 'relative',
                    padding: '2rem 0.5rem 0 0.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    zIndex: isLowerSelected ? 100 : 1
                }}>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '1px', width: '100%', maxWidth: mode === 'primary' ? '600px' : '960px' }}>
                        {lowerList.map(id => (
                            <ToothIcon key={id} id={id}
                                surfaces={toothChart[id]?.surfaces || {}}
                                initialSurfaces={initialChart[id]?.surfaces || {}}
                                toothStatus={toothChart[id]?.status || null}
                                initialToothStatus={initialChart[id]?.status || null}
                                isSelected={selectedTeeth.includes(id)}
                                isTreated={treatedTeeth.includes(id)}
                                onSurfaceClick={handleSurfaceClick}
                                onToothClick={handleToothClick}
                                onRootClick={handleRootClick}
                            />
                        ))}
                    </div>
                    <div style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em' }}>
                        {language === 'TH' ? 'ฟันล่าง (LOWER)' : 'LOWER ARCH'}
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex', gap: '1.25rem', justifyContent: 'flex-start', alignItems: 'center',
                width: '100%', flexWrap: 'wrap',
                fontSize: '0.8rem', fontWeight: 600, color: '#64748b',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                marginTop: '0.5rem',
                background: '#f8fafc',
                borderRadius: '0 0 12px 12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', borderRadius: '3px' }}></div>
                    {language === 'TH' ? 'ข้อมูลจากครั้งก่อน' : 'Previous Visit Info'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ color: STATUS_COLORS.extracted.main, fontWeight: 900, fontSize: '1.2rem', lineHeight: '14px' }}>×</div>
                    {language === 'TH' ? 'ถอนฟันแล้ว' : 'Extracted'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, border: `1.5px solid ${STATUS_COLORS.denture.main}`, color: STATUS_COLORS.denture.main, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, borderRadius: '3px' }}>P</div>
                    {language === 'TH' ? 'ฟันปลอม (P)' : 'Denture (P)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, border: `1.5px solid ${STATUS_COLORS.implant.main}`, color: STATUS_COLORS.implant.main, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, borderRadius: '3px' }}>I</div>
                    {language === 'TH' ? 'รากฟันเทียม (I)' : 'Implant (I)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, border: `1.5px solid ${STATUS_COLORS.bridge.main}`, borderRadius: '3px' }}></div>
                    {language === 'TH' ? 'สะพานฟัน' : 'Bridge'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 14, height: 14, background: STATUS_COLORS.rootCanal.main, borderRadius: '3px', opacity: 0.7 }}></div>
                    {language === 'TH' ? 'รักษารากฟัน' : 'Root Canal'}
                </div>
            </div>
        </div>
    );
};

export default DigitalToothChart;
