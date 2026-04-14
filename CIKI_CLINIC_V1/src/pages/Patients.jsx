import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Plus, Search, Calendar, ChevronRight, Phone, MessageSquare, History, Edit, Trash2 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import PatientModal from '../components/Patients/PatientModal';
import '../styles/patients.css';

const Patients = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { patients, addPatient, updatePatient, deletePatient } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    const langT = (th, en) => (language === 'TH' ? th : en);

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
        <div className="patients-container animate-slide-up">
            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePatient}
                patient={editingPatient}
            />

            {/* Page Header */}
            <div className="patients-header">
                <div className="patients-title-group">
                    <h1>{t('pat_title')}</h1>
                    <p>{t('pat_subtitle')}</p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => { setEditingPatient(null); setIsModalOpen(true); }}
                >
                    <Plus size={20} strokeWidth={3} />
                    {t('pat_new')}
                </button>
            </div>

            {/* Search Section */}
            <div className={`search-bar-animated ${searchTerm ? 'compact' : ''}`}>
                {!searchTerm && (
                    <div className="search-dashboard-full">
                        <div className="search-icon-hero">
                            <Search size={48} strokeWidth={2.5} />
                        </div>
                        <h2>{langT('ค้นหาผู้ป่วย', 'Find a Patient')}</h2>
                        <p>{langT('พิมพ์ชื่อ หรือ รหัสผู้ป่วยเพื่อค้นหา หรือค้นหาจาก CN เพื่อดึงข้อมูลประวัติการรักษาทั้งหมด', 'Enter name, ID, or CN to retrieve full clinical records and visit history.')}</p>
                    </div>
                )}

                <div className="search-container-inner" style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={t('pat_search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="search-input-premium"
                    />
                    <div className="search-hint-icon">
                        <Search size={searchTerm ? 20 : 26} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* Dashboard Context (Only when not searching) */}
            {!searchTerm && (
                <div className="recall-dashboard-grid animate-fade-in">
                    {/* Recall Stats Hero */}
                    <div className="recall-stats-hero">
                        <div>
                            <h3>{langT('คนไข้ที่ต้องนัดตรวจซ้ำ', 'RECALL DUE')}</h3>
                            <div className="recall-count-massive">{recallPatients.length}</div>
                            <div className="recall-subtitle">{langT('คนไข้ที่ถึงรอบนัดตรวจสุขภาพฟันประจำปี', 'Patients due for annual checkup & prophylaxis')}</div>
                        </div>
                        <div className="recall-icon-glass">
                            <Calendar size={36} strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Recommended List */}
                    <div className="recall-list-container">
                        <div className="recall-list-header">
                            <h3>{langT('รายการ Recall แนะนำประจำวัน', 'Daily Recommendations')}</h3>
                            <button 
                                className="icon-btn-ghost-premium" 
                                onClick={() => setSearchTerm('Recall')}
                            >
                                {langT('ดูทั้งหมด', 'View Full List')} <ChevronRight size={18} strokeWidth={3} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recallPatients.slice(0, 4).map(patient => (
                                <div key={patient.id} 
                                    onClick={() => navigate(`/patients/${patient.id}`)}
                                    className="patient-row-card"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="patient-avatar-main" style={{ background: patient.avatarColor || 'var(--primary-200)', color: 'white' }}>
                                            {patient.line_picture_url ? (
                                                <img src={patient.line_picture_url} alt={patient.name} />
                                            ) : (
                                                patient.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="patient-basic-info">
                                            <h5>{patient.name}</h5>
                                            <div className="patient-visit-meta">
                                                {langT('มาล่าสุด:', 'Last visit:')} {patient.lastVisit || langT('ยังไม่เคยระบุ', 'N/A')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="contact-action-group" onClick={e => e.stopPropagation()}>
                                        <a href={`tel:${patient.phone}`} className="action-pill-square" title="Call">
                                            <Phone size={16} />
                                        </a>
                                        <button className="action-pill-square" title="Message">
                                            <MessageSquare size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {recallPatients.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--neutral-400)', padding: '3rem' }}>
                                    <History size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                    <p style={{ fontWeight: 800 }}>{langT('ไม่มีรายการแจ้งเตือนในวันนี้', 'Your recall list is clear')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Patient List - Only visible when searching */}
            {searchTerm ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="tab-navigation-premium" style={{ marginBottom: '1.5rem', border: 'none' }}>
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
                                    className={`tab-btn-premium ${filter === tab ? 'active' : ''}`}
                                >
                                    {labels[tab]}
                                </button>
                            );
                        })}
                    </div>

                    <div className="patient-table-wrapper animate-fade-in" style={{ flex: 1, overflow: 'auto' }}>
                        <table className="patient-table">
                            <thead>
                                <tr>
                                    <th>{t('pat_col_patient')}</th>
                                    <th>{t('pat_col_contact')}</th>
                                    <th>{t('pat_col_lastvisit')}</th>
                                    <th>{t('pat_col_status')}</th>
                                    <th style={{ textAlign: 'right' }}>{langT('จัดการ', 'Manage')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            onClick={() => navigate(`/patients/${patient.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div className="patient-avatar-main" style={{ backgroundColor: patient.avatarColor || 'var(--primary-100)', color: 'white', marginRight: '1rem' }}>
                                                        {patient.line_picture_url ? (
                                                            <img src={patient.line_picture_url} alt={patient.name} />
                                                        ) : (
                                                            patient.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: 'var(--neutral-800)' }}>{patient.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 600 }}>
                                                            {patient.hn && patient.hn.length < 20 ? `CN: ${patient.hn}` : langT('ยังไม่ได้ออก CN', 'No CN Assigned')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neutral-700)' }}>{patient.phone}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 500 }}>{patient.email}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--neutral-600)' }}>
                                                    {patient.lastVisit || langT('ยังไม่เคยระบุ', 'Never')}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge-status ${
                                                    patient.status === 'Active' ? 'badge-active' :
                                                    patient.status === 'Recall Due' ? 'badge-recall' : 'badge-info'
                                                }`}>
                                                    {patient.status === 'Active' ? t('pat_active') :
                                                        patient.status === 'Recall Due' ? t('pat_recall') : patient.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                                                    <button className="action-pill-square" onClick={(e) => handleEditPatient(e, patient)}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="action-pill-square" style={{ color: 'var(--danger-600)' }} onClick={(e) => handleDeletePatient(e, patient.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '6rem 0' }}>
                                            <div style={{ opacity: 0.2, marginBottom: '1rem' }}>
                                                <Search size={48} style={{ margin: '0 auto' }} />
                                            </div>
                                            <p style={{ fontWeight: 800, color: 'var(--neutral-400)' }}>{langT('ไม่พบข้อมูลผู้ป่วยที่คุณค้นหา', 'No patients found matching your search term')}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default Patients;
