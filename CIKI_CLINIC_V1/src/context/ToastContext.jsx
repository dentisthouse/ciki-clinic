import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastIcon = ({ type }) => {
    switch (type) {
        case 'success':
            return <CheckCircle size={20} style={{ color: '#10b981' }} />;
        case 'error':
            return <AlertCircle size={20} style={{ color: '#ef4444' }} />;
        default:
            return <Info size={20} style={{ color: '#3b82f6' }} />;
    }
};

const Toast = ({ message, type, onClose }) => {
    const colors = {
        success: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
        error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
        info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
    };

    const color = colors[type] || colors.info;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                minWidth: '300px',
                maxWidth: '400px',
                animation: 'toast-slide-in 0.3s ease-out',
                position: 'relative'
            }}
        >
            <ToastIcon type={type} />
            <span style={{ flex: 1, color: color.text, fontWeight: 500, fontSize: '0.875rem' }}>
                {message}
            </span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    color: color.text,
                    opacity: 0.6
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((message, duration) => {
        addToast(message, 'success', duration);
    }, [addToast]);

    const error = useCallback((message, duration) => {
        addToast(message, 'error', duration);
    }, [addToast]);

    const info = useCallback((message, duration) => {
        addToast(message, 'info', duration);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info, addToast }}>
            {children}
            <div
                style={{
                    position: 'fixed',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}
            >
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
            <style>{`
                @keyframes toast-slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
