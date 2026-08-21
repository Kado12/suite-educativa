import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage, pageSize, totalItems, onPageChange, onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', borderTop: '1px solid var(--color-neutral-200)', flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
        Mostrando <strong>{start}–{end}</strong> de <strong>{totalItems}</strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Anterior"
        >
          <ChevronLeftIcon style={{ width: 16, height: 16 }} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--color-neutral-400)' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={{
                minWidth: 32, height: 32, borderRadius: 8,
                fontSize: 'var(--text-sm)', fontWeight: p === currentPage ? 700 : 500,
                background: p === currentPage ? 'var(--color-primary-600)' : 'transparent',
                color: p === currentPage ? 'white' : 'var(--color-neutral-600)',
                transition: 'all 0.15s',
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Siguiente"
        >
          <ChevronRightIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {onPageSizeChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
          Filas:
          <select
            className="select"
            style={{ width: 'auto', padding: '4px 8px', fontSize: 'var(--text-xs)' }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}
    </div>
  );
};