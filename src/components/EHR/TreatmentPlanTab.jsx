import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Printer, CheckCircle, FileText, ChevronRight, AlertCircle, ChevronDown, MoreVertical } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import DigitalToothChart from './DigitalToothChart';
import TreatmentEntry from './TreatmentEntry';
import HandwritingCanvas from '../Shared/HandwritingCanvas';
import { PenTool } from 'lucide-react';

const TreatmentPlanTab = ({ patient, language: propsLang, onUpdateToothStatus }) => {
    const { t, language } = useLanguage();
    const { updatePatient } = useData();
    const [plans, setPlans] = useState(patient.treatmentPlans || []);
    const [activePlanId, setActivePlanId] = useState(null);
    const [selectedTeeth, setSelectedTeeth] = useState([]);
    const [selectedSurfaces, setSelectedSurfaces] = useState({}); // { toothId: ['M', 'O'], ... }
    const [activeTool, setActiveTool] = useState('planning'); // 'planning' or status like 'missing'
    const [toothChart, setToothChart] = useState(patient.toothChart || {});
    const [showCanvas, setShowCanvas] = useState(false);

    // Dropdown State
    const [showPlanMenu, setShowPlanMenu] = useState(false);
    const menuRef = useRef(null);

    // Get all teeth that have been treated
    const treatedTeeth = new Set((patient.treatments || []).flatMap(tr => tr.teeth || []));

    useEffect(() => {
        setToothChart(patient.toothChart || {});
    }, [patient.toothChart]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowPlanMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initialize with a default plan if none exist
    useEffect(() => {
        if (plans.length === 0) {
            const initialPlan = {
                id: `PLAN-${Date.now()}`,
                name: 'Option A',
                items: [],
                date: new Date().toISOString()
            };
            setPlans([initialPlan]);
            setActivePlanId(initialPlan.id);
        } else if (!activePlanId && plans.length > 0) {
            setActivePlanId(plans[0].id);
        }
    }, [plans, activePlanId]);

    const handleToothSelect = (selection) => {
        const toothId = typeof selection === 'object' ? selection.id : selection;
        const surface = typeof selection === 'object' ? selection.surface : null;

        if (activeTool === 'planning') {
            if (surface) {
                // Surface click in planning mode -> select the tooth AND record the surface
                setSelectedTeeth(prev => prev.includes(toothId) ? prev : [...prev, toothId]);
                setSelectedSurfaces(prev => {
                    const existing = prev[toothId] || [];
                    if (existing.includes(surface)) {
                        const updated = existing.filter(s => s !== surface);
                        if (updated.length === 0) {
                            const { [toothId]: _, ...rest } = prev;
                            return rest;
                        }
                        return { ...prev, [toothId]: updated };
                    }
                    return { ...prev, [toothId]: [...existing, surface] };
                });
            } else {
                // Whole tooth click in planning mode -> toggle tooth selection
                setSelectedTeeth(prev => {
                    if (prev.includes(toothId)) {
                        // Also clear surfaces for this tooth
                        setSelectedSurfaces(p => { const { [toothId]: _, ...rest } = p; return rest; });
                        return prev.filter(t => t !== toothId);
                    }
                    return [...prev, toothId];
                });
            }
        } else {
            if (surface) {
                // Surface click in charting mode -> apply the active tool to that surface
                const currentTooth = toothChart[toothId] || {};
                const currentSurfaces = currentTooth.surfaces || {};
                const currentStatus = currentSurfaces[surface];

                const newStatus = currentStatus === activeTool ? 'healthy' : activeTool;

                const newChart = {
                    ...toothChart,
                    [toothId]: {
                        ...currentTooth,
                        surfaces: {
                            ...currentSurfaces,
                            [surface]: newStatus
                        }
                    }
                };
                setToothChart(newChart);
                if (onUpdateToothStatus) onUpdateToothStatus(newChart);
            } else {
                // Whole tooth click in charting mode
                if (activeTool === 'missing') {
                    // Missing: toggle immediately (no surface needed)
                    const currentStatus = toothChart[toothId]?.status;
                    const newStatus = currentStatus === 'missing' ? 'present' : 'missing';
                    const newChart = {
                        ...toothChart,
                        [toothId]: {
                            ...(toothChart[toothId] || {}),
                            status: newStatus
                        }
                    };
                    setToothChart(newChart);
                    if (onUpdateToothStatus) onUpdateToothStatus(newChart);
                } else {
                    // Cavity/Filled: select the tooth to show the surface overlay
                    setSelectedTeeth(prev =>
                        prev.includes(toothId) ? prev.filter(t => t !== toothId) : [toothId]
                    );
                }
            }
        }
    };

    const statusTools = [
        { id: 'planning', label: t('trt_btn_add_procedure'), icon: Plus, color: 'var(--primary-600)' },
        { id: 'missing', label: t('missing') || 'Missing', icon: Trash2, color: '#ef4444' },
        { id: 'cavity', label: t('cavity') || 'Cavity', icon: AlertCircle, color: '#f59e0b' },
        { id: 'filled', label: t('filled') || 'Filled', icon: CheckCircle, color: '#10b981' },
    ];

    const activePlan = plans.find(p => p.id === activePlanId) || plans[0];

    const handleCreatePlan = () => {
        const newPlan = {
            id: `PLAN-${Date.now()}`,
            name: `Option ${String.fromCharCode(65 + plans.length)}`,
            items: [],
            date: new Date().toISOString()
        };
        const updatedPlans = [...plans, newPlan];
        setPlans(updatedPlans);
        setActivePlanId(newPlan.id);
        updatePatientPlans(updatedPlans);
        setShowPlanMenu(false);
    };

    const handleDeletePlan = (planId, e) => {
        if (e) e.stopPropagation();
        if (plans.length === 1) {
            alert(language === 'TH' ? "ต้องมีอย่างน้อยหนึ่งแผน" : "At least one plan must exist.");
            return;
        }
        if (confirm(language === 'TH' ? 'ลบแผนการรักษานี้?' : 'Delete this plan?')) {
            const updatedPlans = plans.filter(p => p.id !== planId);
            setPlans(updatedPlans);
            if (activePlanId === planId) {
                setActivePlanId(updatedPlans[0].id);
            }
            updatePatientPlans(updatedPlans);
        }
    };

    const handleUpdatePlanName = (name) => {
        const updatedPlans = plans.map(p => p.id === activePlanId ? { ...p, name } : p);
        setPlans(updatedPlans);
        updatePatientPlans(updatedPlans);
    };

    const handleAddTreatmentToPlan = (treatmentData) => {
        if (!treatmentData) return;

        const newItem = {
            id: `ITM-${Date.now()}`,
            ...treatmentData,
            teeth: selectedTeeth
        };

        const updatedPlans = plans.map(p => {
            if (p.id === activePlanId) {
                return { ...p, items: [...p.items, newItem] };
            }
            return p;
        });

        setPlans(updatedPlans);
        updatePatientPlans(updatedPlans);
        setSelectedTeeth([]);
        setSelectedSurfaces({});
    };

    const handleRemoveItem = (itemId) => {
        const updatedPlans = plans.map(p => {
            if (p.id === activePlanId) {
                return { ...p, items: p.items.filter(i => i.id !== itemId) };
            }
            return p;
        });
        setPlans(updatedPlans);
        updatePatientPlans(updatedPlans);
    };

    const updatePatientPlans = (newPlans) => {
        updatePatient(patient.id, { treatmentPlans: newPlans });
    };

    const handleSaveDrawing = (dataUrl) => {
        const newItem = {
            id: `NOTE-${Date.now()}`,
            procedure: language === 'TH' ? 'บันทึกเพิ่มเติม (รูปภาพ)' : 'Clinical Note (Drawing)',
            price: 0,
            date: new Date().toISOString(),
            noteImage: dataUrl,
            category: 'Note',
            teeth: []
        };

        const updatedPlans = plans.map(p => {
            if (p.id === activePlanId) {
                return { ...p, items: [...p.items, newItem] };
            }
            return p;
        });

        setPlans(updatedPlans);
        updatePatientPlans(updatedPlans);
        setShowCanvas(false);
    };

    const handleActivatePlan = () => {
        if (!activePlan || activePlan.items.length === 0) return;

            const newTreatments = activePlan.items.map(item => ({
                id: `TRT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                procedure: item.procedure,
                price: item.price,
                teeth: item.teeth,
                date: new Date().toISOString(),
                paymentStatus: 'unpaid',
                status: 'planned',
                category: item.category,
                note: `${language === 'TH' ? 'จากแผน' : 'From Plan'}: ${activePlan.name}`
            }));

            const currentTreatments = patient.treatments || [];
            const updatedPlans = plans.map(p =>
                p.id === activePlanId ? { ...p, items: [] } : p
            );

            setPlans(updatedPlans);
            updatePatient(patient.id, {
                treatments: [...newTreatments, ...currentTreatments],
                treatmentPlans: updatedPlans
            });

            alert(language === 'TH' ? "เริ่มการรักษาตามแผนเรียบร้อย! โปรดตรวจสอบที่หน้า ประวัติ/ชำระเงิน" : "Plan activated successfully! Refer to Charting/Billing tabs.");
    };

    if (!activePlan) return <div>Loading...</div>;

    const totalCost = activePlan.items.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '600px' }}>

            {/* Header with Top Dropdown for Plans */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Plan Selector Dropdown */}
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button
                            onClick={() => setShowPlanMenu(!showPlanMenu)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                padding: '8px 16px', borderRadius: '8px',
                                fontSize: '1.1rem', fontWeight: 600, color: '#1e293b',
                                cursor: 'pointer'
                            }}
                        >
                            {activePlan.name}
                            <ChevronDown size={16} color="#64748b" />
                        </button>

                        {/* Dropdown Menu */}
                        {showPlanMenu && (
                            <div style={{
                                position: 'absolute', top: '110%', left: 0,
                                background: 'white', border: '1px solid #e2e8f0',
                                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                minWidth: '220px', zIndex: 50, padding: '4px'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', padding: '8px 12px' }}>{language === 'TH' ? 'สลับแผนการรักษา' : 'SWITCH PLAN'}</div>
                                {plans.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => { setActivePlanId(p.id); setShowPlanMenu(false); }}
                                        style={{
                                            padding: '8px 12px', cursor: 'pointer', borderRadius: '4px',
                                            background: activePlanId === p.id ? '#eff6ff' : 'transparent',
                                            color: activePlanId === p.id ? '#2563eb' : '#475569',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            fontSize: '0.9rem'
                                        }}
                                        className="hover:bg-slate-50"
                                    >
                                        <span>{p.name}</span>
                                        {activePlanId === p.id && <CheckCircle size={14} />}
                                    </div>
                                ))}
                                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                                <button
                                    onClick={handleCreatePlan}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '8px 12px',
                                        background: 'transparent', border: 'none', color: '#1e40af',
                                        fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    <Plus size={14} /> {language === 'TH' ? 'สร้างแผนใหม่' : 'Create New Option'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Editable Name Input (Secondary) */}
                    <input
                        type="text"
                        value={activePlan.name}
                        placeholder={language === 'TH' ? "เปลี่ยนชื่อแผน..." : "Rename Plan..."}
                        style={{
                            fontSize: '0.9rem', color: '#64748b', border: 'none', borderBottom: '1px solid transparent',
                            padding: '4px', background: 'transparent', outline: 'none', width: '200px',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#cbd5e1'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />

                    <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#d97706', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{t('trt_draft')}</span>

                    {/* Delete Current Plan (if > 1) */}
                    {plans.length > 1 && (
                        <button
                            onClick={(e) => handleDeletePlan(activePlanId, e)}
                            title="Delete this plan"
                            style={{
                                background: '#fee2e2', color: '#ef4444', border: 'none',
                                borderRadius: '6px', padding: '6px', cursor: 'pointer', marginLeft: 'auto'
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('trt_total_estimate')}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-700)' }}>฿{totalCost.toLocaleString()}</div>
                    </div>
                    <button className="btn btn-primary" onClick={handleActivatePlan} style={{ background: '#059669', borderColor: '#059669' }}>
                        <CheckCircle size={18} style={{ marginRight: '8px' }} /> {t('trt_btn_activate')}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                {/* Left: Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Tool Selector */}
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '12px' }}>
                        {statusTools.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => {
                                    setActiveTool(tool.id);
                                    if (tool.id !== 'planning') setSelectedTeeth([]);
                                }}
                                style={{
                                    flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid',
                                    borderColor: activeTool === tool.id ? tool.color : 'transparent',
                                    background: activeTool === tool.id ? 'white' : 'transparent',
                                    color: activeTool === tool.id ? tool.color : '#64748b',
                                    fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                    cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTool === tool.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                <tool.icon size={16} />
                                {tool.label}
                            </button>
                        ))}
                    </div>

                    {/* Tooth Selection */}
                    <div className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-100)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{activeTool === 'planning' ? `1. ${language === 'TH' ? 'ขั้นตอนเลือกซี่ฟัน' : 'Select Teeth'}` : (language === 'TH' ? 'เลือกซี่ฟันเพื่ออัปเดตสถานะ' : 'Select Teeth to Update Status')}</span>
                            {activeTool !== 'planning' && <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{language === 'TH' ? 'คลิกที่ซี่ฟันเพื่อเปลี่ยนสถานะ' : 'Click tooth to toggle status'}</span>}
                        </div>
                        <DigitalToothChart
                            onToothSelect={handleToothSelect}
                            selectedTeeth={selectedTeeth}
                            toothChart={toothChart}
                            treatedTeeth={Array.from(treatedTeeth)}
                        />
                    </div>

                    {/* Treatment Entry */}
                    {activeTool === 'planning' && (
                        <div className="card" style={{ padding: '0' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-100)', fontWeight: 600 }}>
                                {t('trt_add_title')}
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <TreatmentEntry
                                    onAddTreatment={handleAddTreatmentToPlan}
                                    selectedTeeth={selectedTeeth}
                                    selectedSurfaces={selectedSurfaces}
                                    language={language}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Plan Items */}
                <div className="card" style={{ padding: '0', height: 'fit-content' }}>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--neutral-200)', borderRadius: '16px 16px 0 0' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{language === 'TH' ? 'รายการในแผน' : 'Plan Items'}: {activePlan.name}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>{language === 'TH' ? 'ตรวจสอบและยืนยันเริ่มการรักษา' : 'Review and activate treatments.'}</p>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        {activePlan.items.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-400)' }}>
                                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>{language === 'TH' ? 'ยังไม่มีรายการในแผนนี้' : 'No items in this plan yet.'}</p>
                                <p style={{ fontSize: '0.8rem' }}>{t('prof_empty_plan')}</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                                        <th style={{ paddingBottom: '0.5rem' }}>{t('ehr_tooth_num')}</th>
                                        <th style={{ paddingBottom: '0.5rem' }}>{t('trt_procedure')}</th>
                                        <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>{language === 'TH' ? 'ยอดรวม' : 'Cost'}</th>
                                        <th style={{ paddingBottom: '0.5rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activePlan.items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--neutral-50)' }}>
                                            <td style={{ padding: '0.75rem 0', fontWeight: 600, color: '#1e40af' }}>
                                                {item.teeth && item.teeth.length > 0 ? item.teeth.join(', ') : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0' }}>
                                                <div style={{ fontWeight: 500 }}>{item.procedure}</div>
                                                {item.category && <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{item.category}</div>}
                                                {item.noteImage && (
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <img src={item.noteImage} alt="Note" style={{ height: '40px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>
                                                ฿{item.price?.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {showCanvas && (
                <HandwritingCanvas
                    onClose={() => setShowCanvas(false)}
                    onSave={handleSaveDrawing}
                />
            )}

            {/* Floating FAB for Handwriting */}
            <button
                onClick={() => setShowCanvas(true)}
                className="animate-slide-up"
                style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: '#2563eb', color: 'white', border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50
                }}
                title="Draw Note"
            >
                <PenTool size={24} />
            </button>
        </div>
    );
};

export default TreatmentPlanTab;
