import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, SearchableSelect } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { attendanceService } from '../../../api/attendance.service';
import { academicService } from '../../../api/academic.service';
import { peopleService } from '../../../api/people.service';

interface Mark { status: 'PRESENT' | 'ABSENT'; lateMinutes: number; }
interface RowSelection { teacherId: string; courseId: string; }

const todayStr = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};

export const DailyTab: React.FC = () => {
  const { success, error } = useToast();
  const [date, setDate] = useState(todayStr());
  const [sedes, setSedes] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [filterSede, setFilterSede] = useState('');
  const [data, setData] = useState<any | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [rowSel, setRowSel] = useState<Record<string, RowSelection>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    academicService.listSedes().then(setSedes);
    peopleService.listTeachers().then(setTeachers);
    academicService.listAreas().then((areas) => {
      const allCourses = areas.flatMap((a: any) => a.courses.map((c: any) => ({ ...c, areaName: a.name })));
      setCourses(allCourses);
    });
  }, []);

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await attendanceService.getDaily(date, filterSede || undefined);
      setData(res);
      const init: Record<string, Mark> = {};
      const initSel: Record<string, RowSelection> = {};
      for (const c of res.classes) {
        if (c.attendance) init[c.id] = { status: c.attendance.status, lateMinutes: c.attendance.lateMinutes || 0 };
        // Inicializar con el snapshot si existe, sino con los valores actuales
        initSel[c.id] = {
          teacherId: c.teacherProfile?.id || '',
          courseId: c.course?.id || '',
        };
      }
      setMarks(init);
      setRowSel(initSel);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cargar el día');
      setData(null);
    } finally { setLoading(false); }
  }, [date, filterSede]);

  useEffect(() => { load(); }, [load]);

  const setMark = (id: string, mark: Partial<Mark>) => {
    setMarks((prev) => {
      const current = prev[id] || { status: 'PRESENT', lateMinutes: 0 };
      return { ...prev, [id]: { ...current, ...mark } };
    });
  };

  const markAll = () => {
    if (!data) return;
    const next: Record<string, Mark> = { ...marks };
    for (const c of data.classes) if (!next[c.id]) next[c.id] = { status: 'PRESENT', lateMinutes: 0 };
    setMarks(next);
  };

  const handleSave = async () => {
    if (!data) return;
    const records = Object.entries(marks)
      .filter(([id]) => data.classes.some((c: any) => c.id === id))
      .map(([sessionId, m]) => ({
        sessionId,
        status: m.status,
        lateMinutes: m.status === 'PRESENT' ? m.lateMinutes : 0,
        teacherProfileId: rowSel[sessionId]?.teacherId || null,
        courseId: rowSel[sessionId]?.courseId || null,
      }));
    if (records.length === 0) { error('No hay nada que guardar'); return; }
    setSaving(true);
    try {
      const r = await attendanceService.saveDaily(date, records);
      success(`✅ ${r.saved} registros guardados`);
      load();
    } catch (err: any) { error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const markedCount = data ? data.classes.filter((c: any) => marks[c.id]).length : 0;

  const teacherOptions = teachers.map((t: any) => ({
    value: t.teacherProfile.id,
    label: `${t.lastName}, ${t.firstName}`,
  }));

  const courseOptions = courses.map((c: any) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Sede" value={filterSede} onChange={(e) => setFilterSede(e.target.value)} style={{ minWidth: 180 }}
            options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} />
          {data && (
            <div style={{ background: 'var(--color-primary-50)', padding: '8px 12px', borderRadius: 8, fontSize: 'var(--text-sm)', color: 'var(--color-primary-800)' }}>
              📅 {data.dayName} · Semana {data.weekNumber} · {data.blockName}
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={markAll}>✓ Marcar todas</Button>
            <Button variant="success" onClick={handleSave} isLoading={saving}>💾 Guardar ({markedCount}/{data?.classes.length || 0})</Button>
          </div>
        </div>
      </Card>

      {data && data.coverage.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {data.coverage.map((c: any) => (
            <Card key={c.sedeName} className="p-4" style={{ borderColor: c.marked === c.total ? 'var(--color-success-500)' : 'var(--color-warning-500)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{c.sedeName}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{c.marked}/{c.total} marcadas {c.marked !== c.total && '⚠️'}</div>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--color-neutral-400)' }}>Cargando...</p></Card>
      ) : data && data.classes.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--color-neutral-400)' }}>No hay clases programadas para este día.</p></Card>
      ) : data ? (
        <Card className="p-0">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Curso</th>
                  <th>Sección</th>
                  <th>Sede</th>
                  <th>Estado</th>
                  <th>Tardanza (min)</th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map((c: any) => {
                  const m = marks[c.id];
                  const sel = rowSel[c.id];
                  return (
                    <tr key={c.id}>
                      <td style={{ minWidth: 200 }}>
                        <SearchableSelect
                          value={sel?.teacherId || ''}
                          onChange={(v) => setRowSel((p) => ({ ...p, [c.id]: { ...p[c.id], teacherId: v, courseId: p[c.id]?.courseId || c.course?.id || '' } }))}
                          options={teacherOptions}
                          placeholder="Seleccionar docente..."
                        />
                      </td>
                      <td style={{ minWidth: 180 }}>
                        <Select
                          value={sel?.courseId || ''}
                          onChange={(e) => setRowSel((p) => ({ ...p, [c.id]: { teacherId: p[c.id]?.teacherId || c.teacherProfile?.id || '', courseId: e.target.value } }))}
                          options={[{ value: '', label: 'Seleccionar...' }, ...courseOptions]}
                        />
                      </td>
                      <td>{c.section.name}</td>
                      <td>{c.section.classroom.sede.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setMark(c.id, { status: 'PRESENT' })}
                            className={`btn btn-sm ${m?.status === 'PRESENT' ? 'btn-success' : 'btn-ghost'}`}>✓ Asistió</button>
                          <button onClick={() => setMark(c.id, { status: 'ABSENT' })}
                            className={`btn btn-sm ${m?.status === 'ABSENT' ? 'btn-danger' : 'btn-ghost'}`}>F</button>
                        </div>
                      </td>
                      <td>
                        {m?.status === 'PRESENT' && (
                          <input type="number" min={0} value={m.lateMinutes}
                            onChange={(e) => setMark(c.id, { lateMinutes: parseInt(e.target.value) || 0 })}
                            style={{ width: 80 }} className="input" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
};