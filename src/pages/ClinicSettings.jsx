import React, { useState, useEffect } from 'react';
import { 
    Building, 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    Calendar, 
    Settings, 
    Plus, 
    Edit3, 
    Trash2, 
    Save, 
    Upload,
    Download,
    Users,
    CreditCard,
    Stethoscope,
    Package,
    Shield,
    Globe,
    Camera,
    FileText,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const ClinicSettings = () => {
    const { language } = useLanguage();
    const { isAdmin } = useAuth();
    
    const [activeTab, setActiveTab] = useState('general'); // general, branches, services, pricing, hours, payments, system
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    // ข้อมูลคลินิกหลัก
    const [clinicInfo, setClinicInfo] = useState({
        name: { TH: 'คลินิกทันตกรรม CIKI', EN: 'CIKI Dental Clinic' },
        logo: '/logo.png',
        description: { 
            TH: 'คลินิกทันตกรรมที่ทันสมัยครบครบบริการคุณภาพระด้วยทีมทันตแพทย์ผู้เชี่ยวชาญ',
            EN: 'Modern dental clinic providing comprehensive dental care with experienced dental team'
        },
        contact: {
            phone: '02-123-4567',
            email: 'info@ciki.com',
            website: 'www.ciki.com',
            line: '@ciki-dental'
        },
        address: {
            street: '123 ถนนสุขุมวงค์',
            district: 'เขตดุสิต',
            province: 'กรุงเทพมหานคร',
            postcode: '10400',
            country: { TH: 'ประเทศไทย', EN: 'Thailand' }
        },
        tax: {
            id: '1234567890123',
            name: 'CIKI DENTAL CLINIC CO., LTD.'
        }
    });

    // ข้อมูลสาขา
    const [branches, setBranches] = useState([
        {
            id: 'main',
            name: { TH: 'สาขาหลัก', EN: 'Main Branch' },
            address: '123 ถนนสุขุมวงค์ กรุงเทพฯ',
            phone: '02-123-4567',
            email: 'main@ciki.com',
            manager: 'หมออ้อม',
            status: 'active',
            openingDate: '2020-01-15',
            coordinates: { lat: 13.7563, lng: 100.5018 }
        },
        {
            id: 'branch1',
            name: { TH: 'สาขา สุขุมวงค์', EN: 'Sukhumvit Branch' },
            address: '456 ถนนสุขุมวงค์ กรุงเทพฯ',
            phone: '02-987-6543',
            email: 'sukhumvit@ciki.com',
            manager: 'หมอต้อง',
            status: 'active',
            openingDate: '2022-06-01',
            coordinates: { lat: 13.7468, lng: 100.5350 }
        }
    ]);

    // ข้อมูลบริการ
    const [services, setServices] = useState([
        {
            id: 'checkup',
            name: { TH: 'ตรวจสอบสุขภาพช่องปาก', EN: 'Oral Examination' },
            category: 'general',
            price: 500,
            duration: 30,
            description: { TH: 'ตรวจสอบสุขภาพช่องปากโดยทั่วไป', EN: 'General oral health examination' },
            active: true
        },
        {
            id: 'cleaning',
            name: { TH: 'ขูดหินปูน', EN: 'Dental Cleaning' },
            category: 'preventive',
            price: 800,
            duration: 45,
            description: { TH: 'ทำความสะอาดและขูดหินปูน', EN: 'Professional teeth cleaning and scaling' },
            active: true
        },
        {
            id: 'filling',
            name: { TH: 'อุดฟัน', EN: 'Tooth Filling' },
            category: 'restorative',
            price: 1500,
            duration: 60,
            description: { TH: 'อุดฟันผุด้วยวัสดุสีเดียวกับฟัน', EN: 'Tooth-colored filling for cavities' },
            active: true
        },
        {
            id: 'whitening',
            name: { TH: 'ฟันขาว', EN: 'Teeth Whitening' },
            category: 'cosmetic',
            price: 5000,
            duration: 90,
            description: { TH: 'ทำฟันขาวในคลินิก', EN: 'In-office professional teeth whitening' },
            active: true
        },
        {
            id: 'implant',
            name: { TH: 'อิมแพลนต์', EN: 'Dental Implant' },
            category: 'implant',
            price: 35000,
            duration: 120,
            description: { TH: 'ปลูกฟันเทียม', EN: 'Artificial tooth implant placement' },
            active: true
        }
    ]);

    // ข้อมูลเวลาทำการ
    const [workingHours, setWorkingHours] = useState({
        weekdays: {
            monday: { open: '08:30', close: '20:00', closed: false },
            tuesday: { open: '08:30', close: '20:00', closed: false },
            wednesday: { open: '08:30', close: '20:00', closed: false },
            thursday: { open: '08:30', close: '20:00', closed: false },
            friday: { open: '08:30', close: '20:00', closed: false },
            saturday: { open: '09:00', close: '18:00', closed: false },
            sunday: { open: '', close: '', closed: true }
        },
        holidays: [
            { date: '2024-01-01', name: { TH: 'วันขึ้นปีใหม่', EN: 'New Year\'s Day' } },
            { date: '2024-04-13', name: { TH: 'วันสงกรานต์', EN: 'Songkran Day' } },
            { date: '2024-12-25', name: { TH: 'วันคริสต์มาส', EN: 'Christmas Day' } }
        ]
    });

    // ข้อมูลการชำระเงิน
    const [paymentMethods, setPaymentMethods] = useState([
        {
            id: 'cash',
            name: { TH: 'เงินสด', EN: 'Cash' },
            enabled: true,
            icon: '💵',
            description: { TH: 'รับชำระเงินสด', EN: 'Accept cash payments' }
        },
        {
            id: 'card',
            name: { TH: 'บัตรเครดิต', EN: 'Credit Card' },
            enabled: true,
            icon: '💳',
            description: { TH: 'รับบัตร VISA, Mastercard', EN: 'Accept VISA, Mastercard' }
        },
        {
            id: 'transfer',
            name: { TH: 'โอนเงิน', EN: 'Bank Transfer' },
            enabled: true,
            icon: '🏦',
            description: { TH: 'โอนเงินผ่านธนาคาร', EN: 'Bank transfer payments' }
        },
        {
            id: 'promptpay',
            name: { TH: 'พร้อมเพย์', EN: 'PromptPay' },
            enabled: true,
            icon: '📱',
            description: { TH: 'รับชำระผ่านพร้อมเพย์', EN: 'PromptPay QR code payments' }
        },
        {
            id: 'insurance',
            name: { TH: 'ประกัน', EN: 'Insurance' },
            enabled: true,
            icon: '🛡️',
            description: { TH: 'รับประกันสังคมและประกันสุขภาพ', EN: 'Social security and private insurance' }
        }
    ]);

    useEffect(() => {
        loadClinicSettings();
    }, []);

    const loadClinicSettings = () => {
        // จำลองการโหลดข้อมูลจาก API
        console.log('Loading clinic settings...');
    };

    const saveSettings = async () => {
        setIsSaving(true);
        
        try {
            // จำลองการบันทึกข้อมูล
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Settings saved:', {
                clinicInfo,
                branches,
                services,
                workingHours,
                paymentMethods
            });
            
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const addBranch = () => {
        const newBranch = {
            id: `branch${Date.now()}`,
            name: { TH: 'สาขาใหม่', EN: 'New Branch' },
            address: '',
            phone: '',
            email: '',
            manager: '',
            status: 'inactive',
            openingDate: new Date().toISOString().split('T')[0],
            coordinates: { lat: 0, lng: 0 }
        };
        
        setBranches([...branches, newBranch]);
        setSelectedBranch(newBranch);
    };

    const updateBranch = (id, updates) => {
        setBranches(branches.map(branch => 
            branch.id === id ? { ...branch, ...updates } : branch
        ));
    };

    const deleteBranch = (id) => {
        if (confirm(language === 'TH' ? 'ยืนยันการลบสาขา?' : 'Confirm branch deletion?')) {
            setBranches(branches.filter(branch => branch.id !== id));
            if (selectedBranch?.id === id) {
                setSelectedBranch(null);
            }
        }
    };

    const addService = () => {
        const newService = {
            id: `service${Date.now()}`,
            name: { TH: 'บริการใหม่', EN: 'New Service' },
            category: 'general',
            price: 0,
            duration: 30,
            description: { TH: 'รายละเอียดบริการใหม่', EN: 'New service description' },
            active: false
        };
        
        setServices([...services, newService]);
    };

    const updateService = (id, updates) => {
        setServices(services.map(service => 
            service.id === id ? { ...service, ...updates } : service
        ));
    };

    const deleteService = (id) => {
        if (confirm(language === 'TH' ? 'ยืนยันการลบบริการ?' : 'Confirm service deletion?')) {
            setServices(services.filter(service => service.id !== id));
        }
    };

    const serviceCategories = {
        general: { TH: 'ทั่วไป', EN: 'General' },
        preventive: { TH: 'ป้องกัน', EN: 'Preventive' },
        restorative: { TH: 'ฟื้นฟู', EN: 'Restorative' },
        cosmetic: { TH: 'ความงาม', EN: 'Cosmetic' },
        implant: { TH: 'อิมแพลนต์', EN: 'Implant' },
        orthodontic: { TH: 'จัดฟัน', EN: 'Orthodontic' }
    };

    if (!isAdmin) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Settings size={48} color="var(--neutral-400)" />
                <h2 style={{ marginTop: '1rem' }}>
                    {language === 'TH' ? 'เข้าถึงไม่ได้' : 'Access Denied'}
                </h2>
                <p style={{ color: 'var(--neutral-600)' }}>
                    {language === 'TH' ? 'หน้านี้สำหรับ Owner/Admin เท่านั้น' : 'This page is for Owner/Admin only'}
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: '#f8fafc', margin: '-1.5rem' }}>
            {/* Sidebar Menu for Settings */}
            <div style={{ 
                width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', 
                flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '1.5rem 0'
            }}>
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings color="var(--primary-500)" />
                        Settings Hub
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Clinic Configuration Profile</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 1rem', overflowY: 'auto' }}>
                    {[
                        { id: 'general', icon: Building, label: { TH: 'ข้อมูลทั่วไป', EN: 'General' } },
                        { id: 'branches', icon: MapPin, label: { TH: 'สาขา', EN: 'Branches' } },
                        { id: 'services', icon: Stethoscope, label: { TH: 'บริการ', EN: 'Services' } },
                        { id: 'pricing', icon: CreditCard, label: { TH: 'ราคาบริการ', EN: 'Pricing' } },
                        { id: 'hours', icon: Clock, label: { TH: 'เวลาทำการ', EN: 'Working Hours' } },
                        { id: 'payments', icon: CreditCard, label: { TH: 'การชำระเงิน', EN: 'Payments' } },
                        { id: 'system', icon: Settings, label: { TH: 'ระบบ', EN: 'System' } }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 16px', borderRadius: '12px', border: 'none',
                                background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary-700)' : '#475569',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left'
                            }}
                        >
                            <tab.icon size={18} color={activeTab === tab.id ? 'var(--primary-600)' : '#94a3b8'} />
                            <span style={{ flex: 1 }}>{tab.label[language]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f4f7fb' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                    {saveStatus && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: saveStatus === 'success' ? '#d1fae5' : '#fee2e2',
                            color: saveStatus === 'success' ? '#059669' : '#dc2626',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            {saveStatus === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            {saveStatus === 'success' ? 
                                (language === 'TH' ? 'บันทึกสำเร็จ' : 'Saved successfully') : 
                                (language === 'TH' ? 'บันทึกไม่สำเร็จ' : 'Save failed')
                            }
                        </div>
                    )}
                    
                    <button 
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isSaving ? (
                            <>
                                <div className="spinner" style={{ width: '18px', height: '18px' }} />
                                {language === 'TH' ? 'กำลังบันทึก...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {language === 'TH' ? 'บันทึกการตั้งค่าทั้งหมด' : 'Save All Settings'}
                            </>
                        )}
                    </button>
                </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ข้อมูลคลินิก' : 'Clinic Information'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                        {/* Logo */}
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}>
                                {language === 'TH' ? 'โลโก้' : 'Logo'}
                            </label>
                            <div style={{
                                width: '200px',
                                height: '200px',
                                border: '2px dashed var(--neutral-300)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '1rem',
                                cursor: 'pointer'
                            }}>
                                <Camera size={48} color="var(--neutral-400)" />
                                <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    {language === 'TH' ? 'คลิกเพื่ออัพโหลด' : 'Click to upload'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Basic Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {language === 'TH' ? 'ชื่อคลินิก' : 'Clinic Name'}
                                </label>
                                <input
                                    type="text"
                                    value={clinicInfo.name[language]}
                                    onChange={(e) => setClinicInfo(prev => ({
                                        ...prev,
                                        name: { ...prev.name, [language]: e.target.value }
                                    }))}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {language === 'TH' ? 'รายละเอียด' : 'Description'}
                                </label>
                                <textarea
                                    value={clinicInfo.description[language]}
                                    onChange={(e) => setClinicInfo(prev => ({
                                        ...prev,
                                        description: { ...prev.description, [language]: e.target.value }
                                    }))}
                                    rows={3}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Contact Information */}
                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>
                            {language === 'TH' ? 'ข้อมูลติดต่อ' : 'Contact Information'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    <Phone size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    {language === 'TH' ? 'โทรศัพท์' : 'Phone'}
                                </label>
                                <input
                                    type="tel"
                                    value={clinicInfo.contact.phone}
                                    onChange={(e) => setClinicInfo(prev => ({
                                        ...prev,
                                        contact: { ...prev.contact, phone: e.target.value }
                                    }))}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    {language === 'TH' ? 'อีเมล' : 'Email'}
                                </label>
                                <input
                                    type="email"
                                    value={clinicInfo.contact.email}
                                    onChange={(e) => setClinicInfo(prev => ({
                                        ...prev,
                                        contact: { ...prev.contact, email: e.target.value }
                                    }))}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    <Globe size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    {language === 'TH' ? 'เว็บไซต์' : 'Website'}
                                </label>
                                <input
                                    type="url"
                                    value={clinicInfo.contact.website}
                                    onChange={(e) => setClinicInfo(prev => ({
                                        ...prev,
                                        contact: { ...prev.contact, website: e.target.value }
                                    }))}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--neutral-200)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Address */}
                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>
                            <MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            {language === 'TH' ? 'ที่อยู่' : 'Address'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder={language === 'TH' ? 'ที่อยู่' : 'Street Address'}
                                value={clinicInfo.address.street}
                                onChange={(e) => setClinicInfo(prev => ({
                                    ...prev,
                                    address: { ...prev.address, street: e.target.value }
                                }))}
                                style={{ 
                                    padding: '0.75rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--neutral-200)'
                                }}
                            />
                            <input
                                type="text"
                                placeholder={language === 'TH' ? 'เขต' : 'District'}
                                value={clinicInfo.address.district}
                                onChange={(e) => setClinicInfo(prev => ({
                                    ...prev,
                                    address: { ...prev.address, district: e.target.value }
                                }))}
                                style={{ 
                                    padding: '0.75rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--neutral-200)'
                                }}
                            />
                            <input
                                type="text"
                                placeholder={language === 'TH' ? 'จังหวัด' : 'Province'}
                                value={clinicInfo.address.province}
                                onChange={(e) => setClinicInfo(prev => ({
                                    ...prev,
                                    address: { ...prev.address, province: e.target.value }
                                }))}
                                style={{ 
                                    padding: '0.75rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--neutral-200)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Branches Tab */}
            {activeTab === 'branches' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'จัดการสาขา' : 'Branch Management'}
                        </h3>
                        <button 
                            onClick={addBranch}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} />
                            {language === 'TH' ? 'เพิ่มสาขา' : 'Add Branch'}
                        </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        {branches.map(branch => (
                            <div key={branch.id} style={{
                                padding: '1.5rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                background: 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                                            {branch.name[language]}
                                        </h4>
                                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                            {branch.address}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: branch.status === 'active' ? '#dcfce7' : '#fee2e2',
                                                color: branch.status === 'active' ? '#16a34a' : '#dc2626'
                                            }}>
                                                {branch.status === 'active' ? (language === 'TH' ? 'เปิดทำการ' : 'Active') : (language === 'TH' ? 'ปิด' : 'Closed')}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => setSelectedBranch(branch)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => deleteBranch(branch.id)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Phone size={14} />
                                        <span>{branch.phone}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Mail size={14} />
                                        <span>{branch.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Users size={14} />
                                        <span>{language === 'TH' ? 'ผู้จัดการ' : 'Manager'}: {branch.manager}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} />
                                        <span>{language === 'TH' ? 'เปิด' : 'Opened'}: {branch.openingDate}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Stethoscope size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'จัดการบริการ' : 'Service Management'}
                        </h3>
                        <button 
                            onClick={addService}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} />
                            {language === 'TH' ? 'เพิ่มบริการ' : 'Add Service'}
                        </button>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'บริการ' : 'Service'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'หมวด' : 'Category'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ราคา' : 'Price'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ระยะเวลา' : 'Duration'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {language === 'TH' ? 'สถานะ' : 'Status'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {language === 'TH' ? 'จัดการ' : 'Actions'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(service => (
                                    <tr key={service.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{service.name[language]}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginTop: '0.25rem' }}>
                                                    {service.description[language]}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: '#f3f4f6',
                                                color: '#6b7280'
                                            }}>
                                                {serviceCategories[service.category]?.[language]}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                            ฿{service.price.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {service.duration} {language === 'TH' ? 'นาที' : 'min'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: service.active ? '#dcfce7' : '#fee2e2',
                                                color: service.active ? '#16a34a' : '#dc2626'
                                            }}>
                                                {service.active ? (language === 'TH' ? 'ใช้งาน' : 'Active') : (language === 'TH' ? 'ไม่ใช้งาน' : 'Inactive')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button 
                                                    onClick={() => updateService(service.id, { active: !service.active })}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.25rem 0.5rem' }}
                                                >
                                                    {service.active ? '🔴' : '🟢'}
                                                </button>
                                                <button 
                                                    onClick={() => deleteService(service.id)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.25rem 0.5rem' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Working Hours Tab */}
            {activeTab === 'hours' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'เวลาทำการ' : 'Working Hours'}
                    </h3>
                    
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>
                            {language === 'TH' ? 'เวลาทำการประจำวัน' : 'Regular Working Hours'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            {Object.entries(workingHours.weekdays).map(([day, hours]) => (
                                <div key={day} style={{ 
                                    padding: '1rem', 
                                    border: '1px solid var(--neutral-200)', 
                                    borderRadius: '8px',
                                    background: hours.closed ? '#fef2f2' : 'white'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>
                                            {day === 'monday' ? (language === 'TH' ? 'จันทร์' : 'Monday') :
                                             day === 'tuesday' ? (language === 'TH' ? 'อังคาร' : 'Tuesday') :
                                             day === 'wednesday' ? (language === 'TH' ? 'พุธ' : 'Wednesday') :
                                             day === 'thursday' ? (language === 'TH' ? 'พฤหัสบดี' : 'Thursday') :
                                             day === 'friday' ? (language === 'TH' ? 'ศุกร์' : 'Friday') :
                                             day === 'saturday' ? (language === 'TH' ? 'เสาร์' : 'Saturday') :
                                             (language === 'TH' ? 'อาทิตย์' : 'Sunday')}
                                        </span>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={hours.closed}
                                                onChange={(e) => setWorkingHours(prev => ({
                                                    ...prev,
                                                    weekdays: {
                                                        ...prev.weekdays,
                                                        [day]: { ...hours, closed: e.target.checked }
                                                    }
                                                }))}
                                            />
                                            <span style={{ fontSize: '0.875rem' }}>
                                                {hours.closed ? (language === 'TH' ? 'ปิด' : 'Closed') : (language === 'TH' ? 'เปิด' : 'Open')}
                                            </span>
                                        </label>
                                    </div>
                                    
                                    {!hours.closed && (
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                                    {language === 'TH' ? 'เปิด' : 'Open'}
                                                </label>
                                                <input
                                                    type="time"
                                                    value={hours.open}
                                                    onChange={(e) => setWorkingHours(prev => ({
                                                        ...prev,
                                                        weekdays: {
                                                            ...prev.weekdays,
                                                            [day]: { ...hours, open: e.target.value }
                                                        }
                                                    }))}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '0.5rem', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid var(--neutral-200)',
                                                        fontSize: '0.875rem'
                                                    }}
                                                />
                                            </div>
                                            <span>-</span>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                                    {language === 'TH' ? 'ปิด' : 'Close'}
                                                </label>
                                                <input
                                                    type="time"
                                                    value={hours.close}
                                                    onChange={(e) => setWorkingHours(prev => ({
                                                        ...prev,
                                                        weekdays: {
                                                            ...prev.weekdays,
                                                            [day]: { ...hours, close: e.target.value }
                                                        }
                                                    }))}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '0.5rem', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid var(--neutral-200)',
                                                        fontSize: '0.875rem'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h4 style={{ marginBottom: '1rem' }}>
                            {language === 'TH' ? 'วันหยุดพิเศษ' : 'Special Holidays'}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {workingHours.holidays.map((holiday, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    gap: '1rem', 
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    border: '1px solid var(--neutral-200)',
                                    borderRadius: '8px'
                                }}>
                                    <input
                                        type="date"
                                        value={holiday.date}
                                        onChange={(e) => {
                                            const updatedHolidays = [...workingHours.holidays];
                                            updatedHolidays[index] = { ...holiday, date: e.target.value };
                                            setWorkingHours(prev => ({ ...prev, holidays: updatedHolidays }));
                                        }}
                                        style={{ 
                                            padding: '0.5rem', 
                                            borderRadius: '6px', 
                                            border: '1px solid var(--neutral-200)'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={holiday.name[language]}
                                        onChange={(e) => {
                                            const updatedHolidays = [...workingHours.holidays];
                                            updatedHolidays[index] = { ...holiday, name: { ...holiday.name, [language]: e.target.value } };
                                            setWorkingHours(prev => ({ ...prev, holidays: updatedHolidays }));
                                        }}
                                        placeholder={language === 'TH' ? 'ชื่อวันหยุด' : 'Holiday name'}
                                        style={{ 
                                            flex: 1,
                                            padding: '0.5rem', 
                                            borderRadius: '6px', 
                                            border: '1px solid var(--neutral-200)'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payments' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'วิธีการชำระเงิน' : 'Payment Methods'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {paymentMethods.map(method => (
                            <div key={method.id} style={{
                                padding: '1.5rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                background: method.enabled ? 'white' : '#f9fafb'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '2rem' }}>{method.icon}</span>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                                                {method.name[language]}
                                            </h4>
                                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                                {method.description[language]}
                                            </p>
                                        </div>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={method.enabled}
                                            onChange={(e) => {
                                                const updated = paymentMethods.map(m => 
                                                    m.id === method.id ? { ...m, enabled: e.target.checked } : m
                                                );
                                                setPaymentMethods(updated);
                                            }}
                                        />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                            {method.enabled ? (language === 'TH' ? 'เปิด' : 'Enabled') : (language === 'TH' ? 'ปิด' : 'Disabled')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ตั้งค่าระบบ' : 'System Settings'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                <Shield size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                {language === 'TH' ? 'ความปลอดภัย' : 'Security'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'บังคับ Two-Factor Authentication' : 'Enable 2FA'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'บันทึก Activity Log' : 'Log user activities'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'สำรองข้อมูลอัตโนมัติ' : 'Auto backup'}</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                <Info size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                {language === 'TH' ? 'การแจ้งเตือน' : 'Notifications'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'แจ้งเตือนเมื่อสต็อกต่ำ' : 'Low stock alerts'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'รายงานประจำวัน' : 'Daily reports'}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{language === 'TH' ? 'แจ้งเตือนการนัดหมาย' : 'Appointment reminders'}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default ClinicSettings;
