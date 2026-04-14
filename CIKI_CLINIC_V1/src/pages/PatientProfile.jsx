import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Phone, Mail, MapPin, Calendar, Clock, FileText,
    Shield, Activity, DollarSign, Plus, ArrowLeft,
    CheckCircle, AlertCircle, Edit2, Trash2, Ruler, ImageIcon,
    ClipboardList, XCircle, User
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

// Appointment History Component
const AppointmentHistorySection = ({ patientId, patientName, appointments, language }) => {
    const patientAppointments = (appointments || [])
        .filter(a => a.patientId === patientId || a.patient_id === patientId)
        .sort((a, b) => new Date(b.date || b.appointmentDate || 0) - new Date(a.date || a.appointmentDate || 0));

    const statusConfig = {
        Completed: { label: language === 'TH' ? 'เสร็จสิ้น' : 'Completed', color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle },
        Confirmed: { label: language === 'TH' ? 'ยืนยันแล้ว' : 'Confirmed', color: '#3b82f6', bg: '#eff6ff', icon: CheckCircle },
        Pending: { label: language === 'TH' ? 'รอยืนยัน' : 'Pending', color: '#f59e0b', bg: '#fffbeb', icon: Clock },
        Cancelled: { label: language === 'TH' ? 'ยกเลิก' : 'Cancelled', color: '#ef4444', bg: '#fef2f2', icon: XCircle },
        'No-Show': { label: language === 'TH' ? 'ไม่มาตามนัด' : 'No-Show', color: '#8b5cf6', bg: '#f5f3ff', icon: AlertCircle },
        InProgress: { label: language === 'TH' ? 'กำลังรักษา' : 'In Progress', color: '#0d9488', bg: '#f0fdfa', icon: Activity },
    };

    const totalVisits = patientAppointments.filter(a => a.status === 'Completed').length;
    const totalCancelled = patientAppointments.filter(a => a.status === 'Cancelled' || a.status === 'No-Show').length;
    const upcoming = patientAppointments.filter(a => {
        const d = new Date(a.date || a.appointmentDate);
        return d >= new Date() && a.status !== 'Cancelled';
    }).length;

    if (patientAppointments.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <ClipboardList size={36} color="var(--neutral-300)" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--neutral-700)', marginBottom: '0.5rem' }}>
                    {language === 'TH' ? 'ยังไม่มีประวัติการนัดหมาย' : 'No appointment history'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--neutral-400)' }}>
                    {language === 'TH' ? 'เมื่อมีการนัดหมายจะปรากฏที่นี่' : 'Appointments will appear here once created'}
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: language === 'TH' ? 'นัดหมายทั้งหมด' : 'Total', value: patientAppointments.length, color: '#6366f1', bg: '#f5f3ff' },
                    { label: language === 'TH' ? 'มาตามนัด' : 'Visited', value: totalVisits, color: '#22c55e', bg: '#f0fdf4' },
                    { label: language === 'TH' ? 'นัดครั้งต่อไป' : 'Upcoming', value: upcoming, color: '#3b82f6', bg: '#eff6ff' },
                    { label: language === 'TH' ? 'ไม่มา/ยกเลิก' : 'Missed', value: totalCancelled, color: '#ef4444', bg: '#fef2f2' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '1rem', background: s.bg, borderRadius: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color, opacity: 0.8 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {patientAppointments.map((apt, index) => {
                    const sc = statusConfig[apt.status] || statusConfig.Pending;
                    const aptDate = apt.date || apt.appointmentDate || '';
                    const aptTime = apt.time || apt.appointmentTime || '';
                    const service = apt.service || apt.treatment || apt.type || '-';
                    const doctor = apt.doctor || apt.dentist || '';
                    const notes = apt.notes || apt.reason || '';
                    const room = apt.room || '';
                    const StatusIcon = sc.icon;

                    return (
                        <div key={apt.id || index} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                            {/* Timeline line */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', background: sc.bg,
                                    border: `2px solid ${sc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, zIndex: 1
                                }}>
                                    <StatusIcon size={16} color={sc.color} />
                                </div>
                                {index < patientAppointments.length - 1 && (
                                    <div style={{ width: '2px', flex: 1, background: 'var(--neutral-200)', minHeight: '20px' }} />
                                )}
                            </div>

                            {/* Card */}
                            <div style={{
                                flex: 1, padding: '1rem 1.25rem', background: 'var(--neutral-50)',
                                borderRadius: '14px', marginBottom: '0.75rem',
                                border: '1px solid var(--neutral-100)',
                                transition: 'all 0.2s ease'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--neutral-800)', marginBottom: '0.15rem' }}>
                                            {service}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Calendar size={12} /> {aptDate}
                                            </span>
                                            {aptTime && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={12} /> {aptTime}
                                                </span>
                                            )}
                                            {room && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    🚪 {language === 'TH' ? `ห้อง ${room}` : `Room ${room}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.7rem', borderRadius: '8px', fontSize: '0.7rem',
                                        fontWeight: 800, background: sc.bg, color: sc.color,
                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0
                                    }}>
                                        <StatusIcon size={11} /> {sc.label}
                                    </span>
                                </div>
                                {(doctor || notes) && (
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--neutral-100)' }}>
                                        {doctor && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <User size={12} /> {doctor}
                                            </span>
                                        )}
                                        {notes && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', fontStyle: 'italic' }}>
                                                {notes}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// MAIN COMPONENT
const PatientProfile = () => {
    const { t, language } = useLanguage();
    const { permissions, isAdmin, staff } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const { patients, updatePatient, appointments, addLog, broadcastAnnouncement } = useData();
    const patient = patients.find(p => p.id === id);

    useEffect(() => {
        if (patient && addLog) {
            addLog({ 
                action: 'view_patient', 
                module: 'patients', 
                details: `เรียกดูข้อมูลคนไข้: ${patient.name} (${patient.hn})`,
                severity: 'low' 
            });
        }
    }, [id, !!patient, addLog]);
    const [searchParams] = useSearchParams();

    // Check permissions (Bypass for Admin/Owner)
    const canViewClinical = isAdmin || permissions?.patients?.clinical || false;
    const canViewHistory = isAdmin || permissions?.patients?.history || false;
    const canViewBilling = isAdmin || permissions?.billing?.view || false;

    const [activeTab, setActiveTab] = useState(
        searchParams.get('tab') || (canViewClinical ? 'plans' : 'history')
    );

    // Sync tab when URL params change
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    // Sync tab when permissions finish loading (Prevent getting stuck on billing tab)
    useEffect(() => {
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
            paymentStatus: 'unpaid',
            recorder: staff?.full_name || staff?.name || 'Clinic Staff'
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
    const totalUnpaidAmount = unpaidTreatments.reduce((sum, t) => sum + (t.price || 0), 0);

    // Only show tabs the user has permission for
    const tabs = [
        canViewClinical && { id: 'plans', label: language === 'TH' ? 'แผนการรักษา' : 'Treatment Plan', icon: FileText },
        canViewClinical && { id: 'ortho', label: language === 'TH' ? 'จัดฟัน' : 'Ortho Chart', icon: Ruler },
        canViewClinical && { id: 'gallery', label: language === 'TH' ? 'รูปถ่าย' : 'Gallery', icon: ImageIcon },
        canViewClinical && { id: 'imaging', label: t('prof_imaging'), icon: ImageIcon },
        canViewHistory && { id: 'history', label: language === 'TH' ? 'ประวัติการรักษา' : 'Treatment History', icon: Calendar },
        canViewClinical && { id: 'appointments', label: language === 'TH' ? 'ประวัติการนัดหมาย' : 'Appointments', icon: ClipboardList },
        canViewBilling && { id: 'billing', label: t('nav_billing'), icon: DollarSign, badge: totalUnpaidAmount > 0 ? `฿${totalUnpaidAmount.toLocaleString()}` : null },
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
                                <span style={{ color: 'var(--primary-600)', fontWeight: 800 }}>CN: {patient.hn || 'NEW'}</span>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', minWidth: 0 }}>


                    {/* Tabs */}
                    <div style={{ 
                        display: 'flex', gap: '4px', 
                        background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)',
                        padding: '6px', borderRadius: '18px 18px 0 0', 
                        border: '1px solid var(--neutral-100)', borderBottom: 'none',
                        overflowX: 'auto', scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                    }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: '0 0 auto', padding: '0.75rem 1.1rem', border: 'none', cursor: 'pointer',
                                    borderRadius: '12px', whiteSpace: 'nowrap',
                                    background: activeTab === tab.id 
                                        ? 'linear-gradient(135deg, var(--neutral-800), var(--neutral-900))' 
                                        : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--neutral-500)',
                                    fontWeight: activeTab === tab.id ? 800 : 600,
                                    fontSize: '0.82rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    position: 'relative', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                    fontFamily: 'var(--font-sans)',
                                }}
                                onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                                onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <tab.icon size={15} />
                                {tab.label}
                                {tab.badge && (
                                    <span style={{
                                        background: activeTab === tab.id 
                                            ? 'rgba(239, 68, 68, 0.9)' 
                                            : 'var(--danger)', 
                                        color: 'white', 
                                        fontSize: '0.7rem',
                                        padding: '2px 7px', 
                                        borderRadius: '20px', 
                                        marginLeft: '4px', 
                                        fontWeight: 900,
                                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '1.3rem',
                                        lineHeight: 1.4,
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
                        {activeTab === 'appointments' && (
                            <AppointmentHistorySection patientId={patient.id} patientName={patient.name} appointments={appointments} language={language} />
                        )}
                        {activeTab === 'billing' && (
                            <BillingTab patient={patient} language={language} />
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
