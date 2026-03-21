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
        overflow: 'hidden'
    };

    const tabStyle = (isActive) => ({
        flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer',
        fontWeight: 600, color: isActive ? '#059669' : '#6b7280',
        borderBottom: isActive ? '3px solid #059669' : '1px solid #e5e7eb',
        background: isActive ? '#ecfdf5' : 'transparent',
        transition: 'all 0.2s'
    });

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={24} color="#059669" />
                        {language === 'TH' ? 'ลงทะเบียน Walk-in' : 'Walk-in Registration'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex' }}>
                    <div style={tabStyle(activeTab === 'existing')} onClick={() => setActiveTab('existing')}>
                        <User size={18} style={{ display: 'inline', marginRight: '5px' }} />
                        {language === 'TH' ? 'ผู้ป่วยเก่า' : 'Existing Patient'}
                    </div>
                    <div style={tabStyle(activeTab === 'new')} onClick={() => setActiveTab('new')}>
                        <UserPlus size={18} style={{ display: 'inline', marginRight: '5px' }} />
                        {language === 'TH' ? 'ผู้ป่วยใหม่' : 'New Patient'}
                    </div>
                </div>

                <div style={{ padding: '2rem' }}>
                    {/* Common Procedure Input */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                            {t('sch_col_procedure') || 'Procedure / Treatment'}
                        </label>
                        <input
                            type="text"
                            placeholder={language === 'TH' ? 'ระบุรายการรักษา (เช่น ขูดหินปูน)...' : 'Enter procedure (e.g., Scaling)...'}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                            value={procedure}
                            onChange={(e) => setProcedure(e.target.value)}
                        />
                    </div>

                    {activeTab === 'existing' ? (
                        <div className="animate-fade-in">
                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    placeholder={language === 'TH' ? 'ค้นหาชื่อ หรือ เบอร์โทร...' : 'Search Name or Phone...'}
                                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedPatient(p)}
                                            style={{
                                                padding: '12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                                                background: selectedPatient?.id === p.id ? '#ecfdf5' : 'white',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                    {p.id} • {p.phone || '-'}
                                                </div>
                                            </div>
                                            {selectedPatient?.id === p.id && <div style={{ color: '#059669', fontWeight: 700 }}>✓</div>}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No patients found</div>
                                )}
                            </div>

                            <button
                                onClick={handleSubmit}
                                style={{
                                    marginTop: '2rem', width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                                    background: '#059669', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                    opacity: !selectedPatient ? 0.5 : 1
                                }}
                                disabled={!selectedPatient}
                            >
                                Check-in Now
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '2rem 0' }}>
                            <div style={{ background: '#ecfdf5', padding: '2rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                <UserPlus size={48} color="#059669" />
                            </div>
                            <h3 style={{ margin: 0, color: '#374151' }}>
                                {language === 'TH' ? 'ลงทะเบียนผู้ป่วยใหม่' : 'Register New Patient'}
                            </h3>
                            <p style={{ textAlign: 'center', color: '#6b7280', margin: 0, maxWidth: '300px' }}>
                                {language === 'TH'
                                    ? 'กรุณากรอกข้อมูลผู้ป่วยใหม่เพื่อสร้างนัดหมาย Walk-in'
                                    : 'Please fill in new patient details to create a Walk-in appointment'}
                            </p>

                            <button
                                onClick={() => setIsPatientModalOpen(true)}
                                style={{
                                    marginTop: '1rem', padding: '12px 24px', borderRadius: '12px', border: 'none',
                                    background: '#059669', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.4)'
                                }}
                            >
                                <UserPlus size={20} />
                                {language === 'TH' ? 'เปิดแบบฟอร์มลงทะเบียน' : 'Open Registration Form'}
                            </button>
                        </div>
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
