import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { Image, Upload, Camera, FileText } from 'lucide-react';
import DicomViewer from '../../components/PACS/DicomViewer';

const ImagingTab = ({ patientId }) => {
    const { t } = useLanguage();
    const { patientImages, addPatientImage } = useData();
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const images = patientImages ? patientImages.filter(img => img.patientId === patientId) : [];

    const handleSimulateCapture = () => {
        setUploading(true);
        setTimeout(() => {
            const types = ['Panoramic', 'Bitewing (R)', 'Bitewing (L)', 'Periapical'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const mockUrl = `https://images.unsplash.com/photo-1516069677934-cc3346102904?q=80&w=1000&auto=format&fit=crop`; // Generic x-ray like image

            addPatientImage({
                patientId,
                url: mockUrl,
                type: randomType,
                notes: 'Captured via Sensor S1'
            });
            setUploading(false);
        }, 1500);
    };

    return (
        <div className="animate-fade-in">
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Imaging & X-Rays (PACS)</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" disabled>
                        <Upload size={18} style={{ marginRight: '0.5rem' }} />
                        Upload File
                    </button>
                    <button className="btn-primary" onClick={handleSimulateCapture} disabled={uploading}>
                        <Camera size={18} style={{ marginRight: '0.5rem' }} />
                        {uploading ? 'Acquiring...' : 'Acquire X-Ray'}
                    </button>
                </div>
            </div>

            {/* Gallery Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {images.map(img => (
                    <div
                        key={img.id}
                        className="glass-panel"
                        style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                        onClick={() => setSelectedImage(img)}
                    >
                        <div style={{ height: '200px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={img.url} alt={img.type} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{img.type}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{img.date}</span>
                                <FileText size={14} />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {images.length === 0 && !uploading && (
                    <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-lg)', color: 'var(--neutral-500)' }}>
                        <Image size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No images found for this patient.</p>
                        <p style={{ fontSize: '0.9rem' }}>Click "Acquire X-Ray" to simulate a sensor capture.</p>
                    </div>
                )}
            </div>

            {/* Viewer Modal */}
            {selectedImage && (
                <DicomViewer
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};

export default ImagingTab;
