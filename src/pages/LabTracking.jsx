import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Plus, Clock, ChevronRight, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const LabTracking = () => {
    const { labOrders, patients, updateLabOrder, addLabOrder } = useData(); // Assuming these exist or will be added
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOrder, setNewOrder] = useState({ patientId: '', lab: '', appliance: '', work: '', due: '' });

    // Mock data if context doesn't have it yet (will update context next)
    const orders = labOrders || [];

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
                        Lab Tracking
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem', margin: '0.25rem 0 0', fontWeight: 500 }}>
                        Manage external lab orders and real-time status
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: 800, fontSize: '0.875rem' }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> New Order
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {orders.map(order => {
                    const statusStyle = getStatusColor(order.status);
                    const StatusIcon = statusStyle.icon;
                    return (
                        <div key={order.id} className="card" style={{ padding: '1.5rem', borderTop: `4px solid ${statusStyle.text}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                    {order.appliance && <span style={{ color: 'var(--primary-600)', marginRight: '8px' }}>[{order.appliance}]</span>}
                                    {order.work}
                                </span>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '6px',
                                    background: statusStyle.bg, color: statusStyle.text,
                                    fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    <StatusIcon size={14} /> {order.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Patient:</span>
                                    <span style={{ fontWeight: 500, color: 'var(--neutral-900)' }}>{order.patientName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Lab:</span>
                                    <span>{order.lab}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Due Date:</span>
                                    <span style={{ color: '#d97706', fontWeight: 600 }}>{order.due}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'flex-end' }}>
                                {order.status === 'Sent' && (
                                    <button className="btn btn-secondary" onClick={() => updateLabOrder(order.id, { status: 'Received' })}>
                                        Mark Received
                                    </button>
                                )}
                                {order.status === 'Received' && (
                                    <button className="btn btn-primary" onClick={() => updateLabOrder(order.id, { status: 'Delivered' })}>
                                        Mark Delivered
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
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>New Lab Order</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Patient</label>
                                    <select
                                        className="form-select"
                                        value={newOrder.patientId}
                                        onChange={e => setNewOrder({ ...newOrder, patientId: e.target.value })}
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Lab Name</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Hexa Ceram"
                                        value={newOrder.lab}
                                        onChange={e => setNewOrder({ ...newOrder.lab, lab: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Appliance Type (Ortho)</label>
                                        <select
                                            className="form-select"
                                            value={newOrder.appliance}
                                            onChange={e => setNewOrder({ ...newOrder, appliance: e.target.value })}
                                        >
                                            <option value="">-- None / General --</option>
                                            <option value="Retainer">Retainer</option>
                                            <option value="Aligner">Clear Aligner</option>
                                            <option value="RPE">RPE Expander</option>
                                            <option value="Space Maintainer">Space Maintainer</option>
                                            <option value="Functional">Functional Appliance</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={newOrder.due}
                                            onChange={e => setNewOrder({ ...newOrder, due: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Work Type</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Zirconia Crown #16"
                                        value={newOrder.work}
                                        onChange={e => setNewOrder({ ...newOrder, work: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '0.85rem 2rem', borderRadius: '16px', fontWeight: 600 }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleCreate} style={{ padding: '0.85rem 2.5rem', borderRadius: '16px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}>
                                Create Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTracking;
