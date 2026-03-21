import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Plus, Clock, ChevronRight } from 'lucide-react';
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--neutral-900)' }}>Lab Tracking</h1>
                    <p style={{ color: 'var(--neutral-500)' }}>Manage external lab orders and status</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} style={{ marginRight: '8px' }} /> New Order
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
                    <div className="modal-content" style={{ width: '400px' }}>
                        <h2>New Lab Order</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label>Patient</label>
                                <select
                                    className="input-field"
                                    value={newOrder.patientId}
                                    onChange={e => setNewOrder({ ...newOrder, patientId: e.target.value })}
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Lab Name</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Hexa Ceram"
                                    value={newOrder.lab}
                                    onChange={e => setNewOrder({ ...newOrder, lab: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Appliance Type (Ortho)</label>
                                <select
                                    className="input-field"
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
                            <div>
                                <label>Work Type</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Zirconia Crown #16"
                                    value={newOrder.work}
                                    onChange={e => setNewOrder({ ...newOrder, work: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={newOrder.due}
                                    onChange={e => setNewOrder({ ...newOrder, due: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn btn-primary" onClick={handleCreate} style={{ flex: 1 }}>Create</button>
                                <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTracking;
