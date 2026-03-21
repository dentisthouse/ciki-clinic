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
            <span style={{
                background: s.bg, color: s.color,
                padding: '0.25rem 0.75rem', borderRadius: '1rem',
                fontSize: '0.9rem', fontWeight: 500
            }}>
                {s.label}
            </span>
        );
    };

    const StatusCard = ({ title, count, icon: Icon, color, onClick }) => (
        <div className="glass-panel"
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={onClick}
        >
            <div style={{ background: `${color}20`, padding: '1rem', borderRadius: '50%', color: color }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{count}</div>
                <div style={{ color: 'var(--neutral-500)' }}>{title}</div>
            </div>
        </div>
    );

    const filteredClaims = filter === 'All' ? ssoClaims : ssoClaims.filter(c => c.status === filter);

    return (
        <div className="animate-fade-in">
            <h2 className="page-title">{t('sso_track_title')}</h2>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatusCard title={t('sso_status_pending')} count={stats.pending} icon={Clock} color="#d97706" onClick={() => setFilter('Pending')} />
                <StatusCard title={t('sso_status_approved')} count={stats.approved} icon={CheckCircle} color="#166534" onClick={() => setFilter('Approved')} />
                <StatusCard title={t('sso_status_paid')} count={stats.paid} icon={FileText} color="#1e40af" onClick={() => setFilter('Paid')} />
                <StatusCard title={t('sso_status_rejected')} count={stats.rejected} icon={XCircle} color="#b91c1c" onClick={() => setFilter('Rejected')} />
            </div>

            {/* Table */}
            <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
                    <h3>Recent Claims</h3>
                    <button className="btn-secondary" onClick={() => setFilter('All')} disabled={filter === 'All'}>
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
