import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, UserGroupIcon, BookOpenIcon, CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { SedesTab } from './tabs/SedesTab';
import { SeccionesTab } from './tabs/SeccionesTab';
import { AreasTab } from './tabs/AreasTab';
import { PeriodsTab } from './tabs/PeriodsTab';

const TABS = [
  { id: 'sedes', label: 'Sedes y Salones', icon: BuildingOfficeIcon, description: 'Estructura física de la institución', color: 'var(--color-primary-600)' },
  { id: 'secciones', label: 'Turnos y Secciones', icon: UserGroupIcon, description: 'Organización horaria y grupos', color: 'var(--color-success-500)' },
  { id: 'areas', label: 'Áreas y Cursos', icon: BookOpenIcon, description: 'Contenido académico y materias', color: 'var(--color-warning-600)' },
  { id: 'periods', label: 'Períodos y Bloques', icon: CalendarDaysIcon, description: 'Calendario académico', color: 'var(--color-extra-500)' },
];

export const AcademicPage: React.FC = () => {
  const [tab, setTab] = useState('sedes');
  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AcademicCapIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
            <h1 className="page-title">Gestión Académica</h1>
          </div>
          <p className="page-subtitle">{activeTab.description}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        </div>
      </div>

      {/* Tabs modernos con colores */}
      <div style={{
        display: 'inline-flex', 
        gap: 4, 
        marginBottom: 24,
        background: 'var(--color-neutral-100)', 
        padding: 4, 
        borderRadius: 12,
        flexWrap: 'wrap'
      }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '10px 20px', 
                borderRadius: 8,
                fontSize: 'var(--text-sm)', 
                fontWeight: 600,
                transition: 'all 0.2s',
                background: isActive ? 'var(--color-neutral-0)' : 'transparent',
                color: isActive ? t.color : 'var(--color-neutral-600)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <t.icon style={{ width: 18, height: 18 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'sedes' && <SedesTab />}
      {tab === 'secciones' && <SeccionesTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'periods' && <PeriodsTab />}
    </div>
  );
};