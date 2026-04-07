import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Trash2, Edit, Phone, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
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
        const matchesSearch = (patient.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (patient.hn?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (patient.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' || patient.status === filter;
        return matchesSearch && matchesFilter;
    });

    const recallPatients = patients.filter(p => p.status === 'Recall Due' || (p.lastVisit && new Date(p.lastVisit) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)));

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
                        <div style={{ marginBottom: '3rem', color: 'var(--neutral-400)' }}>
                            <div style={{
                                width: '100px', height: '100px', background: 'var(--primary-50)',
                                borderRadius: 'var(--radius-3xl)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 1.5rem auto',
                                boxShadow: 'var(--shadow-glow)'
                            }}>
                                <Search size={48} color="var(--primary-500)" />
                            </div>
                            <h2 style={{ color: 'var(--neutral-900)', marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 800 }}>
                                {language === 'TH' ? 'ค้นหาผู้ป่วย' : 'Find a Patient'}
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--neutral-500)' }}>{language === 'TH' ? 'พิมพ์ชื่อ หรือ รหัสผู้ป่วยเพื่อค้นหา' : 'Enter name or ID to search our patient database'}</p>
                        </div>
                    )}

                    <div className="search-wrapper" style={{
                        maxWidth: searchTerm ? '100%' : '600px',
                        margin: searchTerm ? '0' : '0 auto',
                        boxShadow: 'var(--shadow-xl)',
                        position: 'relative',
                        borderRadius: 'var(--radius-xl)',
                        overflow: 'hidden',
                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <input
                            type="text"
                            placeholder={t('pat_search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            className="form-input"
                            style={{
                                width: '100%',
                                padding: searchTerm ? '1rem 3.5rem 1rem 1.5rem' : '1.25rem 4rem 1.25rem 2rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: 'inherit',
                                fontSize: '1.1rem',
                                outline: 'none',
                                background: 'white'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            right: '1.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--primary-500)',
                            display: 'flex',
                            alignItems: 'center',
                            pointerEvents: 'none'
                        }}>
                            <Search size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Recall Dashboard - Visible when NOT searching */}
                {!searchTerm && (
                    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            {/* Recall Stats Card */}
                            <div className="card" style={{ padding: '2rem', background: 'var(--gradient-primary)', color: 'white', border: 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: 700, letterSpacing: '0.05em' }}>{language === 'TH' ? 'คนไข้ที่ต้องนัดตรวจซ้ำ' : 'RECALL NECESSARY'}</div>
                                        <div style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0.5rem 0' }}>{recallPatients.length}</div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 500 }}>{language === 'TH' ? 'คนไข้ในระบบทั้งหมด' : 'Total patients waiting'}</div>
                                    </div>
                                    <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                                        <Calendar size={32} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '2rem', border: '1px solid var(--neutral-200)', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>{language === 'TH' ? 'รายการ Recall แนะนำประจำวัน' : 'Daily Recommended Recall List'}</h3>
                                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => setSearchTerm('Recall')}>
                                    {language === 'TH' ? 'ดูทั้งหมด' : 'See All'} <ChevronRight size={14} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {recallPatients.slice(0, 5).map(patient => (
                                    <div key={patient.id} 
                                        onClick={() => navigate(`/patients/${patient.id}`)}
                                        style={{ 
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                            padding: '1rem', background: 'var(--neutral-50)', borderRadius: '16px',
                                            cursor: 'pointer', transition: 'all 0.2s ease'
                                        }}
                                        className="hover:bg-primary-50"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: patient.avatarColor || 'var(--primary-200)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{patient.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                                                    {language === 'TH' ? 'มาล่าสุดเมื่อ:' : 'Last visited:'} {patient.lastVisit || (language === 'TH' ? 'ไม่ระบุ' : 'N/A')}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                                            <a href={`tel:${patient.phone}`} className="btn btn-secondary" style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                                                <Phone size={16} />
                                            </a>
                                            <button className="btn btn-secondary" style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {recallPatients.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--neutral-400)', padding: '2rem' }}>
                                        {language === 'TH' ? 'ไม่มีรายการนัดตรวจซ้ำในช่วงนี้' : 'No recall tasks available.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                                                            marginRight: '1rem',
                                                            overflow: 'hidden'
                                                        }}>
                                                            {patient.line_picture_url ? (
                                                                <img 
                                                                    src={patient.line_picture_url} 
                                                                    alt={patient.name} 
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                patient.name.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{patient.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>HN: {patient.hn || patient.id}</div>
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
