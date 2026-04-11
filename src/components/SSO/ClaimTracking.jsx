import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

const ClaimTracking = () => {
    const { t } = useLanguage();
    const { ssoClaims } = useData();
    const [filter, setFilter] = useState('All');

    const stats = {
        pending: ssoClaims.filter(c => c.status === 'Pending').length,
        approved: ssoClaims.filter(c => c.status === 'Approved').length,
        rejected: ssoClaims.filter(c => c.status === 'Rejected').length,
        paid: ssoClaims.filter(c => c.status === 'Paid').length,
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': { bg: '#fef3c7', color: '#d97706', label: t('sso_status_pending') },
            'Approved': { bg: '#dcfce7', color: '#166534', label: t('sso_status_approved') },
            'Rejected': { bg: '#fee2e2', color: '#b91c1c', label: t('sso_status_rejected') },
            'Paid': { bg: '#dbeafe', color: '#1e40af', label: t('sso_status_paid') },
        };
        const s = styles[status] || styles['Pending'];
        return (
            <span className="sso-status-badge" style={{ background: s.bg, color: s.color }}>
                {s.label}
            </span>
        );
    };

    const StatusCard = ({ title, count, icon: Icon, color, onClick }) => (
        <div className="card glass-panel-premium animate-fade-in"
            style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', background: 'white' }}
            onClick={onClick}
        >
            <div className="floating-icon" style={{ background: `${color}15`, padding: '1rem', borderRadius: '20px', color: color, boxShadow: `0 8px 16px -4px ${color}30` }}>
                <Icon size={28} />
            </div>
            <div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--neutral-900)', lineHeight: 1 }}>{count}</div>
                <div style={{ color: 'var(--neutral-500)', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.4rem' }}>{title}</div>
            </div>
        </div>
    );

    const filteredClaims = filter === 'All' ? ssoClaims : ssoClaims.filter(c => c.status === filter);

    return (
        <div className="animate-fade-in">
            {/* Stats Grid */}
            <div className="sso-stats-grid">
                <StatusCard title={t('sso_status_pending')} count={stats.pending} icon={Clock} color="#d97706" onClick={() => setFilter('Pending')} />
                <StatusCard title={t('sso_status_approved')} count={stats.approved} icon={CheckCircle} color="#166534" onClick={() => setFilter('Approved')} />
                <StatusCard title={t('sso_status_paid')} count={stats.paid} icon={FileText} color="#3b82f6" onClick={() => setFilter('Paid')} />
                <StatusCard title={t('sso_status_rejected')} count={stats.rejected} icon={XCircle} color="#ef4444" onClick={() => setFilter('Rejected')} />
            </div>

            {/* Table */}
            <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
                    <h3>Recent Claims</h3>
                    <button className="btn btn-secondary" style={{ borderRadius: '12px', fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => setFilter('All')} disabled={filter === 'All'}>
                        Show All
                    </button>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Claim ID</th>
                                <th>Date</th>
                                <th>Patient</th>
                                <th>Procedure (Code)</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClaims.length > 0 ? (
                                filteredClaims.map(claim => (
                                    <tr key={claim.id}>
                                        <td>{claim.id}</td>
                                        <td>{claim.date}</td>
                                        <td>{claim.patientName}</td>
                                        <td>{claim.procedure} ({claim.code})</td>
                                        <td>{claim.amount.toLocaleString()}</td>
                                        <td>{getStatusBadge(claim.status)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-500)' }}>
                                        No claims found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClaimTracking;
