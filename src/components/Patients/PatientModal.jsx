import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Heart, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PatientModal = ({ isOpen, onClose, onSave, patient }) => {
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        medicalHistory: '',
        idCard: '',
        photo: null // Base64 string for photo
    });
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (patient) {
            setFormData({
                ...patient,
                medicalHistory: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : patient.medicalHistory || '',
                idCard: patient.idCard || '',
                photo: patient.photo || null,
                insuranceType: patient.insuranceType || 'Self',
                hospital: patient.hospital || '',
                insuranceProvider: patient.insuranceProvider || '',
                policyNumber: patient.policyNumber || '',
                insuranceLimit: patient.insuranceLimit || '',
                insuranceExpiry: patient.insuranceExpiry || ''
            });
        } else {
            setFormData({
                name: '',
                age: '',
                gender: 'Male',
                phone: '',
                email: '',
                address: '',
                medicalHistory: '',
                idCard: '',
                photo: null,
                insuranceType: 'Self',
                hospital: '',
                insuranceProvider: '',
                policyNumber: '',
                insuranceLimit: '',
                insuranceExpiry: ''
            });
        }
    }, [patient, isOpen]);

    // Cleanup camera stream when modal closes
    useEffect(() => {
        if (!isOpen && isCameraOpen) {
            stopCamera();
        }
    }, [isOpen, isCameraOpen]);

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Cannot access camera");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            // Set canvas dimensions to match video stream
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setFormData({ ...formData, photo: dataUrl });
            stopCamera();
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: patient ? patient.id : undefined,
            medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(s => s.trim()) : []
        });
        onClose();
    };

    // Styles
    const inputBaseStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--neutral-200)',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        background: 'white',
        outline: 'none',
        boxSizing: 'border-box'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--neutral-600)',
        marginBottom: '0.5rem'
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '950px' }}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--primary-600)',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}>
                            <User size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--neutral-900)' }}>
                                {patient ? (language === 'TH' ? 'แก้ไขข้อมูลคนไข้' : 'Edit Patient Profile') : (language === 'TH' ? 'ลงทะเบียนคนไข้ใหม่' : 'New Patient Registration')}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 500 }}>
                                {patient ? `HN: ${patient.hn || patient.id}` : 'Fill in the information to register a new patient'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content - SCROLLABLE BODY */}
                <div className="modal-body">
                    <form id="patient-form" onSubmit={handleSubmit} style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(250px, 320px) 1fr',
                        gap: '3rem'
                    }}>
                        {/* LEFT COLUMN: Profile & Photo */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '240px', height: '240px', borderRadius: '40px',
                                    margin: '0 auto 1.5rem', overflow: 'hidden',
                                    backgroundColor: 'var(--neutral-50)', position: 'relative',
                                    border: '2px dashed var(--neutral-200)', transition: 'all 0.3s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)'
                                }}>
                                    {isCameraOpen ? (
                                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                            <video autoPlay ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button type="button" onClick={takePhoto} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Take</button>
                                                <button type="button" onClick={stopCamera} className="btn btn-secondary" style={{ padding: '0.5rem' }}>X</button>
                                            </div>
                                        </div>
                                    ) : formData.photo ? (
                                        <img src={formData.photo} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ marginBottom: '0.75rem', color: 'var(--neutral-200)' }}>
                                                <User size={64} strokeWidth={1.5} />
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--neutral-400)' }}>No Profile Photo</span>
                                        </div>
                                    )}
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                </div>

                                {!isCameraOpen && (
                                    <button type="button" onClick={startCamera} className="btn btn-secondary" style={{ width: '100%', padding: '0.85rem', borderRadius: '16px', fontWeight: 700 }}>
                                        📷 {language === 'TH' ? 'ถ่ายรูปคนไข้' : 'Capture Photo'}
                                    </button>
                                )}
                            </div>

                            {/* ID Card Segment */}
                            <div className="card" style={{ padding: '1.5rem', background: 'var(--neutral-50)', borderStyle: 'dashed' }}>
                                <label className="form-label" style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="icon-box" style={{ width: '24px', height: '24px', borderRadius: '6px' }}><Shield size={14} /></div>
                                        {language === 'TH' ? 'เลขบัตรประชาชน / Passport ID' : 'National ID / Passport'}
                                    </div>
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ height: '48px' }}
                                        value={formData.idCard || ''}
                                        onChange={e => setFormData({ ...formData, idCard: e.target.value })}
                                        placeholder="x-xxxx-xxxxx-xx-x"
                                    />
                                    <button type="button" className="btn btn-secondary" style={{ height: '48px', width: '48px', padding: 0, flexShrink: 0 }}>
                                        🪪
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Details Form */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Personal Details Section */}
                            <div className="form-section" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
                                <div className="form-section-title">
                                    <div className="icon-box"><User size={18} /></div>
                                    {language === 'TH' ? 'ข้อมูลส่วนตัว' : 'Personal Details'}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.25fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">{t('pat_form_name')} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('pat_form_age')} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{language === 'TH' ? 'เพศ' : 'Gender'}</label>
                                        <select
                                            className="form-select"
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <Phone size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
                                            {language === 'TH' ? 'เบอร์โทรศัพท์' : 'Phone'} <span style={{ color: 'var(--danger)' }}>*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <Mail size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="example@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <MapPin size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
                                        {language === 'TH' ? 'ที่อยู่ปัจจุบัน' : 'Current Address'}
                                    </label>
                                    <textarea
                                        className="form-textarea"
                                        rows="2"
                                        value={formData.address || ''}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Streed address, City..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Insurance & Coverage Section */}
                            <div className="form-section" style={{ background: 'var(--primary-50)', padding: '1.75rem', borderRadius: '28px', border: '1px solid var(--primary-100)' }}>
                                <div className="form-section-title" style={{ color: 'var(--primary-800)', marginBottom: '1.25rem' }}>
                                    <div className="icon-box" style={{ background: 'var(--primary-200)', color: 'var(--primary-700)' }}><Shield size={18} /></div>
                                    {t('pat_form_insurance_section')}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ color: 'var(--primary-800)' }}>{t('pat_form_coverage_type')}</label>
                                        <select
                                            className="form-select"
                                            style={{ border: '1.5px solid var(--primary-200)' }}
                                            value={formData.insuranceType || 'Self'}
                                            onChange={e => setFormData({ ...formData, insuranceType: e.target.value })}
                                        >
                                            <option value="Self">{t('pat_cov_self')}</option>
                                            <option value="SSO">{t('pat_cov_sso')}</option>
                                            <option value="Private">{t('pat_cov_private')}</option>
                                            <option value="Gov">{t('pat_cov_gov')}</option>
                                        </select>
                                    </div>
                                    {formData.insuranceType !== 'Self' && (
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ color: 'var(--primary-800)' }}>{language === 'TH' ? 'เลขกรมธรรม์' : 'Policy Number'}</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                style={{ border: '1.5px solid var(--primary-200)' }}
                                                placeholder="P-000000"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Medical Alert Section */}
                            <div className="form-section" style={{ background: 'rgba(239, 68, 68, 0.03)', padding: '1.75rem', borderRadius: '28px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <div className="form-section-title" style={{ color: '#b91c1c', marginBottom: '1rem' }}>
                                    <div className="icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Heart size={18} /></div>
                                    {language === 'TH' ? 'ประวัติการแพ้ยาและโรคประจำตัว' : 'Medical History & Allergies'}
                                </div>
                                <textarea
                                    className="form-textarea"
                                    style={{ borderColor: 'rgba(239, 68, 68, 0.2)', minHeight: '100px' }}
                                    value={formData.medicalHistory || ''}
                                    onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}
                                    placeholder={language === 'TH' ? 'ระบุให้ชัดเจน เช่น แพ้ยาพาราเซตามอล, โรคหัวใจ...' : 'Clearly specify allergies or chronic conditions...'}
                                ></textarea>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer - FIXED AT BOTTOM */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.85rem 2.5rem', borderRadius: '16px', fontWeight: 600 }}>
                        {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button type="submit" form="patient-form" className="btn btn-primary" style={{ padding: '0.85rem 3.5rem', borderRadius: '18px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}>
                        <Save size={20} style={{ marginRight: '8px' }} />
                        {language === 'TH' ? 'บันทึกข้อมูลคนไข้' : 'Save Patient Record'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientModal;
