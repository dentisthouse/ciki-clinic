import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Clock, 
    DollarSign, 
    CheckCircle, 
    AlertCircle, 
    FileText, 
    Plus, 
    Edit3, 
    Trash2,
    Save,
    Printer,
    Share2,
    Activity,
    Target,
    TrendingUp,
    User,
    Stethoscope
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const TreatmentPlanner = ({ patientId, onSavePlan }) => {
    const { language } = useLanguage();
    const { patients, treatments } = useData();
    
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [treatmentPlan, setTreatmentPlan] = useState([]);
    const [selectedPhase, setSelectedPhase] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [totalCost, setTotalCost] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);

    // ข้อมูลการรักษาที่มีอยู่
    const treatmentTemplates = [
        {
            id: 'cleaning',
            name: { TH: 'ขูดหินปูน', EN: 'Dental Cleaning' },
            category: 'preventive',
            duration: 30,
            cost: 800,
            description: { TH: 'ทำความสะอาดช่องปากและขูดหินปูน', EN: 'Oral hygiene and scaling' }
        },
        {
            id: 'filling',
            name: { TH: 'อุดฟัน', EN: 'Filling' },
            category: 'restorative',
            duration: 45,
            cost: 1500,
            description: { TH: 'อุดฟันผุด้วยวัสดุสีเดียวกับฟัน', EN: 'Tooth-colored filling' }
        },
        {
            id: 'root-canal',
            name: { TH: 'รักษารากฟัน', EN: 'Root Canal Treatment' },
            category: 'endodontic',
            duration: 90,
            cost: 8000,
            description: { TH: 'รักษารากฟันที่ติดเชื้อ', EN: 'Infected root canal treatment' }
        },
        {
            id: 'crown',
            name: { TH: 'ครอวน์ฟัน', EN: 'Dental Crown' },
            category: 'prosthetic',
            duration: 60,
            cost: 12000,
            description: { TH: 'ครอวน์ฟันพอร์ซเลน', EN: 'Porcelain crown' }
        },
        {
            id: 'implant',
            name: { TH: 'อิมแพลนต์', EN: 'Dental Implant' },
            category: 'implant',
            duration: 120,
            cost: 35000,
            description: { TH: 'ปลูกฟันเทียม', EN: 'Artificial tooth implant' }
        },
        {
            id: 'extraction',
            name: { TH: 'ถอนฟัน', EN: 'Tooth Extraction' },
            category: 'surgical',
            duration: 30,
            cost: 1000,
            description: { TH: 'ถอนฟันที่ไม่สามารถรักษาได้', EN: 'Removal of non-restorable tooth' }
        },
        {
            id: 'orthodontics',
            name: { TH: 'จัดฟัน', EN: 'Orthodontics' },
            category: 'orthodontic',
            duration: 180,
            cost: 80000,
            description: { TH: 'จัดฟันผิดปกติ', EN: 'Correction of malocclusion' }
        },
        {
            id: 'whitening',
            name: { TH: 'ฟันขาว', EN: 'Teeth Whitening' },
            category: 'cosmetic',
            duration: 60,
            cost: 5000,
            description: { TH: 'ทำฟันขาวในคลินิก', EN: 'In-office teeth whitening' }
        }
    ];

    const categories = {
        preventive: { TH: 'ป้องกัน', EN: 'Preventive', color: '#10b981' },
        restorative: { TH: 'ฟื้นฟู', EN: 'Restorative', color: '#3b82f6' },
        endodontic: { TH: 'รากฟัน', EN: 'Endodontic', color: '#8b5cf6' },
        prosthetic: { TH: 'ฟันเทียม', EN: 'Prosthetic', color: '#f59e0b' },
        implant: { TH: 'อิมแพลนต์', EN: 'Implant', color: '#ef4444' },
        surgical: { TH: 'ศัลยกรรม', EN: 'Surgical', color: '#6b7280' },
        orthodontic: { TH: 'จัดฟัน', EN: 'Orthodontic', color: '#ec4899' },
        cosmetic: { TH: 'ความงาม', EN: 'Cosmetic', color: '#14b8a6' }
    };

    useEffect(() => {
        if (patientId && patients) {
            const patient = patients.find(p => p.id === patientId);
            setSelectedPatient(patient);
            loadExistingPlan(patientId);
        }
    }, [patientId, patients]);

    useEffect(() => {
        calculateTotals();
    }, [treatmentPlan]);

    const loadExistingPlan = (patientId) => {
        // จำลองการโหลดแผนการรักษาที่มีอยู่
        const existingPlan = [
            {
                id: '1',
                treatmentId: 'cleaning',
                phase: 1,
                priority: 'high',
                teeth: ['11', '16', '26', '31', '36'],
                estimatedDate: '2024-02-01',
                notes: 'ต้องทำก่อนการรักษาอื่นๆ',
                status: 'planned'
            },
            {
                id: '2',
                treatmentId: 'filling',
                phase: 1,
                priority: 'high',
                teeth: ['16', '26'],
                estimatedDate: '2024-02-01',
                notes: 'อุดฟันผุขนาดใหญ่',
                status: 'planned'
            }
        ];
        
        setTreatmentPlan(existingPlan);
    };

    const calculateTotals = () => {
        const cost = treatmentPlan.reduce((sum, item) => {
            const template = treatmentTemplates.find(t => t.id === item.treatmentId);
            return sum + (template?.cost || 0);
        }, 0);
        
        const duration = treatmentPlan.reduce((sum, item) => {
            const template = treatmentTemplates.find(t => t.id === item.treatmentId);
            return sum + (template?.duration || 0);
        }, 0);
        
        setTotalCost(cost);
        setTotalDuration(duration);
    };

    const addTreatment = (template) => {
        const newTreatment = {
            id: Date.now().toString(),
            treatmentId: template.id,
            phase: selectedPhase,
            priority: 'medium',
            teeth: [],
            estimatedDate: calculateEstimatedDate(selectedPhase),
            notes: '',
            status: 'planned'
        };
        
        setTreatmentPlan([...treatmentPlan, newTreatment]);
    };

    const updateTreatment = (id, updates) => {
        setTreatmentPlan(treatmentPlan.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    const removeTreatment = (id) => {
        setTreatmentPlan(treatmentPlan.filter(item => item.id !== id));
    };

    const calculateEstimatedDate = (phase) => {
        const today = new Date();
        const daysToAdd = (phase - 1) * 30; // แต่ละเฟสห่างกัน 30 วัน
        const estimatedDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        return estimatedDate.toISOString().split('T')[0];
    };

    const saveTreatmentPlan = () => {
        const planData = {
            patientId,
            treatments: treatmentPlan,
            totalCost,
            totalDuration,
            phases: Math.max(...treatmentPlan.map(t => t.phase)),
            createdAt: new Date().toISOString(),
            createdBy: 'ทันตแพทย์'
        };
        
        if (onSavePlan) {
            onSavePlan(planData);
        }
        
        setIsEditing(false);
    };

    const exportPlan = () => {
        // จำลองการส่งออกแผนการรักษา
        const planData = {
            patient: selectedPatient,
            treatments: treatmentPlan.map(item => ({
                ...item,
                template: treatmentTemplates.find(t => t.id === item.treatmentId)
            })),
            totalCost,
            totalDuration,
            exportedAt: new Date().toISOString()
        };
        
        console.log('Exporting treatment plan:', planData);
        
        // สร้างไฟล์ PDF (ใน production จะใช้ library จริง)
        const dataStr = JSON.stringify(planData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `treatment-plan-${patientId}-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const getTreatmentTemplate = (treatmentId) => {
        return treatmentTemplates.find(t => t.id === treatmentId);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority) => {
        const texts = {
            high: language === 'TH' ? 'สูง' : 'High',
            medium: language === 'TH' ? 'ปานกลาง' : 'Medium',
            low: language === 'TH' ? 'ต่ำ' : 'Low'
        };
        return texts[priority] || texts.medium;
    };

    const filteredPlan = treatmentPlan.filter(item => item.phase === selectedPhase);
    const phases = [...new Set(treatmentPlan.map(item => item.phase))].sort((a, b) => a - b);

    if (!selectedPatient) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <User size={48} color="var(--neutral-400)" />
                <p style={{ color: 'var(--neutral-600)' }}>
                    {language === 'TH' ? 'กรุณาเลือกผู้ป่วย' : 'Please select a patient'}
                </p>
            </div>
        );
    }

    return (
        <div className="treatment-planner" style={{ padding: '2rem' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Target size={28} color="var(--primary-600)" />
                            {language === 'TH' ? 'แผนการรักษา' : 'Treatment Plan'}
                        </h2>
                        <p style={{ color: 'var(--neutral-600)', marginTop: '0.5rem' }}>
                            {selectedPatient.name} • ID: {selectedPatient.id}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Edit3 size={18} />
                            {isEditing ? (language === 'TH' ? 'ดู' : 'View') : (language === 'TH' ? 'แก้ไข' : 'Edit')}
                        </button>
                        <button onClick={exportPlan} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Share2 size={18} />
                            {language === 'TH' ? 'ส่งออก' : 'Export'}
                        </button>
                        {isEditing && (
                            <button onClick={saveTreatmentPlan} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={18} />
                                {language === 'TH' ? 'บันทึก' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                            {treatmentPlan.length}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'การรักษาทั้งหมด' : 'Total Treatments'}
                        </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                            ฿{totalCost.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'ค่ารักษารวม' : 'Total Cost'}
                        </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                            {Math.ceil(totalDuration / 60)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'ชั่วโมงที่ใช้' : 'Hours Required'}
                        </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                            {phases.length}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                            {language === 'TH' ? 'ระยะเวลา' : 'Phases'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Phase Selection */}
            {phases.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        {phases.map(phase => (
                            <button
                                key={phase}
                                onClick={() => setSelectedPhase(phase)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid',
                                    borderColor: selectedPhase === phase ? 'var(--primary-600)' : 'var(--neutral-200)',
                                    background: selectedPhase === phase ? 'var(--primary-50)' : 'white',
                                    color: selectedPhase === phase ? 'var(--primary-700)' : 'var(--neutral-600)',
                                    fontWeight: 600
                                }}
                            >
                                {language === 'TH' ? 'ระยะที่' : 'Phase'} {phase}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Treatment Templates (for editing) */}
            {isEditing && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'เพิ่มการรักษา' : 'Add Treatment'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {treatmentTemplates.map(template => {
                            const category = categories[template.category];
                            return (
                                <div 
                                    key={template.id}
                                    onClick={() => addTreatment(template)}
                                    style={{
                                        padding: '1.5rem',
                                        border: '1px solid var(--neutral-200)',
                                        borderRadius: '12px',
                                        background: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--primary-300)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--neutral-200)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                                            {language === 'TH' ? template.name.TH : template.name.EN}
                                        </h4>
                                        <div style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: `${category.color}10`,
                                            color: category.color
                                        }}>
                                            {language === 'TH' ? category.TH : category.EN}
                                        </div>
                                    </div>
                                    
                                    <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '1rem' }}>
                                        {language === 'TH' ? template.description.TH : template.description.EN}
                                    </p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={14} color="var(--neutral-500)" />
                                            <span>{template.duration} {language === 'TH' ? 'นาที' : 'min'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <DollarSign size={14} color="var(--neutral-500)" />
                                            <span>฿{template.cost.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Current Phase Treatments */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} color="var(--primary-600)" />
                    {language === 'TH' ? 'ระยะที่' : 'Phase'} {selectedPhase} - {language === 'TH' ? 'การรักษา' : 'Treatments'}
                </h3>
                
                {filteredPlan.length === 0 ? (
                    <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: '2rem' }}>
                        {language === 'TH' ? 'ไม่มีการรักษาในระยะนี้' : 'No treatments in this phase'}
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredPlan.map(item => {
                            const template = getTreatmentTemplate(item.treatmentId);
                            const category = categories[template?.category];
                            
                            return (
                                <div key={item.id} style={{
                                    padding: '1.5rem',
                                    border: '1px solid var(--neutral-200)',
                                    borderRadius: '12px',
                                    background: 'white'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                                                    {language === 'TH' ? template?.name.TH : template?.name.EN}
                                                </h4>
                                                <div style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: `${category?.color}10`,
                                                    color: category?.color
                                                }}>
                                                    {language === 'TH' ? category?.TH : category?.EN}
                                                </div>
                                                <div style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: `${getPriorityColor(item.priority)}10`,
                                                    color: getPriorityColor(item.priority)
                                                }}>
                                                    {getPriorityText(item.priority)}
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Clock size={14} />
                                                    <span>{template?.duration} {language === 'TH' ? 'นาที' : 'min'}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <DollarSign size={14} />
                                                    <span>฿{template?.cost.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} />
                                                    <span>{item.estimatedDate}</span>
                                                </div>
                                            </div>
                                            
                                            {item.teeth.length > 0 && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '0.5rem' }}>
                                                    {language === 'TH' ? 'ฟัน:' : 'Teeth:'} {item.teeth.join(', ')}
                                                </div>
                                            )}
                                            
                                            {item.notes && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                                    {language === 'TH' ? 'หมายเหตุ:' : 'Notes:'} {item.notes}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {isEditing && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => removeTreatment(item.id)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.5rem' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreatmentPlanner;
