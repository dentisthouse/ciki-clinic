import React, { useState } from 'react';
import { Search, User, ArrowRight, Activity, FileText } from 'lucide-react';
import DigitalToothChart from '../components/EHR/DigitalToothChart';
import TreatmentEntry from '../components/EHR/TreatmentEntry';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

const Charting = () => {
    const { t, language } = useLanguage();
    const { patients, updateToothChart, addTreatment } = useData();

    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeeth, setSelectedTeeth] = useState([]);
    const [plannedTreatments, setPlannedTreatments] = useState([]);

    const handleToothSelect = (id) => {
        setSelectedTeeth(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleAddTreatment = (treatment) => {
        // Add treatment to local list for display
        setPlannedTreatments([treatment, ...plannedTreatments]);

        // Save treatment to patient record
        if (selectedPatientId) {
            addTreatment(selectedPatientId, treatment);

            // Update tooth status based on procedure
            const newStatus = getStatusFromProcedure(treatment.procedure);
            treatment.teeth.forEach(toothId => {
                updateToothChart(selectedPatientId, toothId, newStatus);
            });
        }

        setSelectedTeeth([]);
    };

    // Map procedure to tooth status
    const getStatusFromProcedure = (procedure) => {
        const filled = ['Filling', 'Composite', 'Amalgam', 'Crown', 'Inlay', 'Onlay', 'Root Canal'];
        const missing = ['Extraction', 'Extract'];

        if (filled.some(f => procedure.toLowerCase().includes(f.toLowerCase()))) return 'filled';
        if (missing.some(m => procedure.toLowerCase().includes(m.toLowerCase()))) return 'missing';
        return 'filled'; // Default for most treatments
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    return (
        <div className="animate-slide-up">
            <div className="page-header">
                <div className="page-title-group">
                    <h1>{t('nav_charting')}</h1>
                    <p>{t('prof_digital_odontogram')}</p>
                </div>
            </div>

            {!selectedPatient ? (
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{t('pat_search')}</h2>

                    <div className="search-wrapper" style={{ marginBottom: '2rem' }}>
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '1rem', fontSize: '1rem' }}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filteredPatients.slice(0, 5).map(patient => (
                            <button
                                key={patient.id}
                                onClick={() => {
                                    setSelectedPatientId(patient.id);
                                    setPlannedTreatments([]);
                                    setSelectedTeeth([]);
                                }}
                                className="card-hover"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    border: '1px solid var(--neutral-200)',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: patient.avatarColor || '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 700
                                    }}>
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{patient.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                                            ID: {patient.id} • {patient.age} {language === 'TH' ? 'ปี' : 'y/o'}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight size={20} color="var(--neutral-400)" />
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* Patient Header */}
                    <div className="card shadow-sm" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setSelectedPatientId(null);
                                    setPlannedTreatments([]);
                                    setSelectedTeeth([]);
                                }}
                            >
                                {language === 'TH' ? 'เปลี่ยนคนไข้' : 'Change Patient'}
                            </button>
                            <div style={{ borderLeft: '1px solid var(--neutral-200)', paddingLeft: '1rem' }}>
                                <h3 style={{ margin: 0 }}>{selectedPatient.name}</h3>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                                    {language === 'TH' ? 'อายุ' : 'Age'}: {selectedPatient.age} {language === 'TH' ? 'ปี' : 'years'}
                                </p>
                            </div>
                        </div>
                        <div className="badge badge-info">{t('pat_status')}: {selectedPatient.status}</div>
                    </div>

                    {/* Main Content */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
                        {/* Tooth Chart */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={20} color="var(--primary-600)" />
                                {t('prof_digital_odontogram')}
                            </h3>
                            <DigitalToothChart
                                onToothSelect={handleToothSelect}
                                selectedTeeth={selectedTeeth}
                                toothChart={selectedPatient.toothChart || {}}
                            />
                        </div>

                        {/* Right Panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <TreatmentEntry selectedTeeth={selectedTeeth} onAddTreatment={handleAddTreatment} />

                            {/* Planned Treatments */}
                            <div className="card shadow-sm">
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={18} />
                                    {t('prof_planned_this_visit')}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {plannedTreatments.map((tr, i) => (
                                        <div key={i} style={{ padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-100)' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tr.procedure}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                                                {language === 'TH' ? 'ซี่' : 'Teeth'}: {tr.teeth.join(', ')} • {tr.surface || 'Whole'}
                                            </div>
                                        </div>
                                    ))}
                                    {plannedTreatments.length === 0 && (
                                        <p style={{ color: 'var(--neutral-400)', textAlign: 'center', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                            {t('prof_empty_plan')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Treatment History */}
                            {selectedPatient.treatments && selectedPatient.treatments.length > 0 && (
                                <div className="card shadow-sm">
                                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                                        📋 {language === 'TH' ? 'ประวัติการรักษา' : 'Treatment History'}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                        {selectedPatient.treatments.slice(0, 10).map((tr, i) => (
                                            <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#f0fdf4', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #10b981' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }}>{tr.procedure}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                    {language === 'TH' ? 'ซี่' : 'Teeth'}: {tr.teeth?.join(', ')} • {new Date(tr.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Charting;
