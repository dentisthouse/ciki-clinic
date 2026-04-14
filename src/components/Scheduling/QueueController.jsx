import React from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Play, SkipForward, CheckSquare, Clock, AlertCircle } from 'lucide-react';

const QueueController = () => {
    const { t, language } = useLanguage();
    const { appointments, updateQueueStatus } = useData();

    // Filter for today's active queue
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const queueItems = appointments
        .filter(a => a.date.startsWith(todayStr) && a.status !== 'Cancelled')
        .sort((a, b) => {
            // Priority: In Progress > Waiting > Skipped > Completed
            const statusOrder = { 'In Progress': 0, 'Waiting': 1, 'Skipped': 2, 'Completed': 3, 'Pending': 4 };
            const sA = statusOrder[a.queueStatus] ?? 99;
            const sB = statusOrder[b.queueStatus] ?? 99;
            if (sA !== sB) return sA - sB;
            return a.time.localeCompare(b.time);
        });

    const currentQ = queueItems.find(q => q.queueStatus === 'In Progress');
    const waitingQ = queueItems.filter(q => q.queueStatus === 'Waiting');

    const handleCall = (id) => {
        // If there is already one in progress, maybe warn or auto-complete?
        // For now, allow taking over
        if (currentQ && currentQ.id !== id) {
            if (!confirm(language === 'TH' ? 'มีคิวที่กำลังรักษาอยู่ ต้องการเรียกคิวใหม่เลยหรือไม่?' : 'Queue in progress. Call new one?')) return;
            updateQueueStatus(currentQ.id, 'Completed');
        }
        updateQueueStatus(id, 'In Progress');
    };

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} className="animate-pulse"></div>
                    {language === 'TH' ? 'ควบคุมคิว' : 'Queue Controller'}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {waitingQ.length} {language === 'TH' ? 'รอเรียก' : 'Waiting'}
                </div>
            </div>

            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                {/* Current Active Queue */}
                {currentQ ? (
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem',
                        marginBottom: '1.5rem', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {language === 'TH' ? 'กำลังรักษา' : 'NOW SERVING'}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#15803d', lineHeight: 1 }}>
                            {currentQ.queueNumber || 'A-XX'}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#166534', margin: '0.5rem 0' }}>
                            {currentQ.patientName}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '1rem' }}>
                            <button className="btn" style={{ background: '#166534', color: 'white', flex: 1 }}
                                onClick={() => updateQueueStatus(currentQ.id, 'Completed')}>
                                <CheckSquare size={16} style={{ marginRight: '6px' }} />
                                {language === 'TH' ? 'เสร็จสิ้น' : 'Complete'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☕</div>
                        {language === 'TH' ? 'ไม่มีคิวที่กำลังรักษา' : 'No Active Queue'}
                    </div>
                )}

                {/* Waiting List */}
                <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {language === 'TH' ? 'คิวรอเรียก' : 'Waiting List'}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {waitingQ.length > 0 ? waitingQ.map(q => (
                        <div key={q.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px', borderRadius: '12px', background: 'white',
                            border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#334155' }}>{q.queueNumber}</div>
                                <div style={{ fontSize: '0.9rem', color: '#475569' }}>{q.patientName}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> {q.time} • {q.procedure}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => handleCall(q.id)}
                                    title="Call"
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                                        background: '#22c55e', color: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <Play size={18} fill="currentColor" />
                                </button>
                                <button
                                    onClick={() => updateQueueStatus(q.id, 'Skipped')}
                                    title="Skip"
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                                        background: '#f1f5f9', color: '#64748b', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <SkipForward size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            {language === 'TH' ? 'ไม่มีคิวรอ' : 'Queue empty'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueController;
