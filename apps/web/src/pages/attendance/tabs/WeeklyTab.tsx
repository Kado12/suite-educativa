import React, { useState, useEffect } from 'react';
import { Card, Select } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { attendanceService } from '../../../api/attendance.service';
import { academicService } from '../../../api/academic.service';
import { peopleService } from '../../../api/people.service';

const StatusBadge: React.FC<{ c: any }> = ({ c }) => {
  if (!c.status) return <span className="badge badge-neutral">Sin registrar</span>;
  if (c.status === 'ABSENT') return <span className="badge badge-danger">Faltó</span>;
  if (c.lateMinutes > 0) return <span className="badge badge-warning">Tardó {c.lateMinutes}'</span>;
  return <span className="badge badge-success">Asistió</span>;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select label="Docente" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={{ minWidth: 220 }}
            options={[{ value: '', label: 'Selecciona docente' }, ...teachers.map((t) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }))]} />
          <Select label="Período" value={periodId} onChange={(e) => setPeriodId(e.target.value)} style={{ minWidth: 160 }}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Semana" value={week} onChange={(e) => setWeek(e.target.value)} style={{ minWidth: 140 }}
            options={Array.from({ length: selectedPeriod?.weeks || 12 }, (_, i) => ({ value: String(i + 1), label: `Semana ${i + 1}` }))} />
        </div>
      </Card>

      {weekly && (
        <>
          {/* Tabla resumen */}
          <Card className="p-0">
            <table className="table">
              <thead>
                <tr>
                  {weekly.days.map((d: any) => (
                    <th key={d.date}>{d.dayName}<br /><span style={{ fontWeight: 400, fontSize: 'var(--text-xs)' }}>{d.date.slice(5)}</span></th>
                  ))}
                  <th style={{ color: 'var(--color-warning-700)' }}>T</th>
                  <th style={{ color: 'var(--color-primary-600)' }}>S{weekly.weekNumber}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {weekly.days.map((d: any) => (
                    <td key={d.date} style={{ textAlign: 'center' }}>
                      {d.classes.length === 0 ? <span style={{ color: 'var(--color-neutral-300)' }}>—</span> : (
                        <span className={`badge ${d.hours > 0 ? 'badge-success' : d.isFuture ? 'badge-neutral' : 'badge-danger'}`} style={{ fontSize: 'var(--text-lg)', padding: '6px 12px' }}>
                          {d.hours > 0 ? d.hours : d.isFuture ? '—' : 'F'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}><span className="badge badge-warning" style={{ fontSize: 'var(--text-lg)', padding: '6px 12px' }}>{weekly.totals.lateMinutes}</span></td>
                  <td style={{ textAlign: 'center' }}><span className="badge badge-primary" style={{ fontSize: 'var(--text-lg)', padding: '6px 12px' }}>{weekly.totals.hours}</span></td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Detalle de clases por día */}
          <Card>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Detalle de clases · Semana {weekly.weekNumber}</h3>
              <div style={{ display: 'flex', gap: 6, fontSize: 'var(--text-xs)' }}>
                <span className="badge badge-success">Asistió</span>
                <span className="badge badge-danger">Faltó</span>
                <span className="badge badge-warning">Tardanza</span>
                <span className="badge badge-neutral">Sin registrar</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
              {weekly.days.map((d: any) => (
                <div key={d.date} style={{ border: '1px solid var(--color-neutral-200)', borderRadius: 10, padding: 10, background: d.absents > 0 ? 'var(--color-danger-50)' : 'var(--color-neutral-50)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 8 }}>
                    {d.dayName} <span style={{ color: 'var(--color-neutral-400)', fontWeight: 400 }}>{d.date.slice(5)}</span>
                  </div>
                  {d.classes.length === 0 ? (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>Sin clases</div>
                  ) : (
                    d.classes.map((c: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: '1px dashed var(--color-neutral-200)' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{c.courseName}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{c.sectionName} · {c.sedeName} · Slot {c.slot}</div>
                        </div>
                        <StatusBadge c={c} />
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Totales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-600)' }}>{weekly.totals.hours}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Horas dictadas</div></Card>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-500)' }}>{weekly.totals.presents}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Asistencias</div></Card>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-500)' }}>{weekly.totals.absents}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Faltas</div></Card>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-warning-500)' }}>{weekly.totals.lateMinutes}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Min. tardanza</div></Card>
          </div>
        </>
      )}
    </div>
  );
};