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
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '2rem'
        }} onClick={onClose}>
            <div
                className="animate-scale-in"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: '900px',
                    background: 'white', borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    maxHeight: '90vh', overflowY: 'auto', margin: 'auto'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem', borderBottom: '1px solid var(--neutral-100)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--neutral-50)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--primary-100)', borderRadius: '12px', color: 'var(--primary-600)' }}>
                            <User size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--neutral-800)', margin: 0 }}>
                                {patient ? (language === 'TH' ? 'แก้ไขข้อมูลคนไข้' : 'Edit Patient Profile') : (language === 'TH' ? 'ลงทะเบียนคนไข้ใหม่' : 'New Patient Registration')}
                            </h2>
                            <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '0.875rem' }}>
                                {language === 'TH' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all required information'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'white', border: '1px solid var(--neutral-200)', cursor: 'pointer',
                        padding: '0.5rem', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', borderRadius: '8px', transition: 'all 0.2s'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content - 2 Columns */}
                <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>

                    {/* Left Column: Photo & ID */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Photo Capture */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '100%', height: '240px', background: '#f3f4f6',
                                borderRadius: '16px', border: '2px dashed #d1d5db',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', marginBottom: '1rem', position: 'relative'
                            }}>
                                {isCameraOpen ? (
                                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : formData.photo ? (
                                    <img src={formData.photo} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={48} />
                                        <span>No Photo</span>
                                    </div>
                                )}
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                            </div>

                            {!isCameraOpen ? (
                                <button type="button" onClick={startCamera} className="btn" style={{ width: '100%', border: '1px solid var(--neutral-300)', padding: '0.75rem' }}>
                                    📷 {language === 'TH' ? 'ถ่ายรูป' : 'Take Photo'}
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" onClick={takePhoto} className="btn btn-primary" style={{ flex: 1 }}>
                                        Capture
                                    </button>
                                    <button type="button" onClick={stopCamera} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ID Card */}
                        <div>
                            <label style={labelStyle}>
                                {language === 'TH' ? 'เลขบัตรประชาชน / Passport ID' : 'National ID / Passport'}
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    style={inputBaseStyle}
                                    value={formData.idCard}
                                    onChange={e => setFormData({ ...formData, idCard: e.target.value })}
                                    placeholder="x-xxxx-xxxxx-xx-x"
                                />
                                <button type="button" className="btn btn-secondary" title="Scan ID Card" style={{ padding: '0 1rem' }}>
                                    🪪
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Name & Age */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>{t('pat_form_name')} <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    style={inputBaseStyle}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>{t('pat_form_age')} <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="number"
                                    style={inputBaseStyle}
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>{language === 'TH' ? 'เพศ' : 'Gender'}</label>
                                <select
                                    style={inputBaseStyle}
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Contact */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}><Phone size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {language === 'TH' ? 'เบอร์โทรศัพท์' : 'Phone'} <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="tel"
                                    style={inputBaseStyle}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}><Mail size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Email</label>
                                <input
                                    type="email"
                                    style={inputBaseStyle}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label style={labelStyle}><MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {language === 'TH' ? 'ที่อยู่' : 'Address'}</label>
                            <textarea
                                style={{ ...inputBaseStyle, resize: 'none' }}
                                rows="2"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            ></textarea>
                        </div>

                        {/* Insurance Section */}
                        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                            <label style={{ ...labelStyle, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Shield size={16} />
                                {t('pat_form_insurance_section')}
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>{t('pat_form_coverage_type')}</label>
                                    <select
                                        style={inputBaseStyle}
                                        value={formData.insuranceType}
                                        onChange={e => setFormData({ ...formData, insuranceType: e.target.value })}
                                    >
                                        <option value="Self">{t('pat_cov_self')}</option>
                                        <option value="SSO">{t('pat_cov_sso')}</option>
                                        <option value="Private">{t('pat_cov_private')}</option>
                                        <option value="Gov">{t('pat_cov_gov')}</option>
                                    </select>
                                </div>
                                {formData.insuranceType === 'SSO' && (
                                    <div>
                                        <label style={labelStyle}>{t('pat_form_hospital')}</label>
                                        <input
                                            type="text"
                                            style={inputBaseStyle}
                                            value={formData.hospital}
                                            onChange={e => setFormData({ ...formData, hospital: e.target.value })}
                                            placeholder="Ex. Rajavithi Hospital"
                                        />
                                    </div>
                                )}
                                {formData.insuranceType === 'Private' && (
                                    <div>
                                        <label style={labelStyle}>{t('pat_form_provider')}</label>
                                        <input
                                            type="text"
                                            style={inputBaseStyle}
                                            value={formData.insuranceProvider}
                                            onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                                            placeholder="Ex. AIA, Muang Thai"
                                        />
                                    </div>
                                )}
                            </div>

                            {formData.insuranceType !== 'Self' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>{t('pat_form_policy_no')}</label>
                                        <input
                                            type="text"
                                            style={inputBaseStyle}
                                            value={formData.policyNumber}
                                            onChange={e => setFormData({ ...formData, policyNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>{t('pat_form_limit')}</label>
                                        <input
                                            type="number"
                                            style={inputBaseStyle}
                                            value={formData.insuranceLimit}
                                            onChange={e => setFormData({ ...formData, insuranceLimit: e.target.value })}
                                            placeholder="Optional"
                                        />
                                        {formData.insuranceType === 'SSO' && (
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                                Yearly Limit: 900 THB
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label style={labelStyle}>{t('pat_form_expiry')}</label>
                                        <input
                                            type="date"
                                            style={inputBaseStyle}
                                            value={formData.insuranceExpiry}
                                            onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Medical History */}
                        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                            <label style={{ ...labelStyle, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Heart size={16} fill="#ef4444" color="#ef4444" />
                                {language === 'TH' ? 'ประวัติการแพ้และโรคประจำตัว' : 'Medical History & Allergies'}
                            </label>
                            <textarea
                                style={{ ...inputBaseStyle, borderColor: '#fca5a5' }}
                                rows="3"
                                value={formData.medicalHistory}
                                onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}
                                placeholder={language === 'TH' ? 'เช่น แพ้ยา Penicillin, โรคเบาหวาน, ความดัน...' : 'e.g., Penicillin allergy, Diabetes...'}
                            ></textarea>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                style={{ padding: '0.75rem 1.5rem' }}
                            >
                                {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Save size={18} />
                                {language === 'TH' ? 'บันทึกข้อมูล' : 'Save Record'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PatientModal;
