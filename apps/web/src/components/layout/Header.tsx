import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar }) => {
  const { user } = useAuth();
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="header-toggle" onClick={onToggleSidebar} title="Alternar menú">
          <Bars3Icon />
        </button>
        {title && <h1 className="header-title">{title}</h1>}
      </div>

      <div className="header-right">
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