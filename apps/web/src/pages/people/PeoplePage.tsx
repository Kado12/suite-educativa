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
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}>
            <t.icon style={{ width: 16, height: 16 }} />{t.label}
          </button>
        ))}
      </div>
      {tab === 'students' && <StudentsTab />}
      {tab === 'teachers' && <TeachersTab />}
    </div>
  );
};