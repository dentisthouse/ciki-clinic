import React, { useState } from 'react';
import { Package, Search, Filter, AlertTriangle, Plus, ArrowDown, ArrowUp, TrendingUp, Trash2, Edit } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import InventoryModal from '../components/Inventory/InventoryModal';

const Inventory = () => {
    const { t } = useLanguage();
    const { inventory, addInventoryItem, updateInventoryStock, updateInventory, deleteInventoryItem } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleSaveItem = (itemData) => {
        if (itemData.id) {
            updateInventory(itemData.id, itemData);
        } else {
            addInventoryItem(itemData);
        }
    };

    const handleDeleteItem = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteInventoryItem(id);
        }
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleQuickStockCange = (e, id, amount) => {
        e.stopPropagation();
        updateInventoryStock(id, amount);
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Stock Value (Mock price per unit relative to stock)
    const stockValue = inventory.reduce((acc, item) => acc + (item.stock * 150), 0); // Assuming avg 150 THB per unit for display

    return (
        <div className="animate-slide-up">
            <InventoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                item={editingItem}
            />

            {/* Page Header */}
            <div className="page-header" style={{ marginBottom: '3rem' }}>
                <div className="page-title-group">
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
                        {t('inv_title')}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--neutral-500)', fontWeight: 500 }}>{t('inv_subtitle')}</p>
                </div>
                <button className="btn btn-primary" style={{ 
                    padding: '0.8rem 1.75rem', 
                    borderRadius: 'var(--radius-lg)', 
                    fontWeight: 800,
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-md)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }} onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                    <Plus size={20} />
                    {t('btn_add')}
                </button>
            </div>

            {/* Overview Grid */}
            <div className="grid-cols-3" style={{ marginBottom: '3rem', gap: '1.5rem' }}>
                <div className="card glass-panel-premium animate-slide-up delay-100" style={{ 
                    padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: 'var(--glass-premium-bg)', border: '1px solid var(--neutral-100)', borderRadius: 'var(--radius-xl)'
                }}>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', fontWeight: 700, marginBottom: '0.5rem' }}>{t('inv_total_items')}</p>
                        <h3 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>{inventory.length}</h3>
                    </div>
                    <div className="floating-icon" style={{ 
                        padding: '1rem', background: 'var(--primary-50)', color: 'var(--primary-600)', 
                        borderRadius: '18px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--primary-100)'
                    }}>
                        <Package size={28} />
                    </div>
                </div>
                <div className="card glass-panel-premium animate-slide-up delay-200" style={{ 
                    padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: 'var(--glass-premium-bg)', border: '1px solid var(--warning-100)', borderRadius: 'var(--radius-xl)'
                }}>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--warning-700)', fontWeight: 700, marginBottom: '0.5rem' }}>{t('inv_low_stock')}</p>
                        <h3 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--warning-600)', letterSpacing: '-0.02em' }}>
                            {inventory.filter(i => i.stock < i.reorderPoint).length}
                        </h3>
                    </div>
                    <div className="floating-icon" style={{ 
                        padding: '1rem', background: 'var(--warning-50)', color: 'var(--warning-600)', 
                        borderRadius: '18px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--warning-100)'
                    }}>
                        <AlertTriangle size={28} />
                    </div>
                </div>
                <div className="card glass-panel-premium animate-slide-up delay-300" style={{ 
                    padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: 'var(--glass-premium-bg)', border: '1px solid var(--success-100)', borderRadius: 'var(--radius-xl)'
                }}>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--success-700)', fontWeight: 700, marginBottom: '0.5rem' }}>{t('inv_stock_value')}</p>
                        <h3 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--success-600)', letterSpacing: '-0.02em' }}>฿{stockValue.toLocaleString()}</h3>
                    </div>
                    <div className="floating-icon" style={{ 
                        padding: '1rem', background: 'var(--success-50)', color: 'var(--success-600)', 
                        borderRadius: '18px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--success-100)'
                    }}>
                        <TrendingUp size={28} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={t('pat_search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Inventory Table */}
            <div className="table-container shadow-sm">
                <table>
                    <thead>
                        <tr>
                            <th>{t('inv_col_details')}</th>
                            <th>{t('inv_col_category')}</th>
                            <th>{t('inv_col_stock')}</th>
                            <th>{t('pat_col_status')}</th>
                            <th>{t('inv_last_restocked')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map((item) => {
                            const isLow = item.stock <= item.reorderPoint;
                            const isCritical = item.stock <= 5;
                            return (
                                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => handleEditItem(item)}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>ID: {item.id}</div>
                                    </td>
                                    <td>{item.category}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ fontWeight: 700, minWidth: '3rem', color: isCritical ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--neutral-900)' }}>
                                                {item.stock}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button className="btn btn-secondary" style={{ padding: '2px 6px', height: 'auto' }} onClick={(e) => handleQuickStockCange(e, item.id, -1)}><ArrowDown size={12} /></button>
                                                <button className="btn btn-secondary" style={{ padding: '2px 6px', height: 'auto' }} onClick={(e) => handleQuickStockCange(e, item.id, 1)}><ArrowUp size={12} /></button>
                                            </div>
                                            <span style={{ fontWeight: 400, color: 'var(--neutral-400)', fontSize: '0.875rem' }}>
                                                {item.unit === 'Vials' ? t('inv_unit_vials') :
                                                    item.unit === 'Boxes' ? t('inv_unit_boxes') :
                                                        item.unit === 'Syringes' ? t('inv_unit_syringes') :
                                                            item.unit === 'Kits' ? t('inv_unit_kits') : item.unit}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${isCritical ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'
                                            }`}>
                                            {isCritical ? t('inv_status_critical') : isLow ? t('inv_status_low') : t('inv_status_in')}
                                        </span>
                                    </td>
                                    <td>{item.lastRestocked || '-'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--danger)' }} onClick={(e) => handleDeleteItem(e, item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;
