import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const InvoiceModal = ({ isOpen, onClose, onSave, initialPatientId = '', initialItems = [] }) => {
    const { t, language } = useLanguage();
    const { patients } = useData();

    // Default today
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
    const [items, setItems] = useState(initialItems.length > 0 ? initialItems : [{ id: 1, description: '', amount: 0, isSSO: false }]);
    const [useSSO, setUseSSO] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialPatientId) setSelectedPatientId(initialPatientId);
            if (initialItems.length > 0) {
                setItems(initialItems.map((item, idx) => ({
                    id: item.id || Date.now() + idx,
                    description: item.description || item.procedure,
                    amount: item.amount || item.price || 0,
                    isSSO: item.isSSO || false
                })));
            } else if (!initialPatientId) {
                // Reset if opening fresh from "New Invoice" button
                setItems([{ id: 1, description: '', amount: 0, isSSO: false }]);
                setSelectedPatientId('');
                setUseSSO(false);
            }
        }
    }, [isOpen, initialPatientId, initialItems]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), description: '', amount: 0, isSSO: useSSO }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const calculateTotal = () => {
        const total = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
        const ssoTotal = items.filter(i => i.isSSO).reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
        const patientTotal = total - ssoTotal;
        return { total, ssoTotal, patientTotal };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const patientName = patients.find(p => p.id === selectedPatientId)?.name || 'Unknown';
        const { total, ssoTotal, patientTotal } = calculateTotal();

        onSave({
            date,
            patientId: selectedPatientId,
            patientName,
            items,
            total,
            paidBySSO: ssoTotal,
            paidByPatient: patientTotal,
            status: 'Pending'
        });

        onClose();
        // Reset form
        setDate(new Date().toISOString().split('T')[0]);
        setSelectedPatientId('');
        setItems([{ id: 1, description: '', amount: 0, isSSO: false }]);
        setUseSSO(false);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '600px', padding: '0', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>{t('bill_modal_title')}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">{t('pat_col_patient')}</label>
                            <select
                                className="form-select"
                                required
                                value={selectedPatientId}
                                onChange={e => setSelectedPatientId(e.target.value)}
                            >
                                <option value="">{t('apt_select_patient')}</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">{t('bill_col_date')}</label>
                            <input
                                type="date"
                                className="form-input"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <input
                            type="checkbox"
                            checked={useSSO}
                            onChange={e => {
                                setUseSSO(e.target.checked);
                                setItems(items.map(i => ({ ...i, isSSO: e.target.checked })));
                            }}
                            id="useSSO"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="useSSO" style={{ cursor: 'pointer', fontWeight: 600, color: '#166534', userSelect: 'none' }}>
                            Enable Social Security (SSO) Coverage
                        </label>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label className="form-label">{t('bill_modal_items')}</label>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={addItem}>
                                <Plus size={14} style={{ marginRight: '4px' }} /> {t('bill_modal_add_item')}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {items.map((item, index) => (
                                <div key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Description"
                                        style={{ flex: 1 }}
                                        required
                                        value={item.description}
                                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Amount"
                                        style={{ width: '120px' }}
                                        required
                                        min="0"
                                        value={item.amount}
                                        onChange={e => updateItem(item.id, 'amount', e.target.value)}
                                    />
                                    {useSSO && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: item.isSSO ? '#166534' : '#6b7280' }}>
                                            <input
                                                type="checkbox"
                                                checked={item.isSSO || false}
                                                onChange={e => updateItem(item.id, 'isSSO', e.target.checked)}
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            SSO
                                        </div>
                                    )}
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(item.id)} style={{ padding: '0.5rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--neutral-100)', paddingTop: '1.5rem' }}>
                        <div style={{ marginRight: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                Total: ฿{calculateTotal().total.toLocaleString()}
                            </div>
                            {useSSO && (
                                <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                                    SSO Pays: ฿{calculateTotal().ssoTotal.toLocaleString()}
                                </div>
                            )}
                            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: useSSO ? '#1e40af' : 'inherit' }}>
                                Patient Pays: ฿{calculateTotal().patientTotal.toLocaleString()}
                            </div>
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('btn_cancel')}</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {t('bill_modal_create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoiceModal;
