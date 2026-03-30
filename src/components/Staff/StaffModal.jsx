import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth, PERMISSION_MODULES } from '../../context/AuthContext';

const StaffModal = ({ staff, onSave, onClose, language }) => {
    const { rolePermissions } = useAuth();
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

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '850px' }}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                        {staff ? (language === 'TH' ? '✏️ แก้ไขข้อมูลพนักงาน' : '✏️ Edit Staff') : (language === 'TH' ? '➕ เพิ่มพนักงาน' : '➕ Add Staff')}
                    </h2>
                    <button onClick={onClose} className="modal-close"><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                    <form id="staff-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label className="form-label">{language === 'TH' ? 'ชื่อ-นามสกุล' : 'Full Name'}</label>
                            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} required />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'ตำแหน่ง' : 'Role'}</label>
                                <select className="form-select" value={form.role} onChange={e => update('role', e.target.value)}>
                                    <option value="dentist">{language === 'TH' ? 'ทันตแพทย์' : 'Dentist'}</option>
                                    <option value="assistant">{language === 'TH' ? 'ผู้ช่วย' : 'Assistant'}</option>
                                    <option value="receptionist">{language === 'TH' ? 'ต้อนรับ' : 'Receptionist'}</option>
                                    <option value="admin">{language === 'TH' ? 'แอดมิน' : 'Admin'}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'สถานะ' : 'Status'}</label>
                                <select className="form-select" value={form.status} onChange={e => update('status', e.target.value)}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'เงินเดือน' : 'Salary'}</label>
                                <input className="form-input" type="number" value={form.salary} onChange={e => update('salary', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{language === 'TH' ? 'เริ่มงาน' : 'Start Date'}</label>
                                <input className="form-input" type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{language === 'TH' ? 'หมายเหตุ' : 'Note'}</label>
                            <textarea className="form-textarea" rows={2} value={form.note} onChange={e => update('note', e.target.value)} />
                        </div>
                    </form>

                    <div style={{ background: 'var(--neutral-50)', borderRadius: '20px', padding: '1.25rem', border: '1px solid var(--neutral-100)' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} color="var(--primary-600)" />
                            {language === 'TH' ? 'สิทธิ์ตามตำแหน่ง (แก้ไขไม่ได้)' : 'Role Permissions (Read-only)'}
                        </h3>
                        <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                            {PERMISSION_MODULES.map(module => {
                                const rolePerms = rolePermissions[form.role] || {};
                                const activeFeatures = module.features.filter(f => rolePerms[module.id]?.[f.id]);
                                if (activeFeatures.length === 0) return null;

                                return (
                                    <div key={module.id} style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--neutral-200)' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--neutral-800)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                            {language === 'TH' ? module.labelTH : module.labelEN}
                                            <span style={{ color: 'var(--primary-600)' }}>{activeFeatures.length}/{module.features.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {activeFeatures.map(f => (
                                                <span key={f.id} style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'var(--neutral-50)', color: 'var(--neutral-600)', borderRadius: '6px', border: '1px solid var(--neutral-100)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <Check size={10} /> {language === 'TH' ? f.labelTH : f.labelEN}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', marginTop: '1rem', fontStyle: 'italic' }}>
                            * {language === 'TH' ? 'เปลี่ยนสิทธิ์ได้ที่เมนู "ตั้งค่าสิทธิ์" ในหน้าหลัก' : 'Change role permissions in "Role Settings" menu'}
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>{language === 'TH' ? 'ยกเลิก' : 'Cancel'}</button>
                    <button type="submit" form="staff-form" className="btn btn-primary" style={{ padding: '0.7rem 2.5rem' }}>
                        {language === 'TH' ? 'บันทึกข้อมูล' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffModal;
