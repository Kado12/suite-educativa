import React, { useState } from 'react';
import { AcademicCapIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { MatriculasTab } from './tabs/MatriculasTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { PlansTab } from './tabs/PlansTab';

const TABS = [
  { id: 'matriculas', label: 'Matrículas', icon: AcademicCapIcon },
  { id: 'payments', label: 'Pagos', icon: CurrencyDollarIcon },
  { id: 'plans', label: 'Planes', icon: ClipboardDocumentListIcon },
];

export const EnrollmentPage: React.FC = () => {
  const { can } = useAuth();
  const [tab, setTab] = useState('matriculas');

  // SECRETARIA no puede ver planes (son config), pero ADMIN sí
  const visibleTabs = TABS.filter((t) => t.id !== 'plans' || can('payments.manage'));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Matrículas y Pagos</h1>
          <p className="page-subtitle">Gestión de inscripciones, planes de pago y cuotas</p>
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

      {tab === 'matriculas' && <MatriculasTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'plans' && <PlansTab />}
    </div>
  );
};