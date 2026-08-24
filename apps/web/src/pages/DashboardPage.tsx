import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon, AcademicCapIcon, CurrencyDollarIcon, ExclamationTriangleIcon,
  ArrowDownTrayIcon, ChartBarIcon, BuildingOffice2Icon, ClockIcon, CalendarDaysIcon,
  CreditCardIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from 'recharts';
import { Card, Button, Select } from '@suite/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLE_LABELS } from '@suite/shared';
import { dashboardService } from '../api/dashboard.service';
import { academicService } from '../api/academic.service';

const ChartCard: React.FC<{ icon: any; title: string; subtitle: string; color: string; children: React.ReactNode; span?: boolean }> = ({ icon: Icon, title, subtitle, color, children, span }) => (
  <Card style={{ gridColumn: span ? '1 / -1' : undefined }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 20, height: 20 }} />
      </div>
      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: 0 }}>{subtitle}</p>
      </div>
    </div>
    {children}
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([academicService.listPeriods(), academicService.listSedes()]).then(([p, s]) => {
      setPeriods(p); setSedes(s);
      const current = p.find((x: any) => x.isActive);
      if (current) setPeriodId(current.id);
    });
  }, []);

  useEffect(() => {
    if (!periodId) return;
    setLoading(true);
    Promise.all([dashboardService.getOverview(), dashboardService.getCharts(periodId, sedeId || undefined)])
      .then(([o, c]) => { setOverview(o); setCharts(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [periodId, sedeId]);

  const handleExport = async () => {
    try { await dashboardService.exportStats(); success('📥 Estadísticas exportadas'); }
    catch { error('Error al exportar'); }
  };

  if (loading || !overview || !charts) {
    return <Card style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>Cargando dashboard...</Card>;
  }

  const m = overview.metrics;
  const stats = [
    { title: 'Alumnos', value: m.enrollments, icon: AcademicCapIcon, color: '#2492CD' },
    { title: 'Docentes', value: m.teachers, icon: UserCircleIcon, color: '#2492CD' },
    { title: 'Ingresos', value: `S/ ${m.totalPaid.toFixed(2)}`, icon: CurrencyDollarIcon, color: '#0B7A3E' },
    { title: 'Pagos Pendientes', value: m.pendingPayments, icon: ExclamationTriangleIcon, color: '#EF8B2C' },
    { title: 'Clases hoy', value: `${m.todayAttendance}/${m.todaySessions}`, icon: ClockIcon, color: '#9D06D9' },
  ];

  const PIE_COLORS = ['#0E7DC2', '#FFC621', '#D7263D', '#12A150', '#EF8B2C', '#2492CD'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de control</h1>
          <p className="page-subtitle">{user?.firstName} · <span className="badge badge-primary">{ROLE_LABELS[user!.role]}</span></p>
        </div>
        <Button variant="success" onClick={handleExport}><ArrowDownTrayIcon style={{ width: 16, height: 16 }} /> Exportar</Button>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Select label="Período académico" value={periodId} onChange={(e) => setPeriodId(e.target.value)}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Sede (asistencia)" value={sedeId} onChange={(e) => setSedeId(e.target.value)}
            options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} />
        </div>
      </Card>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-around'}}>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon style={{ width: 22, height: 22 }} />
                </div>
                <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-neutral-500)', marginTop: 2 }}>{s.title}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 500, letterSpacing: '-0.02em' }}>{s.value}</div>
              </div>
            </div>  
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <ChartCard icon={CalendarDaysIcon} title="Inscritos por mes" subtitle="Matrículas registradas en el período" color="#0E7DC2">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.enrollmentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip /><Bar dataKey="count" name="Inscritos" fill="#0E7DC2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={CreditCardIcon} title="Cobranza" subtitle="Cobrado vs pendiente vs vencido (S/)" color="#12A150">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={charts.paymentsDonut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {charts.paymentsDonut.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `S/ ${Number(v).toFixed(2)}`} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={ChartBarIcon} title="Recuento por plan de pago" subtitle="Matrículas por plan" color="#EF8B2C">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.byPaymentPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip /><Bar dataKey="count" name="Matrículas" fill="#EF8B2C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={BuildingOffice2Icon} title="Alumnos por sede" subtitle="Cantidad y porcentaje" color="#2492CD">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={charts.studentsBySede} dataKey="count" nameKey="sede" innerRadius={55} outerRadius={85} paddingAngle={3}
                label={(e: any) => `${e.pct}%`}>
                {charts.studentsBySede.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any, p: any) => [`${v} (${p?.payload?.pct}%)`, 'Alumnos']} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={ClockIcon} title="Asistencia semanal" subtitle="% asistencia y total de horas" color="#12A150">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={charts.attendanceByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Bar yAxisId="right" dataKey="hours" name="Horas" fill="#FFC621" radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="rate" name="% Asistencia" stroke="#12A150" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={ClockIcon} title="Distribución por turnos" subtitle="Matrículas por turno" color="#D7263D">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={charts.distributionByTurno} dataKey="count" nameKey="turno" innerRadius={55} outerRadius={85} paddingAngle={3}
                label={(e: any) => `${e.pct}%`}>
                {charts.distributionByTurno.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any, p: any) => [`${v} (${p?.payload?.pct}%)`, 'Matrículas']} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};