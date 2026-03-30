import React, { useRef, useEffect, useState, useCallback } from 'react';

// Virtual scrolling for handling large tables (10,000+ rows)
const VirtualTable = ({
    data,
    rowHeight = 60,
    renderRow,
    headerHeight = 50,
    renderHeader,
    overscan = 5,
    style = {},
    className = ''
}) => {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Calculate visible range
    const totalHeight = data.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
        data.length,
        Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );

    const visibleData = data.slice(startIndex, endIndex);
    const offsetY = startIndex * rowHeight;

    // Update container height on mount and resize
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Handle scroll
    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            style={{
                overflow: 'auto',
                height: '100%',
                ...style
            }}
            className={className}
        >
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'white',
                height: headerHeight,
                borderBottom: '1px solid var(--neutral-200)'
            }}>
                {renderHeader}
            </div>

            {/* Virtual scroll container */}
            <div style={{
                position: 'relative',
                height: totalHeight,
                willChange: 'transform'
            }}>
                <div style={{
                    position: 'absolute',
                    top: offsetY,
                    left: 0,
                    right: 0
                }}>
                    {visibleData.map((item, index) => (
                        <div
                            key={item.id || startIndex + index}
                            style={{
                                height: rowHeight,
                                boxSizing: 'border-box'
                            }}
                        >
                            {renderRow(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VirtualTable;
