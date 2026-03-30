import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import TreatmentPlanner from '../components/Dentist/TreatmentPlanner';
import { User, Search } from 'lucide-react';

const TreatmentPlan = () => {
    const { language } = useLanguage();
    const { patients } = useData();
    const { staff } = useAuth();
    
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);

    useEffect(() => {
        if (patients) {
            const filtered = patients.filter(patient =>
                patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPatients(filtered);
        }
    }, [patients, searchTerm]);

    const handlePatientSelect = (patientId) => {
        setSelectedPatientId(patientId);
    };

    const handleSavePlan = (planData) => {
        console.log('Treatment plan saved:', planData);
        // ใน production จะบันทึกลง database
        alert(language === 'TH' ? 'บันทึกแผนการรักษาเรียบร้อยแล้ว' : 'Treatment plan saved successfully');
    };

    const selectedPatient = patients?.find(p => p.id === selectedPatientId);

    if (!staff || staff.role !== 'dentist') {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>{language === 'TH' ? 'เข้าถึงไม่ได้' : 'Access Denied'}</h2>
                <p style={{ color: 'var(--neutral-600)' }}>
                    {language === 'TH' ? 'ฟีเจอร์นี้สำหรับทันตแพทย์เท่านั้น' : 'This feature is for dentists only'}
                </p>
            </div>
        );
    }

    return (
        <div className="treatment-plan-page">
            {!selectedPatientId ? (
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        {language === 'TH' ? 'เลือกผู้ป่วยเพื่อสร้างแผนการรักษา' : 'Select Patient for Treatment Plan'}
                    </h2>

                    <div className="search-wrapper" style={{ marginBottom: '2rem', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                        <input
                            type="text"
                            placeholder={language === 'TH' ? 'ค้นหาผู้ป่วย...' : 'Search patients...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                fontSize: '1rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px'
                            }}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filteredPatients.slice(0, 10).map(patient => (
                            <button
                                key={patient.id}
                                onClick={() => handlePatientSelect(patient.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    border: '1px solid var(--neutral-200)',
                                    borderRadius: '12px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
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
                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                                    {patient.phone}
                                </div>
                            </button>
                        ))}
                    </div>

                    {filteredPatients.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-600)' }}>
                            <User size={48} color="var(--neutral-300)" />
                            <p style={{ marginTop: '1rem' }}>
                                {language === 'TH' ? 'ไม่พบผู้ป่วยที่ตรงกับการค้นหา' : 'No patients found matching your search'}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <TreatmentPlanner 
                    patientId={selectedPatientId}
                    onSavePlan={handleSavePlan}
                />
            )}
        </div>
    );
};

export default TreatmentPlan;
