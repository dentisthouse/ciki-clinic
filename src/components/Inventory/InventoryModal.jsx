import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const InventoryModal = ({ isOpen, onClose, onSave, item }) => {
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        category: 'Consumables',
        stock: 0,
        unit: 'Boxes',
        reorderPoint: 10
    });

    useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData({
                name: '',
                category: 'Consumables',
                stock: 0,
                unit: 'Boxes',
                reorderPoint: 10
            });
        }
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
        onClose();
    };

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
            <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>{item ? t('inv_modal_edit') : t('inv_modal_add')}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="form-label">{t('inv_form_name')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">{t('inv_col_category')}</label>
                            <select
                                className="form-select"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Medication">Medication</option>
                                <option value="Consumables">Consumables</option>
                                <option value="Restorative">Restorative</option>
                                <option value="Prosthodontics">Prosthodontics</option>
                                <option value="Instruments">Instruments</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">{t('inv_form_unit')}</label>
                            <select
                                className="form-select"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="Boxes">{t('inv_unit_boxes')}</option>
                                <option value="Vials">{t('inv_unit_vials')}</option>
                                <option value="Pieces">Pieces</option>
                                <option value="Syringes">{t('inv_unit_syringes')}</option>
                                <option value="Kits">{t('inv_unit_kits')}</option>
                                <option value="Bottles">Bottles</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">{t('inv_form_stock')}</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">{t('inv_form_reorder')}</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.reorderPoint}
                                onChange={e => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('btn_cancel')}</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {t('inv_form_save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryModal;
