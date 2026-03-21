import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import {
    Plus, Trash2, Edit3, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
    DollarSign, Building2, Zap, Package, Users, MoreHorizontal, X, Check,
    PieChart, BarChart3, Filter
} from 'lucide-react';

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
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                    💰 {isTH ? 'รายจ่าย' : 'Expenses'}
                </h1>
                <button className="btn btn-primary" onClick={() => openForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Plus size={18} /> {isTH ? 'เพิ่มรายจ่าย' : 'Add Expense'}
                </button>
            </div>

            {/* Month selector */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => goMonth(-1)} className="btn btn-secondary" style={{ padding: '0.35rem' }}><ChevronLeft size={20} /></button>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, minWidth: '200px', textAlign: 'center', margin: 0 }}>📅 {monthLabel}</h2>
                <button onClick={() => goMonth(1)} className="btn btn-secondary" style={{ padding: '0.35rem' }}><ChevronRight size={20} /></button>
            </div>

            {/* P&L Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '0.25rem' }}>{isTH ? 'รายรับ' : 'Revenue'}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>{formatCurrency(monthRevenue)}</div>
                    <TrendingUp size={16} color="#22c55e" style={{ marginTop: '0.25rem' }} />
                </div>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '0.25rem' }}>{isTH ? 'รายจ่าย' : 'Expenses'}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{formatCurrency(totalExpenses)}</div>
                    <TrendingDown size={16} color="#ef4444" style={{ marginTop: '0.25rem' }} />
                </div>
                <div className="card" style={{ padding: '1rem', textAlign: 'center', background: profit >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${profit >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '0.25rem' }}>{isTH ? 'กำไร/ขาดทุน' : 'Profit/Loss'}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{profit >= 0 ? '+' : ''}{formatCurrency(profit)}</div>
                    <DollarSign size={16} color={profit >= 0 ? '#16a34a' : '#dc2626'} style={{ marginTop: '0.25rem' }} />
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {catBreakdown.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                            {isTH ? 'ไม่มีรายจ่ายเดือนนี้' : 'No expenses this month'}
                        </div>
                    ) : catBreakdown.map(cat => {
                        const pct = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : 0;
                        return (
                            <div key={cat.key} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '12px', background: cat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{cat.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{isTH ? cat.label_TH : cat.label_EN}</span>
                                        <span style={{ fontWeight: 700, color: cat.color }}>{formatCurrency(cat.total)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--neutral-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: '3px', transition: 'width 0.4s' }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: '0.15rem' }}>{pct}%</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* LIST TAB */}
            {activeTab === 'list' && (
                <div>
                    {/* Category filter */}
                    <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                        <button onClick={() => setFilterCat('all')} style={{ padding: '0.35rem 0.75rem', border: '1px solid', borderColor: filterCat === 'all' ? 'var(--primary-400)' : 'var(--neutral-200)', borderRadius: '20px', background: filterCat === 'all' ? 'var(--primary-50)' : 'white', color: filterCat === 'all' ? 'var(--primary-600)' : 'var(--neutral-500)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {isTH ? 'ทั้งหมด' : 'All'}
                        </button>
                        {CATEGORIES.map(c => (
                            <button key={c.key} onClick={() => setFilterCat(c.key)} style={{ padding: '0.35rem 0.65rem', border: '1px solid', borderColor: filterCat === c.key ? c.color : 'var(--neutral-200)', borderRadius: '20px', background: filterCat === c.key ? c.color + '15' : 'white', color: filterCat === c.key ? c.color : 'var(--neutral-500)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {c.icon} {isTH ? c.label_TH : c.label_EN}
                            </button>
                        ))}
                    </div>

                    {/* Expense list */}
                    {filteredExpenses.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-400)' }}>
                            <DollarSign size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            {isTH ? 'ไม่มีรายจ่าย' : 'No expenses'}
                            <br />
                            <button className="btn btn-primary" onClick={() => openForm()} style={{ marginTop: '1rem' }}>
                                <Plus size={16} /> {isTH ? 'เพิ่มรายจ่าย' : 'Add Expense'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredExpenses.map(exp => {
                                const cat = getCat(exp.category);
                                return (
                                    <div key={exp.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: cat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{cat.icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exp.description || (isTH ? cat.label_TH : cat.label_EN)}</span>
                                                <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>-{formatCurrency(exp.amount)}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: '0.15rem' }}>
                                                <span style={{ padding: '1px 6px', background: cat.color + '15', color: cat.color, borderRadius: '4px', fontWeight: 600 }}>{isTH ? cat.label_TH : cat.label_EN}</span>
                                                <span>{new Date(exp.date).toLocaleDateString(isTH ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                                {exp.recurring && <span>🔄</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button onClick={() => openForm(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', padding: '0.25rem' }}><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}><Trash2 size={16} /></button>
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
