import React, { useState } from 'react';
import { UserGroupIcon, AcademicCapIcon, UsersIcon } from '@heroicons/react/24/outline';
import { StudentsTab } from './tabs/StudentsTab';
import { TeachersTab } from './tabs/TeachersTab';

const TABS = [
  { id: 'students', label: 'Alumnos', icon: UserGroupIcon, color: 'var(--color-primary-600)' },
  { id: 'teachers', label: 'Docentes', icon: AcademicCapIcon, color: 'var(--color-success-500)' },
];

export const PeoplePage: React.FC = () => {
  const [tab, setTab] = useState('students');

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UsersIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
          <h1 className="page-title">Comunidad</h1>
          </div>
          <p className="page-subtitle">Gestión de alumnos y docentes de la institución</p>
        </div>
      </div>

      {/* Tabs modernos con iconos y colores */}
      <div style={{
        display: 'inline-flex', 
        gap: 4, 
        marginBottom: 24,
        background: 'var(--color-neutral-100)', 
        padding: 4, 
        borderRadius: 12,
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

      {tab === 'students' && <StudentsTab />}
      {tab === 'teachers' && <TeachersTab />}
    </div>
  );
};