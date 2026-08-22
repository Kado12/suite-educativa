import React, { useState } from 'react';
import { UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { StudentsTab } from './tabs/StudentsTab';
import { TeachersTab } from './tabs/TeachersTab';

const TABS = [
  { id: 'students', label: 'Alumnos', icon: UserGroupIcon },
  { id: 'teachers', label: 'Docentes', icon: AcademicCapIcon },
];

export const PeoplePage: React.FC = () => {
  const [tab, setTab] = useState('students');
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Personas</h1>
          <p className="page-subtitle">Alumnos y docentes de la institución</p>
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
      {tab === 'students' && <StudentsTab />}
      {tab === 'teachers' && <TeachersTab />}
    </div>
  );
};