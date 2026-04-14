import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import {
    Plus, Trash2, Edit3, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
    DollarSign, Building2, Zap, Package, Users, MoreHorizontal, X, Check,
    PieChart, BarChart3, Filter
} from 'lucide-react';
import '../styles/expenses.css';

const CATEGORIES = [
    { key: 'rent', icon: '🏠', color: '#6366f1', label_TH: 'ค่าเช่า', label_EN: 'Rent' },
    { key: 'utilities', icon: '⚡', color: '#f59e0b', label_TH: 'ค่าสาธารณูปโภค', label_EN: 'Utilities' },
    { key: 'supplies', icon: '📦', color: '#22c55e', label_TH: 'ค่าวัสดุ', label_EN: 'Supplies' },
    { key: 'salary', icon: '👥', color: '#3b82f6', label_TH: 'เงินเดือน', label_EN: 'Salary' },
    { key: 'equipment', icon: '🔧', color: '#8b5cf6', label_TH: 'อุปกรณ์', label_EN: 'Equipment' },
    { key: 'marketing', icon: '📣', color: '#ec4899', label_TH: 'การตลาด', label_EN: 'Marketing' },
    { key: 'insurance', icon: '🛡️', color: '#14b8a6', label_TH: 'ประกัน', label_EN: 'Insurance' },
    { key: 'other', icon: '📋', color: '#6b7280', label_TH: 'อื่นๆ', label_EN: 'Other' },
];

const getCat = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];

const formatCurrency = (amount) => `฿${Number(amount || 0).toLocaleString()}`;

const Expenses = () => {
    const { language } = useLanguage();
    const isTH = language === 'TH';
    const { invoices, expenses, addExpense, updateExpense, deleteExpense } = useData();

    const [activeTab, setActiveTab] = useState('list'); // list, summary
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterCat, setFilterCat] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Form state
    const [form, setForm] = useState({ category: 'supplies', amount: '', description: '', date: new Date().toISOString().split('T')[0], recurring: false });

    const goMonth = (d) => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const dt = new Date(y, m - 1 + d, 1);
        setSelectedMonth(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
    };

    const monthLabel = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString(isTH ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' });
    }, [selectedMonth, isTH]);

    // Filter expenses for selected month
    const monthExpenses = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return (expenses || []).filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === y && d.getMonth() + 1 === m;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, selectedMonth]);

    const filteredExpenses = filterCat === 'all' ? monthExpenses : monthExpenses.filter(e => e.category === filterCat);

    // Revenue from invoices for the same month
    const monthRevenue = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return (invoices || []).filter(inv => {
            const d = new Date(inv.date);
            return d.getFullYear() === y && d.getMonth() + 1 === m && inv.status === 'Paid';
        }).reduce((sum, inv) => sum + (inv.amount || 0), 0);
    }, [invoices, selectedMonth]);

    const totalExpenses = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = monthRevenue - totalExpenses;

    // Category breakdown
    const catBreakdown = useMemo(() => {
        const map = {};
        CATEGORIES.forEach(c => { map[c.key] = 0; });
        monthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + (e.amount || 0); });
        return CATEGORIES.map(c => ({ ...c, total: map[c.key] })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
    }, [monthExpenses]);

    const openForm = (expense = null) => {
        if (expense) {
            setForm({ category: expense.category, amount: expense.amount, description: expense.description || '', date: expense.date, recurring: expense.recurring || false });
            setEditingId(expense.id);
        } else {
            setForm({ category: 'supplies', amount: '', description: '', date: new Date().toISOString().split('T')[0], recurring: false });
            setEditingId(null);
        }
        setShowForm(true);
    };

    const handleSave = () => {
        if (!form.amount || Number(form.amount) <= 0) return alert(isTH ? 'กรุณาใส่จำนวนเงิน' : 'Enter amount');
        if (editingId) {
            updateExpense(editingId, { ...form, amount: Number(form.amount) });
        } else {
            addExpense({ ...form, amount: Number(form.amount) });
        }
        setShowForm(false);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (confirm(isTH ? 'ลบรายการนี้?' : 'Delete this expense?')) deleteExpense(id);
    };

    return (
        <div className="expenses-container animate-fade-in">
            {/* Header */}
            <div className="expenses-header">
                <div className="expenses-title-group">
                    <h1>
                        <div className="expenses-icon-box">
                            <DollarSign size={24} />
                        </div>
                        {isTH ? 'รายการรายจ่าย' : 'Clinic Expenses'}
                    </h1>
                </div>
                <button className="btn-billing primary" onClick={() => openForm()} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}>
                    <Plus size={18} /> {isTH ? 'เพิ่มรายจ่าย' : 'Add Expense'}
                </button>
            </div>

            {/* Month selector */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <button onClick={() => goMonth(-1)} className="btn-billing secondary" style={{ padding: '0.4rem', border: 'none' }}><ChevronLeft size={20} /></button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, minWidth: '220px', textAlign: 'center', margin: 0, color: 'var(--neutral-900)' }}>{monthLabel}</h2>
                <button onClick={() => goMonth(1)} className="btn-billing secondary" style={{ padding: '0.4rem', border: 'none' }}><ChevronRight size={20} /></button>
            </div>

            {/* P&L Cards */}
            <div className="pl-stats-grid">
                <div className="pl-stat-card">
                    <span className="pl-label">{isTH ? 'รายรับ' : 'Revenue'}</span>
                    <span className="pl-value" style={{ color: '#059669' }}>{formatCurrency(monthRevenue)}</span>
                    <div className="pl-trend-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <TrendingUp size={16} />
                    </div>
                </div>
                <div className="pl-stat-card">
                    <span className="pl-label">{isTH ? 'รายจ่าย' : 'Expense'}</span>
                    <span className="pl-value" style={{ color: '#dc2626' }}>{formatCurrency(totalExpenses)}</span>
                    <div className="pl-trend-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                        <TrendingDown size={16} />
                    </div>
                </div>
                <div className={`pl-stat-card ${profit >= 0 ? 'profit' : 'loss'}`}>
                    <span className="pl-label">{isTH ? 'กำไร/ขาดทุน' : 'Profit/Loss'}</span>
                    <span className="pl-value" style={{ color: profit >= 0 ? '#059669' : '#dc2626' }}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                    </span>
                    <div className="pl-trend-icon" style={{ background: profit >= 0 ? '#d1fae5' : '#fee2e2', color: profit >= 0 ? '#059669' : '#dc2626' }}>
                        <DollarSign size={16} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--neutral-100)', padding: '4px', borderRadius: '12px' }}>
                {[
                    { key: 'list', icon: <BarChart3 size={15} />, label: isTH ? 'รายการ' : 'List' },
                    { key: 'summary', icon: <PieChart size={15} />, label: isTH ? 'สรุปหมวด' : 'By Category' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{ flex: 1, padding: '0.55rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: activeTab === tab.key ? 'white' : 'transparent', color: activeTab === tab.key ? 'var(--primary-600)' : 'var(--neutral-500)', boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* CATEGORY SUMMARY TAB */}
            {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {catBreakdown.length === 0 ? (
                        <div className="labs-empty-state">
                            <PieChart size={40} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                            <h3>{isTH ? 'ไม่มีบันทึกรายจ่าย' : 'No expenses recorded'}</h3>
                            <p>{isTH ? 'ประวัติรายจ่ายตามหมวดหมู่จะปรากฏที่นี่' : 'Category breakdown will appear here.'}</p>
                        </div>
                    ) : catBreakdown.map(cat => {
                        const pct = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : 0;
                        return (
                            <div key={cat.key} className="cat-breakdown-card">
                                <div className="expense-cat-icon" style={{ background: cat.color + '15' }}>{cat.icon}</div>
                                <div className="breakdown-progress-container">
                                    <div className="breakdown-label-row">
                                        <span style={{ fontWeight: 900, color: 'var(--neutral-900)' }}>{isTH ? cat.label_TH : cat.label_EN}</span>
                                        <span style={{ fontWeight: 950, color: cat.color }}>{formatCurrency(cat.total)}</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: cat.color }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* LIST TAB */}
            {activeTab === 'list' && (
                <div>
                    {/* Category filter rail */}
                    <div className="category-filter-rail">
                        <button 
                            onClick={() => setFilterCat('all')} 
                            className={`cat-filter-btn ${filterCat === 'all' ? 'active' : ''}`}
                        >
                            {isTH ? 'ทั้งหมด' : 'All'}
                        </button>
                        {CATEGORIES.map(c => (
                            <button 
                                key={c.key} 
                                onClick={() => setFilterCat(c.key)} 
                                className={`cat-filter-btn ${filterCat === c.key ? 'active' : ''}`}
                                style={filterCat === c.key ? { borderColor: c.color, color: c.color, background: c.color + '10' } : {}}
                            >
                                {c.icon} {isTH ? c.label_TH : c.label_EN}
                            </button>
                        ))}
                    </div>

                    {/* Expense list */}
                    {filteredExpenses.length === 0 ? (
                        <div className="labs-empty-state">
                            <DollarSign size={40} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                            <h3>{isTH ? 'ไม่พบรายการรายจ่าย' : 'No expenses found'}</h3>
                            <button className="btn-billing primary" onClick={() => openForm()} style={{ marginTop: '1rem', background: '#f59e0b', border: 'none' }}>
                                <Plus size={16} /> {isTH ? 'เพิ่มรายการใหม่' : 'Add First Expense'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredExpenses.map(exp => {
                                const cat = getCat(exp.category);
                                return (
                                    <div key={exp.id} className="expense-item-card">
                                        <div className="expense-cat-icon" style={{ background: cat.color + '15' }}>{cat.icon}</div>
                                        <div className="expense-main-info">
                                            <div className="expense-header-row">
                                                <span className="expense-desc">{exp.description || (isTH ? cat.label_TH : cat.label_EN)}</span>
                                                <span className="expense-amount">-{formatCurrency(exp.amount)}</span>
                                            </div>
                                            <div className="expense-meta">
                                                <span className="expense-tag" style={{ background: cat.color + '15', color: cat.color }}>
                                                    {isTH ? cat.label_TH : cat.label_EN}
                                                </span>
                                                <span className="expense-date">
                                                    {new Date(exp.date).toLocaleDateString(isTH ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                {exp.recurring && <span title="Recurring">🔄</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button 
                                                className="btn-adj"
                                                onClick={() => openForm(exp)} 
                                                style={{ padding: '8px' }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                className="btn-adj"
                                                onClick={() => handleDelete(exp.id)} 
                                                style={{ color: '#ef4444', padding: '8px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ADD/EDIT FORM MODAL */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowForm(false)}>
                    <div className="card animate-fade-in" style={{ padding: '1.5rem', maxWidth: '450px', width: '100%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 700 }}>{editingId ? (isTH ? '✏️ แก้ไข' : '✏️ Edit') : (isTH ? '➕ เพิ่มรายจ่าย' : '➕ New Expense')}</h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}><X size={20} /></button>
                        </div>

                        {/* Category buttons */}
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.5rem', display: 'block' }}>{isTH ? 'หมวดหมู่' : 'Category'}</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginBottom: '1rem' }}>
                            {CATEGORIES.map(c => (
                                <button key={c.key} onClick={() => setForm(f => ({ ...f, category: c.key }))} style={{ padding: '0.5rem 0.25rem', border: '2px solid', borderColor: form.category === c.key ? c.color : 'var(--neutral-200)', borderRadius: '8px', background: form.category === c.key ? c.color + '15' : 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, color: form.category === c.key ? c.color : 'var(--neutral-500)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                                    {isTH ? c.label_TH : c.label_EN}
                                </button>
                            ))}
                        </div>

                        {/* Amount */}
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', display: 'block' }}>{isTH ? 'จำนวนเงิน (บาท)' : 'Amount (THB)'}</label>
                        <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" autoFocus
                            style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--neutral-200)', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', boxSizing: 'border-box' }} />

                        {/* Description */}
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', display: 'block' }}>{isTH ? 'รายละเอียด' : 'Description'}</label>
                        <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={isTH ? 'เช่น ค่าไฟเดือน ก.พ.' : 'e.g. Feb electricity bill'}
                            style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--neutral-200)', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }} />

                        {/* Date */}
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', display: 'block' }}>{isTH ? 'วันที่' : 'Date'}</label>
                        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--neutral-200)', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }} />

                        {/* Recurring toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                            <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} />
                            🔄 {isTH ? 'รายจ่ายประจำ (ทุกเดือน)' : 'Recurring (monthly)'}
                        </label>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1 }}>{isTH ? 'ยกเลิก' : 'Cancel'}</button>
                            <button className="btn btn-primary" onClick={handleSave} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                <Check size={18} /> {editingId ? (isTH ? 'บันทึก' : 'Save') : (isTH ? 'เพิ่ม' : 'Add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
