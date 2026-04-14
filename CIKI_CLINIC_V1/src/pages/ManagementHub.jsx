import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Settings, Users, Stethoscope, Bed, CreditCard, 
    Box, Shield, HelpCircle, ChevronRight, 
    Search, Plus, Edit2, Trash2, X, Save, 
    ToggleLeft, ToggleRight, Clock, MapPin
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

import Inventory from './Inventory';
import StaffManagement from './StaffManagement';
import SecurityAudit from './SecurityAudit';

const ManagementHub = () => {
    const { language, t } = useLanguage();
    const { 
        patients, staff, settings, updateSettings, updateStaff, addStaff, deleteStaff,
        appointments, inventory, invoices
    } = useData();
    const { section } = useParams();
    const navigate = useNavigate();
    const activeSection = section || 'staff';
    const setActiveSection = (id) => navigate(`/management/${id}`);

    const [staffSearch, setStaffSearch] = useState('');
    
    // Modals State
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);

    const sections = [
        { id: 'staff', icon: Users, label: language === 'TH' ? 'จัดการพนักงาน' : 'Staff Management' },
        { id: 'services', icon: Stethoscope, label: language === 'TH' ? 'หัตถการและราคา' : 'Services & Pricing' },
        { id: 'rooms', icon: Bed, label: language === 'TH' ? 'จัดการห้องตรวจ' : 'Room Management' },
        { id: 'inventory', icon: Box, label: language === 'TH' ? 'จัดการคลังยา' : 'Inventory Settings' },
        { id: 'security', icon: Shield, label: language === 'TH' ? 'ความปลอดภัย' : 'Security & Audit' }
    ];

    const filteredStaff = useMemo(() => {
        if (!staff) return [];
        if (!staffSearch) return staff;
        return staff.filter(s => 
            (s.name && s.name.toLowerCase().includes(staffSearch.toLowerCase())) || 
            (s.role && s.role.toLowerCase().includes(staffSearch.toLowerCase()))
        );
    }, [staff, staffSearch]);

    // Service Handlers
    const handleSaveService = (serviceData) => {
        const currentServices = settings.services || [];
        let updatedServices;
        if (editingService) {
            updatedServices = currentServices.map(s => s.id === editingService.id ? { ...s, ...serviceData } : s);
        } else {
            const newService = {
                ...serviceData,
                id: `svc-${Date.now()}`,
                active: true
            };
            updatedServices = [...currentServices, newService];
        }
        updateSettings({ services: updatedServices });
        setShowServiceModal(false);
        setEditingService(null);
    };

    const handleDeleteService = (id) => {
        if (window.confirm(language === 'TH' ? 'ยืนยันการลบรายการนี้?' : 'Confirm delete this item?')) {
            const updatedServices = (settings.services || []).filter(s => s.id !== id);
            updateSettings({ services: updatedServices });
        }
    };

    // Room Handlers
    const handleSaveRoom = (roomData) => {
        const currentRooms = settings.rooms || [
            { id: 'r1', name: { TH: 'ห้องตรวจ 1', EN: 'Room 1' }, type: 'General', status: 'available' },
            { id: 'r2', name: { TH: 'ห้องตรวจ 2', EN: 'Room 2' }, type: 'X-Ray', status: 'available' }
        ];
        let updatedRooms;
        if (editingRoom) {
            updatedRooms = currentRooms.map(r => r.id === editingRoom.id ? { ...r, ...roomData } : r);
        } else {
            const newRoom = {
                ...roomData,
                id: `room-${Date.now()}`
            };
            updatedRooms = [...currentRooms, newRoom];
        }
        updateSettings({ rooms: updatedRooms });
        setShowRoomModal(false);
        setEditingRoom(null);
    };

    const handleDeleteRoom = (id) => {
        if (window.confirm(language === 'TH' ? 'ยืนยันการลบห้องนี้?' : 'Confirm delete this room?')) {
            const updatedRooms = (settings.rooms || []).filter(r => r.id !== id);
            updateSettings({ rooms: updatedRooms });
        }
    };

    const handleLoadStandardServices = () => {
        if (window.confirm(language === 'TH' ? 'ต้องการโหลดรายการหัตถการมาตรฐานทั้งหมดหรือไม่? (รายการที่มีอยู่แล้วจะยังคงอยู่)' : 'Load all standard dental services? (Existing services will be kept)')) {
            const standardList = [
                { id: 'checkup', name: { TH: 'ตรวจสุขภาพช่องปากและปรึกษา', EN: 'Oral Exam & Consultation' }, category: 'general', price: 500, active: true },
                { id: 'xray-film', name: { TH: 'เอกซเรย์ฟิล์มเล็ก (Periapical)', EN: 'X-Ray (Periapical)' }, category: 'general', price: 300, active: true },
                { id: 'xray-pano', name: { TH: 'เอกซเรย์ทั้งปาก (Panoramic)', EN: 'Panoramic X-Ray' }, category: 'general', price: 800, active: true },
                { id: 'cleaning', name: { TH: 'ขูดหินปูนและขัดฟัน', EN: 'Scaling & Polishing' }, category: 'preventive', price: 1200, active: true },
                { id: 'fluoride', name: { TH: 'เคลือบฟลูออไรด์ทั่วทั้งปาก', EN: 'Fluoride Treatment' }, category: 'preventive', price: 600, active: true },
                { id: 'sealant', name: { TH: 'เคลือบหลุมร่องฟัน (ต่อซี่)', EN: 'Pit & Fissure Sealant' }, category: 'preventive', price: 600, active: true },
                { id: 'filling-1', name: { TH: 'อุดฟันสีเหมือนฟัน (1 ด้าน)', EN: 'Filling (1 Surface)' }, category: 'restorative', price: 1000, active: true },
                { id: 'filling-2', name: { TH: 'อุดฟันสีเหมือนฟัน (2 ด้าน)', EN: 'Filling (2 Surfaces)' }, category: 'restorative', price: 1800, active: true },
                { id: 'crown-porcelain', name: { TH: 'ครอบฟันเซรามิก', EN: 'Porcelain Crown' }, category: 'restorative', price: 15000, active: true },
                { id: 'denture-partial', name: { TH: 'ฟันปลอมฐานพลาสติก (ชิ้นเดียว)', EN: 'Partial Denture' }, category: 'restorative', price: 3000, active: true },
                { id: 'extraction-simple', name: { TH: 'ถอนฟันทั่วไป', EN: 'Simple Extraction' }, category: 'surgery', price: 800, active: true },
                { id: 'extraction-complex', name: { TH: 'ถอนฟันยาก/ฟันกราม', EN: 'Complex Extraction' }, category: 'surgery', price: 1500, active: true },
                { id: 'wisdom-tooth', name: { TH: 'ผ่าฟันคุด', EN: 'Wisdom Tooth Surgery' }, category: 'surgery', price: 3500, active: true },
                { id: 'rct-front', name: { TH: 'รักษารากฟันหน้า', EN: 'Root Canal (Front Tooth)' }, category: 'endodontics', price: 6000, active: true },
                { id: 'rct-molar', name: { TH: 'รักษารากฟันกราม', EN: 'Root Canal (Molar)' }, category: 'endodontics', price: 10000, active: true },
                { id: 'whitening', name: { TH: 'ฟอกสีฟัน (In-office)', EN: 'Teeth Whitening' }, category: 'cosmetic', price: 8500, active: true },
                { id: 'veneer', name: { TH: 'วีเนียร์เซรามิก (ต่อซี่)', EN: 'Ceramic Veneer' }, category: 'cosmetic', price: 12000, active: true },
                { id: 'braces-metal', name: { TH: 'จัดฟันแบบโลหะ (เหมาจ่าย)', EN: 'Metal Braces (Package)' }, category: 'orthodontics', price: 45000, active: true },
                { id: 'invisalign', name: { TH: 'จัดฟันแบบใส Invisalign', EN: 'Invisalign' }, category: 'orthodontics', price: 120000, active: true }
            ];

            const currentIds = new Set((settings.services || []).map(s => s.id));
            const toAdd = standardList.filter(s => !currentIds.has(s.id));
            
            if (toAdd.length > 0) {
                updateSettings({ services: [...(settings.services || []), ...toAdd] });
            }
        }
    };

    const renderContent = () => {
        switch(activeSection) {
            case 'staff':
                return (
                    <div className="animate-fade-in" style={{ margin: '-1.5rem', height: '100%' }}>
                        <StaffManagement />
                    </div>
                );
            case 'services':
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
                                {language === 'TH' ? 'หัตถการและราคา' : 'Services & Pricing'}
                            </h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className="btn" 
                                    onClick={handleLoadStandardServices}
                                    style={{ background: 'var(--success-50)', color: 'var(--success-700)', border: '1px solid var(--success-200)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Clock size={18} /> {language === 'TH' ? 'โหลดรายการมาตรฐาน' : 'Load Standard Services'}
                                </button>
                                <button className="btn btn-primary" onClick={() => { setEditingService(null); setShowServiceModal(true); }}>
                                    <Plus size={18} style={{ marginRight: '8px' }} /> {language === 'TH' ? 'เพิ่มหัตถการ' : 'Add Service'}
                                </button>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                {settings?.services?.map((svc, idx) => (
                                    <div key={idx} className="glass-panel" style={{ padding: '1.25rem', border: '1px solid var(--neutral-100)', borderRadius: '14px', background: 'white', position: 'relative' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--neutral-800)', marginBottom: '8px', fontSize: '1.1rem' }}>
                                            {svc.name[language]}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.95rem' }}>
                                                ฿{(svc.price || 0).toLocaleString()}
                                            </div>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                background: svc.active ? 'var(--success-light)' : 'var(--danger-light)', 
                                                color: svc.active ? 'var(--success)' : 'var(--danger)', 
                                                padding: '4px 10px', 
                                                borderRadius: '20px',
                                                fontWeight: 800,
                                                textTransform: 'uppercase'
                                            }}>
                                                {svc.active ? (language === 'TH' ? 'ใช้งาน' : 'Active') : (language === 'TH' ? 'ปิด' : 'Inactive')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--neutral-50)', paddingTop: '1rem' }}>
                                            <button 
                                                onClick={() => { setEditingService(svc); setShowServiceModal(true); }}
                                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--neutral-100)', background: 'white', color: 'var(--neutral-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}
                                            >
                                                <Edit2 size={14} /> {language === 'TH' ? 'แก้ไข' : 'Edit'}
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteService(svc.id)}
                                                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {(!settings?.services || settings.services.length === 0) && (
                                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                                    <Stethoscope size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>{language === 'TH' ? 'ไม่พบหัตถการในระบบ' : 'No services found'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'inventory':
                return (
                    <div className="animate-fade-in" style={{ margin: '-1.5rem', height: '100%' }}>
                        <Inventory />
                    </div>
                );
            case 'security':
                return (
                    <div className="animate-fade-in" style={{ margin: '-1.5rem', height: '100%' }}>
                        <SecurityAudit />
                    </div>
                );
            case 'rooms':
                const rooms = settings.rooms || [
                    { id: 'r1', name: { TH: 'ห้องตรวจ 1', EN: 'Room 1' }, type: 'General', status: 'available' },
                    { id: 'r2', name: { TH: 'ห้องตรวจ 2', EN: 'Room 2' }, type: 'X-Ray', status: 'available' }
                ];
                return (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
                                {language === 'TH' ? 'จัดการห้องตรวจ' : 'Room Management'}
                            </h2>
                            <button className="btn btn-primary" onClick={() => { setEditingRoom(null); setShowRoomModal(true); }}>
                                <Plus size={18} style={{ marginRight: '8px' }} /> {language === 'TH' ? 'เพิ่มห้อง' : 'Add Room'}
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {rooms.map((room) => (
                                <div key={room.id} className="glass-panel-premium" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--neutral-100)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Bed size={24} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{room.name[language]}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: room.status === 'available' ? 'var(--success)' : 'var(--danger)' }}></div>
                                                    <span style={{ fontSize: '0.8rem', color: room.status === 'available' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                                        {room.status === 'available' ? (language === 'TH' ? 'พร้อมใช้งาน' : 'Available') : (language === 'TH' ? 'ปิดปรับปรุง' : 'Maintenance')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.25rem', background: 'var(--neutral-50)', borderRadius: '14px', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{language === 'TH' ? 'ประเภท' : 'Type'}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neutral-800)' }}>{room.type}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 600 }}>ID</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neutral-400)' }}>#{room.id}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button 
                                            onClick={() => { setEditingRoom(room); setShowRoomModal(true); }}
                                            className="btn" style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: '10px', background: 'white', border: '1px solid var(--neutral-100)', fontWeight: 700 }}
                                        >
                                            <Edit2 size={14} style={{ marginRight: '6px' }} /> {language === 'TH' ? 'แก้ไข' : 'Edit'}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteRoom(room.id)}
                                            className="btn" style={{ padding: '10px', fontSize: '0.85rem', borderRadius: '10px', color: 'var(--danger)', border: '1px solid var(--danger-light)', background: 'var(--danger-light)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                        <Settings size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                        <h3>{language === 'TH' ? 'กำลังพัฒนาระบบนี้...' : 'Module Under Development...'}</h3>
                        <p>{language === 'TH' ? 'กรุณาเลือกเมนูอื่น' : 'Please select another section.'}</p>
                    </div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: '#f8fafc', margin: '-1.5rem' }}>
            {/* Sidebar Menu for Management */}
            <div style={{ 
                width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', 
                display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
                position: 'sticky', top: 0, height: 'calc(100vh - 70px)'
            }}>
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-800)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--primary-600)', padding: '6px', borderRadius: '10px', color: 'white' }}>
                            <Settings size={20} />
                        </div>
                        Management
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', margin: '4px 0 0 0', fontWeight: 600 }}>Centralized Clinic Control</p>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px', 
                    padding: '0 1rem 2rem 1rem', // Added bottom padding to fix clipping
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {sections.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 16px', borderRadius: '12px', border: 'none',
                                background: activeSection === sec.id ? 'var(--primary-600)' : 'transparent',
                                color: activeSection === sec.id ? 'white' : 'var(--neutral-600)',
                                fontWeight: activeSection === sec.id ? 800 : 600,
                                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%', textAlign: 'left',
                                boxShadow: activeSection === sec.id ? '0 4px 12px rgba(var(--primary-600-rgb), 0.3)' : 'none'
                            }}
                        >
                            <sec.icon size={18} color={activeSection === sec.id ? 'white' : 'var(--neutral-400)'} />
                            <span style={{ flex: 1 }}>{sec.label}</span>
                            {activeSection === sec.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', background: '#f4f7fb' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {renderContent()}
                </div>
            </div>

            {/* Modals for Services & Rooms */}
            {showServiceModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{editingService ? (language === 'TH' ? 'แก้ไขหัตถการ' : 'Edit Service') : (language === 'TH' ? 'เพิ่มหัตถการใหม่' : 'Add New Service')}</h2>
                            <button onClick={() => setShowServiceModal(false)} className="modal-close"><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleSaveService({
                                    name: { TH: formData.get('nameTH'), EN: formData.get('nameEN') },
                                    price: parseInt(formData.get('price')),
                                    category: formData.get('category'),
                                    active: formData.get('active') === 'on'
                                });
                            }}>
                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>ชื่อหัตถการ (TH)</label>
                                        <input name="nameTH" defaultValue={editingService?.name?.TH} required className="form-input" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Service Name (EN)</label>
                                        <input name="nameEN" defaultValue={editingService?.name?.EN} required className="form-input" style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>ราคา (฿)</label>
                                            <input type="number" name="price" defaultValue={editingService?.price} required className="form-input" style={{ width: '100%' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>หมวดหมู่</label>
                                            <select name="category" defaultValue={editingService?.category} className="form-input" style={{ width: '100%' }}>
                                                <option value="general">General</option>
                                                <option value="preventive">Preventive</option>
                                                <option value="restorative">Restorative</option>
                                                <option value="cosmetic">Cosmetic</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="checkbox" name="active" defaultChecked={editingService ? editingService.active : true} id="active-check" />
                                        <label htmlFor="active-check" style={{ fontSize: '0.875rem', fontWeight: 600 }}>เปิดใช้งานรายการนี้</label>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800 }}>
                                            <Save size={18} style={{ marginRight: '8px' }} /> {language === 'TH' ? 'บันทึกรายการ' : 'Save Service'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showRoomModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{editingRoom ? (language === 'TH' ? 'แก้ไขห้องตรวจ' : 'Edit Room') : (language === 'TH' ? 'เพิ่มห้องตรวจใหม่' : 'Add New Room')}</h2>
                            <button onClick={() => setShowRoomModal(false)} className="modal-close"><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleSaveRoom({
                                    name: { TH: formData.get('nameTH'), EN: formData.get('nameEN') },
                                    type: formData.get('type'),
                                    status: formData.get('status')
                                });
                            }}>
                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>ชื่อห้อง (TH)</label>
                                        <input name="nameTH" defaultValue={editingRoom?.name?.TH} required className="form-input" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Room Name (EN)</label>
                                        <input name="nameEN" defaultValue={editingRoom?.name?.EN} required className="form-input" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>ประเภท</label>
                                        <input name="type" defaultValue={editingRoom?.type || 'General'} required className="form-input" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>สถานะ</label>
                                        <select name="status" defaultValue={editingRoom?.status || 'available'} className="form-input" style={{ width: '100%' }}>
                                            <option value="available">พร้อมใช้งาน</option>
                                            <option value="maintenance">ปิดปรับปรุง</option>
                                            <option value="occupied">กำลังใช้งาน</option>
                                        </select>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800 }}>
                                            <Save size={18} style={{ marginRight: '8px' }} /> {language === 'TH' ? 'บันทึกข้อมูลห้อง' : 'Save Room'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagementHub;
