import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface SearchableOption {
  value: string;
  label: string;
  hint?: string;
}

export interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label, value, onChange, options, placeholder = 'Buscar...', required, error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.hint || '').toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: SearchableOption) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div style={{ position: 'relative', minWidth: '200px' }} ref={containerRef}>
      {label && <label className="input-label">{label}{required && ' *'}</label>}
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={`select`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', width: '100%', cursor: 'pointer' }}
      >
        <span style={{ color: selected ? 'var(--color-neutral-900)' : 'var(--color-neutral-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon style={{ width: 16, height: 16, color: 'var(--color-neutral-400)', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--color-neutral-0)', border: '1px solid var(--color-neutral-200)',
          borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 40, overflow: 'hidden',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--color-neutral-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MagnifyingGlassIcon style={{ width: 16, height: 16, color: 'var(--color-neutral-400)' }} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 'var(--text-sm)', background: 'transparent' }}
            />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>
                Sin resultados
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', textAlign: 'left', cursor: 'pointer',
                    background: opt.value === value ? 'var(--color-primary-50)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = 'var(--color-neutral-50)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? 'var(--color-primary-50)' : 'transparent'; }}
                >
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)' }}>
                    {opt.label}
                    {opt.hint && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>{opt.hint}</span>}
                  </span>
                  {opt.value === value && <CheckIcon style={{ width: 16, height: 16, color: 'var(--color-primary-600)' }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && <span className="input-hint">{error}</span>}
    </div>
  );
};