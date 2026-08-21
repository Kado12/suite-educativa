import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon, AcademicCapIcon, CalendarDaysIcon, DocumentChartBarIcon,
  ArrowRightIcon, CurrencyDollarIcon, ShieldCheckIcon, CheckCircleIcon,
  ExclamationTriangleIcon, ClockIcon, BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { Card } from '@suite/ui';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '@suite/shared';
import { dashboardService } from '../api/dashboard.service';

interface Stat {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  bgColor: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getOverview()
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !overview) {
    return <Card style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>Cargando...</Card>;
  }

  const m = overview.metrics;

  const stats: Stat[] = [
    { title: 'Alumnos', value: m.students, subtitle: 'Registrados', icon: UserGroupIcon, color: 'var(--color-primary-600)', bgColor: 'var(--color-primary-50)' },
    { title: 'Docentes', value: m.teachers, subtitle: 'Con perfil', icon: AcademicCapIcon, color: 'var(--color-info-500)', bgColor: 'var(--color-info-50)' },
    { title: 'Matrículas activas', value: m.enrollments, subtitle: `de ${m.sections} secciones`, icon: AcademicCapIcon, color: 'var(--color-success-500)', bgColor: 'var(--color-success-50)' },
    { title: 'Clases hoy', value: `${m.todayAttendance}/${m.todaySessions}`, subtitle: 'Marcadas/programadas', icon: CalendarDaysIcon, color: 'var(--color-accent-500)', bgColor: 'var(--color-warning-50)' },
    { title: 'Ingresos del mes', value: `S/ ${m.paidThisMonth.toFixed(2)}`, subtitle: 'Pagos registrados', icon: CurrencyDollarIcon, color: 'var(--color-success-700)', bgColor: 'var(--color-success-50)' },
    { title: 'Cuotas vencidas', value: m.overduePayments, subtitle: `${m.pendingPayments} pendientes`, icon: ExclamationTriangleIcon, color: 'var(--color-danger-500)', bgColor: 'var(--color-danger-50)' },
  ];

  const actions = [
    { title: 'Registrar asistencia', desc: 'Marcar asistencia diaria', path: '/attendance', icon: CheckCircleIcon, color: 'var(--color-success-500)' },
    { title: 'Nueva matrícula', desc: 'Inscribir alumno', path: '/enrollment', icon: AcademicCapIcon, color: 'var(--color-primary-500)' },
    { title: 'Reportes', desc: 'Consolidados + Excel', path: '/reports', icon: DocumentChartBarIcon, color: 'var(--color-info-500)' },
    { title: 'Generar horarios', desc: 'Asignación automática', path: '/scheduling', icon: CalendarDaysIcon, color: 'var(--color-accent-500)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hola, {user?.firstName} 👋</h1>
          <p className="page-subtitle">
            Bienvenido · <span className="badge badge-primary">{ROLE_LABELS[user!.role]}</span>
          </p>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i} className="p-5" style={{ transition: 'transform 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12, background: s.bgColor, color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <s.icon style={{ width: 22, height: 22 }} />
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', marginBottom: 2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>{s.title}</div>
            {s.subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>{s.subtitle}</div>}
          </Card>
        ))}
      </div>

      {/* ACCESOS RÁPIDOS */}
      <Card style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title">Accesos rápidos</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {actions.map((a, i) => (
            <button key={i} onClick={() => nav(a.path)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 16,
              background: 'var(--color-neutral-50)', border: '1px solid var(--color-neutral-200)',
              borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: `${a.color}15`, color: a.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <a.icon style={{ width: 20, height: 20 }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>{a.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{a.desc}</div>
              </div>
              <ArrowRightIcon style={{ width: 16, height: 16, color: 'var(--color-neutral-400)' }} />
            </button>
          ))}
        </div>
      </Card>

      {/* ACTIVIDAD RECIENTE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Validaciones recientes */}
        <Card>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheckIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
              Validaciones recientes
            </h3>
          </div>
          {overview.recentValidations.length === 0 ? (
            <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 16 }}>Sin validaciones aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overview.recentValidations.map((v: any) => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                  background: v.status === 'VALIDATED' ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                  borderRadius: 8,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: v.status === 'VALIDATED' ? 'var(--color-success-500)' : 'var(--color-warning-500)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {v.status === 'VALIDATED' ? <CheckCircleIcon style={{ width: 18, height: 18 }} /> : <ExclamationTriangleIcon style={{ width: 18, height: 18 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>{v.teacher}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Semana {v.week}{v.comment ? ` · ${v.comment}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Matrículas recientes */}
        <Card>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserGroupIcon style={{ width: 20, height: 20, color: 'var(--color-success-500)' }} />
              Matrículas recientes
            </h3>
          </div>
          {overview.recentEnrollments.length === 0 ? (
            <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 16 }}>Sin matrículas aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overview.recentEnrollments.map((e: any) => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                  background: 'var(--color-neutral-50)', borderRadius: 8,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BuildingOffice2Icon style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>{e.student}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                      {e.section} · {e.sede}
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                    <ClockIcon style={{ width: 12, height: 12, display: 'inline' }} /> {new Date(e.enrolledAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};