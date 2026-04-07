import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Phone, Mail, MapPin, Calendar, Clock, FileText,
    Shield, Activity, DollarSign, Plus, ArrowLeft,
    CheckCircle, AlertCircle, Edit2, Trash2, Ruler, Image as ImageIcon
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import PatientModal from '../components/Patients/PatientModal';

import HistoryTab from '../components/EHR/HistoryTab';
import BillingTab from '../components/EHR/BillingTab';
import OrthoChartTab from '../components/Ortho/OrthoChartTab';
import PhotoGalleryTab from '../components/Ortho/PhotoGalleryTab';
import InstallmentPlan from '../components/Billing/InstallmentPlan';
import ImagingTab from '../components/EHR/ImagingTab';
import TreatmentPlanTab from '../components/EHR/TreatmentPlanTab';
import LoadingSpinner from '../components/System/LoadingSpinner';
import DocumentModal from '../components/Documents/DocumentModal';

// Components
const MedicalAlertModal = ({ patient, onClose }) => {
    const alerts = (patient.medicalHistory || []).filter(h => h !== 'None');
    if (alerts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="animate-scale-in" style={{
                background: '#fff', padding: '2rem', borderRadius: '16px',
                width: '90%', maxWidth: '500px', textAlign: 'center',
                border: '4px solid #ef4444', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{
                    width: '80px', height: '80px', background: '#fee2e2', color: '#dc2626',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <AlertCircle size={48} />
                </div>

                <h2 style={{ color: '#dc2626', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {t('prof_medical_alerts')}
                </h2>
                <p style={{ color: '#7f1d1d', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    {patient.name} {language === 'TH' ? 'มีสภาวะทางการแพทย์ดังนี้:' : 'has the following conditions:'}
                </p>

                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '2.5rem'
                }}>
                    {alerts.map((alert, idx) => (
                        <span key={idx} style={{
                            padding: '0.75rem 1.5rem', background: '#fecaca', color: '#991b1b',
                            borderRadius: '50px', fontSize: '1.2rem', fontWeight: 700,
                            border: '2px solid #f87171'
                        }}>
                            {alert}
                        </span>
                    ))}
                </div>

                <div style={{ padding: '1rem', background: '#fff7ed', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fed7aa', color: '#9a3412', textAlign: 'left', display: 'flex', gap: '1rem' }}>
                    <Shield size={24} />
                    <span style={{ fontSize: '0.9rem' }}>Please review medical history carefully before proceeding with any treatment or prescription.</span>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '1rem', background: '#dc2626', color: 'white',
                        border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 700,
                        cursor: 'pointer', transition: 'background 0.2s'
                    }}
                >
                    ACKNOWLEDGE
                </button>
            </div>
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ padding: '0.5rem', background: 'var(--neutral-100)', borderRadius: '8px', color: 'var(--neutral-500)' }}>
            <Icon size={16} />
        </div>
        <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '0.25rem' }}>{label}</p>
            <p style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{value || '-'}</p>
        </div>
    </div>
);

// MAIN COMPONENT
const PatientProfile = () => {
    const { t, language } = useLanguage();
    const { permissions, isAdmin } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const { patients, updatePatient } = useData();
    const patient = patients.find(p => p.id === id);
    const [searchParams] = useSearchParams();

    // Check permissions (Bypass for Admin/Owner)
    const canViewClinical = isAdmin || permissions?.patients?.clinical || false;
    const canViewHistory = isAdmin || permissions?.patients?.history || false;
    const canViewBilling = isAdmin || permissions?.billing?.view || false;

    const [activeTab, setActiveTab] = useState(
        searchParams.get('tab') || (canViewClinical ? 'history' : 'billing')
    );

    // Sync tab when permissions finish loading (Prevent getting stuck on billing tab)
    React.useEffect(() => {
        if (canViewClinical && activeTab === 'billing' && !searchParams.get('tab')) {
            setActiveTab('plans');
        }
    }, [canViewClinical]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);

    // Check for alerts on mount
    React.useEffect(() => {
        if (patient) {
            const hasConditions = Array.isArray(patient.medicalHistory)
                ? patient.medicalHistory.some(h => h !== 'None')
                : (patient.medicalHistory && patient.medicalHistory !== 'None');

            if (hasConditions) {
                setShowAlert(true);
            }
        }
    }, [patient]);

    if (!patient) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2>{t('prof_not_found')}</h2>
                <button className="btn btn-primary" onClick={() => navigate('/patients')}>{t('prof_back_dir')}</button>
            </div>
        );
    }

    const handleSaveTreatment = (treatmentData) => {
        const newTreatment = {
            id: `TRT${Date.now()}`,
            ...treatmentData,
            date: new Date().toISOString(),
            paymentStatus: 'unpaid'
        };

        const updatedTreatments = [newTreatment, ...(patient.treatments || [])];

        // Auto-update tooth chart based on procedure
        const newToothChart = { ...(patient.toothChart || {}) };
        const status = getStatusFromProcedure(treatmentData.procedure);
        treatmentData.teeth?.forEach(id => {
            newToothChart[id] = status;
        });

        updatePatient(patient.id, {
            treatments: updatedTreatments,
            toothChart: newToothChart,
            lastVisit: new Date().toISOString().split('T')[0]
        });

        alert(language === 'TH' ? 'บันทึกการรักษาเรียบร้อย' : 'Treatment saved successfully');
    };

    const handleUpdateToothStatus = (newChart) => {
        updatePatient(patient.id, { toothChart: newChart });
    };

    const getStatusFromProcedure = (procedure) => {
        const proc = procedure?.toLowerCase() || '';
        if (proc.includes('extraction') || proc.includes('missing')) return 'missing';
        if (proc.includes('filling') || proc.includes('composite') || proc.includes('amalgam')) return 'filled';
        if (proc.includes('crown')) return 'crown';
        if (proc.includes('root canal')) return 'rootCanal';
        return 'normal';
    };

    // Calculate total unpaid amount for badge
    const unpaidTreatments = (patient.treatments || []).filter(t => t.paymentStatus !== 'paid');

    // Only show tabs the user has permission for
    const tabs = [
        canViewClinical && { id: 'plans', label: language === 'TH' ? 'แผนการรักษา' : 'Treatment Plan', icon: FileText },
        canViewClinical && { id: 'ortho', label: language === 'TH' ? 'จัดฟัน' : 'Ortho Chart', icon: Ruler },
        canViewClinical && { id: 'gallery', label: language === 'TH' ? 'รูปถ่าย' : 'Gallery', icon: ImageIcon },
        canViewClinical && { id: 'imaging', label: t('prof_imaging'), icon: ImageIcon },
        canViewHistory && { id: 'history', label: language === 'TH' ? 'ประวัติการรักษา' : 'Treatment History', icon: Calendar },
        canViewBilling && { id: 'billing', label: t('nav_billing'), icon: DollarSign, badge: unpaidTreatments.length > 0 ? unpaidTreatments.length : null },
    ].filter(Boolean);

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header */}
            <div className="glass-panel-premium animate-fade-in" style={{ 
                padding: '2.5rem', marginBottom: '2.5rem', 
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--neutral-100)',
                background: 'linear-gradient(135deg, white 0%, var(--primary-50) 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/patients')} style={{ 
                        padding: '0.75rem', borderRadius: '50%', background: 'white', border: '1.5px solid var(--neutral-200)' 
                    }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ 
                            width: '72px', height: '72px', borderRadius: '24px', 
                            background: 'var(--gradient-primary)', color: 'white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '2rem', fontWeight: 900, boxShadow: 'var(--shadow-md)'
                        }}>
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.35rem', color: 'var(--neutral-900)', letterSpacing: '-0.04em' }}>{patient.name}</h1>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '1rem', color: 'var(--neutral-500)', fontWeight: 600 }}>
                                <span style={{ color: 'var(--primary-600)', fontWeight: 800 }}>{patient.id}</span>
                                <span>•</span>
                                <span>{patient.gender === 'Male' ? (language === 'TH' ? 'ชาย' : 'Male') : (language === 'TH' ? 'หญิง' : 'Female')}</span>
                                <span>•</span>
                                <span>{patient.age} {language === 'TH' ? 'ปี' : 'years old'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ 
                        padding: '0.8rem 1.25rem', borderRadius: '14px', fontWeight: 700,
                        background: 'white', border: '1.5px solid var(--neutral-200)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }} onClick={() => setIsEditModalOpen(true)}>
                        <Edit2 size={18} />
                        {t('btn_edit_profile')}
                    </button>
                    <button className="btn btn-primary" style={{ 
                        padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none'
                    }} onClick={() => setIsDocModalOpen(true)}>
                        <FileText size={20} />
                        {language === 'TH' ? 'จัดการเอกสาร' : 'Docs'}
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                {/* Left Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Patient Info Card */}
                    <div className="card glass-panel-premium" style={{ 
                        padding: '1.75rem', background: 'white', borderRadius: 'var(--radius-xl)', 
                        border: '1px solid var(--neutral-100)', boxShadow: 'var(--shadow-sm)'
                    }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('pat_info')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <InfoItem icon={Phone} label={t('pat_form_phone')} value={patient.phone} />
                            <InfoItem icon={Mail} label={t('pat_form_email')} value={patient.email} />
                            <InfoItem icon={MapPin} label={t('pat_form_address')} value={patient.address} />
                            <InfoItem icon={Calendar} label={t('pat_form_last_visit')} value={patient.lastVisit} />
                            <InfoItem icon={Shield} label={t('pat_form_insurance')} value={patient.insurance || '-'} />
                            {patient.insuranceType === 'SSO' && (() => {
                                const currentYear = new Date().getFullYear();
                                const used = (patient.treatments || [])
                                    .filter(t => t.paymentStatus === 'paid' && t.insuranceClaimAmount > 0 && new Date(t.paidDate).getFullYear() === currentYear)
                                    .reduce((sum, t) => sum + (t.insuranceClaimAmount || 0), 0);
                                const remaining = Math.max(0, 900 - used);
                                return (
                                    <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--success-50)', borderRadius: '12px', border: '1px solid var(--success-100)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--success-700)', fontWeight: 800 }}>SSO Dental Balance</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: remaining > 0 ? 'var(--success-600)' : 'var(--danger-700)' }}>฿{remaining}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'var(--success-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(100, (used / 900) * 100)}%`, height: '100%', background: remaining > 0 ? 'var(--success-500)' : 'var(--danger-500)' }} />
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--success-600)', marginTop: '4px', fontWeight: 600 }}>
                                            Allocated: ฿{used} / 900
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Medical History Card */}
                    <div className="card" style={{ padding: '1.5rem', background: '#fffbeb', border: '1px solid #fcd34d' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <AlertCircle size={20} color="#d97706" />
                            <h3 style={{ fontSize: '1rem', color: '#92400e', margin: 0 }}>{t('pat_form_history')}</h3>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#b45309', lineHeight: 1.5 }}>
                            {Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : patient.medicalHistory || t('pat_no_history')}
                        </p>
                    </div>
                </div>

                {/* Right Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {/* Tabs */}
                    <div style={{ 
                        display: 'flex', gap: '0.5rem', background: 'var(--neutral-50)', 
                        padding: '0.5rem', borderRadius: '16px 16px 0 0', border: '1px solid var(--neutral-100)', borderBottom: 'none'
                    }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1, padding: '0.85rem', border: 'none', cursor: 'pointer',
                                    borderRadius: '12px',
                                    background: activeTab === tab.id ? 'var(--neutral-900)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--neutral-500)',
                                    fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
                                    position: 'relative', transition: 'all 0.2s ease',
                                    boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.badge && (
                                    <span style={{
                                        background: 'var(--danger-500)', color: 'white', fontSize: '0.7rem',
                                        padding: '2px 8px', borderRadius: '20px', marginLeft: '4px', fontWeight: 900
                                    }}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ background: 'white', border: '1px solid var(--neutral-200)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '2rem', minHeight: '500px' }}>
                        {activeTab === 'plans' && (
                            <TreatmentPlanTab patient={patient} language={language} onUpdateToothStatus={handleUpdateToothStatus} />
                        )}
                        {activeTab === 'ortho' && (
                            <OrthoChartTab patient={patient} language={language} onUpdate={updatePatient} />
                        )}
                        {activeTab === 'gallery' && (
                            <PhotoGalleryTab patient={patient} language={language} onUpdate={updatePatient} />
                        )}
                        {activeTab === 'imaging' && <ImagingTab patientId={patient.id} />}
                        {activeTab === 'history' && (
                            <HistoryTab patient={patient} treatmentHistory={patient.treatments || []} language={language} />
                        )}
                        {activeTab === 'billing' && (
                            <div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-700)' }}>
                                        {language === 'TH' ? 'แผนการผ่อนชำระ (จัดฟัน)' : 'Orthodontic Installment Plan'}
                                    </h3>
                                    <InstallmentPlan patient={patient} language={language} onUpdate={updatePatient} />
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--neutral-200)', margin: '2rem 0' }} />
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--neutral-600)' }}>
                                    {language === 'TH' ? 'รายการทั่วไป' : 'General Billing'}
                                </h3>
                                <BillingTab patient={patient} language={language} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PatientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={(updatedData) => {
                    updatePatient(patient.id, updatedData);
                    setIsEditModalOpen(false);
                }}
                patient={patient}
            />

            {showAlert && <MedicalAlertModal patient={patient} onClose={() => setShowAlert(false)} />}

            <DocumentModal
                isOpen={isDocModalOpen}
                onClose={() => setIsDocModalOpen(false)}
                patient={patient}
            />
        </div>
    );
};

export default PatientProfile;
