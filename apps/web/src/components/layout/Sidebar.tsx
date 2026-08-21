import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  ShieldCheckIcon,
  ArrowDownOnSquareStackIcon,
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
  { path: '/users', label: 'Usuarios', icon: ShieldCheckIcon, section: 'Sistema' },
  { path: '/imports', label: 'Importar', icon: ArrowDownOnSquareStackIcon, section: 'Sistema' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user, logout } = useAuth();
  const nav = useNavigate()
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';
  const sections = Array.from(new Set(MENU.map((m) => m.section || 'General')));

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

      <div className='sidebar-footer'>
        <div
          onClick={() => nav('/profile')}
          className='sidebar-user'
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-neutral-50)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div className='avatar avatar-md'>
            {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
          </div>
          {!collapsed && (
            <div className='sidebar-user-info'>
              <div className="sidebar-user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', marginTop: 8, padding: '8px 12px',
            background: 'var(--color-danger-500)', color: 'var(--color-danger-600)',
            border: '1px solid var(--color-danger-200)', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {!collapsed && (
            <p>Cerrar sesión</p>
          )}
          <ArrowRightOnRectangleIcon style={{ width: 18, height: 18, color: 'var(--color-neutral-200)' }} />
        </button>
      </div>
    </aside>
  );
};