import React, { useState } from 'react';
import { 
  AcademicCapIcon, CurrencyDollarIcon, ClipboardDocumentListIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { MatriculasTab } from './tabs/MatriculasTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { PlansTab } from './tabs/PlansTab';

const TABS = [
  { id: 'matriculas', label: 'Matrículas', icon: AcademicCapIcon, color: 'var(--color-primary-600)' },
  { id: 'payments', label: 'Pagos', icon: CurrencyDollarIcon, color: 'var(--color-success-500)' },
  { id: 'plans', label: 'Planes', icon: ClipboardDocumentListIcon, color: 'var(--color-warning-600)' },
];

export const EnrollmentPage: React.FC = () => {
  const { can } = useAuth();
  const [tab, setTab] = useState('matriculas');

  const visibleTabs = TABS.filter((t) => t.id !== 'plans' || can('payments.manage'));

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCardIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
            <h1 className="page-title">Matrículas y Pagos</h1>
          </div>
          <p className="page-subtitle">Gestión de inscripciones, planes de pago y cuotas</p>
        </div>
      </div>

      {/* Tabs modernos */}
      <div style={{
        display: 'inline-flex', 
        gap: 4, 
        marginBottom: 24,
        background: 'var(--color-neutral-100)', 
        padding: 4, 
        borderRadius: 12,
        flexWrap: 'wrap'
      }}>
        {visibleTabs.map((t) => {
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

      {tab === 'matriculas' && <MatriculasTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'plans' && <PlansTab />}
    </div>
  );
};