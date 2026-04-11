import React, { useState } from 'react';
import {
    UserCog, Search, Plus, Edit2, Trash2, Phone, Mail,
    Shield, Clock, Filter, ChevronDown, Star, Calendar
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import StaffModal from '../components/Staff/StaffModal';

const ROLE_CONFIG = {
    dentist: { label: 'ทันตแพทย์', labelEn: 'Dentist', color: '#3b82f6', bg: '#eff6ff', icon: '🦷' },
    assistant: { label: 'ผู้ช่วยทันตแพทย์', labelEn: 'Dental Assistant', color: '#8b5cf6', bg: '#f5f3ff', icon: '🩺' },
    receptionist: { label: 'พนักงานต้อนรับ', labelEn: 'Receptionist', color: '#f59e0b', bg: '#fffbeb', icon: '📋' },
    admin: { label: 'ผู้ดูแลระบบ', labelEn: 'Admin', color: '#64748b', bg: '#f8fafc', icon: '⚙️' },
};

const STATUS_CONFIG = {
    active: { label: 'ทำงาน', labelEn: 'Active', color: '#22c55e', bg: '#f0fdf4' },
    inactive: { label: 'พักงาน', labelEn: 'Inactive', color: '#94a3b8', bg: '#f1f5f9' },
    leave: { label: 'ลางาน', labelEn: 'On Leave', color: '#f59e0b', bg: '#fffbeb' },
};

const Staff = () => {
    const { staff, addStaff, updateStaff, deleteStaff } = useData();
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const filtered = (staff || []).filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone?.includes(searchTerm) ||
            s.licenseNumber?.includes(searchTerm);
        const matchRole = filterRole === 'all' || s.role === filterRole;
        return matchSearch && matchRole;
    });

    const handleAdd = () => { setEditingStaff(null); setIsModalOpen(true); };
    const handleEdit = (s) => { setEditingStaff(s); setIsModalOpen(true); };
    const handleDelete = (id) => {
        if (confirm(language === 'TH' ? 'ต้องการลบพนักงานนี้?' : 'Delete this staff member?')) {
            deleteStaff(id);
        }
    };
    const handleSave = (data) => {
        if (editingStaff) {
            updateStaff(editingStaff.id, data);
        } else {
            addStaff({ ...data, id: `STF-${Date.now()}` });
        }
        setIsModalOpen(false);
    };

    // Stats
    const totalActive = (staff || []).filter(s => s.status === 'active').length;
    const totalDentists = (staff || []).filter(s => s.role === 'dentist').length;
    const totalStaff = (staff || []).length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {language === 'TH' ? '👥 จัดการพนักงาน' : '👥 Staff Management'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                        {language === 'TH' ? 'จัดการข้อมูลทันตแพทย์และพนักงานทุกตำแหน่ง' : 'Manage dentists and all clinic staff'}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {language === 'TH' ? 'เพิ่มพนักงาน' : 'Add Staff'}
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                    { label: language === 'TH' ? 'พนักงานทั้งหมด' : 'Total Staff', value: totalStaff, icon: '👥', color: '#3b82f6' },
                    { label: language === 'TH' ? 'กำลังทำงาน' : 'Active', value: totalActive, icon: '✅', color: '#22c55e' },
                    { label: language === 'TH' ? 'ทันตแพทย์' : 'Dentists', value: totalDentists, icon: '🦷', color: '#8b5cf6' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '1.5rem' }}>{stat.icon}</div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                    <input
                        type="text"
                        placeholder={language === 'TH' ? 'ค้นหาชื่อ, เบอร์โทร, เลขใบอนุญาต...' : 'Search name, phone, license...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${filterRole === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterRole('all')}
                    >
                        {language === 'TH' ? 'ทั้งหมด' : 'All'}
                    </button>
                    {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                        <button
                            key={key}
                            className={`btn ${filterRole === key ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterRole(key)}
                        >
                            {cfg.icon} {language === 'TH' ? cfg.label : cfg.labelEn}
                        </button>
                    ))}
                </div>
            </div>

            {/* Staff Grid */}
            {filtered.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                    <UserCog size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>{language === 'TH' ? 'ไม่พบข้อมูลพนักงาน' : 'No staff found'}</p>
                    <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: '1rem' }}>
                        <Plus size={16} /> {language === 'TH' ? 'เพิ่มพนักงานคนแรก' : 'Add First Staff'}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                    {filtered.map(s => {
                        const roleCfg = ROLE_CONFIG[s.role] || ROLE_CONFIG.admin;
                        const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.active;
                        const isExpanded = expandedId === s.id;

                        return (
                            <div key={s.id} className="card" style={{
                                padding: '1.25rem',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                border: isExpanded ? `2px solid ${roleCfg.color}` : undefined,
                            }}
                                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${roleCfg.color}, ${roleCfg.color}88)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 800, fontSize: '1.1rem',
                                        flexShrink: 0
                                    }}>
                                        {s.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '2px 8px',
                                                background: roleCfg.bg, color: roleCfg.color,
                                                borderRadius: '12px', fontWeight: 600
                                            }}>
                                                {roleCfg.icon} {language === 'TH' ? roleCfg.label : roleCfg.labelEn}
                                            </span>
                                            <span style={{
                                                fontSize: '0.7rem', padding: '2px 6px',
                                                background: statusCfg.bg, color: statusCfg.color,
                                                borderRadius: '8px', fontWeight: 600
                                            }}>
                                                {language === 'TH' ? statusCfg.label : statusCfg.labelEn}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                                            style={{ padding: '0.5rem', color: '#ef4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                                    {s.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {s.phone}</span>}
                                    {s.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Mail size={13} /> {s.email}</span>}
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="animate-fade-in" style={{
                                        marginTop: '0.75rem', paddingTop: '0.75rem',
                                        borderTop: '1px solid var(--neutral-100)',
                                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
                                        fontSize: '0.85rem'
                                    }}>
                                        {s.licenseNumber && (
                                            <div>
                                                <div style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{language === 'TH' ? 'เลขใบอนุญาต' : 'License #'}</div>
                                                <div style={{ fontWeight: 600 }}>{s.licenseNumber}</div>
                                            </div>
                                        )}
                                        {s.specialty && (
                                            <div>
                                                <div style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{language === 'TH' ? 'ความเชี่ยวชาญ' : 'Specialty'}</div>
                                                <div style={{ fontWeight: 600 }}>{s.specialty}</div>
                                            </div>
                                        )}
                                        {s.startDate && (
                                            <div>
                                                <div style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{language === 'TH' ? 'วันเริ่มงาน' : 'Start Date'}</div>
                                                <div style={{ fontWeight: 600 }}>{new Date(s.startDate).toLocaleDateString()}</div>
                                            </div>
                                        )}
                                        {s.salary && (
                                            <div>
                                                <div style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{language === 'TH' ? 'เงินเดือน' : 'Salary'}</div>
                                                <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>฿{Number(s.salary).toLocaleString()}</div>
                                            </div>
                                        )}
                                        {s.schedule && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{language === 'TH' ? 'ตารางงาน' : 'Schedule'}</div>
                                                <div style={{ fontWeight: 600 }}>{s.schedule}</div>
                                            </div>
                                        )}
                                        {s.note && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{language === 'TH' ? 'หมายเหตุ' : 'Note'}</div>
                                                <div style={{ fontWeight: 600 }}>{s.note}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <StaffModal
                    staff={editingStaff}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                    language={language}
                />
            )}
        </div>
    );
};

export default Staff;
