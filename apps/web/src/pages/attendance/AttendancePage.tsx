import React, { useState } from 'react';
import { 
  CalendarDaysIcon, DocumentChartBarIcon, ShieldCheckIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { DailyTab } from './tabs/DailyTab';
import { WeeklyTab } from './tabs/WeeklyTab';
import { ValidationTab } from './tabs/ValidationTab';

const TABS = [
  { id: 'daily', label: 'Asistencia diaria', icon: CalendarDaysIcon, description: 'Registro de asistencias diarias', color: 'var(--color-primary-600)' },
  { id: 'weekly', label: 'Vista semanal', icon: DocumentChartBarIcon, description: 'Vista de asistencia semanal por docente', color: 'var(--color-success-700)' },
  { id: 'validation', label: 'Validación', icon: ShieldCheckIcon, description: 'Validación de asistencias', color: 'var(--color-warning-600)' },
];

export const AttendancePage: React.FC = () => {
  const [tab, setTab] = useState('daily');
  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardDocumentCheckIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
            <h1 className="page-title">Asistencia Docente</h1>
          </div>
          <p className="page-subtitle">{activeTab.description}</p>
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

      {tab === 'daily' && <DailyTab />}
      {tab === 'weekly' && <WeeklyTab />}
      {tab === 'validation' && <ValidationTab />}
    </div>
  );
};