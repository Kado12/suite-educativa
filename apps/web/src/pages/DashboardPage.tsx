import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon, CurrencyDollarIcon, ExclamationTriangleIcon,
  ArrowDownTrayIcon, ChartBarIcon, BuildingOffice2Icon, ClockIcon, CalendarDaysIcon,
  CreditCardIcon, UserCircleIcon, SparklesIcon, ArrowTrendingUpIcon,
  DocumentChartBarIcon, HomeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from 'recharts';
import { Card, Button, Select, Badge } from '@suite/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLE_LABELS } from '@suite/shared';
import { dashboardService } from '../api/dashboard.service';
import { academicService } from '../api/academic.service';
import { useChartTheme } from '../hooks/useChartTheme';

const ChartCard: React.FC<{
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
  span?: boolean
}> = ({ icon: Icon, title, subtitle, color, children, span }) => (
  <Card style={{ gridColumn: span ? '1 / -1' : undefined }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: '1px solid var(--color-neutral-100)'
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${color}15`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon style={{ width: 22, height: 22 }} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
          {title}
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
          {subtitle}
        </p>
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

  const chart = useChartTheme();

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
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [periodId, sedeId]);

  const handleExport = async () => {
    try {
      await dashboardService.exportStats();
      success('📥 Estadísticas exportadas');
    } catch {
      error('Error al exportar');
    }
  };

  const selectedPeriod = periods.find(p => p.id === periodId);
  const selectedSede = sedes.find(s => s.id === sedeId);

  if (loading || !overview || !charts) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Panel de control</h1>
            <p className="page-subtitle">Cargando estadísticas...</p>
          </div>
        </div>
        <Card>
          <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-neutral-400)' }}>
            <div style={{
              width: 48,
              height: 48,
              margin: '0 auto 16px',
              border: '3px solid var(--color-neutral-200)',
              borderTopColor: 'var(--color-primary-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              Cargando dashboard
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              Estamos preparando tus estadísticas...
            </div>
          </div>
        </Card>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const m = overview.metrics;
  const stats = [
    {
      title: 'Alumnos matriculados',
      value: m.enrollments,
      icon: AcademicCapIcon,
      color: 'var(--color-primary-600)',
      bgGradient: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-200) 100%)',
      hint: 'Total en el período'
    },
    {
      title: 'Docentes activos',
      value: m.teachers,
      icon: UserCircleIcon,
      color: 'var(--color-danger-600)',
      bgGradient: 'linear-gradient(135deg, var(--color-danger-50) 0%, var(--color-danger-200) 100%)',
      hint: 'Personal docente'
    },
    {
      title: 'Ingresos totales',
      value: `S/ ${m.totalPaid.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'var(--color-success-500)',
      bgGradient: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-200) 100%)',
      hint: 'Recaudado'
    },
    {
      title: 'Pagos pendientes',
      value: m.pendingPayments,
      icon: ExclamationTriangleIcon,
      color: 'var(--color-warning-600)',
      bgGradient: 'linear-gradient(135deg, var(--color-warning-50) 0%, var(--color-warning-200) 100%)',
      hint: 'Cuotas por cobrar'
    },
    {
      title: 'Clases hoy',
      value: `${m.todayAttendance}/${m.todaySessions}`,
      icon: ClockIcon,
      color: 'var(--color-extra-600)',
      bgGradient: 'linear-gradient(135deg, var(--color-extra-50) 0%, var(--color-extra-200) 100%)',
      hint: 'Asistidas vs programadas'
    },
  ];

  const PIE_COLORS = ['#0E7DC2', '#FFC621', '#D7263D', '#12A150', '#EF8B2C', '#2492CD'];

  const attendancePct = m.todaySessions > 0
    ? Math.round((m.todayAttendance / m.todaySessions) * 100)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de control</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HomeIcon style={{ width: 16, height: 16, color: 'var(--color-primary-600)' }} />
            Bienvenido, <strong>{user?.firstName}</strong> · <Badge color="primary">{ROLE_LABELS[user!.role]}</Badge>
          </p>
        </div>
        <Button
          variant="success"
          onClick={handleExport}
          icon={<ArrowDownTrayIcon />}
        >
          Exportar estadísticas
        </Button>
      </div>

      {/* Card de bienvenida */}
      <Card style={{
        marginBottom: 20,
        background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-info-50) 100%)',
        border: '1px solid var(--color-primary-200)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'var(--color-primary-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <SparklesIcon style={{ width: 28, height: 28, color: 'var(--color-primary-600)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--color-primary-900)' }}>
              Resumen general de la institución
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-700)', margin: '4px 0 0' }}>
              Visualiza las métricas clave del período actual. Puedes filtrar por período y sede.
            </p>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--color-neutral-100)',
            color: 'var(--color-neutral-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FunnelIcon style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Filtros
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              {selectedPeriod ? selectedPeriod.name : 'Período activo'}
              {selectedSede && ` · ${selectedSede.name}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Select
            label="Período académico"
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            options={periods.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select
            label="Sede (asistencia)"
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
            options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]}
          />
        </div>
      </Card>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        {stats.map((s, i) => (
          <Card
            key={i}
            style={{
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {/* Barra superior de color */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: s.color,
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: s.bgGradient,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <s.icon style={{ width: 24, height: 24 }} />
              </div>
            </div>

            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-neutral-500)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6
            }}>
              {s.title}
            </div>

            <div style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 700,
              color: 'var(--color-neutral-900)',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              {s.value}
            </div>

            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-neutral-400)',
              marginTop: 8
            }}>
              {s.hint}
            </div>
          </Card>
        ))}
      </div>

      {/* Barra de asistencia del día */}
      {m.todaySessions > 0 && (
        <Card style={{ marginBottom: 20, background: 'var(--color-neutral-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <ArrowTrendingUpIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
              Progreso de asistencia de hoy
            </span>
            <Badge color={attendancePct >= 90 ? 'success' : attendancePct >= 70 ? 'warning' : 'danger'}>
              {attendancePct}%
            </Badge>
          </div>
          <div style={{
            height: 8,
            background: 'var(--color-neutral-200)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${attendancePct}%`,
              background: attendancePct >= 90
                ? 'var(--color-success-500)'
                : attendancePct >= 70
                  ? 'var(--color-warning-500)'
                  : 'var(--color-danger-500)',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-neutral-500)'
          }}>
            <span>{m.todayAttendance} clases asistidas</span>
            <span>{m.todaySessions - m.todayAttendance} pendientes</span>
          </div>
        </Card>
      )}

      {/* Gráficos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        marginBottom: 16
      }}>
        <ChartCard
          icon={CalendarDaysIcon}
          title="Inscritos por mes"
          subtitle="Matrículas registradas en el período"
          color={chart.colors.primary}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.enrollmentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <Tooltip
                contentStyle={chart.tooltipStyle}
                labelStyle={chart.tooltipLabelStyle}
                cursor={{ fill: chart.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" name="Inscritos" fill={chart.colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          icon={CreditCardIcon}
          title="Cobranza"
          subtitle="Cobrado vs pendiente vs vencido (S/)"
          color={chart.colors.success}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={charts.paymentsDonut}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                stroke={chart.isDark ? '#1f2937' : '#ffffff'}
              >
                {charts.paymentsDonut.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                formatter={(v: any) => `S/ ${Number(v).toFixed(2)}`}
                contentStyle={chart.tooltipStyle}
                labelStyle={chart.tooltipLabelStyle}
              />
              <Legend wrapperStyle={chart.legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          icon={ChartBarIcon}
          title="Recuento por plan de pago"
          subtitle="Matrículas por plan"
          color={chart.colors.warning}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.byPaymentPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="plan"
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <Tooltip
                contentStyle={chart.tooltipStyle}
                labelStyle={chart.tooltipLabelStyle}
                cursor={{ fill: chart.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" name="Matrículas" fill={chart.colors.warning} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          icon={BuildingOffice2Icon}
          title="Alumnos por sede"
          subtitle="Cantidad y porcentaje"
          color={chart.colors.primary}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={charts.studentsBySede}
                dataKey="count"
                nameKey="sede"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                label={(e: any) => `${e.pct}%`}
                stroke={chart.isDark ? '#1f2937' : '#ffffff'}
              >
                {charts.studentsBySede.map((_: any, i: number) => (
                  <Cell key={i} fill={chart.pieColors[i % chart.pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any, n: any, p: any) => [`${v} (${p?.payload?.pct}%)`, 'Alumnos']}
                contentStyle={chart.tooltipStyle}
                labelStyle={chart.tooltipLabelStyle}
              />
              <Legend wrapperStyle={chart.legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Gráficos de asistencia (fila completa) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        <ChartCard
          icon={ClockIcon}
          title="Asistencia semanal"
          subtitle="% asistencia y total de horas"
          color={chart.colors.success}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={charts.attendanceByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <Tooltip
                contentStyle={chart.tooltipStyle}
                labelStyle={chart.tooltipLabelStyle}
                cursor={{ fill: chart.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Legend wrapperStyle={chart.legendStyle} />
              <Bar yAxisId="right" dataKey="hours" name="Horas" fill={chart.colors.accent} radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="rate"
                name="% Asistencia"
                stroke={chart.colors.success}
                strokeWidth={2}
                dot={{ r: 3, fill: chart.colors.success }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          icon={ClockIcon}
          title="Distribución por turnos"
          subtitle="Matrículas por turno"
          color={chart.colors.danger}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={charts.distributionByTurno}
                dataKey="count"
                nameKey="turno"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                label={(e: any) => `${e.pct}%`}
                stroke={chart.isDark ? '#1f2937' : '#ffffff'}
              >
                {charts.distributionByTurno.map((_: any, i: number) => (
                  <Cell key={i} fill={chart.pieColors[i % chart.pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any, n: any, p: any) => [`${v} (${p?.payload?.pct}%)`, 'Matrículas']}
                contentStyle={chart.tooltipStyle}
                labelStyle={chart.tooltipLabelStyle}
              />
              <Legend wrapperStyle={chart.legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {/* NUEVO: Ocupación detallada por sede */}
        <ChartCard
          icon={BuildingOffice2Icon}
          title="Ocupación por Sede - Sección"
          subtitle="Alumnos, capacidad y porcentaje por sede"
          color={chart.colors.primary}
          span
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left',
                    padding: 'var(--space-3)',
                    borderBottom: `2px solid ${chart.grid}`,
                    color: chart.text,
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>Sede</th>
                  <th style={{
                    textAlign: 'center',
                    padding: 'var(--space-3)',
                    borderBottom: `2px solid ${chart.grid}`,
                    color: chart.text,
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>Secciones</th>
                  <th style={{
                    textAlign: 'center',
                    padding: 'var(--space-3)',
                    borderBottom: `2px solid ${chart.grid}`,
                    color: chart.text,
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>Alumnos</th>
                  <th style={{
                    textAlign: 'center',
                    padding: 'var(--space-3)',
                    borderBottom: `2px solid ${chart.grid}`,
                    color: chart.text,
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>Capacidad</th>
                  <th style={{
                    textAlign: 'center',
                    padding: 'var(--space-3)',
                    borderBottom: `2px solid ${chart.grid}`,
                    color: chart.text,
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>% Ocupación</th>
                </tr>
              </thead>
              <tbody>
                {charts.occupancyBySede.map((item: any, idx: number) => {
                  const occupancyColor = item.ocupacion >= 90
                    ? chart.colors.danger
                    : item.ocupacion >= 70
                      ? chart.colors.warning
                      : chart.colors.success;
                  return (
                    <tr key={item.sede} style={{
                      borderBottom: `1px solid ${chart.grid}`,
                      transition: 'background var(--transition-fast)',
                    }}>
                      <td style={{
                        padding: 'var(--space-3)',
                        fontWeight: 600,
                        color: chart.text,
                      }}>{item.sede}</td>
                      <td style={{
                        padding: 'var(--space-3)',
                        textAlign: 'center',
                        color: chart.text,
                      }}>{item.sections}</td>
                      <td style={{
                        padding: 'var(--space-3)',
                        textAlign: 'center',
                        color: chart.text,
                        fontWeight: 600,
                      }}>{item.enrolled}</td>
                      <td style={{
                        padding: 'var(--space-3)',
                        textAlign: 'center',
                        color: chart.text,
                      }}>{item.capacity}</td>
                      <td style={{
                        padding: 'var(--space-3)',
                        textAlign: 'center',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'var(--space-2)',
                        }}>
                          <div style={{
                            width: 60,
                            height: 6,
                            background: chart.grid,
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${item.ocupacion}%`,
                              height: '100%',
                              background: occupancyColor,
                              borderRadius: 3,
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{
                            fontWeight: 700,
                            color: occupancyColor,
                            minWidth: 40,
                            textAlign: 'right',
                          }}>{item.ocupacion}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* NUEVO: Ocupación por turno */}
        <ChartCard
          icon={ClockIcon}
          title="Distribución por Turno - Secciones"
          subtitle="Alumnos y secciones por turno"
          color={chart.colors.accent}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.occupancyByTurno} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
              />
              <YAxis
                type="category"
                dataKey="turno"
                tick={{ fontSize: 11, fill: chart.axisTick }}
                stroke={chart.axisLine}
                width={100}
              />
              <Tooltip
                contentStyle={chart.tooltipStyle}
                labelStyle={chart.tooltipLabelStyle}
                cursor={{ fill: chart.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Legend wrapperStyle={chart.legendStyle} />
              <Bar dataKey="enrolled" name="Alumnos" fill={chart.colors.primary} radius={[0, 4, 4, 0]} />
              <Bar dataKey="sections" name="Secciones" fill={chart.colors.accent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Footer del dashboard */}
      <Card style={{ marginTop: 16, background: 'var(--color-neutral-50)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-neutral-500)'
        }}>
          <span>
            Última actualización: {new Date().toLocaleString()}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <DocumentChartBarIcon style={{ width: 14, height: 14 }} />
            Datos del período {selectedPeriod?.name || 'activo'}
          </span>
        </div>
      </Card>
    </div>
  );
};