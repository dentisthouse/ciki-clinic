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
        reorderPoint: 10,
        price: 0
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
                reorderPoint: 10,
                price: 0
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
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '600px' }}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-box" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', width: '40px', height: '40px' }}>
                            <Package size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--neutral-900)' }}>
                            {item ? t('inv_modal_edit') : t('inv_modal_add')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content - SCROLLABLE BODY */}
                <div className="modal-body" style={{ padding: '2rem' }}>
                    <form id="inv-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">{t('inv_form_name')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Item name..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
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
                            <div className="form-group">
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
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
                            <div className="form-group" style={{ marginBottom: 0 }}>
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

                        <div className="form-group">
                            <label className="form-label">{language === 'EN' ? 'Unit Price (THB)' : 'ราคาต่อหน่วย (บาท)'}</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                        </div>
                    </form>
                </div>

                {/* Modal Footer - FIXED AT BOTTOM */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        {t('btn_cancel')}
                    </button>
                    <button type="submit" form="inv-form" className="btn btn-primary">
                        <Save size={20} />
                        {t('inv_form_save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
