import React, { useState } from 'react';
import { CalendarDaysIcon, DocumentChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { DailyTab } from './tabs/DailyTab';
import { WeeklyTab } from './tabs/WeeklyTab';
import { ValidationTab } from './tabs/ValidationTab';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'daily', label: 'Asistencia diaria', icon: CalendarDaysIcon },
  { id: 'weekly', label: 'Vista semanal', icon: DocumentChartBarIcon },
  { id: 'validation', label: 'Validación', icon: ShieldCheckIcon },
];

export const AttendancePage: React.FC = () => {
  const { can } = useAuth();
  const [tab, setTab] = useState('daily');

  const visibleTabs = TABS.filter((t) => t.id !== 'validation' || can('attendance.validate') || can('attendance.view'));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asistencia Docente</h1>
          <p className="page-subtitle">Registro sobre el horario generado y validación del coordinador</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {visibleTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}>
            <t.icon style={{ width: 16, height: 16 }} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'daily' && <DailyTab />}
      {tab === 'weekly' && <WeeklyTab />}
      {tab === 'validation' && <ValidationTab />}
    </div>
  );
};