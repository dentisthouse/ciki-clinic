import React, { useState, useEffect } from 'react';
import { Shield, Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth, DEFAULT_ROLE_PERMISSIONS, PERMISSION_MODULES, AVAILABLE_ROLES } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const RoleSettings = () => {
    const { isAdmin, rolePermissions, saveRolePermissions } = useAuth();
    const { language } = useLanguage();
    const [localPerms, setLocalPerms] = useState({});
    const [selectedRole, setSelectedRole] = useState('dentist');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedModules, setExpandedModules] = useState(PERMISSION_MODULES.map(m => m.id));

    useEffect(() => {
        setLocalPerms(JSON.parse(JSON.stringify(rolePermissions)));
    }, [rolePermissions]);

    const togglePermission = (roleId, moduleId, featureId) => {
        if (roleId === 'owner') return;
        setLocalPerms(prev => {
            const updated = JSON.parse(JSON.stringify(prev));
            if (!updated[roleId]) updated[roleId] = {};
            if (!updated[roleId][moduleId]) updated[roleId][moduleId] = {};
            updated[roleId][moduleId][featureId] = !updated[roleId][moduleId][featureId];
            return updated;
        });
        setHasChanges(true);
        setSaveStatus(null);
    };

    const toggleAllInModule = (roleId, moduleId, value) => {
        if (roleId === 'owner') return;
        setLocalPerms(prev => {
            const updated = JSON.parse(JSON.stringify(prev));
            if (!updated[roleId]) updated[roleId] = {};
            const module = PERMISSION_MODULES.find(m => m.id === moduleId);
            updated[roleId][moduleId] = Object.fromEntries(module.features.map(f => [f.id, value]));
            return updated;
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const success = await saveRolePermissions(localPerms);
        setSaving(false);
        setSaveStatus(success ? 'success' : 'error');
        if (success) setHasChanges(false);
        setTimeout(() => setSaveStatus(null), 3000);
    };

    if (!isAdmin) return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;

    const roleInfo = AVAILABLE_ROLES.find(r => r.id === selectedRole);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Shield size={28} color="var(--primary-600)" />
                            {language === 'TH' ? 'ตั้งค่าสิทธิ์การเข้าถึงเชิงลึก' : 'Granular Role Settings'}
                        </h1>
                        <p style={{ color: 'var(--neutral-500)', marginTop: '0.5rem' }}>
                            {language === 'TH' ? 'กำหนดสิทธิ์ละเอียดรายฟีเจอร์สำหรับแต่ละตำแหน่ง' : 'Define detailed feature-level access for each role'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => { setLocalPerms(JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS))); setHasChanges(true); }} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                            <RotateCcw size={16} /> {language === 'TH' ? 'ค่าเริ่มต้น' : 'Defaults'}
                        </button>
                        <button onClick={handleSave} disabled={!hasChanges || saving} className="btn btn-primary" style={{ gap: '0.5rem', padding: '0.7rem 2rem' }}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {language === 'TH' ? 'บันทึก' : 'Save'}
                        </button>
                    </div>
                </div>
                {saveStatus && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '12px', background: saveStatus === 'success' ? '#dcfce7' : '#fef2f2', color: saveStatus === 'success' ? '#16a34a' : '#dc2626', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {saveStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {saveStatus === 'success' ? (language === 'TH' ? 'บันทึกสำเร็จ' : 'Saved') : (language === 'TH' ? 'เกิดข้อผิดพลาด' : 'Error')}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {AVAILABLE_ROLES.map(role => (
                    <button key={role.id} onClick={() => setSelectedRole(role.id)} style={{
                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer',
                        background: selectedRole === role.id ? role.color : 'white',
                        color: selectedRole === role.id ? 'white' : 'var(--neutral-500)',
                        boxShadow: selectedRole === role.id ? `0 4px 12px ${role.color}40` : 'none',
                        transition: '0.2s', whiteSpace: 'nowrap'
                    }}>
                        {language === 'TH' ? role.labelTH : role.labelEN}
                    </button>
                ))}
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {PERMISSION_MODULES.map(module => {
                        const isExpanded = expandedModules.includes(module.id);
                        const modulePerms = localPerms[selectedRole]?.[module.id] || {};
                        const activeCount = Object.values(modulePerms).filter(Boolean).length;
                        const totalCount = module.features.length;

                        return (
                            <div key={module.id} style={{ border: '1px solid var(--neutral-100)', borderRadius: '16px', overflow: 'hidden' }}>
                                <div style={{ 
                                    padding: '1rem 1.25rem', background: isExpanded ? 'var(--neutral-50)' : 'white',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                                }} onClick={() => setExpandedModules(prev => isExpanded ? prev.filter(id => id !== module.id) : [...prev, module.id])}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        <span style={{ fontWeight: 800, color: 'var(--neutral-800)' }}>{language === 'TH' ? module.labelTH : module.labelEN}</span>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px', background: 'white', border: '1px solid var(--neutral-200)', color: 'var(--neutral-500)' }}>
                                            {activeCount} / {totalCount}
                                        </span>
                                    </div>
                                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => toggleAllInModule(selectedRole, module.id, true)} style={{ fontSize: '0.7rem', padding: '4px 8px', border: 'none', background: 'transparent', color: 'var(--primary-600)', fontWeight: 700, cursor: 'pointer' }}>
                                            {language === 'TH' ? 'เปิดทั้งหมด' : 'Enable All'}
                                        </button>
                                        <button onClick={() => toggleAllInModule(selectedRole, module.id, false)} style={{ fontSize: '0.7rem', padding: '4px 8px', border: 'none', background: 'transparent', color: 'var(--neutral-400)', fontWeight: 700, cursor: 'pointer' }}>
                                            {language === 'TH' ? 'ปิดทั้งหมด' : 'Disable All'}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={{ padding: '0.5rem 1rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', background: 'white' }}>
                                        {module.features.map(feature => (
                                            <div key={feature.id} onClick={() => togglePermission(selectedRole, module.id, feature.id)} style={{
                                                padding: '1rem', borderRadius: '12px', border: '1px solid var(--neutral-100)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                                                background: modulePerms[feature.id] ? `${roleInfo.color}05` : 'transparent',
                                                borderColor: modulePerms[feature.id] ? `${roleInfo.color}30` : 'var(--neutral-100)',
                                                transition: '0.2s'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: modulePerms[feature.id] ? roleInfo.color : 'var(--neutral-600)' }}>
                                                        {language === 'TH' ? feature.labelTH : feature.labelEN}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    width: '40px', height: '22px', borderRadius: '20px', padding: '2px',
                                                    background: modulePerms[feature.id] ? roleInfo.color : 'var(--neutral-200)',
                                                    position: 'relative', transition: '0.3s'
                                                }}>
                                                    <div style={{
                                                        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                                                        position: 'absolute', left: modulePerms[feature.id] ? '20px' : '2px', transition: '0.3s'
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RoleSettings;
