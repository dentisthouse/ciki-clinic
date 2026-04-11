import React, { useState, useRef, useEffect } from 'react';
import { Search, User, X, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SearchablePatientSelect = ({ patients, value, onChange, placeholder }) => {
    const { language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedPatient = patients.find(p => p.id === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredPatients = patients.filter(p => {
        const search = searchTerm.toLowerCase();
        return (
            p.name.toLowerCase().includes(search) ||
            (p.hn && p.hn.toLowerCase().includes(search)) ||
            (p.phone && p.phone.includes(search))
        );
    }).slice(0, 10); // Limit to 10 for performance

    const handleSelect = (patient) => {
        onChange(patient.id);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="searchable-select-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
            <div 
                className={`searchable-select-input-container ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    border: '1.5px solid var(--neutral-100)',
                    borderRadius: '14px',
                    padding: '0.75rem 1rem',
                    cursor: 'text',
                    transition: 'all 0.2s',
                    borderColor: isOpen ? 'var(--primary-400)' : 'var(--neutral-100)',
                    boxShadow: isOpen ? '0 0 0 4px rgba(99, 102, 241, 0.05)' : 'none'
                }}
            >
                <Search size={16} style={{ color: 'var(--neutral-400)', marginRight: '10px' }} />
                <input
                    type="text"
                    style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--neutral-900)',
                        background: 'transparent'
                    }}
                    placeholder={selectedPatient ? selectedPatient.name : (placeholder || (language === 'TH' ? 'ค้นหาชื่อคนไข้หรือ HN...' : 'Search patient name or HN...'))}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {(value || searchTerm) && (
                    <button 
                        type="button" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                            setSearchTerm('');
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--neutral-300)', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div 
                    className="searchable-select-dropdown"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        border: '1.5px solid var(--neutral-100)',
                        zIndex: 1000,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '8px'
                    }}
                >
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map(p => (
                            <div 
                                key={p.id}
                                className="searchable-option"
                                onClick={() => handleSelect(p)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: value === p.id ? 'var(--primary-50)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = value === p.id ? 'var(--primary-50)' : 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        background: 'var(--neutral-100)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: 'var(--neutral-500)'
                                    }}>
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neutral-900)' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 500 }}>
                                            HN: {p.hn} • {p.phone || (language === 'TH' ? 'ไม่มีเบอร์' : 'No phone')}
                                        </div>
                                    </div>
                                </div>
                                {value === p.id && <Check size={16} style={{ color: 'var(--primary-600)' }} />}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem' }}>
                            {language === 'TH' ? 'ไม่พบรายชื่อคนไข้' : 'No patients found'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchablePatientSelect;
