import React, { useRef, useState } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ===== BUTTON =====
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  loadingText,
  icon,
  children, 
  className = '', 
  ...rest 
}) => (
  <button
    className={`btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${className}`}
    disabled={isLoading || rest.disabled}
    {...rest}
  >
    {isLoading ? (
      <>
        <span className="btn-spinner" />
        <span>{loadingText || 'Cargando...'}</span>
      </>
    ) : (
      <>
        {icon && <span className="btn-icon-wrapper">{icon}</span>}
        {children}
      </>
    )}
  </button>
);

// ===== CARD =====
export const Card: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { elevated?: boolean }
> = ({ children, className = '', elevated, ...rest }) => (
  <div className={`card ${elevated ? 'card-elevated' : ''} ${className}`} {...rest}>
    {children}
  </div>
);

// ===== INPUT =====
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  hint,
  icon,
  rightIcon,
  className = '', 
  ...rest 
}) => (
  <div className="input-wrapper">
    {label && <label className="input-label">{label}</label>}
    <div className={`input-container ${error ? 'input-error' : ''}`}>
      {icon && <span className="input-icon input-icon-left">{icon}</span>}
      <input 
        className={`input ${icon ? 'input-with-left-icon' : ''} ${rightIcon ? 'input-with-right-icon' : ''} ${className}`} 
        {...rest} 
      />
      {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
    </div>
    {error && <span className="input-hint">{error}</span>}
    {hint && !error && <span className="input-hint-neutral">{hint}</span>}
  </div>
);

// ===== SELECT =====
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: SelectOption[]; hint?: string }
> = ({ label, error, hint, options, className = '', ...rest }) => (
  <div className="input-wrapper">
    {label && <label className="input-label">{label}</label>}
    <div className={`select-wrapper ${error ? 'select-error' : ''}`}>
      <select className={`select ${className}`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="select-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
    {error && <span className="input-hint">{error}</span>}
    {hint && !error && <span className="input-hint-neutral">{hint}</span>}
  </div>
);

// ===== BADGE =====
export const Badge: React.FC<{ children: React.ReactNode; color?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral' }> = ({ children, color = 'neutral' }) => (
  <span className={`badge badge-${color}`}>{children}</span>
);

// ===== AVATAR =====
export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const initials = name.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
};

// ===== MODAL =====
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// ===== CONFIRM MODAL =====
export const ConfirmModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; isLoading?: boolean }> = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p style={{ color: 'var(--color-neutral-600)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-line' }}>{message}</p>
    <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: 'none' }}>
      <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>Confirmar</Button>
    </div>
  </Modal>
);

// ===== FILE INPUT CON DRAG & DROP =====


export interface FileInputProps {
  label?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  value?: File | null;
  error?: string;
  hint?: string;
  maxSizeMB?: number;
}

export const FileInput: React.FC<FileInputProps> = ({
  label,
  accept,
  onChange,
  value,
  error,
  hint,
  maxSizeMB = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        onChange(null);
        return;
      }
      onChange(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > maxSizeMB * 1024 * 1024) {
      onChange(null);
      return;
    }
    onChange(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <div
        className={`file-input ${isDragging ? 'file-input-dragging' : ''} ${value ? 'file-input-has-file' : ''} ${error ? 'file-input-error' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {value ? (
          <div className="file-input-content">
            <DocumentIcon className="file-input-icon" />
            <div className="file-input-info">
              <div className="file-input-name">{value.name}</div>
              <div className="file-input-size">{formatFileSize(value.size)}</div>
            </div>
            <button
              type="button"
              className="file-input-remove"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              <XMarkIcon />
            </button>
          </div>
        ) : (
          <div className="file-input-content">
            <CloudArrowUpIcon className="file-input-icon" />
            <div className="file-input-text">
              <span className="file-input-text-primary">
                {isDragging ? 'Suelta el archivo aquí' : 'Haz clic o arrastra un archivo'}
              </span>
              <span className="file-input-text-secondary">
                {accept ? `Formatos: ${accept}` : 'Cualquier formato'} · Máx {maxSizeMB}MB
              </span>
            </div>
          </div>
        )}
      </div>
      {error && <span className="input-hint">{error}</span>}
      {hint && !error && <span className="input-hint-neutral">{hint}</span>}
    </div>
  );
};

export { SearchableSelect } from './SearchableSelect';
export type { SearchableOption, SearchableSelectProps } from './SearchableSelect';
export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';