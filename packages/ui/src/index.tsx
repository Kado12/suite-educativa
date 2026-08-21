import React from 'react';

// ===== BUTTON =====
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', isLoading, children, className = '', ...rest }) => (
  <button
    className={`btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${className}`}
    disabled={isLoading || rest.disabled}
    {...rest}
  >
    {isLoading ? 'Cargando...' : children}
  </button>
);

// ===== CARD =====
export const Card: React.FC<{ children: React.ReactNode; className?: string; elevated?: boolean }> = ({ children, className = '', elevated }) => (
  <div className={`card ${elevated ? 'card-elevated' : ''} ${className}`}>{children}</div>
);

// ===== INPUT =====
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className = '', ...rest }) => (
  <div>
    {label && <label className="input-label">{label}</label>}
    <input className={`input ${error ? 'input-error' : ''} ${className}`} {...rest} />
    {error && <span className="input-hint">{error}</span>}
  </div>
);

// ===== SELECT =====
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }> = ({ label, options, className = '', ...rest }) => (
  <div>
    {label && <label className="input-label">{label}</label>}
    <select className={`select ${className}`} {...rest}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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