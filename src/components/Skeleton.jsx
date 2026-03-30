// Reusable skeleton components for loading states
import React from 'react';

export const SkeletonText = ({ width = '100%', height = '1rem', style = {} }) => (
    <div
        style={{
            width,
            height,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: '4px',
            ...style
        }}
    />
);

export const SkeletonCircle = ({ size = '3rem', style = {} }) => (
    <div
        style={{
            width: size,
            height: size,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: '50%',
            ...style
        }}
    />
);

export const SkeletonCard = ({ height = '120px', style = {} }) => (
    <div
        style={{
            height,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: '12px',
            ...style
        }}
    />
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
    <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem' }}>
            {Array.from({ length: columns }).map((_, i) => (
                <SkeletonText key={`header-${i}`} width={`${100 / columns}%`} height='1.25rem' />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', padding: '0.75rem 1rem' }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <SkeletonText key={`cell-${rowIndex}-${colIndex}`} width={`${100 / columns}%`} height='1rem' />
                ))}
            </div>
        ))}
    </div>
);

export const SkeletonStats = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <SkeletonCircle size='3rem' />
                    <div style={{ flex: 1 }}>
                        <SkeletonText width='60%' height='0.875rem' style={{ marginBottom: '0.5rem' }} />
                        <SkeletonText width='40%' height='1.5rem' />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonList = ({ count = 5 }) => (
    <div>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eee' }}>
                <SkeletonCircle size='2.5rem' />
                <div style={{ flex: 1 }}>
                    <SkeletonText width='40%' height='1rem' style={{ marginBottom: '0.5rem' }} />
                    <SkeletonText width='60%' height='0.875rem' />
                </div>
            </div>
        ))}
    </div>
);

// Add CSS animation for skeleton
export const SkeletonStyles = () => (
    <style>{`
        @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `}</style>
);

export default {
    SkeletonText,
    SkeletonCircle,
    SkeletonCard,
    SkeletonTable,
    SkeletonStats,
    SkeletonList,
    SkeletonStyles
};
