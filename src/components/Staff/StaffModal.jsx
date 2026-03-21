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
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                background: 'white', borderRadius: '16px', width: '90%', maxWidth: '560px',
                maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                animation: 'fadeIn 0.2s'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neutral-100)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                        {staff
                            ? (language === 'TH' ? '✏️ แก้ไขพนักงาน' : '✏️ Edit Staff')
                            : (language === 'TH' ? '➕ เพิ่มพนักงาน' : '➕ Add Staff')
                        }
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} color="#94a3b8" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Name */}
                    <div>
                        <label style={labelStyle}>{language === 'TH' ? 'ชื่อ-นามสกุล *' : 'Full Name *'}</label>
                        <input style={fieldStyle} value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Dr. Thana Somchai" />
                    </div>

                    {/* Role + Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'ตำแหน่ง' : 'Role'}</label>
                            <select style={fieldStyle} value={form.role} onChange={e => update('role', e.target.value)}>
                                <option value="dentist">{language === 'TH' ? 'ทันตแพทย์' : 'Dentist'}</option>
                                <option value="assistant">{language === 'TH' ? 'ผู้ช่วยทันตแพทย์' : 'Dental Assistant'}</option>
                                <option value="hygienist">{language === 'TH' ? 'ทันตาภิบาล' : 'Hygienist'}</option>
                                <option value="receptionist">{language === 'TH' ? 'พนักงานต้อนรับ' : 'Receptionist'}</option>
                                <option value="admin">{language === 'TH' ? 'ผู้ดูแลระบบ' : 'Admin'}</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'สถานะ' : 'Status'}</label>
                            <select style={fieldStyle} value={form.status} onChange={e => update('status', e.target.value)}>
                                <option value="active">{language === 'TH' ? 'ทำงาน' : 'Active'}</option>
                                <option value="inactive">{language === 'TH' ? 'พักงาน' : 'Inactive'}</option>
                                <option value="leave">{language === 'TH' ? 'ลางาน' : 'On Leave'}</option>
                            </select>
                        </div>
                    </div>

                    {/* Phone + Email */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'เบอร์โทร' : 'Phone'}</label>
                            <input style={fieldStyle} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="08x-xxx-xxxx" />
                        </div>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'อีเมล' : 'Email'}</label>
                            <input style={fieldStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="name@clinic.com" />
                        </div>
                    </div>

                    {/* License + Specialty */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'เลขใบอนุญาต (ท.)' : 'License Number'}</label>
                            <input style={fieldStyle} value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)} placeholder="ท.12345" />
                        </div>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'ความเชี่ยวชาญ' : 'Specialty'}</label>
                            <input style={fieldStyle} value={form.specialty} onChange={e => update('specialty', e.target.value)} placeholder={language === 'TH' ? 'ทันตกรรมทั่วไป' : 'General Dentistry'} />
                        </div>
                    </div>

                    {/* Start Date + Salary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'วันเริ่มงาน' : 'Start Date'}</label>
                            <input style={fieldStyle} type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>{language === 'TH' ? 'เงินเดือน (฿)' : 'Salary (฿)'}</label>
                            <input style={fieldStyle} type="number" value={form.salary} onChange={e => update('salary', e.target.value)} placeholder="35,000" />
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <label style={labelStyle}>{language === 'TH' ? 'ตารางงาน' : 'Work Schedule'}</label>
                        <input style={fieldStyle} value={form.schedule} onChange={e => update('schedule', e.target.value)} placeholder={language === 'TH' ? 'จ-ศ 09:00-17:00' : 'Mon-Fri 09:00-17:00'} />
                    </div>

                    {/* Note */}
                    <div>
                        <label style={labelStyle}>{language === 'TH' ? 'หมายเหตุ' : 'Note'}</label>
                        <textarea style={{ ...fieldStyle, resize: 'vertical' }} rows={2} value={form.note} onChange={e => update('note', e.target.value)} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {staff
                                ? (language === 'TH' ? 'บันทึก' : 'Save')
                                : (language === 'TH' ? 'เพิ่มพนักงาน' : 'Add Staff')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffModal;
