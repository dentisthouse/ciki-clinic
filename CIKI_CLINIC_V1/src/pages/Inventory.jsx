import React, { useState } from 'react';
import { Package, Search, Filter, AlertTriangle, Plus, ArrowDown, ArrowUp, TrendingUp, Trash2, Edit, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import InventoryModal from '../components/Inventory/InventoryModal';
import '../styles/inventory.css';

const Inventory = () => {
    const { language, t } = useLanguage();
    const langT = (th, en) => (language === 'TH' ? th : en);
    const { inventory, addInventoryItem, bulkAddInventoryItems, updateInventoryStock, updateInventory, deleteInventoryItem } = useData();
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

    const handleLoadStandardInventory = () => {
        if (window.confirm(language === 'TH' ? 'ต้องการโหลดข้อมูลคลังยามาตรฐานหรือไม่?' : 'Load standard dental inventory?')) {
            const standardInventory = [
                { id: 'INV-001', name: 'Lidocaine 2% with Epinephrine', category: 'Anesthetic', stock: 50, unit: 'Vials', reorderPoint: 10, price: 85, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-002', name: 'Articaine 4%', category: 'Anesthetic', stock: 30, unit: 'Vials', reorderPoint: 5, price: 120, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-003', name: 'Composite Resin A2', category: 'Materials', stock: 12, unit: 'Syringes', reorderPoint: 3, price: 1200, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-004', name: 'Composite Resin A3', category: 'Materials', stock: 15, unit: 'Syringes', reorderPoint: 3, price: 1200, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-005', name: 'Bonding Agent (5ml)', category: 'Materials', stock: 5, unit: 'Bottle', reorderPoint: 2, price: 2500, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-006', name: 'Examination Gloves (Medium)', category: 'Disposables', stock: 25, unit: 'Boxes', reorderPoint: 5, price: 180, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-007', name: 'Examination Gloves (Small)', category: 'Disposables', stock: 20, unit: 'Boxes', reorderPoint: 5, price: 180, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-008', name: 'Dental Face Masks', category: 'Disposables', stock: 40, unit: 'Boxes', reorderPoint: 10, price: 120, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-009', name: 'Saliva Ejectors (100pc)', category: 'Disposables', stock: 15, unit: 'Bags', reorderPoint: 5, price: 150, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-010', name: 'Gauze Pads 2x2', category: 'Disposables', stock: 30, unit: 'Bags', reorderPoint: 10, price: 65, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-011', name: 'Suture Silk 3-0', category: 'Surgical', stock: 12, unit: 'Kits', reorderPoint: 4, price: 850, lastRestocked: new Date().toLocaleDateString() },
                { id: 'INV-012', name: 'Fluoride Varnish', category: 'Preventive', stock: 10, unit: 'Kits', reorderPoint: 3, price: 2800, lastRestocked: new Date().toLocaleDateString() }
            ];

            // Use bulk add to avoid race conditions
            bulkAddInventoryItems(standardInventory);
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Stock Value (Real data)
    const stockValue = inventory.reduce((acc, item) => acc + (item.stock * (item.price || 0)), 0); 

    return (
        <div className="inventory-container animate-slide-up">
            <InventoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                item={editingItem}
            />

            {/* Page Header */}
            <div className="inventory-header">
                <div className="inventory-title-group">
                    <h1>
                        <div className="inventory-icon-box">
                            <Package size={24} />
                        </div>
                        {t('inv_title')}
                    </h1>
                    <p>{t('inv_subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                        className="btn btn-secondary"
                        onClick={handleLoadStandardInventory}
                        style={{ background: 'var(--success-50)', color: 'var(--success-700)', borderColor: 'var(--success-200)' }}
                    >
                        <TrendingUp size={20} />
                        {langT('โหลดคลังมาตรฐาน', 'Load Standard Stock')}
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    >
                        <Plus size={20} strokeWidth={3} />
                        {t('btn_add')}
                    </button>
                </div>
            </div>

            {/* Overview Grid */}
            <div className="inventory-stats-grid">
                {[
                    { label: t('inv_total_items'), value: inventory.length, icon: Package, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
                    { label: t('inv_low_stock'), value: inventory.filter(i => i.stock < i.reorderPoint).length, icon: AlertTriangle, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
                    { label: t('inv_stock_value'), value: `฿${stockValue.toLocaleString()}`, icon: TrendingUp, color: 'var(--success-600)', bg: 'var(--success-50)' },
                ].map((stat, i) => (
                    <div key={i} className="inventory-stat-card">
                        <div className="inventory-stat-icon" style={{ background: stat.bg, color: stat.color }}>
                            <stat.icon size={22} />
                        </div>
                        <div className="inventory-stat-info">
                            <div className="value">{stat.value}</div>
                            <div className="label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="inventory-controls">
                <div className="inventory-search-bar">
                    <Search size={18} color="var(--neutral-400)" />
                    <input
                        type="text"
                        placeholder={t('pat_search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon-square" title="Filter Settings">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="inventory-table-card">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>{t('inv_col_details')}</th>
                            <th>{t('inv_col_category')}</th>
                            <th>{t('inv_col_stock')}</th>
                            <th>{t('pat_col_status')}</th>
                            <th>{t('inv_last_restocked')}</th>
                            <th style={{ textAlign: 'right' }}>{langT('จัดการ', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map((item) => {
                            const isLow = item.stock <= item.reorderPoint;
                            const isCritical = item.stock <= 5;
                            return (
                                <tr key={item.id} onClick={() => handleEditItem(item)}>
                                    <td>
                                        <div className="item-main-info">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-id">{item.id}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--neutral-600)' }}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="stock-control-group">
                                            <div className="stock-value" style={{ color: isCritical ? 'var(--danger-600)' : isLow ? 'var(--warning-600)' : 'var(--neutral-900)' }}>
                                                {item.stock}
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="stock-adj-btn minus" title="Decrease Stock" onClick={(e) => handleQuickStockCange(e, item.id, -1)}>
                                                    <ArrowDown size={14} />
                                                </button>
                                                <button className="stock-adj-btn plus" title="Increase Stock" onClick={(e) => handleQuickStockCange(e, item.id, 1)}>
                                                    <ArrowUp size={14} />
                                                </button>
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--neutral-400)', fontSize: '0.8rem' }}>
                                                {item.unit === 'Vials' ? t('inv_unit_vials') :
                                                    item.unit === 'Boxes' ? t('inv_unit_boxes') :
                                                        item.unit === 'Syringes' ? t('inv_unit_syringes') :
                                                            item.unit === 'Kits' ? t('inv_unit_kits') : item.unit}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`stock-badge ${isCritical ? 'stock-status-critical' : isLow ? 'stock-status-low' : 'stock-status-ok'}`}>
                                            {isCritical ? t('inv_status_critical') : isLow ? t('inv_status_low') : t('inv_status_in')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neutral-500)', fontWeight: 500 }}>
                                            <Clock size={14} />
                                            {item.lastRestocked || '-'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button className="btn-icon-square" onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn-icon-square" style={{ color: 'var(--danger-500)' }} onClick={(e) => handleDeleteItem(e, item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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
