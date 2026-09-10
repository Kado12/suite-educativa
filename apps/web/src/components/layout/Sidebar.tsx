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
  Cog6ToothIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { hasPermission } from '@suite/shared';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  section?: string;
  permission?: string;
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
  { path: '/settings', label: 'Ajustes', icon: Cog6ToothIcon, section: 'Sistema', permission: 'academic.manage' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user, logout } = useAuth();
  const { settings } = useConfig();
  const nav = useNavigate()

  const institutionName = settings?.['institution.name'] || 'Suite Educativa';

  const visibleMenu = MENU.filter((item) => {
    if (!item.permission) return true;
    return user && hasPermission(user.role as any, item.permission as any);
  });

  const sections = Array.from(new Set(MENU.map((m) => m.section || 'General')));

  const { pendingResetRequests } = useNotifications();
  const canViewResetRequests = user && (user.role === 'ADMIN' || user.role === 'INFORMATICO');

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <AcademicCapIcon />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">{institutionName}</div>
          <div className="sidebar-brand-subtitle">Plataforma Educativa</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => {
          const items = visibleMenu.filter((m) => m.section === section);
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
        {canViewResetRequests && pendingResetRequests > 0 && (
          <button
            onClick={() => nav('/users')}
            style={{
              width: '100%',
              marginBottom: 8,
              padding: '10px 12px',
              background: 'var(--color-danger-50)',
              color: 'var(--color-danger-700)',
              border: '1px solid var(--color-danger-200)',
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-danger-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-danger-50)';
            }}
          >
            <BellAlertIcon style={{ width: 18, height: 18 }} />
            {!collapsed && (
              <>
                <span style={{ flex: 1, textAlign: 'left' }}>Solicitudes</span>
                <span style={{
                  background: 'var(--color-danger-500)',
                  color: 'white',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  minWidth: 20,
                  textAlign: 'center',
                }}>
                  {pendingResetRequests}
                </span>
              </>
            )}
            {collapsed && (
              <span style={{
                background: 'var(--color-danger-500)',
                color: 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 10,
                minWidth: 18,
                textAlign: 'center',
              }}>
                {pendingResetRequests}
              </span>
            )}
          </button>
        )}

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
            background: 'var(--color-danger-600)', color: 'var(--color-danger-100)',
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