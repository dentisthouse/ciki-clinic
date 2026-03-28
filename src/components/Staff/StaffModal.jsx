import React, { useState } from 'react';
import { X } from 'lucide-react';

const StaffModal = ({ staff, onSave, onClose, language }) => {
    const [form, setForm] = useState({
        name: staff?.name || '',
        role: staff?.role || 'dentist',
        phone: staff?.phone || '',
        email: staff?.email || '',
        licenseNumber: staff?.licenseNumber || '',
        specialty: staff?.specialty || '',
        status: staff?.status || 'active',
        startDate: staff?.startDate || new Date().toISOString().split('T')[0],
        salary: staff?.salary || '',
        schedule: staff?.schedule || '',
        note: staff?.note || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSave(form);
    };

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const fieldStyle = {
        width: '100%', padding: '0.6rem 0.75rem',
        border: '1px solid var(--neutral-200)', borderRadius: '8px',
        fontSize: '0.9rem', transition: 'border-color 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '0.8rem', fontWeight: 600,
        color: 'var(--neutral-600)', marginBottom: '4px'
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '600px' }}>
                {/* Modal Header */}
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--neutral-900)' }}>
                        {staff
                            ? (language === 'TH' ? '✏️ แก้ไขข้อมูลพนักงาน' : '✏️ Edit Staff Information')
                            : (language === 'TH' ? '➕ เพิ่มพนักงานใหม่' : '➕ Add New Staff')
                        }
                    </h2>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content - SCROLLABLE BODY */}
                <div className="modal-body" style={{ padding: '2rem' }}>
                    <form id="staff-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label">{language === 'TH' ? 'ชื่อ-นามสกุล *' : 'Full Name *'}</label>
                            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Dr. Thana Somchai" />
                        </div>

                        {/* Role + Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'ตำแหน่ง' : 'Role'}</label>
                                <select className="form-select" value={form.role} onChange={e => update('role', e.target.value)}>
                                    <option value="dentist">{language === 'TH' ? 'ทันตแพทย์' : 'Dentist'}</option>
                                    <option value="assistant">{language === 'TH' ? 'ผู้ช่วยทันตแพทย์' : 'Dental Assistant'}</option>
                                    <option value="hygienist">{language === 'TH' ? 'ทันตาภิบาล' : 'Hygienist'}</option>
                                    <option value="receptionist">{language === 'TH' ? 'พนักงานต้อนรับ' : 'Receptionist'}</option>
                                    <option value="admin">{language === 'TH' ? 'ผู้ดูแลระบบ' : 'Admin'}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'สถานะ' : 'Status'}</label>
                                <select className="form-select" value={form.status} onChange={e => update('status', e.target.value)}>
                                    <option value="active">{language === 'TH' ? 'ทำงาน' : 'Active'}</option>
                                    <option value="inactive">{language === 'TH' ? 'พักงาน' : 'Inactive'}</option>
                                    <option value="leave">{language === 'TH' ? 'ลางาน' : 'On Leave'}</option>
                                </select>
                            </div>
                        </div>

                        {/* Phone + Email */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'เบอร์โทร' : 'Phone'}</label>
                                <input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="08x-xxx-xxxx" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'อีเมล' : 'Email'}</label>
                                <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="name@clinic.com" />
                            </div>
                        </div>

                        {/* License + Specialty */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'เลขใบอนุญาต (ท.)' : 'License Number'}</label>
                                <input className="form-input" value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)} placeholder="ท.12345" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'ความเชี่ยวชาญ' : 'Specialty'}</label>
                                <input className="form-input" value={form.specialty} onChange={e => update('specialty', e.target.value)} placeholder={language === 'TH' ? 'ทันตกรรมทั่วไป' : 'General Dentistry'} />
                            </div>
                        </div>

                        {/* Start Date + Salary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'วันเริ่มงาน' : 'Start Date'}</label>
                                <input className="form-input" type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'เงินเดือน (฿)' : 'Salary (฿)'}</label>
                                <input className="form-input" type="number" value={form.salary} onChange={e => update('salary', e.target.value)} placeholder="35,000" />
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="form-group">
                            <label className="form-label">{language === 'TH' ? 'ตารางงาน' : 'Work Schedule'}</label>
                            <input className="form-input" value={form.schedule} onChange={e => update('schedule', e.target.value)} placeholder={language === 'TH' ? 'จ-ศ 09:00-17:00' : 'Mon-Fri 09:00-17:00'} />
                        </div>

                        {/* Note */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'TH' ? 'หมายเหตุ' : 'Note'}</label>
                            <textarea className="form-textarea" rows={3} style={{ resize: 'none' }} value={form.note} onChange={e => update('note', e.target.value)} />
                        </div>
                    </form>
                </div>

                {/* Modal Footer - FIXED AT BOTTOM */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', borderRadius: '16px', fontWeight: 600 }} onClick={onClose}>
                        {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button type="submit" form="staff-form" className="btn btn-primary" style={{ padding: '0.85rem 3rem', borderRadius: '16px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}>
                        {staff
                            ? (language === 'TH' ? 'บันทึกข้อมูล' : 'Save Changes')
                            : (language === 'TH' ? 'เพิ่มพนักงาน' : 'Add Staff')
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffModal;
