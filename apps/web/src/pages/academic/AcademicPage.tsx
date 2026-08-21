import React, { useState } from 'react';
import { BuildingOffice2Icon, UserGroupIcon, BookOpenIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { SedesTab } from './tabs/SedesTab';
import { SeccionesTab } from './tabs/SeccionesTab';
import { AreasTab } from './tabs/AreasTab';
import { PeriodsTab } from './tabs/PeriodsTab';

const TABS = [
  { id: 'sedes', label: 'Sedes y Salones', icon: BuildingOffice2Icon },
  { id: 'secciones', label: 'Turnos y Secciones', icon: UserGroupIcon },
  { id: 'areas', label: 'Áreas y Cursos', icon: BookOpenIcon },
  { id: 'periods', label: 'Períodos y Bloques', icon: CalendarDaysIcon },
];

export const AcademicPage: React.FC = () => {
  const [tab, setTab] = useState('sedes');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión Académica</h1>
          <p className="page-subtitle">Administra la estructura de la institución</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
          >
            <t.icon style={{ width: 16, height: 16 }} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sedes' && <SedesTab />}
      {tab === 'secciones' && <SeccionesTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'periods' && <PeriodsTab />}
    </div>
  );
};