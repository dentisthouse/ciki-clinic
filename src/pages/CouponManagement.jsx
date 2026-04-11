import React, { useState } from 'react';
import {
    Ticket, Plus, Search, Tag, Percent, DollarSign, Calendar,
    Users, BarChart3, Clock, Trash2, Edit2, Copy, Eye,
    CheckCircle, XCircle, AlertTriangle, Gift, Zap, TrendingUp,
    Filter, Download, Shield, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/coupons.css';

const CouponManagement = () => {
    const { language, t } = useLanguage();
    const [activeTab, setActiveTab] = useState('coupons');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const langT = (th, en) => (language === 'TH' ? th : en);

    const [coupons, setCoupons] = useState(() => {
        const saved = localStorage.getItem('ciki_coupons');
        if (saved) return JSON.parse(saved);
        return [
            { id: 1, code: 'WELCOME20', type: 'percent', value: 20, minSpend: 1000, maxDiscount: 500, usageLimit: 100, usedCount: 34, expiresAt: '2026-06-30', status: 'active', description: 'ส่วนลดต้อนรับสมาชิกใหม่' },
            { id: 2, code: 'SCALING500', type: 'fixed', value: 500, minSpend: 2000, maxDiscount: null, usageLimit: 50, usedCount: 18, expiresAt: '2026-05-31', status: 'active', description: 'ส่วนลดขูดหินปูน' },
            { id: 3, code: 'ORTHO10K', type: 'fixed', value: 10000, minSpend: 50000, maxDiscount: null, usageLimit: 20, usedCount: 12, expiresAt: '2026-12-31', status: 'active', description: 'ส่วนลดแพ็กเกจจัดฟัน' },
            { id: 4, code: 'BIRTHDAY', type: 'percent', value: 15, minSpend: 0, maxDiscount: 1000, usageLimit: 999, usedCount: 67, expiresAt: '2026-12-31', status: 'active', description: 'ส่วนลดวันเกิด' },
            { id: 5, code: 'SUMMER50', type: 'percent', value: 50, minSpend: 3000, maxDiscount: 2000, usageLimit: 30, usedCount: 30, expiresAt: '2026-04-01', status: 'expired', description: 'โปรหน้าร้อน' }
        ];
    });

    React.useEffect(() => {
        localStorage.setItem('ciki_coupons', JSON.stringify(coupons));
    }, [coupons]);

    const [newCoupon, setNewCoupon] = useState({
        code: '', type: 'percent', value: '', minSpend: '', maxDiscount: '',
        usageLimit: '', expiresAt: '', description: '', services: []
    });

    // --- Computed Values ---
    const activeCoupons = coupons.filter(c => c.status === 'active');
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.usedCount, 0);
    const totalDiscountGiven = coupons.reduce((sum, c) => sum + (c.usedCount * (c.type === 'fixed' ? c.value : (c.maxDiscount || c.value * 10))), 0);

    const handleCreateCoupon = () => {
        const coupon = {
            ...newCoupon,
            id: Date.now(),
            usedCount: 0,
            status: 'active',
            value: Number(newCoupon.value),
            minSpend: Number(newCoupon.minSpend) || 0,
            maxDiscount: Number(newCoupon.maxDiscount) || null,
            usageLimit: Number(newCoupon.usageLimit) || 999,
        };
        setCoupons(prev => [coupon, ...prev]);
        setShowCreateModal(false);
        setNewCoupon({ code: '', type: 'percent', value: '', minSpend: '', maxDiscount: '', usageLimit: '', expiresAt: '', description: '', services: [] });
    };

    return (
        <div className="coupons-container animate-slide-up">
            {/* Header */}
            <div className="coupons-header">
                <div className="coupons-title-group">
                    <h1>
                        <div className="coupons-icon-box">
                            <Ticket size={24} />
                        </div>
                        {langT('คูปองและโปรโมชั่น', 'Coupons & Rewards')}
                    </h1>
                    <p>{langT('บริหารจัดการสิทธิพิเศษและแคมเปญการตลาดของคลินิก', 'Manage clinical perks, marketing campaigns, and loyalty programs')}</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)} 
                    className="btn-billing primary"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none' }}
                >
                    <Plus size={18} /> {langT('สร้างคูปองใหม่', 'Create Voucher')}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="coupons-stats-grid">
                {[
                    { label: langT('คูปองที่ใช้งานอยู่', 'Active Coupons'), value: activeCoupons.length, icon: Ticket, color: '#f59e0b', bg: '#fffbeb' },
                    { label: langT('จำนวนการใช้งาน', 'Redemptions'), value: totalRedemptions, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
                    { label: langT('ส่วนลดสะสมทังหมด', 'Total Savings'), value: `฿${(totalDiscountGiven).toLocaleString()}`, icon: DollarSign, color: '#10b981', bg: '#f0fdf4' },
                    { label: langT('แคมเปญทั้งหมด', 'Total Campaigns'), value: coupons.length, icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
                ].map((stat, i) => (
                    <div key={i} className="coupons-stat-card">
                        <div className="coupons-stat-icon-wrapper" style={{ background: stat.bg, color: stat.color }}>
                            <stat.icon size={22} />
                        </div>
                        <div className="coupons-stat-info">
                            <div className="value">{stat.value}</div>
                            <div className="label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Filters & Search */}
            <div className="tab-navigation-premium" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setActiveTab('coupons')} 
                        className={`tab-btn-premium ${activeTab === 'coupons' ? 'active' : ''}`}
                    >
                        {langT('คูปองส่วนลด', 'Vouchers')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('credits')} 
                        className={`tab-btn-premium ${activeTab === 'credits' ? 'active' : ''}`}
                    >
                        {langT('ประวัติการใช้งาน', 'Redemption Log')}
                    </button>
                </div>

                <div className="coupons-search-bar" style={{ minWidth: '350px', marginBottom: 0 }}>
                    <Search size={18} color="var(--neutral-400)" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={langT('ค้นหาคูปอง หรือคำอธิบาย...', 'Search coupon code, description...')}
                    />
                </div>
            </div>

            {/* Coupon Lists Grid */}
            <div className="coupons-list-grid">
                {coupons.filter(c => !searchTerm || c.code.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.includes(searchTerm)).map(coupon => {
                    const isExpired = coupon.status === 'expired' || new Date(coupon.expiresAt) < new Date();
                    const isFullyUsed = coupon.usedCount >= coupon.usageLimit;
                    const usagePercent = Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100);

                    return (
                        <div key={coupon.id} className={`coupon-ticket ${isExpired || isFullyUsed ? 'expired' : ''}`}>
                            <div className="coupon-dash-line" />
                            
                            <div className="coupon-top-section">
                                <div>
                                    <div className="coupon-badge-group">
                                        <span className={`coupon-type-badge ${coupon.type === 'percent' ? 'coupon-type-percent' : 'coupon-type-fixed'}`}>
                                            {coupon.type === 'percent' ? `${coupon.value}%` : `฿${coupon.value.toLocaleString()}`}
                                        </span>
                                        <span className={`coupon-status-badge ${isExpired ? 'status-expired' : isFullyUsed ? 'status-full' : 'status-active'}`}>
                                            {isExpired ? langT('หมดอายุ', 'Expired') : isFullyUsed ? langT('สิทธิ์เต็ม', 'Fully Used') : langT('ใช้งานอยู่', 'Active')}
                                        </span>
                                    </div>
                                    <h3 className="coupon-code">{coupon.code}</h3>
                                    <p className="coupon-description">{coupon.description}</p>
                                </div>
                                <div className="coupon-action-btns">
                                    <button className="btn-icon-square" title="Copy Code">
                                        <Copy size={16} />
                                    </button>
                                    <button className="btn-icon-square" title="Edit Campaign">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="coupon-meta-grid">
                                <div className="coupon-meta-item">
                                    <DollarSign size={14} /> 
                                    {langT('ขั้นต่ำ:', 'Min:')} ฿{coupon.minSpend.toLocaleString()}
                                </div>
                                <div className="coupon-meta-item">
                                    <Clock size={14} /> 
                                    {langT('หมดอายุ:', 'Exp:')} {coupon.expiresAt}
                                </div>
                            </div>

                            {/* Usage Statistics */}
                            <div className="coupon-usage-area">
                                <div className="usage-label-row">
                                    <span>{langT('ความคืบหน้าการใช้งาน', 'Usage Progress')}</span>
                                    <span>{coupon.usedCount} / {coupon.usageLimit}</span>
                                </div>
                                <div className="usage-bar-bg">
                                    <div 
                                        className="usage-bar-fill"
                                        style={{ 
                                            width: `${usagePercent}%`,
                                            background: usagePercent > 80 ? 'var(--danger-500)' : usagePercent > 50 ? '#f59e0b' : 'var(--success-500)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Coupon Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>🎫 สร้างคูปองใหม่</h2>
                            <button onClick={() => setShowCreateModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>รหัสคูปอง</label>
                                    <input type="text" value={newCoupon.code} onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="เช่น NEWYEAR2026"
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800 }}
                                    />
                                </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ประเภทส่วนลด</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setNewCoupon(p => ({ ...p, type: 'percent' }))} style={{
                                        flex: 1, padding: '0.75rem', border: '1.5px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: 700,
                                        borderColor: newCoupon.type === 'percent' ? '#f59e0b' : 'var(--neutral-200)',
                                        background: newCoupon.type === 'percent' ? '#fffbeb' : 'white',
                                        color: newCoupon.type === 'percent' ? '#d97706' : 'var(--neutral-600)'
                                    }}>
                                        <Percent size={18} style={{ margin: '0 auto 0.25rem', display: 'block' }} /> เปอร์เซ็นต์
                                    </button>
                                    <button onClick={() => setNewCoupon(p => ({ ...p, type: 'fixed' }))} style={{
                                        flex: 1, padding: '0.75rem', border: '1.5px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: 700,
                                        borderColor: newCoupon.type === 'fixed' ? '#3b82f6' : 'var(--neutral-200)',
                                        background: newCoupon.type === 'fixed' ? '#eff6ff' : 'white',
                                        color: newCoupon.type === 'fixed' ? '#1d4ed8' : 'var(--neutral-600)'
                                    }}>
                                        <DollarSign size={18} style={{ margin: '0 auto 0.25rem', display: 'block' }} /> บาทคงที่
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>
                                        {newCoupon.type === 'percent' ? 'ส่วนลด (%)' : 'ส่วนลด (บาท)'}
                                    </label>
                                    <input type="number" value={newCoupon.value} onChange={e => setNewCoupon(p => ({ ...p, value: e.target.value }))}
                                        placeholder={newCoupon.type === 'percent' ? 'เช่น 20' : 'เช่น 500'}
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>ยอดขั้นต่ำ (บาท)</label>
                                    <input type="number" value={newCoupon.minSpend} onChange={e => setNewCoupon(p => ({ ...p, minSpend: e.target.value }))}
                                        placeholder="0 = ไม่มีขั้นต่ำ"
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>จำกัดการใช้</label>
                                    <input type="number" value={newCoupon.usageLimit} onChange={e => setNewCoupon(p => ({ ...p, usageLimit: e.target.value }))}
                                        placeholder="จำนวนครั้ง"
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>วันหมดอายุ</label>
                                    <input type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon(p => ({ ...p, expiresAt: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', marginBottom: '0.3rem', display: 'block' }}>คำอธิบาย</label>
                                <input type="text" value={newCoupon.description} onChange={e => setNewCoupon(p => ({ ...p, description: e.target.value }))}
                                    placeholder="อธิบายคูปองนี้..."
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--neutral-200)', borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>

                            <button onClick={handleCreateCoupon} disabled={!newCoupon.code || !newCoupon.value} style={{
                                padding: '0.9rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white',
                                fontWeight: 800, fontSize: '1rem',
                                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)',
                                opacity: (!newCoupon.code || !newCoupon.value) ? 0.5 : 1
                            }}>
                                ✨ สร้างคูปอง
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};

export default CouponManagement;
