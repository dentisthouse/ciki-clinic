import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 24, className = '', text = '' }) => {
    return (
        <div className={`flex items-center justify-center gap-2 ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Loader2 className="animate-spin" size={size} style={{ animation: 'spin 1s linear infinite' }} />
            {text && <span className="text-sm text-gray-500">{text}</span>}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
