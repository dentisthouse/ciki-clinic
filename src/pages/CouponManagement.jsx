import React, { useState } from 'react';
import {
    Ticket, Plus, Search, Tag, Percent, DollarSign, Calendar,
    Users, BarChart3, Clock, Trash2, Edit2, Copy, Eye,
    CheckCircle, XCircle, AlertTriangle, Gift, Zap, TrendingUp,
    Filter, Download, Shield
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CouponManagement = () => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState('coupons');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock coupon data
    const [coupons, setCoupons] = useState([
        { id: 1, code: 'WELCOME20', type: 'percent', value: 20, minSpend: 1000, maxDiscount: 500, usageLimit: 100, usedCount: 34, expiresAt: '2026-06-30', status: 'active', description: 'ส่วนลดต้อนรับสมาชิกใหม่' },
        { id: 2, code: 'SCALING500', type: 'fixed', value: 500, minSpend: 2000, maxDiscount: null, usageLimit: 50, usedCount: 18, expiresAt: '2026-05-31', status: 'active', description: 'ส่วนลดขูดหินปูน' },
        { id: 3, code: 'ORTHO10K', type: 'fixed', value: 10000, minSpend: 50000, maxDiscount: null, usageLimit: 20, usedCount: 12, expiresAt: '2026-12-31', status: 'active', description: 'ส่วนลดแพ็กเกจจัดฟัน' },
        { id: 4, code: 'BIRTHDAY', type: 'percent', value: 15, minSpend: 0, maxDiscount: 1000, usageLimit: 999, usedCount: 67, expiresAt: '2026-12-31', status: 'active', description: 'ส่วนลดวันเกิด' },
        { id: 5, code: 'SUMMER50', type: 'percent', value: 50, minSpend: 3000, maxDiscount: 2000, usageLimit: 30, usedCount: 30, expiresAt: '2026-04-01', status: 'expired', description: 'โปรหน้าร้อน' },
    ]);

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
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #f59e0b, #f97316)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
                            <Ticket size={22} />
                        </div>
                        {language === 'TH' ? 'ระบบจัดการคูปองและวงเงิน' : 'Coupon & Credit Management'}
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        {language === 'TH' ? 'บริหารโปรโมชั่นและแพ็กเกจ ตรวจสอบได้แม่นยำ' : 'Manage promotions and packages with precision tracking'}
                    </p>
                </div>
                <button onClick={() => setShowCreateModal(true)} style={{
                    padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white',
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)', fontSize: '0.9rem'
                }}>
                    <Plus size={18} /> สร้างคูปองใหม่
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'คูปองที่ใช้งานอยู่', value: activeCoupons.length, icon: Ticket, color: '#22c55e', bg: '#f0fdf4' },
                    { label: 'จำนวนครั้งที่ใช้', value: totalRedemptions, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'ส่วนลดที่ให้ไป', value: `฿${(totalDiscountGiven).toLocaleString()}`, icon: DollarSign, color: '#ef4444', bg: '#fef2f2' },
                    { label: 'แคมเปญทั้งหมด', value: coupons.length, icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--neutral-800)' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="ค้นหาคูปอง..."
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', border: '1.5px solid var(--neutral-200)', borderRadius: '12px', fontSize: '0.9rem' }}
                    />
                </div>
            </div>

            {/* Coupon Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {coupons.filter(c => !searchTerm || c.code.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.includes(searchTerm)).map(coupon => {
                    const isExpired = coupon.status === 'expired' || new Date(coupon.expiresAt) < new Date();
                    const isFullyUsed = coupon.usedCount >= coupon.usageLimit;
                    const usagePercent = Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100);

                    return (
                        <div key={coupon.id} className="card" style={{
                            padding: '1.5rem', position: 'relative', overflow: 'hidden',
                            opacity: isExpired || isFullyUsed ? 0.6 : 1,
                            borderLeft: `4px solid ${isExpired ? '#94a3b8' : isFullyUsed ? '#ef4444' : '#22c55e'}`
                        }}>
                            {/* Ticket decoration */}
                            <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', background: 'var(--neutral-50)', borderRadius: '50%', border: '1px solid var(--neutral-200)' }} />
                            <div style={{ position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', background: 'var(--neutral-50)', borderRadius: '50%', border: '1px solid var(--neutral-200)' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{
                                            background: coupon.type === 'percent' ? '#f0fdf4' : '#eff6ff',
                                            color: coupon.type === 'percent' ? '#15803d' : '#1d4ed8',
                                            padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800
                                        }}>
                                            {coupon.type === 'percent' ? `${coupon.value}%` : `฿${coupon.value.toLocaleString()}`}
                                        </span>
                                        <span style={{
                                            padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                                            background: isExpired ? '#f1f5f9' : isFullyUsed ? '#fef2f2' : '#f0fdf4',
                                            color: isExpired ? '#64748b' : isFullyUsed ? '#dc2626' : '#16a34a'
                                        }}>
                                            {isExpired ? 'หมดอายุ' : isFullyUsed ? 'ใช้หมดแล้ว' : 'ใช้งานอยู่'}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em', color: 'var(--neutral-800)' }}>
                                        {coupon.code}
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: '0.15rem' }}>{coupon.description}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button style={{ padding: '0.4rem', border: 'none', background: 'var(--neutral-50)', borderRadius: '8px', cursor: 'pointer' }}>
                                        <Copy size={14} color="var(--neutral-500)" />
                                    </button>
                                    <button style={{ padding: '0.4rem', border: 'none', background: 'var(--neutral-50)', borderRadius: '8px', cursor: 'pointer' }}>
                                        <Edit2 size={14} color="var(--neutral-500)" />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '0.75rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <DollarSign size={12} /> ขั้นต่ำ ฿{coupon.minSpend.toLocaleString()}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Calendar size={12} /> หมดอายุ {coupon.expiresAt}
                                </span>
                            </div>

                            {/* Usage Bar */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                                    <span>ใช้แล้ว {coupon.usedCount}/{coupon.usageLimit}</span>
                                    <span>{usagePercent.toFixed(0)}%</span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--neutral-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '3px',
                                        width: `${usagePercent}%`,
                                        background: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#22c55e',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Coupon Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>🎫 สร้างคูปองใหม่</h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'var(--neutral-50)', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer' }}>
                                <XCircle size={20} color="var(--neutral-500)" />
                            </button>
                        </div>

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
            )}
        </div>
    );
};

export default CouponManagement;
