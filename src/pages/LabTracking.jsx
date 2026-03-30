import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Plus, Clock, ChevronRight, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const LabTracking = () => {
    const { t, language } = useLanguage();
    const { labOrders, patients, updateLabOrder, addLabOrder } = useData(); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOrder, setNewOrder] = useState({ patientId: '', lab: '', appliance: '', work: '', due: '' });

    const orders = labOrders || [];

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
        <div className="animate-slide-up" style={{ padding: '2rem' }}>
            <div className="glass-panel" style={{ 
                padding: '1.5rem 2rem', 
                marginBottom: '1.5rem', 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--neutral-200)',
                borderRadius: '24px'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
                        {t('lab_title')}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem', margin: '0.25rem 0 0', fontWeight: 500 }}>
                        {t('lab_subtitle')}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: 800, fontSize: '0.875rem' }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> {t('btn_new_lab_order')}
                </button>
            </div>

            {orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--neutral-50)', borderRadius: '32px', border: '2px dashed var(--neutral-200)', marginTop: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                        <Package size={32} color="var(--neutral-300)" />
                    </div>
                    <h3 style={{ color: 'var(--neutral-900)', fontWeight: 800, margin: '0 0 0.5rem' }}>{language === 'TH' ? 'ยังไม่มีรายการสั่งแล็บ' : 'No Lab Orders Yet'}</h3>
                    <p style={{ color: 'var(--neutral-400)', maxWidth: '300px', margin: '0 auto' }}>{language === 'TH' ? 'เริ่มสร้างรายการสั่งงานแล็บใหม่ได้ด้วยปุ่มด้านบน' : 'Start tracking by creating your first lab order.'}</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {orders.map(order => {
                    const statusStyle = getStatusColor(order.status);
                    const StatusIcon = statusStyle.icon;
                    return (
                        <div key={order.id} className="card" style={{ padding: '1.5rem', borderTop: `4px solid ${statusStyle.text}`, background: 'white', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--neutral-900)' }}>
                                    {order.appliance && <span style={{ color: 'var(--primary-600)', marginRight: '8px' }}>[{order.appliance}]</span>}
                                    {order.work}
                                </span>
                                <span style={{
                                    padding: '6px 10px', borderRadius: '10px',
                                    background: statusStyle.bg, color: statusStyle.text,
                                    fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <StatusIcon size={14} /> {getStatusText(order.status)}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--neutral-400)', fontWeight: 700 }}>{t('sch_col_patient')}:</span>
                                    <span style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>{order.patientName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--neutral-400)', fontWeight: 700 }}>{t('lab_col_lab')}:</span>
                                    <span style={{ fontWeight: 700, color: 'var(--neutral-700)' }}>{order.lab}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--neutral-400)', fontWeight: 700 }}>{t('lab_col_due')}:</span>
                                    <span style={{ color: '#d97706', fontWeight: 800 }}>{order.due}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'flex-end' }}>
                                {order.status === 'Sent' && (
                                    <button className="btn btn-secondary" style={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem' }} onClick={() => updateLabOrder(order.id, { status: 'Received' })}>
                                        {language === 'TH' ? 'ทำเครื่องหมายว่าได้รับงานแล้ว' : 'Mark Received'}
                                    </button>
                                )}
                                {order.status === 'Received' && (
                                    <button className="btn btn-primary" style={{ borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem' }} onClick={() => updateLabOrder(order.id, { status: 'Delivered' })}>
                                        {language === 'TH' ? 'ทำเครื่องหมายว่าถึงคลินิกแล้ว' : 'Mark Delivered'}
                                    </button>
                                )}
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
                                    <select
                                        className="form-select"
                                        value={newOrder.patientId}
                                        onChange={e => setNewOrder({ ...newOrder, patientId: e.target.value })}
                                    >
                                        <option value="">{t('apt_select_patient')}</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
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
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '0.85rem 2rem', borderRadius: '16px', fontWeight: 600 }}>
                                {t('btn_cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={handleCreate} style={{ padding: '0.85rem 2.5rem', borderRadius: '16px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}>
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
