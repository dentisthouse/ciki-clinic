import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import PatientModal from '../components/Patients/PatientModal';

const Patients = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { patients, addPatient, updatePatient, deletePatient } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);

    // Check for query params (e.g., from Dashboard "Register Patient")
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'new') {
            setIsModalOpen(true);
            setEditingPatient(null);
            // Clean up URL
            navigate('/patients', { replace: true });
        }
    }, [location, navigate]);

    const handleSavePatient = (patientData) => {
        if (patientData.id) {
            updatePatient(patientData.id, patientData);
        } else {
            addPatient(patientData);
        }
        setIsModalOpen(false);
        setEditingPatient(null);
    };

    const handleDeletePatient = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this patient?')) {
            deletePatient(id);
        }
    };

    const handleEditPatient = (e, patient) => {
        e.stopPropagation();
        setEditingPatient(patient);
        setIsModalOpen(true);
    };

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' || patient.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="animate-slide-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePatient}
                patient={editingPatient}
            />

            {/* Page Header */}
            <div className="page-header">
                <div className="page-title-group">
                    <h1>{t('pat_title')}</h1>
                    <p>{t('pat_subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingPatient(null); setIsModalOpen(true); }}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    {t('pat_new')}
                </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Search Bar - Always visible but styled differently based on state */}
                <div style={{
                    transition: 'all 0.3s ease',
                    marginTop: searchTerm ? '0' : '10vh',
                    marginBottom: '1.5rem',
                    textAlign: searchTerm ? 'left' : 'center'
                }}>
                    {!searchTerm && (
                        <div style={{ marginBottom: '2rem', color: 'var(--neutral-400)' }}>
                            <div style={{
                                width: '80px', height: '80px', background: 'var(--primary-50)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 1rem auto'
                            }}>
                                <Search size={40} color="var(--primary-500)" />
                            </div>
                            <h2 style={{ color: 'var(--neutral-700)', marginBottom: '0.5rem' }}>
                                {language === 'TH' ? 'ค้นหาผู้ป่วย' : 'Find a Patient'}
                            </h2>
                            <p>{language === 'TH' ? 'พิมพ์ชื่อ หรือ รหัสผู้ป่วยเพื่อค้นหา' : 'Enter name or ID to search'}</p>
                        </div>
                    )}

                    <div className="search-wrapper" style={{
                        maxWidth: searchTerm ? '100%' : '500px',
                        margin: searchTerm ? '0' : '0 auto',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        borderRadius: '20px',
                        overflow: 'hidden'
                    }}>
                        <input
                            type="text"
                            placeholder={t('pat_search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: searchTerm ? '0.75rem 3rem 0.75rem 1rem' : '1rem 3rem 1rem 1.5rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: 'inherit',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--neutral-400)',
                            display: 'flex',
                            alignItems: 'center',
                            pointerEvents: 'none'
                        }}>
                            <Search size={20} />
                        </div>
                    </div>
                </div>

                {/* Patient List - Only visible when searching */}
                {searchTerm ? (
                    <>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {['All', 'Active', 'Recall Due'].map((tab) => {
                                const labels = {
                                    'All': t('pat_all'),
                                    'Active': t('pat_active'),
                                    'Recall Due': t('pat_recall')
                                };
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setFilter(tab)}
                                        className="btn"
                                        style={{
                                            padding: '0.4rem 1rem',
                                            background: filter === tab ? 'white' : 'transparent',
                                            color: filter === tab ? 'var(--neutral-900)' : 'var(--neutral-500)',
                                            boxShadow: filter === tab ? 'var(--shadow-sm)' : 'none',
                                            borderColor: 'transparent',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {labels[tab]}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="table-container shadow-sm animate-fade-in" style={{ flex: 1, overflow: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('pat_col_patient')}</th>
                                        <th>{t('pat_col_contact')}</th>
                                        <th>{t('pat_col_lastvisit')}</th>
                                        <th>{t('pat_col_status')}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.map((patient) => (
                                            <tr
                                                key={patient.id}
                                                onClick={() => navigate(`/patients/${patient.id}`)}
                                                style={{ cursor: 'pointer' }}
                                                className="hover:bg-neutral-50 transition-colors"
                                            >
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            backgroundColor: patient.avatarColor || 'var(--primary-100)',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 600,
                                                            marginRight: '1rem'
                                                        }}>
                                                            {patient.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{patient.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>ID: {patient.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.875rem' }}>{patient.phone}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{patient.email}</div>
                                                </td>
                                                <td>{patient.lastVisit || (t('pat_col_lastvisit') === 'มาล่าสุด' ? 'ไม่เคย' : 'Never')}</td>
                                                <td>
                                                    <span className={`badge ${patient.status === 'Active' ? 'badge-success' :
                                                        patient.status === 'Recall Due' ? 'badge-warning' : 'badge-info'
                                                        }`}>
                                                        {patient.status === 'Active' ? t('pat_active') :
                                                            patient.status === 'Recall Due' ? t('pat_recall') : patient.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={(e) => handleEditPatient(e, patient)}>
                                                            <Edit size={16} />
                                                        </button>
                                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--danger)' }} onClick={(e) => handleDeletePatient(e, patient.id)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-400)' }}>
                                                {language === 'TH' ? 'ไม่พบข้อมูล' : 'No patients found'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default Patients;
