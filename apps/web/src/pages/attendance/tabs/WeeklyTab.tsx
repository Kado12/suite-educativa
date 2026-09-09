import React, { useState, useEffect } from 'react';
import { Card, Select, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { attendanceService } from '../../../api/attendance.service';
import { academicService } from '../../../api/academic.service';
import { peopleService } from '../../../api/people.service';
import { 
  CalendarIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
  ExclamationCircleIcon, DocumentChartBarIcon
} from '@heroicons/react/24/outline';

const StatusBadge: React.FC<{ c: any }> = ({ c }) => {
  if (!c.status) return <Badge color="neutral">Sin registrar</Badge>;
  if (c.status === 'ABSENT') return <Badge color="danger">Faltó</Badge>;
  if (c.lateMinutes > 0) return <Badge color="warning">Tardó {c.lateMinutes}'</Badge>;
  return <Badge color="success">Asistió</Badge>;
};

export const WeeklyTab: React.FC = () => {
  const { error } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [week, setWeek] = useState('1');
  const [weekly, setWeekly] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([peopleService.listTeachers(), academicService.listPeriods()]).then(([t, p]) => {
      setTeachers(t); setPeriods(p);
      const current = p.find((x: any) => x.isActive);
      if (current) setPeriodId(current.id);
    });
  }, []);

  useEffect(() => {
    if (teacherId && periodId) {
      attendanceService.getWeekly(teacherId, periodId, parseInt(week))
        .then(setWeekly)
        .catch((err) => { error(err.response?.data?.message || 'Error'); setWeekly(null); });
    }
  }, [teacherId, periodId, week]);

  const selectedPeriod = periods.find((p) => p.id === periodId);
  const selectedTeacher = teachers.find((t) => t.teacherProfile.id === teacherId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Card de filtros */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-100) 100%)',
            color: 'var(--color-success-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <DocumentChartBarIcon style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Vista semanal por docente
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              Selecciona docente, período y semana para ver el detalle
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Select 
            label="Docente" 
            value={teacherId} 
            onChange={(e) => setTeacherId(e.target.value)}
            options={[{ value: '', label: 'Selecciona docente' }, ...teachers.map((t) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }))]} 
          />
          <Select 
            label="Período" 
            value={periodId} 
            onChange={(e) => setPeriodId(e.target.value)}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} 
          />
          <Select 
            label="Semana" 
            value={week} 
            onChange={(e) => setWeek(e.target.value)}
            options={Array.from({ length: selectedPeriod?.weeks || 12 }, (_, i) => ({ value: String(i + 1), label: `Semana ${i + 1}` }))} 
          />
        </div>
      </Card>

      {weekly && (
        <>
          {/* Info del docente */}
          {selectedTeacher && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-success-100) 0%, var(--color-success-200) 100%)',
                  color: 'var(--color-success-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {selectedTeacher.firstName[0]}{selectedTeacher.lastName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                    {selectedTeacher.lastName}, {selectedTeacher.firstName}
                  </h3>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>{selectedTeacher.dni}</span>
                    <span>·</span>
                    <span>Semana {weekly.weekNumber} · {selectedPeriod?.name}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tabla resumen semanal */}
          <Card className="p-0">
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--color-neutral-200)',
              background: 'var(--color-neutral-50)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarIcon style={{ width: 20, height: 20, color: 'var(--color-success-600)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                  Resumen semanal
                </span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    {weekly.days.map((d: any) => (
                      <th key={d.date} style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600 }}>{d.dayName}</div>
                        <div style={{ fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                          {d.date.slice(5)}
                        </div>
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', color: 'var(--color-warning-700)' }}>
                      <div style={{ fontWeight: 600 }}>Tardanzas</div>
                      <div style={{ fontWeight: 400, fontSize: 'var(--text-xs)' }}>min</div>
                    </th>
                    <th style={{ textAlign: 'center', color: 'var(--color-primary-700)' }}>
                      <div style={{ fontWeight: 600 }}>Total S{weekly.weekNumber}</div>
                      <div style={{ fontWeight: 400, fontSize: 'var(--text-xs)' }}>horas</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {weekly.days.map((d: any) => (
                      <td key={d.date} style={{ textAlign: 'center' }}>
                        {d.classes.length === 0 ? (
                          <span style={{ color: 'var(--color-neutral-300)' }}>—</span>
                        ) : (
                          <Badge 
                            color={d.hours > 0 ? 'success' : d.isFuture ? 'neutral' : 'danger'}
                          >
                            {d.hours > 0 ? d.hours : d.isFuture ? '—' : 'F'}
                          </Badge>
                        )}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      <Badge color="warning">
                        {weekly.totals.lateMinutes}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color="primary">
                        {weekly.totals.hours}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Detalle por día */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarIcon style={{ width: 20, height: 20, color: 'var(--color-success-600)' }} />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                  Detalle de clases · Semana {weekly.weekNumber}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 6, fontSize: 'var(--text-xs)' }}>
                <Badge color="success">Asistió</Badge>
                <Badge color="danger">Faltó</Badge>
                <Badge color="warning">Tardanza</Badge>
                <Badge color="neutral">Sin registrar</Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {weekly.days.map((d: any) => (
                <div 
                  key={d.date} 
                  style={{ 
                    border: `1px solid ${d.absents > 0 ? 'var(--color-danger-300)' : 'var(--color-neutral-200)'}`, 
                    borderRadius: 12, 
                    padding: 16, 
                    background: d.absents > 0 ? 'var(--color-danger-50)' : 'var(--color-neutral-50)' 
                  }}
                >
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: 'var(--text-sm)', 
                    marginBottom: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{d.dayName}</span>
                    <span style={{ color: 'var(--color-neutral-400)', fontWeight: 400, fontSize: 'var(--text-xs)' }}>
                      {d.date.slice(5)}
                    </span>
                  </div>
                  {d.classes.length === 0 ? (
                    <div style={{ 
                      fontSize: 'var(--text-xs)', 
                      color: 'var(--color-neutral-400)',
                      textAlign: 'center',
                      padding: '16px 0'
                    }}>
                      Sin clases programadas
                    </div>
                  ) : (
                    d.classes.map((c: any, idx: number) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          gap: 8, 
                          padding: '10px 0', 
                          borderBottom: idx < d.classes.length - 1 ? '1px dashed var(--color-neutral-200)' : 'none' 
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 2 }}>
                            {c.courseName}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                            {c.sectionName} · {c.sedeName}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>
                            Slot {c.slot}
                          </div>
                        </div>
                        <StatusBadge c={c} />
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Stats totales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Card className="p-4" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ClockIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-700)', fontWeight: 500 }}>Horas dictadas</span>
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                {weekly.totals.hours}
              </div>
            </Card>
            <Card className="p-4" style={{ background: 'var(--color-success-50)', borderColor: 'var(--color-success-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircleIcon style={{ width: 20, height: 20, color: 'var(--color-success-600)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-700)', fontWeight: 500 }}>Asistencias</span>
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>
                {weekly.totals.presents}
              </div>
            </Card>
            <Card className="p-4" style={{ background: 'var(--color-danger-50)', borderColor: 'var(--color-danger-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <XCircleIcon style={{ width: 20, height: 20, color: 'var(--color-danger-600)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-700)', fontWeight: 500 }}>Faltas</span>
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-700)' }}>
                {weekly.totals.absents}
              </div>
            </Card>
            <Card className="p-4" style={{ background: 'var(--color-warning-50)', borderColor: 'var(--color-warning-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ExclamationCircleIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-700)', fontWeight: 500 }}>Min. tardanza</span>
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-warning-700)' }}>
                {weekly.totals.lateMinutes}
              </div>
            </Card>
          </div>
        </>
      )}

      {!weekly && teacherId && (
        <Card>
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <DocumentChartBarIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              Sin datos para esta semana
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              El docente no tiene clases registradas en este período
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};