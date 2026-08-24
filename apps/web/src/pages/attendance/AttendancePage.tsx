import React, { useState } from 'react';
import { CalendarDaysIcon, DocumentChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { DailyTab } from './tabs/DailyTab';
import { WeeklyTab } from './tabs/WeeklyTab';
import { ValidationTab } from './tabs/ValidationTab';

const TABS = [
  { id: 'daily', label: 'Asistencia diaria', icon: CalendarDaysIcon, description: 'Registro de asistencias diarias' },
  { id: 'weekly', label: 'Vista semanal', icon: DocumentChartBarIcon, description: 'Vista de asistencia semanal por docente' },
  { id: 'validation', label: 'Validación', icon: ShieldCheckIcon, description: 'Validación de asitencias' },
];

export const AttendancePage: React.FC = () => {
  const [tab, setTab] = useState('daily');

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asistencia Docente</h1>
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

      {tab === 'daily' && <DailyTab />}
      {tab === 'weekly' && <WeeklyTab />}
      {tab === 'validation' && <ValidationTab />}
    </div>
  );
};