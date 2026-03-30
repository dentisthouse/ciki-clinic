import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalPages,
    total,
    pageSize,
    onPageChange,
    onNext,
    onPrevious,
    hasNextPage,
    hasPreviousPage
}) => {
    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            // Calculate middle pages
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);
            
            // Adjust if at the beginning or end
            if (currentPage <= 2) {
                endPage = 4;
            } else if (currentPage >= totalPages - 1) {
                startPage = totalPages - 3;
            }
            
            // Add ellipsis before middle pages if needed
            if (startPage > 2) {
                pages.push('...');
            }
            
            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            
            // Add ellipsis after middle pages if needed
            if (endPage < totalPages - 1) {
                pages.push('...');
            }
            
            // Always show last page
            pages.push(totalPages);
        }
        
        return pages;
    };

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, total);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            {/* Info text */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: 'var(--neutral-600)'
            }}>
                <span>
                    แสดง {startItem.toLocaleString()} - {endItem.toLocaleString()} จาก {total.toLocaleString()} รายการ
                </span>
                <span>
                    หน้า {currentPage} จาก {totalPages}
                </span>
            </div>

            {/* Page buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                {/* Previous button */}
                <button
                    onClick={onPrevious}
                    disabled={!hasPreviousPage}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.5rem 0.75rem',
                        background: hasPreviousPage ? 'white' : 'var(--neutral-100)',
                        border: '1px solid var(--neutral-200)',
                        borderRadius: '8px',
                        cursor: hasPreviousPage ? 'pointer' : 'not-allowed',
                        opacity: hasPreviousPage ? 1 : 0.5,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--neutral-700)',
                        transition: 'all 0.2s'
                    }}
                >
                    <ChevronLeft size={16} />
                    ก่อนหน้า
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span style={{
                                padding: '0.5rem',
                                color: 'var(--neutral-500)'
                            }}>
                                ...
                            </span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page)}
                                style={{
                                    minWidth: '2.5rem',
                                    height: '2.5rem',
                                    padding: '0.5rem',
                                    background: currentPage === page ? 'var(--primary-600)' : 'white',
                                    border: '1px solid var(--neutral-200)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: currentPage === page ? 'white' : 'var(--neutral-700)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}

                {/* Next button */}
                <button
                    onClick={onNext}
                    disabled={!hasNextPage}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.5rem 0.75rem',
                        background: hasNextPage ? 'white' : 'var(--neutral-100)',
                        border: '1px solid var(--neutral-200)',
                        borderRadius: '8px',
                        cursor: hasNextPage ? 'pointer' : 'not-allowed',
                        opacity: hasNextPage ? 1 : 0.5,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--neutral-700)',
                        transition: 'all 0.2s'
                    }}
                >
                    ถัดไป
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
