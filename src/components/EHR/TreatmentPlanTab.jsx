import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Printer, CheckCircle, FileText, ChevronRight, AlertCircle, ChevronDown, MoreVertical, Clock, Calendar, Eraser, Heart, Thermometer, Activity, Scale } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import DigitalToothChart from './DigitalToothChart';
import TreatmentEntry from './TreatmentEntry';
import HandwritingCanvas from '../Shared/HandwritingCanvas';
import { PenTool } from 'lucide-react';

const TreatmentPlanTab = ({ patient, language: propsLang, onUpdateToothStatus }) => {
    const { t, language } = useLanguage();
    const { updatePatient, appointments } = useData();
    const { staff } = useAuth();
    const [plans, setPlans] = useState(patient.treatmentPlans || []);
    const [activePlanId, setActivePlanId] = useState(null);
    const [selectedTeeth, setSelectedTeeth] = useState([]);
    const [selectedSurfaces, setSelectedSurfaces] = useState({}); // { toothId: ['M', 'O'], ... }
    const [activeTool, setActiveTool] = useState('planning'); // 'planning' or status like 'missing'
    const [toothChart, setToothChart] = useState(patient.toothChart || {});
    const [showCanvas, setShowCanvas] = useState(false);
    const [toothMode, setToothMode] = useState('adult'); // 'adult' or 'primary'

    // Dropdown State
    const [showPlanMenu, setShowPlanMenu] = useState(false);
    const menuRef = useRef(null);

    // Get all teeth that have been treated
    const treatedTeeth = new Set((patient.treatments || []).flatMap(tr => tr.teeth || []));

    // Get latest vitals from appointments
    const latestVitalsApt = useMemo(() => {
        return (appointments || [])
            .filter(a => (a.patientId === patient.id || a.patient_id === patient.id) && a.vitals)
            .sort((a, b) => {
                const dateA = new Date(`${a.date || a.appointmentDate}T${a.time || a.appointmentTime || '00:00'}`);
                const dateB = new Date(`${b.date || b.appointmentDate}T${b.time || b.appointmentTime || '00:00'}`);
                return dateB - dateA;
            })[0];
    }, [appointments, patient.id]);

    const vitals = latestVitalsApt?.vitals;
    
    // Capture the initial chart state for session-based visual highlighting
    const initialChart = useMemo(() => patient.toothChart || {}, [patient.id]);

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
                const wholeToothTools = ['missing', 'extracted', 'rootCanal', 'crown', 'denture', 'implant', 'sealant', 'scaling', 'abscess', 'broken', 'bridge'];
                
                if (wholeToothTools.includes(activeTool)) {
                    // Toggle immediately (no surface needed)
                    const currentStatus = toothChart[toothId]?.status;
                    const newStatus = currentStatus === activeTool ? 'normal' : activeTool;
                    const newChart = {
                        ...toothChart,
                        [toothId]: {
                            ...(toothChart[toothId] || {}),
                            status: newStatus
                        }
                    };
                    setToothChart(newChart);
                    if (onUpdateToothStatus) onUpdateToothStatus(newChart);
                } else if (activeTool === 'clear') {
                    // Reset tooth to normal
                    const newChart = {
                        ...toothChart,
                        [toothId]: {
                            surfaces: {},
                            status: 'normal'
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
        { id: 'planning', label: language === 'TH' ? 'เลือกซี่ฟัน (เพิ่มแผน)' : 'Select Teeth', color: '#3b82f6' },
        { id: 'clear', label: language === 'TH' ? 'ลบ' : 'Clear', icon: Eraser, color: '#94a3b8' },
        { id: 'cavity', label: language === 'TH' ? 'ฟันผุ' : 'Cavity', color: '#ef4444' },
        { id: 'filled', label: language === 'TH' ? 'อุดฟัน' : 'Filled', color: '#3b82f6' },
        { id: 'extracted', label: language === 'TH' ? 'ถอนฟัน' : 'Extracted', color: '#eb5757' },
        { id: 'rootCanal', label: language === 'TH' ? 'รักษารากฟัน' : 'Root Canal', color: '#f59e0b' },
        { id: 'crown', label: language === 'TH' ? 'ครอบฟัน' : 'Crown', color: '#8b5cf6' },
        { id: 'denture', label: language === 'TH' ? 'ฟันปลอม' : 'Denture', color: '#0ea5e9' },
        { id: 'implant', label: language === 'TH' ? 'รากฟันเทียม' : 'Implant', color: '#22c55e' },
        { id: 'sealant', label: language === 'TH' ? 'เคลือบหลุมร่องฟัน' : 'Sealant', color: '#10b981' },
        { id: 'scaling', label: language === 'TH' ? 'ขูดหินปูน' : 'Scaling', color: '#78350f' },
        { id: 'abscess', label: language === 'TH' ? 'ฝีหนอง' : 'Abscess', color: '#dc2626' },
        { id: 'broken', label: language === 'TH' ? 'ฟันแตก/หัก' : 'Broken', color: '#ea580c' },
        { id: 'bridge', label: language === 'TH' ? 'สะพานฟัน' : 'Bridge', color: '#2563eb' }
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

        // Update tooth chart status based on treatment
        const newChart = { ...toothChart };
        const procId = treatmentData.procedureId;
        
        let targetStatus = null;
        if (procId.startsWith('fill_')) targetStatus = 'filled';
        else if (procId.startsWith('extraction_')) targetStatus = 'extracted';
        else if (procId.startsWith('rct_')) targetStatus = 'rootCanal';
        else if (procId.startsWith('crown_')) targetStatus = 'crown';
        else if (procId === 'cleaning') targetStatus = 'scaling';

        if (targetStatus) {
            selectedTeeth.forEach(tId => {
                const currentTooth = newChart[tId] || { surfaces: {}, status: 'normal' };
                const updatedSurfaces = { ...currentTooth.surfaces };

                // If restorative, update specific surfaces
                if (targetStatus === 'filled' && treatmentData.surfaces?.[tId]) {
                    treatmentData.surfaces[tId].forEach(s => {
                        updatedSurfaces[s] = 'filled';
                    });
                }

                newChart[tId] = {
                    ...currentTooth,
                    status: targetStatus,
                    surfaces: updatedSurfaces
                };
            });
            setToothChart(newChart);
            if (onUpdateToothStatus) onUpdateToothStatus(newChart);
        }

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
                recorder: staff?.full_name || staff?.name || 'Clinic Staff',
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
            
            {/* Latest Vitals Display - Safety Check for Procedures */}
            {vitals && (
                <div style={{ 
                    background: 'white', 
                    borderRadius: '20px', 
                    border: '1px solid #e2e8f0', 
                    overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)'
                }}>
                    <div style={{ 
                        padding: '1rem 1.5rem', 
                        background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)', 
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>
                            <div style={{ 
                                width: '32px', height: '32px', borderRadius: '10px', background: '#f0f9ff', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}>
                                <Activity size={18} color="#0ea5e9" />
                            </div>
                            {language === 'TH' ? 'ข้อมูลคนไข้ก่อนรับบริการ (เพื่อความปลอดภัยในการรักษา)' : 'Pre-service Vitals (Safety Check)'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
                            <Calendar size={12} />
                            {latestVitalsApt.date} • <Clock size={12} style={{ marginLeft: '4px' }} /> {latestVitalsApt.time}
                        </div>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1.5rem' }}>
                        {vitals.weight && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language === 'TH' ? 'น้ำหนัก (กก.)' : 'Weight (kg)'}</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{vitals.weight}</span>
                            </div>
                        )}
                        {vitals.height && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language === 'TH' ? 'ส่วนสูง (ซม.)' : 'Height (cm)'}</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{vitals.height}</span>
                            </div>
                        )}
                        {(vitals.bp_high || vitals.bp_low) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language === 'TH' ? 'ความดันเลือด' : 'Blood Pressure'}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: (parseInt(vitals.bp_high) > 140 || parseInt(vitals.bp_low) > 90) ? '#ef4444' : '#1e293b' }}>
                                        {vitals.bp_high || '-'}/{vitals.bp_low || '-'}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>mmHg</span>
                                </div>
                            </div>
                        )}
                        {vitals.temperature && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language === 'TH' ? 'อุณหภูมิ' : 'Temp'}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: parseFloat(vitals.temperature) > 37.5 ? '#ef4444' : '#1e293b' }}>{vitals.temperature}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>°C</span>
                                </div>
                            </div>
                        )}
                        {vitals.pulse && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language === 'TH' ? 'ชีพจร' : 'Pulse'}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: (parseInt(vitals.pulse) > 100 || parseInt(vitals.pulse) < 60) ? '#f59e0b' : '#1e293b' }}>{vitals.pulse}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>bpm</span>
                                </div>
                            </div>
                        )}
                        {vitals.notes && (
                            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <FileText size={14} /> {language === 'TH' ? 'หมายเหตุทางการแพทย์' : 'Medical Notes'}
                                </span>
                                <div style={{ 
                                    padding: '0.75rem 1rem', background: '#fff7ed', borderRadius: '10px', 
                                    border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.9rem',
                                    fontWeight: 500
                                }}>
                                    {vitals.notes}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


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

            {/* Full-width Dental Chart matching image */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div style={{ 
                    padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        🦷 แผนภูมิฟัน (Dental Chart)
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '8px' }}>
                        <button onClick={() => setToothMode('adult')} style={{ background: toothMode === 'adult' ? 'white' : 'transparent', color: toothMode === 'adult' ? '#3b82f6' : 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: toothMode === 'adult' ? 700 : 600, cursor: 'pointer' }}>ฟันแท้</button>
                        <button onClick={() => setToothMode('primary')} style={{ background: toothMode === 'primary' ? 'white' : 'transparent', color: toothMode === 'primary' ? '#3b82f6' : 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: toothMode === 'primary' ? 700 : 600, cursor: 'pointer' }}>ฟันน้ำนม</button>
                    </div>
                </div>

                {/* Tool Selector matching image layout */}
                <div style={{ display: 'flex', padding: '0.75rem 1.5rem', background: 'white', borderBottom: '1px solid #f1f5f9', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {statusTools.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => {
                                    setActiveTool(tool.id);
                                    if (tool.id !== 'planning') setSelectedTeeth([]);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.35rem 0.75rem', borderRadius: '24px', border: '1px solid',
                                    borderColor: activeTool === tool.id ? '#93c5fd' : '#e2e8f0',
                                    background: activeTool === tool.id ? '#eff6ff' : 'white',
                                    color: activeTool === tool.id ? '#1e40af' : '#475569',
                                    fontWeight: activeTool === tool.id ? 700 : 500, 
                                    fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: activeTool === tool.id ? '0 1px 2px rgba(59, 130, 246, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tool.icon ? (
                                    <tool.icon size={14} color={tool.color} />
                                ) : (
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tool.color }}></div>
                                )}
                                {tool.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                        เลือกอาการ แล้วกดที่ตัวของฟัน
                    </div>
                </div>

                <DigitalToothChart
                    onToothSelect={handleToothSelect}
                    selectedTeeth={selectedTeeth}
                    toothChart={toothChart}
                    initialChart={initialChart}
                    treatedTeeth={Array.from(treatedTeeth)}
                    mode={toothMode}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                {/* Left: Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Treatment Entry */}
                    {(activeTool === 'planning' || ['filled', 'extracted', 'rootCanal', 'crown', 'scaling'].includes(activeTool)) && (
                        <div className="card" style={{ padding: '0' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-100)', fontWeight: 600 }}>
                                {t('trt_add_title')}
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <TreatmentEntry
                                    onAddTreatment={handleAddTreatmentToPlan}
                                    selectedTeeth={selectedTeeth}
                                    selectedSurfaces={selectedSurfaces}
                                    activeTool={activeTool}
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
                                             <td style={{ 
                                                 padding: '0.75rem 0', 
                                                 fontWeight: 600, 
                                                 color: item.procedureId?.includes('fill_') ? '#3b82f6' : 
                                                        item.procedureId?.includes('extrac') ? '#ef4444' :
                                                        item.procedureId?.includes('rct_') ? '#f59e0b' :
                                                        item.procedureId?.includes('crown_') ? '#8b5cf6' :
                                                        '#1e40af',
                                                 display: 'flex', 
                                                 alignItems: 'center', 
                                                 gap: '8px' 
                                             }}>
                                                 <div style={{ 
                                                     width: 8, height: 8, borderRadius: '50%', 
                                                     background: item.procedureId?.includes('fill_') ? '#3b82f6' : 
                                                        item.procedureId?.includes('extrac') ? '#ef4444' :
                                                        item.procedureId?.includes('rct_') ? '#f59e0b' :
                                                        item.procedureId?.includes('crown_') ? '#8b5cf6' :
                                                        '#1e40af'
                                                 }}></div>

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
