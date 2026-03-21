import React, { useState } from 'react';
import { Clock, FileText, ChevronDown, ChevronUp, Save, Image as ImageIcon, Plus, Camera, Printer } from 'lucide-react';
import { useData } from '../../context/DataContext';
import DigitalToothChart from './DigitalToothChart';
import HandwritingCanvas from '../Shared/HandwritingCanvas';
import { PenTool } from 'lucide-react';

const HistoryTab = ({ patient, treatmentHistory, language }) => {
    const { updatePatient } = useData();
    const [selectedTooth, setSelectedTooth] = useState(null);
    const [expandedTreatmentId, setExpandedTreatmentId] = useState(null);
    const [soapForm, setSoapForm] = useState({ s: '', o: '', a: '', p: '' });
    const [showPrintModal, setShowPrintModal] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);
    const [showCanvas, setShowCanvas] = useState(false);
    const [targetTreatmentId, setTargetTreatmentId] = useState(null);

    // Get all teeth that have been treated
    const treatedTeeth = new Set(treatmentHistory.flatMap(tr => tr.teeth || []));

    // Get treatments for selected tooth or all
    const displayTreatments = selectedTooth
        ? treatmentHistory.filter(tr => tr.teeth?.includes(selectedTooth))
        : treatmentHistory;

    const getToothStatus = (toothId) => {
        const hasTreatment = treatedTeeth.has(toothId);
        const toothChart = patient.toothChart || {};
        const status = toothChart[toothId];
        return { hasTreatment, status };
    };

    const handleExpandTreatment = (treatment) => {
        if (expandedTreatmentId === treatment.id) {
            setExpandedTreatmentId(null);
        } else {
            setExpandedTreatmentId(treatment.id);
            setSoapForm(treatment.soap || { s: '', o: '', a: '', p: '' });
        }
    };

    const handleSaveSoap = (treatmentId) => {
        const updatedTreatments = treatmentHistory.map(tr =>
            tr.id === treatmentId ? { ...tr, soap: soapForm } : tr
        );
        updatePatient(patient.id, { treatments: updatedTreatments });
        alert(language === 'TH' ? 'บันทึก SOAP Note แล้ว' : 'SOAP Note saved');
        setExpandedTreatmentId(null);
        setExpandedTreatmentId(null);
    };

    const handleSaveDrawing = (dataUrl) => {
        if (!targetTreatmentId) return;

        const updatedTreatments = treatmentHistory.map(tr =>
            tr.id === targetTreatmentId ? {
                ...tr,
                noteImage: dataUrl,
                note: (tr.note || '') + ' [Attached Drawing]'
            } : tr
        );
        updatePatient(patient.id, { treatments: updatedTreatments });
        setShowCanvas(false);
        setTargetTreatmentId(null);
    };

    if (treatmentHistory.length === 0) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <Clock size={48} color="var(--neutral-300)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--neutral-500)' }}>
                    {language === 'TH' ? 'ยังไม่มีประวัติการรักษา' : 'No treatment history yet'}
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Old Records Section */}
                <div className="card" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📁 {language === 'TH' ? 'ประวัติเก่า (รูปภาพ)' : 'Old Records (Images)'}
                        </h3>
                        <label className="btn-icon" style={{ background: '#ecfdf5', color: '#059669', cursor: 'pointer', width: 'auto', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', borderRadius: '20px' }}>
                            <Camera size={18} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'TH' ? 'ถ่ายรูป' : 'Camera'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        // Resize Image Logic
                                        const resizeImage = (file) => new Promise(resolve => {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const img = new Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas');
                                                    const maxWidth = 800;
                                                    const scaleSize = maxWidth / img.width;
                                                    canvas.width = maxWidth;
                                                    canvas.height = img.height * scaleSize;
                                                    const ctx = canvas.getContext('2d');
                                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                                                };
                                                img.src = event.target.result;
                                            };
                                            reader.readAsDataURL(file);
                                        });

                                        try {
                                            const base64 = await resizeImage(file);
                                            const newRecord = {
                                                id: `OLD-${Date.now()}`,
                                                date: new Date().toISOString(),
                                                image: base64
                                            };
                                            updatePatient(patient.id, {
                                                oldRecords: [...(patient.oldRecords || []), newRecord]
                                            });
                                        } catch (err) {
                                            console.error("Error processing image", err);
                                            alert("Failed to process image");
                                        }
                                    }
                                }}
                            />
                        </label>
                    </div>

                    {(!patient.oldRecords || patient.oldRecords.length === 0) ? (
                        <p style={{ color: 'var(--neutral-400)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                            {language === 'TH' ? 'ไม่มีรูปภาพประวัติเก่า' : 'No old records uploaded'}
                        </p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                            {patient.oldRecords.map(rec => (
                                <div key={rec.id} style={{ position: 'relative', aspectRatio: '1/1', cursor: 'pointer' }} onClick={() => setSelectedImage(rec.image)}>
                                    <img src={rec.image} alt="Record" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--neutral-200)' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.6rem', padding: '2px', textAlign: 'center', borderRadius: '0 0 8px 8px' }}>
                                        {new Date(rec.date).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete?')) {
                                                updatePatient(patient.id, {
                                                    oldRecords: patient.oldRecords.filter(r => r.id !== rec.id)
                                                });
                                            }
                                        }}
                                        style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: '0', height: 'fit-content' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-100)' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🦷 {language === 'TH' ? 'คลิกที่ฟันเพื่อเลือกดูประวัติ' : 'Filter History by Tooth'}
                        </h3>
                    </div>

                    <div style={{ padding: '1rem' }}>
                        <DigitalToothChart
                            onToothSelect={(id) => setSelectedTooth(selectedTooth === id ? null : id)}
                            selectedTeeth={selectedTooth ? [selectedTooth] : []}
                            toothChart={patient.toothChart || {}}
                            treatedTeeth={Array.from(treatedTeeth)}
                        />
                    </div>

                    <div style={{ padding: '1rem', borderTop: '1px solid var(--neutral-100)', background: '#f8fafc', borderRadius: '0 0 16px 16px', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                        {selectedTooth
                            ? (language === 'TH' ? `กำลังดูประวัติฟันซี่ ${selectedTooth}` : `Viewing history for tooth ${selectedTooth}`)
                            : (language === 'TH' ? 'เลือกฟันที่เคยรักษาเพื่อดูรายละเอียด' : 'Select a tooth with history to see details')}
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', maxHeight: '600px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>
                        {selectedTooth ? `History #${selectedTooth}` : (language === 'TH' ? 'ประวัติการรักษา' : 'Treatment History')}
                    </h3>
                    <button className="btn btn-secondary" onClick={() => setShowPrintModal(true)}>
                        <Printer size={18} style={{ marginRight: '8px' }} /> {language === 'TH' ? 'พิมพ์ประวัติ' : 'Print History'}
                    </button>
                </div>

                {displayTreatments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-400)' }}>
                        No history found for selection.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {displayTreatments.map((tr, i) => (
                            <div key={tr.id || i} style={{
                                padding: '1rem', background: 'var(--neutral-50)',
                                borderRadius: '12px', border: '1px solid var(--neutral-100)',
                                transition: 'all 0.2s'
                            }}>
                                <div
                                    style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                                    onClick={() => handleExpandTreatment(tr)}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 700 }}>{tr.procedure}</span>
                                            {tr.soap && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontWeight: 600 }}>SOAP</span>}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                            <span>📅 {new Date(tr.date).toLocaleDateString()}</span>
                                            <span>🦷 {tr.teeth?.length > 0 ? tr.teeth.map(t => {
                                                // Try treatment record surfaces first, then fall back to patient toothChart
                                                const trSurfaces = tr.surfaces?.[t];
                                                const chartSurfaces = patient.toothChart?.[t]?.surfaces;
                                                const surfaceNames = { M: 'Mesial', D: 'Distal', B: 'Buccal', L: 'Lingual', O: 'Occlusal' };

                                                // From treatment record
                                                if (trSurfaces && Array.isArray(trSurfaces) && trSurfaces.length > 0) {
                                                    return `#${t} (${trSurfaces.map(s => surfaceNames[s] || s).join(', ')})`;
                                                }
                                                // From toothChart - show surfaces that aren't 'healthy'
                                                if (chartSurfaces) {
                                                    const activeSurfaces = Object.entries(chartSurfaces)
                                                        .filter(([, status]) => status && status !== 'healthy')
                                                        .map(([key, status]) => `${surfaceNames[key] || key}-${status === 'cavity' ? 'Cavity' : status === 'filled' ? 'Filled' : status}`);
                                                    if (activeSurfaces.length > 0) {
                                                        return `#${t} (${activeSurfaces.join(', ')})`;
                                                    }
                                                }
                                                return `#${t}`;
                                            }).join('  •  ') : '-'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>฿{tr.price?.toLocaleString()}</span>
                                        {expandedTreatmentId === tr.id ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                                    </div>
                                </div>

                                {/* SOAP Note Section */}
                                {expandedTreatmentId === tr.id && (
                                    <div className="animate-fade-in" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--neutral-200)' }}>
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={16} /> Clinical Notes (SOAP)
                                        </h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>Subjective (S)</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #dbeafe', fontSize: '0.85rem' }}
                                                    rows="2" placeholder="Patient complaints..."
                                                    value={soapForm.s} onChange={e => setSoapForm({ ...soapForm, s: e.target.value })}
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>Objective (O)</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fee2e2', fontSize: '0.85rem' }}
                                                    rows="2" placeholder="Clinical findings..."
                                                    value={soapForm.o} onChange={e => setSoapForm({ ...soapForm, o: e.target.value })}
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706' }}>Assessment (A)</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fef3c7', fontSize: '0.85rem' }}
                                                    rows="2" placeholder="Diagnosis..."
                                                    value={soapForm.a} onChange={e => setSoapForm({ ...soapForm, a: e.target.value })}
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>Plan (P)</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #dcfce7', fontSize: '0.85rem' }}
                                                    rows="2" placeholder="Treatment plan..."
                                                    value={soapForm.p} onChange={e => setSoapForm({ ...soapForm, p: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>

                                        {/* Image Attachments (Mock) */}
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <button style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                border: '1px dashed var(--neutral-300)', background: 'transparent',
                                                padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--neutral-500)'
                                            }}>
                                                <ImageIcon size={16} /> Attach X-Ray / Photos
                                            </button>
                                            <button
                                                onClick={() => { setTargetTreatmentId(tr.id); setShowCanvas(true); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    border: '1px dashed var(--neutral-300)', background: 'transparent',
                                                    padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#2563eb'
                                                }}>
                                                <PenTool size={16} /> Draw / Handwriting
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                            <button
                                                onClick={() => handleSaveSoap(tr.id)}
                                                className="btn btn-primary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            >
                                                <Save size={16} style={{ marginRight: '4px' }} /> Save Note
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {
                selectedImage && (
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
                        onClick={() => setSelectedImage(null)}
                    >
                        <img src={selectedImage} alt="Full Preview" style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} />
                        <button
                            style={{ marginTop: '1rem', background: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => setSelectedImage(null)}
                        >
                            Close Preview
                        </button>
                        <p style={{ color: 'white', marginTop: '0.5rem', fontSize: '0.8rem' }}>Tap anywhere to close</p>
                    </div>
                )
            }

            {/* Print History Modal */}
            {showPrintModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '800px', maxWidth: '95vw' }}>
                        <div className="printable-content">
                            <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
                                <h1>Treatment History Record</h1>
                                <p><strong>Clinic Name / Header</strong></p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div>
                                    <p><strong>Patient Name:</strong> {patient.name}</p>
                                    <p><strong>Patient ID:</strong> {patient.id}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p><strong>Date Printed:</strong> {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #000' }}>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Tooth</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Procedure</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Notes (SOAP)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayTreatments.map((tr, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px' }}>{new Date(tr.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '8px' }}>{tr.teeth?.join(', ') || '-'}</td>
                                            <td style={{ padding: '8px' }}>{tr.procedure}</td>
                                            <td style={{ padding: '8px', maxWidth: '300px' }}>
                                                {tr.soap ? (
                                                    <div style={{ fontSize: '0.8rem' }}>
                                                        {tr.soap.s && <div><strong>S:</strong> {tr.soap.s}</div>}
                                                        {tr.soap.o && <div><strong>O:</strong> {tr.soap.o}</div>}
                                                        {tr.soap.a && <div><strong>A:</strong> {tr.soap.a}</div>}
                                                        {tr.soap.p && <div><strong>P:</strong> {tr.soap.p}</div>}
                                                    </div>
                                                ) : '-'}
                                                {tr.note && <div style={{ fontStyle: 'italic', color: '#666' }}>{tr.note}</div>}
                                                {tr.noteImage && (
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <img src={tr.noteImage} alt="Drawing" style={{ maxWidth: '200px', borderRadius: '4px', border: '1px solid #eee' }} />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ borderBottom: '1px solid black', width: '200px', marginBottom: '0.5rem' }}></div>
                                    <p>Patient Signature</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ borderBottom: '1px solid black', width: '200px', marginBottom: '0.5rem' }}></div>
                                    <p>Dentist Signature</p>
                                </div>
                            </div>
                        </div>

                        <div className="no-print" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>Close</button>
                            <button className="btn btn-primary" onClick={() => window.print()}>
                                <Printer size={18} style={{ marginRight: '8px' }} /> Print Now
                            </button>
                        </div>
                    </div>
                    <style>{`@media print { body * { visibility: hidden; } .printable-content, .printable-content * { visibility: visible; } .printable-content { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none; } .modal-overlay { background: white; position: absolute; height: auto; } .modal-content { box-shadow: none; width: 100% !important; max-width: 100% !important; } }`}</style>
                </div>
            )}

            {showCanvas && (
                <HandwritingCanvas
                    onClose={() => { setShowCanvas(false); setTargetTreatmentId(null); }}
                    onSave={handleSaveDrawing}
                />
            )}
        </div >
    );
};

export default HistoryTab;
