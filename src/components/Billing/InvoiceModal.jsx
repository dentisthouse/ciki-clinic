import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ShoppingBag, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const InvoiceModal = ({ isOpen, onClose, onSave, initialPatientId = '', initialItems = [] }) => {
    const { t, language } = useLanguage();
    const { patients, inventory, updateInventory } = useData();
    const [showInventory, setShowInventory] = useState(false);

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

        // Deduct Inventory Stock
        items.forEach(item => {
            if (item.inventoryId) {
                const stockItem = inventory.find(i => i.id === item.inventoryId);
                if (stockItem) {
                    updateInventory(item.inventoryId, { ...stockItem, stock: Math.max(0, stockItem.stock - 1) });
                }
            }
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
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '750px' }}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-box" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', width: '40px', height: '40px' }}>
                            <Save size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--neutral-900)' }}>{t('bill_modal_title')}</h2>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content - SCROLLABLE BODY */}
                <div className="modal-body" style={{ padding: '2rem' }}>
                    <form id="invoice-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
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
                            <div className="form-group">
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

                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1.25rem', 
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                            padding: '1.5rem', 
                            borderRadius: '20px', 
                            border: '1px solid #bbf7d0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={useSSO}
                                    onChange={e => {
                                        setUseSSO(e.target.checked);
                                        setItems(items.map(i => ({ ...i, isSSO: e.target.checked })));
                                    }}
                                    id="useSSO"
                                    style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        cursor: 'pointer',
                                        accentColor: '#16a34a'
                                    }}
                                />
                            </div>
                            <div>
                                <label htmlFor="useSSO" style={{ cursor: 'pointer', fontWeight: 800, color: '#166534', userSelect: 'none', display: 'block', fontSize: '1rem' }}>
                                    {t('bill_sso_enable')}
                                </label>
                                <span style={{ fontSize: '0.85rem', color: '#15803d', opacity: 0.8 }}>{t('bill_sso_help')}</span>
                            </div>
                        </div>

                        <div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <label className="form-label" style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{t('bill_modal_items')}</label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }} onClick={() => setShowInventory(true)}>
                                        <ShoppingBag size={14} style={{ marginRight: '6px' }} /> {language === 'TH' ? 'เลือกสินค้าจากคลัง' : 'Product Stock'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }} onClick={addItem}>
                                        <Plus size={14} style={{ marginRight: '6px' }} /> {t('bill_modal_add_item')}
                                    </button>
                                </div>
                            </div>

                            {/* Inventory Quick Picker Overlay */}
                            {showInventory && (
                                <div style={{ 
                                    padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', marginBottom: '1.5rem', 
                                    border: '2px solid #e2e8f0', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)' 
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Package size={18} /> {language === 'TH' ? 'สินค้าพร้อมขาย' : 'Retail Products'}
                                        </div>
                                        <button type="button" onClick={() => setShowInventory(false)} style={{ border: 'none', background: 'transparent', color: 'var(--neutral-400)', cursor: 'pointer' }}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        {inventory.filter(item => item.stock > 0).map(item => (
                                            <div key={item.id} 
                                                onClick={() => {
                                                    const newItem = { id: Date.now(), description: item.name, amount: item.price || 0, isSSO: false, inventoryId: item.id };
                                                    setItems(items[0].description === '' ? [newItem] : [...items, newItem]);
                                                    setShowInventory(false);
                                                }}
                                                style={{ 
                                                    padding: '0.75rem 1rem', background: 'white', borderRadius: '16px', border: '1.5px solid #edf2f7', 
                                                    cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between' 
                                                }}
                                                className="hover:border-primary-500 hover:shadow-sm"
                                            >
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</span>
                                                <span style={{ color: 'var(--primary-700)', fontWeight: 800 }}>฿{item.price || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {items.map((item, index) => (
                                    <div key={item.id} style={{ 
                                        display: 'flex', 
                                        gap: '1rem', 
                                        alignItems: 'center', 
                                        padding: '1.25rem', 
                                        background: 'var(--neutral-50)', 
                                        borderRadius: '20px', 
                                        border: '1px solid var(--neutral-100)',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder={language === 'TH' ? "ระบุหัตถการ (เช่น ขูดหินปูน)" : "Procedural description (e.g. Scaling & Polishing)"}
                                                style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '1.05rem', fontWeight: 700, boxShadow: 'none' }}
                                                required
                                                value={item.description}
                                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ width: '150px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', fontWeight: 600 }}>฿</div>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="0.00"
                                                style={{ textAlign: 'right', paddingLeft: '2rem', border: '1.5px solid var(--neutral-200)', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem' }}
                                                required
                                                min="0"
                                                value={item.amount}
                                                onChange={e => updateItem(item.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        {useSSO && (
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 800,
                                                color: item.isSSO ? '#166534' : '#94a3b8', 
                                                background: item.isSSO ? '#dcfce7' : 'var(--neutral-100)', 
                                                padding: '0.5rem 0.85rem', 
                                                borderRadius: '10px', 
                                                border: item.isSSO ? '1px solid #86efac' : '1px solid var(--neutral-200)',
                                                cursor: 'pointer',
                                                userSelect: 'none'
                                            }} onClick={() => updateItem(item.id, 'isSSO', !item.isSSO)}>
                                                <input
                                                    type="checkbox"
                                                    checked={item.isSSO || false}
                                                    onChange={e => updateItem(item.id, 'isSSO', e.target.checked)}
                                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#16a34a' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                SSO
                                            </div>
                                        )}
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(item.id)} className="modal-close" style={{ color: 'var(--danger)', background: 'white', width: '36px', height: '36px' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer - FIXED AT BOTTOM */}
                <div className="modal-footer">
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '0.25rem' }}>
                            {t('bill_subtotal')}: ฿{calculateTotal().total.toLocaleString()}
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '1.75rem', color: 'var(--neutral-900)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{t('bill_net')}: </span>
                            ฿{calculateTotal().patientTotal.toLocaleString()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', borderRadius: '16px', fontWeight: 600 }} onClick={onClose}>
                            {t('btn_cancel')}
                        </button>
                        <button type="submit" form="invoice-form" className="btn btn-primary" style={{ padding: '0.85rem 3rem', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)' }}>
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {t('bill_modal_create')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
