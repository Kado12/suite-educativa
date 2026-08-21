import React, { useState, useEffect } from 'react';
import { Card, Select } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { attendanceService } from '../../../api/attendance.service';
import { academicService } from '../../../api/academic.service';
import { peopleService } from '../../../api/people.service';

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
          <Card className="p-0">
            <table className="table">
              <thead>
                <tr>
                  {weekly.days.map((d: any) => (
                    <th key={d.date}>{d.dayName[0]}<br /><span style={{ fontWeight: 400, fontSize: 'var(--text-xs)' }}>{d.date.slice(5)}</span></th>
                  ))}
                  <th style={{ color: 'var(--color-warning-700)' }}>T</th>
                  <th style={{ color: 'var(--color-primary-600)' }}>S{weekly.weekNumber}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {weekly.days.map((d: any) => (
                    <td key={d.date} style={{ textAlign: 'center' }}>
                      {d.records.length === 0 ? <span style={{ color: 'var(--color-neutral-300)' }}>—</span> : (
                        <span className={`badge ${d.hours > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 'var(--text-lg)', padding: '6px 12px' }}>
                          {d.hours > 0 ? d.hours : 'F'}
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