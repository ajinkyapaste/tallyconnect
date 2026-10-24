import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { RowsDropdown } from './RowsDropdown';

/**
 * StandardPagination Component
 * Standardizes record counts, page size selection (10, 25, 50, 100),
 * previous/next page navigation, and responsive controls across all list views.
 */
export const StandardPagination = ({
  page = 1,
  currentPage,
  pageSize = 10,
  totalRecords = 0,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  className = '',
  style = {}
}) => {
  const actualPage = currentPage !== undefined ? currentPage : page;
  const actualTotal = totalItems !== undefined ? totalItems : totalRecords;
  const totalPages = Math.max(1, Math.ceil(actualTotal / pageSize));
  const safePage = Math.min(Math.max(1, actualPage), totalPages);

  const startRecord = actualTotal === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, actualTotal);

  const handlePrev = () => {
    if (safePage > 1 && onPageChange) {
      onPageChange(safePage - 1);
    }
  };

  const handleNext = () => {
    if (safePage < totalPages && onPageChange) {
      onPageChange(safePage + 1);
    }
  };

  const handleFirst = () => {
    if (safePage > 1 && onPageChange) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (safePage < totalPages && onPageChange) {
      onPageChange(totalPages);
    }
  };

  return (
    <div
      className={`standard-pagination-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 0 4px',
        marginTop: '12px',
        ...style
      }}
    >
      {/* Record summary count */}
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
        {actualTotal > 0 ? (
          <>
            Showing <strong style={{ color: 'var(--text-dark)' }}>{startRecord}</strong>–
            <strong style={{ color: 'var(--text-dark)' }}>{endRecord}</strong> of{' '}
            <strong style={{ color: 'var(--text-dark)' }}>{actualTotal.toLocaleString('en-IN')}</strong> records
          </>
        ) : (
          <span>No records found</span>
        )}
      </div>

      {/* Right controls: Page size selector + Page navigation pills */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {showPageSizeSelector && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>Per page:</span>
            <RowsDropdown
              value={pageSize}
              onChange={onPageSizeChange}
              options={pageSizeOptions}
              formatLabel={(sz) => `${sz}`}
              placement="top"
            />
          </div>
        )}

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--glass-bg, rgba(255,255,255,0.75))',
            padding: '3px 4px',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid var(--glass-border, rgba(0,0,0,0.08))'
          }}
        >
          {totalPages > 2 && (
            <button
              type="button"
              className="btn-secondary"
              style={{
                padding: '5px 8px',
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safePage <= 1 ? 0.35 : 1
              }}
              disabled={safePage <= 1}
              onClick={handleFirst}
              title="First Page"
            >
              <ChevronsLeft size={14} />
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
              opacity: safePage <= 1 ? 0.35 : 1
            }}
            disabled={safePage <= 1}
            onClick={handlePrev}
            title="Previous Page"
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <span
            style={{
              background: 'var(--primary-color)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '14px',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 2px 6px var(--primary-border)',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap'
            }}
          >
            Page {safePage} of {totalPages}
          </span>

          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: safePage >= totalPages ? 0.35 : 1
            }}
            disabled={safePage >= totalPages}
            onClick={handleNext}
            title="Next Page"
          >
            Next <ChevronRight size={14} />
          </button>

          {totalPages > 2 && (
            <button
              type="button"
              className="btn-secondary"
              style={{
                padding: '5px 8px',
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: safePage >= totalPages ? 0.35 : 1
              }}
              disabled={safePage >= totalPages}
              onClick={handleLast}
              title="Last Page"
            >
              <ChevronsRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandardPagination;
