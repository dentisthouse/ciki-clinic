import React, { useState } from 'react';
import { X, User, UserPlus, Search, Phone, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import PatientModal from '../Patients/PatientModal';

const WalkInModal = ({ isOpen, onClose, onSave }) => {
    const { t, language } = useLanguage();
    const { patients, addPatient } = useData();
    const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'new'

    const [procedure, setProcedure] = useState('');
    const [dentist, setDentist] = useState('หมอต้อง');

    // Existing Patient State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

    // New Patient State (Reduced to just triggering the modal)
    const [newPatientForm, setNewPatientForm] = useState({});

    if (!isOpen) return null;

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm))
    ).slice(0, 5); // Limit to 5 results

    const handleSubmit = (e) => {
        e.preventDefault();

        const now = new Date();
        const baseAppointment = {
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            duration: 30,
            type: 'Walk-in',
            procedure: procedure || 'General Checkup',
            dentist: dentist || 'หมอต้อง',
            status: 'In Progress',
            notes: 'Walk-in Registration'
        };

        if (activeTab === 'existing') {
            if (!selectedPatient) return alert('Please select a patient');

            onSave({
                ...baseAppointment,
                patientId: selectedPatient.id,
                patientName: selectedPatient.name
            });
        } else {
            if (!newPatientForm.name) return alert('Please enter patient name');

            // Create new patient first
            const newPatient = {
                name: newPatientForm.name,
                phone: newPatientForm.phone,
                age: newPatientForm.age,
                gender: newPatientForm.gender,
                registered: new Date().toISOString().split('T')[0]
            };

            const createdPatient = addPatient(newPatient);

            onSave({
                ...baseAppointment,
                patientId: createdPatient.id,
                patientName: createdPatient.name
            });
        }

        // Reset and close
        setSearchTerm('');
        setSelectedPatient(null);
        setProcedure('');
        setNewPatientForm({ name: '', phone: '', age: '', gender: 'Male' });
        onClose();
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    };

    const modalStyle = {
        backgroundColor: 'white', borderRadius: '24px',
        width: '90%', maxWidth: '550px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxHeight: '90vh', overflowY: 'auto'
    };

    const tabStyle = (isActive) => ({
        flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer',
        fontWeight: 600, color: isActive ? '#059669' : '#6b7280',
        borderBottom: isActive ? '3px solid #059669' : '1px solid #e5e7eb',
        background: isActive ? '#ecfdf5' : 'transparent',
        transition: 'all 0.2s'
    });

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '500px' }}>
                {/* Modal Header */}
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800 }}>
                        <div className="icon-box" style={{ width: '36px', height: '36px' }}>
                            <UserPlus size={18} />
                        </div>
                        {language === 'TH' ? 'ลงทะเบียน Walk-in' : 'Walk-in Registration'}
                    </h3>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={tabStyle(activeTab === 'existing')} onClick={() => setActiveTab('existing')}>
                        <User size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        {language === 'TH' ? 'ผู้ป่วยเก่า' : 'Existing Patient'}
                    </div>
                    <div style={tabStyle(activeTab === 'new')} onClick={() => setActiveTab('new')}>
                        <UserPlus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        {language === 'TH' ? 'ผู้ป่วยใหม่' : 'New Patient'}
                    </div>
                </div>

                {/* Modal Content - SCROLLABLE BODY */}
                <div className="modal-body" style={{ padding: '1.25rem' }}>
                    {/* Common Procedure Input */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 800 }}>
                            {t('sch_col_procedure') || 'Procedure / Treatment'}
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={language === 'TH' ? 'ระบุรายการรักษา (เช่น ขูดหินปูน)...' : 'Enter procedure (e.g., Scaling)...'}
                            style={{ fontSize: '1rem', fontWeight: 600 }}
                            value={procedure}
                            onChange={(e) => setProcedure(e.target.value)}
                        />
                    </div>

                    {/* Doctor Selector */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 800 }}>หมอ (Doctor)</label>
                        <select
                            className="form-select"
                            value={dentist}
                            onChange={(e) => setDentist(e.target.value)}
                            style={{ fontSize: '1rem', fontWeight: 600 }}
                        >
                            <option value="หมอบิ๊ก">หมอบิ๊ก (เฉพาะทางฟันคุด)</option>
                            <option value="หมอต้อง">หมอต้อง (ทั่วไป)</option>
                            <option value="หมออ้อม">หมออ้อม (จัดฟัน)</option>
                            <option value="หมอจุ๊บ">หมอจุ๊บ (จัดฟัน)</option>
                        </select>
                    </div>

                    {activeTab === 'existing' ? (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={language === 'TH' ? 'ค้นหาชื่อ หรือ เบอร์โทร...' : 'Search Name or Phone...'}
                                    style={{ paddingLeft: '48px', fontSize: '1.05rem' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div style={{ 
                                maxHeight: '300px', 
                                overflowY: 'auto', 
                                border: '1.5px solid var(--neutral-100)', 
                                borderRadius: '20px',
                                background: 'var(--neutral-50)',
                                padding: '0.5rem'
                            }}>
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedPatient(p)}
                                            style={{
                                                padding: '1rem 1.25rem', 
                                                borderRadius: '16px',
                                                marginBottom: '4px',
                                                cursor: 'pointer',
                                                background: selectedPatient?.id === p.id ? 'var(--primary-100)' : 'transparent',
                                                border: selectedPatient?.id === p.id ? '1px solid var(--primary-200)' : '1px solid transparent',
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 600 }}>
                                                    {p.id} • {p.phone || '-'}
                                                </div>
                                            </div>
                                            {selectedPatient?.id === p.id && <div style={{ color: 'var(--primary-600)', fontWeight: 900 }}>✓</div>}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--neutral-400)', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ไม่พบรายชื่อผู้ป่วย' : 'No patients found'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', padding: '1rem 0' }}>
                            <div className="icon-box" style={{ background: 'var(--primary-50)', padding: '2.5rem', borderRadius: '50%', marginBottom: '0.5rem', width: 'auto', height: 'auto' }}>
                                <UserPlus size={56} color="var(--primary-600)" />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--neutral-900)', fontWeight: 800 }}>
                                    {language === 'TH' ? 'ลงทะเบียนผู้ป่วยใหม่' : 'Register New Patient'}
                                </h3>
                                <p style={{ color: 'var(--neutral-500)', margin: 0, maxWidth: '320px', lineHeight: 1.6, fontWeight: 500 }}>
                                    {language === 'TH'
                                        ? 'กรุณากรอกข้อมูลผู้ป่วยใหม่เพื่อสร้างนัดหมาย Walk-in ทันที'
                                        : 'Please fill in new patient details to create a Walk-in appointment immediately'}
                                </p>
                            </div>

                            <button
                                onClick={() => setIsPatientModalOpen(true)}
                                className="btn btn-primary"
                                style={{
                                    padding: '1rem 2rem', 
                                    borderRadius: '16px', 
                                    fontWeight: 800, 
                                    fontSize: '1.1rem',
                                    marginTop: '0.5rem',
                                    boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)'
                                }}
                            >
                                <UserPlus size={20} style={{ marginRight: '8px' }} />
                                {language === 'TH' ? 'เปิดแบบฟอร์มลงทะเบียน' : 'Open Registration Form'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Footer - FIXED AT BOTTOM */}
                <div className="modal-footer" style={{ padding: '1rem 1.25rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.65rem 1.75rem', borderRadius: '14px', fontWeight: 600 }} onClick={onClose}>
                        {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    {activeTab === 'existing' && (
                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary"
                            style={{
                                padding: '0.65rem 2.25rem', 
                                borderRadius: '14px', 
                                fontWeight: 800, 
                                fontSize: '1rem', 
                                cursor: 'pointer',
                                opacity: !selectedPatient ? 0.5 : 1,
                                boxShadow: '0 8px 12px -3px rgba(13, 148, 136, 0.25)'
                            }}
                            disabled={!selectedPatient}
                        >
                            {language === 'TH' ? 'เช็คอินทันที' : 'Check-in Now'}
                        </button>
                    )}
                </div>
            </div>

            {/* Nested Patient Modal for New Registrations */}
            <PatientModal
                isOpen={isPatientModalOpen}
                onClose={() => setIsPatientModalOpen(false)}
                onSave={(patientData) => {
                    // 1. Create Patient
                    const newPatient = addPatient(patientData);

                    // 2. Create Walk-in Appointment immediately
                    const now = new Date();
                    const newApt = {
                        date: now.toISOString().split('T')[0],
                        time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        duration: 30,
                        type: 'Walk-in',
                        procedure: procedure || 'General Checkup',
                        dentist: dentist || 'หมอต้อง',
                        status: 'In Progress',
                        notes: 'New Patient Walk-in',
                        patientId: newPatient.id,
                        patientName: newPatient.name
                    };

                    setIsPatientModalOpen(false);
                    onSave(newApt);
                    onClose(); // Close parent WalkInModal too
                }}
            />
        </div>
    );
};

export default WalkInModal;
