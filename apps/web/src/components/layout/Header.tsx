import React, { useState, useRef, useEffect } from 'react';
import { Bars3Icon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  title?: string;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar }) => {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu]);

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: SunIcon },
    { value: 'dark', label: 'Oscuro', icon: MoonIcon },
    { value: 'system', label: 'Sistema', icon: ComputerDesktopIcon },
  ] as const;

  const CurrentThemeIcon = theme === 'system' 
    ? ComputerDesktopIcon 
    : resolvedTheme === 'dark' 
      ? MoonIcon 
      : SunIcon;

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="header-toggle" onClick={onToggleSidebar} title="Alternar menú">
          <Bars3Icon />
        </button>
        {title && <h1 className="header-title">{title}</h1>}
      </div>

      <div className="header-right">
        {/* Toggle de tema */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="header-toggle"
            title="Cambiar tema"
            style={{
              background: showThemeMenu ? 'var(--color-neutral-100)' : 'transparent',
            }}
          >
            <CurrentThemeIcon />
          </button>

          {/* Dropdown de opciones */}
          {showThemeMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: 'var(--color-neutral-0)',
                border: '1px solid var(--color-neutral-200)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--space-1)',
                minWidth: 160,
                zIndex: 50,
              }}
            >
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value);
                      setShowThemeMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'var(--color-primary-50)' : 'transparent',
                      color: isActive ? 'var(--color-primary-700)' : 'var(--color-neutral-700)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isActive ? 'var(--font-medium)' : 'var(--font-normal)',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--color-neutral-50)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                    <span>{option.label}</span>
                    {isActive && (
                      <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Usuario */}
        <div className="header-user">
          <div className="avatar avatar-sm">{initials}</div>
          <span className="header-user-name">
            {user?.firstName} {user?.lastName}
          </span>
        </div>
      </div>
    </header>
  );
};