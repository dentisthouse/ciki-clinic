import React, { useState } from 'react';
import { X, FileText, Upload, Plus, Trash2, ExternalLink, Download, FileCheck, FileWarning, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const DocumentModal = ({ isOpen, onClose, patient }) => {
    const { t, language } = useLanguage();
    const { patientDocuments, addPatientDocument, deletePatientDocument } = useData();
    const [isUploading, setIsUploading] = useState(false);
    const [docType, setDocType] = useState('Consent Form');

    if (!isOpen) return null;

    const documents = (patientDocuments || []).filter(doc => doc.patientId === patient.id);

    const handleUpload = () => {
        setIsUploading(true);
        setTimeout(() => {
            const newDoc = {
                patientId: patient.id,
                name: `${docType} - ${new Date().toLocaleDateString()}`,
                type: docType,
                fileUrl: '#',
                size: '1.2 MB',
                status: 'Signed',
                date: new Date().toLocaleDateString(),
                uploadedBy: 'Dr. Smith',
                lastModified: new Date().toISOString()
            };
            addPatientDocument(newDoc);
            setIsUploading(false);
        }, 1500);
    };

    const docTypes = [
        { id: 'Consent Form', icon: FileCheck, color: '#10b981', description: 'Patient consent for treatment' },
        { id: 'Medical Certificate', icon: FileText, color: '#3b82f6', description: 'Official medical certificate' },
        { id: 'X-Ray Report', icon: FileWarning, color: '#f59e0b', description: 'Radiology reports and images' },
        { id: 'Referral Letter', icon: ExternalLink, color: '#8b5cf6', description: 'Referral to specialists' },
        { id: 'Lab Results', icon: FileWarning, color: '#ef4444', description: 'Laboratory test results' },
        { id: 'Treatment Plan', icon: FileText, color: '#06b6d4', description: 'Detailed treatment plan' },
        { id: 'Insurance Form', icon: FileCheck, color: '#84cc16', description: 'Insurance claim forms' },
        { id: 'Progress Notes', icon: FileText, color: '#f97316', description: 'Treatment progress notes' },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '10px', 
                            background: 'var(--primary-100)', color: 'var(--primary-600)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Patient Documents</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                                {patient.name} • {patient.id}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Upload Section */}
                    <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--neutral-50) 0%, white 100%)', borderStyle: 'dashed', borderColor: 'var(--primary-200)' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Document Type</label>
                                <select 
                                    className="form-select" 
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    style={{ background: 'white', borderColor: 'var(--primary-100)' }}
                                >
                                    {docTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.id}</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                                    {docTypes.find(t => t.id === docType)?.description}
                                </p>
                            </div>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleUpload}
                                disabled={isUploading}
                                style={{ height: '48px', padding: '0 2rem', background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%)', border: 'none' }}
                            >
                                {isUploading ? (
                                    <>
                                        <Clock size={18} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Upload Document
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--neutral-600)', margin: 0 }}>
                                Recent Documents ({documents.length})
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                                    <Upload size={14} style={{ marginRight: '0.25rem' }} />
                                    Bulk Upload
                                </button>
                                <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                                    <Download size={14} style={{ marginRight: '0.25rem' }} />
                                    Export All
                                </button>
                            </div>
                        </div>
                        
                        {documents.length > 0 ? (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {documents.map(doc => {
                                    const docType = docTypes.find(t => t.id === doc.type);
                                    return (
                                        <div key={doc.id} className="card" style={{ 
                                            display: 'flex', alignItems: 'center', gap: '1.25rem', 
                                            padding: '1rem 1.5rem', transition: 'all 0.2s',
                                            borderLeft: `4px solid ${docType?.color || '#6b7280'}`,
                                            background: 'linear-gradient(135deg, white 0%, rgba(255,255,255,0.8) 100%)'
                                        }}>
                                            <div style={{ 
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                background: `${docType?.color}15`,
                                                color: docType?.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: `0 4px 12px ${docType?.color}20`
                                            }}>
                                                {React.createElement(docType?.icon || FileText, { size: 24 })}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--neutral-900)', fontSize: '0.95rem' }}>{doc.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Clock size={12} />
                                                        {doc.date}
                                                    </span>
                                                    <span>{doc.size}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-500)' }} />
                                                        {doc.status}
                                                    </span>
                                                    {doc.uploadedBy && (
                                                        <span style={{ color: 'var(--primary-600)', fontWeight: 500 }}>by {doc.uploadedBy}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-50)', color: 'var(--primary-600)' }} title="Download">
                                                    <Download size={16} />
                                                </button>
                                                <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--amber-50)', color: 'var(--amber-600)' }} title="View">
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button 
                                                    className="btn-secondary" 
                                                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--danger-50)', color: 'var(--danger-600)' }} 
                                                    title="Delete"
                                                    onClick={() => deletePatientDocument(doc.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ 
                                padding: '4rem 2rem', textAlign: 'center', 
                                border: '2px dashed var(--neutral-200)', borderRadius: '20px',
                                color: 'var(--neutral-400)',
                                background: 'linear-gradient(135deg, var(--neutral-50) 0%, white 100%)'
                            }}>
                                <FileText size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>No documents uploaded yet</p>
                                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>Upload consent forms, reports, or treatment plans for this patient.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                            <span>Storage used: {documents.length * 1.2} MB</span>
                            <span style={{ margin: '0 1rem' }}>•</span>
                            <span>Last updated: {new Date().toLocaleTimeString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={onClose} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                                Cancel
                            </button>
                            <button onClick={onClose} className="btn btn-primary" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--success-600) 0%, var(--success-500) 100%)' }}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentModal;
