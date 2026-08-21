import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  AcademicCapIcon,
  HomeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { APP_NAME } from '@suite/shared';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  section?: string;
}

const MENU: MenuItem[] = [
  { path: '/', label: 'Inicio', icon: HomeIcon, section: 'General' },
  { path: '/people', label: 'Personas', icon: UserGroupIcon, section: 'Académico' },
  { path: '/academic', label: 'Académico', icon: BuildingOfficeIcon, section: 'Académico' },
  { path: '/enrollment', label: 'Matrículas', icon: AcademicCapIcon, section: 'Académico' },
  { path: '/scheduling', label: 'Horarios', icon: CalendarDaysIcon, section: 'Operación' },
  { path: '/attendance', label: 'Asistencia', icon: UserGroupIcon, section: 'Operación' },
  { path: '/reports', label: 'Reportes', icon: DocumentChartBarIcon, section: 'Operación' },
  { path: '/tools', label: 'Herramientas', icon: WrenchScrewdriverIcon, section: 'Sistema' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user, logout } = useAuth();

  const sections = Array.from(new Set(MENU.map((m) => m.section || 'General')));
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <AcademicCapIcon />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">{APP_NAME}</div>
          <div className="sidebar-brand-subtitle">Plataforma Educativa</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => {
          const items = MENU.filter((m) => m.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section} className="sidebar-section">
              <div className="sidebar-section-title">{section}</div>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout}>
          <div className="avatar avatar-md">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="sidebar-user-role">Cerrar sesión</div>
          </div>
          {!collapsed && (
            <ArrowRightOnRectangleIcon style={{ width: 18, height: 18, color: 'var(--color-neutral-400)' }} />
          )}
        </div>
      </div>
    </aside>
  );
};