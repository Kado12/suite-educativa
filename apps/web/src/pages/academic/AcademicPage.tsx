import React, { useState } from 'react';
import { BuildingOfficeIcon, UserGroupIcon, BookOpenIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { SedesTab } from './tabs/SedesTab';
import { SeccionesTab } from './tabs/SeccionesTab';
import { AreasTab } from './tabs/AreasTab';
import { PeriodsTab } from './tabs/PeriodsTab';

const TABS = [
  { id: 'sedes', label: 'Sedes y Salones', icon: BuildingOfficeIcon, description: 'Estructura física' },
  { id: 'secciones', label: 'Turnos y Secciones', icon: UserGroupIcon, description: 'Organización horaria' },
  { id: 'areas', label: 'Áreas y Cursos', icon: BookOpenIcon, description: 'Contenido académico' },
  { id: 'periods', label: 'Períodos y Bloques', icon: CalendarDaysIcon, description: 'Calendario académico' },
];

export const AcademicPage: React.FC = () => {
  const [tab, setTab] = useState('sedes');
  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión Académica</h1>
          <p className="page-subtitle">{activeTab.description}</p>
        </div>
      </div>

      {/* Tabs estilo segmented control */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'var(--color-neutral-100)', padding: 4, borderRadius: 12,
        border: '1px solid var(--color-neutral-200)',
      }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8,
                fontSize: 'var(--text-sm)', fontWeight: 600,
                transition: 'all 0.15s',
                background: isActive ? 'var(--color-neutral-0)' : 'transparent',
                color: isActive ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
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