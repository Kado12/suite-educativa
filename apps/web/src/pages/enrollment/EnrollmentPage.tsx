import React, { useState } from 'react';
import { AcademicCapIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { MatriculasTab } from './tabs/MatriculasTab';
import { PaymentsTab } from './tabs/PaymentsPage';
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {visibleTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}>
            <t.icon style={{ width: 16, height: 16 }} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'matriculas' && <MatriculasTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'plans' && <PlansTab />}
    </div>
  );
};