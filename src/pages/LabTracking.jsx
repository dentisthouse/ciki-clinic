import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Plus, Clock, ChevronRight, X, Trash2, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import SearchablePatientSelect from '../components/Common/SearchablePatientSelect';
import '../styles/labs.css';

const LabTracking = () => {
    const { t, language } = useLanguage();
    const langT = (th, en) => (language === 'TH' ? th : en);
    const { labOrders, patients, updateLabOrder, addLabOrder, deleteLabOrder, seedLabOrders } = useData(); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newOrder, setNewOrder] = useState({ patientId: '', lab: '', appliance: '', work: '', due: '' });

    const orders = labOrders || [];

    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return (
            order.patientName?.toLowerCase().includes(searchLower) ||
            order.lab?.toLowerCase().includes(searchLower) ||
            order.clinicName?.toLowerCase().includes(searchLower) ||
            order.work?.toLowerCase().includes(searchLower) ||
            order.items?.toLowerCase().includes(searchLower) ||
            order.appliance?.toLowerCase().includes(searchLower)
        );
    });

    const getStatusText = (status) => {
        if (language === 'TH') {
            switch (status) {
                case 'Sent': return 'ส่งงานแล็บแล้ว';
                case 'Received': return 'ได้รับงานแล้ว';
                case 'Delivered': return 'ส่งถึงคลินิกแล้ว';
                default: return status;
            }
        }
        return status;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Sent': return { bg: '#dbeafe', text: '#1e40af', icon: Truck };
            case 'Received': return { bg: '#fef3c7', text: '#92400e', icon: Package };
            case 'Delivered': return { bg: '#dcfce7', text: '#166534', icon: CheckCircle };
            default: return { bg: '#f3f4f6', text: '#6b7280', icon: Clock };
        }
    };

    const handleCreate = () => {
        const patient = patients.find(p => p.id === newOrder.patientId);
        addLabOrder({
            ...newOrder,
            id: Date.now(),
            patientName: patient ? patient.name : 'Unknown',
            status: 'Sent',
            sent: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(false);
        setNewOrder({ patientId: '', lab: '', appliance: '', work: '', due: '' });
    };

    return (
        <div className="labs-container animate-slide-up">
            {/* Page Header */}
            <div className="labs-header">
                <div className="labs-title-group">
                    <h1>
                        <div className="labs-icon-box">
                            <Truck size={24} />
                        </div>
                        {t('lab_title')}
                    </h1>
                    <p>{t('lab_subtitle')}</p>
                </div>
                <div className="labs-actions">
                    <div className="search-bar-modern">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder={langT('ค้นหาด้วยชื่อคนไข้, งาน, หรือแล็บ...', 'Search by name, work, or lab...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus size={20} strokeWidth={3} /> {t('btn_new_lab_order')}
                    </button>
                </div>
            </div>

            {filteredOrders.length === 0 && (
                <div className="labs-empty-state">
                    <div className="labs-empty-icon-circle">
                        <Package size={40} />
                    </div>
                    <h3>{searchTerm ? langT('ไม่พบข้อมูลที่ค้นหา', 'No results found') : langT('ยังไม่มีรายการสั่งแล็บ', 'No Lab Orders Yet')}</h3>
                    <p style={{ maxWidth: '350px', color: 'var(--neutral-400)', marginBottom: '1.5rem' }}>
                        {searchTerm ? langT('ลองค้นหาด้วยคำอื่นดูอีกครั้ง', 'Try searching with a different term.') : langT('ประวัติการสั่งแล็บจะปรากฏที่นี่ คุณสามารถเริ่มสร้างได้จากปุ่มด้านบน', 'Your lab order history will appear here. Start tracking by creating your first order.')}
                    </p>
                    {!searchTerm && (
                        <button className="btn-billing secondary" onClick={() => seedLabOrders()}>
                            {langT('โหลดข้อมูลตัวอย่างสำหรับทดสอบ', 'Load Sample Data')}
                        </button>
                    )}
                </div>
            )}

            {/* Lab Orders Grid */}
            <div className="labs-orders-grid">
                {filteredOrders.map(order => {
                    const statusStyle = getStatusColor(order.status);
                    const StatusIcon = statusStyle.icon;
                    return (
                        <div key={order.id} className="lab-case-card" style={{ borderTop: `4px solid ${statusStyle.text}` }}>
                            <div className="case-card-header">
                                <div className="case-info-main">
                                    {order.appliance && <span className="case-appliance-tag">{order.appliance}</span>}
                                    <h3 className="case-work-title">{order.work || order.items}</h3>
                                </div>
                                <span className={`lab-status-pill lab-status-${order.status.toLowerCase()}`}>
                                    <StatusIcon size={14} /> {getStatusText(order.status)}
                                </span>
                            </div>

                            <div className="case-details-list">
                                <div className="case-detail-row">
                                    <span className="case-detail-label">{t('sch_col_patient')}</span>
                                    <span className="case-detail-value">{order.patientName}</span>
                                </div>
                                <div className="case-detail-row">
                                    <span className="case-detail-label">{t('lab_col_lab')}</span>
                                    <span className="case-detail-value">{order.lab || order.clinicName}</span>
                                </div>
                                <div className="case-detail-row">
                                    <span className="case-detail-label">{t('lab_col_due')}</span>
                                    <span className="case-detail-value due">{order.due || order.dueDate}</span>
                                </div>
                            </div>

                            <div className="case-card-footer">
                                <button 
                                    className="btn-delete-case"
                                    onClick={() => {
                                        if (confirm(langT('ต้องการลบรายการนี้ใช่หรือไม่?', 'Are you sure you want to delete this order?'))) {
                                            deleteLabOrder(order.id);
                                        }
                                    }}
                                    title={langT('ลบรายการ', 'Delete Order')}
                                >
                                    <Trash2 size={18} />
                                </button>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {order.status === 'Sent' && (
                                        <button className="case-primary-action received" onClick={() => updateLabOrder(order.id, { status: 'Received' })}>
                                            {langT('ได้รับงานแล้ว', 'Mark Received')}
                                        </button>
                                    )}
                                    {order.status === 'Received' && (
                                        <button className="case-primary-action delivered" onClick={() => updateLabOrder(order.id, { status: 'Delivered' })}>
                                            {langT('นัดติดงานให้คนไข้', 'Schedule Patient')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '550px' }}>
                        {/* Modal Header */}
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="icon-box" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', width: '40px', height: '40px' }}>
                                    <Truck size={20} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{t('lab_modal_new')}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">{t('sch_col_patient')}</label>
                                    <SearchablePatientSelect
                                        patients={patients}
                                        value={newOrder.patientId}
                                        onChange={pId => setNewOrder({ ...newOrder, patientId: pId })}
                                        placeholder={t('apt_select_patient')}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">{t('lab_col_lab')}</label>
                                    <input
                                        className="form-input"
                                        placeholder={language === 'TH' ? "ระบุชื่อแล็บ (เช่น Hexa Ceram)" : "e.g. Hexa Ceram"}
                                        value={newOrder.lab}
                                        onChange={e => setNewOrder({ ...newOrder, lab: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">{language === 'TH' ? 'ประเภทงาน (ถ้ามี)' : 'Appliance Type'}</label>
                                        <select
                                            className="form-select"
                                            value={newOrder.appliance}
                                            onChange={e => setNewOrder({ ...newOrder, appliance: e.target.value })}
                                        >
                                            <option value="">{language === 'TH' ? '-- ไม่ระบุ --' : '-- General --'}</option>
                                            <option value="Retainer">Retainer</option>
                                            <option value="Aligner">Clear Aligner</option>
                                            <option value="RPE">RPE Expander</option>
                                            <option value="Space Maintainer">Space Maintainer</option>
                                            <option value="Functional">Functional Appliance</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('lab_form_due')}</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={newOrder.due}
                                            onChange={e => setNewOrder({ ...newOrder, due: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('lab_form_work')}</label>
                                    <input
                                        className="form-input"
                                        placeholder={language === 'TH' ? "รายละเอียดงาน (เช่น ครอบฟัน Zirconia ซี่ #16)" : "e.g. Zirconia Crown #16"}
                                        value={newOrder.work}
                                        onChange={e => setNewOrder({ ...newOrder, work: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                {t('btn_cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={handleCreate}>
                                <Plus size={20} strokeWidth={3} />
                                {t('lab_form_save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTracking;
