import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '@suite/shared';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  color: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const nav = useNavigate();

  const actions: QuickAction[] = [
    {
      title: 'Personas',
      description: 'Alumnos, docentes y personal administrativo',
      icon: UserGroupIcon,
      path: '/people',
      color: 'var(--color-primary-500)',
    },
    {
      title: 'Matrículas',
      description: 'Inscripciones, planes de pago y cuotas',
      icon: AcademicCapIcon,
      path: '/enrollment',
      color: 'var(--color-success-500)',
    },
    {
      title: 'Horarios',
      description: 'Generación y gestión de horarios docentes',
      icon: CalendarDaysIcon,
      path: '/scheduling',
      color: 'var(--color-accent-500)',
    },
    {
      title: 'Reportes',
      description: 'Consolidados y exportación de datos',
      icon: DocumentChartBarIcon,
      path: '/reports',
      color: 'var(--color-info-500)',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hola, {user?.firstName} 👋</h1>
          <p className="page-subtitle">
            Bienvenido a tu panel · <span className="badge badge-primary">{ROLE_LABELS[user!.role]}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {actions.map((a) => (
          <button
            key={a.path}
            onClick={() => nav(a.path)}
            className="card card-elevated text-left group transition hover:-translate-y-1"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${a.color}15`, color: a.color }}
            >
              <a.icon style={{ width: 24, height: 24 }} />
            </div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              {a.title}
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 12 }}>
              {a.description}
            </p>
            <div
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: a.color }}
            >
              Acceder
              <ArrowRightIcon className="w-4 h-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Estado del sistema</h3>
          <p className="card-subtitle">Resumen general de la plataforma</p>
        </div>
        <p style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>
          Esta es la Fase 1. En las próximas fases agregaremos aquí métricas en tiempo real,
          gráficos de asistencia, progreso de matrículas y actividad reciente.
        </p>
      </div>
    </div>
  );
};